
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import TrainingCodeManager from '@/components/chatbot/TrainingCodeManager';

const ChatbotManager = () => {
  const [activeTab, setActiveTab] = useState('configuration');

  return (
    <div>
      <h1 className="page-title">Gestión del Asistente Virtual</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="configuration">Configuración</TabsTrigger>
          <TabsTrigger value="knowledge">Base de Conocimiento</TabsTrigger>
          <TabsTrigger value="training">Códigos de Entrenamiento</TabsTrigger>
        </TabsList>
        
        <TabsContent value="configuration" className="mt-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Configuración del Chatbot</h2>
            <p className="text-gray-500">Configure las respuestas y comportamientos del asistente virtual.</p>
          </Card>
        </TabsContent>
        
        <TabsContent value="knowledge" className="mt-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Base de Conocimiento</h2>
            <p className="text-gray-500">Gestione las preguntas y respuestas frecuentes que conoce el asistente virtual.</p>
          </Card>
        </TabsContent>
        
        <TabsContent value="training" className="mt-6">
          <TrainingCodeManager />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChatbotManager;
