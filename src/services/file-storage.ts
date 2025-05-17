
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

/**
 * Sube un archivo al bucket de Supabase Storage
 * @param {File} file - Archivo a subir
 * @param {string} bucketName - Nombre del bucket
 * @returns {Promise<string|null>} - URL pública del archivo subido o null
 */
export const uploadFile = async (file: File, bucketName: string = 'resumes'): Promise<string | null> => {
  try {
    // Validaciones básicas
    if (!file) {
      toast.error('No se ha seleccionado ningún archivo');
      return null;
    }

    // Validar tipo
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de archivo no válido. Por favor, sube un PDF, DOC o DOCX.');
      return null;
    }
    // Validar peso máximo 10MB
    if (file.size > 10 * 1024 * 1024) {
      toast.error('El archivo es demasiado grande. Máximo permitido: 10MB.');
      return null;
    }

    // Crear un nombre seguro para el archivo
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._]/g, '_');
    const fileName = `${Date.now()}_${sanitizedFileName}`;

    // Intentar subir el archivo hasta 3 veces (retry simple)
    let uploadError = null;
    let urlData = null;

    for (let i = 0; i < 3; i++) {
      const { data, error } = await supabase.storage
        .from(bucketName)
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type
        });
      if (!error) {
        const { data: urlObj } = supabase.storage
          .from(bucketName)
          .getPublicUrl(fileName);
        if (urlObj?.publicUrl) {
          toast.success('CV subido correctamente');
          return urlObj.publicUrl;
        }
        break;
      } else {
        uploadError = error;
        // Esperar antes de reintentar
        if (i < 2) await new Promise(res => setTimeout(res, 800 * (i + 1)));
      }
    }

    if (uploadError) {
      toast.error(`Error al subir: ${uploadError?.message || 'Desconocido'}`);
    }
    return null;
  } catch (err: any) {
    toast.error(`No se pudo subir el archivo: ${err.message || 'Error desconocido'}`);
    return null;
  }
};

/**
 * Verifica si el bucket 'resumes' está accesible
 * @returns {Promise<boolean>}
 */
export const checkResumesBucketStatus = async (): Promise<boolean> => {
  try {
    // Se intenta obtener una lista de archivos (aunque esté vacía) para verificar acceso
    const { error } = await supabase.storage.from('resumes').list('', { limit: 1 });
    return !error;
  } catch {
    return false;
  }
};

/**
 * Asegura que un bucket exista (crea si necesario)
 * @param {string} bucketName 
 * @returns {Promise<boolean>}
 */
export const ensureBucketExists = async (bucketName: string): Promise<boolean> => {
  try {
    // Intentar crear el bucket (si ya existe no pasa nada)
    const { error } = await supabase.storage.createBucket(bucketName, { public: true });
    if (!error) return true;
    // Si error es "already exists", igual lo consideramos disponible
    if (error.message?.includes('exists')) return true;
    return false;
  } catch {
    return false;
  }
};

// Para mantener compatibilidad con imports previos
export { ensureBucketExists as ensureBucketExistsFromClient };
