import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface PDFReportOptions {
  title: string;
  subtitle?: string;
  filename: string;
  headers: string[];
  rows: (string | number)[][];
  orientation?: 'portrait' | 'landscape';
}

function getColumnAlignment(header: string, sampleCell?: any): 'left' | 'center' | 'right' {
  const h = (header || '').toLowerCase().trim();
  if (
    h.includes('क्र.') ||
    h.includes('s.no') ||
    h.includes('sno') ||
    h.includes('sr') ||
    h.includes('कक्षा') ||
    h.includes('class') ||
    h.includes('udise')
  ) {
    return 'center';
  }
  if (
    h.includes('total') ||
    h.includes('count') ||
    h.includes('कुल') ||
    h.includes('छात्र') ||
    h.includes('%') ||
    h.includes('प्रतिशत') ||
    h.includes('rate') ||
    h.includes('completed') ||
    h.includes('pending') ||
    h.includes('resolved') ||
    h.includes('follow') ||
    h.includes('dantewada') ||
    h.includes('geedam') ||
    h.includes('kuakonda') ||
    h.includes('katekalyan')
  ) {
    return 'right';
  }
  if (typeof sampleCell === 'number') {
    return 'right';
  }
  return 'left';
}

/**
 * Generate a complete, beautifully styled multi-page PDF that looks exactly like Excel
 * with crisp fonts, official government header, and proper Hindi (Devanagari) rendering.
 */
export async function generatePDFReport({
  title,
  subtitle = 'कार्यालय कलेक्टर एवं जिला मिशन संचालक, समग्र शिक्षा, जिला-दंतेवाड़ा (छ.ग.)',
  filename,
  headers,
  rows,
  orientation = 'landscape'
}: PDFReportOptions): Promise<void> {
  // Graceful fallback for test or headless environments
  if (typeof window === 'undefined' || typeof document === 'undefined' || !document.body) {
    const doc = new jsPDF({ orientation, unit: 'pt', format: 'a4' });
    doc.text(title, 40, 40);
    doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
    return;
  }

  const isLandscape = orientation === 'landscape';
  const pageWidthPx = isLandscape ? 1120 : 790;
  const pageHeightPx = isLandscape ? 790 : 1120;
  const rowsPerPage = isLandscape ? 22 : 30;

  // Split rows into pages
  const totalRows = rows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / rowsPerPage));
  const pageChunks: (string | number)[][][] = [];

  if (totalRows === 0) {
    pageChunks.push([]);
  } else {
    for (let i = 0; i < totalRows; i += rowsPerPage) {
      pageChunks.push(rows.slice(i, i + rowsPerPage));
    }
  }

  // Create off-screen container for rendering
  const renderContainer = document.createElement('div');
  renderContainer.style.position = 'fixed';
  renderContainer.style.left = '0';
  renderContainer.style.top = '0';
  renderContainer.style.width = `${pageWidthPx}px`;
  renderContainer.style.zIndex = '-99999';
  renderContainer.style.pointerEvents = 'none';
  renderContainer.style.background = '#ffffff';
  document.body.appendChild(renderContainer);

  const doc = new jsPDF({
    orientation,
    unit: 'pt',
    format: 'a4'
  });
  const pdfWidth = doc.internal.pageSize.getWidth();
  const pdfHeight = doc.internal.pageSize.getHeight();

  try {
    const currentDate = new Date().toLocaleDateString('hi-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
    const currentTime = new Date().toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit'
    });

    for (let pageIdx = 0; pageIdx < pageChunks.length; pageIdx++) {
      const pageRows = pageChunks[pageIdx];

      const pageEl = document.createElement('div');
      pageEl.style.width = `${pageWidthPx}px`;
      pageEl.style.height = `${pageHeightPx}px`;
      pageEl.style.padding = '24px 30px';
      pageEl.style.background = '#ffffff';
      pageEl.style.boxSizing = 'border-box';
      pageEl.style.display = 'flex';
      pageEl.style.flexDirection = 'column';
      pageEl.style.justifyContent = 'space-between';
      pageEl.style.fontFamily =
        "'Segoe UI', -apple-system, BlinkMacSystemFont, 'Nirmala UI', Roboto, Helvetica, Arial, sans-serif";
      pageEl.style.color = '#0f172a';

      // Header + Table HTML
      let tableHtml = '';
      if (pageRows.length === 0) {
        tableHtml = `
          <tr>
            <td colspan="${headers.length}" style="text-align: center; padding: 24px; color: #64748b; font-size: 11px;">
              कोई रिकॉर्ड उपलब्ध नहीं है (No records found).
            </td>
          </tr>
        `;
      } else {
        tableHtml = pageRows
          .map((row, rIdx) => {
            const isTotalRow =
              String(row[1] || '').includes('कुल') ||
              String(row[0] || '').includes('कुल') ||
              String(row[1] || '').toLowerCase().includes('total');
            const bgColor = isTotalRow
              ? '#e2e8f0'
              : rIdx % 2 === 0
              ? '#ffffff'
              : '#f8fafc';
            const fontWeight = isTotalRow ? '800' : '500';
            const textColor = isTotalRow ? '#0f172a' : '#1e293b';

            const cellsHtml = row
              .map((cell, cIdx) => {
                const align = getColumnAlignment(headers[cIdx] || '', cell);
                const borderTop = isTotalRow ? 'border-top: 2px solid #475569;' : '';
                return `<td style="padding: 5px 8px; border: 1px solid #cbd5e1; text-align: ${align}; font-size: 9.5px; ${borderTop}">${cell ?? '-'}</td>`;
              })
              .join('');

            return `<tr style="background-color: ${bgColor}; font-weight: ${fontWeight}; color: ${textColor};">${cellsHtml}</tr>`;
          })
          .join('');
      }

      pageEl.innerHTML = `
        <div>
          <!-- Official Government Header -->
          <div style="text-align: center; border-bottom: 2px solid #1e3a8a; padding-bottom: 8px; margin-bottom: 10px;">
            <div style="font-size: 11px; font-weight: 700; color: #1e3a8a; letter-spacing: 0.8px; text-transform: uppercase;">
              ${subtitle}
            </div>
            <div style="font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 2px; letter-spacing: -0.2px;">
              DANTEWADA APAAR PENDING SURVEY PORTAL
            </div>
            <div style="display: inline-block; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 4px; padding: 3px 12px; font-size: 11.5px; font-weight: 700; color: #1e40af; margin-top: 4px;">
              ${title}
            </div>
          </div>

          <!-- Metadata Ribbon -->
          <div style="display: flex; justify-content: space-between; align-items: center; font-size: 9.5px; color: #475569; margin-bottom: 8px; padding: 0 2px;">
            <div><strong>दिनांक:</strong> ${currentDate} | <strong>समय:</strong> ${currentTime}</div>
            <div><strong>कुल रिकॉर्ड (Total):</strong> <span style="color: #0f172a; font-weight: 700;">${totalRows}</span></div>
          </div>

          <!-- Excel-style Grid Table -->
          <table style="width: 100%; border-collapse: collapse; font-size: 9.5px; table-layout: auto;">
            <thead>
              <tr style="background: linear-gradient(180deg, #1e3a8a 0%, #1e40af 100%); color: #ffffff;">
                ${headers
                  .map(
                    (h, i) =>
                      `<th style="padding: 6px 8px; border: 1px solid #172554; font-weight: 700; text-align: ${getColumnAlignment(
                        h
                      )}; font-size: 9.5px; white-space: nowrap;">${h}</th>`
                  )
                  .join('')}
              </tr>
            </thead>
            <tbody>
              ${tableHtml}
            </tbody>
          </table>
        </div>

        <!-- Official Footer -->
        <div style="border-top: 1px solid #cbd5e1; padding-top: 6px; margin-top: 10px; display: flex; justify-content: space-between; align-items: center; font-size: 8.5px; color: #64748b;">
          <div>गोपनीय - स्कूल शिक्षा विभाग, जिला प्रशासन दंतेवाड़ा (छ.ग.)</div>
          <div style="font-weight: 700; color: #334155;">पृष्ठ (Page) ${pageIdx + 1} of ${totalPages}</div>
          <div>Dantewada APAAR Portal &bull; Official Report</div>
        </div>
      `;

      renderContainer.innerHTML = '';
      renderContainer.appendChild(pageEl);

      const canvas = await html2canvas(pageEl, {
        scale: 2, // 2x DPI for crisp text and borders
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: pageWidthPx,
        windowHeight: pageHeightPx,
        x: 0,
        y: 0,
        scrollX: 0,
        scrollY: 0
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.96);

      if (pageIdx > 0) {
        doc.addPage('a4', orientation);
      }
      doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
    }

    doc.save(`${filename}_${new Date().toISOString().split('T')[0]}.pdf`);
  } finally {
    if (renderContainer.parentNode) {
      renderContainer.parentNode.removeChild(renderContainer);
    }
  }
}

/**
 * Open a pristine printable preview in the browser with native vector PDF quality
 */
export function printHTMLReport({
  title,
  subtitle = 'कार्यालय कलेक्टर एवं जिला मिशन संचालक, समग्र शिक्षा, जिला-दंतेवाड़ा (छ.ग.)',
  headers,
  rows,
  orientation = 'landscape'
}: PDFReportOptions): void {
  const isLandscape = orientation === 'landscape';
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('कृपया पॉप-अप अनुमति दें ताकि प्रिंट प्रीव्यू खुल सके।');
    return;
  }

  const currentDate = new Date().toLocaleDateString('hi-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
  const currentTime = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit'
  });

  const tableRowsHtml = rows
    .map((row, rIdx) => {
      const isTotalRow =
        String(row[1] || '').includes('कुल') ||
        String(row[0] || '').includes('कुल') ||
        String(row[1] || '').toLowerCase().includes('total');
      const bgColor = isTotalRow
        ? '#e2e8f0'
        : rIdx % 2 === 0
        ? '#ffffff'
        : '#f8fafc';
      const fontWeight = isTotalRow ? '800' : '500';
      const textColor = isTotalRow ? '#0f172a' : '#1e293b';

      const cells = row
        .map((cell, cIdx) => {
          const align = getColumnAlignment(headers[cIdx] || '', cell);
          const borderTop = isTotalRow ? 'border-top: 2px solid #475569;' : '';
          return `<td style="padding: 6px 8px; border: 1px solid #cbd5e1; text-align: ${align}; ${borderTop}">${cell ?? '-'}</td>`;
        })
        .join('');

      return `<tr style="background-color: ${bgColor}; font-weight: ${fontWeight}; color: ${textColor};">${cells}</tr>`;
    })
    .join('');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="hi">
    <head>
      <meta charset="utf-8" />
      <title>${title} - Dantewada APAAR Portal</title>
      <style>
        @page {
          size: A4 ${isLandscape ? 'landscape' : 'portrait'};
          margin: 10mm 12mm 10mm 12mm;
        }
        body {
          font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, 'Nirmala UI', Roboto, Arial, sans-serif;
          margin: 0;
          padding: 12px;
          color: #0f172a;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #1e3a8a;
          padding-bottom: 10px;
          margin-bottom: 12px;
        }
        .dept-title {
          font-size: 12px;
          font-weight: 700;
          color: #1e3a8a;
          text-transform: uppercase;
        }
        .portal-title {
          font-size: 17px;
          font-weight: 800;
          color: #0f172a;
          margin: 2px 0;
        }
        .report-pill {
          display: inline-block;
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 4px;
          padding: 4px 14px;
          font-size: 13px;
          font-weight: 700;
          color: #1e40af;
          margin-top: 4px;
        }
        .meta-bar {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          color: #475569;
          margin-bottom: 10px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 10px;
        }
        thead th {
          background-color: #1e3a8a !important;
          color: #ffffff !important;
          padding: 7px 8px;
          border: 1px solid #0f172a;
          font-weight: 700;
          white-space: nowrap;
        }
        tbody td {
          border: 1px solid #cbd5e1;
        }
        .footer {
          margin-top: 16px;
          border-top: 1px solid #cbd5e1;
          padding-top: 8px;
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          color: #64748b;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="dept-title">${subtitle}</div>
        <div class="portal-title">DANTEWADA APAAR PENDING SURVEY PORTAL</div>
        <div class="report-pill">${title}</div>
      </div>
      <div class="meta-bar">
        <div><strong>दिनांक:</strong> ${currentDate} | <strong>समय:</strong> ${currentTime}</div>
        <div><strong>कुल रिकॉर्ड:</strong> <strong>${rows.length}</strong></div>
      </div>
      <table>
        <thead>
          <tr>
            ${headers.map((h) => `<th style="text-align: ${getColumnAlignment(h)};">${h}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>
      <div class="footer">
        <div>गोपनीय - स्कूल शिक्षा विभाग, जिला प्रशासन दंतेवाड़ा (छ.ग.)</div>
        <div>Dantewada APAAR Portal Official Export</div>
      </div>
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 350);
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}
