import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { BrandPage, BrandContainer, BrandHeading1, BrandLoading } from '@/components/brand';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Settings, User, MapPin, Calendar, CheckCircle, XCircle } from 'lucide-react';

interface Engineer {
  id: string;
  name: string;
  email: string;
  region: string | null;
  availability: boolean;
  created_at: string;
  user_id: string | null;
  assigned_jobs: number;
  completed_jobs: number;
}

export default function AdminEngineers() {
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingEngineer, setEditingEngineer] = useState<Engineer | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    region: '',
    availability: true
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchEngineers();
  }, []);

  const fetchEngineers = async () => {
    try {
      // Fetch engineers with job counts
      const { data: engineersData, error: engineersError } = await supabase
        .from('engineers')
        .select('*')
        .order('created_at', { ascending: false });

      if (engineersError) throw engineersError;

      // Fetch job counts for each engineer
      const engineersWithCounts = await Promise.all(
        engineersData.map(async (engineer) => {
          const { data: assignedJobs, error: assignedError } = await supabase
            .from('orders')
            .select('id, engineer_signed_off_at')
            .eq('engineer_id', engineer.id);

          if (assignedError) {
            console.error('Error fetching assigned jobs:', assignedError);
            return {
              ...engineer,
              assigned_jobs: 0,
              completed_jobs: 0
            };
          }

          const assigned = assignedJobs?.length || 0;
          const completed = assignedJobs?.filter(job => job.engineer_signed_off_at).length || 0;

          return {
            ...engineer,
            assigned_jobs: assigned,
            completed_jobs: completed
          };
        })
      );

      setEngineers(engineersWithCounts);
    } catch (error) {
      console.error('Error fetching engineers:', error);
      toast({
        title: "Error",
        description: "Failed to load engineers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim() || !formData.email.trim()) {
      toast({
        title: "Validation Error",
        description: "Name and email are required",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      if (editingEngineer) {
        // Update existing engineer
        const { error } = await supabase
          .from('engineers')
          .update({
            name: formData.name,
            email: formData.email,
            region: formData.region || null,
            availability: formData.availability
          })
          .eq('id', editingEngineer.id);

        if (error) throw error;

        toast({
          title: "Engineer Updated",
          description: "Engineer details have been updated successfully",
        });
      } else {
        // Create new engineer
        const { error } = await supabase
          .from('engineers')
          .insert({
            name: formData.name,
            email: formData.email,
            region: formData.region || null,
            availability: formData.availability
          });

        if (error) throw error;

        toast({
          title: "Engineer Created",
          description: "New engineer has been added successfully",
        });
      }

      resetForm();
      fetchEngineers();
    } catch (error: any) {
      console.error('Error saving engineer:', error);
      
      if (error.code === '23505') {
        toast({
          title: "Email Already Exists",
          description: "An engineer with this email already exists",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save engineer. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      region: '',
      availability: true
    });
    setEditingEngineer(null);
    setShowCreateModal(false);
  };

  const handleEdit = (engineer: Engineer) => {
    setFormData({
      name: engineer.name,
      email: engineer.email,
      region: engineer.region || '',
      availability: engineer.availability
    });
    setEditingEngineer(engineer);
    setShowCreateModal(true);
  };

  const handleToggleAvailability = async (engineer: Engineer) => {
    try {
      const { error } = await supabase
        .from('engineers')
        .update({ availability: !engineer.availability })
        .eq('id', engineer.id);

      if (error) throw error;

      toast({
        title: "Availability Updated",
        description: `${engineer.name} is now ${!engineer.availability ? 'available' : 'unavailable'}`,
      });

      fetchEngineers();
    } catch (error) {
      console.error('Error updating availability:', error);
      toast({
        title: "Error",
        description: "Failed to update availability",
        variant: "destructive",
      });
    }
  };

  if (loading) return <BrandLoading />;

  return (
    <BrandPage>
      <BrandContainer>
        <div className="flex items-center justify-between mb-8">
          <BrandHeading1>Engineer Management</BrandHeading1>
          
          <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingEngineer(null)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Engineer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingEngineer ? 'Edit Engineer' : 'Add New Engineer'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter full name"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Enter email address"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="region">Region</Label>
                  <Input
                    id="region"
                    value={formData.region}
                    onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                    placeholder="Enter region (optional)"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="availability"
                    checked={formData.availability}
                    onChange={(e) => setFormData({ ...formData, availability: e.target.checked })}
                    className="rounded"
                  />
                  <Label htmlFor="availability">Available for assignments</Label>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button type="button" variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : editingEngineer ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-blue-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Engineers</p>
                  <p className="text-2xl font-bold">{engineers.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Available</p>
                  <p className="text-2xl font-bold">
                    {engineers.filter(e => e.availability).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-orange-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Active Jobs</p>
                  <p className="text-2xl font-bold">
                    {engineers.reduce((sum, e) => sum + (e.assigned_jobs - e.completed_jobs), 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-purple-600" />
                <div>
                  <p className="text-sm text-muted-foreground">Completed Jobs</p>
                  <p className="text-2xl font-bold">
                    {engineers.reduce((sum, e) => sum + e.completed_jobs, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Engineers Table */}
        <Card>
          <CardHeader>
            <CardTitle>Engineers</CardTitle>
          </CardHeader>
          <CardContent>
            {engineers.length === 0 ? (
              <div className="text-center py-8">
                <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No engineers added yet</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setShowCreateModal(true)}
                >
                  Add Your First Engineer
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Engineer</TableHead>
                    <TableHead>Region</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Jobs Assigned</TableHead>
                    <TableHead>Jobs Completed</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {engineers.map((engineer) => (
                    <TableRow key={engineer.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{engineer.name}</div>
                          <div className="text-sm text-muted-foreground">{engineer.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span>{engineer.region || 'Not set'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={engineer.availability ? "default" : "secondary"}
                          className={engineer.availability ? "bg-green-100 text-green-800" : ""}
                        >
                          {engineer.availability ? 'Available' : 'Unavailable'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{engineer.assigned_jobs}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{engineer.completed_jobs}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(engineer)}
                          >
                            <Settings className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleToggleAvailability(engineer)}
                          >
                            {engineer.availability ? (
                              <XCircle className="h-3 w-3" />
                            ) : (
                              <CheckCircle className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </BrandContainer>
    </BrandPage>
  );
}