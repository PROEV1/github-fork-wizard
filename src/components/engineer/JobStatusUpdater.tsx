import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Clock, Navigation, Play, CheckCircle, MapPin } from 'lucide-react';

interface JobStatusUpdaterProps {
  jobId: string;
  currentStatus: string;
  jobAddress: string;
  onStatusUpdate: () => void;
}

const JOB_STATUSES = [
  { key: 'scheduled', label: 'Scheduled', icon: Clock, variant: 'secondary' as const },
  { key: 'on_way', label: 'On Way', icon: Navigation, variant: 'outline' as const },
  { key: 'in_progress', label: 'Started', icon: Play, variant: 'default' as const },
  { key: 'completed', label: 'Complete', icon: CheckCircle, variant: 'secondary' as const }
];

export default function JobStatusUpdater({ 
  jobId, 
  currentStatus, 
  jobAddress, 
  onStatusUpdate 
}: JobStatusUpdaterProps) {
  const [updating, setUpdating] = useState(false);
  const { toast } = useToast();

  const getCurrentStatusIndex = () => {
    return JOB_STATUSES.findIndex(status => status.key === currentStatus);
  };

  const updateJobStatus = async (newStatus: string) => {
    setUpdating(true);
    try {
      // Update both status fields for proper status management
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          status_enhanced: newStatus as any, // This will be recalculated by the trigger
          manual_status_override: true,
          manual_status_notes: `Status updated by engineer to ${JOB_STATUSES.find(s => s.key === newStatus)?.label}`
        })
        .eq('id', jobId);

      if (error) throw error;

      // Log the status change activity
      await supabase.rpc('log_order_activity', {
        p_order_id: jobId,
        p_activity_type: 'engineer_status_update',
        p_description: `Engineer updated status to ${JOB_STATUSES.find(s => s.key === newStatus)?.label}`,
        p_details: {
          new_status: newStatus,
          updated_by_engineer: true
        }
      });

      toast({
        title: "Status Updated",
        description: `Job status updated to ${JOB_STATUSES.find(s => s.key === newStatus)?.label}`,
      });

      onStatusUpdate();
    } catch (error) {
      console.error('Error updating job status:', error);
      toast({
        title: "Error",
        description: "Failed to update job status",
        variant: "destructive",
      });
    } finally {
      setUpdating(false);
    }
  };

  const getGoogleMapsUrl = () => {
    const encodedAddress = encodeURIComponent(jobAddress);
    return `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
  };

  const currentIndex = getCurrentStatusIndex();
  const currentStatusInfo = JOB_STATUSES[currentIndex] || JOB_STATUSES[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <currentStatusInfo.icon className="h-5 w-5" />
          <span>Job Status</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Current Status:</span>
            <Badge variant={currentStatusInfo.variant} className={
              currentStatus === 'completed' ? 'bg-green-100 text-green-800' : ''
            }>
              <currentStatusInfo.icon className="h-3 w-3 mr-1" />
              {currentStatusInfo.label}
            </Badge>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(getGoogleMapsUrl(), '_blank')}
            className="flex items-center space-x-1"
          >
            <MapPin className="h-3 w-3" />
            <span>Get Directions</span>
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {JOB_STATUSES.map((status, index) => {
            const isCurrentStatus = status.key === currentStatus;
            const isPastStatus = index < currentIndex;
            const isNextStatus = index === currentIndex + 1;
            const isDisabled = index > currentIndex + 1 || status.key === 'completed';

            return (
              <Button
                key={status.key}
                variant={isCurrentStatus ? "default" : isPastStatus ? "secondary" : "outline"}
                size="sm"
                disabled={updating || isDisabled || isCurrentStatus}
                onClick={() => updateJobStatus(status.key)}
                className={`flex items-center space-x-1 ${
                  isPastStatus ? 'opacity-60' : ''
                } ${
                  isNextStatus ? 'ring-2 ring-primary/50' : ''
                }`}
              >
                <status.icon className="h-3 w-3" />
                <span>{status.label}</span>
              </Button>
            );
          })}
        </div>

        <div className="text-xs text-muted-foreground">
          Click the next status to update your progress
        </div>
      </CardContent>
    </Card>
  );
}