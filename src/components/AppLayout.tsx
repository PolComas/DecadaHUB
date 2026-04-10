import { useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useRealtimeSync } from "../hooks/useRealtimeSync";
import { Link, Outlet, useLocation, useNavigate, useOutletContext } from "react-router-dom";
import AppSidebar from "./AppSidebar";
import ThemeToggle from "./ThemeToggle";
import { fetchDashboardOverview } from "../lib/api";
import { formatDateTime } from "../lib/formatters";
import { toMessage } from "../lib/errors";
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
  activeMailboxIds: string[];
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

  // All mailbox IDs active by default. Initialized once when mailboxes first load.
  const [activeMailboxIds, setActiveMailboxIds] = useState<string[]>([]);
  const mailboxFilterReady = useRef(false);

  const deferredSearch = useDeferredValue(search);
  const selectedClientId = location.pathname.startsWith("/clients/")
    ? location.pathname.split("/")[2] ?? null
    : null;

  // Initialize mailbox selection once on first dashboard load
  useEffect(() => {
    if (dashboard?.mailboxes.length && !mailboxFilterReady.current) {
      setActiveMailboxIds(dashboard.mailboxes.map((m) => m.id));
      mailboxFilterReady.current = true;
    }
  }, [dashboard?.mailboxes]);

  const filteredClients = useMemo(() => {
    const normalizedSearch = deferredSearch.trim().toLowerCase();
    const clients = dashboard?.clients ?? [];
    const allMailboxIds = dashboard?.mailboxes.map((m) => m.id) ?? [];
    const isFilteringByMailbox =
      mailboxFilterReady.current && activeMailboxIds.length < allMailboxIds.length;

    return clients.filter((client) => {
      // Mailbox filter — only active when the user has deselected at least one mailbox
      if (isFilteringByMailbox) {
        if (activeMailboxIds.length === 0) return false;
        const clientMailboxes = dashboard?.clientMailboxIds[client.id] ?? [];
        if (!clientMailboxes.some((mid) => activeMailboxIds.includes(mid))) return false;
      }

      // Search filter
      if (!normalizedSearch) return true;
      const haystack = [client.client_name, client.owner_name, client.slug, client.notes]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }, [dashboard, activeMailboxIds, deferredSearch]);

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

  function toggleMailbox(id: string) {
    setActiveMailboxIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  // Refresh dashboard automatically when another user changes shared data
  useRealtimeSync(
    [
      { table: "clients" },
      { table: "action_items" },
      { table: "email_threads" },
      { table: "transcripts" },
    ],
    () => loadDashboard(false),
  );

  async function handleSignOut() {
    try {
      await signOut();
      navigate("/login", { replace: true });
    } catch (error) {
      setGlobalError(toMessage(error));
    }
  }

  const userEmail = user?.email ?? "Sin usuario";
  const userInitials = initials(userEmail.split("@")[0] ?? "U");

  return (
    <div className="app-shell">
      <AppSidebar
        activeMailboxIds={activeMailboxIds}
        clients={filteredClients}
        dashboard={dashboard}
        isBooting={isBooting}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onSearchChange={setSearch}
        onToggleMailbox={toggleMailbox}
        search={search}
        selectedClientId={selectedClientId}
      />

      <main className="content-area">
        <div className="content-shell content-shell-wide">
          <header className="topbar">
            <div className="topbar-left">
              <button
                aria-expanded={isSidebarOpen}
                className="mobile-nav-button"
                onClick={() => setIsSidebarOpen(true)}
                type="button"
              >
                Menú
              </button>

              <div className="topbar-meta">
                <Link className="topbar-link" to="/">DecadaHUB</Link>
                <span className="breadcrumb-separator">/</span>
                <span>
                  {lastUpdated
                    ? `Actualizado ${formatDateTime(lastUpdated.toISOString())}`
                    : "Cargando..."}
                </span>
              </div>
            </div>

            <div className="topbar-right">
              <ThemeToggle compact />
              <button
                className="ghost-button"
                onClick={() => void loadDashboard()}
                type="button"
              >
                {isRefreshing ? "Actualizando..." : "Actualizar"}
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
                Salir
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
                activeMailboxIds,
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
