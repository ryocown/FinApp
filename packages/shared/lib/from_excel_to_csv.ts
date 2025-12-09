import * as XLSX from 'xlsx';

/**
 * Converts a spreadsheet file (XLSX, XLS, ODS) to CSV using xlsx (SheetJS).
 * Works in both Node.js and Browser environments.
 */
export function fromExcelToCsv(input: any): string[] {
  // Parse the file
  // input can be:
  // - Node: Buffer
  // - Browser: ArrayBuffer, Uint8Array, etc.
  const workbook = XLSX.read(input, { type: 'buffer' }); // 'buffer' works for Buffer, ArrayBuffer, Uint8Array often auto-detected or needs type hint
  const sheets: string[] = [];

  if (workbook.SheetNames.length === 0) {
    return sheets;
  }

  workbook.SheetNames.forEach(sheetName => {
    const sheet = workbook.Sheets[sheetName];
    // sheet_to_csv generates CSV string
    const csvContent = XLSX.utils.sheet_to_csv(sheet);
    sheets.push(csvContent);
  });

  return sheets;
}