
import { supabase, checkBucketExists, verifyBucketAccess } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

/**
 * Uploads a file to the specified storage bucket
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
    
    // Check if bucket exists and is accessible
    const bucketExists = await checkBucketExists(bucketName);
    const canAccessBucket = bucketExists ? await verifyBucketAccess(bucketName) : false;
    
    if (!bucketExists || !canAccessBucket) {
      console.warn(`Bucket '${bucketName}' does not exist or is not accessible.`);
      toast.error('El sistema de almacenamiento no está disponible en este momento.');
      return null;
    }
    
    // Attempt to upload the file
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type
      });
    
    // Handle upload errors
    if (error) {
      console.error('Error uploading file:', error);
      
      // Show error message based on the error type
      if (error.message.includes('Authentication')) {
        toast.error('Error de autenticación al subir el archivo');
      } else if (error.message.includes('Permission denied')) {
        toast.error('Permiso denegado para subir el archivo');
      } else if (error.message.includes('storage quota')) {
        toast.error('Cuota de almacenamiento excedida');
      } else {
        toast.error(`Error al subir: ${error.message}`);
      }
      
      return null;
    }
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);
      
    if (urlData?.publicUrl) {
      console.log('File uploaded successfully:', urlData.publicUrl);
      toast.success('CV subido correctamente');
    }
      
    return urlData?.publicUrl || null;
  } catch (err: any) {
    console.error('Unexpected error during file upload:', err);
    toast.error(`No se pudo subir el archivo: ${err.message || 'Error desconocido'}`);
    return null;
  }
};

/**
 * Advanced function to ensure bucket exists with retry mechanism
 * @param {string} bucketName - The name of the bucket to check/create
 * @param {number} maxRetries - Maximum number of retry attempts
 * @returns {Promise<boolean>} - Whether the bucket exists/was created successfully
 */
export const ensureBucketExists = async (bucketName: string = 'resumes', maxRetries: number = 3): Promise<boolean> => {
  try {
    console.log(`Checking if ${bucketName} bucket exists...`);
    
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return false;
    }
    
    const bucketExists = buckets?.some(bucket => bucket.id === bucketName);
    
    if (bucketExists) {
      console.log(`${bucketName} bucket already exists`);
      return true;
    }
    
    // No need to try creating a bucket from client side as it will fail due to RLS
    // Instead, we verify if the bucket exists and is accessible
    console.log(`Bucket '${bucketName}' does not exist or client does not have permission to see it`);
    
    // Verify bucket access by trying to list files in it
    const { error: accessError } = await supabase.storage.from(bucketName).list();
    
    if (!accessError) {
      console.log(`${bucketName} bucket is accessible even though it wasn't listed`);
      return true;
    }
    
    // If we can't see or access the bucket, inform the user
    console.error(`Cannot access ${bucketName} bucket:`, accessError);
    
    // The bucket either doesn't exist or we don't have permission to see it
    return false;
  } catch (err) {
    console.error('Error ensuring bucket exists:', err);
    return false;
  }
};
