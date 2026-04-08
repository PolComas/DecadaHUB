import { useState } from "react";
import { useAuth } from "../lib/auth";

type LoginView = "login" | "forgot";

export default function LoginPage({ envMissing = false }: { envMissing?: boolean }) {
  const { signIn, resetPassword } = useAuth();
  const [view, setView] = useState<LoginView>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function switchView(next: LoginView) {
    setView(next);
    setFeedback(null);
    setErrorMessage(null);
    setPassword("");
  }

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setFeedback(null);

    try {
      await signIn(email, password);
    } catch (error) {
      setErrorMessage(toMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleForgotPassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setFeedback(null);

    try {
      await resetPassword(email);
      setFeedback(
        "Si el correo existe, recibirás un enlace para restablecer la contraseña. Revisa la bandeja de entrada.",
      );
    } catch (error) {
      setErrorMessage(toMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-mark">D</div>
          <span className="auth-brand-name">DecadaHUB</span>
        </div>

        {view === "login" ? (
          <>
            <h2 className="auth-title">Bienvenido/a</h2>
            <p className="auth-copy">
              Accede al hub interno de comunicación con clientes.
            </p>

            {envMissing ? (
              <div className="callout error" style={{ marginTop: 20 }}>
                <strong>Falta configurar Supabase.</strong>
                <p>
                  Revisa <code>VITE_SUPABASE_URL</code> y{" "}
                  <code>VITE_SUPABASE_ANON_KEY</code> en el archivo <code>.env</code>.
                </p>
              </div>
            ) : (
              <form className="auth-form" onSubmit={handleLogin}>
                <div className="form-group">
                  <label htmlFor="email">Correo electrónico</label>
                  <input
                    autoComplete="email"
                    id="email"
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nombre@empresa.com"
                    required
                    type="email"
                    value={email}
                  />
                </div>
                <div className="form-group">
                  <div className="label-row">
                    <label htmlFor="password">Contraseña</label>
                    <button
                      className="text-link"
                      onClick={() => switchView("forgot")}
                      type="button"
                    >
                      ¿Has olvidado la contraseña?
                    </button>
                  </div>
                  <input
                    autoComplete="current-password"
                    id="password"
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Introduce la contraseña"
                    required
                    type="password"
                    value={password}
                  />
                </div>
                <button
                  className="auth-submit"
                  disabled={isSubmitting}
                  type="submit"
                >
                  {isSubmitting ? "Accediendo..." : "Acceder"}
                </button>
              </form>
            )}
          </>
        ) : (
          <>
            <h2 className="auth-title">Restablecer contraseña</h2>
            <p className="auth-copy">
              Introduce tu correo electrónico y te enviaremos un enlace para crear una nueva
              contraseña.
            </p>

            <form className="auth-form" onSubmit={handleForgotPassword}>
              <div className="form-group">
                <label htmlFor="reset-email">Correo electrónico</label>
                <input
                  autoComplete="email"
                  id="reset-email"
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre@empresa.com"
                  required
                  type="email"
                  value={email}
                />
              </div>
              <button
                className="auth-submit"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Enviando..." : "Enviar enlace"}
              </button>
            </form>

            <button
              className="text-link auth-back"
              onClick={() => switchView("login")}
              type="button"
            >
              Volver al inicio de sesión
            </button>
          </>
        )}

        {feedback ? (
          <div className="callout success" style={{ marginTop: 16 }}>
            {feedback}
          </div>
        ) : null}
        {errorMessage ? (
          <div className="callout error" style={{ marginTop: 16 }}>
            {errorMessage}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function toMessage(error: unknown) {
  if (error instanceof Error) {
    const msg = error.message;
    if (msg.includes("Invalid login credentials")) {
      return "Correo electrónico o contraseña incorrectos.";
    }
    if (msg.includes("Email not confirmed")) {
      return "Tu correo electrónico aún no ha sido confirmado.";
    }
    return msg;
  }

  return "Se ha producido un error inesperado.";
}
