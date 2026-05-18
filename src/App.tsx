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
  Link,
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
  ChevronDown,
  FlaskConical,
  X,
  MapPin,
  Loader2,
  Gavel,
  FileText,
  BookOpen,
} from "lucide-react";

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
  const [rolePickerOpen, setRolePickerOpen] = useState(false);

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

  const handleSetRole = (role: Role) => {
    setImpersonatedRole(role === realRole ? null : role);
    setRolePickerOpen(false);
    navigate("/dashboard");
  };

  const handleExitImpersonation = () => {
    setImpersonatedRole(null);
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Impersonation banner */}
      {impersonatedRole && (
        <div className="bg-primary text-primary-foreground px-4 py-1.5 flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-3.5 h-3.5 opacity-80" />
            <span>
              Previewing as <strong>{impersonatedRole}</strong> — nav and pages
              reflect this role. Your real data is unchanged.
            </span>
          </div>
          <button
            type="button"
            onClick={handleExitImpersonation}
            className="flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity ml-4"
          >
            <X className="w-3.5 h-3.5" /> Exit preview
          </button>
        </div>
      )}

      <header className="sticky top-0 z-20 bg-card/95 backdrop-blur-sm border-b border-border shadow-sm h-[57px] flex items-center px-4 sm:px-6 gap-3">
        {/* Brand mark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-md">
            <span className="text-primary-foreground font-black text-[11px] tracking-wide leading-none">
              EHD
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="text-[13px] font-semibold text-foreground leading-none">
              EH Division
            </p>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">
              SFDPH
            </p>
          </div>
        </div>

        <div className="w-px h-5 bg-border shrink-0 hidden sm:block" />

        {/* Navigation — 5 structural pillars */}
        <nav className="self-stretch flex items-stretch overflow-x-auto flex-1 scrollbar-none">
          {visibleNav.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-1.5 shrink-0 h-full px-3.5 text-[13px] font-medium transition-all border-b-2 ${
                isNavActive(item.path)
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              {item.icon}
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User section */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to="/profile"
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-muted/60 transition-colors"
            title="My Profile"
          >
            <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-[10px] shrink-0">
              {[user.firstName?.[0], user.lastName?.[0]]
                .filter(Boolean)
                .join("")
                .toUpperCase() || user.email[0].toUpperCase()}
            </div>
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-medium text-foreground leading-none truncate max-w-[140px]">
                {inspectorName}
              </span>
              {realRole && (
                <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
                  {realRole}
                </span>
              )}
            </div>
          </Link>

          {isSuperAdmin ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setRolePickerOpen((o) => !o)}
                className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  impersonatedRole
                    ? "bg-primary/10 border-primary/30 text-primary font-semibold"
                    : "bg-muted/60 border-border text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <FlaskConical className="w-3 h-3" />
                <span className="hidden sm:inline">
                  {impersonatedRole ?? "Preview"}
                </span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${rolePickerOpen ? "rotate-180" : ""}`}
                />
              </button>

              {rolePickerOpen && (
                <div className="absolute top-full right-0 mt-1.5 bg-card border border-border rounded-xl shadow-lg py-1.5 min-w-[190px] z-30">
                  <p className="px-3 pt-1 pb-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                    Preview as role
                  </p>
                  {ALL_ROLES.map((role) => {
                    const isActive = (impersonatedRole ?? realRole) === role;
                    const isReal = role === realRole;
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => handleSetRole(role)}
                        className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-xs text-left transition-colors ${
                          isActive
                            ? "text-primary font-semibold bg-primary/5"
                            : "text-foreground hover:bg-muted"
                        }`}
                      >
                        <span>{role}</span>
                        <span className="flex items-center gap-1.5">
                          {isReal && (
                            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                              you
                            </span>
                          )}
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-primary inline-block" />
                          )}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <span className="text-[11px] font-medium bg-muted text-muted-foreground px-2.5 py-1 rounded-lg border border-border hidden sm:inline">
              {realRole}
            </span>
          )}

          <div className="w-px h-5 bg-border shrink-0" />

          <button
            type="button"
            onClick={async () => {
              await signOut();
            }}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors shrink-0 px-1"
            title="Sign out"
          >
            Sign out
          </button>
        </div>
      </header>

      {rolePickerOpen && (
        <div
          className="fixed inset-0 z-20"
          onClick={() => setRolePickerOpen(false)}
        />
      )}

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
                    activeRole === "Inspector" ? inspectorName : undefined
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
