import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Hotel, User, Building2, MapPin, Calendar, Moon, DollarSign, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Patient {
  id: string;
  first_name: string;
  last_name: string;
  organization_id: string;
  organization?: {
    name: string;
  };
}

interface HotelInfo {
  id: string;
  hotel_name: string;
  city: string | null;
  price_per_night: number;
  companion_price: number | null;
  currency: string;
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
  hotel?: HotelInfo;
}

export default function PatientHotels() {
  const { profile, isSuperAdmin } = useAuth();
  const [bookings, setBookings] = useState<PatientHotelBooking[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [hotels, setHotels] = useState<HotelInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<PatientHotelBooking | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    patient_id: '',
    hotel_id: '',
    nights_count: '',
    has_companion: false,
    check_in_date: '',
    check_out_date: '',
  });

  useEffect(() => {
    if (profile) {
      loadData();
    }
  }, [profile]);

  const loadData = async () => {
    setLoading(true);
    await Promise.all([loadBookings(), loadPatients(), loadHotels()]);
    setLoading(false);
  };

  const loadBookings = async () => {
    if (!profile) return;

    try {
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
      toast({
        title: "Error",
        description: "Failed to load hotel bookings",
        variant: "destructive",
      });
    }
  };

  const loadPatients = async () => {
    if (!profile) return;

    try {
      let query = supabase
        .from('patients')
        .select('id, first_name, last_name, organization_id')
        .order('first_name');

      if (!isSuperAdmin && profile.organization_id) {
        query = query.eq('organization_id', profile.organization_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPatients(data || []);
    } catch (error) {
      console.error('Error loading patients:', error);
    }
  };

  const loadHotels = async () => {
    if (!profile) return;

    try {
      let query = supabase
        .from('hotels')
        .select('id, hotel_name, city, price_per_night, companion_price, currency')
        .eq('is_active', true)
        .order('hotel_name');

      if (!isSuperAdmin && profile.organization_id) {
        query = query.eq('organization_id', profile.organization_id);
      }

      const { data, error } = await query;
      if (error) throw error;
      setHotels(data || []);
    } catch (error) {
      console.error('Error loading hotels:', error);
    }
  };

  const calculateTotalCost = (booking: PatientHotelBooking) => {
    if (!booking.hotel || !booking.nights_count) return 0;
    
    let total = booking.hotel.price_per_night * booking.nights_count;
    if (booking.has_companion && booking.hotel.companion_price) {
      total += booking.hotel.companion_price * booking.nights_count;
    }
    return total;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedBooking) {
      toast({
        title: "Error",
        description: "Please select a booking to update",
        variant: "destructive",
      });
      return;
    }

    try {
      const updateData = {
        hotel_id: formData.hotel_id || null,
        nights_count: formData.nights_count ? parseInt(formData.nights_count) : null,
        has_companion: formData.has_companion,
        check_in_date: formData.check_in_date || null,
        check_out_date: formData.check_out_date || null,
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

      setIsDialogOpen(false);
      resetForm();
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
      patient_id: '',
      hotel_id: '',
      nights_count: '',
      has_companion: false,
      check_in_date: '',
      check_out_date: '',
    });
    setSelectedBooking(null);
  };

  const handleEdit = (booking: PatientHotelBooking) => {
    setSelectedBooking(booking);
    setFormData({
      patient_id: booking.patient_id,
      hotel_id: booking.hotel_id || '',
      nights_count: booking.nights_count?.toString() || '',
      has_companion: booking.has_companion || false,
      check_in_date: booking.check_in_date || '',
      check_out_date: booking.check_out_date || '',
    });
    setIsDialogOpen(true);
  };

  const handleCheckInChange = (date: string) => {
    setFormData(prev => {
      const newData = { ...prev, check_in_date: date };
      // Auto-calculate check_out_date if nights_count is set
      if (date && prev.nights_count) {
        const checkIn = new Date(date);
        checkIn.setDate(checkIn.getDate() + parseInt(prev.nights_count));
        newData.check_out_date = checkIn.toISOString().split('T')[0];
      }
      return newData;
    });
  };

  const handleNightsChange = (nights: string) => {
    setFormData(prev => {
      const newData = { ...prev, nights_count: nights };
      // Auto-calculate check_out_date if check_in_date is set
      if (prev.check_in_date && nights) {
        const checkIn = new Date(prev.check_in_date);
        checkIn.setDate(checkIn.getDate() + parseInt(nights));
        newData.check_out_date = checkIn.toISOString().split('T')[0];
      }
      return newData;
    });
  };

  const filteredBookings = bookings.filter(booking => {
    const patientName = `${booking.patient?.first_name} ${booking.patient?.last_name}`.toLowerCase();
    const hotelName = booking.hotel?.hotel_name?.toLowerCase() || '';
    const searchLower = searchQuery.toLowerCase();
    return patientName.includes(searchLower) || hotelName.includes(searchLower);
  });

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Patient Hotels</h1>
            <p className="text-muted-foreground mt-2">Manage patient hotel bookings and stays</p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search by patient name or hotel..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Hotel className="h-5 w-5" />
              Hotel Bookings
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
                {loading ? (
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
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(booking)}>
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

        {/* Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit Hotel Booking</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 bg-muted rounded-lg">
                <span className="text-sm text-muted-foreground">Patient: </span>
                <span className="font-medium">
                  {selectedBooking?.patient?.first_name} {selectedBooking?.patient?.last_name}
                </span>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hotel_id">Hotel *</Label>
                <Select value={formData.hotel_id} onValueChange={(value) => setFormData({ ...formData, hotel_id: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select hotel" />
                  </SelectTrigger>
                  <SelectContent>
                    {hotels.map(hotel => (
                      <SelectItem key={hotel.id} value={hotel.id}>
                        {hotel.hotel_name} - {hotel.city} ({hotel.currency} {hotel.price_per_night}/night)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="check_in_date">Check-in Date</Label>
                  <Input
                    id="check_in_date"
                    type="date"
                    value={formData.check_in_date}
                    onChange={(e) => handleCheckInChange(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nights_count">Number of Nights</Label>
                  <Input
                    id="nights_count"
                    type="number"
                    min="1"
                    value={formData.nights_count}
                    onChange={(e) => handleNightsChange(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="check_out_date">Check-out Date</Label>
                <Input
                  id="check_out_date"
                  type="date"
                  value={formData.check_out_date}
                  onChange={(e) => setFormData({ ...formData, check_out_date: e.target.value })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="has_companion"
                  checked={formData.has_companion}
                  onChange={(e) => setFormData({ ...formData, has_companion: e.target.checked })}
                  className="rounded"
                />
                <Label htmlFor="has_companion">Has Companion</Label>
              </div>

              {formData.hotel_id && formData.nights_count && (
                <div className="p-3 bg-muted rounded-lg">
                  <span className="text-sm text-muted-foreground">Estimated Cost: </span>
                  <span className="font-bold">
                    {(() => {
                      const hotel = hotels.find(h => h.id === formData.hotel_id);
                      if (!hotel) return '-';
                      let total = hotel.price_per_night * parseInt(formData.nights_count);
                      if (formData.has_companion && hotel.companion_price) {
                        total += hotel.companion_price * parseInt(formData.nights_count);
                      }
                      return `${hotel.currency} ${total.toFixed(2)}`;
                    })()}
                  </span>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
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
