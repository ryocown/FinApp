import xlsx from 'node-xlsx';

/**
 * Converts a spreadsheet file (XLSX, XLS, ODS) to CSV using node-xlsx.
 * Note: node-xlsx is designed for spreadsheet formats. It does NOT support PDF files directly.
 * If you need to extract tables from a PDF, you will need a library like 'pdf-parse' or 'pdf2json'.
 */
export function fromExcelToCsv(input: any): string[] {
  // Parse the file
  // node-xlsx (via xlsx) supports: xlsx, xlsm, xlsb, xls, ods, etc.
  const workSheets = xlsx.parse(input);
  const sheets: string[] = [];

  if (workSheets.length === 0) {
    return sheets;
  }

  workSheets.forEach(sheet => {
    const csvContent = sheet.data
      .map(row => row.map(cell => {
        // Handle commas and quotes in CSV
        const cellStr = String(cell ?? '');
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`;
        }
        return cellStr;
      }).join(','))
      .join('\n');
    sheets.push(csvContent);
  });

  return sheets;
}