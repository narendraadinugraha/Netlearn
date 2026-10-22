// NetQuest - Export Service
// Generates Microsoft Word-compatible (.doc) files and Excel-compatible CSV files

export function exportToWord(filename, title, contentHtml) {
  const header = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' 
      xmlns:w='urn:schemas-microsoft-com:office:word' 
      xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${title}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    body {
      font-family: 'Calibri', 'Segoe UI', Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.6;
      color: #1e293b;
      margin: 1.5cm;
    }
    h1 {
      font-size: 20pt;
      color: #0284c7;
      border-bottom: 2px solid #0284c7;
      padding-bottom: 8pt;
      margin-bottom: 14pt;
    }
    h2 {
      font-size: 15pt;
      color: #0f172a;
      margin-top: 18pt;
      margin-bottom: 8pt;
    }
    h3 {
      font-size: 12pt;
      color: #334155;
      margin-top: 12pt;
    }
    p, li {
      font-size: 11pt;
      color: #334155;
    }
    ul, ol {
      margin-left: 20pt;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12pt 0;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 8pt;
      font-size: 10pt;
      text-align: left;
    }
    th {
      background-color: #f1f5f9;
      color: #0f172a;
      font-weight: bold;
    }
    code {
      font-family: 'Consolas', monospace;
      background-color: #f1f5f9;
      padding: 2pt 4pt;
      border-radius: 3pt;
      color: #0284c7;
    }
    .footer-meta {
      margin-top: 24pt;
      font-size: 9pt;
      color: #64748b;
      border-top: 1px dashed #cbd5e1;
      padding-top: 8pt;
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="content">
    ${contentHtml}
  </div>
  <div class="footer-meta">
    <p>NetQuest - Media Pembelajaran Jaringan Komputer Interaktif | Dihasilkan secara otomatis pada: ${new Date().toLocaleString()}</p>
  </div>
</body>
</html>`;

  const blob = new Blob([header], { type: "application/msword;charset=utf-8" });
  downloadBlob(blob, filename.endsWith(".doc") ? filename : `${filename}.doc`);
}

export function exportToCsv(filename, rows) {
  if (!rows || !rows.length) return;
  const separator = ",";
  const keys = Object.keys(rows[0]);
  const csvContent = [
    keys.join(separator),
    ...rows.map(row =>
      keys
        .map(key => {
          let cell = row[key] === null || row[key] === undefined ? "" : String(row[key]);
          cell = cell.replace(/"/g, '""');
          if (cell.search(/("|,|\n)/g) >= 0) {
            cell = `"${cell}"`;
          }
          return cell;
        })
        .join(separator)
    )
  ].join("\n");

  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  downloadBlob(blob, filename.endsWith(".csv") ? filename : `${filename}.csv`);
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
