
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export interface ExportOptions {
  filename: string;
  format: 'csv' | 'xlsx' | 'txt' | 'pdf';
}

export const exportData = (data: any[], options: ExportOptions) => {
  switch (options.format) {
    case 'csv':
      exportCSV(data, options.filename);
      break;
    case 'xlsx':
      exportXLSX(data, options.filename);
      break;
    case 'txt':
      exportTXT(data, options.filename);
      break;
    case 'pdf':
      exportPDF(data, options.filename);
      break;
    default:
      console.error('Format not supported');
  }
};

const exportCSV = (data: any[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csvOutput], { type: 'text/csv;charset=utf-8' });
  saveAs(blob, `${filename}.csv`);
};

const exportXLSX = (data: any[], filename: string) => {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

const exportTXT = (data: any[], filename: string) => {
  let txtContent = '';
  
  // Create headers
  if (data.length > 0) {
    txtContent += Object.keys(data[0]).join('\t') + '\n';
  }
  
  // Add data rows
  data.forEach(item => {
    txtContent += Object.values(item).join('\t') + '\n';
  });
  
  const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8' });
  saveAs(blob, `${filename}.txt`);
};

const exportPDF = (data: any[], filename: string) => {
  const doc = new jsPDF();
  
  if (data.length > 0) {
    // Define columns and rows for the table
    const columns = Object.keys(data[0]).map(key => ({ header: key, dataKey: key }));
    const rows = data.map(item => Object.values(item));
    
    // @ts-ignore - jspdf-autotable augments jsPDF prototype
    doc.autoTable({
      head: [Object.keys(data[0])],
      body: rows,
      startY: 20,
      margin: { top: 20 },
      styles: { overflow: 'linebreak' },
      headStyles: { fillColor: [41, 128, 185] },
    });

    // Add title
    doc.text(filename, 14, 15);
  } else {
    doc.text('No data available', 14, 20);
  }
  
  doc.save(`${filename}.pdf`);
};
