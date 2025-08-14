import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Engineer {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  region: string | null;
  availability: boolean;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  installation_date: string | null;
}

export const SimplifiedAdminInstallManagement: React.FC = () => {
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch engineers (installers in current schema)
      const { data: engineersData, error: engineersError } = await supabase
        .from('installers')
        .select('*')
        .order('name');

      if (engineersError) throw engineersError;

      setEngineers(engineersData || []);

      // Fetch orders that need installation
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .in('status', ['confirmed', 'scheduled'])
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      setOrders(ordersData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      // Refresh data
      fetchData();

      toast({
        title: "Success",
        description: "Order status updated",
      });
    } catch (error) {
      console.error('Error updating order:', error);
      toast({
        title: "Error",
        description: "Failed to update order",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'confirmed': return 'default';
      case 'scheduled': return 'secondary';
      case 'in_progress': return 'outline';
      case 'completed': return 'default';
      default: return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Engineers Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Engineers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {engineers.map((engineer) => (
              <div key={engineer.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{engineer.name}</h4>
                  <Badge variant={engineer.availability ? 'default' : 'secondary'}>
                    {engineer.availability ? 'Available' : 'Busy'}
                  </Badge>
                </div>
                {engineer.email && (
                  <p className="text-sm text-muted-foreground">{engineer.email}</p>
                )}
                {engineer.phone && (
                  <p className="text-sm text-muted-foreground">{engineer.phone}</p>
                )}
                {engineer.region && (
                  <p className="text-sm text-muted-foreground">Region: {engineer.region}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Installation Queue */}
      <Card>
        <CardHeader>
          <CardTitle>Installation Queue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orders.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No installations pending
              </p>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Order {order.order_number}</h4>
                    <Badge variant={getStatusBadgeVariant(order.status)} className="mt-1">
                      {order.status.replace('_', ' ').toUpperCase()}
                    </Badge>
                    {order.installation_date && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Scheduled: {new Date(order.installation_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    {order.status === 'confirmed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, 'scheduled')}
                      >
                        Schedule
                      </Button>
                    )}
                    {order.status === 'scheduled' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, 'in_progress')}
                      >
                        Start Work
                      </Button>
                    )}
                    {order.status === 'in_progress' && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => updateOrderStatus(order.id, 'completed')}
                      >
                        Complete
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};