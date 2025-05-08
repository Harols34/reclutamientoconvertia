
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PDFViewerProps {
  url: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  onAnalyze?: () => void;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ 
  url, 
  isOpen, 
  onOpenChange,
  title = "Ver documento",
  onAnalyze
}) => {
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);
  const [error, setError] = useState<string | null>(null);

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
                onClick={() => {
                  onOpenChange(false);
                  onAnalyze();
                }}
              >
                Analizar con IA
              </Button>
            )}
          </div>
        </DialogHeader>
        <div className="relative flex-1 min-h-0 w-full overflow-auto">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-hrm-dark-cyan" />
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
