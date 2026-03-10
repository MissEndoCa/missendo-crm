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
  positive: 'Positive',
  negative: 'Negative',
  pending: 'Pending',
  follow_up: 'Follow Up',
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

      // Fetch creator profiles separately (no FK exists)
      const creatorIds = [...new Set((data || []).map((m: any) => m.created_by).filter(Boolean))];
      let profilesMap: Record<string, { first_name: string; last_name: string }> = {};
      if (creatorIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, first_name, last_name')
          .in('id', creatorIds);
        if (profiles) {
          profilesMap = Object.fromEntries(profiles.map(p => [p.id, { first_name: p.first_name, last_name: p.last_name }]));
        }
      }

      return (data || []).map((m: any) => ({
        ...m,
        profiles: profilesMap[m.created_by] || null,
      })) as (Meeting & { profiles: { first_name: string; last_name: string } | null })[];
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
      toast({ title: editingId ? 'Meeting updated' : 'Meeting added' });
      setDialogOpen(false);
      setEditingId(null);
      setForm(emptyForm);
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
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
      toast({ title: 'Meeting deleted' });
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
          (m.city && m.city.toLowerCase().includes(q)) ||
          (m.address && m.address.toLowerCase().includes(q))
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
              Meetings
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Track your marketing meetings and visits
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) { setEditingId(null); setForm(emptyForm); }
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-1" /> New Meeting
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit Meeting' : 'Add New Meeting'}</DialogTitle>
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
                    <Label>Business Name *</Label>
                    <Input
                      value={form.business_name}
                      onChange={e => setForm(f => ({ ...f, business_name: e.target.value }))}
                      placeholder="Business name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Contact Person *</Label>
                    <Input
                      value={form.contact_name}
                      onChange={e => setForm(f => ({ ...f, contact_name: e.target.value }))}
                      placeholder="Contact name"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Business Type</Label>
                    <Select
                      value={form.business_type}
                      onValueChange={v => setForm(f => ({ ...f, business_type: v }))}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hairdresser">Hairdresser</SelectItem>
                        <SelectItem value="beauty_salon">Beauty Salon</SelectItem>
                        <SelectItem value="clinic">Clinic</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+90..."
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input
                      value={form.city}
                      onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                      placeholder="Istanbul"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Meeting Date *</Label>
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
                            ? format(form.meeting_date, 'dd MMM yyyy')
                            : 'Pick a date'}
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
                  <Label>Address</Label>
                  <Input
                    value={form.address}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    placeholder="Address"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Result</Label>
                  <Select
                    value={form.result}
                    onValueChange={v => setForm(f => ({ ...f, result: v as MeetingResult }))}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="positive">Positive</SelectItem>
                      <SelectItem value="negative">Negative</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="follow_up">Follow Up</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Meeting details..."
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending ? 'Saving...' : editingId ? 'Update' : 'Save'}
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
              placeholder="Search business, contact, phone..."
              className="pl-9"
            />
          </div>
          <Select value={filterResult} onValueChange={setFilterResult}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter by result" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Results</SelectItem>
              <SelectItem value="positive">Positive</SelectItem>
              <SelectItem value="negative">Negative</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="follow_up">Follow Up</SelectItem>
            </SelectContent>
          </Select>
          {cities.length > 0 && (
            <Select value={filterCity} onValueChange={setFilterCity}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filter by city" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
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
                <TableHead><SortHeader field="meeting_date" label="Date" /></TableHead>
                <TableHead><SortHeader field="business_name" label="Business" /></TableHead>
                <TableHead><SortHeader field="contact_name" label="Contact" /></TableHead>
                <TableHead><SortHeader field="city" label="City" /></TableHead>
                <TableHead>Address</TableHead>
                <TableHead><SortHeader field="result" label="Result" /></TableHead>
                <TableHead>Notes</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead className="w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                   <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    Loading...
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                    No meetings found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map(m => (
                  <TableRow key={m.id}>
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(m.meeting_date), 'dd MMM yyyy')}
                    </TableCell>
                    <TableCell className="font-medium">{m.business_name}</TableCell>
                    <TableCell>
                      <div>{m.contact_name}</div>
                      {m.phone && (
                        <div className="text-xs text-muted-foreground">{m.phone}</div>
                      )}
                    </TableCell>
                    <TableCell>{m.city || '-'}</TableCell>
                    <TableCell className="max-w-[150px]">
                      {m.address ? (
                        <span className="text-sm line-clamp-2">{m.address}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {m.result && (
                        <Badge variant="secondary" className={resultColors[m.result]}>
                          {resultLabels[m.result]}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      {m.notes ? (
                        <span className="text-sm text-muted-foreground line-clamp-2">{m.notes}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {(m as any).profiles ? `${(m as any).profiles.first_name} ${(m as any).profiles.last_name}` : '-'}
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
              <div className="text-xs text-muted-foreground">Total Meetings</div>
            </div>
            <div className="rounded-lg border bg-card p-4 text-center">
              <div className="text-2xl font-bold text-primary">
                {meetings.filter(m => m.result === 'positive').length}
              </div>
              <div className="text-xs text-muted-foreground">Positive</div>
            </div>
            <div className="rounded-lg border bg-card p-4 text-center">
              <div className="text-2xl font-bold text-accent-foreground">
                {meetings.filter(m => m.result === 'follow_up').length}
              </div>
              <div className="text-xs text-muted-foreground">Follow Up</div>
            </div>
            <div className="rounded-lg border bg-card p-4 text-center">
              <div className="text-2xl font-bold text-destructive">
                {meetings.filter(m => m.result === 'negative').length}
              </div>
              <div className="text-xs text-muted-foreground">Negative</div>
            </div>
          </div>
        )}
      </div>

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={open => !open && setDeleteId(null)}
        onConfirm={() => deleteId && deleteMutation.mutate(deleteId)}
        title="Delete Meeting"
        description="Are you sure you want to delete this meeting record?"
      />
    </Layout>
  );
}
