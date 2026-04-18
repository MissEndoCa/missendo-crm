import { useEffect, useState } from 'react';
import { SimplePagination } from '@/components/SimplePagination';

const SERVICES_PAGE_SIZE = 15;
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

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
import { Plus, Search, Car, Plane, Calendar, Clock, User, PlaneTakeoff, PlaneLanding } from 'lucide-react';
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
  transfer_type: string | null;
  departure_airport: string | null;
  arrival_airport: string | null;
  airline: string | null;
  departure_time: string | null;
  arrival_time: string | null;
  origin: string | null;
  destination: string | null;
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
  const [servicesPage, setServicesPage] = useState(1);
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

  useEffect(() => { setServicesPage(1); }, [searchQuery]);
  const pagedServices = filteredServices.slice((servicesPage - 1) * SERVICES_PAGE_SIZE, servicesPage * SERVICES_PAGE_SIZE);

  // Categorize patient transfers by type
  const arrivalTransfers = patientTransfers.filter(t => t.transfer_type === 'arrival' || !t.transfer_type);
  const departureTransfers = patientTransfers.filter(t => t.transfer_type === 'departure');

  // Categorize by time
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
    
    const isArrival = transfer.transfer_type === 'arrival' || !transfer.transfer_type;
    
    return (
      <div className={`p-4 rounded-lg border ${bgClass}`}>
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {isArrival ? (
                <PlaneLanding className="w-4 h-4 text-green-600" />
              ) : (
                <PlaneTakeoff className="w-4 h-4 text-blue-600" />
              )}
              <Badge variant={isArrival ? "default" : "secondary"} className={isArrival ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
                {isArrival ? 'Geliş' : 'Dönüş'}
              </Badge>
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
              {format(new Date(transfer.transfer_datetime), 'dd MMM yyyy')}
            </div>
          </div>
        </div>
        
        {/* Flight Route */}
        <div className="mt-3 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between gap-4">
            <div className="text-center flex-1">
              <div className="text-xs text-muted-foreground mb-1">Kalkış</div>
              <div className="font-mono font-bold text-lg">{transfer.departure_airport || transfer.origin || '-'}</div>
              {transfer.departure_time && (
                <div className="text-sm text-muted-foreground">{transfer.departure_time.slice(0, 5)}</div>
              )}
            </div>
            <div className="flex flex-col items-center">
              <Plane className="w-5 h-5 text-muted-foreground rotate-90" />
              {transfer.airline && (
                <div className="text-xs text-muted-foreground mt-1">{transfer.airline}</div>
              )}
              {transfer.flight_info && (
                <div className="font-mono text-xs font-medium">{transfer.flight_info}</div>
              )}
            </div>
            <div className="text-center flex-1">
              <div className="text-xs text-muted-foreground mb-1">Varış</div>
              <div className="font-mono font-bold text-lg">{transfer.arrival_airport || transfer.destination || '-'}</div>
              {transfer.arrival_time && (
                <div className="text-sm text-muted-foreground">{transfer.arrival_time.slice(0, 5)}</div>
              )}
            </div>
          </div>
        </div>

        {/* Airport Pickup */}
        {transfer.airport_pickup_info && (
          <div className="mt-3 flex items-center gap-2 text-sm">
            <Car className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Karşılama:</span>
            <span>{transfer.airport_pickup_info}</span>
          </div>
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
    <>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Transferler</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1 md:mt-2">Hasta transferlerini ve ulaşım hizmetlerini yönetin</p>
          </div>
        </div>

        <Tabs defaultValue="patient-transfers" className="w-full">
          <TabsList className="w-full sm:w-auto flex-wrap">
            <TabsTrigger value="patient-transfers" className="flex items-center gap-2">
              <Plane className="w-4 h-4" />
              Hasta Transferleri
              {todayTransfers.length > 0 && (
                <Badge variant="destructive" className="ml-1">{todayTransfers.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="services" className="flex items-center gap-2">
              <Car className="w-4 h-4" />
              Transfer Hizmetleri
            </TabsTrigger>
          </TabsList>

          <TabsContent value="patient-transfers" className="space-y-6 mt-6">
            {/* Today's Transfers */}
            {todayTransfers.length > 0 && (
              <Card className="border-green-200 dark:border-green-800">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <Calendar className="w-5 h-5" />
                    Bugünkü Transferler ({todayTransfers.length})
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
                    Yaklaşan Transferler - Önümüzdeki 7 Gün ({upcomingTransfers.length})
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
                    Planlanan Transferler ({futureTransfers.length})
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
                    Geçmiş Transferler ({pastTransfers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Hasta</TableHead>
                        <TableHead>Tür</TableHead>
                        <TableHead>Tarih</TableHead>
                        <TableHead>Kalkış → Varış</TableHead>
                        <TableHead>Havayolu</TableHead>
                        <TableHead>Uçuş</TableHead>
                        <TableHead>Saatler</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pastTransfers.slice(0, 10).map(transfer => (
                        <TableRow key={transfer.id}>
                          <TableCell className="font-medium">
                            {transfer.patients?.first_name} {transfer.patients?.last_name}
                          </TableCell>
                          <TableCell>
                            <Badge variant={transfer.transfer_type === 'departure' ? "secondary" : "default"} className={transfer.transfer_type === 'departure' ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}>
                              {transfer.transfer_type === 'departure' ? 'Dönüş' : 'Geliş'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {format(new Date(transfer.transfer_datetime), 'dd MMM yyyy')}
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {transfer.departure_airport || transfer.origin || '-'} → {transfer.arrival_airport || transfer.destination || '-'}
                          </TableCell>
                          <TableCell>{transfer.airline || '-'}</TableCell>
                          <TableCell className="font-mono text-sm">
                            {transfer.flight_info || '-'}
                          </TableCell>
                          <TableCell className="text-sm">
                            {transfer.departure_time?.slice(0, 5) || '-'} - {transfer.arrival_time?.slice(0, 5) || '-'}
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
                  <p>Hasta transferi bulunamadı</p>
                  <p className="text-sm mt-1">Transferler hasta profillerinden eklenir</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="services" className="space-y-6 mt-6">
            <div className="flex justify-between items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Hizmet ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <Plus className="w-4 h-4 mr-2" />
                    Hizmet Ekle
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>{selectedTransfer ? 'Transfer Hizmetini Düzenle' : 'Yeni Transfer Hizmeti Ekle'}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="company_name">Şirket Adı *</Label>
                      <Input
                        id="company_name"
                        value={formData.company_name}
                        onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                        placeholder="örn., İstanbul Transfer"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="service_type">Hizmet Türü</Label>
                      <Input
                        id="service_type"
                        value={formData.service_type}
                        onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                        placeholder="örn., Havalimanı Karşılama, VIP Transfer"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price">Fiyat *</Label>
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
                        <Label htmlFor="currency">Para Birimi</Label>
                        <Select value={formData.currency} onValueChange={(value) => setFormData({ ...formData, currency: value })}>
                          <SelectTrigger>
                            <SelectValue placeholder="Para birimi seçin" />
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
                      <Label htmlFor="notes">Notlar</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={3}
                        placeholder="Hizmet hakkında ek bilgiler..."
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
                      <Label htmlFor="is_active">Aktif</Label>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        İptal
                      </Button>
                      <Button type="submit">
                        {selectedTransfer ? 'Güncelle' : 'Oluştur'}
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
                    <TableHead>Şirket</TableHead>
                    <TableHead>Hizmet Türü</TableHead>
                    <TableHead>Fiyat</TableHead>
                    <TableHead>Durum</TableHead>
                    <TableHead>İşlemler</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        Transfer hizmetleri yükleniyor...
                      </TableCell>
                    </TableRow>
                  ) : filteredServices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Transfer hizmeti bulunamadı
                      </TableCell>
                    </TableRow>
                  ) : (
                    pagedServices.map((transfer) => (
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
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Aktif</Badge>
                          ) : (
                            <Badge variant="secondary">Pasif</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm">
                            Düzenle
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            <SimplePagination
              currentPage={servicesPage}
              totalItems={filteredServices.length}
              pageSize={SERVICES_PAGE_SIZE}
              onPageChange={setServicesPage}
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
