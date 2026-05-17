/**
 * AllLocationsPage
 *
 * Searchable directory of all locations. Users can search by street address
 * or Location ID. Clicking a result navigates to the full LocationPage,
 * which shows Owner Info, Inspections, and Complaints tabs.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { locationService } from "@/services/locationService";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useDebouncedCallback } from "use-debounce";
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
} from "lucide-react";

type Location = any; // Properly type later

function LocationCard({
  loc,
  onClick,
}: {
  loc: Location;
  onClick: () => void;
}) {
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
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState(false);

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
  };

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
            Search by street address or Location ID to view complaints and
            inspections at a property.
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
            <p className="text-sm">
              Failed to search locations. Please try again.
            </p>
          </div>
        )}

        {/* No results */}
        {!loading && !error && searched && results.length === 0 && (
          <div className="text-center py-16">
            <MapPin className="w-10 h-10 mx-auto mb-3 text-muted-foreground opacity-25" />
            <p className="text-sm font-medium text-muted-foreground">
              No locations found
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Try a different address or Location ID
            </p>
          </div>
        )}

        {/* Empty / idle state */}
        {!loading && !searched && (
          <div className="text-center py-20">
            <div className="w-16 h-16 rounded-2xl bg-muted/50 border border-border flex items-center justify-center mx-auto mb-4">
              <MapPin className="w-7 h-7 text-muted-foreground opacity-40" />
            </div>
            <p className="text-sm font-semibold text-muted-foreground">
              Search for a location
            </p>
            <p className="text-xs text-muted-foreground mt-1.5 max-w-xs mx-auto leading-relaxed">
              Enter a street address or numeric Location ID to find complaints
              and inspections at that property.
            </p>
          </div>
        )}

        {/* Results */}
        {!loading && !error && results.length > 0 && (
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
      </div>
    </div>
  );
}
