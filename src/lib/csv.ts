export function generateCSV(
  headers: string[],
  rows: string[][]
): string {
  const escape = (val: string) => {
    if (val.includes(",") || val.includes('"') || val.includes("\n")) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const headerLine = headers.map(escape).join(",");
  const dataLines = rows.map((row) => row.map(escape).join(","));
  return [headerLine, ...dataLines].join("\n");
}

export function parseCSV(content: string): { headers: string[]; rows: string[][]; errors: number[] } {
  const lines = content.trim().split("\n");
  if (lines.length === 0) return { headers: [], rows: [], errors: [] };

  const headers = lines[0].split(",").map((h) => h.trim().replace(/^"|"$/g, ""));
  const rows: string[][] = [];
  const errors: number[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim().replace(/^"|"$/g, ""));
    if (cols.length !== headers.length) {
      errors.push(i + 1);
    } else {
      rows.push(cols);
    }
  }

  return { headers, rows, errors };
}
