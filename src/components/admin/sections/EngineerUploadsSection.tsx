import { OrderSection } from "../OrderSectionLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  Download, 
  FileImage, 
  FileText, 
  Calendar,
  Save
} from "lucide-react";
import { format } from "date-fns";

interface EngineerUpload {
  id: string;
  file_name: string;
  file_url: string;
  upload_type: string;
  description: string | null;
  uploaded_at: string;
}

interface Order {
  id: string;
  admin_qa_notes: string | null;
  engineer_uploads?: EngineerUpload[];
}

interface EngineerUploadsSectionProps {
  order: Order;
  onUpdate: () => void;
}

export function EngineerUploadsSection({ order, onUpdate }: EngineerUploadsSectionProps) {
  const { toast } = useToast();
  const [qaNotesLocal, setQaNotesLocal] = useState(order.admin_qa_notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const handleSaveQANotes = async () => {
    setIsSavingNotes(true);
    try {
      const { error } = await supabase
        .from('orders')
        .update({ admin_qa_notes: qaNotesLocal || null })
        .eq('id', order.id);

      if (error) throw error;

      toast({
        title: "QA Notes Updated",
        description: "Quality assurance notes have been saved successfully.",
      });

      onUpdate();
    } catch (error) {
      console.error('Error updating QA notes:', error);
      toast({
        title: "Error",
        description: "Failed to update QA notes",
        variant: "destructive",
      });
    } finally {
      setIsSavingNotes(false);
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension || '')) {
      return FileImage;
    }
    return FileText;
  };

  const getUploadTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'completion_photo': return 'bg-green-100 text-green-800';
      case 'progress_photo': return 'bg-blue-100 text-blue-800';
      case 'issue_report': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const hasUploads = order.engineer_uploads && order.engineer_uploads.length > 0;
  const hasChangedNotes = qaNotesLocal !== (order.admin_qa_notes || '');

  return (
    <OrderSection 
      id="engineer-uploads" 
      title="Engineer Uploads & Completion" 
      icon={Upload} 
      defaultOpen={hasUploads}
    >
      <div className="space-y-6">
        {/* Engineer Uploads */}
        {hasUploads ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Engineer Uploads</h4>
              <Badge variant="outline">
                {order.engineer_uploads!.length} file{order.engineer_uploads!.length !== 1 ? 's' : ''}
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {order.engineer_uploads!.map((upload) => {
                const IconComponent = getFileIcon(upload.file_name);
                return (
                  <Card key={upload.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <IconComponent className="h-8 w-8 text-muted-foreground mt-1" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h5 className="font-medium truncate">{upload.file_name}</h5>
                            <Badge 
                              variant="secondary" 
                              className={`text-xs ${getUploadTypeColor(upload.upload_type)}`}
                            >
                              {upload.upload_type.replace('_', ' ')}
                            </Badge>
                          </div>
                          
                          {upload.description && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {upload.description}
                            </p>
                          )}
                          
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            <span>{format(new Date(upload.uploaded_at), 'PPP p')}</span>
                          </div>
                          
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="mt-3 w-full"
                            onClick={() => window.open(upload.file_url, '_blank')}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            View File
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Upload className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No engineer uploads yet</p>
            <p className="text-xs">Files will appear here once the engineer uploads them</p>
          </div>
        )}

        {/* Admin QA Notes */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="qa-notes">Admin QA Notes</Label>
            {hasChangedNotes && (
              <Badge variant="secondary" className="text-xs">
                Unsaved changes
              </Badge>
            )}
          </div>
          
          <Textarea
            id="qa-notes"
            placeholder="Quality assurance notes, completion verification, any issues found..."
            value={qaNotesLocal}
            onChange={(e) => setQaNotesLocal(e.target.value)}
            rows={4}
          />
          
          <p className="text-xs text-muted-foreground">
            These notes are for internal admin use and quality control tracking
          </p>

          {hasChangedNotes && (
            <Button 
              onClick={handleSaveQANotes}
              disabled={isSavingNotes}
              size="sm"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSavingNotes ? "Saving..." : "Save QA Notes"}
            </Button>
          )}
        </div>
      </div>
    </OrderSection>
  );
}