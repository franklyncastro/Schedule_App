import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { DOCTOR, SCHEDULE, SLOT_INTERVAL, DAYS_AHEAD, CONFIG } from '../../constants.js'
import styles from './BookingPage.module.css'

// ── HELPERS ───────────────────────────────────────────────────────────────────
const DAY_NAMES_SHORT = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
const DAY_NAMES_FULL  = ['domingo','lunes','martes','miércoles','jueves','viernes','sábado']
const MONTH_NAMES     = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

function minutesToTime(m) {
  const h24 = Math.floor(m / 60)
  const min = (m % 60).toString().padStart(2, '0')
  const ampm = h24 >= 12 ? 'PM' : 'AM'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${h12}:${min} ${ampm}`
}

function getAvailableDays() {
  const days = []
  const now = new Date()
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const d = new Date(now)
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() + i)
    if (!SCHEDULE[d.getDay()]) continue
    // Verificar que tenga al menos un slot disponible
    const slots = getSlotsForDay(d, now)
    if (slots.length > 0) days.push(d)
  }
  return days
}

function getSlotsForDay(date, now = new Date()) {
  const dow = date.getDay()
  const s = SCHEDULE[dow]
  if (!s) return []

  const slots = []
  for (let m = s.start; m < s.end; m += SLOT_INTERVAL) {
    // Si es hoy, filtrar horas que ya pasaron
    const isToday = date.toDateString() === now.toDateString()
    if (isToday) {
      const nowMinutes = now.getHours() * 60 + now.getMinutes()
      if (m <= nowMinutes) continue // saltar horas pasadas o en curso
    }
    slots.push(m)
  }
  return slots
}

function formatDateLabel(date) {
  return `${DAY_NAMES_FULL[date.getDay()]}, ${date.getDate()} de ${MONTH_NAMES[date.getMonth()]} de ${date.getFullYear()}`
}

// ── SIMULACIÓN GOOGLE SHEETS (reemplazar con llamada real) ────────────────────
async function checkDuplicate(cedula, nombre, email) {
  // Con datos simulados, siempre devuelve false (no hay duplicado)
  // En producción: llamar al Apps Script que lee el Google Sheet
  if (CONFIG.SHEETS_SCRIPT_URL) {
    try {
      const res = await fetch(`${CONFIG.SHEETS_SCRIPT_URL}?action=check&cedula=${cedula}&nombre=${encodeURIComponent(nombre)}&email=${encodeURIComponent(email)}`)
      const data = await res.json()
      return data.duplicate
    } catch { return false }
  }
  return false
}

async function saveCita(cita) {
  // En producción: guardar en Google Sheets via Apps Script
  if (CONFIG.SHEETS_SCRIPT_URL) {
    try {
      await fetch(CONFIG.SHEETS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', ...cita }),
      })
    } catch (e) { console.error('Error guardando cita:', e) }
  }
  // Guardar en localStorage como simulación
  const citas = JSON.parse(localStorage.getItem('citas_demo') || '[]')
  citas.push({ ...cita, id: Date.now().toString(), status: 'pendiente' })
  localStorage.setItem('citas_demo', JSON.stringify(citas))
  return citas[citas.length - 1]
}

// ── PASOS ─────────────────────────────────────────────────────────────────────
const STEP_CALENDAR = 'calendar'
const STEP_FORM     = 'form'
const STEP_SUCCESS  = 'success'

// ── COMPONENTE PRINCIPAL ──────────────────────────────────────────────────────
export default function BookingPage() {
  const navigate = useNavigate()
  const [step, setStep]           = useState(STEP_CALENDAR)
  const [selectedDay, setSelectedDay] = useState(null)
  const [selectedSlot, setSelectedSlot] = useState(null) // minutos
  const [citaId, setCitaId]       = useState(null)

  // Grupos de días disponibles
  const availableDays = getAvailableDays()

  // Agrupar por semana para mostrar en bloques
  const groupedDays = []
  availableDays.forEach(d => {
    const label = `${DAY_NAMES_FULL[d.getDay()]} - ${d.getDate()} de ${MONTH_NAMES[d.getMonth()]}`
    groupedDays.push({ date: d, label })
  })

  const handleSelectSlot = (day, slot) => {
    setSelectedDay(day)
    setSelectedSlot(slot)
    setStep(STEP_FORM)
  }

  const handleFormSuccess = (id) => {
    setCitaId(id)
    setStep(STEP_SUCCESS)
  }

  return (
    <div className={styles.page}>
      {/* HEADER */}
      <div className={styles.header}>
        <button className={styles.backBtn} onClick={() => step === STEP_CALENDAR ? navigate('/') : setStep(STEP_CALENDAR)}>
          ← Volver
        </button>
        <div className={styles.headerInfo}>
          <div className={styles.headerName}>{DOCTOR.name}</div>
          <div className={styles.headerLicense}>{DOCTOR.license}</div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>

        {step === STEP_CALENDAR && (
          <CalendarStep days={groupedDays} onSelectSlot={handleSelectSlot} />
        )}

        {step === STEP_FORM && selectedDay && selectedSlot !== null && (
          <FormStep
            day={selectedDay}
            slot={selectedSlot}
            onBack={() => setStep(STEP_CALENDAR)}
            onSuccess={handleFormSuccess}
          />
        )}

        {step === STEP_SUCCESS && (
          <SuccessStep citaId={citaId} day={selectedDay} slot={selectedSlot} />
        )}

      </div>
    </div>
  )
}

// ── CALENDARIO ────────────────────────────────────────────────────────────────
function CalendarStep({ days, onSelectSlot }) {
  const [currentIdx, setCurrentIdx] = useState(0)
  const current = days[currentIdx]

  if (!current) return (
    <div className={styles.noSlots}>
      <div className={styles.noSlotsIcon}>📅</div>
      <p>No hay disponibilidad en los próximos {DAYS_AHEAD} días.</p>
    </div>
  )

  const slots = getSlotsForDay(current.date, new Date())

  return (
    <div className={styles.calendarCard}>
      <h2 className={styles.calendarTitle}>Selecciona fecha y hora</h2>

      {/* Navegación de días */}
      <div className={styles.dayNav}>
        <button
          className={styles.dayNavBtn}
          onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
          disabled={currentIdx === 0}
        >←</button>
        <div className={styles.dayLabel}>{current.label}</div>
        <button
          className={styles.dayNavBtn}
          onClick={() => setCurrentIdx(i => Math.min(days.length - 1, i + 1))}
          disabled={currentIdx === days.length - 1}
        >→</button>
      </div>

      {/* Slots de horas */}
      <div className={styles.slotsGrid}>
        {slots.map(slot => (
          <button
            key={slot}
            className={styles.slotBtn}
            onClick={() => onSelectSlot(current.date, slot)}
          >
            {minutesToTime(slot)}
          </button>
        ))}
      </div>

      <p className={styles.calendarNote}>
        ℹ️ Los pacientes serán atendidos por orden de llegada según la fecha agendada.
      </p>
    </div>
  )
}

// ── FORMULARIO ────────────────────────────────────────────────────────────────
const INITIAL_FORM = {
  nombre: '', telefono1: '', telefono2: '',
  nacimiento: '', email: '', cedula: '',
  responsable: '', observaciones: '',
  aceptaTerminos: false,
}

function FormStep({ day, slot, onBack, onSuccess }) {
  const [form, setForm]       = useState(INITIAL_FORM)
  const [errors, setErrors]   = useState({})
  const [loading, setLoading] = useState(false)
  const [captchaDone, setCaptchaDone] = useState(false)

  const dateLabel = formatDateLabel(day)
  const timeLabel = minutesToTime(slot)

  const set = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const validate = () => {
    const e = {}
    if (!form.nombre.trim())    e.nombre    = 'El nombre es requerido'
    if (!form.telefono1.trim()) e.telefono1 = 'El teléfono es requerido'
    if (!form.nacimiento)       e.nacimiento = 'La fecha de nacimiento es requerida'
    if (!form.cedula.trim())    e.cedula    = 'El documento es requerido'
    if (!form.aceptaTerminos)   e.terminos  = 'Debes aceptar los términos'
    if (!captchaDone)           e.captcha   = 'Confirma que no eres un robot'
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      e.email = 'Email inválido'
    }
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }

    setLoading(true)
    try {
      // Verificar duplicados
      const isDup = await checkDuplicate(form.cedula, form.nombre, form.email)
      if (isDup) {
        setErrors({ general: 'Ya existe una cita registrada con este documento, nombre o email.' })
        setLoading(false)
        return
      }

      // Guardar cita
      const cita = await saveCita({
        ...form,
        fecha: day.toISOString().split('T')[0],
        hora: timeLabel,
        doctor: DOCTOR.name,
        dateLabel,
        timeLabel,
      })

      // Simular envío de email (en producción: EmailJS)
      console.log('📧 Email de confirmación enviado a:', form.email || 'sin email')

      onSuccess(cita.id)
    } catch (err) {
      setErrors({ general: 'Error al procesar la cita. Intenta de nuevo.' })
    }
    setLoading(false)
  }

  return (
    <div className={styles.formCard}>
      <div className={styles.citaHeader}>
        <p className={styles.citaLabel}>Cita para:</p>
        <p className={styles.citaDate}>{dateLabel} a las {timeLabel}</p>
        <button className={styles.changeDateBtn} onClick={onBack}>↩ Cambiar fecha</button>
      </div>

      <form onSubmit={handleSubmit} noValidate>

        {errors.general && (
          <div className={styles.errorBanner}>{errors.general}</div>
        )}

        <div className="input-group">
          <label className="input-label">Nombre completo *</label>
          <input className={`input-field ${errors.nombre ? 'error' : ''}`}
            placeholder="nombre completo"
            value={form.nombre} onChange={e => set('nombre', e.target.value)} />
          {errors.nombre && <span className="input-error">{errors.nombre}</span>}
        </div>

        <div className={styles.row2}>
          <div className="input-group">
            <label className="input-label">Teléfono principal *</label>
            <input className={`input-field ${errors.telefono1 ? 'error' : ''}`}
              placeholder="(00) 00000-0000"
              value={form.telefono1} onChange={e => set('telefono1', e.target.value)} />
            {errors.telefono1 && <span className="input-error">{errors.telefono1}</span>}
          </div>
          <div className="input-group">
            <label className="input-label">Teléfono alternativo</label>
            <input className="input-field"
              placeholder="(00) 00000-0000"
              value={form.telefono2} onChange={e => set('telefono2', e.target.value)} />
          </div>
        </div>

        <div className={styles.row2}>
          <div className="input-group">
            <label className="input-label">Fecha de nacimiento *</label>
            <input type="date" className={`input-field ${errors.nacimiento ? 'error' : ''}`}
              value={form.nacimiento} onChange={e => set('nacimiento', e.target.value)} />
            {errors.nacimiento && <span className="input-error">{errors.nacimiento}</span>}
          </div>
          <div className="input-group">
            <label className="input-label">Documento de identidad *</label>
            <input className={`input-field ${errors.cedula ? 'error' : ''}`}
              placeholder="número de cédula / pasaporte"
              value={form.cedula} onChange={e => set('cedula', e.target.value)} />
            {errors.cedula && <span className="input-error">{errors.cedula}</span>}
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">Email (opcional)</label>
          <input type="email" className={`input-field ${errors.email ? 'error' : ''}`}
            placeholder="(opcional) e-mail"
            value={form.email} onChange={e => set('email', e.target.value)} />
          {errors.email && <span className="input-error">{errors.email}</span>}
        </div>

        <div className="input-group">
          <label className="input-label">Persona responsable (opcional)</label>
          <input className="input-field"
            placeholder="(opcional) persona responsable"
            value={form.responsable} onChange={e => set('responsable', e.target.value)} />
        </div>

        <div className="input-group">
          <label className="input-label">Observaciones (opcional)</label>
          <textarea className="input-field" rows={3}
            placeholder="(opcional) observaciones"
            value={form.observaciones} onChange={e => set('observaciones', e.target.value)}
            style={{ resize: 'none' }} />
        </div>

        {/* TÉRMINOS */}
        <div className={styles.checkRow}>
          <input type="checkbox" id="terminos"
            checked={form.aceptaTerminos}
            onChange={e => set('aceptaTerminos', e.target.checked)} />
          <label htmlFor="terminos" className={styles.checkLabel}>
            Afirmo que he leído y acepto las{' '}
            <a href="#" className={styles.termLink}>condiciones de uso</a>
          </label>
        </div>
        {errors.terminos && <span className="input-error">{errors.terminos}</span>}

        {/* reCAPTCHA SIMULADO */}
        <div className={styles.captchaBox}>
          <input type="checkbox" id="captcha"
            checked={captchaDone} onChange={e => setCaptchaDone(e.target.checked)} />
          <label htmlFor="captcha" className={styles.captchaLabel}>No soy un robot</label>
          <div className={styles.captchaBadge}>
            <span style={{ fontSize: '.7rem', color: '#555' }}>reCAPTCHA</span>
          </div>
        </div>
        {errors.captcha && <span className="input-error">{errors.captcha}</span>}

        <div style={{ marginTop: '1.5rem' }}>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? '⏳ Procesando...' : '📅 Solicitar Cita'}
          </button>
        </div>

      </form>
    </div>
  )
}

// ── ÉXITO ─────────────────────────────────────────────────────────────────────
function SuccessStep({ citaId, day, slot }) {
  const navigate = useNavigate()
  const dateLabel = day ? formatDateLabel(day) : ''
  const timeLabel = slot !== null ? minutesToTime(slot) : ''

  return (
    <div className={styles.successCard}>
      <div className={styles.successIcon}>✅</div>
      <h2 className={styles.successTitle}>¡Cita solicitada!</h2>
      <p className={styles.successDate}>
        <strong>{dateLabel}</strong> a las <strong>{timeLabel}</strong>
      </p>
      <div className={styles.successMsg}>
        <p>Se enviará un correo electrónico para confirmar su cita.</p>
        <p>Una vez reciba el correo, por favor confirme si asistirá haciendo clic en el botón <strong>"Sí, asistiré"</strong>.</p>
        <p className={styles.successNote}>
          📋 Los pacientes serán atendidos en <strong>orden de llegada</strong> según la fecha agendada.
          Por favor llegue unos minutos antes de la hora seleccionada de ser posible.
        </p>
      </div>
      {citaId && (
        <p className={styles.citaId}>Código de cita: <code>#{citaId}</code></p>
      )}
      <button className="btn-secondary" onClick={() => navigate('/')} style={{ marginTop: '1.5rem', width: '100%' }}>
        ← Volver al inicio
      </button>
    </div>
  )
}
