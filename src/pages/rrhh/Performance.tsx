
import React from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Performance() {
  // Mock data
  const myObjectives = [
    {
      id: 1,
      title: "Aumentar ventas en un 15%",
      category: "Ventas",
      progress: 60,
      status: "En progreso",
      dueDate: "2023-12-31",
    },
    {
      id: 2,
      title: "Completar capacitación en nuevas tecnologías",
      category: "Formación",
      progress: 80,
      status: "En progreso",
      dueDate: "2023-06-30",
    },
    {
      id: 3,
      title: "Implementar nuevo sistema de gestión",
      category: "Tecnología",
      progress: 40,
      status: "En progreso",
      dueDate: "2023-09-15",
    },
    {
      id: 4,
      title: "Reducir tiempo de respuesta al cliente",
      category: "Atención al cliente",
      progress: 100,
      status: "Completado",
      dueDate: "2023-04-30",
    },
  ];
  
  const feedbackHistory = [
    {
      id: 1,
      date: "2023-04-15",
      type: "Revisión trimestral",
      rating: 4.5,
      strengths: ["Comunicación", "Trabajo en equipo", "Resolución de problemas"],
      improvements: ["Gestión del tiempo", "Delegación de tareas"],
      comments: "Excelente desempeño este trimestre. Ha superado las expectativas en varios proyectos clave.",
    },
    {
      id: 2,
      date: "2023-01-20",
      type: "Revisión trimestral",
      rating: 4.2,
      strengths: ["Conocimientos técnicos", "Calidad del trabajo"],
      improvements: ["Comunicación con otros equipos", "Documentación"],
      comments: "Buen trabajo. Necesita mejorar la comunicación con otros departamentos.",
    },
    {
      id: 3,
      date: "2022-10-05",
      type: "Revisión trimestral",
      rating: 4.0,
      strengths: ["Puntualidad", "Compromiso"],
      improvements: ["Habilidades de presentación", "Iniciativa"],
      comments: "Desempeño consistente. Recomendaría tomar más iniciativa en proyectos futuros.",
    },
  ];
  
  const upcomingEvaluations = [
    {
      id: 1,
      title: "Revisión trimestral Q2",
      date: "2023-06-15",
      evaluator: "Carlos López",
      status: "Programada",
    },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Desempeño</h1>
        
        <Tabs defaultValue="objectives" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="objectives">Objetivos</TabsTrigger>
            <TabsTrigger value="evaluations">Evaluaciones</TabsTrigger>
          </TabsList>

          {/* Objetivos tab */}
          <TabsContent value="objectives">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Resumen  */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Resumen de objetivos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <div className="text-sm text-gray-500 mb-2">Progreso general</div>
                      <div className="flex items-end mb-2">
                        <span className="text-3xl font-bold text-gray-800 mr-2">70%</span>
                      </div>
                      <Progress value={70} className="h-2 bg-gray-200" />
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium">Estado de objetivos</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-gray-50 p-3 rounded-md text-center">
                          <div className="text-lg font-bold text-green-600">1</div>
                          <div className="text-xs text-gray-500">Completados</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-md text-center">
                          <div className="text-lg font-bold text-amber-600">3</div>
                          <div className="text-xs text-gray-500">En progreso</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-md text-center">
                          <div className="text-lg font-bold text-red-600">0</div>
                          <div className="text-xs text-gray-500">Retrasados</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-md text-center">
                          <div className="text-lg font-bold">4</div>
                          <div className="text-xs text-gray-500">Total</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Lista de objetivos */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Mis objetivos</CardTitle>
                  <CardDescription>
                    Seguimiento de tus objetivos actuales
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-4">
                    {myObjectives.map((objective) => (
                      <li key={objective.id} className="border p-4 rounded-lg hover:shadow-sm transition-shadow">
                        <div className="flex justify-between mb-2">
                          <div>
                            <h4 className="font-medium">{objective.title}</h4>
                            <div className="text-sm text-gray-500 mt-1">
                              Fecha límite: {objective.dueDate}
                            </div>
                          </div>
                          <Badge className={
                            objective.progress === 100
                              ? "bg-green-100 text-green-800"
                              : "bg-amber-100 text-amber-800"
                          }>
                            {objective.status}
                          </Badge>
                        </div>
                        
                        <div className="mt-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progreso</span>
                            <span className="font-medium">{objective.progress}%</span>
                          </div>
                          <Progress 
                            value={objective.progress}
                            className="h-2 bg-gray-200"
                          />
                        </div>
                        
                        <div className="flex justify-between mt-3 text-sm">
                          <Badge variant="outline">{objective.category}</Badge>
                          <button className="text-convertia-600 hover:underline">
                            Ver detalles
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Evaluaciones tab */}
          <TabsContent value="evaluations">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Próximas evaluaciones */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Próximas evaluaciones</CardTitle>
                </CardHeader>
                <CardContent>
                  {upcomingEvaluations.length > 0 ? (
                    <ul className="space-y-4">
                      {upcomingEvaluations.map((evaluation) => (
                        <li key={evaluation.id} className="bg-gray-50 p-4 rounded-lg">
                          <div className="font-medium">{evaluation.title}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {evaluation.date}
                          </div>
                          <div className="text-sm text-gray-600 mt-1">
                            Evaluador: {evaluation.evaluator}
                          </div>
                          <Badge className="mt-2 bg-blue-100 text-blue-800">
                            {evaluation.status}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No tienes evaluaciones programadas
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Historial de feedback */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Historial de evaluaciones</CardTitle>
                  <CardDescription>
                    Feedback recibido en evaluaciones anteriores
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-6">
                    {feedbackHistory.map((feedback) => (
                      <li key={feedback.id} className="border p-4 rounded-lg">
                        <div className="flex justify-between mb-3">
                          <div>
                            <h4 className="font-medium">{feedback.type}</h4>
                            <div className="text-sm text-gray-500">
                              {feedback.date}
                            </div>
                          </div>
                          <div className="flex items-center">
                            <div className="text-amber-500 text-lg font-bold mr-1">
                              {feedback.rating}
                            </div>
                            <div className="text-sm text-gray-500">/5</div>
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <h5 className="text-sm font-medium mb-1">Fortalezas</h5>
                          <div className="flex flex-wrap gap-2">
                            {feedback.strengths.map((strength, index) => (
                              <Badge key={index} variant="outline" className="bg-green-50">
                                {strength}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div className="mb-3">
                          <h5 className="text-sm font-medium mb-1">Áreas de mejora</h5>
                          <div className="flex flex-wrap gap-2">
                            {feedback.improvements.map((improvement, index) => (
                              <Badge key={index} variant="outline" className="bg-amber-50">
                                {improvement}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div>
                          <h5 className="text-sm font-medium mb-1">Comentarios</h5>
                          <p className="text-sm text-gray-600">
                            {feedback.comments}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
