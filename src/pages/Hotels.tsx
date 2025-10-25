import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import { Plus, Search, Hotel } from 'lucide-react';
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
}

export default function Hotels() {
  const { profile, isSuperAdmin } = useAuth();
  const [hotels, setHotels] = useState<HotelData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedHotel, setSelectedHotel] = useState<HotelData | null>(null);
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
  });

  useEffect(() => {
    loadHotels();
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
        price_per_night: parseFloat(formData.price_per_night),
        companion_price: formData.companion_price ? parseFloat(formData.companion_price) : null,
        currency: formData.currency,
        amenities: formData.amenities || null,
        is_active: formData.is_active,
        organization_id: profile.organization_id,
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
    });
    setSelectedHotel(null);
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
    });
    setIsDialogOpen(true);
  };

  const filteredHotels = hotels.filter(hotel =>
    `${hotel.hotel_name} ${hotel.city}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Hotels</h1>
            <p className="text-muted-foreground mt-2">Manage accommodation options for patients</p>
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

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price_per_night">Price per Night *</Label>
                    <Input
                      id="price_per_night"
                      type="number"
                      step="0.01"
                      value={formData.price_per_night}
                      onChange={(e) => setFormData({ ...formData, price_per_night: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companion_price">Companion Price</Label>
                    <Input
                      id="companion_price"
                      type="number"
                      step="0.01"
                      value={formData.companion_price}
                      onChange={(e) => setFormData({ ...formData, companion_price: e.target.value })}
                      placeholder="Optional"
                    />
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

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search hotels..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="bg-card rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Hotel</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Price/Night</TableHead>
                <TableHead>Companion</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading hotels...
                  </TableCell>
                </TableRow>
              ) : filteredHotels.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
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
                          {hotel.amenities && (
                            <div className="text-xs text-muted-foreground line-clamp-1">
                              {hotel.amenities}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {hotel.city || '-'}
                    </TableCell>
                    <TableCell className="font-medium">
                      {hotel.currency} {hotel.price_per_night.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {hotel.companion_price 
                        ? `${hotel.currency} ${hotel.companion_price.toFixed(2)}`
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
      </div>
    </Layout>
  );
}
