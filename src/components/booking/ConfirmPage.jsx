import { useParams, useSearchParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { DOCTOR } from '../../constants.js'
import styles from './ConfirmPage.module.css'

// Esta página es la que se abre cuando el paciente hace clic en
// "Sí, asistiré" o "No, cancelar" en el email de confirmación.
// URL: /confirmar/:id?action=confirm  o  /confirmar/:id?action=cancel

export default function ConfirmPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const action = params.get('action') // 'confirm' | 'cancel'

  const [cita, setCita]     = useState(null)
  const [status, setStatus] = useState('loading') // loading | confirmed | cancelled | error | not-found

  useEffect(() => {
    // Buscar la cita en localStorage (simulación)
    const citas = JSON.parse(localStorage.getItem('citas_demo') || '[]')
    const found = citas.find(c => c.id === id)

    if (!found) { setStatus('not-found'); return }

    setCita(found)

    if (action === 'confirm') {
      // Marcar como confirmada
      const updated = citas.map(c => c.id === id ? { ...c, status: 'confirmada' } : c)
      localStorage.setItem('citas_demo', JSON.stringify(updated))
      setStatus('confirmed')
    } else if (action === 'cancel') {
      // Marcar como cancelada
      const updated = citas.map(c => c.id === id ? { ...c, status: 'cancelada' } : c)
      localStorage.setItem('citas_demo', JSON.stringify(updated))
      setStatus('cancelled')
    } else {
      // Sin acción, mostrar opciones
      setStatus('pending')
    }
  }, [id, action])

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div className={styles.headerLogo}>🫁</div>
        <div className={styles.headerName}>{DOCTOR.name}</div>
        <div className={styles.headerSpecialty}>{DOCTOR.specialty}</div>
      </div>

      <div className={styles.container}>
        {status === 'loading' && (
          <div className={styles.card}>
            <div className={styles.icon}>⏳</div>
            <p>Procesando...</p>
          </div>
        )}

        {status === 'not-found' && (
          <div className={styles.card}>
            <div className={styles.icon}>❓</div>
            <h2 className={styles.title}>Cita no encontrada</h2>
            <p className={styles.msg}>No encontramos una cita con este código. Es posible que ya haya sido procesada.</p>
            <button className="btn-secondary" onClick={() => navigate('/')} style={{ marginTop: '1.5rem' }}>
              Ir al inicio
            </button>
          </div>
        )}

        {status === 'pending' && cita && (
          <div className={styles.card}>
            <div className={styles.icon}>📅</div>
            <h2 className={styles.title}>Confirmar cita</h2>
            <div className={styles.citaInfo}>
              <p><strong>Paciente:</strong> {cita.nombre}</p>
              <p><strong>Fecha:</strong> {cita.dateLabel}</p>
              <p><strong>Hora:</strong> {cita.timeLabel}</p>
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

        {status === 'confirmed' && cita && (
          <div className={styles.card}>
            <div className={styles.icon} style={{ color: '#22C55E' }}>✅</div>
            <h2 className={styles.title} style={{ color: '#065F46' }}>¡Cita confirmada!</h2>
            <div className={styles.citaInfo}>
              <p><strong>Paciente:</strong> {cita.nombre}</p>
              <p><strong>Fecha:</strong> {cita.dateLabel}</p>
              <p><strong>Hora:</strong> {cita.timeLabel}</p>
            </div>
            <div className={styles.confirmMsg}>
              <p>Su cita ha sido confirmada exitosamente.</p>
              <p>Por favor llegue unos minutos antes de la hora seleccionada de ser posible.</p>
              <p className={styles.orderNote}>
                📋 Los pacientes serán atendidos en <strong>orden de llegada</strong> según la fecha agendada.
              </p>
            </div>
            <div className={styles.doctorContact}>
              <p>¿Necesita cancelar? Contáctenos:</p>
              <a href={`https://wa.me/${DOCTOR.whatsapp}`} target="_blank" rel="noreferrer"
                className={styles.waLink}>
                💬 WhatsApp
              </a>
            </div>
          </div>
        )}

        {status === 'cancelled' && (
          <div className={styles.card}>
            <div className={styles.icon} style={{ color: '#EF4444' }}>❌</div>
            <h2 className={styles.title} style={{ color: '#991B1B' }}>Cita cancelada</h2>
            <p className={styles.msg}>
              Su cita ha sido cancelada. Si desea reagendar, puede hacerlo desde nuestra página.
            </p>
            <button className="btn-primary" onClick={() => navigate('/agendar')} style={{ marginTop: '1.5rem' }}>
              Agendar nueva cita
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
