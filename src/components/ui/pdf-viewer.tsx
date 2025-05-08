
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Import pdfjs directly
import * as pdfjsLib from 'pdfjs-dist';

interface PDFViewerProps {
  url: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  onAnalyze?: () => void;
  onTextExtracted?: (text: string) => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ 
  url, 
  isOpen, 
  onOpenChange,
  title = "Ver documento",
  onAnalyze,
  onTextExtracted
}) => {
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [extractingText, setExtractingText] = useState(false);

  // Initialize PDF.js worker when component mounts
  useEffect(() => {
    // Use a local worker bundle instead of CDN
    if (typeof window !== 'undefined') {
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString();
    }
  }, []);

  if (!url) return null;

  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.25, 2.5));
  };

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleDownload = () => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  const handleLoad = () => {
    setLoading(false);
    setError(null);
  };

  const handleError = () => {
    setLoading(false);
    setError("No se pudo cargar el documento PDF. Intente descargar el archivo.");
  };

  const extractText = async () => {
    if (!url || !onTextExtracted) return;
    
    try {
      setExtractingText(true);
      console.log('Extrayendo texto del PDF en el visor...');
      
      // Cargar el documento PDF
      const loadingTask = pdfjsLib.getDocument(url);
      const pdf = await loadingTask.promise;
      console.log(`PDF cargado con ${pdf.numPages} páginas`);
      
      let extractedText = '';
      
      // Extraer texto de todas las páginas
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        const pageText = content.items
          .map((item: any) => item.str)
          .join(' ');
        
        extractedText += pageText + '\n\n';
        console.log(`Texto extraído de la página ${i}`);
      }
      
      console.log(`Texto extraído completo, longitud: ${extractedText.length} caracteres`);
      if (onTextExtracted) {
        onTextExtracted(extractedText);
      }
      return extractedText;
    } catch (error) {
      console.error('Error al extraer texto del PDF:', error);
      setError("Error al extraer texto del PDF. Intente descargar el archivo.");
      throw new Error(`Error al extraer texto: ${error}`);
    } finally {
      setExtractingText(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[90vw] h-[85vh] flex flex-col">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle>{title}</DialogTitle>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="icon" onClick={handleZoomOut} title="Reducir">
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleZoomIn} title="Ampliar">
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={handleDownload} title="Descargar">
              <Download className="h-4 w-4" />
            </Button>
            {onAnalyze && (
              <Button 
                variant="default" 
                className="bg-hrm-dark-cyan hover:bg-hrm-steel-blue"
                onClick={async () => {
                  if (onTextExtracted) {
                    try {
                      await extractText();
                    } catch (error) {
                      console.error('Error during text extraction:', error);
                    }
                  }
                  onOpenChange(false);
                  onAnalyze();
                }}
                disabled={extractingText}
              >
                {extractingText ? 'Extrayendo texto...' : 'Analizar con IA'}
              </Button>
            )}
          </div>
        </DialogHeader>
        <div className="relative flex-1 min-h-0 w-full overflow-auto">
          {(loading || extractingText) && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-hrm-dark-cyan" />
              {extractingText && <p className="ml-2">Extrayendo texto del documento...</p>}
            </div>
          )}
          {error ? (
            <div className="flex flex-col items-center justify-center h-full">
              <p className="text-destructive mb-4">{error}</p>
              <Button onClick={handleDownload} className="bg-hrm-dark-cyan hover:bg-hrm-steel-blue">
                <Download className="mr-2 h-4 w-4" />
                Descargar PDF
              </Button>
            </div>
          ) : (
            <iframe 
              src={`${url}#view=FitH&zoom=${scale * 100}`}
              className="w-full h-full border-0"
              onLoad={handleLoad}
              onError={handleError}
              title="Visor de PDF"
              style={{ transform: `scale(${scale})`, transformOrigin: 'top center' }}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFViewer;
