import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { BrandPage, BrandContainer, BrandHeading1, BrandLoading } from '@/components/brand';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Package, User } from 'lucide-react';

interface EngineerJob {
  id: string;
  order_number: string;
  client_name: string;
  job_address: string;
  scheduled_install_date: string | null;
  status: string;
  product_details: string;
  client_phone: string;
  total_amount: number;
  engineer_signed_off_at: string | null;
}

export default function EngineerDashboard() {
  const [jobs, setJobs] = useState<EngineerJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [engineerInfo, setEngineerInfo] = useState<any>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchEngineerInfo();
    }
  }, [user]);

  // Separate useEffect to fetch jobs only after engineer info is available
  useEffect(() => {
    if (engineerInfo?.id) {
      fetchEngineerJobs();
    }
  }, [engineerInfo?.id]);

  const fetchEngineerInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('engineers')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error) throw error;
      setEngineerInfo(data);
    } catch (error) {
      console.error('Error fetching engineer info:', error);
    }
  };

  const fetchEngineerJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          job_address,
          scheduled_install_date,
          total_amount,
          engineer_signed_off_at,
          quote:quotes!inner(
            product_details,
            client:clients!inner(
              full_name,
              phone
            )
          )
        `)
        .eq('engineer_id', engineerInfo?.id)
        .order('scheduled_install_date', { ascending: true });

      if (error) throw error;

      const formattedJobs = data?.map(order => ({
        id: order.id,
        order_number: order.order_number,
        client_name: order.quote.client.full_name,
        client_phone: order.quote.client.phone,
        job_address: order.job_address || 'Address not specified',
        scheduled_install_date: order.scheduled_install_date,
        status: order.status,
        product_details: order.quote.product_details,
        total_amount: order.total_amount,
        engineer_signed_off_at: order.engineer_signed_off_at
      })) || [];

      setJobs(formattedJobs);
    } catch (error) {
      console.error('Error fetching engineer jobs:', error);
      toast({
        title: "Error",
        description: "Failed to load your assigned jobs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, signedOff: string | null) => {
    if (signedOff) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>;
    }
    
    switch (status) {
      case 'agreement_signed':
        return <Badge variant="default">Scheduled</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="border-blue-500 text-blue-700">In Progress</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Not scheduled';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) return <BrandLoading />;

  return (
    <BrandPage>
      <BrandContainer>
        <div className="mb-8">
          <BrandHeading1>Engineer Dashboard</BrandHeading1>
          {engineerInfo && (
            <p className="text-muted-foreground mt-2">
              Welcome back, {engineerInfo.name} • {engineerInfo.region && `Region: ${engineerInfo.region}`}
            </p>
          )}
        </div>

        <div className="grid gap-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Total Jobs</p>
                    <p className="text-2xl font-bold">{jobs.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-orange-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Scheduled</p>
                    <p className="text-2xl font-bold">
                      {jobs.filter(job => job.status === 'agreement_signed' && !job.engineer_signed_off_at).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Package className="h-4 w-4 text-green-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">Completed</p>
                    <p className="text-2xl font-bold">
                      {jobs.filter(job => job.engineer_signed_off_at).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-purple-600" />
                  <div>
                    <p className="text-sm text-muted-foreground">This Week</p>
                    <p className="text-2xl font-bold">
                      {jobs.filter(job => {
                        if (!job.scheduled_install_date) return false;
                        const jobDate = new Date(job.scheduled_install_date);
                        const now = new Date();
                        const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
                        return jobDate >= now && jobDate <= weekFromNow;
                      }).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Jobs List */}
          <Card>
            <CardHeader>
              <CardTitle>Your Assigned Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              {jobs.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No jobs assigned yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {jobs.map((job) => (
                    <div key={job.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="flex flex-col md:flex-row md:items-center justify-between space-y-3 md:space-y-0">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold">{job.order_number}</h3>
                            {getStatusBadge(job.status, job.engineer_signed_off_at)}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-2">
                              <User className="h-4 w-4" />
                              <span>{job.client_name}</span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <MapPin className="h-4 w-4" />
                              <span>{job.job_address}</span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(job.scheduled_install_date)}</span>
                            </div>
                            
                            <div className="flex items-center space-x-2">
                              <Package className="h-4 w-4" />
                              <span>{job.product_details}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex space-x-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => navigate(`/engineer/job/${job.id}`)}
                          >
                            View Job Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </BrandContainer>
    </BrandPage>
  );
}