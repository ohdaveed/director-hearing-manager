import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vite-plus/test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LocationOwnerPanel from "../LocationOwnerPanel";

const mockFns = vi.hoisted(() => ({
  getById: vi.fn(),
  update: vi.fn(),
}));

vi.mock("@/services/locationService", () => ({
  locationService: {
    getById: (...args: any[]) => mockFns.getById(...args),
    update: (...args: any[]) => mockFns.update(...args),
  },
}));

function Wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("LocationOwnerPanel", () => {
  const mockLocation = {
    id: "loc-123",
    address: "123 Main St",
    location_id: "111111",
    owner_name: "Old Owner",
    owner_address: "Old Address",
    facility_type: "Apartments",
    building_features: ["Elevator"],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockFns.getById.mockResolvedValue({ location: mockLocation });
  });

  it("renders location details in read-only mode initially", async () => {
    render(<LocationOwnerPanel locationRecordId="loc-123" />, {
      wrapper: Wrapper,
    });

    await waitFor(() => {
      expect(screen.getByText("Old Owner")).toBeInTheDocument();
      expect(screen.getByText("Apartments")).toBeInTheDocument();
    });
  });

  it("switches to edit mode and saves all fields correctly", async () => {
    render(<LocationOwnerPanel locationRecordId="loc-123" />, {
      wrapper: Wrapper,
    });
    const user = userEvent.setup();

    await waitFor(() => expect(screen.getByText("Old Owner")).toBeInTheDocument());

    const editBtn = screen.getByRole("button", { name: /edit/i });
    await user.click(editBtn);

    // Change fields
    const ownerInput = screen.getByLabelText(/Owner Name/i);
    await user.clear(ownerInput);
    await user.type(ownerInput, "New Owner");

    const dbaInput = screen.getByLabelText(/DBA \/ Facility Name/i);
    await user.type(dbaInput, "New Market");

    const hhCheckbox = screen.getByLabelText(/Healthy Housing Program/i);
    await user.click(hhCheckbox);

    mockFns.update.mockResolvedValue({
      ...mockLocation,
      owner_name: "New Owner",
      dba: "New Market",
      healthy_housing: true,
    });

    const saveBtn = screen.getByRole("button", { name: /save/i });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(mockFns.update).toHaveBeenCalledWith(
        "loc-123",
        expect.objectContaining({
          owner_name: "New Owner",
          dba: "New Market",
          healthy_housing: true,
        }),
      );
    });

    // Verify it switched back to read-only and shows new values
    await waitFor(() => {
      expect(screen.getByText("New Owner")).toBeInTheDocument();
      expect(screen.getByText("New Market")).toBeInTheDocument();
    });
  });
});
