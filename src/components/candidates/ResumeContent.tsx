
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Copy, CheckCircle2 } from 'lucide-react';

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

  if (!resumeContent) return null;
  
  const handleCopyText = () => {
    navigator.clipboard.writeText(resumeContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveContent = async () => {
    if (onSaveContent && resumeContent) {
      await onSaveContent(resumeContent);
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
          <pre className="text-sm whitespace-pre-wrap">{resumeContent}</pre>
        </div>
      </CardContent>
      {onSaveContent && (
        <CardFooter>
          <Button 
            variant="outline" 
            onClick={handleSaveContent}
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? 'Guardando...' : 'Guardar contenido extraído'}
          </Button>
        </CardFooter>
      )}
    </Card>
  );
};

export default ResumeContent;
