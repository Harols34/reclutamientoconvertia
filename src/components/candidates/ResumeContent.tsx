
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ResumeContentProps {
  resumeContent: string | null;
  onSaveContent?: (content: string) => Promise<void>;
  isSaving?: boolean;
}

const ResumeContent: React.FC<ResumeContentProps> = ({ 
  resumeContent, 
  onSaveContent,
  isSaving = false 
}) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  if (!resumeContent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contenido del CV</CardTitle>
          <CardDescription>No hay texto extraído del CV disponible</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-4 rounded-md text-center py-8">
            <p className="text-muted-foreground">Abra el CV para extraer el texto</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const handleCopyText = () => {
    navigator.clipboard.writeText(resumeContent);
    setCopied(true);
    
    toast({
      title: "Texto copiado",
      description: "El contenido ha sido copiado al portapapeles"
    });
    
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveContent = async () => {
    if (onSaveContent && resumeContent) {
      try {
        console.log("Guardando contenido del CV, longitud:", resumeContent.length);
        await onSaveContent(resumeContent);
        
        toast({
          title: "Guardado correctamente",
          description: "El contenido del CV ha sido guardado"
        });
      } catch (error) {
        console.error("Error al guardar contenido:", error);
        
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo guardar el contenido del CV"
        });
      }
    }
  };
  
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Contenido del CV</CardTitle>
          <CardDescription>Texto extraído del CV para análisis</CardDescription>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleCopyText}
          title="Copiar texto"
        >
          {copied ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="bg-muted p-4 rounded-md max-h-96 overflow-y-auto">
          {resumeContent.length > 0 ? (
            <pre className="text-sm whitespace-pre-wrap">{resumeContent}</pre>
          ) : (
            <p className="text-muted-foreground text-center py-2">El contenido extraído está vacío</p>
          )}
        </div>
      </CardContent>
      {onSaveContent && (
        <CardFooter>
          <Button 
            variant="outline" 
            onClick={handleSaveContent}
            disabled={isSaving}
            className="w-full flex items-center gap-2"
          >
            {isSaving ? (
              <>Guardando...</>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Guardar contenido extraído
              </>
            )}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default ResumeContent;
