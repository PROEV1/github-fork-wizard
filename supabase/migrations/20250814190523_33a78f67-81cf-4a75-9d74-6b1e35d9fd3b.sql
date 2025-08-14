-- Fix security warning for generate_quote_number function
CREATE OR REPLACE FUNCTION public.generate_quote_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.quote_number IS NULL THEN
    NEW.quote_number := 'Q' || TO_CHAR(now(), 'YYYY') || '-' || LPAD(NEXTVAL('quote_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$;