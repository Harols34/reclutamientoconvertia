
import React, { useState } from 'react';
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

// Sample data - In production, this would come from your API
const mockJobs: JobType[] = [
  {
    id: 'd0b13a73-3833-4b50-8e27-54e5f21c6df2',
    title: 'Asesor',
    department: 'Operaciones',
    location: 'Remoto',
    type: 'full-time',
    status: 'open',
    createdAt: new Date(),
    applicants: 5,
    description: 'Asesor para el departamento de operaciones',
  },
];

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
  
  // Find the job by ID from our mock data
  const job = mockJobs.find(j => j.id === jobId);

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

  const onSubmit = (values: ApplicationFormValues) => {
    setIsSubmitting(true);
    
    // In a real app, you would send this data to your API
    console.log('Form values:', values);
    
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Aplicación enviada",
        description: "Tu aplicación ha sido enviada correctamente.",
      });
      
      // Redirect to a thank you page
      navigate('/gracias');
    }, 1500);
  };

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
