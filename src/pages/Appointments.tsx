import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar as CalendarIcon, Clock, User, MapPin, Hotel, Car, FileText, ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, startOfWeek, isSameDay, isToday, parseISO } from 'date-fns';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface Appointment {
  id: string;
  appointment_date: string;
  duration_minutes: number;
  status: string;
  notes: string | null;
  patients: {
    first_name: string;
    last_name: string;
  } | null;
  treatments: {
    name: string;
  } | null;
  hotels: {
    hotel_name: string;
    address: string | null;
  } | null;
  transfer_services: {
    company_name: string;
    service_type: string | null;
  } | null;
}

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  completed: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-gray-100 text-gray-800',
};

export default function Appointments() {
  const { profile, isSuperAdmin } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [upcomingOpen, setUpcomingOpen] = useState(false);
  const { toast } = useToast();

  // Generate 14 days starting from today
  const generateDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
      days.push(addDays(today, i));
    }
    return days;
  };

  const [carouselDays] = useState(generateDays());

  useEffect(() => {
    loadAppointments();
    loadUpcomingAppointments();
  }, [profile, selectedDate]);

  const loadAppointments = async () => {
    if (!profile) return;

    try {
      setLoading(true);
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);

      let query = supabase
        .from('appointments')
        .select(`
          *,
          patients (first_name, last_name, phone, email),
          treatments (name, base_price, duration_minutes),
          hotels (hotel_name, address, price_per_night),
          transfer_services (company_name, service_type, price)
        `)
        .gte('appointment_date', startOfDay.toISOString())
        .lte('appointment_date', endOfDay.toISOString())
        .order('appointment_date');

      if (!isSuperAdmin && profile.organization_id) {
        query = query.eq('organization_id', profile.organization_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAppointments(data || []);
    } catch (error) {
      console.error('Error loading appointments:', error);
      toast({
        title: "Error",
        description: "Failed to load appointments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadUpcomingAppointments = async () => {
    if (!profile) return;

    try {
      // Get next 3 upcoming appointments after today
      const tomorrow = new Date(selectedDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);

      let query = supabase
        .from('appointments')
        .select(`
          *,
          patients (first_name, last_name, phone, email),
          treatments (name, base_price, duration_minutes),
          hotels (hotel_name, address, price_per_night),
          transfer_services (company_name, service_type, price)
        `)
        .gte('appointment_date', tomorrow.toISOString())
        .eq('status', 'scheduled')
        .order('appointment_date')
        .limit(3);

      if (!isSuperAdmin && profile.organization_id) {
        query = query.eq('organization_id', profile.organization_id);
      }

      const { data, error } = await query;

      if (error) throw error;
      setUpcomingAppointments(data || []);
    } catch (error) {
      console.error('Error loading upcoming appointments:', error);
    }
  };

  const handleAppointmentClick = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setDetailsOpen(true);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Appointments</h1>
            <p className="text-muted-foreground mt-2">Schedule and manage patient appointments</p>
          </div>
          
          {/* Date Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <CalendarIcon className="w-4 h-4" />
                {format(selectedDate, 'PPP')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Date Carousel */}
        <Card>
          <CardContent className="pt-6">
            <Carousel
              opts={{
                align: "start",
              }}
              className="w-full"
            >
              <CarouselContent>
                {carouselDays.map((day, index) => {
                  const isSelected = isSameDay(day, selectedDate);
                  const dayIsToday = isToday(day);
                  
                  return (
                    <CarouselItem key={index} className="basis-1/7 md:basis-1/10">
                      <div
                        onClick={() => setSelectedDate(day)}
                        className={cn(
                          "cursor-pointer rounded-lg border p-3 text-center transition-all hover:border-primary",
                          isSelected && "border-primary bg-primary/10",
                          dayIsToday && !isSelected && "border-primary/50"
                        )}
                      >
                        <div className="text-xs text-muted-foreground mb-1">
                          {format(day, 'EEE')}
                        </div>
                        <div className={cn(
                          "text-lg font-bold",
                          isSelected && "text-primary"
                        )}>
                          {format(day, 'd')}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {format(day, 'MMM')}
                        </div>
                      </div>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </CardContent>
        </Card>

        {/* Appointments List for Selected Date */}
        <Card>
          <CardHeader>
            <CardTitle>
              Appointments for {format(selectedDate, 'MMMM dd, yyyy')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">Loading appointments...</div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No appointments scheduled for this date
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((apt) => (
                  <div
                    key={apt.id}
                    onClick={() => handleAppointmentClick(apt)}
                    className="border rounded-lg p-4 hover:bg-accent/5 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="flex flex-col">
                          <span className="text-lg font-semibold">
                            {format(new Date(apt.appointment_date), 'p')}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {apt.duration_minutes} min
                          </span>
                        </div>
                        <div className="h-12 w-px bg-border" />
                        <div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-primary" />
                            <span className="font-medium">
                              {apt.patients?.first_name} {apt.patients?.last_name}
                            </span>
                          </div>
                          {apt.treatments && (
                            <div className="text-sm text-muted-foreground mt-1">
                              {apt.treatments.name}
                            </div>
                          )}
                        </div>
                      </div>
                      <Badge className={statusColors[apt.status]}>
                        {apt.status}
                      </Badge>
                    </div>

                    <div className="flex gap-4 text-xs text-muted-foreground mt-3">
                      {apt.hotels && (
                        <div className="flex items-center gap-1">
                          <Hotel className="w-3 h-3" />
                          <span>{apt.hotels.hotel_name}</span>
                        </div>
                      )}
                      {apt.transfer_services && (
                        <div className="flex items-center gap-1">
                          <Car className="w-3 h-3" />
                          <span>{apt.transfer_services.company_name}</span>
                        </div>
                      )}
                    </div>

                    {apt.notes && (
                      <div className="mt-2 text-sm text-muted-foreground line-clamp-1">
                        <FileText className="w-3 h-3 inline mr-1" />
                        {apt.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Appointments Collapsible */}
        {upcomingAppointments.length > 0 && (
          <Collapsible open={upcomingOpen} onOpenChange={setUpcomingOpen}>
            <Card>
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-accent/5 transition-colors">
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                      Upcoming Appointments ({upcomingAppointments.length})
                    </span>
                    {upcomingOpen ? (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    )}
                  </CardTitle>
                </CardHeader>
              </CollapsibleTrigger>
              
              {/* Preview when collapsed */}
              {!upcomingOpen && (
                <CardContent className="pt-0">
                  <div className="space-y-2">
                    {upcomingAppointments.map((apt) => (
                      <div
                        key={apt.id}
                        onClick={() => handleAppointmentClick(apt)}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted/30 hover:bg-accent/10 cursor-pointer transition-colors text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <div className="text-muted-foreground font-mono">
                            {format(new Date(apt.appointment_date), 'dd MMM')}
                          </div>
                          <div className="font-medium">
                            {format(new Date(apt.appointment_date), 'HH:mm')}
                          </div>
                          <div className="text-muted-foreground">
                            {apt.patients?.first_name} {apt.patients?.last_name}
                          </div>
                        </div>
                        <Badge className={cn(statusColors[apt.status], "text-xs")}>
                          {apt.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}

              <CollapsibleContent>
                <CardContent className="pt-0 space-y-3">
                  {upcomingAppointments.map((apt) => (
                    <div
                      key={apt.id}
                      onClick={() => handleAppointmentClick(apt)}
                      className="border rounded-lg p-4 hover:bg-accent/5 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="flex flex-col">
                            <span className="text-lg font-semibold">
                              {format(new Date(apt.appointment_date), 'p')}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(apt.appointment_date), 'PPP')}
                            </span>
                          </div>
                          <div className="h-12 w-px bg-border" />
                          <div>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-primary" />
                              <span className="font-medium">
                                {apt.patients?.first_name} {apt.patients?.last_name}
                              </span>
                            </div>
                            {apt.treatments && (
                              <div className="text-sm text-muted-foreground mt-1">
                                {apt.treatments.name}
                              </div>
                            )}
                          </div>
                        </div>
                        <Badge className={statusColors[apt.status]}>
                          {apt.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        )}
      </div>

      {/* Appointment Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          
          {selectedAppointment && (
            <div className="space-y-4">
              {/* Date & Time */}
              <div className="flex items-center gap-2 p-3 bg-accent/10 rounded-lg">
                <CalendarIcon className="w-5 h-5 text-primary" />
                <div>
                  <div className="font-semibold">
                    {format(new Date(selectedAppointment.appointment_date), 'PPP')}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {format(new Date(selectedAppointment.appointment_date), 'p')} ({selectedAppointment.duration_minutes} minutes)
                  </div>
                </div>
              </div>

              {/* Patient Info */}
              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <User className="w-5 h-5 text-primary" />
                  Patient Information
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Name:</span>
                    <div className="font-medium">
                      {selectedAppointment.patients?.first_name} {selectedAppointment.patients?.last_name}
                    </div>
                  </div>
                </div>
              </div>

              {/* Treatment Info */}
              {selectedAppointment.treatments && (
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <MapPin className="w-5 h-5 text-primary" />
                    Treatment
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">{selectedAppointment.treatments.name}</div>
                  </div>
                </div>
              )}

              {/* Hotel Info */}
              {selectedAppointment.hotels && (
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <Hotel className="w-5 h-5 text-primary" />
                    Hotel
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">{selectedAppointment.hotels.hotel_name}</div>
                    {selectedAppointment.hotels.address && (
                      <div className="text-muted-foreground">{selectedAppointment.hotels.address}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Transfer Info */}
              {selectedAppointment.transfer_services && (
                <div className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-center gap-2 font-semibold">
                    <Car className="w-5 h-5 text-primary" />
                    Transfer
                  </div>
                  <div className="text-sm">
                    <div className="font-medium">{selectedAppointment.transfer_services.company_name}</div>
                    <div className="text-muted-foreground">{selectedAppointment.transfer_services.service_type}</div>
                  </div>
                </div>
              )}

              {/* Status & Notes */}
              <div className="border rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Status</span>
                  <Badge className={statusColors[selectedAppointment.status]}>
                    {selectedAppointment.status}
                  </Badge>
                </div>
                {selectedAppointment.notes && (
                  <div className="pt-2">
                    <div className="text-sm font-semibold mb-1">Notes:</div>
                    <div className="text-sm text-muted-foreground">{selectedAppointment.notes}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
