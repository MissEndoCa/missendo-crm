import { ReactNode, useEffect, useState, memo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Outlet } from 'react-router-dom';
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
  Handshake,
  ImageIcon,
} from 'lucide-react';
import { signOut } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import missEndoLogo from '@/assets/miss-endo-logo.webp';
import { useIsMobile } from '@/hooks/use-mobile';

interface LayoutProps {
  children?: ReactNode;
}

interface SidebarContentProps {
  initials: string;
  isSuperAdmin: boolean;
  locationPath: string;
  profileName: string;
  profileEmail: string;
  onNavigate: (path: string) => void;
  onCloseMobile: () => void;
  onSignOut: () => void;
}

function SidebarContent({
  initials,
  isSuperAdmin,
  locationPath,
  profileName,
  profileEmail,
  onNavigate,
  onCloseMobile,
  onSignOut,
}: SidebarContentProps) {
  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/leads', icon: ClipboardList, label: 'Leads' },
    { path: '/patients', icon: Users, label: 'Patients' },
    { path: '/appointments', icon: Calendar, label: 'Appointments' },
    { path: '/meetings', icon: Handshake, label: 'Meetings' },
  ];

  if (isSuperAdmin) {
    navItems.push({ path: '/reminders', icon: Bell, label: 'Reminders' });
    navItems.push({ path: '/mailing', icon: Mail, label: 'Mailing' });
    if (profileEmail === 'info@talxmedia.com.tr') {
      navItems.push({ path: '/media', icon: ImageIcon, label: 'Media' });
    }
    navItems.push({ path: '/organizations', icon: Building2, label: 'Organizations' });
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b border-sidebar-border">
        <Link to="/dashboard" className="flex items-center justify-center" onClick={onCloseMobile}>
          <img src={missEndoLogo} alt="Miss Endo" className="h-10 w-auto" />
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = locationPath === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={onCloseMobile}
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

        <div className="pt-3 mt-3 border-t border-sidebar-border">
          <p className="px-3 text-[10px] font-semibold text-sidebar-foreground/50 uppercase mb-1.5">
            Services
          </p>
          {[
            { path: '/treatments', icon: Stethoscope, label: 'Treatments' },
            { path: '/transfers', icon: Car, label: 'Transfers' },
            { path: '/hotels', icon: Hotel, label: 'Hotels' },
            { path: '/accounting', icon: DollarSign, label: 'Accounting' },
            { path: '/settings', icon: Settings, label: 'Settings' },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = locationPath === item.path;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
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
        </div>
      </nav>

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
                <p className="text-xs font-medium text-sidebar-foreground truncate">{profileName}</p>
                <p className="text-[10px] text-sidebar-foreground/60 truncate">{profileEmail}</p>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onNavigate('/profile')}>
              <UserCircle className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onNavigate('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSignOut} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

function LayoutInner({ children }: LayoutProps) {
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

  const initials = profile
    ? `${profile.first_name[0]}${profile.last_name[0]}`
    : 'U';
  const profileName = profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown User';
  const profileEmail = profile?.email ?? '';
  const handleNavigate = (path: string) => {
    navigate(path);
    if (isMobile) setSidebarOpen(false);
  };
  const handleCloseMobile = () => {
    if (isMobile) setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Sidebar (Sheet) */}
      {isMobile && (
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-64 p-0 bg-sidebar border-sidebar-border">
            <SheetHeader className="sr-only">
              <SheetTitle>Navigation Menu</SheetTitle>
            </SheetHeader>
            <SidebarContent
              initials={initials}
              isSuperAdmin={isSuperAdmin}
              locationPath={location.pathname}
              profileName={profileName}
              profileEmail={profileEmail}
              onNavigate={handleNavigate}
              onCloseMobile={handleCloseMobile}
              onSignOut={handleSignOut}
            />
          </SheetContent>
        </Sheet>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className="fixed inset-y-0 left-0 w-64 bg-sidebar border-r border-sidebar-border">
            <SidebarContent
              initials={initials}
              isSuperAdmin={isSuperAdmin}
              locationPath={location.pathname}
              profileName={profileName}
              profileEmail={profileEmail}
              onNavigate={handleNavigate}
              onCloseMobile={handleCloseMobile}
              onSignOut={handleSignOut}
            />
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
          {children || <Outlet />}
        </div>
      </main>
    </div>
  );
}

export default memo(LayoutInner);
