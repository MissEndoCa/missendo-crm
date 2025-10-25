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
import { Plus, Search, Car } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CURRENCIES = ['USD', 'EUR', 'GBP', 'TRY', 'AED'];

interface Transfer {
  id: string;
  company_name: string;
  service_type: string | null;
  price: number;
  currency: string;
  notes: string | null;
  is_active: boolean;
}

export default function Transfers() {
  const { profile, isSuperAdmin } = useAuth();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
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
    loadTransfers();
  }, [profile]);

  const loadTransfers = async () => {
    if (!profile) return;

    try {
      let query = supabase.from('transfer_services').select('*').order('company_name');

      if (!isSuperAdmin && profile.organization_id) {
        query = query.eq('organization_id', profile.organization_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setTransfers(data || []);
    } catch (error) {
      console.error('Error loading transfers:', error);
      toast({
        title: "Error",
        description: "Failed to load transfer services",
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
      loadTransfers();
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

  const handleEdit = (transfer: Transfer) => {
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

  const filteredTransfers = transfers.filter(transfer =>
    `${transfer.company_name} ${transfer.service_type}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Transfer Services</h1>
            <p className="text-muted-foreground mt-2">Manage transportation providers and pricing</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm}>
                <Plus className="w-4 h-4 mr-2" />
                Add Transfer
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
                    {selectedTransfer ? 'Update' : 'Create'} Transfer
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search transfers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
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
              ) : filteredTransfers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No transfer services found
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransfers.map((transfer) => (
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
