import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  DOCTOR,
  SERVICES,
  SCHEDULE,
  INSURANCE,
  PAYMENT,
} from "../constants.js";
import styles from "./LandingPage.module.css";

const DAY_NAMES = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

function minutesToTime(m) {
  return `${Math.floor(m / 60)
    .toString()
    .padStart(2, "0")}:${(m % 60).toString().padStart(2, "0")}`;
}

function useReveal(threshold = 0.1) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

function AnimatedCounter({ target, suffix = "", duration = 1800 }) {
  const [count, setCount] = useState(0);
  const [ref, visible] = useReveal();
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [visible, target, duration]);
  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const scrollTo = (id) => {
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className={styles.page}>
      {/* NAV */}
      <nav className={`${styles.nav} ${scrolled ? styles.navScrolled : ""}`}>
        <div className={styles.navInner}>
          <a href="#" className={styles.navLogo}>
            <div className={styles.navLogoIcon}>👨‍⚕️</div>
            <span className={styles.navLogoText}>MediCita</span>
          </a>
          <ul
            className={`${styles.navLinks} ${menuOpen ? styles.navOpen : ""}`}
          >
            {[
              ["sobre-mi", "Sobre mí"],
              ["servicios", "Servicios"],
              ["horarios", "Horarios"],
              ["ubicacion", "Ubicación"],
            ].map(([id, label]) => (
              <li key={id}>
                <button className={styles.navLink} onClick={() => scrollTo(id)}>
                  {label}
                </button>
              </li>
            ))}
          </ul>
          <button
            className={styles.navCta}
            onClick={() => navigate("/agendar")}
          >
            📅 Agendar Cita
          </button>
          <button
            className={styles.menuBtn}
            onClick={() => setMenuOpen((o) => !o)}
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </nav>

      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroBg}>
          <div className={styles.circle1} />
          <div className={styles.circle2} />
          <div className={styles.circle3} />
          <div className={styles.gridPattern} />
        </div>

        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <span className={styles.badgeDot} />
              Disponible para consultas
            </div>
            <h1 className={styles.heroTitle}>
              Cuidamos la
              <br />
              <span className={styles.heroAccent}>salud respiratoria</span>
              <br />
              de tus hijos
            </h1>
            <p className={styles.heroSubtitle}>
              Especialista en neumología pediátrica con más de una década de
              experiencia. Diagnóstico preciso, trato humano, resultados reales.
            </p>
            <div className={styles.heroActions}>
              <button
                className={styles.btnHero}
                onClick={() => navigate("/agendar")}
              >
                📅 Agendar una cita
              </button>
              <button
                className={styles.btnHeroGhost}
                onClick={() => scrollTo("servicios")}
              >
                Ver servicios →
              </button>
            </div>
            <div className={styles.heroContact}>
              <a
                href={`https://wa.me/${DOCTOR.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className={styles.heroContactItem}
              >
                <span>
                  <i className="fa-brands fa-whatsapp"></i>{" "}
                </span>{" "}
                WhatsApp
              </a>
              <a
                href={`tel:${DOCTOR.phone}`}
                className={styles.heroContactItem}
              >
                <span>
                  <i className="fa-solid fa-phone"></i>
                </span>{" "}
                {DOCTOR.phone}
              </a>
              <a
                href={`https://instagram.com/${DOCTOR.instagram.replace("@", "")}`}
                target="_blank"
                rel="noreferrer"
                className={styles.heroContactItem}
              >
                <span>
                  <i className="fa-brands fa-instagram"></i>
                </span>{" "}
                {DOCTOR.instagram}
              </a>
            </div>
          </div>

          <div className={styles.heroVisual}>
            <div className={styles.avatarWrap}>
              <div className={styles.avatarRingOuter} />
              <div className={styles.avatarRingInner} />
              <div className={styles.avatarCircle}>
                <img
                  src="/doc.png"
                  alt="Dr. Carlos Mendoza"
                  className={styles.avatarImg}
                />
              </div>
              <div className={`${styles.floatCard} ${styles.floatCard1}`}>
                <span className={styles.floatIcon}>⭐</span>
                <div>
                  <div className={styles.floatNum}>4.9</div>
                  <div className={styles.floatLabel}>Calificación</div>
                </div>
              </div>
              <div className={`${styles.floatCard} ${styles.floatCard2}`}>
                <span className={styles.floatIcon}>🏥</span>
                <div>
                  <div className={styles.floatNum}>100%</div>
                  <div className={styles.floatLabel}>Seguros</div>
                </div>
              </div>
            </div>
            <div className={styles.doctorCard}>
              <div className={styles.doctorName}>{DOCTOR.name}</div>
              <div className={styles.doctorSpecialty}>{DOCTOR.specialty}</div>
              <div className={styles.doctorLicense}>Lic. {DOCTOR.license}</div>
            </div>
          </div>
        </div>

        <div className={styles.heroWave}>
          <svg
            viewBox="0 0 1440 80"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="none"
          >
            <path
              d="M0 80L60 68C120 56 240 32 360 26C480 20 600 32 720 38C840 44 960 44 1080 36C1200 28 1320 8 1380 0L1440 0V80H0Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* ESTADÍSTICAS */}
      <section className={styles.stats}>
        <div className={styles.statsInner}>
          {[
            { num: 10, suffix: "+", label: "Años de experiencia" },
            { num: 2000, suffix: "+", label: "Pacientes atendidos" },
            { num: 9, suffix: "", label: "Condiciones tratadas" },
            { num: 100, suffix: "%", label: "Seguros aceptados" },
          ].map((s, i) => (
            <StatCard key={i} {...s} index={i} />
          ))}
        </div>
      </section>

      {/* SOBRE MÍ */}
      <section id="sobre-mi" className={styles.about}>
        <div className={styles.sectionInner}>
          <SectionLabel>Quién soy</SectionLabel>
          <h2 className={styles.sectionTitle}>
            Comprometido con la{" "}
            <span className={styles.accent}>salud infantil</span>
          </h2>
          <div className={styles.aboutGrid}>
            <AboutText />
            <AboutFeatures />
          </div>
        </div>
      </section>

      {/* SERVICIOS */}
      <section id="servicios" className={styles.services}>
        <div className={styles.sectionInner}>
          <SectionLabel>Especialidades</SectionLabel>
          <h2 className={styles.sectionTitle}>
            Condiciones que <span className={styles.accent}>tratamos</span>
          </h2>
          <p className={styles.sectionSub}>
            Diagnóstico y tratamiento integral de enfermedades respiratorias en
            niños y adolescentes.
          </p>
          <div className={styles.servicesGrid}>
            {SERVICES.map((s, i) => (
              <ServiceCard key={i} service={s} delay={i * 50} />
            ))}
          </div>
        </div>
      </section>

      {/* SEGUROS Y PAGO */}
      <section className={styles.insurance}>
        <div className={styles.sectionInner}>
          <div className={styles.insuranceGrid}>
            <InsuranceCard
              icon="🏥"
              title="Seguros médicos"
              desc={INSURANCE}
              highlight="Todos los seguros aceptados"
            />
            <InsuranceCard
              icon="💳"
              title="Métodos de pago"
              desc="Facilitamos el acceso a la atención de calidad."
              pills={PAYMENT}
            />
          </div>
        </div>
      </section>

      {/* HORARIOS */}
      <section id="horarios" className={styles.schedule}>
        <div className={styles.sectionInner}>
          <SectionLabel>Disponibilidad</SectionLabel>
          <h2 className={styles.sectionTitle}>
            Horarios de <span className={styles.accent}>atención</span>
          </h2>
          <ScheduleGrid />
          <div className={styles.scheduleNote}>
            📋 Atención por <strong>orden de llegada</strong> según fecha
            agendada. Le recomendamos llegar unos minutos antes de la hora
            seleccionada.
          </div>
        </div>
      </section>

      {/* UBICACIÓN */}
      <section id="ubicacion" className={styles.location}>
        <div className={styles.sectionInner}>
          <SectionLabel>Cómo llegar</SectionLabel>
          <h2 className={styles.sectionTitle}>
            Nuestra <span className={styles.accent}>ubicación</span>
          </h2>
          <div className={styles.locationGrid}>
            <LocationInfo />
            <MapBlock />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className={styles.cta}>
        <div className={styles.ctaInner}>
          <div className={styles.ctaBg} />
          <h2 className={styles.ctaTitle}>¿Listo para agendar tu cita?</h2>
          <p className={styles.ctaDesc}>
            Sin filas. Sin esperas. Selecciona tu fecha y hora disponible en
            segundos.
          </p>
          <button
            className={styles.ctaBtn}
            onClick={() => navigate("/agendar")}
          >
            📅 Agendar ahora
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerLogo}>👨‍⚕️ MediCita</div>
          <p className={styles.footerCopy}>
            © 2026 {DOCTOR.name} · {DOCTOR.specialty} · Santo Domingo, RD
          </p>
          <div className={styles.footerLinks}>
            <a href="#">Privacidad</a>
            <a href="#">Cookies</a>
            <button onClick={() => scrollTo("ubicacion")}>Contacto</button>
          </div>
        </div>
      </footer>

      <CookieBanner />
    </div>
  );
}

// ── SUB-COMPONENTES ───────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={`${styles.sectionLabel} ${visible ? styles.visible : ""}`}
    >
      <span className={styles.labelLine} />
      {children}
    </div>
  );
}

function StatCard({ num, suffix, label, index }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={`${styles.statCard} ${visible ? styles.visible : ""}`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className={styles.statNum}>
        {visible ? (
          <AnimatedCounter target={num} suffix={suffix} />
        ) : (
          `0${suffix}`
        )}
      </div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  );
}

function AboutText() {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={`${styles.aboutText} ${visible ? styles.visible : ""}`}
    >
      <p>{DOCTOR.about}</p>
      <p style={{ marginTop: "1rem" }}>
        Mi enfoque combina la evidencia científica más actualizada con un trato
        cercano y empático, porque entiendo que cuando un niño está enfermo,
        toda la familia necesita apoyo.
      </p>
      <div className={styles.aboutTags}>
        {[
          "Neumología pediátrica",
          "Alergias respiratorias",
          "Trastornos del sueño",
          "Asma infantil",
        ].map((t) => (
          <span key={t} className={styles.aboutTag}>
            {t}
          </span>
        ))}
      </div>
    </div>
  );
}

function AboutFeatures() {
  return (
    <div className={styles.aboutFeatures}>
      {[
        {
          icon: "🏥",
          title: "Consultorio equipado",
          desc: "Instalaciones modernas para diagnóstico preciso y confiable.",
        },
        {
          icon: "💊",
          title: "Tratamiento personalizado",
          desc: "Plan de tratamiento adaptado a cada paciente y su familia.",
        },
        {
          icon: "📋",
          title: "Seguimiento continuo",
          desc: "Acompañamos a la familia durante todo el proceso de recuperación.",
        },
      ].map((f, i) => {
        const [ref, visible] = useReveal();
        return (
          <div
            key={i}
            ref={ref}
            className={`${styles.featureItem} ${visible ? styles.visible : ""}`}
            style={{ transitionDelay: `${i * 120}ms` }}
          >
            <div className={styles.featureIcon}>{f.icon}</div>
            <div>
              <div className={styles.featureTitle}>{f.title}</div>
              <div className={styles.featureDesc}>{f.desc}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ServiceCard({ service, delay }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={`${styles.serviceCard} ${visible ? styles.visible : ""}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      <div className={styles.serviceEmoji}>{service.emoji}</div>
      <div className={styles.serviceName}>{service.name}</div>
      <div className={styles.serviceDesc}>{service.desc}</div>
    </div>
  );
}

function InsuranceCard({ icon, title, desc, highlight, pills }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={`${styles.insuranceCard} ${visible ? styles.visible : ""}`}
    >
      <div className={styles.insuranceIcon}>{icon}</div>
      <h3 className={styles.insuranceTitle}>{title}</h3>
      <p className={styles.insuranceDesc}>{desc}</p>
      {highlight && (
        <div className={styles.insuranceHighlight}>✅ {highlight}</div>
      )}
      {pills && (
        <div className={styles.insurancePills}>
          {pills.map((p, i) => (
            <span key={i} className={styles.insurancePill}>
              {p}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ScheduleGrid() {
  return (
    <div className={styles.scheduleGrid}>
      {DAY_NAMES.map((day, i) => {
        const slot = SCHEDULE[i];
        const [ref, visible] = useReveal();
        return (
          <div
            key={i}
            ref={ref}
            className={`${styles.scheduleRow} ${slot ? styles.scheduleAvail : styles.scheduleNone} ${visible ? styles.visible : ""}`}
            style={{ transitionDelay: `${i * 60}ms` }}
          >
            <span
              className={`${styles.scheduleDot} ${slot ? styles.dotGreen : styles.dotGray}`}
            />
            <span className={styles.scheduleDay}>{day}</span>
            <span className={styles.scheduleTime}>
              {slot
                ? `${minutesToTime(slot.start)} – ${minutesToTime(slot.end)}`
                : "No disponible"}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function LocationInfo() {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={`${styles.locationInfo} ${visible ? styles.visible : ""}`}
    >
      {[
        {
          icon: "📍",
          label: "Dirección",
          value: `${DOCTOR.address.street}, ${DOCTOR.address.area}`,
        },
        { icon: "🏥", label: "Consultorio", value: DOCTOR.address.clinic },
        { icon: "📞", label: "Teléfono", value: DOCTOR.phone },
        {
          icon: "🚗",
          label: "Estacionamiento",
          value: "Disponible en el edificio para pacientes",
        },
      ].map((d, i) => (
        <div key={i} className={styles.locationDetail}>
          <div className={styles.locationIcon}>{d.icon}</div>
          <div>
            <div className={styles.locationLabel}>{d.label}</div>
            <div className={styles.locationValue}>{d.value}</div>
          </div>
        </div>
      ))}
      <a
        href={`https://wa.me/${DOCTOR.whatsapp}?text=Hola, deseo información sobre consultas`}
        target="_blank"
        rel="noreferrer"
        className={styles.waBtn}
      >
        <i className="fa-brands fa-whatsapp"></i> Escribir por WhatsApp
      </a>
    </div>
  );
}

function MapBlock() {
  const [ref, visible] = useReveal();
  const handleClick = () => {
    const url = DOCTOR.address.mapUrl;
    if (/Android/i.test(navigator.userAgent)) {
      window.location.href = `geo:${DOCTOR.address.lat},${DOCTOR.address.lng}?q=${encodeURIComponent(DOCTOR.address.street)}`;
      setTimeout(() => window.open(url, "_blank"), 500);
    } else if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      window.location.href = `maps://?q=${encodeURIComponent(DOCTOR.address.street)}&ll=${DOCTOR.address.lat},${DOCTOR.address.lng}`;
      setTimeout(() => window.open(url, "_blank"), 500);
    } else {
      window.open(url, "_blank");
    }
  };
  return (
    <div
      ref={ref}
      className={`${styles.mapWrap} ${visible ? styles.visible : ""}`}
      onClick={handleClick}
    >
      <iframe
        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3784.165586061625!2d-69.93934052480957!3d18.476157282608703!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8eaf89e8b18e9fa3%3A0x621beaa0b80e22a3!2sAv.%20Abraham%20Lincoln%20856%2C%20Santo%20Domingo%2010148!5e0!3m2!1ses-419!2sdo!4v1774197318662!5m2!1ses-419!2sdo"
        width="100%"
        height="320"
        style={{ border: 0, borderRadius: 20 }}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        title="Ubicación del consultorio"
      />
    </div>
  );
}

function CookieBanner() {
  const [visible, setVisible] = useState(
    () => !localStorage.getItem("cookies_ok"),
  );
  if (!visible) return null;
  return (
    <div className={styles.cookie}>
      <p className={styles.cookieText}>
        🍪 Usamos cookies para mejorar tu experiencia.{" "}
        <a href="#" className={styles.cookieLink}>
          Política de privacidad
        </a>
      </p>
      <div className={styles.cookieBtns}>
        <button
          className={styles.cookieAccept}
          onClick={() => {
            localStorage.setItem("cookies_ok", "1");
            setVisible(false);
          }}
        >
          Aceptar
        </button>
        <button
          className={styles.cookieReject}
          onClick={() => setVisible(false)}
        >
          Rechazar
        </button>
      </div>
    </div>
  );
}
