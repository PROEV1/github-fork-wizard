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

// Get scheduling settings from admin configuration
export const getSchedulingSettings = async () => {
  const { data, error } = await supabase
    .rpc('get_scheduling_settings');
  
  if (error) {
    console.error('Error fetching scheduling settings:', error);
    return {
      hours_advance_notice: 48,
      max_distance_miles: 90,
      max_jobs_per_day: 3,
      allow_weekend_bookings: false,
      working_hours_start: '08:00',
      working_hours_end: '18:00'
    };
  }
  
  return data[0] || {
    hours_advance_notice: 48,
    max_distance_miles: 90,
    max_jobs_per_day: 3,
    allow_weekend_bookings: false,
    working_hours_start: '08:00',
    working_hours_end: '18:00'
  };
};

// Cache for distance calculations to avoid repeated API calls
const distanceCache = new Map<string, { distance: number; duration: number; timestamp: number }>();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Enhanced distance calculation using Mapbox API - now uses actual order postcodes
export const calculateDistance = async (postcode1?: string, postcode2?: string): Promise<number> => {
  if (!postcode1 || !postcode2) return 10; // Default distance
  
  // Create cache key
  const cacheKey = `${postcode1.trim().toUpperCase()}-${postcode2.trim().toUpperCase()}`;
  const reverseKey = `${postcode2.trim().toUpperCase()}-${postcode1.trim().toUpperCase()}`;
  
  // Check cache first
  const cached = distanceCache.get(cacheKey) || distanceCache.get(reverseKey);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.distance;
  }
  
  try {
    const { data, error } = await supabase.functions.invoke('mapbox-distance', {
      body: {
        origins: [postcode1],
        destinations: [postcode2]
      }
    });
    
    if (error) throw error;
    
    const distance = data.distances[0][0];
    const duration = data.durations[0][0];
    
    // Cache the result
    distanceCache.set(cacheKey, { distance, duration, timestamp: Date.now() });
    
    return distance || 10; // Fallback to 10 miles
  } catch (error) {
    console.error('Mapbox distance calculation failed, using fallback:', error);
    
    // Fallback to mock calculation
    return calculateDistanceFallback(postcode1, postcode2);
  }
};

// Fallback distance calculation for when Mapbox API fails
const calculateDistanceFallback = (postcode1: string, postcode2: string): number => {
  // Extract postcode areas (first part before space or first 2-3 characters)
  const area1 = postcode1.split(' ')[0] || postcode1.substring(0, 3);
  const area2 = postcode2.split(' ')[0] || postcode2.substring(0, 3);
  
  // Simple distance estimation based on postcode areas
  if (area1 === area2) return 2; // Same area, very close
  
  // Enhanced distance lookup table for UK postcode areas
  const distanceMap: Record<string, Record<string, number>> = {
    'M1': { 'M2': 5, 'M3': 8, 'B1': 85, 'L1': 35, 'LS': 45 },
    'M2': { 'M1': 5, 'M3': 10, 'B1': 90, 'L1': 40, 'LS': 50 },
    'B1': { 'M1': 85, 'M2': 90, 'B2': 10, 'L1': 120, 'LS': 130 },
    'L1': { 'M1': 35, 'M2': 40, 'B1': 120, 'LS': 75 },
    'LS': { 'M1': 45, 'M2': 50, 'B1': 130, 'L1': 75 }
  };
  
  // Try exact match first
  const exactDistance = distanceMap[area1]?.[area2];
  if (exactDistance) return exactDistance;
  
  // Fallback to similarity-based distance
  const similarity = calculatePostcodeSimilarity(area1, area2);
  return Math.floor((1 - similarity) * 50) + 2; // 2-52 miles based on similarity
};

const calculatePostcodeSimilarity = (area1: string, area2: string): number => {
  if (area1 === area2) return 1;
  
  // Check if they start with same letters (rough proximity)
  const letters1 = area1.replace(/[0-9]/g, '');
  const letters2 = area2.replace(/[0-9]/g, '');
  
  if (letters1 === letters2) return 0.8;
  if (letters1[0] === letters2[0]) return 0.6;
  
  return 0.2; // Different areas
};

// Calculate estimated travel time in minutes
export const calculateTravelTime = (distance: number): number => {
  // Assuming average speed of 30 mph in urban areas
  return Math.round((distance / 30) * 60);
};

// Get engineer availability for a specific date, considering time off
export const getEngineerAvailability = async (engineerId: string, date: string) => {
  try {
    // Check if engineer has time off on this date
    const { data: timeOffData, error: timeOffError } = await supabase
      .from('engineer_time_off')
      .select('*')
      .eq('engineer_id', engineerId)
      .eq('status', 'approved')
      .lte('start_date', date)
      .gte('end_date', date);

    if (timeOffError) throw timeOffError;
    
    // If engineer has approved time off, they're not available
    if (timeOffData && timeOffData.length > 0) {
      return { available: false, reason: 'time_off' };
    }

    // Get working hours for the day of week
    const dayOfWeek = new Date(date).getDay();
    const { data: workingHours, error } = await supabase
      .from('engineer_availability')
      .select('*')
      .eq('engineer_id', engineerId)
      .eq('day_of_week', dayOfWeek)
      .eq('is_available', true);

    if (error) throw error;
    
    if (!workingHours || workingHours.length === 0) {
      return { available: false, reason: 'not_working_day' };
    }

    return { 
      available: true, 
      workingHours: workingHours[0],
      start_time: workingHours[0].start_time,
      end_time: workingHours[0].end_time
    };
  } catch (error) {
    console.error('Error fetching engineer availability:', error);
    return { available: false, reason: 'error' };
  }
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

// Find the first available slot for engineers within distance limits
export const findFirstAvailableSlot = async (
  engineerIds: string[],
  clientPostcode: string,
  estimatedHours: number = 2,
  clientId?: string
) => {
  const { data, error } = await supabase
    .rpc('find_first_available_slot', {
      p_engineer_ids: engineerIds,
      p_client_postcode: clientPostcode,
      p_estimated_hours: estimatedHours,
      p_client_id: clientId || null
    });
  
  if (error) {
    console.error('Error finding available slot:', error);
    throw error;
  }
  
  return data || [];
};

// Smart engineer recommendation with auto-date finding
export const getSmartEngineerRecommendations = async (
  order: Order,
  engineers: Engineer[]
): Promise<{
  recommendations: Array<{
    engineer: Engineer;
    availableDate: string;
    distance: number;
    travelTime: number;
    score: number;
    reasons: string[];
  }>;
  settings: any;
}> => {
  try {
    const settings = await getSchedulingSettings();
    const clientPostcode = order.postcode; // Use actual stored postcode
    
    if (!clientPostcode) {
      throw new Error('No postcode found for order');
    }
    
    // Find available slots for all engineers
    const engineerIds = engineers.map(e => e.id);
    const availableSlots = await findFirstAvailableSlot(
      engineerIds,
      clientPostcode,
      order.estimated_duration_hours || 2,
      order.client_id
    );
    
    // Calculate recommendations with real distance data
    const recommendations = await Promise.all(
      availableSlots.map(async (slot) => {
        const engineer = engineers.find(e => e.id === slot.engineer_id);
        if (!engineer) return null;
        
        // Calculate real distance if we have engineer postcode
        let distance = parseFloat(slot.distance_miles.toString());
        let travelTime = slot.travel_time_minutes;
        
        if (engineer.starting_postcode) {
          try {
            distance = await calculateDistance(engineer.starting_postcode, clientPostcode);
            travelTime = calculateTravelTime(distance);
          } catch (error) {
            console.error('Distance calculation failed, using fallback:', error);
          }
        }
        
        // Filter by maximum distance
        if (distance > settings.max_distance_miles) {
          return null;
        }
        
        // Calculate score and reasons
        let score = parseFloat(slot.recommendation_score.toString());
        const reasons: string[] = [];
        
        if (distance <= 5) {
          score += 20;
          reasons.push('Very close to job location');
        } else if (distance <= 15) {
          score += 10;
          reasons.push('Reasonable distance');
        } else if (distance <= settings.max_distance_miles) {
          reasons.push('Within service area');
        }
        
        if (engineer.region) {
          const orderPostcodeArea = clientPostcode.split(' ')[0];
          if (engineer.region.toLowerCase().includes(orderPostcodeArea.toLowerCase())) {
            score += 15;
            reasons.push('Same region coverage');
          }
        }
        
        const nextAvailable = new Date(slot.available_date);
        const hoursUntilAvailable = (nextAvailable.getTime() - Date.now()) / (1000 * 60 * 60);
        
        if (hoursUntilAvailable <= settings.hours_advance_notice * 1.5) {
          score += 10;
          reasons.push('Available soon');
        }
        
        return {
          engineer,
          availableDate: slot.available_date,
          distance,
          travelTime,
          score,
          reasons
        };
      })
    );
    
    // Filter out null results and sort by score
    const validRecommendations = recommendations
      .filter(r => r !== null)
      .sort((a, b) => b.score - a.score);
    
    return {
      recommendations: validRecommendations,
      settings
    };
  } catch (error) {
    console.error('Error getting smart recommendations:', error);
    
    // Fallback to basic recommendations
    const settings = await getSchedulingSettings();
    const minimumDate = new Date();
    minimumDate.setHours(minimumDate.getHours() + settings.hours_advance_notice);
    
    const basicRecommendations = engineers.map(engineer => ({
      engineer,
      availableDate: minimumDate.toISOString().split('T')[0],
      distance: 15,
      travelTime: 30,
      score: 75,
      reasons: ['Fallback recommendation - please verify availability']
    }));
    
    return {
      recommendations: basicRecommendations.sort((a, b) => b.score - a.score),
      settings
    };
  }
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