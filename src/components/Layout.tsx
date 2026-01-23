import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Settings,
  Building2,
  LogOut,
  UserCircle,
  ClipboardList,
  Stethoscope,
  Car,
  Hotel,
  DollarSign,
} from 'lucide-react';
import { signOut } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import missEndoLogo from '@/assets/miss-endo-logo.webp';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { profile, isSuperAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
    navigate('/auth');
  };

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/leads', icon: ClipboardList, label: 'Leads' },
    { path: '/patients', icon: Users, label: 'Patients' },
    { path: '/appointments', icon: Calendar, label: 'Appointments' },
  ];

  // Add organization management for super admins
  if (isSuperAdmin) {
    navItems.push({ path: '/organizations', icon: Building2, label: 'Organizations' });
  }

  const initials = profile
    ? `${profile.first_name[0]}${profile.last_name[0]}`
    : 'U';

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-sidebar border-r border-sidebar-border">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-4 border-b border-sidebar-border">
            <Link to="/dashboard" className="flex items-center justify-center">
              <img src={missEndoLogo} alt="Miss Endo" className="h-14 w-auto" />
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}

            {/* Services Section */}
            <div className="pt-4 mt-4 border-t border-sidebar-border">
              <p className="px-4 text-xs font-semibold text-sidebar-foreground/50 uppercase mb-2">
                Services
              </p>
              <Link
                to="/treatments"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === '/treatments'
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                }`}
              >
                <Stethoscope className="w-5 h-5" />
                <span className="font-medium">Treatments</span>
              </Link>
              <Link
                to="/transfers"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === '/transfers'
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                }`}
              >
                <Car className="w-5 h-5" />
                <span className="font-medium">Transfers</span>
              </Link>
              <Link
                to="/hotels"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === '/hotels'
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                }`}
              >
                <Hotel className="w-5 h-5" />
                <span className="font-medium">Hotels</span>
              </Link>
              <Link
                to="/accounting"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === '/accounting'
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                }`}
              >
                <DollarSign className="w-5 h-5" />
                <span className="font-medium">Accounting</span>
              </Link>
              <Link
                to="/settings"
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === '/settings'
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
                }`}
              >
                <Settings className="w-5 h-5" />
                <span className="font-medium">Settings</span>
              </Link>
            </div>
          </nav>

          {/* User Profile */}
          <div className="p-4 border-t border-sidebar-border">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-3 px-4 py-6 h-auto">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-sidebar-foreground">
                      {profile?.first_name} {profile?.last_name}
                    </p>
                    <p className="text-xs text-sidebar-foreground/60">{profile?.email}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/profile')}>
                  <UserCircle className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/settings')}>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 min-h-screen">
        <Header />
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
