import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Users, Mail, Phone, KeyRound, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useAuth } from '@/contexts/AuthContext';
import { AppRole } from '@/lib/auth';

interface OrganizationUsersProps {
  organizationId: string;
  organizationName: string;
}

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  roles: string[];
}

interface PasswordResetDialogProps {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

function PasswordResetDialog({ user, onClose, onSuccess }: PasswordResetDialogProps) {
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(
        `https://xzcpxatfzgusrxfreeoi.supabase.co/functions/v1/update-user-password`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            newPassword,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to update password');
      }

      toast({
        title: "Success",
        description: `Password updated for ${user.first_name} ${user.last_name}`,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update password",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Reset Password - {user.first_name} {user.last_name}</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="newPassword">New Password *</Label>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Enter new password (min 6 characters)"
          />
          <p className="text-sm text-muted-foreground">
            The user will be able to login with this new password immediately.
          </p>
        </div>

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Updating...' : 'Update Password'}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
}

export default function OrganizationUsers({ organizationId, organizationName }: OrganizationUsersProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUsersDialogOpen, setIsUsersDialogOpen] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState<User | null>(null);
  const [selectedUserForRoleEdit, setSelectedUserForRoleEdit] = useState<User | null>(null);
  const [newRoleForUser, setNewRoleForUser] = useState<AppRole>('clinic_user');
  const { toast } = useToast();
  const { isSuperAdmin, isClinicAdmin } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    role: 'clinic_user' as AppRole,
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      console.log('Loading users for organization:', organizationId);
      
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .eq('organization_id', organizationId);

      if (profilesError) {
        console.error('Profiles fetch error:', profilesError);
        throw profilesError;
      }

      console.log('Profiles loaded:', profiles?.length);

      // Fetch user roles for these users
      const userIds = (profiles || []).map(p => p.id);
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      if (rolesError) {
        console.error('Roles fetch error:', rolesError);
        throw rolesError;
      }

      console.log('Roles loaded:', roles?.length);

      // Combine data
      const usersWithRoles = (profiles || []).map(profile => ({
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
        phone: profile.phone,
        is_active: profile.is_active,
        created_at: profile.created_at,
        roles: (roles || [])
          .filter(r => r.user_id === profile.id)
          .map(r => r.role),
      }));

      console.log('Users with roles:', usersWithRoles);
      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isUsersDialogOpen) {
      loadUsers();
    }
  }, [isUsersDialogOpen, organizationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: {
          email: formData.email,
          password: formData.password,
          firstName: formData.first_name,
          lastName: formData.last_name,
          phone: formData.phone,
          role: formData.role,
          organizationId: organizationId,
        },
      });

      if (error) {
        // supabase-js wraps edge function failures in a FunctionsHttpError
        const message = (error as any)?.context?.error || error.message || 'Failed to create user';
        throw new Error(message);
      }

      toast({
        title: 'Success',
        description: (data as any)?.message || 'User created successfully',
      });

      setIsDialogOpen(false);
      resetForm();
      await loadUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create user',
        variant: 'destructive',
      });
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      phone: '',
      role: 'clinic_user',
    });
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'super_admin':
        return 'bg-destructive/10 text-destructive';
      case 'clinic_admin':
        return 'bg-primary/10 text-primary';
      default:
        return 'bg-secondary';
    }
  };

  const handleResetPasswordClick = (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedUserForReset(user);
  };

  const handleEditRoleClick = (user: User, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedUserForRoleEdit(user);
    setNewRoleForUser(user.roles[0] as AppRole || 'clinic_user');
  };

  const handleUpdateRole = async () => {
    if (!selectedUserForRoleEdit) return;

    try {
      // Delete existing roles for this user in this organization
      const { error: deleteError } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', selectedUserForRoleEdit.id)
        .eq('organization_id', organizationId);

      if (deleteError) throw deleteError;

      // Insert new role
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert({
          user_id: selectedUserForRoleEdit.id,
          role: newRoleForUser,
          organization_id: organizationId,
        });

      if (insertError) throw insertError;

      toast({
        title: "Success",
        description: "User role updated successfully",
      });

      setSelectedUserForRoleEdit(null);
      await loadUsers();
    } catch (error: any) {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update role",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Dialog open={isUsersDialogOpen} onOpenChange={setIsUsersDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
            <Users className="w-4 h-4 mr-2" />
            Users
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{organizationName} - Users</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex justify-end">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm}>
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="first_name">First Name *</Label>
                        <Input
                          id="first_name"
                          value={formData.first_name}
                          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="last_name">Last Name *</Label>
                        <Input
                          id="last_name"
                          value={formData.last_name}
                          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="password">Password *</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        minLength={6}
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

                    <div className="space-y-2">
                      <Label htmlFor="role">Role *</Label>
                      <Select value={formData.role} onValueChange={(value: AppRole) => setFormData({ ...formData, role: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {isSuperAdmin && (
                            <SelectItem value="super_admin">Super Admin</SelectItem>
                          )}
                          <SelectItem value="clinic_admin">Clinic Admin</SelectItem>
                          <SelectItem value="clinic_user">Clinic User</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit">Create User</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        Loading users...
                      </TableCell>
                    </TableRow>
                  ) : users.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No users found
                      </TableCell>
                    </TableRow>
                  ) : (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.first_name} {user.last_name}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </div>
                            {user.phone && (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Phone className="w-3 h-3" />
                                {user.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {user.roles.map((role) => (
                              <Badge key={role} className={getRoleBadgeColor(role)}>
                                {role.replace('_', ' ')}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.is_active ? "default" : "secondary"}>
                            {user.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(user.created_at), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            {(isSuperAdmin || isClinicAdmin) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => handleEditRoleClick(user, e)}
                              >
                                <Edit className="w-3 h-3 mr-2" />
                                Edit Role
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => handleResetPasswordClick(user, e)}
                            >
                              <KeyRound className="w-3 h-3 mr-2" />
                              Reset Password
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Password Reset Dialog */}
      <Dialog open={!!selectedUserForReset} onOpenChange={() => setSelectedUserForReset(null)}>
        {selectedUserForReset && (
          <PasswordResetDialog
            user={selectedUserForReset}
            onClose={() => setSelectedUserForReset(null)}
            onSuccess={loadUsers}
          />
        )}
      </Dialog>

      {/* Edit Role Dialog */}
      <Dialog open={!!selectedUserForRoleEdit} onOpenChange={() => setSelectedUserForRoleEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Edit Role - {selectedUserForRoleEdit?.first_name} {selectedUserForRoleEdit?.last_name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newRole">Select New Role</Label>
              <Select value={newRoleForUser} onValueChange={(value: AppRole) => setNewRoleForUser(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {isSuperAdmin && (
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  )}
                  <SelectItem value="clinic_admin">Clinic Admin</SelectItem>
                  <SelectItem value="clinic_user">Clinic User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setSelectedUserForRoleEdit(null)}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateRole}>
                Update Role
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
