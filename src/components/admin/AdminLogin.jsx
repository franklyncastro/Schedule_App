import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DOCTOR } from '../../constants.js'
import styles from './AdminLogin.module.css'

// ── CREDENCIALES (cambiar antes de entregar al cliente) ───────────────────────
const ADMIN_USER     = 'admin'
const ADMIN_PASSWORD = 'medicita2026'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [form, setForm]     = useState({ user: '', password: '' })
  const [error, setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    setTimeout(() => {
      if (form.user === ADMIN_USER && form.password === ADMIN_PASSWORD) {
        sessionStorage.setItem('admin_auth', '1')
        navigate('/admin/panel')
      } else {
        setError('Usuario o contraseña incorrectos')
        setLoading(false)
      }
    }, 600)
  }

  return (
    <div className={styles.page}>
      <div className={styles.bg}>
        <div className={styles.circle1} />
        <div className={styles.circle2} />
      </div>

      <div className={styles.card}>
        {/* Logo */}
        <div className={styles.logo}>
          <div className={styles.logoIcon}>👨‍⚕️</div>
          <div className={styles.logoText}>MediCita</div>
        </div>

        <div className={styles.cardHeader}>
          <h1 className={styles.title}>Panel de administración</h1>
          <p className={styles.subtitle}>{DOCTOR.name}</p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          {error && (
            <div className={styles.errorBanner}>
              ⚠️ {error}
            </div>
          )}

          <div className={styles.inputGroup}>
            <label className={styles.label}>Usuario</label>
            <input
              className={styles.input}
              type="text"
              placeholder="Usuario"
              value={form.user}
              autoComplete="username"
              onChange={e => setForm(f => ({ ...f, user: e.target.value }))}
            />
          </div>

          <div className={styles.inputGroup}>
            <label className={styles.label}>Contraseña</label>
            <div className={styles.passWrap}>
              <input
                className={styles.input}
                type={showPass ? 'text' : 'password'}
                placeholder="Contraseña"
                value={form.password}
                autoComplete="current-password"
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
              <button
                type="button"
                className={styles.eyeBtn}
                onClick={() => setShowPass(v => !v)}
              >
                {showPass ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? '⏳ Verificando...' : '→ Ingresar'}
          </button>
        </form>

        <p className={styles.footer}>
          Acceso restringido · Solo personal autorizado
        </p>
      </div>
    </div>
  )
}