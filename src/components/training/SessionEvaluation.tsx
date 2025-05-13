
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface SessionEvaluationProps {
  sessionId: string;
  initialData?: {
    strengths?: string;
    areas_to_improve?: string;
    recommendations?: string;
  };
  onSaved?: () => void;
}

export const SessionEvaluation: React.FC<SessionEvaluationProps> = ({ 
  sessionId, 
  initialData,
  onSaved
}) => {
  const [strengths, setStrengths] = useState(initialData?.strengths || '');
  const [areasToImprove, setAreasToImprove] = useState(initialData?.areas_to_improve || '');
  const [recommendations, setRecommendations] = useState(initialData?.recommendations || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!sessionId) return;
    
    setIsSaving(true);
    try {
      // Check if evaluation already exists
      const { data: existingData, error: queryError } = await supabase
        .from('training_evaluations')
        .select('id')
        .eq('session_id', sessionId)
        .maybeSingle();
      
      if (queryError) throw queryError;
      
      let result;
      
      if (existingData) {
        // Update existing evaluation
        result = await supabase
          .from('training_evaluations')
          .update({
            strengths,
            areas_to_improve: areasToImprove,
            recommendations,
            updated_at: new Date().toISOString()
          })
          .eq('session_id', sessionId);
      } else {
        // Create new evaluation
        result = await supabase
          .from('training_evaluations')
          .insert({
            session_id: sessionId,
            strengths,
            areas_to_improve: areasToImprove,
            recommendations
          });
      }
      
      if (result.error) {
        throw result.error;
      }
      
      toast({
        title: "Éxito",
        description: "Evaluación guardada correctamente",
      });
      
      if (onSaved) onSaved();
    } catch (error) {
      console.error('Error al guardar evaluación:', error);
      toast({
        title: "Error",
        description: "Error al guardar la evaluación",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Evaluación de la Sesión</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="strengths">Fortalezas</Label>
          <Textarea
            id="strengths"
            placeholder="Aspectos positivos observados durante la sesión"
            value={strengths}
            onChange={(e) => setStrengths(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
        
        <div>
          <Label htmlFor="areas-to-improve">Áreas de Mejora</Label>
          <Textarea
            id="areas-to-improve"
            placeholder="Aspectos que podrían mejorarse"
            value={areasToImprove}
            onChange={(e) => setAreasToImprove(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
        
        <div>
          <Label htmlFor="recommendations">Recomendaciones</Label>
          <Textarea
            id="recommendations"
            placeholder="Recomendaciones específicas para mejorar"
            value={recommendations}
            onChange={(e) => setRecommendations(e.target.value)}
            className="min-h-[100px]"
          />
        </div>
        
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="w-full"
        >
          {isSaving ? 'Guardando...' : 'Guardar Evaluación'}
        </Button>
      </CardContent>
    </Card>
  );
};
