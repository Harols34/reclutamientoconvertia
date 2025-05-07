
import React, { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface JobDeleteButtonProps {
  jobId: string;
  jobTitle: string;
  onDeleted: () => void;
}

const JobDeleteButton: React.FC<JobDeleteButtonProps> = ({ jobId, jobTitle, onDeleted }) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      
      // Check if there are applications for this job
      const { data: applications, error: appError } = await supabase
        .from('applications')
        .select('id')
        .eq('job_id', jobId);
      
      if (appError) throw appError;
      
      // If there are applications, delete them first
      if (applications && applications.length > 0) {
        const { error: deleteAppError } = await supabase
          .from('applications')
          .delete()
          .eq('job_id', jobId);
          
        if (deleteAppError) throw deleteAppError;
      }
      
      // Now delete the job
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);
        
      if (error) throw error;
      
      toast({
        title: "Vacante eliminada",
        description: `La vacante "${jobTitle}" ha sido eliminada correctamente.`,
      });
      
      onDeleted();
    } catch (error) {
      console.error('Error al eliminar la vacante:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la vacante. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setIsDialogOpen(false);
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="icon" 
        className="absolute top-2 right-2 bg-white/80 hover:bg-red-50 text-red-600 hover:text-red-700 border-none"
        onClick={() => setIsDialogOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará permanentemente la vacante "<strong>{jobTitle}</strong>" y no se puede deshacer.
              {' '}También se eliminarán todas las aplicaciones asociadas a esta vacante.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default JobDeleteButton;
