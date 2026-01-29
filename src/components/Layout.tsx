import { ReactNode, useEffect, useState } from 'react';
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
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
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
  Menu,
  Bell,
  Mail,
} from 'lucide-react';
import { signOut } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import missEndoLogo from '@/assets/miss-endo-logo.webp';
import { useIsMobile } from '@/hooks/use-mobile';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { profile, isSuperAdmin } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Auto-close sidebar on route change (mobile only)
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

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

  // Add super admin only items
  if (isSuperAdmin) {
    navItems.push({ path: '/reminders', icon: Bell, label: 'Reminders' });
    navItems.push({ path: '/mailing', icon: Mail, label: 'Mailing' });
    navItems.push({ path: '/organizations', icon: Building2, label: 'Organizations' });
  }

  const initials = profile
    ? `${profile.first_name[0]}${profile.last_name[0]}`
    : 'U';

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-3 border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center justify-center" onClick={() => isMobile && setSidebarOpen(false)}>
          <img src={missEndoLogo} alt="Miss Endo" className="h-10 w-auto" />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => isMobile && setSidebarOpen(false)}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors text-sm ${
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}

        {/* Services Section */}
        <div className="pt-3 mt-3 border-t border-sidebar-border">
          <p className="px-3 text-[10px] font-semibold text-sidebar-foreground/50 uppercase mb-1.5">
            Services
          </p>
          <Link
            to="/treatments"
            onClick={() => isMobile && setSidebarOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors text-sm ${
              location.pathname === '/treatments'
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span className="font-medium">Treatments</span>
          </Link>
          <Link
            to="/transfers"
            onClick={() => isMobile && setSidebarOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors text-sm ${
              location.pathname === '/transfers'
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
            }`}
          >
            <Car className="w-4 h-4" />
            <span className="font-medium">Transfers</span>
          </Link>
          <Link
            to="/hotels"
            onClick={() => isMobile && setSidebarOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors text-sm ${
              location.pathname === '/hotels'
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
            }`}
          >
            <Hotel className="w-4 h-4" />
            <span className="font-medium">Hotels</span>
          </Link>
          <Link
            to="/accounting"
            onClick={() => isMobile && setSidebarOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors text-sm ${
              location.pathname === '/accounting'
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span className="font-medium">Accounting</span>
          </Link>
          <Link
            to="/settings"
            onClick={() => isMobile && setSidebarOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2 rounded-md transition-colors text-sm ${
              location.pathname === '/settings'
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span className="font-medium">Settings</span>
          </Link>
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-3 border-t border-sidebar-border">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-2.5 px-3 py-2.5 h-auto">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-medium text-sidebar-foreground truncate">
                  {profile?.first_name} {profile?.last_name}
                </p>
                <p className="text-[10px] text-sidebar-foreground/60 truncate">{profile?.email}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => { navigate('/profile'); isMobile && setSidebarOpen(false); }}>
              <UserCircle className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { navigate('/settings'); isMobile && setSidebarOpen(false); }}>
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
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Sidebar (Sheet) */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation Menu</SheetTitle>
            </SheetHeader>
            <SidebarContent />
          </SheetContent>
        </Sheet>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="fixed inset-y-0 left-0 w-64 bg-sidebar border-r border-sidebar-border">
          <SidebarContent />
        </aside>
      )}

      {/* Main Content */}
      <main className={`min-h-screen ${isMobile ? '' : 'ml-64'}`}>
        {/* Mobile Header with Menu Button */}
        {isMobile ? (
          <header className="h-16 border-b border-border bg-card flex items-center justify-between px-4">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
              <Menu className="h-6 w-6" />
            </Button>
            <img src={missEndoLogo} alt="Miss Endo" className="h-8 w-auto" />
            <div className="w-10" /> {/* Spacer for centering logo */}
          </header>
        ) : (
          <Header />
        )}
        <div className={`${isMobile ? 'p-4' : 'p-8'}`}>
          {children}
        </div>
      </main>
    </div>
  );
}
