// ── DATOS DEL DOCTOR (reemplazar con datos reales del cliente) ────────────────
export const DOCTOR = {
  name: "Dr. Carlos Mendoza Ríos",
  specialty: "Neumólogo Pediatra",
  license: "CMP-45821",
  phone: "+1 (809) 555-0192",
  whatsapp: "18095550192",
  instagram: "@dr.carlosmendoza",
  email: "citas@drmendoza.com",
  about: "Especialista en neumología pediátrica con más de 10 años de experiencia en el diagnóstico, tratamiento y prevención de enfermedades respiratorias y pulmonares en niños, desde el nacimiento hasta los 18 años.",
  address: {
    street: "Av. Abraham Lincoln #856",
    area: "Piantini, Santo Domingo",
    clinic: "Torre Médica Lincoln, Consultorio 4B",
    mapUrl: "https://maps.google.com/?q=Av.+Abraham+Lincoln+856+Santo+Domingo",
    lat: 18.4861,
    lng: -69.9312,
  },
}

// ── SERVICIOS ────────────────────────────────────────────────────────────────
export const SERVICES = [
  { emoji: "😮‍💨", name: "Tos crónica",                    desc: "Evaluación y tratamiento de tos persistente mayor a 4 semanas." },
  { emoji: "🤧",   name: "Bronquitis",                      desc: "Manejo de inflamación bronquial aguda y crónica." },
  { emoji: "🌸",   name: "Rinitis alérgica",                desc: "Control de síntomas nasales por alergia con plan sostenido." },
  { emoji: "🌬️",  name: "Asma",                            desc: "Diagnóstico temprano y manejo del asma pediátrica." },
  { emoji: "⚕️",   name: "Neumonía",                        desc: "Tratamiento y seguimiento con control radiológico." },
  { emoji: "🔄",   name: "Sibilancias recurrentes",         desc: "Evaluación de episodios frecuentes de sibilancias." },
  { emoji: "🦠",   name: "Infecciones respiratorias",       desc: "Estudio de infecciones recurrentes del tracto respiratorio." },
  { emoji: "🔍",   name: "Evaluación prequirúrgica",        desc: "Valoración neumológica completa previa a cirugías." },
  { emoji: "💤",   name: "Apnea del sueño",                 desc: "Diagnóstico y manejo de trastornos respiratorios nocturnos." },
]

// ── HORARIOS ─────────────────────────────────────────────────────────────────
// start y end en minutos desde medianoche. null = no disponible
export const SCHEDULE = {
  0: null,                          // Domingo
  1: { start: 8*60+30, end: 18*60 }, // Lunes     8:30–18:00
  2: null,                          // Martes
  3: null,                          // Miércoles
  4: { start: 8*60,    end: 11*60+30 }, // Jueves  8:00–11:30
  5: { start: 9*60,    end: 13*60 },    // Viernes 9:00–13:00
  6: null,                          // Sábado
}

// Intervalo entre citas en minutos
export const SLOT_INTERVAL = 30

// Días hacia adelante que se muestran en el calendario
export const DAYS_AHEAD = 30

// ── SEGUROS Y PAGO ───────────────────────────────────────────────────────────
export const INSURANCE = "Se aceptan todos los seguros médicos."
export const PAYMENT   = ["Efectivo", "Tarjeta de crédito", "Tarjeta de débito"]

// ── CONFIGURACIÓN APIs (llenar cuando estén listas) ──────────────────────────
export const CONFIG = {
  // Google Sheets
  SHEETS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbxuhkhLeOdo3WlgNsaFGAFjyLeH2BuxTEuKnijc_-CEE9I57mB34HJejHrGuFulWBc9RQ/exec", // URL del Apps Script Web App
  SHEET_ID:"1X2Ml7vu7hJ-jg_uBYeGgFfl9xxh33QDSzXrTJDl7UO0", // ID del Google Sheet

  // EmailJS
  EMAILJS_SERVICE_ID:  "service_1choke8",
  EMAILJS_TEMPLATE_ID: "template_m36scid",
  EMAILJS_PUBLIC_KEY:  "qjAVEiVLvrInhKDLI",

  // reCAPTCHA
  RECAPTCHA_SITE_KEY: "6LcQjpIsAAAAABbOY9aDcE81EKGHf_ZfF2nxMaxc", // "6LeXXXXXXXXXXXXXXXXXXX"

  // URL base del sitio (para links de confirmación en emails)
  SITE_URL: "https://medicitamendoza.vercel.app",
}
