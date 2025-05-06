
-- Create reports table to store generated reports
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  parameters JSONB DEFAULT '{}'::jsonb,
  result JSONB DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create system settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL DEFAULT 'CONVERT-IA Reclutamiento',
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  language TEXT NOT NULL DEFAULT 'es',
  theme TEXT NOT NULL DEFAULT 'system',
  settings JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Set up RLS policies
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Policies for reports
CREATE POLICY "Authenticated users can select reports"
ON public.reports FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert reports"
ON public.reports FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update reports"
ON public.reports FOR UPDATE
TO authenticated
USING (true);

-- Policies for system_settings
CREATE POLICY "Authenticated users can select system settings"
ON public.system_settings FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can update system settings"
ON public.system_settings FOR UPDATE
TO authenticated
USING (true);

-- Insert default system settings if not exists
INSERT INTO public.system_settings (company_name, email_notifications, language, theme)
VALUES ('CONVERT-IA Reclutamiento', true, 'es', 'system')
ON CONFLICT DO NOTHING;
