import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { toast } from '@/components/ui/sonner';
import { Loader2, AlertCircle, CheckCircle2, Upload } from 'lucide-react';
import { supabase, checkBucketExists, verifyBucketAccess } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { uploadFile, ensureBucketExists } from '@/services/file-storage';

type JobType = {
  id: string;
  title: string;
  department: string;
  location: string;
  status: 'open' | 'in_progress' | 'closed' | 'draft';
  type: 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary';
  created_at: string;
  updated_at: string;
  description: string;
  requirements: string | null;
  responsibilities: string | null;
  salary_range: string | null;
  campaign_id: string | null;
  applicants: number;
  createdAt: Date;
};

const phoneSchema = z
  .string()
  .min(7, { message: 'El teléfono debe tener al menos 7 dígitos' })
  .max(15, { message: 'El teléfono no puede tener más de 15 dígitos' });

const applicationSchema = z.object({
  firstName: z.string().min(2, { message: 'El nombre es requerido' }),
  lastName: z.string().min(2, { message: 'El apellido es requerido' }),
  email: z.string().email({ message: 'Email inválido' }),
  phone: phoneSchema,
  phoneCountry: z.string().min(1, { message: 'Selecciona un país' }),
  resume: z.instanceof(File).optional().refine((file) => {
    if (!file) return true; // Make it optional
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    return validTypes.includes(file.type);
  }, 'Formato de archivo inválido. Por favor sube un PDF, DOC o DOCX.'),
  coverLetter: z.string().optional(),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

const ApplicationForm = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { toast: hookToast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [job, setJob] = useState<JobType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [storageBucketExists, setStorageBucketExists] = useState(false);
  const [checkingBucket, setCheckingBucket] = useState(true);
  const [bucketCheckComplete, setBucketCheckComplete] = useState(false);
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  
  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      phoneCountry: '57', // Default to Colombia
      coverLetter: '',
    },
  });

  // Fetch job details
  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        // Verificamos la existencia del trabajo directamente en la tabla jobs
        const { data: jobExists, error: jobExistsError } = await supabase
          .from('jobs')
          .select('id')
          .eq('id', jobId)
          .maybeSingle();
          
        if (jobExistsError || !jobExists) {
          console.error('Error o trabajo no encontrado:', jobExistsError);
          setError('No se encontró la vacante solicitada');
          setLoading(false);
          return;
        }
        
        // Use the updated RPC function to get job details
        const { data, error } = await supabase.rpc('get_job_by_id', {
          p_job_id: jobId
        });

        if (error) {
          console.error('Error fetching job:', error);
          setError('No se pudo cargar los detalles de la vacante');
          return;
        }

        if (data && data.length > 0) {
          // Convertimos los datos a nuestro tipo JobType
          const jobData: JobType = {
            id: data[0].id,
            title: data[0].title,
            department: data[0].department,
            location: data[0].location,
            status: data[0].status as "open" | "in_progress" | "closed" | "draft",
            type: data[0].type as "full-time" | "part-time" | "contract" | "internship" | "temporary",
            created_at: data[0].created_at,
            updated_at: data[0].updated_at,
            description: data[0].description,
            requirements: data[0].requirements,
            responsibilities: data[0].responsibilities,
            salary_range: data[0].salary_range,
            campaign_id: data[0].campaign_id,
            applicants: data[0].application_count || 0,
            createdAt: data[0].created_at ? new Date(data[0].created_at) : new Date()
          };
          setJob(jobData);
        } else {
          setError('No se encontró la vacante solicitada');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Ha ocurrido un error al cargar los detalles de la vacante');
      } finally {
        setLoading(false);
      }
    };
    
    fetchJob();
  }, [jobId]);

  // Check if storage bucket exists
  useEffect(() => {
    const checkBucket = async () => {
      try {
        setCheckingBucket(true);
        console.log('Verificando acceso al bucket de CVs...');
        
        // First check if bucket exists
        const exists = await checkBucketExists('resumes');
        console.log('Bucket exists check result:', exists);
        
        if (exists) {
          // Verify we have access to it
          const hasAccess = await verifyBucketAccess('resumes');
          console.log('Bucket access check result:', hasAccess);
          
          setStorageBucketExists(hasAccess);
          
          if (hasAccess) {
            toast.success('Sistema de almacenamiento de CVs disponible');
          } else {
            console.error('El bucket existe pero no es accesible');
            toast.warning('El sistema de almacenamiento de CVs tiene acceso limitado');
          }
        } else {
          setStorageBucketExists(false);
          console.info('El bucket de CVs no está disponible o no existe');
        }
      } catch (err) {
        console.error('Error al verificar el bucket:', err);
        setStorageBucketExists(false);
      } finally {
        setCheckingBucket(false);
        setBucketCheckComplete(true);
      }
    };
    
    checkBucket();
  }, []);

  // Resume upload function with improved error handling and validation
  const uploadResume = async (file?: File): Promise<string | null> => {
    if (!file) return null;
    
    try {
      setUploadingResume(true);
      setUploadProgress(10);
      
      // Validate file type
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!validTypes.includes(file.type)) {
        toast.error('Formato de archivo no válido. Por favor sube un PDF, DOC o DOCX.');
        return null;
      }
      
      // Validate file size
      const maxSize = 10 * 1024 * 1024; // 10 MB
      if (file.size > maxSize) {
        toast.error('El archivo es demasiado grande. El tamaño máximo es 10 MB.');
        return null;
      }
      
      // If bucket check was skipped, do a quick check here
      if (!bucketCheckComplete) {
        setUploadProgress(20);
        const bucketExists = await checkBucketExists('resumes');
        const hasAccess = bucketExists ? await verifyBucketAccess('resumes') : false;
        setStorageBucketExists(hasAccess);
      }
      
      setUploadProgress(30);
      
      // If bucket doesn't exist or isn't accessible, try one more time
      if (!storageBucketExists) {
        console.log('El bucket no está disponible, intentando nuevamente verificar su acceso...');
        const hasAccess = await verifyBucketAccess('resumes');
        setStorageBucketExists(hasAccess);
        
        if (!hasAccess) {
          toast.error('El sistema de almacenamiento de CVs no está disponible en este momento.');
          setUploadProgress(0);
          return null;
        }
      }
      
      // Call the uploadFile function from our service
      setUploadProgress(40);
      const resumeUrl = await uploadFile(file, 'resumes');
      
      if (!resumeUrl) {
        throw new Error('Error al subir el archivo');
      }
      
      setUploadProgress(100);
      console.info('CV subido exitosamente:', resumeUrl);
      toast.success('CV subido correctamente');
      return resumeUrl;
    } catch (err: any) {
      console.error('Error al subir CV:', err);
      toast.error(err.message || 'Error al subir el CV');
      return null;
    } finally {
      setUploadingResume(false);
    }
  };

  const onSubmit = async (values: ApplicationFormValues) => {
    if (!job || !jobId) return;
    
    setIsSubmitting(true);
    setSubmitError(null);
    
    try {
      // Handle resume upload if provided
      let resumeUrl = null;
      
      if (resumeFile) {
        try {
          resumeUrl = await uploadResume(resumeFile);
        } catch (uploadErr: any) {
          console.error('Error uploading resume:', uploadErr);
          toast.warning(`No se pudo subir el CV. Tu aplicación será enviada sin CV.`);
        }
      }
      
      console.info('Submitting application with resumeUrl:', resumeUrl);
      
      // Call our edge function to create the application
      const response = await fetch('https://kugocdtesaczbfrwblsi.supabase.co/functions/v1/create-application', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          phone: values.phone,
          phoneCountry: values.phoneCountry,
          jobId: jobId,
          coverLetter: values.coverLetter,
          resumeUrl: resumeUrl
        })
      });
      
      if (!response.ok) {
        const responseData = await response.json();
        console.error('Error response:', responseData);
        throw new Error(responseData.error || 'Error al enviar la aplicación');
      }
      
      const responseData = await response.json();
      console.info('Application submitted successfully:', responseData);
      
      hookToast({
        title: "Aplicación enviada",
        description: "Tu aplicación ha sido enviada correctamente.",
      });
      
      toast.success("Tu aplicación ha sido enviada correctamente");
      
      // Redirect to a thank you page
      navigate('/gracias');
    } catch (err: any) {
      console.error('Error submitting application:', err);
      setSubmitError(err.message || 'Error al enviar la aplicación');
      hookToast({
        variant: "destructive",
        title: "Error",
        description: `Hubo un problema al enviar tu aplicación: ${err.message || 'Error al enviar la aplicación'}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="hrm-container flex justify-center items-center py-20">
        <Loader2 className="h-12 w-12 animate-spin text-hrm-dark-cyan" />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="hrm-container">
        <Card>
          <CardHeader>
            <CardTitle>Vacante no encontrada</CardTitle>
            <CardDescription>{error || 'La vacante que estás buscando no existe.'}</CardDescription>
          </CardHeader>
          <CardFooter>
            <Button onClick={() => navigate('/jobs')}>Ver todas las vacantes</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="hrm-container max-w-2xl mx-auto">
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle className="text-hrm-dark-cyan">Aplicando para: {job?.title}</CardTitle>
          <CardDescription>Departamento: {job?.department}</CardDescription>
        </CardHeader>
        <CardContent>
          {submitError && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {submitError}
              </AlertDescription>
            </Alert>
          )}
          
          {checkingBucket ? (
            <Alert variant="default" className="mb-6 bg-blue-50 border-blue-200">
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              <AlertDescription>
                Verificando sistema de almacenamiento...
              </AlertDescription>
            </Alert>
          ) : (
            <>
              {storageBucketExists ? (
                <Alert variant="default" className="mb-6 bg-green-50 border-green-200">
                  <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                  <AlertDescription>
                    Sistema de almacenamiento de CVs activo
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    El sistema de almacenamiento de CVs no está disponible. Tu aplicación será enviada sin CV.
                  </AlertDescription>
                </Alert>
              )}
            </>
          )}
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre</FormLabel>
                      <FormControl>
                        <Input placeholder="Tu nombre" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Apellido</FormLabel>
                      <FormControl>
                        <Input placeholder="Tu apellido" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" placeholder="tu@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="phoneCountry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>País</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="57">🇨🇴 Colombia (+57)</SelectItem>
                          <SelectItem value="52">🇲🇽 México (+52)</SelectItem>
                          <SelectItem value="34">🇪🇸 España (+34)</SelectItem>
                          <SelectItem value="1">🇺🇸 Estados Unidos (+1)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Teléfono</FormLabel>
                      <FormControl>
                        <Input placeholder="Número de teléfono" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="resume"
                render={({ field: { onChange, value, ...rest } }) => (
                  <FormItem>
                    <FormLabel>CV (PDF, DOC o DOCX)</FormLabel>
                    <FormControl>
                      <div className="flex flex-col gap-2">
                        <Input 
                          type="file" 
                          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              console.info('File selected:', file.name, file.type);
                              onChange(file); // For form validation
                              setResumeFile(file); // Store for later upload
                            }
                          }}
                          disabled={!storageBucketExists || checkingBucket}
                          className={storageBucketExists ? "" : "cursor-not-allowed bg-gray-100"}
                          {...rest}
                        />
                        {!storageBucketExists && !checkingBucket && (
                          <p className="text-sm text-red-500">
                            El sistema de almacenamiento no está disponible en este momento.
                          </p>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {uploadingResume && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground flex items-center">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Subiendo CV: {uploadProgress}%
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}
              
              <FormField
                control={form.control}
                name="coverLetter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carta de presentación (opcional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Cuéntanos por qué te interesa esta posición" 
                        className="min-h-32" 
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Button 
                type="submit" 
                className="w-full bg-hrm-dark-cyan hover:bg-hrm-steel-blue"
                disabled={isSubmitting || uploadingResume}
              >
                {isSubmitting || uploadingResume ? 
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {uploadingResume ? 'Subiendo CV...' : 'Enviando aplicación...'}</> : 
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Enviar aplicación
                  </>
                }
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApplicationForm;
