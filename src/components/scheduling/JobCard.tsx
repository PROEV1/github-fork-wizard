import React from 'react';
import { useDrag } from 'react-dnd';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Order, Engineer, getStatusColor } from '@/utils/schedulingUtils';
import { MapPin, User, Calendar, Clock } from 'lucide-react';

interface JobCardProps {
  order: Order;
  engineers: Engineer[];
  onJobDrop?: (orderId: string, engineerId: string, slotInfo: any) => void;
  isDraggable?: boolean;
}

export function JobCard({ order, engineers, onJobDrop, isDraggable = false }: JobCardProps) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'job',
    item: { 
      orderId: order.id, 
      order 
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }), [order]);

  const statusColor = getStatusColor(order.status_enhanced);
  
  // Parse scheduling conflicts safely
  let conflicts: any[] = [];
  if (order.scheduling_conflicts) {
    try {
      conflicts = Array.isArray(order.scheduling_conflicts) 
        ? order.scheduling_conflicts 
        : JSON.parse(order.scheduling_conflicts as string);
    } catch (e) {
      // Ignore parsing errors
    }
  }
  const hasConflicts = conflicts.length > 0;

  return (
    <Card 
      ref={isDraggable ? drag : undefined}
      className={`
        cursor-pointer transition-all duration-200 hover:shadow-md
        ${isDragging ? 'opacity-50 scale-95' : ''}
        ${hasConflicts ? 'border-destructive' : ''}
        ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}
      `}
    >
      <CardContent className="p-3">
        <div className="space-y-2">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div>
              <h4 className="font-medium text-sm">{order.order_number}</h4>
              <p className="text-xs text-muted-foreground">
                {order.client?.full_name}
              </p>
            </div>
            <Badge 
              variant="outline" 
              style={{ 
                borderColor: statusColor,
                color: statusColor 
              }}
              className="text-xs"
            >
              {order.status_enhanced.replace('_', ' ')}
            </Badge>
          </div>

          {/* Details */}
          <div className="space-y-1 text-xs text-muted-foreground">
            {order.job_address && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{order.job_address}</span>
              </div>
            )}
            
            {order.engineer && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{order.engineer.name}</span>
                {order.engineer.region && (
                  <span className="text-xs opacity-75">({order.engineer.region})</span>
                )}
              </div>
            )}

            {order.scheduled_install_date && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(order.scheduled_install_date).toLocaleDateString()}</span>
              </div>
            )}

            {order.time_window && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{order.time_window}</span>
              </div>
            )}

            {order.estimated_duration_hours && (
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{order.estimated_duration_hours}h estimated</span>
              </div>
            )}
          </div>

          {/* Conflicts */}
          {hasConflicts && (
            <div className="mt-2 p-2 bg-destructive/10 rounded border border-destructive/20">
              <div className="flex items-center gap-1 text-destructive text-xs font-medium">
                ⚠️ Conflicts Detected
              </div>
              {conflicts.map((conflict, index) => (
                <div key={index} className="text-xs text-destructive mt-1">
                  {conflict.message}
                </div>
              ))}
            </div>
          )}

          {/* Draggable indicator */}
          {isDraggable && (
            <div className="text-center mt-2 pt-2 border-t border-border">
              <span className="text-xs text-muted-foreground">
                Drag to assign to calendar
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}