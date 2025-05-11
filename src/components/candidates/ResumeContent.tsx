
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

interface ResumeContentProps {
  resumeContent: string | null;
}

const ResumeContent: React.FC<ResumeContentProps> = ({ resumeContent }) => {
  if (!resumeContent) return null;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Contenido del CV</CardTitle>
        <CardDescription>Texto extraído del CV para análisis</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="bg-muted p-4 rounded-md max-h-96 overflow-y-auto">
          <pre className="text-sm whitespace-pre-wrap">{resumeContent}</pre>
        </div>
      </CardContent>
    </Card>
  );
};

export default ResumeContent;
