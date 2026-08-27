import { useState, useMemo } from "react";
import { motion } from "motion/react";
import { useWorldCupData, Round } from "./components/useWorldCupData";
import { MatchCard } from "./components/MatchCard";
import { Hero } from "./components/Hero";
import { GroupStandingsView } from "./components/GroupStandings";
import { computeStandings } from "./components/useStandings";
import { BracketView } from "./components/BracketView";
import { DayNav } from "./components/DayNav";
import { buildSlotResolver } from "./components/useBracketResolver";

const PHASE_TABS = [
  { id: "all",       label: "Todos",       icon: "📅" },
  { id: "groups",    label: "Grupos",      icon: "⚽" },
  { id: "knockout",  label: "Eliminat.",   icon: "🏆" },
  { id: "standings", label: "Clasificac.", icon: "📊" },
  { id: "bracket",   label: "Cuadro",      icon: "🗂" },
];

const KNOCKOUT_ORDER = [
  "Round of 32", "Round of 16", "Quarter-final",
  "Semi-final", "Match for third place", "Final",
];

// Group stage: all matchdays share the same lime — one visual identity
// Knockout: each round gets its own pastel, navy reserved for the Final
const ROUND_COLORS: Record<string, string> = {
  "Matchday 1":  "#dceeb1",
  "Matchday 2":  "#dceeb1",
  "Matchday 3":  "#dceeb1",
  "Matchday 4":  "#dceeb1",
  "Matchday 5":  "#dceeb1",
  "Matchday 6":  "#dceeb1",
  "Matchday 7":  "#dceeb1",
  "Matchday 8":  "#dceeb1",
  "Matchday 9":  "#dceeb1",
  "Matchday 10": "#dceeb1",
  "Matchday 11": "#dceeb1",
  "Matchday 12": "#dceeb1",
  "Matchday 13": "#dceeb1",
  "Matchday 14": "#dceeb1",
  "Matchday 15": "#dceeb1",
  "Matchday 16": "#dceeb1",
  "Matchday 17": "#dceeb1",
  "Round of 32": "#c5b0f4",
  "Round of 16": "#f3c9b6",
  "Quarter-final": "#c8e6cd",
  "Semi-final": "#efd4d4",
  "Match for third place": "#f4ecd6",
  "Final": "#1f1d3d",
};

const ease = [0.16, 1, 0.3, 1] as const;

function RoundSection({ round, index }: { round: Round; index: number }) {
  const played = round.matches.filter((m) => Array.isArray(m.score)).length;
  const total = round.matches.length;
  const blockColor = ROUND_COLORS[round.name] ?? "#f7f7f5";
  const isFinal = round.name === "Final";
  const textColor = isFinal ? "#ffffff" : "#000000";

  const isGroupPhase = round.phase === "groups";
  const byGroup = useMemo(() => {
    if (!isGroupPhase) return null;
    const map = new Map<string, typeof round.matches>();
    for (const m of round.matches) {
      const g = m.group || "Other";
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(m);
    }
    return map;
  }, [round.matches, isGroupPhase]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay: Math.min(index * 0.03, 0.15), ease }}
    >
      {/* color-block header */}
      <motion.div
        initial={{ scaleX: 0.96, opacity: 0 }}
        whileInView={{ scaleX: 1, opacity: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, delay: Math.min(index * 0.03, 0.12) + 0.05, ease }}
        style={{
        backgroundColor: blockColor,
        borderRadius: 24,
        padding: "28px 32px",
        marginBottom: 16,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 12,
        transformOrigin: "left center",
      }}>
        <div>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11, fontWeight: 400, letterSpacing: "0.6px",
            textTransform: "uppercase", color: textColor, opacity: 0.5,
            display: "block", marginBottom: 6,
          }}>
            {round.phase === "groups" ? "Fase de Grupos" : "Eliminatorias"}
          </span>
          <h2 style={{
            fontFamily: "Inter, sans-serif",
            fontSize: "clamp(22px, 3vw, 32px)", fontWeight: 300,
            letterSpacing: -1, lineHeight: 1.1,
            color: textColor, margin: 0,
          }}>
            {round.name}
          </h2>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11, letterSpacing: "0.5px", textTransform: "uppercase",
            color: textColor, opacity: 0.45,
          }}>
            {played}/{total} jugados
          </span>
          {played === total && total > 0 && (
            <span style={{
              backgroundColor: "#1ea64a", color: "#ffffff",
              borderRadius: 9999, padding: "3px 10px",
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 10, letterSpacing: "0.5px", textTransform: "uppercase",
            }}>
              Completo
            </span>
          )}
        </div>
      </motion.div>

      {/* Matches */}
      {isGroupPhase && byGroup ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {Array.from(byGroup.entries())
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([group, matches], gi) => (
              <motion.div
                key={group}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, delay: gi * 0.03, ease }}
              >
                <div style={{ marginBottom: 8, paddingLeft: 4 }}>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: 11, fontWeight: 400, letterSpacing: "0.6px",
                    textTransform: "uppercase", color: "#000000", opacity: 0.35,
                  }}>
                    {group}
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {matches.map((m, mi) => (
                    <motion.div
                      key={m.id}
                      initial={{ opacity: 0, y: 10 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-16px" }}
                      transition={{ duration: 0.3, delay: mi * 0.05, ease }}
                    >
                      <MatchCard match={m} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {round.matches.map((m, mi) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-20px" }}
              transition={{ duration: 0.35, delay: mi * 0.04, ease }}
            >
              <MatchCard match={m} />
            </motion.div>
          ))}
        </div>
      )}
    </motion.section>
  );
}

export default function App() {
  const { rounds, fetching, error } = useWorldCupData();
  const [activeTab, setActiveTab] = useState("all");
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const totalMatches = rounds.reduce((s, r) => s + r.matches.length, 0);
  const playedMatches = rounds.reduce((s, r) => s + r.matches.filter((m) => Array.isArray(m.score)).length, 0);
  const groups = new Set(rounds.flatMap((r) => r.matches.map((m) => m.group)).filter(Boolean)).size;
  const standings = useMemo(() => computeStandings(rounds), [rounds]);

  // Resolver: replaces slot codes ("1A", "2B", "3C/D/F"...) with actual team names
  const resolvedRounds: Round[] = useMemo(() => {
    const resolve = buildSlotResolver(rounds);
    return rounds.map((r) => {
      if (r.phase === "groups") return r;
      return {
        ...r,
        matches: r.matches.map((m) => ({
          ...m,
          team1: resolve(m.team1).status !== "tbd" ? resolve(m.team1).team : m.team1,
          team2: resolve(m.team2).status !== "tbd" ? resolve(m.team2).team : m.team2,
        })),
      };
    });
  }, [rounds]);

  const filtered: Round[] = useMemo(() => {
    let base: Round[];
    if (activeTab === "all") base = resolvedRounds;
    else if (activeTab === "groups") base = resolvedRounds.filter((r) => r.phase === "groups");
    else base = resolvedRounds
      .filter((r) => r.phase === "knockout")
      .sort((a, b) => (KNOCKOUT_ORDER.indexOf(a.name) ?? 99) - (KNOCKOUT_ORDER.indexOf(b.name) ?? 99));

    if (!selectedDate) return base;
    return base
      .map((r) => ({ ...r, matches: r.matches.filter((m) => m.date === selectedDate) }))
      .filter((r) => r.matches.length > 0);
  }, [resolvedRounds, activeTab, selectedDate]);

  // All unique match dates sorted ascending
  const allDates = useMemo(() => {
    const set = new Set<string>();
    rounds.forEach((r) => r.matches.forEach((m) => { if (m.date) set.add(m.date); }));
    return Array.from(set).sort();
  }, [rounds]);

  // Reset date filter when changing tabs
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSelectedDate(null);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#ffffff", fontFamily: "Inter, sans-serif", overflowX: "hidden", maxWidth: "100vw" }}>

      {/* ── Top bar: logo only ── */}
      <motion.nav
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          backgroundColor: "rgba(255,255,255,0.92)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid #e6e6e6",
          height: 56,
          display: "flex",
          alignItems: "center",
          padding: "0 24px",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{
          maxWidth: 1280, width: "100%", margin: "0 auto",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <motion.span
              animate={{ rotate: [0, -10, 10, -5, 0] }}
              transition={{ duration: 1.2, delay: 0.6, ease: "easeInOut" }}
              style={{ fontSize: 18, display: "inline-block" }}
            >
              ⚽
            </motion.span>
            <span style={{ fontSize: 15, fontWeight: 500, letterSpacing: -0.3, color: "#000000" }}>
              Mundial 2026
            </span>
          </div>

          {/* Tabs — only visible on desktop (≥ 640px) */}
          <div style={{
            display: "flex", gap: 4,
            backgroundColor: "#f7f7f5", borderRadius: 50, padding: 4,
            // hide on mobile via CSS class
          }} className="desktop-tabs">
            {PHASE_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                style={{
                  padding: "6px 16px",
                  backgroundColor: activeTab === tab.id ? "#000000" : "transparent",
                  color: activeTab === tab.id ? "#ffffff" : "#000000",
                  border: "none", borderRadius: 50,
                  fontSize: 13, fontWeight: activeTab === tab.id ? 500 : 400,
                  cursor: "pointer", whiteSpace: "nowrap",
                  fontFamily: "Inter, sans-serif",
                  transition: "background-color 0.15s, color 0.15s",
                  opacity: activeTab === tab.id ? 1 : 0.6,
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </motion.nav>

      {/* ── Bottom tab bar — mobile only (< 640px) ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="mobile-tabs"
        style={{
          position: "fixed",
          bottom: 0, left: 0, right: 0,
          zIndex: 200,
          backgroundColor: "rgba(255,255,255,0.96)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderTop: "1px solid #e6e6e6",
          display: "flex",
          padding: "0 8px",
          paddingBottom: "max(8px, env(safe-area-inset-bottom))",
          gap: 0,
        }}
      >
        {PHASE_TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            style={{
              flex: 1,
              minWidth: 0,
              padding: "7px 4px 8px",
              backgroundColor: "transparent",
              color: activeTab === tab.id ? "#000000" : "#767676",
              border: "none", borderRadius: 0,
              cursor: "pointer",
              fontFamily: "Inter, sans-serif",
              transition: "color 0.15s",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 3,
              borderTop: activeTab === tab.id ? "2px solid #000000" : "2px solid transparent",
            }}
          >
            <span style={{ fontSize: 18, lineHeight: 1 }}>{tab.icon}</span>
            <span style={{
              fontSize: 9,
              fontWeight: activeTab === tab.id ? 700 : 400,
              letterSpacing: "0.3px",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              maxWidth: "100%",
            }}>
              {tab.label}
            </span>
          </button>
        ))}
      </motion.div>

      {/* CSS to toggle nav tabs / bottom bar by breakpoint */}
      <style>{`
        @media (min-width: 640px) {
          .mobile-tabs { display: none !important; }
          .desktop-tabs { display: flex !important; }
          .main-content { padding: 64px 32px 96px !important; }
        }
        @media (max-width: 639px) {
          .mobile-tabs { display: flex !important; }
          .desktop-tabs { display: none !important; }
          .main-content { padding: 24px 14px 100px !important; }
        }
      `}</style>

      {/* Hero — renders immediately with static calendar, updates when results arrive */}
      <Hero playedMatches={playedMatches} totalMatches={totalMatches} groups={groups} />

      {/* Day navigation — only for match-list tabs */}
      {!["standings", "bracket"].includes(activeTab) && (
        <DayNav
          dates={allDates}
          selected={selectedDate}
          onSelect={setSelectedDate}
        />
      )}

      {/* Main */}
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 16px 140px" }} className="main-content">

        {/* Subtle top bar shown while fetching results in background */}
        {fetching && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              marginBottom: 32, padding: "10px 16px",
              backgroundColor: "#f7f7f5", borderRadius: 8,
              border: "1px solid #e6e6e6",
            }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
              style={{ width: 14, height: 14, border: "2px solid #e6e6e6", borderTop: "2px solid #000", borderRadius: "50%", flexShrink: 0 }}
            />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.6px", textTransform: "uppercase", color: "#595959" }}>
              Actualizando resultados…
            </span>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              backgroundColor: "#f7f7f5", border: "1px solid #e6e6e6",
              borderRadius: 24, padding: 48, textAlign: "center",
            }}
          >
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, letterSpacing: "0.6px", textTransform: "uppercase", color: "#000000", opacity: 0.4, margin: "0 0 8px" }}>
              Error al cargar
            </p>
            <p style={{ fontSize: 16, color: "#000000", margin: 0 }}>{error}</p>
          </motion.div>
        )}

        {!error && activeTab === "standings" && (
          <GroupStandingsView standings={standings} />
        )}

        {!error && activeTab === "bracket" && (
          <BracketView rounds={rounds} />
        )}

        {!error && activeTab !== "standings" && activeTab !== "bracket" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 64 }}>
            {filtered.map((round, i) => (
              <RoundSection key={round.name} round={round} index={i} />
            ))}
            {filtered.length === 0 && (
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, letterSpacing: "0.6px", textTransform: "uppercase", color: "#000000", opacity: 0.3, textAlign: "center", paddingTop: 80 }}>
                No hay partidos en esta categoría
              </p>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        backgroundColor: "#ffffff",
        borderTop: "1px solid #e6e6e6",
        padding: "32px",
        textAlign: "center",
      }}>
        <p style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11, letterSpacing: "0.6px",
          textTransform: "uppercase", color: "#767676", margin: 0,
        }}>
          Datos: openfootball/worldcup.json · Resultados actualizados cada día a las 08:00h · FIFA World Cup 2026
        </p>
      </footer>
    </div>
  );
}
