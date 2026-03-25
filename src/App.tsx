import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./components/AppLayout";
import { AuthProvider, useAuth } from "./lib/auth";
import DashboardPage from "./pages/DashboardPage";
import ClientPage from "./pages/ClientPage";
import DismissedPage from "./pages/DismissedPage";
import LoginPage from "./pages/LoginPage";
import "./styles.css";

function AppRouter() {
  const { hasEnv, isLoading, session } = useAuth();

  if (isLoading) {
    return <BootSplash />;
  }

  return (
    <Routes>
      <Route path="/login" element={session ? <Navigate replace to="/" /> : <LoginPage />} />

      {session ? (
        <Route element={<AppLayout />}>
          <Route index element={<DashboardPage />} />
          <Route path="/clients/:clientId" element={<ClientPage />} />
          <Route path="/dismissed" element={<DismissedPage />} />
          <Route path="*" element={<Navigate replace to="/" />} />
        </Route>
      ) : (
        <Route
          path="*"
          element={<LoginPage envMissing={!hasEnv} />}
        />
      )}
    </Routes>
  );
}

function BootSplash() {
  return (
    <div className="auth-shell">
      <div className="auth-card loading-card">
        <p className="eyebrow">DecadaHUB</p>
        <h2 className="auth-title">Preparant la sessió...</h2>
        <div className="skeleton-block tall" />
      </div>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
