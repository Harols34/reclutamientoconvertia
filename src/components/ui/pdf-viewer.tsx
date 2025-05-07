
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface PDFViewerProps {
  url: string;
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ url, isOpen, onClose, title = "Documento" }) => {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 min-h-[70vh] mt-4">
          <iframe 
            src={`${url}#toolbar=1&navpanes=1&scrollbar=1`}
            className="w-full h-full min-h-[70vh] border rounded"
            title="PDF Viewer"
          ></iframe>
        </div>
      </DialogContent>
    </Dialog>
  );
};
