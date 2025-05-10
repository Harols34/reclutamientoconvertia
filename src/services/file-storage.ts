
import { supabase, checkBucketExists, verifyBucketAccess, ensureBucketExists as ensureBucketExistsFromClient } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

/**
 * Uploads a file to the specified storage bucket with improved error handling and retry mechanism
 * @param {File} file - The file to upload
 * @param {string} bucketName - The name of the bucket to upload to
 * @returns {Promise<string|null>} - The public URL of the uploaded file or null on failure
 */
export const uploadFile = async (file: File, bucketName: string = 'resumes'): Promise<string | null> => {
  try {
    // Validate file
    if (!file) {
      console.error('No file provided for upload');
      return null;
    }

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de archivo no válido. Por favor, sube un PDF, DOC o DOCX.');
      return null;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      toast.error('El archivo es demasiado grande. El tamaño máximo permitido es 10MB.');
      return null;
    }

    // Clean the file name to avoid path issues
    const fileExt = file.name.split('.').pop() || '';
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._]/g, '_');
    const fileName = `${Date.now()}_${sanitizedFileName}`;
    
    console.log(`Uploading file ${fileName} to ${bucketName} bucket`);
    
    // Ensure bucket exists and is accessible
    console.log('Checking bucket availability...');
    let bucketExists = await checkBucketExists(bucketName);
    
    if (!bucketExists) {
      console.warn(`Bucket '${bucketName}' does not exist. Attempting to create it...`);
      // Try to create the bucket if it doesn't exist
      const created = await ensureBucketExists(bucketName);
      if (created) {
        console.log(`Successfully created and configured bucket '${bucketName}'`);
        bucketExists = true;
      } else {
        console.error(`Cannot create bucket '${bucketName}'.`);
      }
    }
    
    // Even if bucket doesn't appear in listing, try to access it directly
    const canAccessBucket = await verifyBucketAccess(bucketName);
    
    if (!canAccessBucket) {
      console.error(`Cannot access bucket '${bucketName}'. File upload will fail.`);
      toast.error('El sistema de almacenamiento no está disponible en este momento.');
      return null;
    }
    
    console.log(`Bucket '${bucketName}' is accessible, proceeding with upload...`);
    
    // Implement retry mechanism
    const maxRetries = 3;
    let attempt = 0;
    let uploadError = null;
    
    while (attempt < maxRetries) {
      attempt++;
      try {
        console.log(`Upload attempt ${attempt} of ${maxRetries}...`);
        // Attempt to upload the file
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
            contentType: file.type
          });
        
        // If successful, break out of retry loop
        if (!error) {
          // Get the public URL
          const { data: urlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(fileName);
            
          if (urlData?.publicUrl) {
            console.log('File uploaded successfully:', urlData.publicUrl);
            toast.success('CV subido correctamente');
            return urlData.publicUrl;
          }
          
          return null;
        }
        
        // Store error for potential reporting
        uploadError = error;
        console.error(`Upload attempt ${attempt} failed:`, error);
        
        // Wait before retrying
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 500; // Exponential backoff
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      } catch (err) {
        console.error(`Unexpected error during upload attempt ${attempt}:`, err);
        uploadError = err;
        
        // Wait before retrying
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt) * 500; // Exponential backoff
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // If we reach this point, all attempts have failed
    if (uploadError) {
      console.error('All upload attempts failed:', uploadError);
      
      // Show specific error message based on the error type
      if (uploadError.message?.includes('Authentication')) {
        toast.error('Error de autenticación al subir el archivo');
      } else if (uploadError.message?.includes('Permission denied')) {
        toast.error('Permiso denegado para subir el archivo');
      } else if (uploadError.message?.includes('storage quota')) {
        toast.error('Cuota de almacenamiento excedida');
      } else {
        toast.error(`Error al subir: ${uploadError.message || 'Error desconocido'}`);
      }
    }
    
    return null;
  } catch (err: any) {
    console.error('Unexpected error during file upload:', err);
    toast.error(`No se pudo subir el archivo: ${err.message || 'Error desconocido'}`);
    return null;
  }
};

/**
 * Checks if the resumes bucket exists and is properly configured
 * @returns {Promise<boolean>} - Whether the resumes bucket is properly configured
 */
export const checkResumesBucketStatus = async (): Promise<boolean> => {
  try {
    console.log('Checking resume bucket status...');
    
    // Check if bucket exists
    const bucketExists = await checkBucketExists('resumes');
    
    if (!bucketExists) {
      console.log('Resumes bucket does not exist in listing.');
      
      // Even if it's not listed, try to access it directly
      const canAccess = await verifyBucketAccess('resumes');
      
      if (canAccess) {
        console.log('Bucket appears to be accessible even though not listed.');
        return true;
      }
      
      console.log('Cannot access resumes bucket. It needs to be created.');
      return false;
    }
    
    // Verify access permissions
    const hasAccess = await verifyBucketAccess('resumes');
    
    if (!hasAccess) {
      console.error('Bucket exists but cannot be accessed.');
      return false;
    }
    
    console.log('Resumes bucket is properly configured and accessible.');
    return true;
  } catch (err) {
    console.error('Error checking resume bucket status:', err);
    return false;
  }
};

/**
 * Ensures that a bucket exists by creating it if needed
 * @param {string} bucketName - The name of the bucket to ensure exists
 * @returns {Promise<boolean>} - Whether the bucket exists or was created successfully
 */
export const ensureBucketExists = async (bucketName: string): Promise<boolean> => {
  try {
    return await ensureBucketExistsFromClient(bucketName);
  } catch (err) {
    console.error(`Error ensuring bucket ${bucketName} exists:`, err);
    return false;
  }
};

// Export the ensureBucketExists function from the client
export { ensureBucketExists as ensureBucketExistsFromClient };
