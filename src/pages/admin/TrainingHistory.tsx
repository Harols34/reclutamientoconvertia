
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Eye, RefreshCcw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { TrainingHistoryList } from '@/components/training/TrainingHistoryList';

const TrainingHistory = () => {
  return (
    <div>
      <h1 className="page-title">Historial de Sesiones de Entrenamiento</h1>
      <TrainingHistoryList />
    </div>
  );
};

export default TrainingHistory;
