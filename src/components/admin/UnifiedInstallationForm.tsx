import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Calendar, User, Clock, MapPin, FileText, Save, AlertTriangle, Check } from "lucide-react";

interface Engineer {
  id: string;
  name: string;
  email: string;
  region: string | null;
}

interface UnifiedInstallationFormProps {
  orderId: string;
  currentEngineerId?: string | null;
  currentInstallDate?: string | null;
  timeWindow?: string | null;
  estimatedDuration?: number | null;
  internalNotes?: string | null;
  jobAddress?: string | null;
  engineer?: {
    id: string;
    name: string;
    email: string;
  } | null;
  paymentReceived: boolean;
  agreementSigned: boolean;
  onUpdate: () => void;
}

export function UnifiedInstallationForm({
  orderId,
  currentEngineerId,
  currentInstallDate,
  timeWindow,
  estimatedDuration,
  internalNotes,
  jobAddress,
  engineer,
  paymentReceived,
  agreementSigned,
  onUpdate
}: UnifiedInstallationFormProps) {
  const { toast } = useToast();
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    engineer_id: currentEngineerId || '',
    scheduled_install_date: currentInstallDate ? currentInstallDate.split('T')[0] : '',
    time_window: timeWindow || '',
    estimated_duration_hours: estimatedDuration || 4,
    internal_install_notes: internalNotes || '',
    job_address: jobAddress || ''
  });

  useEffect(() => {
    fetchEngineers();
  }, []);

  useEffect(() => {
    // Update form data when props change
    setFormData({
      engineer_id: currentEngineerId || '',
      scheduled_install_date: currentInstallDate ? currentInstallDate.split('T')[0] : '',
      time_window: timeWindow || '',
      estimated_duration_hours: estimatedDuration || 4,
      internal_install_notes: internalNotes || '',
      job_address: jobAddress || ''
    });
  }, [currentEngineerId, currentInstallDate, timeWindow, estimatedDuration, internalNotes, jobAddress]);

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

  const canEdit = paymentReceived && agreementSigned;
  const isScheduled = currentInstallDate && engineer;

  const formatTimeWindow = (window: string) => {
    switch (window) {
      case 'morning': return 'AM (8:00 AM - 12:00 PM)';
      case 'afternoon': return 'PM (12:00 PM - 5:00 PM)';
      case 'all_day': return 'All Day (8:00 AM - 5:00 PM)';
      default: return 'Not specified';
    }
  };

  const handleSave = async () => {
    if (!canEdit) return;
    
    setIsLoading(true);
    try {
      const updateData: any = {};
      
      // Only include fields that have values or explicitly set to null
      if (formData.engineer_id && formData.engineer_id !== 'none') {
        updateData.engineer_id = formData.engineer_id;
      } else {
        updateData.engineer_id = null;
      }
      
      if (formData.scheduled_install_date) {
        updateData.scheduled_install_date = new Date(formData.scheduled_install_date).toISOString();
      } else {
        updateData.scheduled_install_date = null;
      }
      
      updateData.time_window = formData.time_window === 'none' ? null : formData.time_window || null;
      updateData.estimated_duration_hours = formData.estimated_duration_hours || null;
      updateData.internal_install_notes = formData.internal_install_notes || null;
      updateData.job_address = formData.job_address || null;

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Installation Updated",
        description: "All installation details have been saved successfully.",
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
      setIsLoading(false);
    }
  };

  const selectedEngineer = engineers.find(e => e.id === formData.engineer_id);

  return (
    <Card className={`${isScheduled ? 'border-primary bg-primary/5' : 'border-dashed'}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Installation Management
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant={paymentReceived ? "default" : "secondary"}>
              {paymentReceived ? "Payment ✓" : "Payment Pending"}
            </Badge>
            <Badge variant={agreementSigned ? "default" : "secondary"}>
              {agreementSigned ? "Agreement ✓" : "Agreement Pending"}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {!canEdit && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {!paymentReceived && !agreementSigned ? 
                "Cannot schedule installation until payment is received and agreement is signed." :
                !paymentReceived ? 
                "Cannot schedule installation until payment is received." :
                "Cannot schedule installation until agreement is signed."}
            </AlertDescription>
          </Alert>
        )}
        
        {isScheduled && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-800">
              <Check className="h-4 w-4" />
              <span className="font-medium">Installation Scheduled</span>
            </div>
          </div>
        )}

        <div className="grid gap-4">
          {/* Engineer Selection */}
          <div className="space-y-2">
            <Label htmlFor="engineer" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Engineer
            </Label>
            <Select 
              value={formData.engineer_id} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, engineer_id: value }))}
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select engineer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No engineer assigned</SelectItem>
                {engineers.map((eng) => (
                  <SelectItem key={eng.id} value={eng.id}>
                    {eng.name} {eng.region && `(${eng.region})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedEngineer && (
              <p className="text-sm text-muted-foreground">
                Contact: {selectedEngineer.email}
              </p>
            )}
          </div>

          {/* Install Date */}
          <div className="space-y-2">
            <Label htmlFor="installDate" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Installation Date
            </Label>
            <Input
              id="installDate"
              type="date"
              value={formData.scheduled_install_date}
              onChange={(e) => setFormData(prev => ({ ...prev, scheduled_install_date: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
              disabled={!canEdit}
            />
            {formData.scheduled_install_date && (
              <p className="text-sm text-muted-foreground">
                {format(new Date(formData.scheduled_install_date), 'EEEE, MMMM do, yyyy')}
              </p>
            )}
          </div>

          {/* Time Window */}
          <div className="space-y-2">
            <Label htmlFor="timeWindow" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time Window
            </Label>
            <Select 
              value={formData.time_window} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, time_window: value }))}
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select time window" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Not specified</SelectItem>
                <SelectItem value="morning">AM (8:00 - 12:00)</SelectItem>
                <SelectItem value="afternoon">PM (12:00 - 17:00)</SelectItem>
                <SelectItem value="all_day">All Day (8:00 - 17:00)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Estimated Duration */}
          <div className="space-y-2">
            <Label htmlFor="duration" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Estimated Duration (hours)
            </Label>
            <Select 
              value={formData.estimated_duration_hours?.toString() || ''} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, estimated_duration_hours: parseInt(value) || 4 }))}
              disabled={!canEdit}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 hours</SelectItem>
                <SelectItem value="3">3 hours</SelectItem>
                <SelectItem value="4">4 hours</SelectItem>
                <SelectItem value="6">6 hours</SelectItem>
                <SelectItem value="8">8 hours (full day)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Job Address */}
          <div className="space-y-2">
            <Label htmlFor="jobAddress" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Job Address
            </Label>
            <Input
              id="jobAddress"
              value={formData.job_address}
              onChange={(e) => setFormData(prev => ({ ...prev, job_address: e.target.value }))}
              placeholder="Installation address"
              disabled={!canEdit}
            />
          </div>

          {/* Internal Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Internal Notes
            </Label>
            <Textarea
              id="notes"
              value={formData.internal_install_notes}
              onChange={(e) => setFormData(prev => ({ ...prev, internal_install_notes: e.target.value }))}
              placeholder="Access details, parking info, special requirements..."
              rows={3}
              disabled={!canEdit}
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button 
            onClick={handleSave} 
            disabled={!canEdit || isLoading}
            className="min-w-32"
          >
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? "Saving..." : "Save All Changes"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}