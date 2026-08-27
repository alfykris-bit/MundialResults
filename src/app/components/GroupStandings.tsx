import { motion } from "motion/react";
import { GroupStandings, TeamStat, GROUPS } from "./useStandings";

interface Props {
  standings: GroupStandings;
}

const COUNTRY_CODES: Record<string, string> = {
  "Mexico":"mx","South Africa":"za","South Korea":"kr","Czech Republic":"cz",
  "Canada":"ca","Bosnia & Herzegovina":"ba","Qatar":"qa","Switzerland":"ch",
  "Brazil":"br","Morocco":"ma","Haiti":"ht","Scotland":"gb-sct",
  "USA":"us","Paraguay":"py","Australia":"au","Turkey":"tr",
  "Germany":"de","Curaçao":"cw","Ivory Coast":"ci","Ecuador":"ec",
  "Netherlands":"nl","Japan":"jp","Sweden":"se","Tunisia":"tn",
  "Belgium":"be","Egypt":"eg","Iran":"ir","New Zealand":"nz",
  "Spain":"es","Cape Verde":"cv","Saudi Arabia":"sa","Uruguay":"uy",
  "France":"fr","Senegal":"sn","Iraq":"iq","Norway":"no",
  "Argentina":"ar","Algeria":"dz","Austria":"at","Jordan":"jo",
  "Portugal":"pt","DR Congo":"cd","Uzbekistan":"uz","Colombia":"co",
  "England":"gb-eng","Croatia":"hr","Ghana":"gh","Panama":"pa",
};

function flagUrl(name: string) {
  const code = COUNTRY_CODES[name];
  return code ? `https://flagcdn.com/48x36/${code}.png` : null;
}

const C = {
  ink:      "#000000",
  secondary:"#3d3d3d",
  muted:    "#595959",
  subtle:   "#767676",
  surface:  "#f7f7f5",
  hairline: "#e6e6e6",
};

const BLOCK_COLORS = [
  "#dceeb1","#c5b0f4","#c8e6cd","#f3c9b6",
  "#efd4d4","#f4ecd6","#dceeb1","#c5b0f4",
  "#c8e6cd","#f3c9b6","#efd4d4","#f4ecd6",
];

// World Cup 2026: top 2 from each group qualify directly (24 teams).
// The 8 best third-placed teams (out of 12) also advance (8 teams).
// Total: 32 teams advance to Round of 32.
function rowBg(pos: number, hasPlayed: boolean): string {
  if (!hasPlayed) return "transparent";
  if (pos === 0) return "rgba(34,197,94,0.10)";   // 1st — direct
  if (pos === 1) return "rgba(34,197,94,0.05)";   // 2nd — direct
  if (pos === 2) return "rgba(234,179,8,0.07)";   // 3rd — possible (8 best)
  return "transparent";
}

function QualBadge({ pos, played }: { pos: number; played: number }) {
  if (played === 0) return null;
  if (pos === 0) return (
    <span style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9, letterSpacing: "0.5px", textTransform: "uppercase",
      backgroundColor: "#22c55e", color: "#fff",
      padding: "2px 6px", borderRadius: 4, flexShrink: 0,
    }}>1º</span>
  );
  if (pos === 1) return (
    <span style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9, letterSpacing: "0.5px", textTransform: "uppercase",
      backgroundColor: "#86efac", color: "#14532d",
      padding: "2px 6px", borderRadius: 4, flexShrink: 0,
    }}>2º</span>
  );
  if (pos === 2) return (
    <span style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 9, letterSpacing: "0.5px", textTransform: "uppercase",
      backgroundColor: "#fef08a", color: "#713f12",
      padding: "2px 6px", borderRadius: 4, flexShrink: 0,
    }}>3º?</span>
  );
  return null;
}

function StatCell({ value, bold }: { value: number | string; bold?: boolean }) {
  return (
    <td style={{
      textAlign: "center",
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12, color: bold ? C.ink : C.muted,
      fontWeight: bold ? 700 : 400,
      padding: "10px 6px",
      width: 32,
    }}>
      {value}
    </td>
  );
}

function GroupCard({ group, teams, blockColor, index }: {
  group: string;
  teams: TeamStat[];
  blockColor: string;
  index: number;
}) {
  const anyPlayed = teams.some((t) => t.played > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.25), ease: [0.16, 1, 0.3, 1] }}
      style={{
        backgroundColor: "#ffffff",
        border: `1px solid ${C.hairline}`,
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      {/* Group header */}
      <div style={{
        backgroundColor: blockColor,
        padding: "14px 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 15, fontWeight: 700, letterSpacing: -0.3,
          color: "#000000",
        }}>
          {group}
        </span>
        {anyPlayed && (
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9, letterSpacing: "0.6px", textTransform: "uppercase",
            color: "rgba(0,0,0,0.45)",
          }}>
            {teams.reduce((s, t) => s + t.played, 0) / 2} partidos
          </span>
        )}
      </div>

      {/* Table — scrollable on mobile */}
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" as any }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 320 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${C.hairline}` }}>
              <th style={{
                textAlign: "left", padding: "8px 14px",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 9, letterSpacing: "0.6px", textTransform: "uppercase",
                color: C.subtle, fontWeight: 400,
                position: "sticky", left: 0, backgroundColor: "#ffffff",
                zIndex: 1,
              }}>
                Equipo
              </th>
              {/* J G E P hidden on very small screens, shown from 380px+ */}
              {[
                { h: "J",   hide: false },
                { h: "G",   hide: false },
                { h: "E",   hide: false },
                { h: "P",   hide: false },
                { h: "GF",  hide: false },
                { h: "GC",  hide: false },
                { h: "DG",  hide: false },
                { h: "Pts", hide: false },
              ].map(({ h }) => (
                <th key={h} style={{
                  textAlign: "center", padding: "8px 6px",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: 9, letterSpacing: "0.6px", textTransform: "uppercase",
                  color: h === "Pts" ? C.ink : C.subtle,
                  fontWeight: h === "Pts" ? 700 : 400,
                  width: h === "Pts" ? 36 : 28,
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teams.map((team, pos) => {
              const flag = flagUrl(team.team);
              return (
                <tr
                  key={team.team}
                  style={{
                    backgroundColor: rowBg(pos, team.played),
                    borderBottom: pos < teams.length - 1 ? `1px solid ${C.hairline}` : "none",
                    transition: "background-color 0.15s",
                  }}
                >
                  {/* Team name — sticky on mobile so it doesn't scroll away */}
                  <td style={{
                    padding: "9px 14px",
                    position: "sticky", left: 0,
                    backgroundColor: rowBg(pos, team.played) !== "transparent"
                      ? rowBg(pos, team.played) : "#ffffff",
                    zIndex: 1,
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: 9, color: C.subtle, width: 10, textAlign: "right", flexShrink: 0,
                      }}>
                        {pos + 1}
                      </span>
                      {flag
                        ? <img src={flag} alt={team.team}
                            style={{ width: 18, height: 14, objectFit: "cover", borderRadius: 2, flexShrink: 0 }}
                            onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                          />
                        : <div style={{ width: 18, height: 14, backgroundColor: C.surface, borderRadius: 2, flexShrink: 0 }} />
                      }
                      <span style={{
                        fontFamily: "Inter, sans-serif",
                        fontSize: 12, fontWeight: pos < 2 && team.played > 0 ? 600 : 400,
                        color: pos < 2 && team.played > 0 ? C.ink : C.secondary,
                        whiteSpace: "nowrap",
                      }}>
                        {team.team}
                      </span>
                      <QualBadge pos={pos} played={team.played} />
                    </div>
                  </td>
                  <StatCell value={team.played} />
                  <StatCell value={team.won} />
                  <StatCell value={team.drawn} />
                  <StatCell value={team.lost} />
                  <StatCell value={team.gf} />
                  <StatCell value={team.ga} />
                  <StatCell value={team.gd > 0 ? `+${team.gd}` : team.gd} />
                  <StatCell value={team.pts} bold />
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Legend — only when matches played */}
      {anyPlayed && (
        <div style={{
          padding: "8px 20px",
          borderTop: `1px solid ${C.hairline}`,
          display: "flex", gap: 14, flexWrap: "wrap",
          alignItems: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: "#22c55e", opacity: 0.6 }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.subtle, letterSpacing: "0.4px" }}>
              Clasificado directo
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: "#eab308", opacity: 0.5 }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, color: C.subtle, letterSpacing: "0.4px" }}>
              Posible mejor 3º
            </span>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export function GroupStandingsView({ standings }: Props) {
  const groupNames = Object.keys(GROUPS);

  return (
    <div>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginBottom: 32 }}
      >
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 11, letterSpacing: "0.6px", textTransform: "uppercase",
          color: C.muted, display: "block", marginBottom: 8,
        }}>
          Fase de Grupos · 12 grupos
        </span>
        <h2 style={{
          fontFamily: "Inter, sans-serif",
          fontSize: "clamp(24px, 4vw, 40px)",
          fontWeight: 300, letterSpacing: -1.5, lineHeight: 1.1,
          color: C.ink, margin: "0 0 8px",
        }}>
          Clasificación
        </h2>
        <p style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 13, color: C.muted, margin: 0, lineHeight: 1.5,
        }}>
          Se clasifican los <strong style={{ color: C.secondary }}>2 primeros de cada grupo</strong> (24 equipos) más los <strong style={{ color: C.secondary }}>8 mejores terceros</strong> de los 12 grupos. Total: 32 equipos pasan al Round of 32.
        </p>
      </motion.div>

      {/* Column headers legend */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        style={{
          display: "flex", gap: 16, flexWrap: "wrap",
          marginBottom: 24, paddingBottom: 16,
          borderBottom: `1px solid ${C.hairline}`,
        }}
      >
        {[
          ["J", "Jugados"], ["G", "Ganados"], ["E", "Empatados"],
          ["P", "Perdidos"], ["GF", "Goles a favor"], ["GC", "Goles en contra"],
          ["DG", "Diferencia de goles"], ["Pts", "Puntos"],
        ].map(([abbr, full]) => (
          <span key={abbr} style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 10, color: C.subtle, letterSpacing: "0.3px",
          }}>
            <strong style={{ color: C.muted }}>{abbr}</strong> = {full}
          </span>
        ))}
      </motion.div>

      {/* Grid of group tables */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 480px), 1fr))",
        gap: 16,
      }}>
        {groupNames.map((group, i) => (
          <GroupCard
            key={group}
            group={group}
            teams={standings[group] ?? []}
            blockColor={BLOCK_COLORS[i % BLOCK_COLORS.length]}
            index={i}
          />
        ))}
      </div>
    </div>
  );
}
