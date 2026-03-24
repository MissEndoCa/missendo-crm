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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Plus, Search, Building2, CheckCircle, XCircle, Settings, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import OrganizationUsers from '@/components/OrganizationUsers';
import { Textarea } from '@/components/ui/textarea';

interface Organization {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  category: string | null;
  is_active: boolean;
  created_at: string;
  wa_access_token: string | null;
  wa_phone_number_id: string | null;
  fb_ad_account_id: string | null;
  fb_page_access_token: string | null;
}

const categoryLabels: Record<string, string> = {
  hair: 'Hair',
  dental: 'Dental',
  aesthetic: 'Aesthetic',
};

const categoryColors: Record<string, string> = {
  hair: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  dental: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  aesthetic: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
};

export default function Organizations() {
  const { isSuperAdmin, loading: authLoading } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isApiDialogOpen, setIsApiDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [orgToDelete, setOrgToDelete] = useState<Organization | null>(null);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'Turkey',
    category: 'dental',
    is_active: true,
  });

  const [apiFormData, setApiFormData] = useState({
    wa_access_token: '',
    wa_phone_number_id: '',
    fb_ad_account_id: '',
    fb_page_access_token: '',
  });

  useEffect(() => {
    if (isSuperAdmin) {
      loadOrganizations();
    }
  }, [isSuperAdmin]);

  const loadOrganizations = async () => {
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrganizations(data || []);
    } catch (error) {
      console.error('Error loading organizations:', error);
      toast({
        title: "Error",
        description: "Failed to load organizations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (selectedOrg) {
        const { error } = await supabase
          .from('organizations')
          .update(formData)
          .eq('id', selectedOrg.id);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Organization updated successfully",
        });
      } else {
        const { error } = await supabase
          .from('organizations')
          .insert([formData]);

        if (error) throw error;

        toast({
          title: "Success",
          description: "Organization created successfully",
        });
      }

      setIsDialogOpen(false);
      resetForm();
      loadOrganizations();
    } catch (error) {
      console.error('Error saving organization:', error);
      toast({
        title: "Error",
        description: "Failed to save organization",
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      country: 'Turkey',
      category: 'dental',
      is_active: true,
    });
    setSelectedOrg(null);
  };

  const handleEdit = (org: Organization) => {
    setSelectedOrg(org);
    setFormData({
      name: org.name,
      email: org.email || '',
      phone: org.phone || '',
      address: org.address || '',
      city: org.city || '',
      country: org.country || 'Turkey',
      category: org.category || 'dental',
      is_active: org.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleApiSettings = (org: Organization, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedOrg(org);
    setApiFormData({
      wa_access_token: org.wa_access_token || '',
      wa_phone_number_id: org.wa_phone_number_id || '',
      fb_ad_account_id: org.fb_ad_account_id || '',
      fb_page_access_token: org.fb_page_access_token || '',
    });
    setIsApiDialogOpen(true);
  };

  const handleApiSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrg) return;

    try {
      const { error } = await supabase
        .from('organizations')
        .update(apiFormData)
        .eq('id', selectedOrg.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "API settings updated successfully",
      });

      setIsApiDialogOpen(false);
      loadOrganizations();
    } catch (error) {
      console.error('Error updating API settings:', error);
      toast({
        title: "Error",
        description: "Failed to update API settings",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (org: Organization, e: React.MouseEvent) => {
    e.stopPropagation();
    setOrgToDelete(org);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!orgToDelete) return;

    try {
      const { error } = await supabase
        .from('organizations')
        .delete()
        .eq('id', orgToDelete.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Organization deleted successfully",
      });

      setIsDeleteDialogOpen(false);
      setOrgToDelete(null);
      loadOrganizations();
    } catch (error: any) {
      console.error('Error deleting organization:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete organization. It may have associated data.",
        variant: "destructive",
      });
    }
  };

  const filteredOrganizations = organizations.filter(org =>
    `${org.name} ${org.email} ${org.city}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  // Show loading while authentication is being checked
  if (authLoading) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Layout>
    );
  }

  if (!isSuperAdmin) {
    return (
      <Layout>
        <div className="text-center py-12">
          <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">Only super administrators can access this page.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">Organizations</h1>
            <p className="text-sm md:text-base text-muted-foreground mt-1 md:mt-2">Manage clinics, users, and access roles</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                Add Organization
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{selectedOrg ? 'Edit Organization' : 'Add New Organization'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Organization Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input
                      id="country"
                      value={formData.country}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hair">Hair</SelectItem>
                      <SelectItem value="dental">Dental</SelectItem>
                      <SelectItem value="aesthetic">Aesthetic</SelectItem>
                    </SelectContent>
                  </Select>
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
                    {selectedOrg ? 'Update' : 'Create'} Organization
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search organizations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="bg-card rounded-lg border overflow-x-auto">
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow>
                <TableHead>Organization</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Loading organizations...
                  </TableCell>
                </TableRow>
              ) : filteredOrganizations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No organizations found
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrganizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary" />
                        <span className="font-medium">{org.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {org.category && (
                        <Badge 
                          variant="outline" 
                          className={categoryColors[org.category] || ''}
                        >
                          {categoryLabels[org.category] || org.category}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm">
                        {org.email && <div className="text-muted-foreground">{org.email}</div>}
                        {org.phone && <div className="text-muted-foreground">{org.phone}</div>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {org.city && org.country ? `${org.city}, ${org.country}` : org.country || '-'}
                    </TableCell>
                    <TableCell>
                      {org.is_active ? (
                        <Badge className="bg-success/10 text-success">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="w-3 h-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(org.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => handleApiSettings(org, e)}
                        >
                          <Settings className="w-4 h-4 mr-1" />
                          API
                        </Button>
                        <OrganizationUsers 
                          organizationId={org.id} 
                          organizationName={org.name}
                        />
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(org);
                          }}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => handleDeleteClick(org, e)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* API Settings Dialog */}
        <Dialog open={isApiDialogOpen} onOpenChange={setIsApiDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>API Settings - {selectedOrg?.name}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleApiSubmit} className="space-y-4">
              <div className="space-y-4">
                <div className="border-b pb-3">
                  <h3 className="font-semibold mb-3">WhatsApp Business API</h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="wa_access_token">Access Token</Label>
                      <Textarea
                        id="wa_access_token"
                        value={apiFormData.wa_access_token}
                        onChange={(e) => setApiFormData({ ...apiFormData, wa_access_token: e.target.value })}
                        placeholder="Enter WhatsApp Access Token"
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="wa_phone_number_id">Phone Number ID</Label>
                      <Input
                        id="wa_phone_number_id"
                        value={apiFormData.wa_phone_number_id}
                        onChange={(e) => setApiFormData({ ...apiFormData, wa_phone_number_id: e.target.value })}
                        placeholder="Enter Phone Number ID"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-3">Facebook Ads API</h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="fb_ad_account_id">Ad Account ID</Label>
                      <Input
                        id="fb_ad_account_id"
                        value={apiFormData.fb_ad_account_id}
                        onChange={(e) => setApiFormData({ ...apiFormData, fb_ad_account_id: e.target.value })}
                        placeholder="act_123456789"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fb_page_access_token">Page Access Token</Label>
                      <Textarea
                        id="fb_page_access_token"
                        value={apiFormData.fb_page_access_token}
                        onChange={(e) => setApiFormData({ ...apiFormData, fb_page_access_token: e.target.value })}
                        placeholder="Enter Facebook Page Access Token"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsApiDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  Save API Settings
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Organization</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{orgToDelete?.name}"? This action cannot be undone. 
                All associated data (patients, appointments, leads, etc.) may also be affected.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setOrgToDelete(null)}>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
