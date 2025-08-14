-- Fix security warnings for functions by setting search_path

-- Update the existing update_updated_at_column function with proper security
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Update the existing log_order_activity function with proper security
CREATE OR REPLACE FUNCTION public.log_order_activity(
  p_order_id UUID,
  p_activity_type TEXT,
  p_description TEXT,
  p_details JSONB DEFAULT '{}'::jsonb
)
RETURNS void AS $$
BEGIN
  -- For now, just log to orders table with notes
  -- In the future, could create a separate activity log table
  UPDATE public.orders 
  SET manual_status_notes = COALESCE(manual_status_notes, '') || 
    E'\n' || now()::text || ': ' || p_description
  WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';