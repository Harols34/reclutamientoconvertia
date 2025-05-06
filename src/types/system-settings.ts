
export interface SystemSettings {
  id: string;
  company_name: string;
  email_notifications: boolean;
  language: string;
  theme: string;
  created_at: string;
  updated_at: string;
  settings?: Record<string, any>;
}
