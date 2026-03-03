import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import {
  Plus,
  Search,
  CalendarIcon,
  Pencil,
  Trash2,
  ArrowUpDown,
  Handshake,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DeleteConfirmDialog } from '@/components/DeleteConfirmDialog';

type MeetingResult = 'positive' | 'negative' | 'pending' | 'follow_up';

interface Meeting {
  id: string;
  organization_id: string;
  created_by: string | null;
  contact_name: string;
  business_name: string;
  business_type: string | null;
  meeting_date: string;
  result: MeetingResult | null;
  notes: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface MeetingForm {
  contact_name: string;
  business_name: string;
  business_type: string;
  meeting_date: Date | undefined;
  result: MeetingResult;
  notes: string;
  phone: string;
  address: string;
  city: string;
}

const emptyForm: MeetingForm = {
  contact_name: '',
  business_name: '',
  business_type: 'hairdresser',
  meeting_date: new Date(),
  result: 'pending',
  notes: '',
  phone: '',
  address: '',
  city: '',
};

const resultLabels: Record<MeetingResult, string> = {
  positive: 'Olumlu',
  negative: 'Olumsuz',
  pending: 'Beklemede',
  follow_up: 'Takip Gerekli',
};

const resultColors: Record<MeetingResult, string> = {
  positive: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  negative: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  follow_up: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
};

type SortField = 'meeting_date' | 'business_name' | 'contact_name' | 'result' | 'city';
type SortDir = 'asc' | 'desc';

export default function Meetings() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<MeetingForm>(emptyForm);
  const [search, setSearch] = useState('');
  const [filterResult, setFilterResult] = useState<string>('all');
  const [filterCity, setFilterCity] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('meeting_date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const orgId = profile?.organization_id;

  const { data: meetings = [], isLoading } = useQuery({
    queryKey: ['marketer-meetings', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketer_meetings' as any)
        .select('*')
        .order('meeting_date', { ascending: false });
      if (error) throw error;
      return (data || []) as unknown as Meeting[];
    },
    enabled: !!orgId,
  });

  const saveMutation = useMutation({
    mutationFn: async (formData: MeetingForm) => {
      const payload = {
        contact_name: formData.contact_name.trim(),
        business_name: formData.business_name.trim(),
        business_type: formData.business_type,
        meeting_date: formData.meeting_date?.toISOString(),
        result: formData.result,
        notes: formData.notes.trim() || null,
        phone: formData.phone.trim() || null,
        address: formData.address.trim() || null,
        city: formData.city.trim() || null,
        organization_id: orgId,
      };

      if (editingId) {
        const { error } = await supabase
          .from('marketer_meetings' as any)
          .update(payload as any)
          .eq('id', editingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('marketer_meetings' as any)
          .insert({ ...payload, created_by: profile?.id } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketer-meetings'] });
      toast({ title: editingId ? 'Görüşme güncellendi' : 'Görüşme eklendi' });
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);
    },
    onError: (err: any) => {
      toast({ title: 'Hata', description: err.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('marketer_meetings' as any)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketer-meetings'] });
      toast({ title: 'Görüşme silindi' });
      setDeleteId(null);
    },
  });

  const handleEdit = (m: Meeting) => {
    setEditingId(m.id);
    setForm({
      contact_name: m.contact_name,
      business_name: m.business_name,
      business_type: m.business_type || 'hairdresser',
      meeting_date: new Date(m.meeting_date),
      result: m.result || 'pending',
      notes: m.notes || '',
      phone: m.phone || '',
      address: m.address || '',
      city: m.city || '',
    });
    setDialogOpen(true);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const cities = useMemo(() => {
    const set = new Set(meetings.map(m => m.city).filter(Boolean) as string[]);
    return Array.from(set).sort();
  }, [meetings]);

  const filtered = useMemo(() => {
    let list = [...meetings];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        m =>
          m.contact_name.toLowerCase().includes(q) ||
          m.business_name.toLowerCase().includes(q) ||
          (m.phone && m.phone.includes(q)) ||
          (m.city && m.city.toLowerCase().includes(q))
      );
    }
    if (filterResult !== 'all') {
      list = list.filter(m => m.result === filterResult);
    }
    if (filterCity !== 'all') {
      list = list.filter(m => m.city === filterCity);
    }
    list.sort((a, b) => {
      let cmp = 0;
      const aVal = a[sortField] || '';
      const bVal = b[sortField] || '';
      cmp = String(aVal).localeCompare(String(bVal));
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [meetings, search, filterResult, filterCity, sortField, sortDir]);

  const SortHeader = ({ field, label }: { field: SortField; label: string }) => (
    <button
      className="flex items-center gap-1 hover:text-foreground transition-colors"
      onClick={() => handleSort(field)}
    >
      {label}
      <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Handshake className="h-6 w-6" />
              Görüşmeler
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Pazarlama görüşmelerini takip edin
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) { setEditingId(null); setForm(emptyForm); }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-1" /> Yeni Görüşme
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Görüşme Düzenle' : 'Yeni Görüşme Ekle'}</DialogTitle>
              </DialogHeader>
              <form
                className="space-y-4"
                onSubmit={e => {
                  e.preventDefault();
                  if (!form.contact_name.trim() || !form.business_name.trim() || !form.meeting_date) return;
                  saveMutation.mutate(form);
                }}
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>İşletme Adı *</Label>
                    <Input
                      value={form.business_name}
                      onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))}
                      placeholder="Kuaför adı"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Görüşülen Kişi *</Label>
                    <Input
                      value={form.contact_name}
                      onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))}
                      placeholder="Kişi adı"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>İşletme Türü</Label>
                    <Select
                      value={form.business_type}
                      onValueChange={v => setForm(f => ({ ...f, business_type: v }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hairdresser">Kuaför</SelectItem>
                        <SelectItem value="beauty_salon">Güzellik Salonu</SelectItem>
                        <SelectItem value="clinic">Klinik</SelectItem>
                        <SelectItem value="other">Diğer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Telefon</Label>
                    <Input
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+90..."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Şehir</Label>
                    <Input
                      value={form.city}
                      onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                      placeholder="İstanbul"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Görüşme Tarihi *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            'w-full justify-start text-left font-normal',
                            !form.meeting_date && 'text-muted-foreground'
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.meeting_date
                            ? format(form.meeting_date, 'dd MMM yyyy', { locale: tr })
                            : 'Tarih seç'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={form.meeting_date}
                          onSelect={d => setForm(f => ({ ...f, meeting_date: d }))}
                          initialFocus
                          className="p-3 pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Adres</Label>
                  <Input
                    value={form.address}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    placeholder="Adres bilgisi"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sonuç</Label>
                  <Select
                    value={form.result}
                    onValueChange={v => setForm(f => ({ ...f, result: v as MeetingResult }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="positive">Olumlu</SelectItem>
                      <SelectItem value="negative">Olumsuz</SelectItem>
                      <SelectItem value="pending">Beklemede</SelectItem>
                      <SelectItem value="follow_up">Takip Gerekli</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notlar</Label>
                  <Textarea
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Görüşme detayları..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    İptal
                  </Button>
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? 'Kaydediliyor...' : editingId ? 'Güncelle' : 'Kaydet'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="İşletme, kişi, telefon ara..."
              className="pl-9"
            />
          </div>
          <Select value={filterResult} onValueChange={setFilterResult}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sonuç filtrele" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Sonuçlar</SelectItem>
              <SelectItem value="positive">Olumlu</SelectItem>
              <SelectItem value="negative">Olumsuz</SelectItem>
              <SelectItem value="pending">Beklemede</SelectItem>
              <SelectItem value="follow_up">Takip Gerekli</SelectItem>
            </SelectContent>
          </Select>
          {cities.length > 0 && (
            <Select value={filterCity} onValueChange={setFilterCity}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Şehir filtrele" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Şehirler</SelectItem>
                {cities.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Table */}
        <div className="rounded-md border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><SortHeader field="meeting_date" label="Tarih" /></TableHead>
                <TableHead><SortHeader field="business_name" label="İşletme" /></TableHead>
                <TableHead><SortHeader field="contact_name" label="Kişi" /></TableHead>
                <TableHead><SortHeader field="city" label="Şehir" /></TableHead>
                <TableHead><SortHeader field="result" label="Sonuç" /></TableHead>
                <TableHead>Notlar</TableHead>
                <TableHead className="w-[80px]">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Yükleniyor...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Henüz görüşme kaydı yok
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(m.meeting_date), 'dd MMM yyyy', { locale: tr })}
                    </TableCell>
                    <TableCell className="font-medium">{m.business_name}</TableCell>
                    <TableCell>
                      <div>{m.contact_name}</div>
                      {m.phone && (
                        <div className="text-xs text-muted-foreground">{m.phone}</div>
                      )}
                    </TableCell>
                    <TableCell>{m.city || '-'}</TableCell>
                    <TableCell>
                      {m.result && (
                        <Badge variant="secondary" className={resultColors[m.result]}>
                          {resultLabels[m.result]}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {m.notes || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(m)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => setDeleteId(m.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Stats */}
        {meetings.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-lg border bg-card p-4 text-center">
              <div className="text-2xl font-bold text-foreground">{meetings.length}</div>
              <div className="text-xs text-muted-foreground">Toplam Görüşme</div>
            </div>
            <div className="rounded-lg border bg-card p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {meetings.filter(m => m.result === 'positive').length}
              </div>
              <div className="text-xs text-muted-foreground">Olumlu</div>
            </div>
            <div className="rounded-lg border bg-card p-4 text-center">
              <div className="text-2xl font-bold text-accent-foreground">
                {meetings.filter(m => m.result === 'follow_up').length}
              </div>
              <div className="text-xs text-muted-foreground">Takip Gerekli</div>
            </div>
            <div className="rounded-lg border bg-card p-4 text-center">
              <div className="text-2xl font-bold text-destructive">
                {meetings.filter(m => m.result === 'negative').length}
              </div>
              <div className="text-xs text-muted-foreground">Olumsuz</div>
            </div>
          </div>
        )}
      </div>

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={open => !open && setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Görüşmeyi Sil"
        description="Bu görüşme kaydını silmek istediğinize emin misiniz?"
      />
    </Layout>
  );
}
