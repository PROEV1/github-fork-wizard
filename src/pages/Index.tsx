
import { Button } from "@/components/ui/button";
import { ProSpacesLogo } from "@/components/ProSpacesLogo";
import { ArrowRight, Sparkles } from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-cream via-brand-pink-light to-brand-green-light">
      <div className="text-center max-w-4xl mx-auto p-8">
        <div className="mb-8">
          <ProSpacesLogo variant="main" size="xl" className="mx-auto mb-6" />
        </div>
        
        <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-12 shadow-2xl">
          <div className="flex items-center justify-center mb-6">
            <Sparkles className="h-8 w-8 text-brand-teal mr-3" />
            <h1 className="text-5xl font-bold text-primary brand-heading-1">
              Welcome to ProSpaces
            </h1>
          </div>
          
          <h2 className="text-2xl text-muted-foreground mb-8 brand-heading-2">
            Your Professional Space Design Platform
          </h2>
          
          <p className="text-lg text-muted-foreground mb-12 brand-body max-w-2xl mx-auto">
            Transform your workspace with our comprehensive design solutions. 
            From consultation to completion, we bring your vision to life.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="brand-gradient-teal p-6 rounded-xl text-white">
              <h3 className="text-xl font-semibold mb-3 brand-heading-3">Design</h3>
              <p className="brand-body">Professional space planning and interior design services</p>
            </div>
            
            <div className="brand-gradient-pink p-6 rounded-xl text-primary">
              <h3 className="text-xl font-semibold mb-3 brand-heading-3">Consultation</h3>
              <p className="brand-body">Expert advice tailored to your specific needs and budget</p>
            </div>
            
            <div className="brand-gradient-green p-6 rounded-xl text-primary">
              <h3 className="text-xl font-semibold mb-3 brand-heading-3">Implementation</h3>
              <p className="brand-body">Full project management from concept to completion</p>
            </div>
          </div>
          
          <Button 
            onClick={() => window.location.href = "/auth"} 
            size="lg"
            className="bg-brand-teal hover:bg-brand-teal-dark text-white px-8 py-4 text-lg brand-body"
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
