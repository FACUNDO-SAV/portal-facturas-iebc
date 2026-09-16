import Link from "next/link";
import { getNavCounts } from "@/lib/facturas";
import { logout } from "@/app/login/actions";
import { NavItem } from "./_components/NavItem";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const counts = await getNavCounts();
  const today = new Intl.DateTimeFormat("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
      <div
        style={{
          height: "64px",
          flex: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 32px",
          background: "var(--topbar-bg)",
          borderBottom: "1px solid var(--topbar-border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
          <Link href="/dashboard" style={{ fontSize: "20px", fontWeight: 800, letterSpacing: "-0.02em", color: "white" }}>
            <span style={{ color: "var(--accent-bright)" }}>i</span>EBC
          </Link>
          <span style={{ width: "1px", height: "14px", background: "var(--topbar-border)" }} />
          <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--topbar-text-dim)" }}>
            Portal de Facturas
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <span style={{ fontSize: "13px", color: "var(--topbar-text-dim)", textTransform: "capitalize" }}>{today}</span>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "999px",
                background: "oklch(28% 0.04 264)",
                color: "var(--accent-bright)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: "12px",
              }}
            >
              FS
            </div>
            <span style={{ fontSize: "13px", fontWeight: 500, color: "white" }}>Facundo Saavedra</span>
            <form action={logout}>
              <button
                type="submit"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--topbar-text-dim)",
                  fontSize: "12px",
                  cursor: "pointer",
                  padding: "4px 8px",
                }}
              >
                Salir
              </button>
            </form>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: "flex" }}>
        <div
          style={{
            width: "208px",
            flex: "none",
            background: "var(--surface)",
            borderRight: "1px solid var(--border)",
            padding: "16px 12px",
            display: "flex",
            flexDirection: "column",
            gap: "2px",
          }}
        >
          <NavItem
            href="/dashboard"
            label="Dashboard"
            icon={
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7">
                <rect x="3" y="3" width="6" height="6" rx="1.2" />
                <rect x="11" y="3" width="6" height="6" rx="1.2" />
                <rect x="3" y="11" width="6" height="6" rx="1.2" />
                <rect x="11" y="11" width="6" height="6" rx="1.2" />
              </svg>
            }
          />
          <NavItem
            href="/intranet"
            label="Intranet"
            count={counts.intranet}
            icon={
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7">
                <rect x="3" y="4" width="14" height="10" rx="1.2" />
                <line x1="7" y1="17" x2="13" y2="17" />
                <line x1="10" y1="14" x2="10" y2="17" />
              </svg>
            }
          />
          <NavItem
            href="/softland"
            label="Softland"
            count={counts.softland}
            icon={
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7">
                <ellipse cx="10" cy="5" rx="6" ry="2.2" />
                <path d="M4 5v10c0 1.2 2.7 2.2 6 2.2s6-1 6-2.2V5" />
                <path d="M4 10c0 1.2 2.7 2.2 6 2.2s6-1 6-2.2" />
              </svg>
            }
          />
          <NavItem
            href="/para-revisar"
            label="Para revisar"
            count={counts.paraRevisar}
            danger
            icon={
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.7">
                <path d="M10 3.2 17.5 16H2.5z" strokeLinejoin="round" />
                <line x1="10" y1="8.3" x2="10" y2="11.6" />
                <circle cx="10" cy="13.6" r="0.15" strokeWidth="1.9" />
              </svg>
            }
          />
        </div>

        <div style={{ flex: 1, padding: "24px 32px 40px", display: "flex", flexDirection: "column", gap: "20px" }}>
          {children}
        </div>
      </div>
    </div>
  );
}
