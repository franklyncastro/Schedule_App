import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { DOCTOR, CONFIG } from "../../constants.js";
import styles from "./AdminPanel.module.css";

// ── HELPERS ───────────────────────────────────────────────────────────────────
const STATUS_LABELS = {
  pendiente: {
    label: "Pendiente",
    color: "#D97706",
    bg: "#FEF3C7",
    border: "#FDE68A",
  },
  confirmada: {
    label: "Confirmada",
    color: "#059669",
    bg: "#D1FAE5",
    border: "#6EE7B7",
  },
  cancelada: {
    label: "Cancelada",
    color: "#DC2626",
    bg: "#FEE2E2",
    border: "#FECACA",
  },
};

function todayISO() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatDateDisplay(iso) {
  if (!iso) return "—";
  const clean = iso.length > 10 ? iso.slice(0, 10) : iso;
  const [y, m, d] = clean.split("-");
  const months = [
    "ene",
    "feb",
    "mar",
    "abr",
    "may",
    "jun",
    "jul",
    "ago",
    "sep",
    "oct",
    "nov",
    "dic",
  ];
  return `${d} ${months[parseInt(m) - 1]} ${y}`;
}
// ── FETCH ─────────────────────────────────────────────────────────────────────
async function fetchCitas() {
  if (!CONFIG.SHEETS_SCRIPT_URL) return getDemoData();
  try {
    const res = await fetch(`${CONFIG.SHEETS_SCRIPT_URL}?action=list`);
    const data = await res.json();
    if (data.citas) return data.citas;
    return getDemoData();
  } catch {
    return getDemoData();
  }
}

function getDemoData() {
  const today = todayISO();
  return [
    {
      id: "1",
      nombre: "María González",
      telefono1: "809-555-0001",
      telefono2: "",
      email: "maria@gmail.com",
      cedula: "001-1234567-8",
      nacimiento: "2018-03-15",
      responsable: "Ana González",
      fecha: today,
      hora: "9:00 AM",
      observaciones: "Primera consulta",
      status: "confirmada",
    },
    {
      id: "2",
      nombre: "Carlos Pérez",
      telefono1: "809-555-0002",
      telefono2: "829-555-0002",
      email: "carlos@gmail.com",
      cedula: "002-2345678-9",
      nacimiento: "2015-07-22",
      responsable: "",
      fecha: today,
      hora: "9:30 AM",
      observaciones: "",
      status: "pendiente",
    },
    {
      id: "3",
      nombre: "Sofía Ramírez",
      telefono1: "809-555-0003",
      telefono2: "",
      email: "",
      cedula: "003-3456789-0",
      nacimiento: "2020-11-05",
      responsable: "Luis Ramírez",
      fecha: today,
      hora: "10:00 AM",
      observaciones: "Asma crónica",
      status: "pendiente",
    },
    {
      id: "4",
      nombre: "Diego Martínez",
      telefono1: "809-555-0004",
      telefono2: "",
      email: "diego@gmail.com",
      cedula: "004-4567890-1",
      nacimiento: "2016-01-30",
      responsable: "",
      fecha: today,
      hora: "10:30 AM",
      observaciones: "",
      status: "cancelada",
    },
    {
      id: "5",
      nombre: "Lucía Fernández",
      telefono1: "809-555-0005",
      telefono2: "",
      email: "lucia@gmail.com",
      cedula: "005-5678901-2",
      nacimiento: "2019-05-18",
      responsable: "Rosa Fdez.",
      fecha: today,
      hora: "11:00 AM",
      observaciones: "Control mensual",
      status: "confirmada",
    },
  ];
}

async function updateStatus(id, newStatus) {
  if (!CONFIG.SHEETS_SCRIPT_URL) return true;
  try {
    const res = await fetch(
      `${CONFIG.SHEETS_SCRIPT_URL}?action=updateStatus&id=${id}&status=${newStatus}`,
    );
    const data = await res.json();
    return data.ok;
  } catch {
    return false;
  }
}

function exportToCSV(citas) {
  if (!citas || citas.length === 0) {
    alert("No hay citas para exportar.");
    return;
  }
  const headers = [
    "Nombre",
    "Teléfono 1",
    "Teléfono 2",
    "Email",
    "Cédula",
    "Nacimiento",
    "Responsable",
    "Fecha",
    "Hora",
    "Observaciones",
    "Estado",
  ];
  const rows = citas.map((c) => [
    c.nombre,
    c.telefono1,
    c.telefono2,
    c.email,
    c.cedula,
    c.nacimiento,
    c.responsable,
    c.fecha,
    c.hora,
    c.observaciones,
    c.status,
  ]);
  const csv = [headers, ...rows]
    .map((r) => r.map((v) => `"${(v || "").replace(/"/g, '""')}"`).join(","))
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `citas_${todayISO()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
export default function AdminPanel() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!sessionStorage.getItem("admin_auth")) navigate("/admin");
  }, [navigate]);

  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fechaFiltro, setFechaFiltro] = useState(todayISO());
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [viewMode, setViewMode] = useState("table"); // 'table' | 'cards'

  const loadCitas = useCallback(async () => {
    setLoading(true);
    const data = await fetchCitas();
    setCitas(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadCitas();
  }, [loadCitas]);

  const citasFiltradas = citas.filter((c) => {
    const fechaCita = c.fecha ? c.fecha.slice(0, 10) : "";
    const matchFecha = fechaFiltro ? fechaCita === fechaFiltro : true;
    const matchStatus =
      statusFiltro === "todos" ? true : c.status === statusFiltro;
    return matchFecha && matchStatus;
  });

  const citasHoy = citas.filter(
    (c) => (c.fecha || "").slice(0, 10) === todayISO(),
  );
  const confirmadas = citasHoy.filter((c) => c.status === "confirmada").length;
  const pendientes = citasHoy.filter((c) => c.status === "pendiente").length;
  const canceladas = citasHoy.filter((c) => c.status === "cancelada").length;

  const handleStatusChange = async (cita, newStatus) => {
    setUpdating(cita.id);
    const ok = await updateStatus(cita.id, newStatus);
    if (ok) {
      setCitas((prev) =>
        prev.map((c) => (c.id === cita.id ? { ...c, status: newStatus } : c)),
      );
      if (selected?.id === cita.id)
        setSelected((prev) => ({ ...prev, status: newStatus }));
    }
    setUpdating(null);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_auth");
    navigate("/admin");
  };

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerLogo}>
            <div className={styles.logoIcon}>
              <i className="fa-solid fa-users-gear"></i>
            </div>
            <div>
              <div className={styles.logoTitle}>MediCita Admin</div>
              <div className={styles.logoSub}>{DOCTOR.name}</div>
            </div>
          </div>
        </div>
        <div className={styles.headerRight}>
          {/* Toggle vista — solo visible en desktop */}
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewBtn} ${viewMode === "table" ? styles.viewBtnActive : ""}`}
              onClick={() => setViewMode("table")}
              title="Vista tabla"
            >
              <i className="fa-regular fa-chart-bar"></i> Tabla
            </button>
            <button
              className={`${styles.viewBtn} ${viewMode === "cards" ? styles.viewBtnActive : ""}`}
              onClick={() => setViewMode("cards")}
              title="Vista cards"
            >
              <i className="fa-solid fa-table"></i> Cards
            </button>
          </div>
          <button
            className={styles.refreshBtn}
            onClick={loadCitas}
            title="Actualizar"
          >
            <i className="fa-solid fa-arrows-rotate"></i>
          </button>
          <button
            className={styles.exportBtn}
            onClick={() => exportToCSV(citasFiltradas)}
            disabled={citasFiltradas.length === 0}
          >
            <i className="fa-solid fa-download"></i> Exportar
          </button>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <i className="fa-solid fa-arrow-right-from-bracket"></i> Cerrar
            sesión
          </button>
        </div>
      </header>

      <div className={styles.body}>
        {/* STATS */}
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <div className={styles.statNum}>{citasHoy.length}</div>
            <div className={styles.statLabel}>Citas hoy</div>
          </div>
          <div className={`${styles.statCard} ${styles.statGreen}`}>
            <div className={styles.statNum}>{confirmadas}</div>
            <div className={styles.statLabel}>Confirmadas</div>
          </div>
          <div className={`${styles.statCard} ${styles.statAmber}`}>
            <div className={styles.statNum}>{pendientes}</div>
            <div className={styles.statLabel}>Pendientes</div>
          </div>
          <div className={`${styles.statCard} ${styles.statRed}`}>
            <div className={styles.statNum}>{canceladas}</div>
            <div className={styles.statLabel}>Canceladas</div>
          </div>
        </div>

        {/* FILTROS */}
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <i className="fa-regular fa-calendar-days"></i> Fecha
            </label>
            <input
              type="date"
              className={styles.filterInput}
              value={fechaFiltro}
              onChange={(e) => setFechaFiltro(e.target.value)}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>
              <i className="fa-solid fa-chart-gantt"></i> Estado
            </label>
            <select
              className={styles.filterInput}
              value={statusFiltro}
              onChange={(e) => setStatusFiltro(e.target.value)}
            >
              <option value="todos">Todos</option>
              <option value="pendiente">Pendiente</option>
              <option value="confirmada">Confirmada</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
          {/* <button
            className={styles.clearBtn}
            onClick={() => {
              setFechaFiltro("");
              setStatusFiltro("todos");
            }}
          >
            <i className="fa-solid fa-filter-circle-xmark"></i> Limpiar
          </button> */}

          <button
            className={`${styles.clearBtn} ${statusFiltro !== "todos" || fechaFiltro !== "" ? styles.clearBtnActive : ""}`}
            onClick={() => {
              setFechaFiltro("");
              setStatusFiltro("todos");
            }}
          >
            {statusFiltro !== "todos" || fechaFiltro !== ""
              ? "🔴 Filtro activo — Limpiar"
              : "Limpiar"}
          </button>

          <div className={styles.filterCount}>
            {citasFiltradas.length} cita{citasFiltradas.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* CONTENIDO */}
        {loading ? (
          <div className={styles.loadingWrap}>
            <div className={styles.spinner} />
            <p>
              {" "}
              <i className="fa-solid fa-spinner"></i> Cargando citas...
            </p>
          </div>
        ) : citasFiltradas.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>📭</div>
            <p> No hay citas para los filtros seleccionados.</p>
            <button
              className={styles.clearBtn}
              onClick={() => {
                setFechaFiltro(todayISO());
                setStatusFiltro("todos");
              }}
            >
              Ver citas de hoy
            </button>
          </div>
        ) : (
          <>
            {/* TABLA — desktop por defecto, oculta en móvil */}
            <div
              className={`${styles.tableWrap} ${viewMode === "cards" ? styles.hidden : ""}`}
            >
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Hora</th>
                    <th>Nombre</th>
                    <th>Cédula</th>
                    <th>Teléfono</th>
                    <th>Fecha</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {citasFiltradas.map((cita) => (
                    <TableRow
                      key={cita.id}
                      cita={cita}
                      updating={updating === cita.id}
                      onSelect={() => setSelected(cita)}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* CARDS — visible cuando se elige cards en desktop, siempre en móvil */}
            <div
              className={`${styles.grid} ${viewMode === "table" ? styles.desktopHidden : ""}`}
            >
              {citasFiltradas.map((cita) => (
                <CitaCard
                  key={cita.id}
                  cita={cita}
                  updating={updating === cita.id}
                  onSelect={() => setSelected(cita)}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* MODAL DETALLE */}
      {selected && (
        <DetailModal
          cita={selected}
          updating={updating === selected.id}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}

// ── FILA DE TABLA ─────────────────────────────────────────────────────────────
function TableRow({ cita, updating, onSelect, onStatusChange }) {
  const s = STATUS_LABELS[cita.status] || STATUS_LABELS.pendiente;
  return (
    <tr className={styles.tableRow} onClick={onSelect}>
      <td className={styles.tdHora}>{cita.hora}</td>
      <td className={styles.tdNombre}>{cita.nombre}</td>
      <td className={styles.tdMeta}>{cita.cedula}</td>
      <td className={styles.tdMeta}>{cita.telefono1}</td>
      <td className={styles.tdMeta}>{formatDateDisplay(cita.fecha)}</td>
      <td>
        <span
          className={styles.statusBadge}
          style={{
            color: s.color,
            background: s.bg,
            border: `1px solid ${s.border}`,
          }}
        >
          {s.label}
        </span>
      </td>
      <td onClick={(e) => e.stopPropagation()}>
        <div className={styles.tableActions}>
          {cita.status !== "confirmada" && (
            <button
              className={`${styles.actionBtn} ${styles.actionConfirm}`}
              disabled={updating}
              onClick={() => onStatusChange(cita, "confirmada")}
            >
              ✅
            </button>
          )}
          {cita.status !== "cancelada" && (
            <button
              className={`${styles.actionBtn} ${styles.actionCancel}`}
              disabled={updating}
              onClick={() => onStatusChange(cita, "cancelada")}
            >
              ❌
            </button>
          )}
          {cita.status !== "pendiente" && (
            <button
              className={`${styles.actionBtn} ${styles.actionPending}`}
              disabled={updating}
              onClick={() => onStatusChange(cita, "pendiente")}
            >
              <i className="fa-solid fa-arrows-rotate"></i>
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ── TARJETA ───────────────────────────────────────────────────────────────────
function CitaCard({ cita, updating, onSelect, onStatusChange }) {
  const s = STATUS_LABELS[cita.status] || STATUS_LABELS.pendiente;
  return (
    <div className={styles.citaCard} onClick={onSelect}>
      <div className={styles.citaCardTop}>
        <div className={styles.citaHora}>{cita.hora}</div>
        <span
          className={styles.statusBadge}
          style={{
            color: s.color,
            background: s.bg,
            border: `1px solid ${s.border}`,
          }}
        >
          {s.label}
        </span>
      </div>
      <div className={styles.citaNombre}>{cita.nombre}</div>
      <div className={styles.citaFecha}>📅 {formatDateDisplay(cita.fecha)}</div>
      {cita.cedula && <div className={styles.citaMeta}><i class="fa-regular fa-address-card"></i> {cita.cedula}</div>}
      {cita.telefono1 && (
        <div className={styles.citaMeta}>📞 {cita.telefono1}</div>
      )}
      {cita.observaciones && (
        <div className={styles.citaObs}>💬 {cita.observaciones}</div>
      )}
      <div className={styles.citaActions} onClick={(e) => e.stopPropagation()}>
        {cita.status !== "confirmada" && (
          <button
            className={`${styles.actionBtn} ${styles.actionConfirm}`}
            disabled={updating}
            onClick={() => onStatusChange(cita, "confirmada")}
          >
            ✅ Confirmar
          </button>
        )}
        {cita.status !== "cancelada" && (
          <button
            className={`${styles.actionBtn} ${styles.actionCancel}`}
            disabled={updating}
            onClick={() => onStatusChange(cita, "cancelada")}
          >
            ❌ Cancelar
          </button>
        )}
        {cita.status !== "pendiente" && (
          <button
            className={`${styles.actionBtn} ${styles.actionPending}`}
            disabled={updating}
            onClick={() => onStatusChange(cita, "pendiente")}
          >
            🔄 Pendiente
          </button>
        )}
      </div>
    </div>
  );
}

// ── MODAL DETALLE ─────────────────────────────────────────────────────────────
function DetailModal({ cita, updating, onClose, onStatusChange }) {
  const s = STATUS_LABELS[cita.status] || STATUS_LABELS.pendiente;

  useEffect(() => {
    const fn = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  const fields = [
    { label: "Nombre completo", value: cita.nombre },
    { label: "Cédula", value: cita.cedula },
    { label: "Fecha de nacimiento", value: formatDateDisplay(cita.nacimiento) },
    { label: "Teléfono principal", value: cita.telefono1 },
    { label: "Teléfono alternativo", value: cita.telefono2 || "—" },
    { label: "Email", value: cita.email || "—" },
    { label: "Responsable", value: cita.responsable || "—" },
    { label: "Fecha de cita", value: formatDateDisplay(cita.fecha) },
    { label: "Hora", value: cita.hora },
    { label: "Observaciones", value: cita.observaciones || "—" },
  ];

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <div>
            <div className={styles.modalTitle}>{cita.nombre}</div>
            <span
              className={styles.statusBadge}
              style={{
                color: s.color,
                background: s.bg,
                border: `1px solid ${s.border}`,
              }}
            >
              {s.label}
            </span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>
        <div className={styles.modalBody}>
          <div className={styles.detailGrid}>
            {fields.map((f, i) => (
              <div key={i} className={styles.detailItem}>
                <div className={styles.detailLabel}>{f.label}</div>
                <div className={styles.detailValue}>{f.value}</div>
              </div>
            ))}
          </div>
        </div>
        <div className={styles.modalFooter}>
          <div className={styles.modalActions}>
            {cita.status !== "confirmada" && (
              <button
                className={`${styles.actionBtn} ${styles.actionConfirm}`}
                disabled={updating}
                onClick={() => onStatusChange(cita, "confirmada")}
              >
                ✅ Confirmar
              </button>
            )}
            {cita.status !== "cancelada" && (
              <button
                className={`${styles.actionBtn} ${styles.actionCancel}`}
                disabled={updating}
                onClick={() => onStatusChange(cita, "cancelada")}
              >
                ❌ Cancelar
              </button>
            )}
            {cita.status !== "pendiente" && (
              <button
                className={`${styles.actionBtn} ${styles.actionPending}`}
                disabled={updating}
                onClick={() => onStatusChange(cita, "pendiente")}
              >
                🔄 Pendiente
              </button>
            )}
          </div>
          {cita.telefono1 && (
            <a
              href={`https://wa.me/${String(cita.telefono1 || "").replace(/\D/g, "")}`}
              target="_blank"
              rel="noreferrer"
              className={styles.waBtn}
            >
              💬 WhatsApp
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
