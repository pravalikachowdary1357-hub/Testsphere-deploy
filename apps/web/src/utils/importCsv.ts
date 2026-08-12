export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
}

// Hand-rolled instead of split('\n')/split(',') so quoted fields can contain
// commas, embedded newlines, and escaped quotes ("") — the inverse of
// escapeCsvCell in exportCsv.ts.
export function parseCsv(text: string): ParsedCsv {
  const table: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\r') {
      // \n (below) ends the row — bare \r is just skipped
    } else if (char === '\n') {
      row.push(field);
      table.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    table.push(row);
  }

  const nonEmptyRows = table.filter((cells) => cells.some((cell) => cell.trim() !== ''));
  const [headerRow, ...dataRows] = nonEmptyRows;
  if (!headerRow) {
    return { headers: [], rows: [] };
  }

  const headers = headerRow.map((cell) => cell.trim());
  const rows = dataRows.map((cells) => {
    const record: Record<string, string> = {};
    headers.forEach((header, index) => {
      record[header] = (cells[index] ?? '').trim();
    });
    return record;
  });

  return { headers, rows };
}

export function readCsvFile(file: File): Promise<ParsedCsv> {
  return file.text().then(parseCsv);
}
