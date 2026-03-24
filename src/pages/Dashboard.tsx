import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ClipboardList, Calendar, DollarSign, TrendingUp, Activity } from 'lucide-react';


interface DashboardStats {
  totalLeads: number;
  newLeads: number;
  totalPatients: number;
  upcomingAppointments: number;
  totalRevenue: number;
  monthlyGrowth: number;
  conversionRate: number;
  avgTreatmentValue: number;
}

interface RecentActivity {
  id: string;
  type: 'lead' | 'appointment' | 'patient';
  message: string;
  time: Date;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { profile, isSuperAdmin } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalLeads: 0,
    newLeads: 0,
    totalPatients: 0,
    upcomingAppointments: 0,
    totalRevenue: 0,
    monthlyGrowth: 0,
    conversionRate: 0,
    avgTreatmentValue: 0,
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardStats();
    loadRecentActivities();
  }, [profile]);

  const loadRecentActivities = async () => {
    if (!profile) return;

    try {
      const organizationFilter = isSuperAdmin 
        ? {} 
        : { organization_id: profile.organization_id };

      // Get recent leads (last 5)
      const { data: recentLeads } = await supabase
        .from('leads')
        .select('id, first_name, last_name, created_at')
        .match(organizationFilter)
        .order('created_at', { ascending: false })
        .limit(5);

      // Get recent appointments (last 5)
      const { data: recentAppointments } = await supabase
        .from('appointments')
        .select('id, created_at, patients(first_name, last_name)')
        .match(organizationFilter)
        .order('created_at', { ascending: false })
        .limit(5);

      // Get recent patients (last 5)
      const { data: recentPatients } = await supabase
        .from('patients')
        .select('id, first_name, last_name, created_at')
        .match(organizationFilter)
        .order('created_at', { ascending: false })
        .limit(5);

      // Combine and sort all activities
      const activities: RecentActivity[] = [];

      recentLeads?.forEach(lead => {
        activities.push({
          id: lead.id,
          type: 'lead',
          message: `New lead: ${lead.first_name} ${lead.last_name}`,
          time: new Date(lead.created_at),
        });
      });

      recentAppointments?.forEach(apt => {
        const patientName = apt.patients 
          ? `${apt.patients.first_name} ${apt.patients.last_name}`
          : 'Unknown';
        activities.push({
          id: apt.id,
          type: 'appointment',
          message: `Appointment scheduled for ${patientName}`,
          time: new Date(apt.created_at),
        });
      });

      recentPatients?.forEach(patient => {
        activities.push({
          id: patient.id,
          type: 'patient',
          message: `New patient: ${patient.first_name} ${patient.last_name}`,
          time: new Date(patient.created_at),
        });
      });

      // Sort by time and take latest 5
      activities.sort((a, b) => b.time.getTime() - a.time.getTime());
      setRecentActivities(activities.slice(0, 5));
    } catch (error) {
      console.error('Error loading recent activities:', error);
    }
  };

  const loadDashboardStats = async () => {
    if (!profile) return;

    try {
      const organizationFilter = isSuperAdmin 
        ? {} 
        : { organization_id: profile.organization_id };

      // Get leads stats
      const { count: totalLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .match(organizationFilter);

      const { count: newLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .match({ ...organizationFilter, status: 'new' });

      const { count: convertedLeads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .match({ ...organizationFilter, status: 'converted' });

      // Get patients count
      const { count: totalPatients } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .match(organizationFilter);

      // Get upcoming appointments
      const { count: upcomingAppointments } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .match({ ...organizationFilter, status: 'scheduled' })
        .gte('appointment_date', new Date().toISOString());

      // Get revenue from patient treatments
      const { data: treatmentData } = await supabase
        .from('patient_treatments')
        .select('final_price, patients!inner(organization_id)')
        .match(isSuperAdmin ? {} : { 'patients.organization_id': profile.organization_id });

      const totalRevenue = treatmentData?.reduce((sum, record) => sum + Number(record.final_price || 0), 0) || 0;
      const avgTreatmentValue = treatmentData && treatmentData.length > 0 
        ? totalRevenue / treatmentData.length 
        : 0;

      // Calculate conversion rate
      const conversionRate = totalLeads && totalLeads > 0
        ? ((convertedLeads || 0) / totalLeads) * 100
        : 0;

      // Calculate monthly growth (comparing last 30 days with previous 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const { count: recentPatients } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .match(organizationFilter)
        .gte('created_at', thirtyDaysAgo.toISOString());

      const { count: previousPatients } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true })
        .match(organizationFilter)
        .gte('created_at', sixtyDaysAgo.toISOString())
        .lt('created_at', thirtyDaysAgo.toISOString());

      const monthlyGrowth = previousPatients && previousPatients > 0
        ? (((recentPatients || 0) - previousPatients) / previousPatients) * 100
        : 0;

      setStats({
        totalLeads: totalLeads || 0,
        newLeads: newLeads || 0,
        totalPatients: totalPatients || 0,
        upcomingAppointments: upcomingAppointments || 0,
        totalRevenue,
        monthlyGrowth,
        conversionRate,
        avgTreatmentValue,
      });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Leads',
      value: stats.totalLeads,
      subtitle: `${stats.newLeads} new`,
      icon: ClipboardList,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
      link: '/leads',
    },
    {
      title: 'Patients',
      value: stats.totalPatients,
      subtitle: 'Active patients',
      icon: Users,
      color: 'text-accent',
      bgColor: 'bg-accent/10',
      link: '/patients',
    },
    {
      title: 'Appointments',
      value: stats.upcomingAppointments,
      subtitle: 'Upcoming',
      icon: Calendar,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      link: '/appointments',
    },
    {
      title: 'Revenue',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      subtitle: `${stats.monthlyGrowth >= 0 ? '+' : ''}${stats.monthlyGrowth.toFixed(1)}% this month`,
      icon: DollarSign,
      color: 'text-success',
      bgColor: 'bg-success/10',
      link: '/accounting',
    },
  ];

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'lead': return 'bg-success';
      case 'appointment': return 'bg-primary';
      case 'patient': return 'bg-warning';
      default: return 'bg-muted';
    }
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    const days = Math.floor(hours / 24);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  return (
    <>
      <div className="space-y-6 md:space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1 md:mt-2">
            Welcome back, {profile?.first_name}! Here's your overview.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card 
                key={stat.title} 
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => navigate(stat.link)}
              >
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{loading ? '...' : stat.value}</div>
                  <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Activity Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {recentActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No recent activity
                </p>
              ) : (
                <div className="space-y-4">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                      <div className={`w-2 h-2 ${getActivityColor(activity.type)} rounded-full`} />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.message}</p>
                        <p className="text-xs text-muted-foreground">{getTimeAgo(activity.time)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-success" />
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Conversion Rate</span>
                  <span className="text-sm font-bold text-success">
                    {loading ? '...' : `${stats.conversionRate.toFixed(1)}%`}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Avg. Treatment Value</span>
                  <span className="text-sm font-bold text-primary">
                    {loading ? '...' : `$${stats.avgTreatmentValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Monthly Growth</span>
                  <span className={`text-sm font-bold ${stats.monthlyGrowth >= 0 ? 'text-success' : 'text-destructive'}`}>
                    {loading ? '...' : `${stats.monthlyGrowth >= 0 ? '+' : ''}${stats.monthlyGrowth.toFixed(1)}%`}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
