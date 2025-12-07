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
import { Plus, Search, Car, Plane, Calendar, Clock, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, isAfter, isBefore, isToday, addDays } from 'date-fns';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'TRY', 'AED'];

interface TransferService {
  id: string;
  company_name: string;
  service_type: string | null;
  price: number;
  currency: string;
  notes: string | null;
  is_active: boolean;
}

interface PatientTransfer {
  id: string;
  patient_id: string;
  clinic_name: string | null;
  flight_info: string | null;
  airport_pickup_info: string | null;
  transfer_datetime: string;
  notes: string | null;
  created_at: string;
  patients: {
    first_name: string;
    last_name: string;
    phone: string;
  } | null;
}

export default function Transfers() {
  const { profile, isSuperAdmin } = useAuth();
  const [transferServices, setTransferServices] = useState<TransferService[]>([]);
  const [patientTransfers, setPatientTransfers] = useState<PatientTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<TransferService | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    company_name: '',
    service_type: '',
    price: '',
    currency: 'USD',
    notes: '',
    is_active: true,
  });

  useEffect(() => {
    loadData();
  }, [profile]);

  const loadData = async () => {
    if (!profile) return;

    try {
      setLoading(true);
      
      // Load transfer services
      let servicesQuery = supabase.from('transfer_services').select('*').order('company_name');
      if (!isSuperAdmin && profile.organization_id) {
        servicesQuery = servicesQuery.eq('organization_id', profile.organization_id);
      }
      
      // Load patient transfers with patient info
      let transfersQuery = supabase
        .from('patient_transfers')
        .select('*, patients(first_name, last_name, phone)')
        .order('transfer_datetime', { ascending: true });
      
      if (!isSuperAdmin && profile.organization_id) {
        transfersQuery = transfersQuery.eq('organization_id', profile.organization_id);
      }

      const [servicesRes, transfersRes] = await Promise.all([
        servicesQuery,
        transfersQuery
      ]);

      if (servicesRes.error) throw servicesRes.error;
      if (transfersRes.error) throw transfersRes.error;
      
      setTransferServices(servicesRes.data || []);
      setPatientTransfers(transfersRes.data || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: "Error",
        description: "Failed to load transfers",
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
      const transferData = {
        company_name: formData.company_name,
        service_type: formData.service_type || null,
        price: parseFloat(formData.price),
        currency: formData.currency,
        notes: formData.notes || null,
        is_active: formData.is_active,
        organization_id: profile.organization_id,
      };

      if (selectedTransfer) {
        const { error } = await supabase
          .from('transfer_services')
          .update(transferData)
          .eq('id', selectedTransfer.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Transfer service updated successfully",
        });
      } else {
        const { error } = await supabase.from('transfer_services').insert([transferData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Transfer service created successfully",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      loadData();
    } catch (error) {
      console.error('Error saving transfer:', error);
      toast({
        title: "Error",
        description: "Failed to save transfer service",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      company_name: '',
      service_type: '',
      price: '',
      currency: 'USD',
      notes: '',
      is_active: true,
    });
    setSelectedTransfer(null);
  };

  const handleEdit = (transfer: TransferService) => {
    setSelectedTransfer(transfer);
    setFormData({
      company_name: transfer.company_name,
      service_type: transfer.service_type || '',
      price: transfer.price.toString(),
      currency: transfer.currency,
      notes: transfer.notes || '',
      is_active: transfer.is_active,
    });
    setIsDialogOpen(true);
  };

  const filteredServices = transferServices.filter(transfer =>
    `${transfer.company_name} ${transfer.service_type}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Categorize patient transfers
  const now = new Date();
  const todayTransfers = patientTransfers.filter(t => isToday(new Date(t.transfer_datetime)));
  const upcomingTransfers = patientTransfers.filter(t => {
    const date = new Date(t.transfer_datetime);
    return isAfter(date, now) && !isToday(date) && isBefore(date, addDays(now, 7));
  });
  const futureTransfers = patientTransfers.filter(t => {
    const date = new Date(t.transfer_datetime);
    return isAfter(date, addDays(now, 7));
  });
  const pastTransfers = patientTransfers.filter(t => {
    const date = new Date(t.transfer_datetime);
    return isBefore(date, now) && !isToday(date);
  });

  const TransferCard = ({ transfer, variant = 'default' }: { transfer: PatientTransfer; variant?: 'today' | 'upcoming' | 'default' }) => {
    const bgClass = variant === 'today' 
      ? 'border-l-4 border-l-green-500 bg-green-50 dark:bg-green-950/20' 
      : variant === 'upcoming' 
      ? 'border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950/20'
      : '';
    
    return (
      <div className={`p-4 rounded-lg border ${bgClass}`}>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <span className="font-semibold">
                {transfer.patients?.first_name} {transfer.patients?.last_name}
              </span>
            </div>
            {transfer.patients?.phone && (
              <p className="text-sm text-muted-foreground">{transfer.patients.phone}</p>
            )}
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 text-sm font-medium">
              <Calendar className="w-4 h-4" />
              {format(new Date(transfer.transfer_datetime), 'MMM dd, yyyy')}
            </div>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              {format(new Date(transfer.transfer_datetime), 'HH:mm')}
            </div>
          </div>
        </div>
        
        <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
          {transfer.flight_info && (
            <div className="flex items-center gap-2">
              <Plane className="w-4 h-4 text-muted-foreground" />
              <span className="font-mono">{transfer.flight_info}</span>
            </div>
          )}
          {transfer.clinic_name && (
            <div className="text-muted-foreground">
              Clinic: {transfer.clinic_name}
            </div>
          )}
        </div>
        
        {transfer.airport_pickup_info && (
          <p className="mt-2 text-sm text-muted-foreground">
            Pickup: {transfer.airport_pickup_info}
          </p>
        )}
        
        {transfer.notes && (
          <p className="mt-2 text-xs text-muted-foreground bg-muted/50 p-2 rounded">
            {transfer.notes}
          </p>
        )}
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Transfers</h1>
            <p className="text-muted-foreground mt-2">Manage patient transfers and transportation services</p>
          </div>
        </div>

        <Tabs defaultValue="patient-transfers" className="w-full">
          <TabsList>
            <TabsTrigger value="patient-transfers" className="flex items-center gap-2">
              <Plane className="w-4 h-4" />
              Patient Transfers
              {todayTransfers.length > 0 && (
                <Badge variant="destructive" className="ml-1">{todayTransfers.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2">
              <Car className="w-4 h-4" />
              Transfer Services
            </TabsTrigger>
          </TabsList>

          <TabsContent value="patient-transfers" className="space-y-6 mt-6">
            {/* Today's Transfers */}
            {todayTransfers.length > 0 && (
              <Card className="border-green-200 dark:border-green-800">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <Calendar className="w-5 h-5" />
                    Today's Transfers ({todayTransfers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {todayTransfers.map(transfer => (
                    <TransferCard key={transfer.id} transfer={transfer} variant="today" />
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Upcoming Transfers (Next 7 days) */}
            {upcomingTransfers.length > 0 && (
              <Card className="border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
                    <Clock className="w-5 h-5" />
                    Upcoming Transfers - Next 7 Days ({upcomingTransfers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {upcomingTransfers.map(transfer => (
                    <TransferCard key={transfer.id} transfer={transfer} variant="upcoming" />
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Future Transfers */}
            {futureTransfers.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Scheduled Transfers ({futureTransfers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {futureTransfers.map(transfer => (
                    <TransferCard key={transfer.id} transfer={transfer} />
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Past Transfers */}
            {pastTransfers.length > 0 && (
              <Card className="opacity-75">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="w-5 h-5" />
                    Past Transfers ({pastTransfers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Patient</TableHead>
                        <TableHead>Date & Time</TableHead>
                        <TableHead>Flight</TableHead>
                        <TableHead>Clinic</TableHead>
                        <TableHead>Pickup</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pastTransfers.slice(0, 10).map(transfer => (
                        <TableRow key={transfer.id}>
                          <TableCell className="font-medium">
                            {transfer.patients?.first_name} {transfer.patients?.last_name}
                          </TableCell>
                          <TableCell>
                            {format(new Date(transfer.transfer_datetime), 'MMM dd, yyyy HH:mm')}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {transfer.flight_info || '-'}
                          </TableCell>
                          <TableCell>{transfer.clinic_name || '-'}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {transfer.airport_pickup_info || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {patientTransfers.length === 0 && !loading && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  <Plane className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No patient transfers found</p>
                  <p className="text-sm mt-1">Transfers are added from patient profiles</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="services" className="space-y-6 mt-6">
            <div className="flex justify-between items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search services..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Service
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{selectedTransfer ? 'Edit Transfer Service' : 'Add New Transfer Service'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="company_name">Company Name *</Label>
                      <Input
                        id="company_name"
                        value={formData.company_name}
                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                        placeholder="e.g., Istanbul Transfer Co."
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="service_type">Service Type</Label>
                      <Input
                        id="service_type"
                        value={formData.service_type}
                        onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                        placeholder="e.g., Airport Pickup, VIP Transfer"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price">Price *</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                          required
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
                      <Label htmlFor="notes">Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={3}
                        placeholder="Additional information about the service..."
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
                        {selectedTransfer ? 'Update' : 'Create'} Service
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
                    <TableHead>Company</TableHead>
                    <TableHead>Service Type</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Loading transfer services...
                      </TableCell>
                    </TableRow>
                  ) : filteredServices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No transfer services found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredServices.map((transfer) => (
                      <TableRow key={transfer.id} className="cursor-pointer hover:bg-muted/50" onClick={() => handleEdit(transfer)}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Car className="w-4 h-4 text-primary" />
                            <span className="font-medium">{transfer.company_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {transfer.service_type || '-'}
                        </TableCell>
                        <TableCell className="font-medium">
                          {transfer.currency} {transfer.price.toFixed(2)}
                        </TableCell>
                        <TableCell>
                          {transfer.is_active ? (
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Active</Badge>
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
        </Tabs>
      </div>
    </Layout>
  );
}
