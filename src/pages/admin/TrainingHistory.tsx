
import React from 'react';
import { Card } from '@/components/ui/card';
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
