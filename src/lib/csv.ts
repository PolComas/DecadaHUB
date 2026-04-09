type CsvCell = string | number | boolean | null | undefined;

export interface CsvColumn<Row> {
  header: string;
  value: (row: Row) => CsvCell;
}

function escapeCsvCell(value: CsvCell): string {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, "\"\"")}"`;
  }

  return stringValue;
}

export function safeFilenamePart(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "export";
}

export function currentDateStamp() {
  return new Date().toISOString().slice(0, 10);
}

export function downloadCsv<Row>(filename: string, columns: CsvColumn<Row>[], rows: Row[]) {
  const headerLine = columns.map((column) => escapeCsvCell(column.header)).join(",");
  const lines = rows.map((row) =>
    columns.map((column) => escapeCsvCell(column.value(row))).join(","),
  );
  const csv = [headerLine, ...lines].join("\r\n");
  const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
