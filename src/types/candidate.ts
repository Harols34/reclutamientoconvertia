
export interface ExperienceItem {
  empresa: string;
  cargo: string;
  fechas: string;
  responsabilidades: string[];
}

export interface EducationItem {
  institucion: string;
  carrera: string;
  fechas: string;
}

export interface AnalysisData {
  datosPersonales?: {
    nombre?: string;
    telefono?: string;
    email?: string;
    ubicacion?: string;
    disponibilidad?: string;
    linkedin?: string;
  };
  perfilProfesional?: string;
  experienciaLaboral?: ExperienceItem[];
  educacion?: EducationItem[];
  habilidades?: string[];
  certificaciones?: string[];
  idiomas?: string[];
  fortalezas?: string[];
  areasAMejorar?: string[];
  compatibilidad?: {
    porcentaje?: number;
    fortalezas?: string[];
    debilidades?: string[];
    recomendacion?: string;
  };
}

export interface Application {
  id: string;
  status: string;
  job_id: string;
  job_title?: string;
  job_department?: string;
  created_at: string;
  job_type?: string;
  job_requirements?: string | null;
  job_responsibilities?: string | null;
  job_description?: string | null;
}

export interface Candidate {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  location?: string;
  experience_years?: number;
  skills?: string[];
  created_at: string;
  resume_url?: string;
  resume_text?: string;
  analysis_summary?: string;
  analysis_data?: AnalysisData;
  applications?: Application[];
  linkedin_url?: string;
  portfolio_url?: string;
  updated_at: string;
}
