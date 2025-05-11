
import { supabase } from '@/integrations/supabase/client';
import { Candidate, Application } from '@/types/candidate';

export async function fetchCandidateDetails(candidateId: string): Promise<Candidate> {
  const { data: candidateData, error: candidateError } = await supabase
    .from('candidates')
    .select('*, applications(id, status, job_id, created_at)')
    .eq('id', candidateId)
    .single();
  
  if (candidateError) {
    console.error('Error al obtener candidato:', candidateError);
    throw candidateError;
  }
  
  if (!candidateData) {
    throw new Error('No se encontró el candidato');
  }

  let analysisData = null;
  
  // Parse analysis_data if it exists
  if (candidateData.analysis_summary) {
    try {
      // Try to parse as JSON
      analysisData = JSON.parse(candidateData.analysis_summary);
      // Check if it's a JSON string (result of a previous analysis)
      if (typeof analysisData === 'string') {
        try {
          analysisData = JSON.parse(analysisData);
        } catch (e) {
          console.log('El análisis ya está en formato string, no es JSON');
        }
      }
    } catch (e) {
      console.error('Error al parsear analysis_summary:', e);
      // If it can't be parsed as JSON, assume it's the old format
      analysisData = {
        perfilProfesional: candidateData.analysis_summary
      };
    }
  }

  // If there are applications, fetch job details for each
  let appsWithJobDetails = [];
  if (candidateData.applications && candidateData.applications.length > 0) {
    const jobPromises = candidateData.applications.map(async (app: any) => {
      const { data: jobData } = await supabase
        .from('jobs')
        .select('id, title, department, type, description, requirements, responsibilities')
        .eq('id', app.job_id)
        .single();
      
      return {
        ...app,
        job_title: jobData?.title ?? 'Vacante Desconocida',
        job_department: jobData?.department ?? 'Departamento Desconocido',
        job_type: jobData?.type ?? 'tiempo-completo',
        job_description: jobData?.description,
        job_requirements: jobData?.requirements,
        job_responsibilities: jobData?.responsibilities
      };
    });
    
    appsWithJobDetails = await Promise.all(jobPromises);
  }

  return {
    ...candidateData,
    analysis_data: analysisData,
    applications: appsWithJobDetails
  };
}

export async function saveAnalysisData(candidateId: string, analysisResult: any, extractedText: string) {
  try {
    console.log('Guardando datos de análisis...');
    console.log('ID del candidato:', candidateId);
    console.log('Texto extraído (longitud):', extractedText ? extractedText.length : 0);
    console.log('Tiene datos de análisis:', !!analysisResult);
    
    // Primero guardamos el texto extraído del CV directamente en la base de datos
    // para asegurarnos de que esté disponible incluso si la función Edge falla
    const { error: updateError } = await supabase
      .from('candidates')
      .update({
        resume_text: extractedText,
        updated_at: new Date().toISOString()
      })
      .eq('id', candidateId);
      
    if (updateError) {
      console.error('Error al guardar texto extraído:', updateError);
      throw new Error(`Error al actualizar texto del CV: ${updateError.message}`);
    }
    
    // Solo si tenemos datos de análisis, llamamos a la función Edge
    if (analysisResult) {
      // Call our edge function to save the data
      const response = await supabase.functions.invoke('save-candidate-data', {
        body: {
          candidateId,
          resumeText: extractedText,
          analysisData: analysisResult
        }
      });
      
      if (!response.data?.success) {
        throw new Error(response.error?.message || 'Error al guardar datos del análisis');
      }
      
      return response.data;
    }
    
    return { success: true, message: 'Texto del CV guardado correctamente' };
  } catch (error: any) {
    console.error('Error al guardar datos del candidato:', error);
    throw error;
  }
}

export async function saveResumeText(candidateId: string, extractedText: string) {
  try {
    console.log('Guardando texto extraído del CV...');
    
    const { error } = await supabase
      .from('candidates')
      .update({
        resume_text: extractedText,
        updated_at: new Date().toISOString()
      })
      .eq('id', candidateId);
      
    if (error) {
      console.error('Error al guardar texto extraído:', error);
      throw new Error(`Error al actualizar texto del CV: ${error.message}`);
    }
    
    return { success: true, message: 'Texto del CV guardado correctamente' };
  } catch (error: any) {
    console.error('Error al guardar texto del CV:', error);
    throw error;
  }
}

export async function analyzeResume(extractedText: string, jobDetails: any = null) {
  try {
    console.log('Analizando CV...');
    console.log('Texto extraído (longitud):', extractedText ? extractedText.length : 0);
    console.log('Tiene detalles del trabajo:', !!jobDetails);
    
    const response = await supabase.functions.invoke('extract-pdf-text', {
      body: { 
        extractedText,
        jobDetails
      }
    });
    
    if (!response.data?.success) {
      console.error('Error en la respuesta de extract-pdf-text:', response.error || response.data?.error);
      throw new Error(response.error?.message || response.data?.error || "Error durante el análisis del CV");
    }

    return response.data.analysis;
  } catch (error: any) {
    console.error('Error al analizar el CV:', error);
    throw error;
  }
}

export function getResumeUrl(path: string) {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const { data } = supabase.storage.from('resumes').getPublicUrl(path);
  return data.publicUrl;
}
