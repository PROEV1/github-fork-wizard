import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type DbOrder = Database['public']['Tables']['orders']['Row'];
type DbClient = Database['public']['Tables']['clients']['Row'];
type DbEngineer = Database['public']['Tables']['engineers']['Row'];

export interface Order extends DbOrder {
  client?: DbClient;
  engineer?: DbEngineer;
}

export interface Engineer extends DbEngineer {}

export interface ClientBlockedDate {
  id: string;
  client_id: string;
  blocked_date: string;
  reason?: string;
}

export interface SchedulingConflict {
  type: 'double_booking' | 'client_blocked' | 'outside_hours' | 'travel_conflict';
  severity: 'low' | 'medium' | 'high';
  message: string;
}

// Dummy distance calculation for postcode areas
export const calculateDistance = (postcode1?: string, postcode2?: string): number => {
  if (!postcode1 || !postcode2) return 0;
  
  const area1 = postcode1.substring(0, 2).toUpperCase();
  const area2 = postcode2.substring(0, 2).toUpperCase();
  
  // Simple distance lookup table for UK postcode areas
  const distanceMap: Record<string, Record<string, number>> = {
    'M1': { 'M2': 5, 'M3': 8, 'B1': 85, 'L1': 35, 'LS': 45 },
    'M2': { 'M1': 5, 'M3': 10, 'B1': 90, 'L1': 40, 'LS': 50 },
    'B1': { 'M1': 85, 'M2': 90, 'B2': 10, 'L1': 120, 'LS': 130 },
    'L1': { 'M1': 35, 'M2': 40, 'B1': 120, 'LS': 75 },
    'LS': { 'M1': 45, 'M2': 50, 'B1': 130, 'L1': 75 }
  };
  
  return distanceMap[area1]?.[area2] || Math.floor(Math.random() * 50) + 10;
};

// Calculate estimated travel time in minutes
export const calculateTravelTime = (distance: number): number => {
  // Assuming average speed of 30 mph in urban areas
  return Math.round((distance / 30) * 60);
};

// Get engineer availability for a specific date
export const getEngineerAvailability = async (engineerId: string, date: string) => {
  const dayOfWeek = new Date(date).getDay();
  
  const { data, error } = await supabase
    .from('engineer_availability')
    .select('*')
    .eq('engineer_id', engineerId)
    .eq('day_of_week', dayOfWeek)
    .eq('is_available', true);
  
  if (error) {
    console.error('Error fetching engineer availability:', error);
    return null;
  }
  
  return data?.[0] || null;
};

// Get client blocked dates
export const getClientBlockedDates = async (clientId: string) => {
  const { data, error } = await supabase
    .from('client_blocked_dates')
    .select('*')
    .eq('client_id', clientId);
  
  if (error) {
    console.error('Error fetching client blocked dates:', error);
    return [];
  }
  
  return data || [];
};

// Detect scheduling conflicts for an order
export const detectConflicts = async (orderId: string): Promise<SchedulingConflict[]> => {
  const { data, error } = await supabase
    .rpc('detect_scheduling_conflicts', { p_order_id: orderId });
  
  if (error) {
    console.error('Error detecting conflicts:', error);
    return [];
  }
  
  // Parse the JSONB response
  if (!data) return [];
  
  try {
    const conflicts = Array.isArray(data) ? data : [];
    return conflicts.map((conflict: any) => ({
      type: conflict.type,
      severity: conflict.severity,
      message: conflict.message
    }));
  } catch (e) {
    console.error('Error parsing conflicts:', e);
    return [];
  }
};

// Get engineer workload for a specific date
export const getEngineerWorkload = async (engineerId: string, date: string): Promise<number> => {
  const { data, error } = await supabase
    .rpc('get_engineer_daily_workload', { 
      p_engineer_id: engineerId, 
      p_date: date 
    });
  
  if (error) {
    console.error('Error getting engineer workload:', error);
    return 0;
  }
  
  return data || 0;
};

// Color coding for job statuses
export const getStatusColor = (status: string): string => {
  switch (status) {
    case 'scheduled':
      return 'hsl(var(--primary))';
    case 'in_progress':
      return 'hsl(var(--warning))';
    case 'completed':
      return 'hsl(var(--success))';
    case 'awaiting_install_booking':
      return 'hsl(var(--muted))';
    default:
      return 'hsl(var(--secondary))';
  }
};

// Format order for calendar display
export const formatOrderForCalendar = (order: Order) => {
  const startDate = order.scheduled_install_date ? new Date(order.scheduled_install_date) : new Date();
  const endDate = new Date(startDate);
  endDate.setHours(startDate.getHours() + (order.estimated_duration_hours || 2));
  
  // Parse scheduling conflicts if they exist
  let conflicts: any[] = [];
  if (order.scheduling_conflicts) {
    try {
      conflicts = Array.isArray(order.scheduling_conflicts) 
        ? order.scheduling_conflicts 
        : JSON.parse(order.scheduling_conflicts as string);
    } catch (e) {
      console.error('Error parsing scheduling conflicts:', e);
    }
  }
  
  return {
    id: order.id,
    title: `${order.order_number} - ${order.client?.full_name}`,
    start: startDate,
    end: endDate,
    resource: {
      order,
      engineerId: order.engineer_id,
      status: order.status_enhanced,
      conflicts
    }
  };
};

// Update order assignment
export const updateOrderAssignment = async (
  orderId: string, 
  engineerId: string | null, 
  scheduledDate?: string
) => {
  const updates: any = { engineer_id: engineerId };
  
  if (scheduledDate) {
    updates.scheduled_install_date = scheduledDate;
  }
  
  const { data, error } = await supabase
    .from('orders')
    .update(updates)
    .eq('id', orderId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating order assignment:', error);
    throw error;
  }
  
  return data;
};