/**
 * AllLocationsPage
 *
 * Searchable directory of all locations. Users can search by street address
 * or Location ID. Clicking a result navigates to the full LocationPage,
 * which shows Owner Info, Inspections, and Complaints tabs.
 */
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { locationService } from "@/services/locationService";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDebouncedCallback } from "use-debounce";
import { toast } from "sonner";
import {
  Search,
  MapPin,
  Building2,
  Hash,
  User,
  Phone,
  ChevronRight,
  X,
  AlertCircle,
  Clock,
  Plus,
  Loader2,
} from "lucide-react";

import { Database } from "@/types/database";

type Location = Database["public"]["Tables"]["locations"]["Row"];

const FACILITY_TYPES = [
  "Tourist Hotel",
  "Residential Hotel",
  "Apartments",
  "Residential Property",
  "Vacant Lot",
  "City Owned Property",
  "Other",
];

function LocationCard({ loc, onClick }: { loc: Location; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-card border border-border rounded-xl px-5 py-4 hover:border-primary/40 hover:shadow-md transition-all group flex items-start justify-between gap-4"
    >
      <div className="min-w-0 flex-1 space-y-2">
        {/* Address */}
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-sm font-semibold text-foreground truncate">
            {loc.address ?? "Unknown Address"}
          </span>
        </div>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground pl-6">
          {loc.location_id && (
            <span className="flex items-center gap-1 font-mono bg-muted px-2 py-0.5 rounded text-foreground">
              <Hash className="w-3 h-3" />
              {loc.location_id}
            </span>
          )}
          {loc.facility_type && (
            <span className="flex items-center gap-1">
              <Building2 className="w-3 h-3" />
              {loc.facility_type}
            </span>
          )}
          {loc.owner_name && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {loc.owner_name}
            </span>
          )}
          {loc.owner_phone && (
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" />
              {loc.owner_phone}
            </span>
          )}
        </div>

        {/* Units / rooms */}
        {(loc.number_of_units || loc.number_of_rooms) && (
          <div className="flex gap-3 text-xs text-muted-foreground pl-6">
            {loc.number_of_units && <span>{loc.number_of_units} units</span>}
            {loc.number_of_rooms && <span>{loc.number_of_rooms} rooms</span>}
          </div>
        )}
      </div>

      <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
    </button>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-card border border-border rounded-xl px-5 py-4 space-y-2">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-3 w-72" />
    </div>
  );
}

export default function AllLocationsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Location[]>([]);
  const [recent, setRecent] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentLoading, setRecentLoading] = useState(true);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(false);

  // Create-location form state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({
    address: "",
    location_id: "",
    facility_type: "",
    owner_name: "",
    owner_address: "",
    owner_phone: "",
    owner_email: "",
    number_of_units: "",
    number_of_rooms: "",
    healthy_housing: false,
    census_tract: "",
    block_lot: "",
    dba: "",
    management_name: "",
    responsible_party: "",
    responsible_party_phone: "",
    responsible_party_email: "",
    building_features: [] as string[],
  });

  // Fetch last 5 added locations on mount
  useEffect(() => {
    let cancelled = false;
    async function loadRecent() {
      try {
        const data = await locationService.getRecent(5);
        if (!cancelled) setRecent(data ?? []);
      } catch {
        // silently fail — recent list is non-critical
      } finally {
        if (!cancelled) setRecentLoading(false);
      }
    }
    loadRecent();
    return () => {
      cancelled = true;
    };
  }, []);

  const doSearch = useDebouncedCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setSearched(false);
      setError(false);
      return;
    }
    setLoading(true);
    setSearched(true);
    setError(false);
    try {
      const res = await locationService.search(q.trim());
      setResults(res);
    } catch {
      setError(true);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, 400);

  const handleChange = (val: string) => {
    setQuery(val);
    doSearch(val);
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setSearched(false);
    setError(false);
    setShowCreateForm(false);
  };

  const createMutation = useMutation({
    mutationFn: (data: any) => locationService.create(data),
    onSuccess: (data) => {
      toast.success("Location created successfully");
      queryClient.invalidateQueries({ queryKey: ["locations"] });
      setShowCreateForm(false);
      setCreateForm({
        address: "",
        location_id: "",
        facility_type: "",
        owner_name: "",
        owner_address: "",
        owner_phone: "",
        owner_email: "",
        number_of_units: "",
        number_of_rooms: "",
        healthy_housing: false,
        census_tract: "",
        block_lot: "",
        dba: "",
        management_name: "",
        responsible_party: "",
        responsible_party_phone: "",
        responsible_party_email: "",
        building_features: [],
      });
      navigate(`/locations/${data.id}`);
    },
    onError: () => {
      toast.error("Failed to create location. Please try again.");
    },
  });

  const handleSaveLocation = () => {
    if (!createForm.address.trim()) {
      toast.error("Address is required.");
      return;
    }
    createMutation.mutate({
      address: createForm.address.trim(),
      location_id: createForm.location_id || undefined,
      facility_type: createForm.facility_type || undefined,
      owner_name: createForm.owner_name || undefined,
      owner_address: createForm.owner_address || undefined,
      owner_phone: createForm.owner_phone || undefined,
      owner_email: createForm.owner_email || undefined,
      number_of_units: createForm.number_of_units ? Number(createForm.number_of_units) : undefined,
      number_of_rooms: createForm.number_of_rooms ? Number(createForm.number_of_rooms) : undefined,
      healthy_housing: createForm.healthy_housing || undefined,
      census_tract: createForm.census_tract || undefined,
      block_lot: createForm.block_lot || undefined,
      dba: createForm.dba || undefined,
      management_name: createForm.management_name || undefined,
      responsible_party: createForm.responsible_party || undefined,
      responsible_party_phone: createForm.responsible_party_phone || undefined,
      responsible_party_email: createForm.responsible_party_email || undefined,
      building_features: createForm.building_features.length
        ? createForm.building_features
        : undefined,
    });
  };

  const isSearching = query.trim().length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-7">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">All Locations</h1>
          </div>
          <p className="text-sm text-muted-foreground pl-10">
            Search by street address or Location ID to view complaints and inspections at a
            property.
          </p>
        </div>

        {/* Search bar */}
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            value={query}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Search by address or Location ID…"
            className="pl-11 pr-11 h-12 text-sm bg-card border-border focus:border-primary/50 shadow-sm"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Error state */}
        {!loading && error && (
          <div className="flex items-center gap-2.5 text-destructive bg-destructive/5 border border-destructive/20 rounded-xl px-5 py-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <p className="text-sm">Failed to search locations. Please try again.</p>
          </div>
        )}

        {/* No results */}
        {!loading && !error && searched && results.length === 0 && (
          <div className="text-center py-16">
            <MapPin className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-25" />
            <p className="text-sm font-medium text-muted-foreground">No locations found</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">
              Try a different address or Location ID
            </p>
            {!showCreateForm && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  setShowCreateForm(true);
                  setCreateForm((prev) => ({ ...prev, address: query }));
                }}
              >
                <Plus className="w-4 h-4" /> Create New Location
              </Button>
            )}
          </div>
        )}

        {/* Create location form */}
        {showCreateForm && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">New Location Details</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-2">
                  <Label htmlFor="loc-address">
                    Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="loc-address"
                    placeholder="Street address"
                    value={createForm.address}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loc-location-id">Location ID</Label>
                  <Input
                    id="loc-location-id"
                    placeholder="e.g. 110881"
                    value={createForm.location_id}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        location_id: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loc-facility-type">Facility Type</Label>
                  <Select
                    value={createForm.facility_type}
                    onValueChange={(v) => setCreateForm((prev) => ({ ...prev, facility_type: v }))}
                  >
                    <SelectTrigger id="loc-facility-type" className="text-sm h-9">
                      <SelectValue placeholder="Select type..." />
                    </SelectTrigger>
                    <SelectContent>
                      {FACILITY_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loc-owner-name">Owner Name</Label>
                  <Input
                    id="loc-owner-name"
                    placeholder="Full name"
                    value={createForm.owner_name}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        owner_name: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loc-owner-address">Owner Address</Label>
                  <Input
                    id="loc-owner-address"
                    placeholder="Mailing address"
                    value={createForm.owner_address}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        owner_address: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loc-owner-phone">Owner Phone</Label>
                  <Input
                    id="loc-owner-phone"
                    placeholder="(415) 555-1234"
                    value={createForm.owner_phone}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        owner_phone: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loc-owner-email">Owner Email</Label>
                  <Input
                    id="loc-owner-email"
                    type="email"
                    placeholder="owner@email.com"
                    value={createForm.owner_email}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        owner_email: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loc-num-units"># Units</Label>
                  <Input
                    id="loc-num-units"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={createForm.number_of_units}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        number_of_units: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loc-num-rooms"># Rooms</Label>
                  <Input
                    id="loc-num-rooms"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={createForm.number_of_rooms}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        number_of_rooms: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loc-census-tract">Census Tract</Label>
                  <Input
                    id="loc-census-tract"
                    placeholder="e.g. 0123.01"
                    value={createForm.census_tract}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        census_tract: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loc-block-lot">Block / Lot</Label>
                  <Input
                    id="loc-block-lot"
                    placeholder="e.g. 1234 / 001"
                    value={createForm.block_lot}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        block_lot: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loc-dba">DBA / Facility Name</Label>
                  <Input
                    id="loc-dba"
                    placeholder="e.g. Joe's Market"
                    value={createForm.dba}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        dba: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loc-management-name">Management Co.</Label>
                  <Input
                    id="loc-management-name"
                    placeholder="e.g. XYZ Management"
                    value={createForm.management_name}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        management_name: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loc-rp">Responsible Party</Label>
                  <Input
                    id="loc-rp"
                    placeholder="Full name of RP"
                    value={createForm.responsible_party}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        responsible_party: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loc-rp-phone">RP Phone</Label>
                  <Input
                    id="loc-rp-phone"
                    placeholder="(415) 000-0000"
                    value={createForm.responsible_party_phone}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        responsible_party_phone: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="loc-rp-email">RP Email</Label>
                  <Input
                    id="loc-rp-email"
                    type="email"
                    placeholder="rp@example.com"
                    value={createForm.responsible_party_email}
                    onChange={(e) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        responsible_party_email: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <Checkbox
                    id="loc-hh"
                    checked={createForm.healthy_housing}
                    onCheckedChange={(checked) =>
                      setCreateForm((prev) => ({
                        ...prev,
                        healthy_housing: !!checked,
                      }))
                    }
                  />
                  <Label
                    htmlFor="loc-hh"
                    className="cursor-pointer text-xs uppercase tracking-wide font-semibold text-muted-foreground"
                  >
                    Healthy Housing Program
                  </Label>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <Button
                  onClick={handleSaveLocation}
                  disabled={createMutation.isPending}
                  className="gap-2"
                >
                  {createMutation.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Location
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search results */}
        {!loading && !error && isSearching && results.length > 0 && (
          <>
            <p className="text-xs text-muted-foreground mb-3 font-medium">
              {results.length} result{results.length !== 1 ? "s" : ""}
            </p>
            <div className="space-y-3">
              {results.map((loc) => (
                <LocationCard
                  key={loc.id}
                  loc={loc}
                  onClick={() => navigate(`/locations/${loc.id}`)}
                />
              ))}
            </div>
          </>
        )}

        {/* Recently Added (idle state) */}
        {!loading && !isSearching && !error && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Recently Added
              </p>
            </div>
            {recentLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : recent.length > 0 ? (
              <div className="space-y-3">
                {recent.map((loc) => (
                  <LocationCard
                    key={loc.id}
                    loc={loc}
                    onClick={() => navigate(`/locations/${loc.id}`)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <MapPin className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-25" />
                <p className="text-sm font-medium text-muted-foreground">No locations yet</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Locations will appear here once they are added.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
