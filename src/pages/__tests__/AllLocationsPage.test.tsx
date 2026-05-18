import "@testing-library/jest-dom";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect, beforeEach } from "vite-plus/test";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import AllLocationsPage from "../AllLocationsPage";

const mockFns = vi.hoisted(() => ({
  search: vi.fn(),
  getRecent: vi.fn().mockResolvedValue([]),
  create: vi.fn(),
}));

vi.mock("@/services/locationService", () => ({
  locationService: {
    search: (...args: any[]) => mockFns.search(...args),
    getRecent: (...args: any[]) => mockFns.getRecent(...args),
    create: (...args: any[]) => mockFns.create(...args),
  },
}));

function Wrapper({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return (
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={["/all-locations"]}>
        <Routes>
          <Route path="/all-locations" element={children} />
          <Route
            path="/locations/:id"
            element={<div data-testid="location-page">Location Page</div>}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("AllLocationsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders the search page and shows recently added section", async () => {
    render(<AllLocationsPage />, { wrapper: Wrapper });

    expect(screen.getByText(/All Locations/i)).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Search by address or Location ID/i),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText(/Recently Added/i)).toBeInTheDocument();
    });
  });

  it("shows create location button when no results are found", async () => {
    mockFns.search.mockResolvedValue([]);
    render(<AllLocationsPage />, { wrapper: Wrapper });

    const input = screen.getByPlaceholderText(
      /Search by address or Location ID/i,
    );
    const user = userEvent.setup();
    await user.type(input, "123 Unknown St");

    await waitFor(
      () => {
        expect(screen.getByText(/No locations found/i)).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    expect(
      screen.getByRole("button", { name: /Create New Location/i }),
    ).toBeInTheDocument();
  });

  it("opens the create location form with address pre-filled when button is clicked", async () => {
    mockFns.search.mockResolvedValue([]);
    render(<AllLocationsPage />, { wrapper: Wrapper });

    const input = screen.getByPlaceholderText(
      /Search by address or Location ID/i,
    );
    const user = userEvent.setup();
    await user.type(input, "123 Unknown St");

    await waitFor(
      () => {
        expect(screen.getByText(/No locations found/i)).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    const createBtn = screen.getByRole("button", {
      name: /Create New Location/i,
    });
    await user.click(createBtn);

    expect(screen.getByText(/New Location Details/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Street address")).toHaveValue(
      "123 Unknown St",
    );
  });

  it("calls locationService.create and navigates on save", async () => {
    mockFns.search.mockResolvedValue([]);
    mockFns.create.mockResolvedValue({
      id: "loc-123",
      address: "123 Unknown St",
    });

    render(<AllLocationsPage />, { wrapper: Wrapper });

    const input = screen.getByPlaceholderText(
      /Search by address or Location ID/i,
    );
    const user = userEvent.setup();
    await user.type(input, "123 Unknown St");

    await waitFor(
      () => {
        expect(screen.getByText(/No locations found/i)).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    await user.click(
      screen.getByRole("button", { name: /Create New Location/i }),
    );

    const saveBtn = screen.getByRole("button", { name: /Save Location/i });
    await user.click(saveBtn);

    await waitFor(() => {
      expect(mockFns.create).toHaveBeenCalledTimes(1);
      expect(mockFns.create).toHaveBeenCalledWith(
        expect.objectContaining({ address: "123 Unknown St" }),
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("location-page")).toBeInTheDocument();
    });
  });

  it("shows validation error when address is empty on save", async () => {
    mockFns.search.mockResolvedValue([]);
    render(<AllLocationsPage />, { wrapper: Wrapper });

    const input = screen.getByPlaceholderText(
      /Search by address or Location ID/i,
    );
    const user = userEvent.setup();
    await user.type(input, "123 Unknown St");

    await waitFor(
      () => {
        expect(screen.getByText(/No locations found/i)).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    await user.click(
      screen.getByRole("button", { name: /Create New Location/i }),
    );

    // Clear the pre-filled address
    const addressInput = screen.getByPlaceholderText("Street address");
    await user.clear(addressInput);

    await user.click(screen.getByRole("button", { name: /Save Location/i }));

    await waitFor(() => {
      expect(mockFns.create).not.toHaveBeenCalled();
    });
  });

  it("closes the form when Cancel is clicked", async () => {
    mockFns.search.mockResolvedValue([]);
    render(<AllLocationsPage />, { wrapper: Wrapper });

    const input = screen.getByPlaceholderText(
      /Search by address or Location ID/i,
    );
    const user = userEvent.setup();
    await user.type(input, "123 Unknown St");

    await waitFor(
      () => {
        expect(screen.getByText(/No locations found/i)).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    await user.click(
      screen.getByRole("button", { name: /Create New Location/i }),
    );

    expect(screen.getByText(/New Location Details/i)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: /Cancel/i }));

    await waitFor(() => {
      expect(
        screen.queryByText(/New Location Details/i),
      ).not.toBeInTheDocument();
    });
  });
});
