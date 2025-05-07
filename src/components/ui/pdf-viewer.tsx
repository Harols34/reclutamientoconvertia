
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2 } from 'lucide-react';

interface PDFViewerProps {
  url: string | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ 
  url, 
  isOpen, 
  onOpenChange,
  title = "Ver documento"
}) => {
  const [loading, setLoading] = useState(true);

  if (!url) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[90vw] h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="relative flex-1 min-h-0 w-full">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <Loader2 className="h-8 w-8 animate-spin text-hrm-dark-cyan" />
            </div>
          )}
          <iframe 
            src={`${url}#view=FitH`}
            className="w-full h-full border-0"
            onLoad={() => setLoading(false)}
            title="PDF Viewer"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PDFViewer;
