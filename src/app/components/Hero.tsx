import { motion, useScroll, useTransform } from "motion/react";
import { useRef } from "react";

interface Props {
  playedMatches: number;
  totalMatches: number;
  groups: number;
}

const STADIUM_IMG =
  "https://images.unsplash.com/photo-1511204579483-e5c2b1d69acd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxmb290YmFsbCUyMHdvcmxkJTIwY3VwJTIwc3RhZGl1bSUyMGNyb3dkJTIwYWVyaWFsfGVufDF8fHx8MTc4MTI1NDc4Nnww&ixlib=rb-4.1.0&q=80&w=1600";

const ease = [0.16, 1, 0.3, 1] as const;

const PHASE_PILLS = [
  { label: "Fase de Grupos", bg: "#dceeb1" },
  { label: "Round of 32",    bg: "#c5b0f4" },
  { label: "Octavos",        bg: "#f3c9b6" },
  { label: "Cuartos",        bg: "#c8e6cd" },
  { label: "Semis",          bg: "#efd4d4" },
  { label: "3.º Puesto",     bg: "#f4ecd6" },
  { label: "Final",          bg: "#1f1d3d", color: "#ffffff" },
];

function StatItem({ value, label, delay }: { value: number | string; label: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease }}
      style={{ display: "flex", flexDirection: "column", gap: 4 }}
    >
      <span style={{
        fontFamily: "Inter, sans-serif",
        fontSize: "clamp(28px, 3.5vw, 48px)",
        fontWeight: 300, letterSpacing: -1.5, lineHeight: 1,
        color: "#ffffff",
      }}>
        {value}
      </span>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 10, fontWeight: 400, letterSpacing: "0.6px",
        textTransform: "uppercase", color: "rgba(255,255,255,0.5)",
      }}>
        {label}
      </span>
    </motion.div>
  );
}

export function Hero({ playedMatches, totalMatches, groups }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  // Track viewport scroll — no target needed, avoids the non-static position warning
  const { scrollY } = useScroll();
  const imgY = useTransform(scrollY, [0, 600], ["0%", "20%"]);
  const textY = useTransform(scrollY, [0, 600], ["0%", "10%"]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);

  const pending = totalMatches - playedMatches;

  return (
    <div
      ref={ref}
      style={{
        position: "relative",
        height: "clamp(460px, 68vh, 700px)",
        /* clip both axes so the parallax image never leaks horizontally */
        overflow: "hidden",
        borderBottom: "1px solid #e6e6e6",
        /* prevent any child from escaping on mobile */
        maxWidth: "100vw",
      }}
    >
      {/* ── Parallax stadium image ── */}
      {/* overflow:hidden on the wrapper clips the vertical bleed;
          width:100% + no negative x offsets prevents horizontal overflow */}
      <motion.div
        style={{
          y: imgY,
          position: "absolute",
          /* only bleed top/bottom for parallax, never left/right */
          top: "-12%", bottom: "-12%", left: 0, right: 0,
        }}
        initial={{ scale: 1.06, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.4, ease }}
      >
        <img
          src={STADIUM_IMG}
          alt="Estadio de fútbol visto desde el aire"
          style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 40%" }}
        />
        {/* Heavier overlay — base dark + stronger gradient at bottom for text legibility */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundColor: "rgba(0,0,0,0.45)",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.65) 75%, rgba(0,0,0,0.88) 100%)",
        }} />
      </motion.div>

      {/* ── Animated noise grain overlay ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.04 }}
        transition={{ duration: 1 }}
        style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px",
        }}
      />

      {/* ── Text content ── */}
      <motion.div
        style={{
          y: textY, opacity,
          position: "absolute",
          /* stretch to fill without causing overflow */
          top: 0, bottom: 0, left: 0, right: 0,
          display: "flex", flexDirection: "column", justifyContent: "flex-end",
          boxSizing: "border-box",
          padding: "0 24px",
          /* inner content respects max-width */
          width: "100%",
          maxWidth: "100vw",
        }}
      >
        {/* inner centering wrapper */}
        <div style={{ maxWidth: 1280, width: "100%", margin: "0 auto" }}>
        {/* Eyebrow */}
        <motion.span
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease }}
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11, letterSpacing: "0.6px", textTransform: "uppercase",
            color: "rgba(255,255,255,0.6)", display: "block", marginBottom: 16,
          }}
        >
          FIFA World Cup 2026 · USA · Canada · México
        </motion.span>

        {/* Headline */}
        <div style={{ marginBottom: 36, overflow: "hidden" }}>
          <motion.h1
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.75, delay: 0.1, ease }}
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "clamp(40px, 7.5vw, 88px)",
              fontWeight: 300, letterSpacing: -3, lineHeight: 1.0,
              color: "#ffffff", margin: 0,
            }}
          >
            El Mundial 2026,
          </motion.h1>
          <motion.h1
            initial={{ y: "110%" }}
            animate={{ y: 0 }}
            transition={{ duration: 0.75, delay: 0.18, ease }}
            style={{
              fontFamily: "Inter, sans-serif",
              fontSize: "clamp(40px, 7.5vw, 88px)",
              fontWeight: 300, letterSpacing: -3, lineHeight: 1.0,
              color: "rgba(255,255,255,0.55)", margin: 0,
            }}
          >
            al detalle.
          </motion.h1>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.38 }}
          style={{
            display: "flex", gap: "clamp(20px, 4vw, 48px)",
            flexWrap: "wrap", alignItems: "flex-start",
            paddingBottom: 32,
            borderBottom: "1px solid rgba(255,255,255,0.15)",
            marginBottom: 24,
          }}
        >
          <StatItem value={playedMatches} label="Jugados"    delay={0.4} />
          <StatItem value={pending}       label="Pendientes" delay={0.47} />
          <StatItem value={groups}        label="Grupos"     delay={0.54} />
          <StatItem value={48}            label="Selecciones" delay={0.61} />
          <StatItem value={104}           label="Partidos"   delay={0.68} />
        </motion.div>

        {/* Phase pills */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.78, ease }}
          style={{
            display: "flex", gap: 6, flexWrap: "wrap",
            paddingBottom: 28,
          }}
        >
          {PHASE_PILLS.map((p, i) => (
            <motion.span
              key={p.label}
              initial={{ opacity: 0, scale: 0.88 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, delay: 0.82 + i * 0.05, ease }}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 10, letterSpacing: "0.5px", textTransform: "uppercase",
                backgroundColor: p.bg, color: p.color ?? "#000000",
                padding: "5px 14px", borderRadius: 50, whiteSpace: "nowrap",
              }}
            >
              {p.label}
            </motion.span>
          ))}
        </motion.div>
        </div>{/* /inner centering wrapper */}
      </motion.div>

      {/* ── Scroll hint ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1.4 }}
        style={{
          position: "absolute", bottom: 16, right: 24,
          display: "flex", alignItems: "center", gap: 6,
        }}
      >
        <motion.div
          animate={{ y: [0, 4, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9, letterSpacing: "0.6px", textTransform: "uppercase",
            color: "rgba(255,255,255,0.35)",
          }}
        >
          scroll ↓
        </motion.div>
      </motion.div>
    </div>
  );
}
