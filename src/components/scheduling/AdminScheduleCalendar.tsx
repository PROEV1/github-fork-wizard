import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, momentLocalizer, View } from 'react-big-calendar';
import moment from 'moment';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CalendarFilters } from './CalendarFilters';
import { UnassignedJobsSidebar } from './UnassignedJobsSidebar';
import { JobCard } from './JobCard';
import { SmartAssignmentModal } from './SmartAssignmentModal';
import { 
  Order, 
  Engineer, 
  formatOrderForCalendar, 
  updateOrderAssignment,
  getStatusColor 
} from '@/utils/schedulingUtils';
import { toast } from 'sonner';
import 'react-big-calendar/lib/css/react-big-calendar.css';

const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: {
    order: Order;
    engineerId?: string;
    status: string;
    conflicts: any[];
  };
}

export function AdminScheduleCalendar() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isAssignmentModalOpen, setIsAssignmentModalOpen] = useState(false);
  const [view, setView] = useState<View>('month');
  const [date, setDate] = useState(new Date());
  const [filters, setFilters] = useState({
    engineerId: 'all-engineers',
    region: 'all-regions',
    status: 'all-statuses'
  });
  const [loading, setLoading] = useState(true);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Load orders with related data
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          client:clients(*),
          engineer:engineers(*)
        `)
        .order('scheduled_install_date', { ascending: true });

      if (ordersError) throw ordersError;

      // Load engineers
      const { data: engineersData, error: engineersError } = await supabase
        .from('engineers')
        .select('*')
        .eq('availability', true);

      if (engineersError) throw engineersError;

      setOrders(ordersData || []);
      setEngineers(engineersData || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load scheduling data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Filter and format events
  useEffect(() => {
    let filteredOrders = orders.filter(order => 
      order.scheduled_install_date && order.engineer_id
    );

    // Apply filters
    if (filters.engineerId && filters.engineerId !== 'all-engineers') {
      filteredOrders = filteredOrders.filter(order => 
        order.engineer_id === filters.engineerId
      );
    }

    if (filters.region && filters.region !== 'all-regions') {
      filteredOrders = filteredOrders.filter(order => 
        order.engineer?.region === filters.region
      );
    }

    if (filters.status && filters.status !== 'all-statuses') {
      filteredOrders = filteredOrders.filter(order => 
        order.status_enhanced === filters.status
      );
    }

    const formattedEvents = filteredOrders.map(formatOrderForCalendar);
    setEvents(formattedEvents);
  }, [orders, filters]);

  // Handle drag and drop from sidebar
  const handleJobDrop = useCallback(async (
    orderId: string, 
    engineerId: string, 
    slotInfo: any
  ) => {
    try {
      await updateOrderAssignment(orderId, engineerId, slotInfo.start.toISOString());
      await loadData();
      toast.success('Job assigned successfully');
    } catch (error) {
      console.error('Error assigning job:', error);
      toast.error('Failed to assign job');
    }
  }, [loadData]);

  // Handle event selection
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedOrder(event.resource.order);
    setIsAssignmentModalOpen(true);
  }, []);

  // Handle slot selection (for new assignments)
  const handleSelectSlot = useCallback((slotInfo: any) => {
    // Could open a modal to select which unassigned job to place here
    console.log('Slot selected:', slotInfo);
  }, []);

  // Custom event component
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const hasConflicts = event.resource.conflicts.length > 0;
    
    return (
      <div className={`
        p-1 rounded text-xs font-medium
        ${hasConflicts ? 'border-2 border-destructive' : ''}
      `}>
        <div className="flex items-center gap-1">
          {hasConflicts && (
            <span className="text-destructive">⚠️</span>
          )}
          <span className="truncate">{event.title}</span>
        </div>
        {event.resource.order.time_window && (
          <div className="text-xs opacity-75">
            {event.resource.order.time_window}
          </div>
        )}
      </div>
    );
  };

  // Custom event style getter
  const eventStyleGetter = (event: CalendarEvent) => {
    const backgroundColor = getStatusColor(event.resource.status);
    const hasConflicts = event.resource.conflicts.length > 0;
    
    return {
      style: {
        backgroundColor,
        borderRadius: '4px',
        opacity: 0.8,
        border: hasConflicts ? '2px solid hsl(var(--destructive))' : 'none',
        fontSize: '12px'
      }
    };
  };

  const unassignedOrders = orders.filter(order => 
    !order.engineer_id && order.status_enhanced === 'awaiting_install_booking'
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading schedule...</p>
        </div>
      </div>
    );
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Smart Job Scheduling</h1>
          <Button onClick={loadData} variant="outline">
            Refresh
          </Button>
        </div>

        <CalendarFilters
          engineers={engineers}
          filters={filters}
          onFiltersChange={setFilters}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <UnassignedJobsSidebar
              orders={unassignedOrders}
              engineers={engineers}
              onJobDrop={handleJobDrop}
            />
          </div>

          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Schedule Calendar
                  <div className="flex gap-2">
                    <Button
                      variant={view === 'month' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setView('month')}
                    >
                      Month
                    </Button>
                    <Button
                      variant={view === 'week' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setView('week')}
                    >
                      Week
                    </Button>
                    <Button
                      variant={view === 'day' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setView('day')}
                    >
                      Day
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ height: '600px' }}>
                  <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    view={view}
                    onView={setView}
                    date={date}
                    onNavigate={setDate}
                    onSelectEvent={handleSelectEvent}
                    onSelectSlot={handleSelectSlot}
                    selectable
                    popup
                    components={{
                      event: EventComponent,
                    }}
                    eventPropGetter={eventStyleGetter}
                    step={30}
                    timeslots={2}
                    min={new Date(0, 0, 0, 8, 0, 0)}
                    max={new Date(0, 0, 0, 18, 0, 0)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {selectedOrder && (
          <SmartAssignmentModal
            isOpen={isAssignmentModalOpen}
            onClose={() => {
              setIsAssignmentModalOpen(false);
              setSelectedOrder(null);
            }}
            order={selectedOrder}
            engineers={engineers}
            onAssign={async (engineerId, date) => {
              await updateOrderAssignment(selectedOrder.id, engineerId, date);
              await loadData();
              toast.success('Job reassigned successfully');
            }}
          />
        )}
      </div>
    </DndProvider>
  );
}