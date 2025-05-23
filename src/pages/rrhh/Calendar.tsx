
import React, { useState } from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Plus, Clock, CheckCircle, Calendar as CalendarIcon, User, Users } from "lucide-react";

export default function Calendar() {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  const events = [
    {
      id: 1,
      title: "Reunión de equipo",
      date: new Date(2025, 4, 12, 10, 0),
      endDate: new Date(2025, 4, 12, 11, 0),
      type: "meeting",
      attendees: 5,
    },
    {
      id: 2,
      title: "Revisión de proyecto",
      date: new Date(2025, 4, 12, 14, 0),
      endDate: new Date(2025, 4, 12, 15, 30),
      type: "review",
      attendees: 3,
    },
    {
      id: 3,
      title: "Entrega de documentación",
      date: new Date(2025, 4, 15, 9, 0),
      endDate: new Date(2025, 4, 15, 9, 30),
      type: "task",
      completed: false,
    },
    {
      id: 4,
      title: "Entrevista candidato",
      date: new Date(2025, 4, 16, 11, 0),
      endDate: new Date(2025, 4, 16, 12, 0),
      type: "interview",
      attendees: 2,
    }
  ];

  // Filter events for the selected date
  const selectedDateStr = date ? date.toDateString() : "";
  const todaysEvents = events.filter(event => event.date.toDateString() === selectedDateStr);
  
  // Get event type badge color
  const getEventBadgeColor = (type: string) => {
    switch(type) {
      case "meeting": return "bg-blue-100 text-blue-800";
      case "review": return "bg-purple-100 text-purple-800";
      case "task": return "bg-green-100 text-green-800";
      case "interview": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  // Format time from date object
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Calendario</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-medium">Calendario</CardTitle>
                <CardDescription>Mayo 2025</CardDescription>
              </CardHeader>
              <CardContent>
                <CalendarComponent
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="border rounded-md p-2"
                />
                
                <div className="mt-6 space-y-3">
                  <Button className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Nuevo evento
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-medium">
                    {date ? date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : ""}
                  </CardTitle>
                  <CardDescription>
                    {todaysEvents.length} eventos programados
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button variant="outline" size="icon">
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="icon">
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                <Tabs defaultValue="day">
                  <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="day">Día</TabsTrigger>
                    <TabsTrigger value="week">Semana</TabsTrigger>
                    <TabsTrigger value="month">Mes</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="day" className="mt-4">
                    {todaysEvents.length > 0 ? (
                      <div className="space-y-4">
                        {todaysEvents.map((event) => (
                          <div key={event.id} className="flex border rounded-md p-4 hover:shadow-sm transition-all">
                            <div className="mr-4 flex flex-col items-center">
                              <div className="text-lg font-bold">
                                {formatTime(event.date)}
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatTime(event.endDate)}
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h3 className="font-medium">{event.title}</h3>
                                <Badge className={getEventBadgeColor(event.type)}>
                                  {event.type.charAt(0).toUpperCase() + event.type.slice(1)}
                                </Badge>
                              </div>
                              <div className="flex items-center mt-2 text-sm text-gray-600">
                                {event.attendees ? (
                                  <div className="flex items-center mr-4">
                                    <Users className="h-4 w-4 mr-1" />
                                    {event.attendees} asistentes
                                  </div>
                                ) : (
                                  <div className="flex items-center mr-4">
                                    <User className="h-4 w-4 mr-1" />
                                    Individual
                                  </div>
                                )}
                                <div className="flex items-center">
                                  <Clock className="h-4 w-4 mr-1" />
                                  {Math.round((event.endDate.getTime() - event.date.getTime()) / (1000 * 60))} min
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                        <CalendarIcon className="h-12 w-12 mb-3 opacity-30" />
                        <p>No hay eventos programados para este día</p>
                        <Button variant="link" className="mt-2">
                          <Plus className="h-4 w-4 mr-1" />
                          Agregar evento
                        </Button>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="week" className="mt-4">
                    <div className="text-center text-gray-500 py-8">
                      Vista semanal en desarrollo
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="month" className="mt-4">
                    <div className="text-center text-gray-500 py-8">
                      Vista mensual en desarrollo
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
