# MediCita — Sistema de Landing + Agendamiento Médico

Sistema completo para consultorios médicos: landing page + agendamiento de citas con calendario, validación de duplicados, Google Sheets y confirmación por email.

## Demo en vivo

Levanta el proyecto y visita `http://localhost:5173`

---

## Instalación

```bash
npm install
npm run dev
```

---

## Estructura

```
src/
├── App.jsx                        ← Router (3 rutas)
├── constants.js                   ← EDITAR AQUÍ: datos del doctor, horarios, APIs
├── styles/global.css
└── components/
    ├── LandingPage.jsx            ← Página principal
    ├── LandingPage.module.css
    └── booking/
        ├── BookingPage.jsx        ← Calendario + Formulario
        ├── BookingPage.module.css
        ├── ConfirmPage.jsx        ← Confirmación por email
        └── ConfirmPage.module.css
```

---

## Personalizar para un cliente real

### 1. Editar `constants.js`

Cambia los datos del doctor:
- `DOCTOR` — nombre, especialidad, teléfono, dirección, etc.
- `SERVICES` — lista de servicios ofrecidos
- `SCHEDULE` — días y horarios disponibles
- `SLOT_INTERVAL` — duración entre citas (default: 30 min)

### 2. Foto del doctor

Agrega la foto real en `public/doctor.jpg` y en `LandingPage.jsx` reemplaza el emoji por:
```jsx
<img src="/doctor.jpg" alt="Doctor" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
```

### 3. Google Maps real

En `LandingPage.jsx`, en el componente `MapBlock`, reemplaza el placeholder por:
```jsx
<iframe
  src="https://www.google.com/maps/embed?pb=!1m18..."
  width="100%" height="260"
  style={{ border: 0, borderRadius: 12 }}
  allowFullScreen loading="lazy"
/>
```

---

## Integrar APIs reales

### Google Sheets (guardar citas)

1. Ve a [Google Apps Script](https://script.google.com)
2. Crea un nuevo proyecto y pega el código del `apps-script.gs` de abajo
3. Despliega como Web App (acceso: Anyone)
4. Copia la URL del despliegue
5. En `constants.js`, pon la URL en `CONFIG.SHEETS_SCRIPT_URL`

```javascript
// apps-script.gs
function doGet(e) {
  const sheet = SpreadsheetApp.openById('TU_SHEET_ID').getSheets()[0]
  const cedula = e.parameter.cedula
  const nombre = e.parameter.nombre
  const email  = e.parameter.email
  const data   = sheet.getDataRange().getValues()
  const dup = data.some(row =>
    row[5] === cedula || row[0] === nombre || (email && row[3] === email)
  )
  return ContentService.createTextOutput(JSON.stringify({ duplicate: dup }))
    .setMimeType(ContentService.MimeType.JSON)
}

function doPost(e) {
  const sheet = SpreadsheetApp.openById('TU_SHEET_ID').getSheets()[0]
  const d = JSON.parse(e.postData.contents)
  sheet.appendRow([
    d.nombre, d.telefono1, d.telefono2, d.email,
    d.cedula, d.nacimiento, d.responsable,
    d.fecha, d.hora, d.observaciones,
    new Date().toISOString(), 'pendiente'
  ])
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON)
}
```

### EmailJS (enviar correo de confirmación)

1. Crea cuenta en [emailjs.com](https://emailjs.com)
2. Conecta tu Gmail como servicio
3. Crea una plantilla con variables: `{{nombre}}`, `{{fecha}}`, `{{hora}}`, `{{confirm_url}}`, `{{cancel_url}}`
4. Agrega los botones Sí/No apuntando a:
   - Sí: `{{confirm_url}}`  → `/confirmar/{{cita_id}}?action=confirm`
   - No: `{{cancel_url}}`   → `/confirmar/{{cita_id}}?action=cancel`
5. Instala: `npm install @emailjs/browser`
6. En `BookingPage.jsx`, en `handleSubmit`, reemplaza el `console.log` por:

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

### reCAPTCHA v2 real

1. Registra tu sitio en [google.com/recaptcha](https://google.com/recaptcha)
2. Instala: `npm install react-google-recaptcha`
3. En `BookingPage.jsx`, reemplaza el checkbox simulado por:

```jsx
import ReCAPTCHA from 'react-google-recaptcha'

<ReCAPTCHA
  sitekey={CONFIG.RECAPTCHA_SITE_KEY}
  onChange={(token) => setCaptchaDone(!!token)}
/>
```

---

## Flujo completo del sistema

```
Paciente visita la landing
    → Clic "Agendar una Cita"
    → Ve calendario con días disponibles (según horario del doctor)
    → Navega entre días con ← →
    → Selecciona una hora disponible
    → Llena formulario (nombre, cédula, teléfono, etc.)
    → Acepta términos + reCAPTCHA
    → Sistema valida duplicados (cédula/nombre/email)
    → Guarda en Google Sheets
    → Envía email al paciente con botones Sí/No
    → Pantalla de éxito con instrucciones
    → Paciente hace clic en "Sí" en el email
    → Se abre /confirmar/:id?action=confirm
    → Página confirma la cita y da instrucciones
```

---

## Despliegue

```bash
npm run build
# Sube la carpeta dist/ a Vercel o Netlify
```

En Vercel: conecta el repo y hace deploy automático.
Configura las variables de entorno si usas `.env`.
