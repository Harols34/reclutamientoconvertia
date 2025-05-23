
import React from "react";
import Layout from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, FileText, FilePlus, FolderPlus, Calendar, Clock, Settings } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function Documents() {
  // Mock data for documents
  const recentDocs = [
    {
      id: 1,
      name: "Manual de procedimientos.pdf",
      type: "PDF",
      size: "2.4 MB",
      modified: "Hoy, 14:30",
      shared: true,
    },
    {
      id: 2,
      name: "Planificación Q3.xlsx",
      type: "XLSX",
      size: "1.7 MB",
      modified: "Ayer, 09:45",
      shared: true,
    },
    {
      id: 3,
      name: "Acta reunión Marzo.docx",
      type: "DOCX",
      size: "845 KB",
      modified: "Mar 18, 2025",
      shared: false,
    },
    {
      id: 4,
      name: "Presupuesto 2025.xlsx",
      type: "XLSX",
      size: "1.2 MB",
      modified: "Mar 15, 2025",
      shared: true,
    }
  ];

  const folders = [
    { id: 1, name: "Documentos RH", count: 24 },
    { id: 2, name: "Procesos internos", count: 18 },
    { id: 3, name: "Materiales de formación", count: 12 },
    { id: 4, name: "Presentaciones", count: 8 },
  ];

  // Function to get the icon based on document type
  const getDocIcon = (type: string) => {
    const iconClass = "h-8 w-8 mr-3 p-1";
    
    switch(type) {
      case "PDF":
        return <FileText className={`${iconClass} text-red-500`} />;
      case "XLSX":
        return <FileText className={`${iconClass} text-green-500`} />;
      case "DOCX":
        return <FileText className={`${iconClass} text-blue-500`} />;
      default:
        return <FileText className={`${iconClass} text-gray-500`} />;
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Documentación</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-lg font-medium">Mis documentos</CardTitle>
                    <CardDescription>Acceso a todos tus archivos</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <FilePlus className="h-4 w-4 mr-2" />
                      Subir
                    </Button>
                    <Button variant="outline" size="sm">
                      <FolderPlus className="h-4 w-4 mr-2" />
                      Nueva carpeta
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <Tabs defaultValue="recent">
                  <TabsList className="grid w-full max-w-md grid-cols-3">
                    <TabsTrigger value="recent">Recientes</TabsTrigger>
                    <TabsTrigger value="mine">Mis archivos</TabsTrigger>
                    <TabsTrigger value="shared">Compartidos</TabsTrigger>
                  </TabsList>
                  
                  <div className="relative mt-4 mb-6">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input 
                      placeholder="Buscar documentos..." 
                      className="pl-10"
                    />
                  </div>
                  
                  <TabsContent value="recent">
                    <div className="space-y-1">
                      {recentDocs.map((doc) => (
                        <div key={doc.id} className="flex items-center p-3 rounded-md hover:bg-gray-50 cursor-pointer">
                          {getDocIcon(doc.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between">
                              <h3 className="text-sm font-medium truncate">{doc.name}</h3>
                              <div className="flex items-center">
                                {doc.shared && (
                                  <Badge variant="outline" className="mr-2">Compartido</Badge>
                                )}
                                <span className="text-xs text-gray-500">{doc.modified}</span>
                              </div>
                            </div>
                            <div className="flex justify-between">
                              <p className="text-xs text-gray-500">{doc.type} • {doc.size}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="mine" className="space-y-2">
                    <p className="text-sm text-gray-500 mb-4">Tus carpetas</p>
                    {folders.map((folder) => (
                      <div key={folder.id} className="flex items-center p-3 rounded-md hover:bg-gray-50 cursor-pointer">
                        <div className="h-10 w-10 rounded-md bg-gray-100 flex items-center justify-center mr-3">
                          <span className="text-sm font-medium">{folder.count}</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-sm font-medium">{folder.name}</h3>
                        </div>
                      </div>
                    ))}
                  </TabsContent>
                  
                  <TabsContent value="shared">
                    <div className="space-y-1">
                      {recentDocs.filter(doc => doc.shared).map((doc) => (
                        <div key={doc.id} className="flex items-center p-3 rounded-md hover:bg-gray-50 cursor-pointer">
                          {getDocIcon(doc.type)}
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between">
                              <h3 className="text-sm font-medium truncate">{doc.name}</h3>
                              <span className="text-xs text-gray-500">{doc.modified}</span>
                            </div>
                            <div className="flex justify-between">
                              <p className="text-xs text-gray-500">{doc.type} • {doc.size}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-md font-medium">Acceso rápido</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="h-4 w-4 mr-2" />
                  Documentos recientes
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Clock className="h-4 w-4 mr-2" />
                  Modificados recientemente
                </Button>
                <Separator />
                <h3 className="text-sm font-medium pt-2">Configuración</h3>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  Permisos y compartir
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
}
