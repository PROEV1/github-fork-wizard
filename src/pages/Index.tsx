
import { Button } from "@/components/ui/button";
import { ProEVLogo } from "@/components/ProEVLogo";
import { ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useUserRole } from "@/hooks/useUserRole";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const { role, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Index: Auth state check', { 
      user: user?.id, 
      role, 
      authLoading, 
      roleLoading 
    });
    
    // If user is authenticated and we have their role, redirect to appropriate dashboard
    if (!authLoading && !roleLoading && user && role) {
      console.log('Index: All data loaded, redirecting based on role:', role);
      switch (role) {
        case 'admin':
          console.log('Index: Redirecting admin to dashboard');
          navigate('/dashboard');
          break;
        case 'engineer':
          console.log('Index: Redirecting engineer to engineer dashboard');
          navigate('/engineer');
          break;
        case 'client':
          console.log('Index: Redirecting client to client dashboard');
          navigate('/client');
          break;
        default:
          console.log('Index: Unknown role, defaulting to client dashboard');
          navigate('/client');
      }
    } else if (!authLoading && !roleLoading && user && !role) {
      console.log('Index: User authenticated but no role found, defaulting to client');
      navigate('/client');
    }
  }, [user, role, authLoading, roleLoading, navigate]);

  // Show landing page for unauthenticated users or while loading
  if (authLoading || roleLoading) {
    console.log('Index: Still loading', { authLoading, roleLoading });
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-cream via-brand-pink-light to-brand-green-light">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-brand-teal"></div>
      </div>
    );
  }
  
  // If user is authenticated but we're still here, something went wrong with redirect
  if (user) {
    console.log('Index: User authenticated but still on landing page', { user: user.id, role });
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-cream via-brand-pink-light to-brand-green-light">
      <div className="text-center max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <ProEVLogo variant="main" size="xl" className="mx-auto mb-6" />
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-2xl">
          <div className="flex items-center justify-center mb-6">
            <Sparkles className="h-8 w-8 text-brand-teal mr-3" />
            <h1 className="text-5xl font-bold text-primary brand-heading-1">
              Welcome to Pro EV
            </h1>
          </div>
          
          <h2 className="text-2xl text-muted-foreground mb-8 brand-heading-2">
            Your Professional EV Charging Solutions
          </h2>
          
          <p className="text-lg text-muted-foreground mb-12 brand-body max-w-2xl mx-auto">
            Transform your property with professional EV charging solutions. 
            From consultation to installation, we deliver reliable charging infrastructure.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="brand-gradient-electric-blue p-6 rounded-xl text-white">
              <h3 className="text-xl font-semibold mb-3 brand-heading-3">EV Chargers</h3>
              <p className="brand-body">High-quality home and business EV charging solutions</p>
            </div>
            
            <div className="brand-gradient-orange p-6 rounded-xl text-primary">
              <h3 className="text-xl font-semibold mb-3 brand-heading-3">Installation</h3>
              <p className="brand-body">Professional installation by certified engineers</p>
            </div>
            
            <div className="brand-gradient-ev-green p-6 rounded-xl text-primary">
              <h3 className="text-xl font-semibold mb-3 brand-heading-3">Support</h3>
              <p className="brand-body">Comprehensive warranty and ongoing maintenance</p>
            </div>
          </div>
          
          <Button 
            onClick={() => window.location.href = "/auth"} 
            size="lg"
            className="bg-brand-electric-blue hover:bg-brand-electric-blue-dark text-white px-8 py-4 text-lg brand-body"
          >
            Get Started Today
            <ArrowRight className="h-5 w-5 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
