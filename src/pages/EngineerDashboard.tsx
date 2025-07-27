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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Main effect to fetch data when user is available
  useEffect(() => {
    console.log('🔄 Main useEffect triggered');
    console.log('Auth loading:', authLoading);
    console.log('User ID:', user?.id);
    console.log('User email:', user?.email);
    
    // Don't do anything while auth is still loading
    if (authLoading) {
      console.log('⏳ Auth still loading, waiting...');
      return;
    }
    
    // If auth finished loading but no user, we have a problem
    if (!user?.id) {
      console.log('❌ Auth finished but no user ID available');
      setLoading(false);
      setErrorMessage('Authentication required. Please log in.');
      return;
    }

    console.log('✅ User authenticated, starting data fetch for:', user.email);
    fetchEngineerData();
  }, [user?.id, authLoading]);

  const fetchEngineerData = async () => {
    try {
      console.log('🚀 Starting engineer data fetch for user:', user?.id);
      console.log('🚀 User email:', user?.email);
      console.log('🚀 Auth loading state:', authLoading);
      setLoading(true);
      setErrorMessage(null);

      // Step 1: Get engineer info - force fresh query
      console.log('📋 Step 1: Fetching engineer info for user_id:', user?.id);
      const { data: engineer, error: engineerError } = await supabase
        .from('engineers')
        .select('*')
        .eq('user_id', user?.id)
        .maybeSingle();

      console.log('🔍 Engineer query result:', { engineer, engineerError });

      if (engineerError) {
        console.error('❌ Engineer query error:', engineerError);
        throw new Error(`Engineer lookup failed: ${engineerError.message}`);
      }

      if (!engineer) {
        console.error('❌ No engineer record found for user:', user?.id);
        console.log('📋 Available engineers check - querying all engineers...');
        const { data: allEngineers } = await supabase.from('engineers').select('*');
        console.log('📋 All engineers in system:', allEngineers);
        throw new Error('No engineer profile found for your account. Please contact admin.');
      }

      console.log('✅ Engineer found:', engineer);
      setEngineerInfo(engineer);

      // Step 2: Get jobs for this engineer - force fresh query
      console.log('📋 Step 2: Fetching jobs for engineer ID:', engineer.id);
      console.log('📋 Step 2: Engineer name:', engineer.name);
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          status,
          job_address,
          scheduled_install_date,
          total_amount,
          engineer_signed_off_at,
          quote_id,
          client_id
        `)
        .eq('engineer_id', engineer.id)
        .order('scheduled_install_date', { ascending: true });

      console.log('🔍 Orders query result:', { orders, ordersError, count: orders?.length });

      if (ordersError) {
        console.error('❌ Orders query error:', ordersError);
        throw new Error(`Failed to load jobs: ${ordersError.message}`);
      }

      console.log('✅ Raw orders found:', orders?.length || 0);
      if (orders && orders.length > 0) {
        console.log('✅ First order sample:', orders[0]);
      }

      if (!orders || orders.length === 0) {
        console.log('ℹ️ No orders found for engineer ID:', engineer.id);
        console.log('📋 DEBUG: Checking all orders in system...');
        const { data: allOrders } = await supabase.from('orders').select('id, order_number, engineer_id');
        console.log('📋 All orders in system:', allOrders);
        setJobs([]);
        toast({
          title: "No Jobs Found",
          description: "You don't have any assigned jobs at the moment.",
        });
        return;
      }

      // Step 3: Get related data
      console.log('📋 Step 3: Fetching quotes and clients for', orders.length, 'orders');
      const quoteIds = orders.map(order => order.quote_id);
      const clientIds = orders.map(order => order.client_id);

      const [quotesResult, clientsResult] = await Promise.all([
        supabase
          .from('quotes')
          .select('id, product_details')
          .in('id', quoteIds),
        supabase
          .from('clients')
          .select('id, full_name, phone')
          .in('id', clientIds)
      ]);

      if (quotesResult.error) {
        console.error('❌ Quotes query error:', quotesResult.error);
        throw new Error(`Failed to load quote details: ${quotesResult.error.message}`);
      }

      if (clientsResult.error) {
        console.error('❌ Clients query error:', clientsResult.error);
        throw new Error(`Failed to load client details: ${clientsResult.error.message}`);
      }

      console.log('✅ Quotes:', quotesResult.data);
      console.log('✅ Clients:', clientsResult.data);

      // Step 4: Format and combine data
      const formattedJobs = orders.map(order => {
        const quote = quotesResult.data?.find(q => q.id === order.quote_id);
        const client = clientsResult.data?.find(c => c.id === order.client_id);

        return {
          id: order.id,
          order_number: order.order_number,
          client_name: client?.full_name || 'Unknown Client',
          client_phone: client?.phone || 'No phone',
          job_address: order.job_address || 'Address not specified',
          scheduled_install_date: order.scheduled_install_date,
          status: order.status,
          product_details: quote?.product_details || 'No product details',
          total_amount: order.total_amount,
          engineer_signed_off_at: order.engineer_signed_off_at
        };
      });

      console.log('✅ Final formatted jobs:', formattedJobs);
      console.log('🎉 Setting jobs state with', formattedJobs.length, 'jobs');
      setJobs(formattedJobs);
      
      toast({
        title: "Jobs Loaded Successfully",
        description: `Found ${formattedJobs.length} assigned job${formattedJobs.length === 1 ? '' : 's'}`,
      });

    } catch (error: any) {
      console.error('💥 Fatal error in fetchEngineerData:', error);
      console.error('💥 Error stack:', error.stack);
      const errorMsg = error.message || 'An unexpected error occurred';
      setErrorMessage(errorMsg);
      toast({
        title: "Error Loading Dashboard",
        description: errorMsg,
        variant: "destructive",
      });
    } finally {
      console.log('🏁 fetchEngineerData completed, setting loading to false');
      setLoading(false);
    }
  };

  // Force refresh function for debugging
  const forceRefresh = () => {
    console.log('🔄 FORCE REFRESH triggered by user');
    console.log('🔄 Current state - Jobs:', jobs.length, 'Engineer:', engineerInfo?.name);
    setJobs([]);
    setEngineerInfo(null);
    setErrorMessage(null);
    fetchEngineerData();
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

  if (errorMessage) {
    return (
      <BrandPage>
        <BrandContainer>
          <div className="text-center py-12">
            <div className="bg-destructive/10 text-destructive p-6 rounded-lg max-w-md mx-auto">
              <h2 className="text-lg font-semibold mb-2">Unable to Load Dashboard</h2>
              <p className="text-sm mb-4">{errorMessage}</p>
              <div className="space-x-2">
                <Button onClick={fetchEngineerData} variant="outline">
                  Try Again
                </Button>
                <Button onClick={forceRefresh} variant="outline">
                  Force Refresh
                </Button>
              </div>
            </div>
          </div>
        </BrandContainer>
      </BrandPage>
    );
  }

  return (
    <BrandPage>
      <BrandContainer>
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <BrandHeading1>Engineer Dashboard</BrandHeading1>
              {engineerInfo && (
                <p className="text-muted-foreground mt-2">
                  Welcome back, {engineerInfo.name} • {engineerInfo.region && `Region: ${engineerInfo.region}`}
                </p>
              )}
            </div>
            <Button onClick={forceRefresh} variant="outline" size="sm">
              🔄 Refresh Data
            </Button>
          </div>
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