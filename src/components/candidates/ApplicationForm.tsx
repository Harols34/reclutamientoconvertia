
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
import { JobType } from '../jobs/JobCard';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

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
        // Using the job_applications_view to fetch job details
        const { data, error } = await supabase
          .from('jobs')
          .select('*, applications(id)')
          .eq('id', jobId)
          .single();

        if (error) {
          console.error('Error fetching job:', error);
          return;
        }

        if (data) {
          const jobData: JobType = {
            id: data.id,
            title: data.title,
            department: data.department,
            location: data.location,
            status: data.status,
            type: data.type,
            created_at: data.created_at,
            updated_at: data.updated_at,
            description: data.description,
            requirements: data.requirements,
            responsibilities: data.responsibilities,
            salary_range: data.salary_range,
            campaign_id: data.campaign_id,
            applicants: data.applications?.length || 0,
            createdAt: data.created_at ? new Date(data.created_at) : new Date()
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
    if (!job) return;
    
    setIsSubmitting(true);
    
    try {
      // First, create a candidate
      const { data: candidateData, error: candidateError } = await supabase
        .from('candidates')
        .insert([
          {
            first_name: values.firstName,
            last_name: values.lastName,
            email: values.email,
            phone: values.phone,
            phone_country: values.phoneCountry,
          }
        ])
        .select();

      if (candidateError) throw candidateError;
      const candidateId = candidateData[0].id;
      
      // Now create the application
      const { error: applicationError } = await supabase
        .from('applications')
        .insert([
          {
            job_id: jobId,
            candidate_id: candidateId,
            cover_letter: values.coverLetter || null,
            status: 'applied',
            job_type: job.type,
          }
        ]);

      if (applicationError) throw applicationError;

      // Now analyze the CV with OpenAI if resume is provided
      if (values.resume) {
        // TODO: In a real app, you would upload the file and then analyze it
        // For now, we'll just simulate the analysis
        const reader = new FileReader();
        reader.onload = async (e) => {
          const text = e.target?.result;
          if (typeof text === 'string') {
            const resumeText = text.substring(0, 5000); // Limit text length
            
            // Call the OpenAI function to analyze the CV
            try {
              const { data: analysisData, error: analysisError } = await supabase.functions
                .invoke('openai-assistant', {
                  body: {
                    prompt: resumeText,
                    type: 'cv-analysis',
                    context: job.requirements
                  }
                });
                
              if (analysisError) console.error('CV analysis error:', analysisError);
              if (analysisData) {
                // Update candidate with analysis
                await supabase
                  .from('candidates')
                  .update({ analysis_summary: analysisData.response })
                  .eq('id', candidateId);
              }
            } catch (err) {
              console.error('Error analyzing CV:', err);
            }
          }
        };
        reader.readAsText(values.resume);
      }
      
      toast({
        title: "Aplicación enviada",
        description: "Tu aplicación ha sido enviada correctamente.",
      });
      
      // Redirect to a thank you page
      navigate('/gracias');
    } catch (err) {
      console.error('Error submitting application:', err);
      toast({
        title: "Error",
        description: "Hubo un problema al enviar tu aplicación. Por favor, inténtalo de nuevo.",
        variant: "destructive",
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
