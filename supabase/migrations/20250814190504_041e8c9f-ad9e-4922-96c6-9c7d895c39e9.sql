-- Clear existing tables and recreate with original schema
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.quotes CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.engineers CASCADE;
DROP TABLE IF EXISTS public.leads CASCADE;
DROP TABLE IF EXISTS public.system_settings CASCADE;
DROP TABLE IF EXISTS public.clients CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.log_order_activity(UUID, TEXT, TEXT, JSONB) CASCADE;

-- Create user roles enum
CREATE TYPE public.user_role AS ENUM ('admin', 'client');

-- Create profiles table for additional user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL,
  full_name TEXT,
  role user_role NOT NULL DEFAULT 'client',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create clients table for client-specific information
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create installers table
CREATE TABLE public.installers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  region TEXT,
  availability BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quotes table
CREATE TABLE public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  quote_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'viewed', 'accepted', 'declined')),
  product_details TEXT NOT NULL,
  materials_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  install_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  extras_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(10,2) NOT NULL DEFAULT 0,
  notes TEXT,
  expires_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  project_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'quote_accepted' CHECK (status IN ('quote_accepted', 'survey_complete', 'install_booked', 'in_progress', 'completed')),
  scheduled_date TIMESTAMP WITH TIME ZONE,
  installer_id UUID REFERENCES public.installers(id) ON DELETE SET NULL,
  installer_name TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create orders table (for backward compatibility with components)
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE SET NULL,
  order_number TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
  installation_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create files table for document uploads
CREATE TABLE public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  uploaded_by UUID REFERENCES auth.users(id) NOT NULL,
  upload_type TEXT NOT NULL CHECK (upload_type IN ('pre_install', 'agreement', 'drawing', 'rendering', 'guide', 'other')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table for communication
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  quote_id UUID REFERENCES public.quotes(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  sender_role user_role NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create lead_history table (for compatibility)
CREATE TABLE public.lead_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_lead_id UUID NOT NULL,
  lead_name TEXT NOT NULL,
  lead_email TEXT,
  lead_created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  converted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  client_id UUID REFERENCES public.clients(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create admin_settings table (for compatibility)
CREATE TABLE public.admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.installers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Create function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.profiles WHERE profiles.user_id = get_user_role.user_id;
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for clients
CREATE POLICY "Clients can view their own data" ON public.clients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Clients can update their own data" ON public.clients
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all clients" ON public.clients
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for installers
CREATE POLICY "Admins can manage installers" ON public.installers
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for quotes
CREATE POLICY "Clients can view their own quotes" ON public.quotes
  FOR SELECT USING (
    client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  );

CREATE POLICY "Clients can update their own quotes" ON public.quotes
  FOR UPDATE USING (
    client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all quotes" ON public.quotes
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for projects
CREATE POLICY "Clients can view their own projects" ON public.projects
  FOR SELECT USING (
    client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all projects" ON public.projects
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for orders
CREATE POLICY "Clients can view their own orders" ON public.orders
  FOR SELECT USING (
    client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can manage all orders" ON public.orders
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for files
CREATE POLICY "Clients can view their own files" ON public.files
  FOR SELECT USING (
    client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
  );

CREATE POLICY "Clients can upload files to their projects" ON public.files
  FOR INSERT WITH CHECK (
    client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())
    AND uploaded_by = auth.uid()
  );

CREATE POLICY "Admins can manage all files" ON public.files
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for messages
CREATE POLICY "Users can view messages for their projects/quotes" ON public.messages
  FOR SELECT USING (
    (project_id IN (SELECT id FROM public.projects WHERE client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())))
    OR (quote_id IN (SELECT id FROM public.quotes WHERE client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())))
    OR (public.get_user_role(auth.uid()) = 'admin')
  );

CREATE POLICY "Users can send messages for their projects/quotes" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND (
      (project_id IN (SELECT id FROM public.projects WHERE client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())))
      OR (quote_id IN (SELECT id FROM public.quotes WHERE client_id IN (SELECT id FROM public.clients WHERE user_id = auth.uid())))
      OR (public.get_user_role(auth.uid()) = 'admin')
    )
  );

-- RLS Policies for lead_history
CREATE POLICY "Admins can manage lead history" ON public.lead_history
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- RLS Policies for admin_settings
CREATE POLICY "Admins can manage admin settings" ON public.admin_settings
  FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Create functions for automatic timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Create triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_installers_updated_at
  BEFORE UPDATE ON public.installers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_admin_settings_updated_at
  BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Trigger to create profile on user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Generate quote numbers automatically
CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.quote_number IS NULL THEN
    NEW.quote_number := 'Q' || TO_CHAR(now(), 'YYYY') || '-' || LPAD(NEXTVAL('quote_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;

-- Create sequence for quote numbers
CREATE SEQUENCE IF NOT EXISTS quote_number_seq START 1;

-- Create trigger for quote number generation
CREATE TRIGGER generate_quote_number_trigger
  BEFORE INSERT ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_quote_number();

-- Insert default admin settings
INSERT INTO public.admin_settings (setting_key, setting_value, description) VALUES
  ('agreement_document_url', '#', 'URL to the full service agreement document'),
  ('terms_conditions_url', '#', 'URL to the terms and conditions document'),
  ('company_name', 'ProSpaces', 'Company name for agreements and documents'),
  ('default_deposit_percentage', '25', 'Default deposit percentage for quotes')
ON CONFLICT (setting_key) DO NOTHING;