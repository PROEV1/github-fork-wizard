import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Users, Clock, MapPin } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Engineer {
  id: string;
  name: string;
  email: string;
  region: string | null;
  availability: boolean;
}

interface AdminInstallManagementProps {
  orderId: string;
  currentEngineerId: string | null;
  currentInstallDate: string | null;
  onUpdate: () => void;
}

export function AdminInstallManagement({ 
  orderId, 
  currentEngineerId, 
  currentInstallDate,
  onUpdate 
}: AdminInstallManagementProps) {
  const { toast } = useToast();
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [selectedEngineerId, setSelectedEngineerId] = useState(currentEngineerId || 'unassigned');
  const [installDate, setInstallDate] = useState(
    currentInstallDate ? new Date(currentInstallDate).toISOString().split('T')[0] : ''
  );
  const [timeWindow, setTimeWindow] = useState('all-day');
  const [duration, setDuration] = useState('');
  const [internalNotes, setInternalNotes] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEngineers();
  }, []);

  const fetchEngineers = async () => {
    try {
      const { data, error } = await supabase
        .from('engineers')
        .select('*')
        .eq('availability', true)
        .order('name');

      if (error) throw error;
      setEngineers(data || []);
    } catch (error) {
      console.error('Error fetching engineers:', error);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updates: any = {};
      
      if (selectedEngineerId && selectedEngineerId !== 'unassigned') {
        updates.engineer_id = selectedEngineerId;
      } else if (selectedEngineerId === 'unassigned') {
        updates.engineer_id = null;
      }
      
      if (installDate) {
        updates.scheduled_install_date = installDate;
      }

      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Installation details updated successfully",
      });

      onUpdate();
    } catch (error) {
      console.error('Error updating installation:', error);
      toast({
        title: "Error",
        description: "Failed to update installation details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Installation Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Engineer Assignment */}
          <div className="space-y-2">
            <Label htmlFor="engineer-select">Assign Engineer</Label>
            <Select value={selectedEngineerId} onValueChange={setSelectedEngineerId}>
              <SelectTrigger>
                <SelectValue placeholder="Select an engineer">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>
                      {engineers.find(e => e.id === selectedEngineerId)?.name || 'Select engineer'}
                    </span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">No engineer assigned</SelectItem>
                {engineers.map((engineer) => (
                  <SelectItem key={engineer.id} value={engineer.id}>
                    <div className="flex flex-col">
                      <span>{engineer.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {engineer.region} • {engineer.email}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Installation Date */}
          <div className="space-y-2">
            <Label htmlFor="install-date">Installation Date</Label>
            <Input
              id="install-date"
              type="date"
              value={installDate}
              onChange={(e) => setInstallDate(e.target.value)}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Time Window */}
          <div className="space-y-2">
            <Label htmlFor="time-window">Time Window</Label>
            <Select value={timeWindow} onValueChange={setTimeWindow}>
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{timeWindow === 'morning' ? 'Morning' : timeWindow === 'afternoon' ? 'Afternoon' : 'All Day'}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all-day">All Day</SelectItem>
                <SelectItem value="morning">Morning</SelectItem>
                <SelectItem value="afternoon">Afternoon</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration">Estimated Duration (hours)</Label>
            <Input
              id="duration"
              type="number"
              placeholder="e.g. 3"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
            />
          </div>
        </div>

        {/* Internal Notes */}
        <div className="space-y-2">
          <Label htmlFor="internal-notes">Internal Notes</Label>
          <Textarea
            id="internal-notes"
            placeholder="e.g. Use rear access, customer has dogs, etc."
            value={internalNotes}
            onChange={(e) => setInternalNotes(e.target.value)}
            rows={3}
          />
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full">
          {loading ? 'Saving...' : 'Save Installation Details'}
        </Button>
      </CardContent>
    </Card>
  );
}