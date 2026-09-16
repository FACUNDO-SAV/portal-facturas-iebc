import { login } from "./actions";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--topbar-bg)",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "380px",
          background: "var(--surface)",
          borderRadius: "14px",
          padding: "36px 32px",
          boxShadow: "0 24px 60px oklch(0% 0 0 / 0.35)",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "6px" }}>
          <span style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-0.02em", color: "var(--text)" }}>
            <span style={{ color: "var(--accent)" }}>i</span>EBC
          </span>
        </div>
        <div style={{ fontSize: "13px", color: "var(--text-tertiary)", marginBottom: "28px" }}>
          Portal de Facturas
        </div>

        <form action={login} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <div>
            <label className="field-label" htmlFor="password">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoFocus
              className="ctrl"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div
              style={{
                fontSize: "12.5px",
                color: "var(--danger)",
                background: "var(--danger-soft)",
                borderRadius: "8px",
                padding: "9px 12px",
              }}
            >
              Contraseña incorrecta. Probá de nuevo.
            </div>
          )}

          <button type="submit" className="btn btn-primary" style={{ marginTop: "6px", padding: "11px" }}>
            Ingresar
          </button>
        </form>
      </div>
    </div>
  );
}
