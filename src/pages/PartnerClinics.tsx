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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Plus, Search, Building2, Pencil } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

type ClinicCategory = 'hair' | 'dental' | 'aesthetic';

interface PartnerClinic {
  id: string;
  name: string;
  category: ClinicCategory;
  address: string | null;
  phone: string | null;
  email: string | null;
  notes: string | null;
  is_active: boolean;
  organization_id: string;
  created_at: string;
}

const categoryLabels: Record<ClinicCategory, string> = {
  hair: 'Saç',
  dental: 'Diş',
  aesthetic: 'Estetik',
};

const categoryColors: Record<ClinicCategory, string> = {
  hair: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  dental: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  aesthetic: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
};

export default function PartnerClinics() {
  const { profile, isSuperAdmin, isClinicAdmin } = useAuth();
  const [clinics, setClinics] = useState<PartnerClinic[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClinic, setSelectedClinic] = useState<PartnerClinic | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    category: '' as ClinicCategory | '',
    address: '',
    phone: '',
    email: '',
    notes: '',
    is_active: true,
  });

  useEffect(() => {
    loadClinics();
  }, [profile]);

  const loadClinics = async () => {
    if (!profile) return;

    try {
      let query = supabase
        .from('partner_clinics')
        .select('*')
        .order('name', { ascending: true });

      if (!isSuperAdmin && profile.organization_id) {
        query = query.eq('organization_id', profile.organization_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setClinics(data || []);
    } catch (error) {
      console.error('Error loading partner clinics:', error);
      toast({
        title: "Hata",
        description: "Partner klinikler yüklenemedi",
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
        title: "Hata",
        description: "Bir organizasyona atanmış olmalısınız",
        variant: "destructive",
      });
      return;
    }

    if (!formData.category) {
      toast({
        title: "Hata",
        description: "Lütfen bir kategori seçin",
        variant: "destructive",
      });
      return;
    }

    try {
      const clinicData = {
        name: formData.name,
        category: formData.category as ClinicCategory,
        address: formData.address || null,
        phone: formData.phone || null,
        email: formData.email || null,
        notes: formData.notes || null,
        is_active: formData.is_active,
        organization_id: profile.organization_id,
      };

      if (selectedClinic) {
        const { error } = await supabase
          .from('partner_clinics')
          .update(clinicData)
          .eq('id', selectedClinic.id);

        if (error) throw error;

        toast({
          title: "Başarılı",
          description: "Partner klinik güncellendi",
        });
      } else {
        const { error } = await supabase
          .from('partner_clinics')
          .insert([clinicData]);

        if (error) throw error;

        toast({
          title: "Başarılı",
          description: "Partner klinik oluşturuldu",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      loadClinics();
    } catch (error) {
      console.error('Error saving partner clinic:', error);
      toast({
        title: "Hata",
        description: "Partner klinik kaydedilemedi",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      category: '',
      address: '',
      phone: '',
      email: '',
      notes: '',
      is_active: true,
    });
    setSelectedClinic(null);
  };

  const handleEdit = (clinic: PartnerClinic) => {
    setSelectedClinic(clinic);
    setFormData({
      name: clinic.name,
      category: clinic.category,
      address: clinic.address || '',
      phone: clinic.phone || '',
      email: clinic.email || '',
      notes: clinic.notes || '',
      is_active: clinic.is_active,
    });
    setIsDialogOpen(true);
  };

  const filteredClinics = clinics.filter(clinic =>
    `${clinic.name} ${clinic.category} ${clinic.address || ''}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Partner Klinikler</h1>
            <p className="text-muted-foreground mt-2">Partner klinikleri yönetin</p>
          </div>
          {isClinicAdmin && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={resetForm}>
                  <Plus className="w-4 h-4 mr-2" />
                  Klinik Ekle
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {selectedClinic ? 'Kliniği Düzenle' : 'Yeni Partner Klinik'}
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Klinik Adı *</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="category">Kategori *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value: ClinicCategory) => 
                        setFormData({ ...formData, category: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Kategori seçin" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hair">Saç</SelectItem>
                        <SelectItem value="dental">Diş</SelectItem>
                        <SelectItem value="aesthetic">Estetik</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Adres</Label>
                    <Input
                      id="address"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefon</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">E-posta</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notlar</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      rows={2}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="is_active"
                      checked={formData.is_active}
                      onCheckedChange={(checked) => 
                        setFormData({ ...formData, is_active: checked })
                      }
                    />
                    <Label htmlFor="is_active">Aktif</Label>
                  </div>

                  <div className="flex justify-end gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                    >
                      İptal
                    </Button>
                    <Button type="submit">
                      {selectedClinic ? 'Güncelle' : 'Kaydet'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Klinik ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Klinik Adı</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Telefon</TableHead>
                <TableHead>E-posta</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Yükleniyor...
                  </TableCell>
                </TableRow>
              ) : filteredClinics.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <Building2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-2" />
                    <p className="text-muted-foreground">Partner klinik bulunamadı</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredClinics.map((clinic) => (
                  <TableRow key={clinic.id}>
                    <TableCell className="font-medium">{clinic.name}</TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={categoryColors[clinic.category]}
                      >
                        {categoryLabels[clinic.category]}
                      </Badge>
                    </TableCell>
                    <TableCell>{clinic.phone || '-'}</TableCell>
                    <TableCell>{clinic.email || '-'}</TableCell>
                    <TableCell>
                      <Badge variant={clinic.is_active ? 'default' : 'secondary'}>
                        {clinic.is_active ? 'Aktif' : 'Pasif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {isClinicAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(clinic)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      )}
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
