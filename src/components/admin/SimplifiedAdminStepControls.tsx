import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  amount_paid: number;
}

interface SimplifiedAdminStepControlsProps {
  order: Order;
  onStatusUpdate: (orderId: string, newStatus: string) => void;
}

export const SimplifiedAdminStepControls: React.FC<SimplifiedAdminStepControlsProps> = ({ 
  order, 
  onStatusUpdate 
}) => {
  const steps = [
    { id: 'pending', name: 'Order Received', icon: Clock },
    { id: 'confirmed', name: 'Order Confirmed', icon: CheckCircle },
    { id: 'scheduled', name: 'Installation Scheduled', icon: Clock },
    { id: 'in_progress', name: 'Installation In Progress', icon: AlertCircle },
    { id: 'completed', name: 'Completed', icon: CheckCircle },
  ];

  const currentStepIndex = steps.findIndex(step => step.id === order.status);
  const isPaymentComplete = order.amount_paid >= order.total_amount;

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStepIndex) return 'completed';
    if (stepIndex === currentStepIndex) return 'current';
    return 'pending';
  };

  const canProgressToNext = () => {
    if (order.status === 'pending') return isPaymentComplete;
    if (order.status === 'completed') return false;
    return true;
  };

  const getNextStatus = () => {
    const nextStepIndex = currentStepIndex + 1;
    return nextStepIndex < steps.length ? steps[nextStepIndex].id : null;
  };

  const handleProgressOrder = () => {
    const nextStatus = getNextStatus();
    if (nextStatus) {
      onStatusUpdate(order.id, nextStatus);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Order Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Steps */}
        <div className="space-y-4">
          {steps.map((step, index) => {
            const status = getStepStatus(index);
            const StepIcon = step.icon;
            
            return (
              <div key={step.id} className="flex items-center space-x-3">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  status === 'completed' ? 'bg-brand-green text-white' :
                  status === 'current' ? 'bg-brand-blue text-white' :
                  'bg-muted text-muted-foreground'
                }`}>
                  <StepIcon className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className={`font-medium ${
                    status === 'current' ? 'text-brand-blue' :
                    status === 'completed' ? 'text-brand-green' :
                    'text-muted-foreground'
                  }`}>
                    {step.name}
                  </p>
                  {status === 'current' && (
                    <Badge variant="outline" className="mt-1">
                      Current Step
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Payment Status */}
        <div className="p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="font-medium">Payment Status</span>
            <Badge variant={isPaymentComplete ? 'default' : 'secondary'}>
              {isPaymentComplete ? 'Paid' : 'Pending'}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            £{order.amount_paid.toFixed(2)} of £{order.total_amount.toFixed(2)} paid
          </p>
        </div>

        {/* Action Button */}
        {canProgressToNext() && (
          <Button 
            onClick={handleProgressOrder}
            className="w-full"
            disabled={!isPaymentComplete && order.status === 'pending'}
          >
            {order.status === 'pending' && !isPaymentComplete && 'Waiting for Payment'}
            {order.status === 'pending' && isPaymentComplete && 'Confirm Order'}
            {order.status === 'confirmed' && 'Schedule Installation'}
            {order.status === 'scheduled' && 'Start Installation'}
            {order.status === 'in_progress' && 'Mark Complete'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};