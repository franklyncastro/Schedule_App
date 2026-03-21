import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { DOCTOR, CONFIG } from "../../constants.js";
import styles from "./ConfirmPage.module.css";

export default function ConfirmPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const action = params.get("action");

  const [cita, setCita] = useState(null);
  const [status, setStatus] = useState("loading");

  useEffect(() => {
    const fetchCita = async () => {
      // ── GOOGLE SHEETS ──────────────────────────────────────────────────
      if (CONFIG.SHEETS_SCRIPT_URL) {
        try {
          // Si hay acción (confirm/cancel) la ejecutamos directo
          // Si no hay acción, solo buscamos la cita
          const sheetAction =
            action === "confirm" || action === "cancel" ? action : "find";
          const url = `${CONFIG.SHEETS_SCRIPT_URL}?action=${sheetAction}&id=${id}`;
          const res = await fetch(url);
          const data = await res.json();

          // Cita no encontrada en Sheets
          if (
            data.error === "not_found" ||
            (!data.found && data.ok === undefined)
          ) {
            setStatus("not-found");
            return;
          }

          // Solo buscamos (sin acción) — mostramos detalles
          if (data.found) {
            setCita({
              nombre: data.nombre,
              dateLabel: data.fecha,
              timeLabel: data.hora,
            });
            setStatus("pending");
            return;
          }

          // Confirmada o cancelada exitosamente
          if (data.ok) {
            setCita(
              (prev) => prev || { nombre: "", dateLabel: "", timeLabel: "" },
            );
            setStatus(action === "confirm" ? "confirmed" : "cancelled");
            return;
          }
        } catch (err) {
          console.error("Error buscando cita en Sheets:", err);
          // Si falla Sheets, cae al fallback de localStorage
        }
      }

      // ── FALLBACK: localStorage ─────────────────────────────────────────
      const citas = JSON.parse(localStorage.getItem("citas_demo") || "[]");
      const found = citas.find((c) => c.id === id);

      if (!found) {
        setStatus("not-found");
        return;
      }

      setCita(found);

      if (action === "confirm") {
        const updated = citas.map((c) =>
          c.id === id ? { ...c, status: "confirmada" } : c,
        );
        localStorage.setItem("citas_demo", JSON.stringify(updated));
        setStatus("confirmed");
      } else if (action === "cancel") {
        const updated = citas.map((c) =>
          c.id === id ? { ...c, status: "cancelada" } : c,
        );
        localStorage.setItem("citas_demo", JSON.stringify(updated));
        setStatus("cancelled");
      } else {
        setStatus("pending");
      }
    };

    fetchCita();
  }, [id, action]);

  // ── EL RESTO DEL JSX QUEDA EXACTAMENTE IGUAL ───────────────────────────
  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLogo}>🫁</div>
        <div className={styles.headerName}>{DOCTOR.name}</div>
        <div className={styles.headerSpecialty}>{DOCTOR.specialty}</div>
      </div>

      <div className={styles.container}>
        {status === "loading" && (
          <div className={styles.card}>
            <div className={styles.icon}>⏳</div>
            <p>Procesando...</p>
          </div>
        )}

        {status === "not-found" && (
          <div className={styles.card}>
            <div className={styles.icon}>❓</div>
            <h2 className={styles.title}>Cita no encontrada</h2>
            <p className={styles.msg}>
              No encontramos una cita con este código. Es posible que ya haya
              sido procesada.
            </p>
            <button
              className="btn-secondary"
              onClick={() => navigate("/")}
              style={{ marginTop: "1.5rem" }}
            >
              Ir al inicio
            </button>
          </div>
        )}

        {status === "pending" && cita && (
          <div className={styles.card}>
            <div className={styles.icon}>📅</div>
            <h2 className={styles.title}>Confirmar cita</h2>
            <div className={styles.citaInfo}>
              <p>
                <strong>Paciente:</strong> {cita.nombre}
              </p>
              <p>
                <strong>Fecha:</strong> {cita.dateLabel}
              </p>
              <p>
                <strong>Hora:</strong> {cita.timeLabel}
              </p>
            </div>
            <p className={styles.msg}>¿Confirmas tu asistencia a esta cita?</p>
            <div className={styles.actionBtns}>
              <button
                className="btn-success"
                onClick={() => navigate(`/confirmar/${id}?action=confirm`)}
              >
                ✅ Sí, asistiré
              </button>
              <button
                className={styles.cancelBtn}
                onClick={() => navigate(`/confirmar/${id}?action=cancel`)}
              >
                ❌ No podré asistir
              </button>
            </div>
          </div>
        )}

        {status === "confirmed" && cita && (
          <div className={styles.card}>
            <div className={styles.icon} style={{ color: "#22C55E" }}>
              ✅
            </div>
            <h2 className={styles.title} style={{ color: "#065F46" }}>
              ¡Cita confirmada!
            </h2>
            <div className={styles.citaInfo}>
              <p>
                <strong>Paciente:</strong> {cita.nombre}
              </p>
              <p>
                <strong>Fecha:</strong> {cita.dateLabel}
              </p>
              <p>
                <strong>Hora:</strong> {cita.timeLabel}
              </p>
            </div>
            <div className={styles.confirmMsg}>
              <p>Su cita ha sido confirmada exitosamente.</p>
              <p>
                Por favor llegue unos minutos antes de la hora seleccionada de
                ser posible.
              </p>
              <p className={styles.orderNote}>
                📋 Los pacientes serán atendidos en{" "}
                <strong>orden de llegada</strong> según la fecha agendada.
              </p>
            </div>
            <div className={styles.doctorContact}>
              <p>¿Necesita cancelar? Contáctenos:</p>
              <a
                href={`https://wa.me/${DOCTOR.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className={styles.waLink}
              >
                💬 WhatsApp
              </a>
            </div>
          </div>
        )}

        {status === "cancelled" && (
          <div className={styles.card}>
            <div className={styles.icon} style={{ color: "#EF4444" }}>
              ❌
            </div>
            <h2 className={styles.title} style={{ color: "#991B1B" }}>
              Cita cancelada
            </h2>
            <p className={styles.msg}>
              Su cita ha sido cancelada. Si desea reagendar, puede hacerlo desde
              nuestra página.
            </p>
            <button
              className="btn-primary"
              onClick={() => navigate("/agendar")}
              style={{ marginTop: "1.5rem" }}
            >
              Agendar nueva cita
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
