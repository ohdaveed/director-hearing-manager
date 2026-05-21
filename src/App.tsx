import { useState, useEffect, lazy, Suspense } from "react";
import { AuthProvider, useAuth, Role } from "@/context/AuthContext";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  useParams,
} from "react-router-dom";

// Keep auth and core dashboards static for instant initial loading
import LoginPage from "@/pages/LoginPage";
import SignUpPage from "@/pages/SignUpPage";
import DashboardPage from "@/pages/DashboardPage";
import InspectorDashboardPage from "@/pages/InspectorDashboardPage";

// Lazy-load heavier functional modules to split the vendor bundle
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const ComplaintsPage = lazy(() => import("@/pages/ComplaintsPage"));
const ComplaintEntryPage = lazy(() => import("@/pages/ComplaintEntryPage"));
const InspectionFormPage = lazy(() => import("@/pages/InspectionFormPage"));
const InspectionHistoryPage = lazy(
  () => import("@/pages/InspectionHistoryPage"),
);
const EnforcementPage = lazy(() => import("@/pages/EnforcementPage"));
const HearingPacketsPage = lazy(() => import("@/pages/HearingPacketsPage"));
const DraftPacketAnalysisPage = lazy(
  () => import("@/pages/DraftPacketAnalysisPage"),
);
const LocationPage = lazy(() => import("@/pages/LocationPage"));
const AllLocationsPage = lazy(() => import("@/pages/AllLocationsPage"));
const ImportComplaintsPage = lazy(() => import("@/pages/ImportComplaintsPage"));
const UserManagementPage = lazy(() => import("@/pages/UserManagementPage"));
const DocumentLibraryPage = lazy(() => import("@/pages/DocumentLibraryPage"));

import { Toaster } from "@/components/ui/sonner";
import {
  ClipboardList,
  AlertTriangle,
  ClipboardCheck,
  BarChart3,
  MapPin,
  Loader2,
  Gavel,
  FileText,
  BookOpen,
} from "lucide-react";
import { NavBar } from "@/components/NavBar";

const ALL_ROLES: Role[] = [
  "Inspector",
  "Admin",
  "Program Manager",
  "Super Admin",
];

// ── 5-pillar navigation ───────────────────────────────────────────────────────

const ALL_NAV = [
  {
    path: "/dashboard",
    label: "Dashboard",
    icon: <BarChart3 className="w-3.5 h-3.5" />,
    roles: ALL_ROLES,
  },
  {
    path: "/complaints",
    label: "Complaints",
    icon: <ClipboardList className="w-3.5 h-3.5" />,
    roles: ALL_ROLES,
  },
  {
    path: "/inspections",
    label: "Inspections",
    icon: <ClipboardCheck className="w-3.5 h-3.5" />,
    roles: ALL_ROLES,
  },
  {
    path: "/enforcement",
    label: "Enforcement",
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
    roles: ["Program Manager", "Super Admin"] as Role[],
  },
  {
    path: "/hearings",
    label: "Director's Hearings",
    icon: <Gavel className="w-3.5 h-3.5" />,
    roles: ALL_ROLES,
  },
  {
    path: "/draft-analysis",
    label: "Draft Analysis",
    icon: <FileText className="w-3.5 h-3.5" />,
    roles: ALL_ROLES,
  },
  {
    path: "/documents",
    label: "Documents",
    icon: <BookOpen className="w-3.5 h-3.5" />,
    roles: ALL_ROLES,
  },
  {
    path: "/all-locations",
    label: "Locations",
    icon: <MapPin className="w-3.5 h-3.5" />,
    roles: ALL_ROLES,
  },
];

// ── Parameterized redirect helpers ────────────────────────────────────────────

function ComplaintIdRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/complaints/${id}`} replace />;
}

function InspectionComplaintRedirect() {
  const { complaintId } = useParams<{ complaintId: string }>();
  return <Navigate to={`/inspections/${complaintId}`} replace />;
}

function HearingPacketIdRedirect() {
  const { id } = useParams<{ id: string }>();
  return <Navigate to={`/enforcement/hearings/${id}`} replace />;
}

// ── AppShell (uses router hooks — must be inside BrowserRouter) ───────────────

function AppShell() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const realRole = user?.role as Role | undefined;
  const isSuperAdmin = realRole === "Super Admin";
  const [impersonatedRole, setImpersonatedRole] = useState<Role | null>(null);
  const activeRole = (impersonatedRole ?? realRole) as Role | undefined;

  useEffect(() => {
    const currentNav = ALL_NAV.find((n) =>
      location.pathname.startsWith(n.path),
    );
    if (currentNav && activeRole && !currentNav.roles.includes(activeRole)) {
      navigate("/dashboard", { replace: true });
    }
  }, [location.pathname, activeRole, navigate]);

  if (!user) return null;

  const inspectorName =
    [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;
  const visibleNav = ALL_NAV.filter(
    (item) => activeRole && item.roles.includes(activeRole),
  );

  const isNavActive = (path: string) => {
    if (path === "/dashboard")
      return location.pathname === "/dashboard" || location.pathname === "/";
    if (path === "/complaints")
      return location.pathname.startsWith("/complaints");
    if (path === "/inspections")
      return location.pathname.startsWith("/inspections");
    if (path === "/enforcement")
      return location.pathname.startsWith("/enforcement");
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-background">
      <NavBar
        visibleNav={visibleNav}
        isNavActive={isNavActive}
        inspectorName={inspectorName}
        realRole={realRole}
        isSuperAdmin={isSuperAdmin}
        impersonatedRole={impersonatedRole}
        setImpersonatedRole={setImpersonatedRole}
        signOut={signOut}
      />

      <Toaster />
      <main>
        {/* Suspense fallback component handles smooth async viewport parsing */}
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-57px)] text-muted-foreground bg-background">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Dashboard */}
            <Route
              path="/dashboard"
              element={
                activeRole === "Inspector" ? (
                  <InspectorDashboardPage inspectorName={inspectorName} />
                ) : (
                  <DashboardPage role={activeRole} />
                )
              }
            />

            {/* Complaints */}
            <Route
              path="/complaints/new"
              element={
                <ComplaintEntryPage
                  inspectorName={
                    activeRole === "Inspector" ? user?.email : undefined
                  }
                  onSuccess={
                    activeRole === "Inspector"
                      ? () => navigate("/complaints")
                      : undefined
                  }
                />
              }
            />
            <Route
              path="/complaints/import"
              element={<ImportComplaintsPage />}
            />
            <Route path="/complaints/:id" element={<ComplaintsPage />} />
            <Route path="/complaints" element={<ComplaintsPage />} />

            {/* Inspections */}
            <Route
              path="/inspections/new"
              element={<InspectionFormPage inspectorName={inspectorName} />}
            />
            <Route
              path="/inspections/:complaintId"
              element={<InspectionFormPage inspectorName={inspectorName} />}
            />
            <Route path="/inspections" element={<InspectionHistoryPage />} />

            {/* Enforcement */}
            <Route
              path="/enforcement/hearings/:id"
              element={<EnforcementPage />}
            />
            <Route path="/enforcement/hearings" element={<EnforcementPage />} />
            <Route path="/enforcement" element={<EnforcementPage />} />

            {/* Director's Hearings */}
            <Route
              path="/hearings/:id"
              element={
                <HearingPacketsPage
                  userScopedFilter={activeRole === "Inspector"}
                  inspectorName={
                    activeRole === "Inspector" ? inspectorName : undefined
                  }
                  baseRoute="/hearings"
                />
              }
            />
            <Route
              path="/hearings"
              element={
                <HearingPacketsPage
                  userScopedFilter={activeRole === "Inspector"}
                  inspectorName={
                    activeRole === "Inspector" ? inspectorName : undefined
                  }
                  baseRoute="/hearings"
                />
              }
            />

            <Route
              path="/draft-analysis"
              element={<DraftPacketAnalysisPage />}
            />

            <Route path="/documents" element={<DocumentLibraryPage />} />

            {/* Locations */}
            <Route path="/all-locations" element={<AllLocationsPage />} />
            <Route
              path="/locations/:locationRecordId"
              element={<LocationPage />}
            />

            {/* User management */}
            <Route path="/user-management" element={<UserManagementPage />} />

            {/* My Profile */}
            <Route path="/profile" element={<ProfilePage />} />

            {/* Redirects from old paths */}
            <Route
              path="/my-complaints"
              element={<Navigate to="/complaints" replace />}
            />
            <Route
              path="/my-complaints/:id"
              element={<ComplaintIdRedirect />}
            />
            <Route
              path="/all-complaints"
              element={<Navigate to="/complaints" replace />}
            />
            <Route
              path="/all-complaints/:id"
              element={<ComplaintIdRedirect />}
            />
            <Route
              path="/new-complaint"
              element={<Navigate to="/complaints/new" replace />}
            />
            <Route
              path="/import-complaints"
              element={<Navigate to="/complaints/import" replace />}
            />
            <Route
              path="/inspection-form"
              element={<Navigate to="/inspections/new" replace />}
            />
            <Route
              path="/inspection/:complaintId"
              element={<InspectionComplaintRedirect />}
            />
            <Route
              path="/inspection-history"
              element={<Navigate to="/inspections" replace />}
            />
            <Route
              path="/escalation-queue"
              element={<Navigate to="/enforcement" replace />}
            />
            <Route
              path="/hearing-packets"
              element={<Navigate to="/enforcement/hearings" replace />}
            />
            <Route
              path="/hearing-packets/:id"
              element={<HearingPacketIdRedirect />}
            />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

// ── Auth loading screen ───────────────────────────────────────────────────────

function AppContent() {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-primary/20 scale-110 animate-pulse" />
            <div className="relative w-16 h-16 bg-primary rounded-2xl flex items-center justify-center shadow-xl">
              <span className="text-primary-foreground font-black text-base tracking-wide">
                EHD
              </span>
            </div>
          </div>
          <div className="text-center space-y-1.5">
            <p className="text-sm font-semibold text-foreground tracking-tight">
              Environmental Health Division
            </p>
            <p className="text-xs text-muted-foreground">
              San Francisco Department of Public Health
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/40 border border-border px-4 py-2 rounded-full">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Loading your workspace…</span>
        </div>
      </div>
    );
  }

  if (!user) {
    if (location.pathname === "/signup") {
      return <SignUpPage />;
    }
    return <LoginPage />;
  }

  return <AppShell />;
}

export default function App() {
  return (
    <BrowserRouter
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
