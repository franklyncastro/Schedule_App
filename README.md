# 🫁 MediCita — Sistema de Agendamiento Médico

Sistema web completo para consultorios médicos que combina una **landing page profesional** con un **sistema de agendamiento de citas** interactivo. Construido con React + Vite.

![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![Vite](https://img.shields.io/badge/Vite-5-646CFF?style=flat-square&logo=vite)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## ✨ Características

- 🏥 Landing page profesional con perfil del doctor, servicios, horarios y ubicación
- 📅 Sistema de agendamiento con calendario de fechas y horas disponibles
- ⏰ Filtro inteligente de horarios — oculta horas pasadas del día actual
- ✅ Formulario de paciente con validación completa de campos
- 🔄 Validación de duplicados por cédula, nombre y email
- 📧 Sistema de confirmación por email con botones Sí / No
- 🗺️ Mapa interactivo que abre Google Maps o la app nativa en móvil
- 🍪 Banner de cookies funcional con localStorage
- 📱 Diseño 100% responsive para móvil, tablet y escritorio
- 🎨 Animaciones de scroll con IntersectionObserver
- 🌿 Paleta verde esmeralda moderna y profesional

---

## 🚀 Instalación y uso

```bash
# 1. Clonar el repositorio
git clone https://github.com/tuusuario/medicita.git
cd medicita

# 2. Instalar dependencias
npm install

# 3. Levantar servidor de desarrollo
npm run dev

# 4. Abrir en el navegador
# http://localhost:5173
```

---

## 📁 Estructura del proyecto

```
src/
├── App.jsx                        # Router principal (3 rutas)
├── main.jsx                       # Punto de entrada
├── constants.js                   # ⚙️ Datos del doctor, horarios y config de APIs
├── styles/
│   └── global.css                 # Variables CSS y estilos globales
└── components/
    ├── LandingPage.jsx            # Página principal
    ├── LandingPage.module.css
    └── booking/
        ├── BookingPage.jsx        # Calendario + Formulario de cita
        ├── BookingPage.module.css
        ├── ConfirmPage.jsx        # Página de confirmación por email
        └── ConfirmPage.module.css
```

---

## ⚙️ Personalización

Todo lo que necesitas cambiar para adaptar el sistema a un cliente real está en **`src/constants.js`**:

```javascript
// Datos del doctor
export const DOCTOR = {
  name: "Dr. Carlos Mendoza Ríos",
  specialty: "Neumólogo Pediatra",
  phone: "+1 (809) 555-0192",
  whatsapp: "18095550192",
  // ...
}

// Horarios por día de semana (null = no disponible)
// start/end en minutos desde medianoche
export const SCHEDULE = {
  1: { start: 8*60+30, end: 18*60 }, // Lunes 8:30–18:00
  4: { start: 8*60,    end: 11*60+30 }, // Jueves 8:00–11:30
}
```

### Foto del doctor

Coloca la foto en `public/doctor.jpg` y en `LandingPage.jsx` reemplaza el emoji por:

```jsx
<img src="/doctor.jpg" alt="Doctor" className={styles.avatarImg} />
```

### Google Maps real

En `LandingPage.jsx`, en el componente `MapBlock`, reemplaza el placeholder por:

```jsx
<iframe
  src="https://www.google.com/maps/embed?pb=!1m18..."
  width="100%" height="320"
  style={{ border: 0, borderRadius: 20 }}
  allowFullScreen loading="lazy"
/>
```

---

## 🔗 Integración de APIs

El sistema funciona con datos simulados (localStorage) por defecto. Para activar las integraciones reales, completa las variables en `src/constants.js`:

```javascript
export const CONFIG = {
  SHEETS_SCRIPT_URL: "",  // URL del Apps Script de Google Sheets
  EMAILJS_SERVICE_ID:  "", // EmailJS — Service ID
  EMAILJS_TEMPLATE_ID: "", // EmailJS — Template ID
  EMAILJS_PUBLIC_KEY:  "", // EmailJS — Public Key
  RECAPTCHA_SITE_KEY:  "", // Google reCAPTCHA v2 Site Key
  SITE_URL: "https://tudominio.com",
}
```

### 1️⃣ Google Sheets — guardar citas

1. Ve a [script.google.com](https://script.google.com) y crea un nuevo proyecto
2. Pega el siguiente código y reemplaza `TU_SHEET_ID` con el ID de tu Google Sheet:

```javascript
function doGet(e) {
  const sheet = SpreadsheetApp.openById('TU_SHEET_ID').getSheets()[0]
  const data  = sheet.getDataRange().getValues()
  const dup   = data.some(row =>
    row[4] === e.parameter.cedula ||
    row[0] === e.parameter.nombre ||
    (e.parameter.email && row[3] === e.parameter.email)
  )
  return ContentService
    .createTextOutput(JSON.stringify({ duplicate: dup }))
    .setMimeType(ContentService.MimeType.JSON)
}

function doPost(e) {
  const sheet = SpreadsheetApp.openById('TU_SHEET_ID').getSheets()[0]
  const d = JSON.parse(e.postData.contents)
  sheet.appendRow([
    d.nombre, d.telefono1, d.telefono2, d.email, d.cedula,
    d.nacimiento, d.responsable, d.fecha, d.hora,
    d.observaciones, new Date().toISOString(), 'pendiente'
  ])
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON)
}
```

3. Despliega como **Web App** con acceso: **Anyone**
4. Copia la URL generada y pégala en `CONFIG.SHEETS_SCRIPT_URL`

### 2️⃣ EmailJS — confirmación por email

1. Crea cuenta en [emailjs.com](https://emailjs.com)
2. Conecta tu Gmail como servicio
3. Crea una plantilla con estas variables:
   - `{{nombre}}` — nombre del paciente
   - `{{fecha}}` — fecha de la cita
   - `{{hora}}` — hora de la cita
   - `{{confirm_url}}` → botón **"Sí, asistiré"**
   - `{{cancel_url}}` → botón **"No podré asistir"**
4. Instala la librería:

```bash
npm install @emailjs/browser
```

5. En `BookingPage.jsx`, reemplaza el `console.log` del envío de email por:

```javascript
import emailjs from '@emailjs/browser'

await emailjs.send(
  CONFIG.EMAILJS_SERVICE_ID,
  CONFIG.EMAILJS_TEMPLATE_ID,
  {
    nombre:      form.nombre,
    fecha:       dateLabel,
    hora:        timeLabel,
    confirm_url: `${CONFIG.SITE_URL}/confirmar/${cita.id}?action=confirm`,
    cancel_url:  `${CONFIG.SITE_URL}/confirmar/${cita.id}?action=cancel`,
  },
  CONFIG.EMAILJS_PUBLIC_KEY
)
```

### 3️⃣ reCAPTCHA v2 real

1. Registra tu sitio en [google.com/recaptcha](https://google.com/recaptcha) — tipo **v2**
2. Instala:

```bash
npm install react-google-recaptcha
```

3. En `BookingPage.jsx`, reemplaza el checkbox simulado por:

```jsx
import ReCAPTCHA from 'react-google-recaptcha'

<ReCAPTCHA
  sitekey={CONFIG.RECAPTCHA_SITE_KEY}
  onChange={(token) => setCaptchaDone(!!token)}
/>
```

---

## 🔄 Flujo completo del sistema

```
Paciente visita la landing page
    │
    ├── Ve perfil del doctor, servicios, horarios y mapa
    │
    └── Clic en "Agendar una Cita"
            │
            ▼
    Calendario de fechas disponibles
    (navega entre días con ← →)
    (filtra automáticamente horas pasadas del día actual)
            │
            └── Selecciona una hora disponible
                    │
                    ▼
            Formulario del paciente
            (nombre, cédula, teléfono, nacimiento, email, etc.)
                    │
                    ├── Validación de campos requeridos
                    ├── reCAPTCHA anti-spam
                    └── Verifica duplicados en Google Sheets
                            │
                            ▼
                    Guarda cita en Google Sheets
                    Envía email de confirmación al paciente
                            │
                            ▼
                    Pantalla de éxito con instrucciones
                            │
                            └── Paciente recibe email
                                    │
                                    ├── Clic "Sí, asistiré"
                                    │       └── /confirmar/:id?action=confirm
                                    │               └── Cita confirmada ✅
                                    │
                                    └── Clic "No podré asistir"
                                            └── /confirmar/:id?action=cancel
                                                    └── Cita cancelada ❌
```

---

## 🌐 Despliegue en Vercel

```bash
# Build de producción
npm run build
# La carpeta dist/ contiene el sitio listo para desplegar
```

En Vercel:
1. Conecta el repositorio de GitHub
2. Framework: **Vite**
3. Build command: `npm run build`
4. Output directory: `dist`
5. Deploy ✅

---

## 🛠️ Stack tecnológico

| Tecnología | Uso |
|---|---|
| React 18 | Framework de UI y componentes |
| React Router v6 | Navegación entre páginas |
| Vite 5 | Bundler y servidor de desarrollo |
| CSS Modules | Estilos encapsulados por componente |
| Google Sheets | Base de datos de citas vía Apps Script |
| EmailJS | Envío de emails de confirmación |
| reCAPTCHA v2 | Protección anti-spam en formularios |
| localStorage | Simulación de datos en desarrollo |

---

## 📄 Licencia

MIT — libre para uso personal y comercial.

---

Desarrollado por **Franklyn Castro** · [franklyncastrodev@gmail.com](mailto:franklyncastrodev@gmail.com) · [github.com/franklyncastro](https://github.com/franklyncastro)
