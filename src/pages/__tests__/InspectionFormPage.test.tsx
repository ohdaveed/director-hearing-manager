import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vite-plus/test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import InspectionFormPage from "../InspectionFormPage";

const mockFns = vi.hoisted(() => ({
  getInspectionById: vi.fn(),
  getComplaintById: vi.fn(),
  saveInspection: vi.fn(),
}));

vi.mock("@/services/inspectionService", () => ({
  inspectionService: {
    getById: (...args: any[]) => mockFns.getInspectionById(...args),
    save: (...args: any[]) => mockFns.saveInspection(...args),
  },
}));

vi.mock("@/services/complaintService", () => ({
  complaintService: {
    getById: (...args: any[]) => mockFns.getComplaintById(...args),
  },
}));

function Wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/inspections/comp-123"]}>
        <Routes>
          <Route path="/inspections/:complaintId" element={children} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("InspectionFormPage", () => {
  const mockComplaint = {
    id: "comp-123",
    address: "123 Main St",
    legacy_location_id: "loc-123",
    category: ["Mold"],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFns.getComplaintById.mockResolvedValue(mockComplaint);
  });

  it("persists global observations and areas inspected on save", async () => {
    render(<InspectionFormPage inspectorName="Test Inspector" />, {
      wrapper: Wrapper,
    });
    const user = userEvent.setup();

    await waitFor(() =>
      expect(screen.getByText("123 Main St")).toBeInTheDocument(),
    );

    // Select an area
    const areaBtn = screen.getByRole("button", { name: /Basement/i });
    await user.click(areaBtn);

    // Add a global observation
    const obsInput = screen.getByPlaceholderText(/Add a global observation/i);
    await user.type(obsInput, "Found evidence of rodents in basement");
    await user.click(
      screen.getByTitle("Add this observation to the inspection"),
    );

    mockFns.saveInspection.mockResolvedValue({ inspection_id: 123 });

    const saveBtn = screen.getByRole("button", { name: /Save Draft/i });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(mockFns.saveInspection).toHaveBeenCalledWith(
        expect.objectContaining({
          areas_inspected: ["Basement"],
          global_observations: ["Found evidence of rodents in basement"],
        }),
      );
    });
  });
});
