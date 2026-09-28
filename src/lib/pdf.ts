import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PDFReportOptions {
  title: string;
  subtitle?: string;
  filename: string;
  headers: string[];
  rows: (string | number)[][];
  orientation?: 'portrait' | 'landscape';
}

export function generatePDFReport({
  title,
  subtitle = 'District Dantewada, School Education Department, Chhattisgarh',
  filename,
  headers,
  rows,
  orientation = 'landscape'
}: PDFReportOptions) {
  const doc = new jsPDF({
    orientation,
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // Government Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 58, 138); // Dark Navy Blue
  doc.text('DANTEWADA APAAR PENDING SURVEY PORTAL', pageWidth / 2, 35, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(subtitle, pageWidth / 2, 50, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(title, pageWidth / 2, 70, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const now = new Date().toLocaleString('en-IN');
  doc.text(`Generated on: ${now} | Total Records: ${rows.length}`, 40, 85);

  // Table
  autoTable(doc, {
    startY: 95,
    head: [headers],
    body: rows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 64, 175], // Government Blue
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8,
      halign: 'left'
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: 30
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    },
    margin: { top: 95, left: 35, right: 35, bottom: 40 },
    didDrawPage: (data) => {
      // Footer page numbering
      const str = `Page ${data.pageNumber}`;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(str, pageWidth - 60, doc.internal.pageSize.getHeight() - 20);
      doc.text('Confidential - District Administration Dantewada', 40, doc.internal.pageSize.getHeight() - 20);
    }
  });

  doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
}
