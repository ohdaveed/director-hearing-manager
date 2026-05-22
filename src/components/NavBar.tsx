import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Role } from "@/context/AuthContext";
import { ChevronDown, FlaskConical, X } from "lucide-react";

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  roles: Role[];
}

interface NavBarProps {
  visibleNav: NavItem[];
  isNavActive: (path: string) => boolean;
  inspectorName: string;
  realRole?: Role;
  isSuperAdmin: boolean;
  impersonatedRole: Role | null;
  setImpersonatedRole: (role: Role | null) => void;
  signOut: () => Promise<void>;
}

const ALL_ROLES: Role[] = ["Inspector", "Admin", "Program Manager", "Super Admin"];

export function NavBar({
  visibleNav,
  isNavActive,
  inspectorName,
  realRole,
  isSuperAdmin,
  impersonatedRole,
  setImpersonatedRole,
  signOut,
}: NavBarProps) {
  const navigate = useNavigate();
  const [rolePickerOpen, setRolePickerOpen] = useState(false);

  const displayName = inspectorName?.trim() || "Unknown user";

  const userInitials =
    displayName
      .split(" ")
      .map((n) => n[0])
      .filter(Boolean)
      .join("")
      .toUpperCase() || "?";

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
    <>
      {/* Impersonation banner */}
      {impersonatedRole && (
        <div className="bg-primary text-primary-foreground px-4 py-1.5 flex items-center justify-between text-xs font-medium">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-3.5 h-3.5 opacity-80" />
            <span>
              Previewing as <strong>{impersonatedRole}</strong> — nav and pages reflect this role.
              Your real data is unchanged.
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
            <p className="text-[13px] font-semibold text-foreground leading-none">EH Division</p>
            <p className="text-[10px] text-muted-foreground leading-none mt-0.5">SFDPH</p>
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
              {userInitials}
            </div>
            <div className="hidden sm:flex flex-col items-end">
              <span className="text-xs font-medium text-foreground leading-none truncate max-w-[140px]">
                {displayName}
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
                <span className="hidden sm:inline">{impersonatedRole ?? "Preview"}</span>
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
            onClick={signOut}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors shrink-0 px-1"
            title="Sign out"
          >
            Sign out
          </button>
        </div>
      </header>

      {rolePickerOpen && (
        <div className="fixed inset-0 z-20" onClick={() => setRolePickerOpen(false)} />
      )}
    </>
  );
}
