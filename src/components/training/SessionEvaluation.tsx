
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Slider } from '@/components/ui/slider';

interface SessionEvaluationProps {
  sessionId: string;
  initialData?: {
    strengths?: string;
    areas_to_improve?: string;
    recommendations?: string;
    score?: number;
  };
  onSaved?: () => void;
  readOnly?: boolean;
}

export const SessionEvaluation: React.FC<SessionEvaluationProps> = ({ 
  sessionId, 
  initialData,
  onSaved,
  readOnly = false
}) => {
  const [strengths, setStrengths] = useState(initialData?.strengths || '');
  const [areasToImprove, setAreasToImprove] = useState(initialData?.areas_to_improve || '');
  const [recommendations, setRecommendations] = useState(initialData?.recommendations || '');
  const [score, setScore] = useState<number>(initialData?.score || 50);
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
      
      // Now let's update the score in the training_sessions table
      const scoreResult = await supabase
        .from('training_sessions')
        .update({
          score
        })
        .eq('id', sessionId);
        
      if (scoreResult.error) {
        throw scoreResult.error;
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
        <div className="space-y-2">
          <Label htmlFor="score">Puntuación {score}/100</Label>
          <Slider
            id="score"
            defaultValue={[score]}
            max={100}
            step={1}
            className="py-4"
            disabled={readOnly}
            onValueChange={(value) => setScore(value[0])}
          />
        </div>
        
        <div>
          <Label htmlFor="strengths">Fortalezas</Label>
          <Textarea
            id="strengths"
            placeholder="Aspectos positivos observados durante la sesión"
            value={strengths}
            onChange={(e) => setStrengths(e.target.value)}
            className="min-h-[100px]"
            disabled={readOnly}
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
            disabled={readOnly}
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
            disabled={readOnly}
          />
        </div>
        
        {!readOnly && (
          <Button 
            onClick={handleSave} 
            disabled={isSaving}
            className="w-full"
          >
            {isSaving ? 'Guardando...' : 'Guardar Evaluación'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
