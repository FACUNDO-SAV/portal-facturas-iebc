export function FilterBar({
  action,
  search,
  estado,
  estadoOptions,
  destino,
  showDestinoFilter = false,
  newButtonLabel = "Nueva factura",
}: {
  action: string;
  search?: string;
  estado?: string;
  estadoOptions: string[];
  destino?: string;
  showDestinoFilter?: boolean;
  newButtonLabel?: string;
}) {
  return (
    <form
      action={action}
      method="get"
      style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}
    >
      <div className="search-box" style={{ flex: 1, maxWidth: "320px" }}>
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" style={{ color: "var(--text-tertiary)", flex: "none" }}>
          <circle cx="9" cy="9" r="6" />
          <line x1="17" y1="17" x2="13.4" y2="13.4" />
        </svg>
        <input
          type="text"
          name="q"
          defaultValue={search}
          placeholder="Buscar por proveedor o CUIT"
          style={{ border: "none", outline: "none", background: "transparent", fontSize: "13px", width: "100%", color: "var(--text)" }}
        />
      </div>

      <select name="estado" defaultValue={estado ?? ""} className="dropdown">
        <option value="">Estado: Todos</option>
        {estadoOptions.map((e) => (
          <option key={e} value={e}>
            {e}
          </option>
        ))}
      </select>

      {showDestinoFilter && (
        <select name="destino" defaultValue={destino ?? ""} className="dropdown">
          <option value="">Destino: Todos</option>
          <option value="intranet">Intranet</option>
          <option value="softland">Softland</option>
          <option value="para_revisar">Para revisar</option>
          <option value="no_factura">No factura</option>
        </select>
      )}

      <button type="submit" className="btn btn-ghost">
        Filtrar
      </button>

      <div style={{ flex: 1 }} />

      <button type="button" className="btn btn-primary" disabled title="Próximamente">
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="10" y1="4" x2="10" y2="16" />
          <line x1="4" y1="10" x2="16" y2="10" />
        </svg>
        {newButtonLabel}
      </button>
    </form>
  );
}
