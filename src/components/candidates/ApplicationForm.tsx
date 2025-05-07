
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
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/utils/supabase-helpers';

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
  resume: z.instanceof(File).refine((file) => {
    if (!file) return false;
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    return validTypes.includes(file.type);
  }, 'Formato de archivo inválido. Por favor sube un PDF, DOC o DOCX.'),
  coverLetter: z.string().optional(),
});

type ApplicationFormValues = z.infer<typeof applicationSchema>;

const ApplicationForm = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [job, setJob] = useState<JobType | null>(null);
  const [loading, setLoading] = useState(true);
  
  const form = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      phoneCountry: '',
      coverLetter: '',
    },
  });

  useEffect(() => {
    const fetchJob = async () => {
      if (!jobId) return;
      
      try {
        setLoading(true);
        // Use the updated RPC function to get job details
        const { data, error } = await supabase.rpc('get_job_by_id', {
          p_job_id: jobId
        });

        if (error) {
          console.error('Error fetching job:', error);
          return;
        }

        if (data && data.length > 0) {
          // Fix TypeScript issues here - properly cast or handle the enums
          const jobData: JobType = {
            id: data[0].id,
            title: data[0].title,
            department: data[0].department,
            location: data[0].location,
            // Use proper typing for status and type fields
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
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchJob();
  }, [jobId]);

  const onSubmit = async (values: ApplicationFormValues) => {
    if (!job || !jobId) return;
    
    setIsSubmitting(true);
    
    try {
      // Upload resume file to Supabase Storage
      let resumeUrl = null;
      
      if (values.resume) {
        const fileExt = values.resume.name.split('.').pop();
        const fileName = `${Date.now()}_${values.firstName.toLowerCase()}_${values.lastName.toLowerCase()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(fileName, values.resume);
        
        if (uploadError) {
          console.error('Resume upload error:', uploadError);
          throw new Error('Error al subir el currículum, por favor intenta de nuevo.');
        }
        
        if (uploadData) {
          resumeUrl = `${fileName}`;
          console.log('Resume uploaded successfully:', resumeUrl);
        }
      }
      
      // Create candidate and application
      const { data: candidateData, error: candidateError } = await supabase
        .from('candidates')
        .insert({
          first_name: values.firstName,
          last_name: values.lastName,
          email: values.email,
          phone: `${values.phoneCountry}${values.phone}`,
          location: null,
          resume_url: resumeUrl
        })
        .select()
        .single();
      
      if (candidateError) {
        console.error('Candidate creation error:', candidateError);
        throw candidateError;
      }
      
      const { error: applicationError } = await supabase
        .from('applications')
        .insert({
          candidate_id: candidateData.id,
          job_id: jobId,
          status: 'new'
        });
      
      if (applicationError) {
        console.error('Application creation error:', applicationError);
        throw applicationError;
      }
      
      console.log('Application submitted successfully');
      
      toast({
        title: "Aplicación enviada",
        description: "Tu aplicación ha sido enviada correctamente.",
      });
      
      // Redirect to a thank you page
      navigate('/gracias');
    } catch (err) {
      console.error('Error submitting application:', err);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Hubo un problema al enviar tu aplicación. Por favor, inténtalo de nuevo.",
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

  if (!job) {
    return (
      <div className="hrm-container">
        <Card>
          <CardHeader>
            <CardTitle>Vacante no encontrada</CardTitle>
            <CardDescription>La vacante que estás buscando no existe.</CardDescription>
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
          <CardTitle className="text-hrm-dark-cyan">Aplicando para: {job.title}</CardTitle>
          <CardDescription>Departamento: {job.department}</CardDescription>
        </CardHeader>
        <CardContent>
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
                      <Input 
                        type="file" 
                        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" 
                        onChange={(e) => onChange(e.target.files?.[0])}
                        {...rest}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Enviando...' : 'Enviar aplicación'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ApplicationForm;
