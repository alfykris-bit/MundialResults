import React from "react";
import { motion } from "motion/react";
import { Round, Match } from "./useWorldCupData";
import { buildSlotResolver, ResolvedSlot, SlotStatus } from "./useBracketResolver";

interface Props {
  rounds: Round[];
}

// ─── Bracket tree (hardcoded from FIFA WC 2026 bracket structure) ─────────────
//
// Match numbering: group stage = 1-72, then:
//   R32:  73-88  (16 matches) → produce W73-W88
//   R16:  89-96  (8 matches)  → produce W89-W96
//   QF:   97-100 (4 matches)  → produce W97-W100
//   SF:   101-102(2 matches)  → produce W101-W102
//   Final: 103
//
// Left half (→ SF-1 via QF-1 + QF-2):
//   R16-1(W89): R32-2(W74) vs R32-5(W77)
//   R16-2(W90): R32-1(W73) vs R32-3(W75)
//   R16-5(W93): R32-11(W83) vs R32-12(W84)
//   R16-6(W94): R32-9(W81) vs R32-10(W82)
//
// Right half (→ SF-2 via QF-3 + QF-4):
//   R16-3(W91): R32-4(W76) vs R32-6(W78)
//   R16-4(W92): R32-7(W79) vs R32-8(W80)
//   R16-7(W95): R32-14(W86) vs R32-16(W88)
//   R16-8(W96): R32-13(W85) vs R32-15(W87)

// Column order for left side (top → bottom):
const LEFT_R32  = ["R32-2","R32-5","R32-1","R32-3","R32-11","R32-12","R32-9","R32-10"];
const LEFT_R16  = ["R16-1","R16-2","R16-5","R16-6"];
const LEFT_QF   = ["QF-1","QF-2"];
const LEFT_SF   = ["SF-1"];

// Column order for right side (top → bottom):
const RIGHT_R32 = ["R32-4","R32-6","R32-7","R32-8","R32-14","R32-16","R32-13","R32-15"];
const RIGHT_R16 = ["R16-3","R16-4","R16-7","R16-8"];
const RIGHT_QF  = ["QF-3","QF-4"];
const RIGHT_SF  = ["SF-2"];

const FINAL_IDS = ["FIN"];
const THIRD_ID  = "3RD";

// ─── Lookup helpers ───────────────────────────────────────────────────────────

function buildMatchMap(rounds: Round[]): Map<string, Match> {
  const map = new Map<string, Match>();
  for (const r of rounds) {
    for (const m of r.matches) {
      map.set(m.id, m);
    }
  }
  return map;
}

// ─── Design tokens ────────────────────────────────────────────────────────────

const C = {
  ink:       "#000000",
  secondary: "#3d3d3d",
  muted:     "#595959",
  subtle:    "#767676",
  surface:   "#f7f7f5",
  hairline:  "#e6e6e6",
  winner:    "#000000",
  connector: "#d4d4d4",
};

const ROUND_LABELS: Record<string, string> = {
  r32: "Round of 32",
  r16: "Octavos",
  qf:  "Cuartos",
  sf:  "Semifinal",
  fin: "Final",
};

const SLOT_H = 84;   // px — height of one R32 slot (card + gap)
const CARD_H = 72;   // px — visible card height (taller for 2-line team rows)
const COL_W  = 168;  // px — width of each match column
const CON_W  = 24;   // px — width of connector between columns

// ─── Match card slot ─────────────────────────────────────────────────────────

const CODES: Record<string, string> = {
  "Mexico":"mx","South Africa":"za","South Korea":"kr","Czech Republic":"cz",
  "Canada":"ca","Bosnia & Herzegovina":"ba","Qatar":"qa","Switzerland":"ch",
  "Brazil":"br","Morocco":"ma","Haiti":"ht","Scotland":"gb-sct","USA":"us",
  "Paraguay":"py","Australia":"au","Turkey":"tr","Germany":"de","Curaçao":"cw",
  "Ivory Coast":"ci","Ecuador":"ec","Netherlands":"nl","Japan":"jp","Sweden":"se",
  "Tunisia":"tn","Belgium":"be","Egypt":"eg","Iran":"ir","New Zealand":"nz",
  "Spain":"es","Cape Verde":"cv","Saudi Arabia":"sa","Uruguay":"uy","France":"fr",
  "Senegal":"sn","Iraq":"iq","Norway":"no","Argentina":"ar","Algeria":"dz",
  "Austria":"at","Jordan":"jo","Portugal":"pt","DR Congo":"cd","Uzbekistan":"uz",
  "Colombia":"co","England":"gb-eng","Croatia":"hr","Ghana":"gh","Panama":"pa",
};

function Flag({ name }: { name: string }) {
  const code = CODES[name];
  if (!code) return null;
  return (
    <img
      src={`https://flagcdn.com/48x36/${code}.png`}
      alt={name}
      style={{ width: 16, height: 12, objectFit: "cover", borderRadius: 1, flexShrink: 0 }}
      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
    />
  );
}

// status colours:
//   confirmed  → solid black text, flag shown
//   provisional → dark grey + dashed underline (changes possible)
//   tbd         → mono placeholder, very muted

const STATUS_STYLE: Record<SlotStatus, React.CSSProperties> = {
  confirmed:   { color: C.secondary,  fontFamily: "Inter, sans-serif",             fontStyle: "normal",  opacity: 1 },
  provisional: { color: C.secondary,  fontFamily: "Inter, sans-serif",             fontStyle: "italic",  opacity: 0.75 },
  tbd:         { color: C.subtle,     fontFamily: "'JetBrains Mono', monospace",   fontStyle: "normal",  opacity: 1 },
};

const POS_LABEL: Record<number, string> = { 1: "1º", 2: "2º", 3: "3º" };

function TeamRow({
  resolved, score, pen, isWinner, isPlayed,
}: {
  resolved: ResolvedSlot; score: number | null; pen: number | null;
  isWinner: boolean; isPlayed: boolean;
}) {
  const { team, status, position, group } = resolved;
  const showFlag = status !== "tbd";
  const winnerActive = isWinner && isPlayed;

  // e.g. "1º · Gr. A"
  const badge = position && group
    ? `${POS_LABEL[position] ?? `${position}º`} · ${group.replace("Group ", "Gr. ")}`
    : null;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 5,
      padding: "4px 8px",
      backgroundColor: winnerActive ? "#000000" : "transparent",
      borderRadius: 4,
      transition: "background-color 0.2s",
      minHeight: 26,
    }}>
      {showFlag && <Flag name={team} />}

      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 1 }}>
        <span style={{
          fontSize: 11,
          fontWeight: winnerActive ? 600 : 400,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          letterSpacing: status === "tbd" ? "0.3px" : 0,
          lineHeight: 1.2,
          ...(winnerActive
            ? { color: "#ffffff", fontFamily: "Inter, sans-serif", fontStyle: "normal", opacity: 1 }
            : STATUS_STYLE[status]
          ),
        }}>
          {team || "—"}
        </span>

        {/* Position + group badge — only when not winner highlight */}
        {badge && !winnerActive && (
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 8, letterSpacing: "0.4px",
            color: status === "provisional" ? "#eab308" : C.subtle,
            lineHeight: 1,
          }}>
            {badge}
          </span>
        )}
      </div>

      {isPlayed && score !== null && (
        <div style={{ display: "flex", alignItems: "baseline", gap: 2, flexShrink: 0 }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 12, fontWeight: 700,
            color: winnerActive ? "#ffffff" : C.muted,
            minWidth: 12, textAlign: "right",
          }}>
            {score}
          </span>
          {pen !== null && (
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9, fontWeight: isWinner ? 700 : 400,
              color: winnerActive ? "rgba(255,255,255,0.7)" : C.subtle,
            }}>
              ({pen})
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function MatchCard({
  match, resolve, highlight = false,
}: {
  match: Match | undefined;
  resolve: (slot: string) => ResolvedSlot;
  highlight?: boolean;
}) {
  if (!match) {
    return (
      <div style={{
        height: CARD_H, backgroundColor: C.surface,
        border: `1px solid ${C.hairline}`, borderRadius: 8,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9, color: C.subtle, letterSpacing: "0.5px", textTransform: "uppercase",
        }}>
          Por determinar
        </span>
      </div>
    );
  }

  const played   = Array.isArray(match.score);
  const [g1, g2] = played ? (match.score as [number, number]) : [null, null];
  const hasPens  = Array.isArray(match.penalties);
  const [p1, p2] = hasPens ? (match.penalties as [number, number]) : [null, null];
  const isAet    = match.aet === true;
  const draw     = played && g1 === g2 && !hasPens;
  const hw = played && (hasPens ? p1! > p2! : g1! > g2!);
  const aw = played && (hasPens ? p2! > p1! : g2! > g1!);

  const r1 = resolve(match.team1);
  const r2 = resolve(match.team2);
  const hasProvisional = !played && (r1.status === "provisional" || r2.status === "provisional");

  return (
    <div style={{
      height: CARD_H,
      backgroundColor: "#ffffff",
      border: `1px solid ${highlight ? "#000000" : C.hairline}`,
      borderRadius: 8,
      overflow: "hidden",
      display: "flex", flexDirection: "column",
      justifyContent: "space-between",
      boxShadow: highlight ? "0 2px 12px rgba(0,0,0,0.1)" : "none",
      position: "relative",
      transition: "box-shadow 0.15s",
    }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.08)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = highlight ? "0 2px 12px rgba(0,0,0,0.1)" : "none"; }}
    >
      <TeamRow resolved={r1} score={g1} pen={p1} isWinner={hw || draw} isPlayed={played} />
      <div style={{ height: 1, backgroundColor: C.hairline, margin: "0 8px" }} />
      <TeamRow resolved={r2} score={g2} pen={p2} isWinner={aw || draw} isPlayed={played} />
      {hasPens && (
        <div style={{ textAlign: "center", padding: "2px 0 3px" }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 7, letterSpacing: "0.5px", textTransform: "uppercase", color: C.subtle }}>
            pen.
          </span>
        </div>
      )}
      {isAet && !hasPens && (
        <div style={{ textAlign: "center", padding: "2px 0 3px" }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 7, letterSpacing: "0.5px", textTransform: "uppercase", color: C.subtle }}>
            a.e.t.
          </span>
        </div>
      )}

      {/* Provisional dot */}
      {hasProvisional && (
        <div title="Clasificación provisional" style={{
          position: "absolute", top: 4, right: 5,
          width: 5, height: 5, borderRadius: "50%",
          backgroundColor: "#eab308",
        }} />
      )}
    </div>
  );
}

// ─── Connector lines between columns ─────────────────────────────────────────
// Geometry (for a pair of height pairH):
//   - first card center  = pairH / 4  (slot height = pairH/2, card centered in it)
//   - second card center = 3 * pairH / 4
//   - junction (→ next round card center) = pairH / 2
//
// marginTop: 32 aligns the connector with column content, skipping the
// label area (height:24 + marginBottom:8 = 32px) present in BracketColumn.

function Connectors({ count, side }: { count: number; side: "left" | "right" }) {
  const pairH = SLOT_H * (8 / count);

  return (
    <div style={{ width: CON_W, marginTop: 32, flexShrink: 0 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ height: pairH, position: "relative" }}>
          {/* Vertical line: connects first card center → second card center */}
          <div style={{
            position: "absolute",
            [side === "left" ? "right" : "left"]: 0,
            top: pairH / 4,
            width: 1,
            height: pairH / 2,   // from pairH/4 to 3*pairH/4
            backgroundColor: C.connector,
          }} />
          {/* Horizontal junction: full width at midpoint → connects to next round */}
          <div style={{
            position: "absolute",
            left: 0,
            top: pairH / 2,
            width: CON_W,
            height: 1,
            backgroundColor: C.connector,
          }} />
        </div>
      ))}
    </div>
  );
}

// ─── A column of match cards with correct vertical spacing ────────────────────

function BracketColumn({
  ids, matchMap, resolve, label, slotMultiplier, highlight = false,
}: {
  ids: string[];
  matchMap: Map<string, Match>;
  resolve: (slot: string) => ResolvedSlot;
  label: string;
  slotMultiplier: number;
  highlight?: boolean;
}) {
  const slotH = SLOT_H * slotMultiplier;

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ height: 24, display: "flex", alignItems: "center", marginBottom: 8 }}>
        <span style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: 9, letterSpacing: "0.6px", textTransform: "uppercase", color: C.subtle,
        }}>
          {label}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        {ids.map((id) => (
          <div key={id} style={{ height: slotH, display: "flex", alignItems: "center", width: COL_W }}>
            <div style={{ width: "100%" }}>
              <MatchCard match={matchMap.get(id)} resolve={resolve} highlight={highlight} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Center piece: Final + 3rd place ─────────────────────────────────────────

function CenterColumn({ matchMap, resolve }: { matchMap: Map<string, Match>; resolve: (s: string) => ResolvedSlot }) {
  const totalH = SLOT_H * 8;

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ height: 24 + 8 }} /> {/* align with columns */}
      <div style={{
        height: totalH,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        gap: 24, width: COL_W + 32,
      }}>
        {/* Final */}
        <div style={{ width: "100%", textAlign: "center" }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9, letterSpacing: "0.6px", textTransform: "uppercase",
            color: C.muted, display: "block", marginBottom: 8,
          }}>
            Final · 19 jul
          </span>
          <MatchCard match={matchMap.get("FIN")} resolve={resolve} highlight />
        </div>

        {/* 3rd place */}
        <div style={{ width: "100%", textAlign: "center" }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 9, letterSpacing: "0.6px", textTransform: "uppercase",
            color: C.subtle, display: "block", marginBottom: 8,
          }}>
            3.er puesto · 18 jul
          </span>
          <MatchCard match={matchMap.get("3RD")} resolve={resolve} />
        </div>
      </div>
    </div>
  );
}

// ─── Full bracket view ────────────────────────────────────────────────────────

export function BracketView({ rounds }: Props) {
  const matchMap = buildMatchMap(rounds);
  const resolve  = buildSlotResolver(rounds);

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
          Fase Eliminatoria
        </span>
        <h2 style={{
          fontFamily: "Inter, sans-serif",
          fontSize: "clamp(24px, 4vw, 40px)",
          fontWeight: 300, letterSpacing: -1.5, lineHeight: 1.1,
          color: C.ink, margin: "0 0 8px",
        }}>
          Cuadro de Eliminatorias
        </h2>
        <p style={{
          fontFamily: "Inter, sans-serif",
          fontSize: 13, color: C.muted, margin: 0,
        }}>
          32 equipos · Round of 32 → Round of 16 → Cuartos → Semis → Final
        </p>
      </motion.div>

      {/* Scrollable bracket */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        style={{
          overflowX: "auto",
          overflowY: "hidden",
          WebkitOverflowScrolling: "touch" as any,
          paddingBottom: 16,
          /* subtle scroll hint on mobile */
          maskImage: "linear-gradient(to right, transparent 0, black 16px, black calc(100% - 16px), transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0, black 16px, black calc(100% - 16px), transparent 100%)",
        }}
      >
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 0,
          minWidth: "max-content",
          padding: "0 16px",
        }}>
          {/* LEFT: R32 */}
          <BracketColumn ids={LEFT_R32}  matchMap={matchMap} resolve={resolve} label={ROUND_LABELS.r32} slotMultiplier={1} />
          <Connectors count={4} side="left" />
          <BracketColumn ids={LEFT_R16}  matchMap={matchMap} resolve={resolve} label={ROUND_LABELS.r16} slotMultiplier={2} />
          <Connectors count={2} side="left" />
          <BracketColumn ids={LEFT_QF}   matchMap={matchMap} resolve={resolve} label={ROUND_LABELS.qf}  slotMultiplier={4} />
          <Connectors count={1} side="left" />
          <BracketColumn ids={LEFT_SF}   matchMap={matchMap} resolve={resolve} label={ROUND_LABELS.sf}  slotMultiplier={8} />
          <Connectors count={1} side="left" />

          {/* CENTER */}
          <CenterColumn matchMap={matchMap} resolve={resolve} />

          <Connectors count={1} side="right" />
          <BracketColumn ids={RIGHT_SF}  matchMap={matchMap} resolve={resolve} label={ROUND_LABELS.sf}  slotMultiplier={8} />
          <Connectors count={1} side="right" />
          <BracketColumn ids={RIGHT_QF}  matchMap={matchMap} resolve={resolve} label={ROUND_LABELS.qf}  slotMultiplier={4} />
          <Connectors count={2} side="right" />
          <BracketColumn ids={RIGHT_R16} matchMap={matchMap} resolve={resolve} label={ROUND_LABELS.r16} slotMultiplier={2} />
          <Connectors count={4} side="right" />
          <BracketColumn ids={RIGHT_R32} matchMap={matchMap} resolve={resolve} label={ROUND_LABELS.r32} slotMultiplier={1} />
        </div>
      </motion.div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.hairline}` }}>
        {[
          { dot: "#000000", label: "Confirmado — partido jugado" },
          { dot: "#595959", label: "Confirmado — grupo terminado", italic: true },
          { dot: "#eab308", label: "Provisional — clasificación en curso", italic: true },
          { dot: C.hairline, label: "Por determinar", border: true },
        ].map(({ dot, label, italic, border }) => (
          <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: dot, border: border ? `1px solid ${C.subtle}` : "none", flexShrink: 0 }} />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 9,
              letterSpacing: "0.4px", color: C.subtle,
              fontStyle: italic ? "italic" : "normal",
            }}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Mobile scroll hint */}
      <p style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 9, letterSpacing: "0.5px", textTransform: "uppercase",
        color: C.subtle, textAlign: "center", marginTop: 12,
      }}>
        ← desliza para ver el cuadro completo →
      </p>
    </div>
  );
}
