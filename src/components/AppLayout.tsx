import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { Link, Outlet, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import { fetchDashboardOverview } from "../lib/api";
import { formatDateTime } from "../lib/formatters";
import { useAuth } from "../lib/auth";
import { initials } from "./ui";
import type { ClientOverview, DashboardOverview } from "../types";

interface AppLayoutContextValue {
  dashboard: DashboardOverview | null;
  filteredClients: ClientOverview[];
  isBooting: boolean;
  isRefreshing: boolean;
  globalError: string | null;
  lastUpdated: Date | null;
  refreshDashboard: () => Promise<void>;
}

export default function AppLayout() {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState<DashboardOverview | null>(null);
  const [search, setSearch] = useState("");
  const [isBooting, setIsBooting] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const deferredSearch = useDeferredValue(search);
  const selectedClientId = location.pathname.startsWith("/clients/")
    ? location.pathname.split("/")[2] ?? null
    : null;

  const filteredClients = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();
    const clients = dashboard?.clients ?? [];

    return clients.filter((client) => {
      if (!normalizedSearch) {
        return true;
      }

      const haystack = [
        client.client_name,
        client.owner_name,
        client.slug,
        client.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearch);
    });
  }, [dashboard?.clients, deferredSearch]);

  useEffect(() => {
    void loadDashboard(true);
  }, []);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  async function loadDashboard(initialLoad = false) {
    if (initialLoad) {
      setIsBooting(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const nextDashboard = await fetchDashboardOverview();
      setDashboard(nextDashboard);
      setGlobalError(null);
      setLastUpdated(new Date());
    } catch (error) {
      setGlobalError(toMessage(error));
    } finally {
      setIsBooting(false);
      setIsRefreshing(false);
    }
  }

  async function handleSignOut() {
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch (error) {
      setGlobalError(toMessage(error));
    }
  }

  const userEmail = user?.email ?? "Sense usuari";
  const userInitials = initials(userEmail.split("@")[0] ?? "U");

  return (
    <div className="app-shell">
      <AppSidebar
        clients={filteredClients}
        dashboard={dashboard}
        isBooting={isBooting}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSearchChange={setSearch}
        search={search}
        selectedClientId={selectedClientId}
      />

      <main className="content-area">
        <div className={`content-shell ${selectedClientId ? "content-shell-wide" : ""}`}>
          <header className="topbar">
            <div className="topbar-left">
              <button
                aria-expanded={isSidebarOpen}
                className="mobile-nav-button"
                onClick={() => setIsSidebarOpen(true)}
                type="button"
              >
                Menu
              </button>

              <div className="topbar-meta">
                <Link className="topbar-link" to="/">DecadaHUB</Link>
                <span className="breadcrumb-separator">/</span>
                <span>
                  {lastUpdated
                    ? `Actualitzat ${formatDateTime(lastUpdated.toISOString())}`
                    : "Carregant..."}
                </span>
              </div>
            </div>

            <div className="topbar-right">
              <button
                className="ghost-button"
                onClick={() => void loadDashboard()}
                type="button"
              >
                {isRefreshing ? "Actualitzant..." : "Refrescar"}
              </button>
              <div className="session-chip">
                <div className="user-avatar-sm">{userInitials}</div>
                <span>{userEmail}</span>
              </div>
              <button
                className="ghost-button danger"
                onClick={() => void handleSignOut()}
                type="button"
              >
                Sortir
              </button>
            </div>
          </header>

          <Outlet
            context={
              {
                dashboard,
                filteredClients,
                isBooting,
                isRefreshing,
                globalError,
                lastUpdated,
                refreshDashboard: async () => loadDashboard(false),
              } satisfies AppLayoutContextValue
            }
          />
        </div>
      </main>
    </div>
  );
}

export function useAppLayoutContext() {
  return useOutletContext<AppLayoutContextValue>();
}

function toMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "S'ha produït un error inesperat.";
}
