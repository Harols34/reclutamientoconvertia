
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

/**
 * Uploads a file to the specified storage bucket
 * @param {File} file - The file to upload
 * @param {string} bucketName - The name of the bucket to upload to
 * @returns {Promise<string|null>} - The public URL of the uploaded file or null on failure
 */
export const uploadFile = async (file: File, bucketName: string = 'resumes'): Promise<string | null> => {
  try {
    // Clean the file name to avoid path issues
    const fileExt = file.name.split('.').pop() || '';
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9._]/g, '_');
    const fileName = `${Date.now()}_${sanitizedFileName}`;
    
    console.log(`Uploading file ${fileName} to ${bucketName} bucket`);
    
    // Attempt to upload the file
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });
    
    // Handle upload errors
    if (error) {
      console.error('Error uploading file:', error);
      
      // Show error message based on the error type
      if (error.message.includes('Authentication')) {
        toast.error('Error uploading: Authentication failed');
      } else if (error.message.includes('Permission denied')) {
        toast.error('Error uploading: Permission denied');
      } else {
        toast.error(`Error uploading: ${error.message}`);
      }
      
      return null;
    }
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(fileName);
      
    return urlData?.publicUrl || null;
  } catch (err: any) {
    console.error('Unexpected error during file upload:', err);
    toast.error(`Upload failed: ${err.message || 'Unknown error'}`);
    return null;
  }
};

/**
 * Checks if a bucket exists and creates it if it doesn't
 * @param {string} bucketName - The name of the bucket to check/create
 * @returns {Promise<boolean>} - Whether the bucket exists/was created successfully
 */
export const ensureBucketExists = async (bucketName: string = 'resumes'): Promise<boolean> => {
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
    
    console.log(`Creating ${bucketName} bucket...`);
    
    // Create bucket if it doesn't exist
    const { error: createError } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 10485760 // 10MB
    });
    
    if (createError) {
      console.error('Error creating bucket:', createError);
      return false;
    }
    
    console.log(`${bucketName} bucket created successfully`);
    return true;
  } catch (err) {
    console.error('Error ensuring bucket exists:', err);
    return false;
  }
};
