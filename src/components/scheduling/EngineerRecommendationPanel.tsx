import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Order, Engineer, calculateDistance, calculateTravelTime } from '@/utils/schedulingUtils';
import { MapPin, Clock, User, Star, Zap, CheckCircle, X } from 'lucide-react';

interface EngineerSuggestion {
  engineer: Engineer;
  distance: number;
  travelTime: number;
  workload: number;
  isAvailable: boolean;
  score: number;
  reasons: string[];
}

interface EngineerRecommendationPanelProps {
  order: Order;
  engineers: Engineer[];
  selectedDate: Date;
  onSelectEngineer: (engineerId: string | null) => void;
  isVisible: boolean;
}

export function EngineerRecommendationPanel({
  order,
  engineers,
  selectedDate,
  onSelectEngineer,
  isVisible
}: EngineerRecommendationPanelProps) {
  const [suggestions, setSuggestions] = useState<EngineerSuggestion[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isVisible || !order || !selectedDate) return;

    const calculateSuggestions = async () => {
      setLoading(true);
      try {
        const suggestionPromises = engineers.map(async (engineer) => {
          const distance = calculateDistance(engineer.starting_postcode, order.postcode);
          const travelTime = calculateTravelTime(distance);
          
          // TODO: Implement actual workload calculation
          const workload = Math.floor(Math.random() * 3); // Mock workload
          const isAvailable = true; // TODO: Check actual availability
          
          const reasons: string[] = [];
          let score = 100;

          // Score based on distance (closer is better)
          if (distance <= 5) {
            score += 20;
            reasons.push('Very close to job location');
          } else if (distance <= 15) {
            score += 10;
            reasons.push('Reasonable distance');
          } else {
            score -= 10;
            reasons.push('Further distance');
          }

          // Score based on region match
          if (engineer.region && order.postcode) {
            const orderPostcodeArea = order.postcode.split(' ')[0];
            if (engineer.region.toLowerCase().includes(orderPostcodeArea.toLowerCase())) {
              score += 15;
              reasons.push('Same region coverage');
            }
          }

          // Score based on workload (less busy is better)
          if (workload === 0) {
            score += 15;
            reasons.push('Free schedule');
          } else if (workload === 1) {
            score += 5;
            reasons.push('Light schedule');
          } else {
            score -= 5;
            reasons.push('Busy schedule');
          }

          // Availability check
          if (!isAvailable) {
            score -= 50;
            reasons.push('Not available');
          }

          return {
            engineer,
            distance,
            travelTime,
            workload,
            isAvailable,
            score,
            reasons
          };
        });

        const suggestions = await Promise.all(suggestionPromises);
        
        // Sort by score (highest first)
        suggestions.sort((a, b) => b.score - a.score);
        
        setSuggestions(suggestions);
      } catch (error) {
        console.error('Error calculating suggestions:', error);
      } finally {
        setLoading(false);
      }
    };

    calculateSuggestions();
  }, [order, engineers, selectedDate, isVisible]);

  if (!isVisible) return null;

  const getScoreColor = (score: number) => {
    if (score >= 120) return 'text-green-600';
    if (score >= 100) return 'text-blue-600';
    if (score >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 120) return <Star className="h-4 w-4 text-green-600" />;
    if (score >= 100) return <Zap className="h-4 w-4 text-blue-600" />;
    if (score >= 80) return <CheckCircle className="h-4 w-4 text-yellow-600" />;
    return <Clock className="h-4 w-4 text-red-600" />;
  };

  return (
    <Card className="w-80 shadow-lg border-2 border-primary/20 bg-background">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Recommended Engineers
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => onSelectEngineer(null)}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          For {order.order_number} on {selectedDate.toLocaleDateString()}
        </p>
      </CardHeader>
      <CardContent className="space-y-3 max-h-96 overflow-y-auto">
        {loading ? (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Finding best engineers...</p>
          </div>
        ) : suggestions.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <User className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No engineers available</p>
          </div>
        ) : (
          suggestions.map((suggestion, index) => (
            <div key={suggestion.engineer.id}>
              <div 
                className={`
                  p-3 rounded-lg border cursor-pointer transition-all duration-200
                  hover:border-primary hover:shadow-md
                  ${index === 0 ? 'border-primary/50 bg-primary/5' : 'border-border'}
                  ${!suggestion.isAvailable ? 'opacity-60' : ''}
                `}
                onClick={() => onSelectEngineer(suggestion.engineer.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-xs">
                        {suggestion.engineer.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-sm">{suggestion.engineer.name}</p>
                      <p className="text-xs text-muted-foreground">{suggestion.engineer.region}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {getScoreIcon(suggestion.score)}
                    <span className={`text-sm font-medium ${getScoreColor(suggestion.score)}`}>
                      {suggestion.score}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground mb-2">
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{suggestion.distance.toFixed(1)}mi</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{suggestion.travelTime}min</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-2">
                  {suggestion.workload === 0 && (
                    <Badge variant="outline" className="text-xs text-green-600 border-green-200">
                      Free
                    </Badge>
                  )}
                  {suggestion.workload === 1 && (
                    <Badge variant="outline" className="text-xs text-blue-600 border-blue-200">
                      Light
                    </Badge>
                  )}
                  {suggestion.workload >= 2 && (
                    <Badge variant="outline" className="text-xs text-orange-600 border-orange-200">
                      Busy
                    </Badge>
                  )}
                  {index === 0 && (
                    <Badge className="text-xs bg-primary/10 text-primary border-primary">
                      Best Match
                    </Badge>
                  )}
                </div>

                <div className="space-y-1">
                  {suggestion.reasons.slice(0, 2).map((reason, idx) => (
                    <p key={idx} className="text-xs text-muted-foreground">
                      • {reason}
                    </p>
                  ))}
                </div>

                <Button 
                  size="sm" 
                  className="w-full mt-2" 
                  variant={index === 0 ? "default" : "outline"}
                  disabled={!suggestion.isAvailable}
                >
                  {index === 0 ? 'Assign (Recommended)' : 'Assign Engineer'}
                </Button>
              </div>
              {index < suggestions.length - 1 && <Separator className="my-2" />}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}