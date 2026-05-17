import {
  appendSheet,
  createWorkbook,
  jsonToSheet,
  sheetToCsv,
  write,
} from "xlsx-format";

interface ExportOptions {
  fileName?: string;
  sheetName?: string;
}

interface ColumnDef {
  key: string;
  header: string;
  formatter?: (value: unknown, row: Record<string, unknown>) => string;
}

function formatData<T extends Record<string, unknown>>(
  data: T[],
  columns: ColumnDef[],
): Record<string, unknown>[] {
  return data.map((row) => {
    const newRow: Record<string, unknown> = {};
    columns.forEach((col) => {
      const value = row[col.key];
      newRow[col.header] = col.formatter ? col.formatter(value, row) : value;
    });
    return newRow;
  });
}

export async function exportToExcel<T extends Record<string, unknown>>(
  data: T[],
  columns: ColumnDef[],
  options: ExportOptions = {},
): Promise<void> {
  const { fileName = "export", sheetName = "Sheet1" } = options;

  const formattedData = formatData(data, columns);

  const worksheet = jsonToSheet(formattedData);
  const workbook = createWorkbook();
  appendSheet(workbook, worksheet, sheetName);

  const xlsxData = await write(workbook, { type: "array", bookType: "xlsx" });
  const blob = new Blob([xlsxData], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: ColumnDef[],
  options: ExportOptions = {},
): void {
  const { fileName = "export" } = options;

  const formattedData = formatData(data, columns);

  const worksheet = jsonToSheet(formattedData);
  const csv = sheetToCsv(worksheet);

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
