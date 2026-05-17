import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { exportToExcel, exportToCSV } from "@/utils/exportExcel";

interface TestRow extends Record<string, unknown> {
  id: number;
  name: string;
  date: string;
}

describe("exportExcel", () => {
  let createElementSpy: ReturnType<typeof vi.spyOn>;
  let createObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let revokeObjectURLSpy: ReturnType<typeof vi.spyOn>;
  let clickSpy: ReturnType<typeof vi.spyOn>;

  const mockAnchor = {
    href: "",
    download: "",
    click: vi.fn(),
    style: {},
  };

  beforeEach(() => {
    createElementSpy = vi
      .spyOn(document, "createElement")
      .mockReturnValue(mockAnchor as unknown as HTMLAnchorElement);
    createObjectURLSpy = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:test-url");
    revokeObjectURLSpy = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});
    clickSpy = vi.spyOn(mockAnchor, "click").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const testData: TestRow[] = [
    { id: 1, name: "Alice", date: "2024-01-15" },
    { id: 2, name: "Bob", date: "2024-02-20" },
  ];

  const columns = [
    { key: "id", header: "ID" },
    { key: "name", header: "Name" },
    { key: "date", header: "Date" },
  ];

  describe("exportToExcel", () => {
    it("creates an Excel file download with formatted data", async () => {
      await exportToExcel(testData, columns, {
        fileName: "test-export",
        sheetName: "TestSheet",
      });

      expect(createElementSpy).toHaveBeenCalledWith("a");
      expect(mockAnchor.download).toBe("test-export.xlsx");
      expect(mockAnchor.href).toBe("blob:test-url");
      expect(clickSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:test-url");
    });

    it("uses default file name and sheet name when options are omitted", async () => {
      await exportToExcel(testData, columns);

      expect(mockAnchor.download).toBe("export.xlsx");
    });

    it("applies formatters to cell values", async () => {
      const formattedColumns = [
        { key: "id", header: "ID", formatter: (v: unknown) => `ID-${v}` },
        { key: "name", header: "Name" },
      ];

      await exportToExcel(testData, formattedColumns);

      expect(mockAnchor.download).toBe("export.xlsx");
      expect(createObjectURLSpy).toHaveBeenCalled();
    });

    it("handles empty data array", async () => {
      await exportToExcel([], columns);

      expect(mockAnchor.download).toBe("export.xlsx");
      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe("exportToCSV", () => {
    it("creates a CSV file download with formatted data", () => {
      exportToCSV(testData, columns, { fileName: "test-csv" });

      expect(createElementSpy).toHaveBeenCalledWith("a");
      expect(mockAnchor.download).toBe("test-csv.csv");
      expect(mockAnchor.href).toBe("blob:test-url");
      expect(clickSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith("blob:test-url");
    });

    it("uses default file name when options are omitted", () => {
      exportToCSV(testData, columns);

      expect(mockAnchor.download).toBe("export.csv");
    });

    it("applies formatters to cell values", () => {
      const formattedColumns = [
        { key: "id", header: "ID", formatter: (v: unknown) => `ID-${v}` },
        { key: "name", header: "Name" },
      ];

      exportToCSV(testData, formattedColumns);

      expect(mockAnchor.download).toBe("export.csv");
    });

    it("handles empty data array", () => {
      exportToCSV([], columns);

      expect(mockAnchor.download).toBe("export.csv");
      expect(clickSpy).toHaveBeenCalled();
    });
  });
});
