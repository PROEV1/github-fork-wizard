import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutDashboard, Users, FileText, Calendar } from 'lucide-react';

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-hero">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">
            Business Management System
          </h1>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Streamline your operations with our comprehensive platform for managing clients, engineers, quotes, and orders.
          </p>
          <div className="space-x-4">
            <Button asChild size="lg" className="bg-white text-primary hover:bg-white/90">
              <Link to="/auth">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-white text-white hover:bg-white/10">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader>
              <LayoutDashboard className="w-12 h-12 mb-4 text-white" />
              <CardTitle>Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/80">
                Comprehensive overview of your business operations
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader>
              <Users className="w-12 h-12 mb-4 text-white" />
              <CardTitle>Client Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/80">
                Manage clients, engineers, and team members
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader>
              <FileText className="w-12 h-12 mb-4 text-white" />
              <CardTitle>Quotes & Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/80">
                Create and track quotes, orders, and invoices
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader>
              <Calendar className="w-12 h-12 mb-4 text-white" />
              <CardTitle>Scheduling</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-white/80">
                Advanced scheduling and availability management
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Index;