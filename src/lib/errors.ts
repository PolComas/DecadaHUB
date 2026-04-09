export function toMessage(error: unknown): string {
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
