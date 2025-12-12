import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Hotel, User, Building2, MapPin, Calendar, Moon, DollarSign, Pencil, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'TRY', 'AED'];

interface HotelData {
  id: string;
  hotel_name: string;
  address: string | null;
  city: string | null;
  price_per_night: number;
  companion_price: number | null;
  currency: string;
  amenities: string | null;
  is_active: boolean;
  star_rating: number | null;
  single_room_price: number | null;
  double_room_price: number | null;
  family_room_price: number | null;
}

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  organization_id: string;
  organization?: {
    name: string;
  };
}

interface PatientHotelBooking {
  id: string;
  patient_id: string;
  hotel_id: string | null;
  nights_count: number | null;
  has_companion: boolean | null;
  check_in_date: string | null;
  check_out_date: string | null;
  appointment_date: string;
  patient?: Patient;
  hotel?: HotelData;
}

export default function Hotels() {
  const { profile, isSuperAdmin } = useAuth();
  const [hotels, setHotels] = useState<HotelData[]>([]);
  const [bookings, setBookings] = useState<PatientHotelBooking[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookingSearchQuery, setBookingSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<HotelData | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<PatientHotelBooking | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    hotel_name: '',
    address: '',
    city: '',
    price_per_night: '',
    companion_price: '',
    currency: 'USD',
    amenities: '',
    is_active: true,
    star_rating: '3',
    single_room_price: '',
    double_room_price: '',
    family_room_price: '',
  });

  const [bookingFormData, setBookingFormData] = useState({
    hotel_id: '',
    nights_count: '',
    has_companion: false,
    check_in_date: '',
    check_out_date: '',
  });

  useEffect(() => {
    if (profile) {
      loadHotels();
      loadBookings();
    }
  }, [profile]);

  const loadHotels = async () => {
    if (!profile) return;

    try {
      let query = supabase.from('hotels').select('*').order('hotel_name');

      if (!isSuperAdmin && profile.organization_id) {
        query = query.eq('organization_id', profile.organization_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setHotels(data || []);
    } catch (error) {
      console.error('Error loading hotels:', error);
      toast({
        title: "Error",
        description: "Failed to load hotels",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    if (!profile) return;

    try {
      setBookingsLoading(true);
      let query = supabase
        .from('appointments')
        .select(`
          id,
          patient_id,
          hotel_id,
          nights_count,
          has_companion,
          check_in_date,
          check_out_date,
          appointment_date,
          patient:patients (
            id,
            first_name,
            last_name,
            organization_id,
            organization:organizations (name)
          ),
          hotel:hotels (
            id,
            hotel_name,
            city,
            price_per_night,
            companion_price,
            currency
          )
        `)
        .not('hotel_id', 'is', null)
        .order('appointment_date', { ascending: false });

      if (!isSuperAdmin && profile.organization_id) {
        query = query.eq('organization_id', profile.organization_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setBookings((data || []) as PatientHotelBooking[]);
    } catch (error) {
      console.error('Error loading hotel bookings:', error);
    } finally {
      setBookingsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!profile?.organization_id) {
      toast({
        title: "Error",
        description: "You must be assigned to an organization",
        variant: "destructive",
      });
      return;
    }

    try {
      const hotelData = {
        hotel_name: formData.hotel_name,
        address: formData.address || null,
        city: formData.city || null,
        price_per_night: parseFloat(formData.price_per_night) || 0,
        companion_price: formData.companion_price ? parseFloat(formData.companion_price) : null,
        currency: formData.currency,
        amenities: formData.amenities || null,
        is_active: formData.is_active,
        organization_id: profile.organization_id,
        star_rating: formData.star_rating ? parseInt(formData.star_rating) : 3,
        single_room_price: formData.single_room_price ? parseFloat(formData.single_room_price) : null,
        double_room_price: formData.double_room_price ? parseFloat(formData.double_room_price) : null,
        family_room_price: formData.family_room_price ? parseFloat(formData.family_room_price) : null,
      };

      if (selectedHotel) {
        const { error } = await supabase
          .from('hotels')
          .update(hotelData)
          .eq('id', selectedHotel.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Hotel updated successfully",
        });
      } else {
        const { error } = await supabase.from('hotels').insert([hotelData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Hotel created successfully",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      loadHotels();
    } catch (error) {
      console.error('Error saving hotel:', error);
      toast({
        title: "Error",
        description: "Failed to save hotel",
        variant: "destructive",
      });
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBooking) return;

    try {
      const updateData = {
        hotel_id: bookingFormData.hotel_id || null,
        nights_count: bookingFormData.nights_count ? parseInt(bookingFormData.nights_count) : null,
        has_companion: bookingFormData.has_companion,
        check_in_date: bookingFormData.check_in_date || null,
        check_out_date: bookingFormData.check_out_date || null,
      };

      const { error } = await supabase
        .from('appointments')
        .update(updateData)
        .eq('id', selectedBooking.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Hotel booking updated successfully",
      });

      setIsBookingDialogOpen(false);
      resetBookingForm();
      loadBookings();
    } catch (error) {
      console.error('Error updating hotel booking:', error);
      toast({
        title: "Error",
        description: "Failed to update hotel booking",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      hotel_name: '',
      address: '',
      city: '',
      price_per_night: '',
      companion_price: '',
      currency: 'USD',
      amenities: '',
      is_active: true,
      star_rating: '3',
      single_room_price: '',
      double_room_price: '',
      family_room_price: '',
    });
    setSelectedHotel(null);
  };

  const resetBookingForm = () => {
    setBookingFormData({
      hotel_id: '',
      nights_count: '',
      has_companion: false,
      check_in_date: '',
      check_out_date: '',
    });
    setSelectedBooking(null);
  };

  const handleEdit = (hotel: HotelData) => {
    setSelectedHotel(hotel);
    setFormData({
      hotel_name: hotel.hotel_name,
      address: hotel.address || '',
      city: hotel.city || '',
      price_per_night: hotel.price_per_night.toString(),
      companion_price: hotel.companion_price?.toString() || '',
      currency: hotel.currency,
      amenities: hotel.amenities || '',
      is_active: hotel.is_active,
      star_rating: hotel.star_rating?.toString() || '3',
      single_room_price: hotel.single_room_price?.toString() || '',
      double_room_price: hotel.double_room_price?.toString() || '',
      family_room_price: hotel.family_room_price?.toString() || '',
    });
    setIsDialogOpen(true);
  };

  const handleEditBooking = (booking: PatientHotelBooking) => {
    setSelectedBooking(booking);
    setBookingFormData({
      hotel_id: booking.hotel_id || '',
      nights_count: booking.nights_count?.toString() || '',
      has_companion: booking.has_companion || false,
      check_in_date: booking.check_in_date || '',
      check_out_date: booking.check_out_date || '',
    });
    setIsBookingDialogOpen(true);
  };

  const handleCheckInChange = (date: string) => {
    setBookingFormData(prev => {
      const newData = { ...prev, check_in_date: date };
      if (date && prev.nights_count) {
        const checkIn = new Date(date);
        checkIn.setDate(checkIn.getDate() + parseInt(prev.nights_count));
        newData.check_out_date = checkIn.toISOString().split('T')[0];
      }
      return newData;
    });
  };

  const handleNightsChange = (nights: string) => {
    setBookingFormData(prev => {
      const newData = { ...prev, nights_count: nights };
      if (prev.check_in_date && nights) {
        const checkIn = new Date(prev.check_in_date);
        checkIn.setDate(checkIn.getDate() + parseInt(nights));
        newData.check_out_date = checkIn.toISOString().split('T')[0];
      }
      return newData;
    });
  };

  const calculateTotalCost = (booking: PatientHotelBooking) => {
    if (!booking.hotel || !booking.nights_count) return 0;
    let total = booking.hotel.price_per_night * booking.nights_count;
    if (booking.has_companion && booking.hotel.companion_price) {
      total += booking.hotel.companion_price * booking.nights_count;
    }
    return total;
  };

  const filteredHotels = hotels.filter(hotel =>
    `${hotel.hotel_name} ${hotel.city}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBookings = bookings.filter(booking => {
    const patientName = `${booking.patient?.first_name} ${booking.patient?.last_name}`.toLowerCase();
    const hotelName = booking.hotel?.hotel_name?.toLowerCase() || '';
    const searchLower = bookingSearchQuery.toLowerCase();
    return patientName.includes(searchLower) || hotelName.includes(searchLower);
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Hotels</h1>
            <p className="text-muted-foreground mt-2">Manage accommodation options and patient bookings</p>
          </div>
        </div>

        <Tabs defaultValue="hotels" className="space-y-6">
          <TabsList>
            <TabsTrigger value="hotels">Hotel List</TabsTrigger>
            <TabsTrigger value="bookings">Patient Bookings</TabsTrigger>
          </TabsList>

          {/* Hotels Tab */}
          <TabsContent value="hotels" className="space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search hotels..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Hotel
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{selectedHotel ? 'Edit Hotel' : 'Add New Hotel'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="hotel_name">Hotel Name *</Label>
                      <Input
                        id="hotel_name"
                        value={formData.hotel_name}
                        onChange={(e) => setFormData({ ...formData, hotel_name: e.target.value })}
                        placeholder="e.g., Grand Hotel Istanbul"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Address</Label>
                      <Input
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        placeholder="e.g., Istanbul"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="star_rating">Star Rating</Label>
                        <Select value={formData.star_rating} onValueChange={(value) => setFormData({ ...formData, star_rating: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select rating" />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5].map(rating => (
                              <SelectItem key={rating} value={rating.toString()}>
                                {'⭐'.repeat(rating)} ({rating} Star{rating > 1 ? 's' : ''})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="currency">Currency</Label>
                        <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select currency" />
                          </SelectTrigger>
                          <SelectContent>
                            {CURRENCIES.map(curr => (
                              <SelectItem key={curr} value={curr}>{curr}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Room Prices (per night)</Label>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-1">
                          <Label htmlFor="single_room_price" className="text-xs text-muted-foreground">Single Room</Label>
                          <Input
                            id="single_room_price"
                            type="number"
                            step="0.01"
                            value={formData.single_room_price}
                            onChange={(e) => setFormData({ ...formData, single_room_price: e.target.value })}
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="double_room_price" className="text-xs text-muted-foreground">Double Room</Label>
                          <Input
                            id="double_room_price"
                            type="number"
                            step="0.01"
                            value={formData.double_room_price}
                            onChange={(e) => setFormData({ ...formData, double_room_price: e.target.value })}
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor="family_room_price" className="text-xs text-muted-foreground">Family Room</Label>
                          <Input
                            id="family_room_price"
                            type="number"
                            step="0.01"
                            value={formData.family_room_price}
                            onChange={(e) => setFormData({ ...formData, family_room_price: e.target.value })}
                            placeholder="0.00"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price_per_night">Default Price/Night</Label>
                        <Input
                          id="price_per_night"
                          type="number"
                          step="0.01"
                          value={formData.price_per_night}
                          onChange={(e) => setFormData({ ...formData, price_per_night: e.target.value })}
                          placeholder="Fallback price"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="companion_price">Companion Extra</Label>
                        <Input
                          id="companion_price"
                          type="number"
                          step="0.01"
                          value={formData.companion_price}
                          onChange={(e) => setFormData({ ...formData, companion_price: e.target.value })}
                          placeholder="Additional cost"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amenities">Amenities</Label>
                      <Textarea
                        id="amenities"
                        value={formData.amenities}
                        onChange={(e) => setFormData({ ...formData, amenities: e.target.value })}
                        rows={3}
                        placeholder="e.g., WiFi, Breakfast, Pool, Spa"
                      />
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="is_active"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="rounded"
                      />
                      <Label htmlFor="is_active">Active</Label>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">
                        {selectedHotel ? 'Update' : 'Create'} Hotel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="bg-card rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hotel</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Single</TableHead>
                    <TableHead>Double</TableHead>
                    <TableHead>Family</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8">
                        Loading hotels...
                      </TableCell>
                    </TableRow>
                  ) : filteredHotels.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                        No hotels found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredHotels.map((hotel) => (
                      <TableRow key={hotel.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleEdit(hotel)}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Hotel className="w-4 h-4 text-primary" />
                            <div>
                              <div className="font-medium">{hotel.hotel_name}</div>
                              <div className="flex items-center gap-1 text-xs text-amber-500">
                                {Array.from({ length: hotel.star_rating || 3 }).map((_, i) => (
                                  <Star key={i} className="w-3 h-3 fill-current" />
                                ))}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {hotel.city || '-'}
                        </TableCell>
                        <TableCell className="text-sm">
                          {hotel.single_room_price 
                            ? `${hotel.currency} ${hotel.single_room_price.toFixed(0)}`
                            : '-'
                          }
                        </TableCell>
                        <TableCell className="text-sm">
                          {hotel.double_room_price 
                            ? `${hotel.currency} ${hotel.double_room_price.toFixed(0)}`
                            : '-'
                          }
                        </TableCell>
                        <TableCell className="text-sm">
                          {hotel.family_room_price 
                            ? `${hotel.currency} ${hotel.family_room_price.toFixed(0)}`
                            : '-'
                          }
                        </TableCell>
                        <TableCell>
                          {hotel.is_active ? (
                            <Badge className="bg-success/10 text-success">Active</Badge>
                          ) : (
                            <Badge variant="secondary">Inactive</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          {/* Patient Bookings Tab */}
          <TabsContent value="bookings" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search by patient name or hotel..."
                value={bookingSearchQuery}
                onChange={(e) => setBookingSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Hotel className="h-5 w-5" />
                  Patient Hotel Bookings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Clinic</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Hotel</TableHead>
                      <TableHead>Price/Night</TableHead>
                      <TableHead>Nights</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Check-out</TableHead>
                      <TableHead>Total Cost</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bookingsLoading ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8">
                          Loading hotel bookings...
                        </TableCell>
                      </TableRow>
                    ) : filteredBookings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                          No hotel bookings found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-primary" />
                              <span className="font-medium">
                                {booking.patient?.first_name} {booking.patient?.last_name}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building2 className="w-4 h-4 text-muted-foreground" />
                              <span className="text-sm">
                                {booking.patient?.organization?.name || '-'}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-muted-foreground" />
                              <span>{booking.hotel?.city || '-'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Hotel className="w-4 h-4 text-primary" />
                              <div>
                                <span className="font-medium">{booking.hotel?.hotel_name}</span>
                                {booking.has_companion && (
                                  <Badge variant="secondary" className="ml-2 text-xs">+Companion</Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4 text-muted-foreground" />
                              <span>
                                {booking.hotel?.currency} {booking.hotel?.price_per_night?.toFixed(2)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Moon className="w-4 h-4 text-muted-foreground" />
                              <span>{booking.nights_count || '-'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-green-600" />
                              <span>
                                {booking.check_in_date 
                                  ? new Date(booking.check_in_date).toLocaleDateString()
                                  : '-'
                                }
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-red-600" />
                              <span>
                                {booking.check_out_date 
                                  ? new Date(booking.check_out_date).toLocaleDateString()
                                  : '-'
                                }
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="font-bold">
                            {booking.hotel?.currency} {calculateTotalCost(booking).toFixed(2)}
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" onClick={() => handleEditBooking(booking)}>
                              <Pencil className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Edit Booking Dialog */}
        <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Hotel Booking</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <span className="text-sm text-muted-foreground">Patient: </span>
                <span className="font-medium">
                  {selectedBooking?.patient?.first_name} {selectedBooking?.patient?.last_name}
                </span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="booking_hotel_id">Hotel *</Label>
                <Select value={bookingFormData.hotel_id} onValueChange={(value) => setBookingFormData({ ...bookingFormData, hotel_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select hotel" />
                  </SelectTrigger>
                  <SelectContent>
                    {hotels.filter(h => h.is_active).map(hotel => (
                      <SelectItem key={hotel.id} value={hotel.id}>
                        {hotel.hotel_name} - {hotel.city} ({hotel.currency} {hotel.price_per_night}/night)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="booking_check_in_date">Check-in Date</Label>
                  <Input
                    id="booking_check_in_date"
                    type="date"
                    value={bookingFormData.check_in_date}
                    onChange={(e) => handleCheckInChange(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="booking_nights_count">Number of Nights</Label>
                  <Input
                    id="booking_nights_count"
                    type="number"
                    min="1"
                    value={bookingFormData.nights_count}
                    onChange={(e) => handleNightsChange(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="booking_check_out_date">Check-out Date</Label>
                <Input
                  id="booking_check_out_date"
                  type="date"
                  value={bookingFormData.check_out_date}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, check_out_date: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="booking_has_companion"
                  checked={bookingFormData.has_companion}
                  onChange={(e) => setBookingFormData({ ...bookingFormData, has_companion: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="booking_has_companion">Has Companion</Label>
              </div>

              {bookingFormData.hotel_id && bookingFormData.nights_count && (
                <div className="p-3 bg-muted rounded-lg">
                  <span className="text-sm text-muted-foreground">Estimated Cost: </span>
                  <span className="font-bold">
                    {(() => {
                      const hotel = hotels.find(h => h.id === bookingFormData.hotel_id);
                      if (!hotel) return '-';
                      let total = hotel.price_per_night * parseInt(bookingFormData.nights_count);
                      if (bookingFormData.has_companion && hotel.companion_price) {
                        total += hotel.companion_price * parseInt(bookingFormData.nights_count);
                      }
                      return `${hotel.currency} ${total.toFixed(2)}`;
                    })()}
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsBookingDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">Update Booking</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
