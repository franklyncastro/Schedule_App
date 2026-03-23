import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { DOCTOR, CONFIG, SCHEDULE, SLOT_INTERVAL } from "../../constants.js";
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

const MONTH_NAMES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];
const DAY_NAMES_FULL = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

function todayISO() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function tomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatDateDisplay(iso) {
  if (!iso) return "—";
  const clean = iso.length > 10 ? iso.slice(0, 10) : iso;
  const [y, m, d] = clean.split("-");
  return `${d} ${MONTH_NAMES[parseInt(m) - 1]} ${y}`;
}

function minutesToTime(m) {
  const h24 = Math.floor(m / 60),
    min = (m % 60).toString().padStart(2, "0");
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h12}:${min} ${h24 >= 12 ? "PM" : "AM"}`;
}

// convertir el texto de la hora en minutos totales del día.
function timeToMinutes(timeStr) {
  if (!timeStr) return 0;
  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);

  if (hours === 12) hours = 0; // Tratar 12 AM/PM como 0 para el cálculo
  if (modifier === "PM") hours += 12;

  return hours * 60 + minutes;
}

function getAvailableSlots(dateISO) {
  const date = new Date(dateISO + "T12:00:00");
  const dow = date.getDay();
  const s = SCHEDULE[dow];
  if (!s) return [];
  const slots = [];
  for (let m = s.start; m < s.end; m += SLOT_INTERVAL)
    slots.push(minutesToTime(m));
  return slots;
}

// ── API CALLS ─────────────────────────────────────────────────────────────────
async function fetchCitas() {
  if (!CONFIG.SHEETS_SCRIPT_URL) return getDemoData();
  try {
    const res = await fetch(`${CONFIG.SHEETS_SCRIPT_URL}?action=list`);
    const data = await res.json();
    return data.citas || getDemoData();
  } catch {
    return getDemoData();
  }
}

async function updateStatus(id, newStatus) {
  if (!CONFIG.SHEETS_SCRIPT_URL) return true;
  try {
    const res = await fetch(
      `${CONFIG.SHEETS_SCRIPT_URL}?action=updateStatus&id=${id}&status=${newStatus}`,
    );
    return (await res.json()).ok;
  } catch {
    return false;
  }
}

async function editCita(id, fields) {
  if (!CONFIG.SHEETS_SCRIPT_URL) return true;
  try {
    const params = new URLSearchParams({ action: "edit", id, ...fields });
    const res = await fetch(`${CONFIG.SHEETS_SCRIPT_URL}?${params.toString()}`);
    return (await res.json()).ok;
  } catch {
    return false;
  }
}

async function getOccupiedSlotsForDate(fecha) {
  if (!CONFIG.SHEETS_SCRIPT_URL) return [];
  try {
    const res = await fetch(
      `${CONFIG.SHEETS_SCRIPT_URL}?action=slots&fecha=${fecha}`,
    );
    return (await res.json()).ocupados || [];
  } catch {
    return [];
  }
}

function exportToCSV(citas) {
  if (!citas?.length) {
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
    "ID",
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
    c.id,
  ]);
  const csv = [headers, ...rows]
    .map((r) =>
      r.map((v) => `"${String(v || "").replace(/"/g, '""')}"`).join(","),
    )
    .join("\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `citas_${todayISO()}.csv`;
  a.click();
}

function getDemoData() {
  const today = todayISO(),
    tomorrow = tomorrowISO();
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
      telefono2: "",
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
      fecha: tomorrow,
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
      fecha: tomorrow,
      hora: "11:00 AM",
      observaciones: "Control mensual",
      status: "confirmada",
    },
  ];
}

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
export default function AdminPanel() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!sessionStorage.getItem("admin_auth")) navigate("/admin");
  }, [navigate]);

  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fechaFiltro, setFechaFiltro] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("todos");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [viewMode, setViewMode] = useState("table");
  const searchRef = useRef(null);

  const loadCitas = useCallback(async () => {
    setLoading(true);
    setCitas(await fetchCitas());
    setLoading(false);
  }, []);
  useEffect(() => {
    loadCitas();
  }, [loadCitas]);

  // Búsqueda universal
  const searchLower = search.toLowerCase().trim();
  const citasFiltradas = citas
    .filter((c) => {
      const fechaCita = (c.fecha || "").slice(0, 10);
      const matchFecha = fechaFiltro ? fechaCita === fechaFiltro : true;
      const matchStatus =
        statusFiltro === "todos" ? true : c.status === statusFiltro;
      const matchSearch = !searchLower
        ? true
        : String(c.nombre || "")
            .toLowerCase()
            .includes(searchLower) ||
          String(c.email || "")
            .toLowerCase()
            .includes(searchLower) ||
          String(c.cedula || "").includes(searchLower) ||
          String(c.telefono1 || "").includes(searchLower) ||
          String(c.telefono2 || "").includes(searchLower) ||
          String(c.id || "").includes(searchLower) ||
          String(c.hora || "")
            .toLowerCase()
            .includes(searchLower) ||
          String(c.responsable || "")
            .toLowerCase()
            .includes(searchLower);
      return matchFecha && matchStatus && matchSearch;
    })
    .sort((a, b) => {
      // Primero ordenamos por fecha (por si hay varias fechas mezcladas)
      if (a.fecha !== b.fecha) return a.fecha.localeCompare(b.fecha);
      // Luego ordenamos por hora usando la función timeToMinutes
      return timeToMinutes(a.hora) - timeToMinutes(b.hora);
    });

  // Stats basadas en lo filtrado
  const total = citasFiltradas.length;
  const confirmadas = citasFiltradas.filter(
    (c) => c.status === "confirmada",
  ).length;
  const pendientes = citasFiltradas.filter(
    (c) => c.status === "pendiente",
  ).length;
  const canceladas = citasFiltradas.filter(
    (c) => c.status === "cancelada",
  ).length;

  // Citas de hoy y mañana para badges
  const citasHoyCount = citas.filter(
    (c) => (c.fecha || "").slice(0, 10) === todayISO(),
  ).length;
  const citasMañanaCount = citas.filter(
    (c) => (c.fecha || "").slice(0, 10) === tomorrowISO(),
  ).length;

  const handleStatusChange = async (cita, newStatus) => {
    setUpdating(cita.id);
    if (await updateStatus(cita.id, newStatus)) {
      setCitas((prev) =>
        prev.map((c) => (c.id === cita.id ? { ...c, status: newStatus } : c)),
      );
      if (selected?.id === cita.id)
        setSelected((prev) => ({ ...prev, status: newStatus }));
    }
    setUpdating(null);
  };

  const handleEdit = async (cita, fields) => {
    setUpdating(cita.id);
    if (await editCita(cita.id, fields)) {
      const updated = { ...cita, ...fields };
      setCitas((prev) => prev.map((c) => (c.id === cita.id ? updated : c)));
      setSelected(updated);
    }
    setUpdating(null);
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_auth");
    navigate("/admin");
  };

  const hasActiveFilter =
    statusFiltro !== "todos" || fechaFiltro !== "" || search !== "";

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.headerLogo}>
            <div className={styles.logoIcon}>
              <i className="fa-solid fa-users-gear"></i>{" "}
            </div>
            <div>
              <div className={styles.logoTitle}>MediCita Admin</div>
              <div className={styles.logoSub}>{DOCTOR.name}</div>
            </div>
          </div>
          {/* Badges hoy/mañana */}
          <div className={styles.dayBadges}>
            <button
              className={styles.dayBadge}
              onClick={() => {
                setFechaFiltro(todayISO());
                setSearch("");
              }}
            >
              📅 Hoy <span className={styles.dayBadgeNum}>{citasHoyCount}</span>
            </button>
            <button
              className={styles.dayBadge}
              onClick={() => {
                setFechaFiltro(tomorrowISO());
                setSearch("");
              }}
            >
              📆 Mañana{" "}
              <span className={styles.dayBadgeNum}>{citasMañanaCount}</span>
            </button>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.viewToggle}>
            <button
              className={`${styles.viewBtn} ${viewMode === "table" ? styles.viewBtnActive : ""}`}
              onClick={() => setViewMode("table")}
            >
              <i className="fa-solid fa-align-justify"></i> Tabla
            </button>
            <button
              className={`${styles.viewBtn} ${viewMode === "cards" ? styles.viewBtnActive : ""}`}
              onClick={() => setViewMode("cards")}
            >
              <i className="fa-regular fa-calendar-minus"></i> Cards
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
            disabled={!citasFiltradas.length}
          >
            <i className="fa-solid fa-download"></i> Exportar
          </button>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <i className="fa-solid fa-right-from-bracket"></i> Cerrar sesión
          </button>
        </div>
      </header>

      <div className={styles.body}>
        {/* STATS */}
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <div className={styles.statNum}>{total}</div>
            <div className={styles.statLabel}>Total</div>
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

        {/* BUSCADOR */}
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>
            <i className="fa-solid fa-magnifying-glass"></i>{" "}
          </span>
          <input
            ref={searchRef}
            className={styles.searchInput}
            placeholder="Buscar por nombre, cédula, teléfono, email, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              className={styles.searchClear}
              onClick={() => {
                setSearch("");
                searchRef.current?.focus();
              }}
            >
              ✕
            </button>
          )}
        </div>

        {/* FILTROS */}
        <div className={styles.filters}>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>📅 Fecha</label>
            <input
              type="date"
              className={styles.filterInput}
              value={fechaFiltro}
              onChange={(e) => setFechaFiltro(e.target.value)}
            />
          </div>
          <div className={styles.filterGroup}>
            <label className={styles.filterLabel}>Estado</label>
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
          <button
            className={`${styles.clearBtn} ${hasActiveFilter ? styles.clearBtnActive : ""}`}
            onClick={() => {
              setFechaFiltro("");
              setStatusFiltro("todos");
              setSearch("");
            }}
          >
            {hasActiveFilter ? "🔴 Filtro activo — Limpiar" : "Limpiar"}
          </button>
          <div className={styles.filterCount}>
            {citasFiltradas.length} cita{citasFiltradas.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* CONTENIDO */}
        {loading ? (
          <div className={styles.loadingWrap}>
            <div className={styles.spinner} />
            <p>Cargando citas...</p>
          </div>
        ) : citasFiltradas.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>{search ? "🔍" : "📭"}</div>
            <p>
              {search
                ? `No se encontraron resultados para "${search}"`
                : "No hay citas para los filtros seleccionados."}
            </p>
            <button
              className={styles.clearBtn}
              onClick={() => {
                setFechaFiltro("");
                setStatusFiltro("todos");
                setSearch("");
              }}
            >
              Mostrar todas
            </button>
          </div>
        ) : (
          <>
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

      {selected && (
        <DetailModal
          cita={selected}
          updating={updating === selected.id}
          onClose={() => setSelected(null)}
          onStatusChange={handleStatusChange}
          onEdit={handleEdit}
          allCitas={citas}
        />
      )}
    </div>
  );
}

// ── FILA DE TABLA ─────────────────────────────────────────────────────────────
function TableRow({ cita, updating, onSelect, onStatusChange }) {
  const s = STATUS_LABELS[cita.status] || STATUS_LABELS.pendiente;
  const isToday = (cita.fecha || "").slice(0, 10) === todayISO();
  const isTomorrow = (cita.fecha || "").slice(0, 10) === tomorrowISO();
  return (
    <tr
      className={`${styles.tableRow} ${isToday ? styles.rowToday : ""} ${isTomorrow ? styles.rowTomorrow : ""}`}
      onClick={onSelect}
    >
      <td className={styles.tdHora}>{cita.hora}</td>
      <td className={styles.tdNombre}>
        {cita.nombre}
        {isToday && <span className={styles.dayPill}>Hoy</span>}
        {isTomorrow && (
          <span className={`${styles.dayPill} ${styles.dayPillTomorrow}`}>
            Mañana
          </span>
        )}
      </td>
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
              🔄
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
  const isToday = (cita.fecha || "").slice(0, 10) === todayISO();
  const isTomorrow = (cita.fecha || "").slice(0, 10) === tomorrowISO();
  return (
    <div
      className={`${styles.citaCard} ${isToday ? styles.cardToday : ""}`}
      onClick={onSelect}
    >
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
      <div className={styles.citaNombre}>
        {cita.nombre}
        {isToday && <span className={styles.dayPill}>Hoy</span>}
        {isTomorrow && (
          <span className={`${styles.dayPill} ${styles.dayPillTomorrow}`}>
            Mañana
          </span>
        )}
      </div>
      <div className={styles.citaFecha}>📅 {formatDateDisplay(cita.fecha)}</div>
      {cita.cedula && <div className={styles.citaMeta}>🪪 {cita.cedula}</div>}
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
function DetailModal({
  cita,
  updating,
  onClose,
  onStatusChange,
  onEdit,
  allCitas,
}) {
  const s = STATUS_LABELS[cita.status] || STATUS_LABELS.pendiente;
  const [tab, setTab] = useState("info"); // info | edit | reschedule
  const [editForm, setEditForm] = useState({
    nombre: cita.nombre || "",
    telefono1: cita.telefono1 || "",
    telefono2: cita.telefono2 || "",
    email: cita.email || "",
    responsable: cita.responsable || "",
    observaciones: cita.observaciones || "",
  });
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlot, setRescheduleSlot] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [occupiedSlots, setOccupiedSlots] = useState([]);
  const [savingEdit, setSavingEdit] = useState(false);
  const [saveOk, setSaveOk] = useState(false);

  useEffect(() => {
    const fn = (e) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  // Cuando cambia la fecha de reagendamiento
  useEffect(() => {
    if (!rescheduleDate) {
      setAvailableSlots([]);
      setOccupiedSlots([]);
      return;
    }
    const allSlots = getAvailableSlots(rescheduleDate);
    setAvailableSlots(allSlots);
    getOccupiedSlotsForDate(rescheduleDate).then((occ) => {
      // Excluir la cita actual (para no bloquearse a sí misma si es el mismo día)
      const filtered = occ.filter(
        (h) =>
          !(cita.fecha?.slice(0, 10) === rescheduleDate && h === cita.hora),
      );
      setOccupiedSlots(filtered);
    });
  }, [rescheduleDate]);

  const handleSaveEdit = async () => {
    setSavingEdit(true);
    await onEdit(cita, editForm);
    setSaveOk(true);
    setTimeout(() => {
      setSaveOk(false);
      setSavingEdit(false);
    }, 2000);
  };

  const handleReschedule = async () => {
    if (!rescheduleDate || !rescheduleSlot) return;
    setSavingEdit(true);
    await onEdit(cita, { fecha: rescheduleDate, hora: rescheduleSlot });
    setSavingEdit(false);
    setTab("info");
    setRescheduleDate("");
    setRescheduleSlot("");
  };

  // Días disponibles para reagendar (próximos 30 días con horario)
  const availableDays = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  for (let i = 1; i <= 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (SCHEDULE[d.getDay()]) {
      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      availableDays.push({
        iso,
        label: `${DAY_NAMES_FULL[d.getDay()]} ${d.getDate()} de ${MONTH_NAMES[d.getMonth()]}`,
      });
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* MODAL HEADER */}
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
            <span className={styles.modalId}>ID #{cita.id}</span>
          </div>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* TABS */}
        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === "info" ? styles.tabActive : ""}`}
            onClick={() => setTab("info")}
          >
            📋 Información
          </button>
          <button
            className={`${styles.tab} ${tab === "edit" ? styles.tabActive : ""}`}
            onClick={() => setTab("edit")}
          >
            ✏️ Editar
          </button>
          <button
            className={`${styles.tab} ${tab === "reschedule" ? styles.tabActive : ""}`}
            onClick={() => setTab("reschedule")}
          >
            📅 Reagendar
          </button>
        </div>

        <div className={styles.modalBody}>
          {/* TAB INFO */}
          {tab === "info" && (
            <div className={styles.detailGrid}>
              {[
                { label: "Nombre", value: cita.nombre },
                { label: "Cédula", value: cita.cedula },
                {
                  label: "Nacimiento",
                  value: formatDateDisplay(cita.nacimiento),
                },
                { label: "Teléfono 1", value: cita.telefono1 },
                { label: "Teléfono 2", value: cita.telefono2 || "—" },
                { label: "Email", value: cita.email || "—" },
                { label: "Responsable", value: cita.responsable || "—" },
                {
                  label: "Fecha de cita",
                  value: formatDateDisplay(cita.fecha),
                },
                { label: "Hora", value: cita.hora },
                { label: "Observaciones", value: cita.observaciones || "—" },
              ].map((f, i) => (
                <div key={i} className={styles.detailItem}>
                  <div className={styles.detailLabel}>{f.label}</div>
                  <div className={styles.detailValue}>{f.value}</div>
                </div>
              ))}
            </div>
          )}

          {/* TAB EDITAR */}
          {tab === "edit" && (
            <div className={styles.editForm}>
              <p className={styles.editHint}>
                💡 Edita los datos del paciente. Los cambios se guardan en
                Google Sheets.
              </p>
              {[
                { label: "Nombre completo", field: "nombre", type: "text" },
                {
                  label: "Teléfono principal",
                  field: "telefono1",
                  type: "text",
                },
                {
                  label: "Teléfono alternativo",
                  field: "telefono2",
                  type: "text",
                },
                { label: "Email", field: "email", type: "email" },
                { label: "Responsable", field: "responsable", type: "text" },
              ].map(({ label, field, type }) => (
                <div key={field} className={styles.editGroup}>
                  <label className={styles.editLabel}>{label}</label>
                  <input
                    type={type}
                    className={styles.editInput}
                    value={editForm[field]}
                    onChange={(e) =>
                      setEditForm((f) => ({ ...f, [field]: e.target.value }))
                    }
                  />
                </div>
              ))}
              <div className={styles.editGroup}>
                <label className={styles.editLabel}>Observaciones</label>
                <textarea
                  className={styles.editInput}
                  rows={3}
                  style={{ resize: "none" }}
                  value={editForm.observaciones}
                  onChange={(e) =>
                    setEditForm((f) => ({
                      ...f,
                      observaciones: e.target.value,
                    }))
                  }
                />
              </div>
              <button
                className={styles.saveEditBtn}
                onClick={handleSaveEdit}
                disabled={savingEdit}
              >
                {savingEdit
                  ? "⏳ Guardando..."
                  : saveOk
                    ? "✅ ¡Guardado!"
                    : "💾 Guardar cambios"}
              </button>
            </div>
          )}

          {/* TAB REAGENDAR */}
          {tab === "reschedule" && (
            <div className={styles.rescheduleForm}>
              <p className={styles.editHint}>
                📅 Selecciona una nueva fecha y hora para esta cita.
              </p>
              <div className={styles.citaActual}>
                <span className={styles.editLabel}>Cita actual:</span>
                <strong>
                  {formatDateDisplay(cita.fecha)} a las {cita.hora}
                </strong>
              </div>

              <div className={styles.editGroup}>
                <label className={styles.editLabel}>Nueva fecha</label>
                <select
                  className={styles.editInput}
                  value={rescheduleDate}
                  onChange={(e) => {
                    setRescheduleDate(e.target.value);
                    setRescheduleSlot("");
                  }}
                >
                  <option value="">Selecciona una fecha...</option>
                  {availableDays.map((d) => (
                    <option key={d.iso} value={d.iso}>
                      {d.label}
                    </option>
                  ))}
                </select>
              </div>

              {rescheduleDate && (
                <div className={styles.editGroup}>
                  <label className={styles.editLabel}>Nueva hora</label>
                  {availableSlots.length === 0 ? (
                    <p className={styles.noSlotsMsg}>
                      No hay horarios disponibles para este día.
                    </p>
                  ) : (
                    <div className={styles.slotsGrid}>
                      {availableSlots.map((slot) => {
                        const isOccupied = occupiedSlots.includes(slot);
                        return (
                          <button
                            key={slot}
                            className={`${styles.slotBtn} ${rescheduleSlot === slot ? styles.slotSelected : ""} ${isOccupied ? styles.slotOccupied : ""}`}
                            disabled={isOccupied}
                            onClick={() =>
                              !isOccupied && setRescheduleSlot(slot)
                            }
                          >
                            {slot}
                            {isOccupied && (
                              <span className={styles.slotOccupiedTxt}>
                                {" "}
                                Ocupado
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <button
                className={styles.saveEditBtn}
                onClick={handleReschedule}
                disabled={!rescheduleDate || !rescheduleSlot || savingEdit}
              >
                {savingEdit
                  ? "⏳ Reagendando..."
                  : "📅 Confirmar reagendamiento"}
              </button>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
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
