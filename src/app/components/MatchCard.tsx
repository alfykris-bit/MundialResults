import { Match, GoalEvent } from "./useWorldCupData";

interface Props {
  match: Match;
}

const C = {
  ink:       "#000000",
  secondary: "#3d3d3d",  // 10.7:1 WCAG AA
  muted:     "#595959",  // 7.0:1  WCAG AA
  subtle:    "#767676",  // 4.5:1  WCAG AA
  surface:   "#f7f7f5",
  hairline:  "#e6e6e6",
  hairlineS: "#f1f1f1",
};

const COUNTRY_CODES: Record<string, string> = {
  "Mexico":"mx","South Africa":"za","South Korea":"kr","Czech Republic":"cz",
  "Canada":"ca","Bosnia & Herzegovina":"ba","United States":"us","Australia":"au",
  "Argentina":"ar","Brazil":"br","France":"fr","Germany":"de","Spain":"es",
  "Portugal":"pt","England":"gb-eng","Netherlands":"nl","Belgium":"be",
  "Croatia":"hr","Morocco":"ma","Japan":"jp","Senegal":"sn","Ecuador":"ec",
  "Uruguay":"uy","Ghana":"gh","Cameroon":"cm","Serbia":"rs","Switzerland":"ch",
  "Denmark":"dk","Tunisia":"tn","Poland":"pl","Qatar":"qa","Iran":"ir",
  "Saudi Arabia":"sa","Wales":"gb-wls","Costa Rica":"cr","Colombia":"co",
  "Peru":"pe","Chile":"cl","Venezuela":"ve","Panama":"pa","Honduras":"hn",
  "Jamaica":"jm","Nigeria":"ng","Egypt":"eg","Algeria":"dz","Mali":"ml",
  "Turkey":"tr","Ukraine":"ua","Slovakia":"sk","Hungary":"hu","Romania":"ro",
  "Greece":"gr","Scotland":"gb-sct","Ireland":"ie","Norway":"no","Sweden":"se",
  "Finland":"fi","Austria":"at","Italy":"it","New Zealand":"nz","Cuba":"cu",
  "Bolivia":"bo","Paraguay":"py","United Arab Emirates":"ae","Indonesia":"id",
  "China":"cn","Uzbekistan":"uz","Palestine":"ps","Slovenia":"si","Albania":"al",
  "North Macedonia":"mk","Georgia":"ge","El Salvador":"sv","Guatemala":"gt",
  "Trinidad & Tobago":"tt","USA":"us","Suriname":"sr","Iceland":"is",
  "Kosovo":"xk","Montenegro":"me","Kazakhstan":"kz","Vietnam":"vn",
  "Iraq":"iq","Jordan":"jo","Oman":"om","Kuwait":"kw","Bahrain":"bh",
  "Lebanon":"lb","Cape Verde":"cv","Burkina Faso":"bf","Benin":"bj",
  "Rwanda":"rw","Zambia":"zm","Zimbabwe":"zw","Togo":"tg","Haiti":"ht",
  "Ivory Coast":"ci","Curaçao":"cw","DR Congo":"cd",
};

function flagUrl(name: string) {
  const code = COUNTRY_CODES[name];
  return code ? `https://flagcdn.com/48x36/${code}.png` : null;
}

function formatDate(dateStr: string) {
  if (!dateStr) return { weekday: "", date: "" };
  const d = new Date(dateStr + "T12:00:00Z");
  return {
    weekday: d.toLocaleDateString("es-ES", { weekday: "short" }).replace(".", ""),
    date: d.toLocaleDateString("es-ES", { day: "2-digit", month: "short" }),
  };
}

// Single scorer line — always one line, truncated if needed
function GoalLine({ goal, align }: { goal: GoalEvent; align: "left" | "right" }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 4,
      flexDirection: align === "right" ? "row-reverse" : "row",
      width: "100%",
      overflow: "hidden",
    }}>
      <span style={{ fontSize: 11, flexShrink: 0, lineHeight: 1 }}>⚽</span>
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11, color: C.muted, flexShrink: 0, // #595959 = 7.0:1 ✓
      }}>
        {goal.minute}'
      </span>
      <span style={{
        fontFamily: "Inter, sans-serif",
        fontSize: 12, color: C.secondary,            // #3d3d3d = 10.7:1 ✓
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        minWidth: 0,
      }}>
        {goal.name}
      </span>
    </div>
  );
}

export function MatchCard({ match }: Props) {
  const played   = Array.isArray(match.score);
  const [g1, g2] = played ? (match.score as [number, number]) : [null, null];
  const hasPens  = Array.isArray(match.penalties);
  const [p1, p2] = hasPens ? (match.penalties as [number, number]) : [null, null];
  const isAet    = match.aet === true;
  // Winner: penalties > score (ET or FT)
  const homeWins = played && (hasPens ? p1! > p2! : g1! > g2!);
  const awayWins = played && (hasPens ? p2! > p1! : g2! > g1!);
  const draw     = played && !hasPens && g1 === g2;
  const hasGoals = (match.goals1?.length ?? 0) > 0 || (match.goals2?.length ?? 0) > 0;

  const { weekday, date } = formatDate(match.date);
  const timeClean = match.time?.replace(/\s*UTC.*/i, "").trim() ?? "";
  const flagHome  = flagUrl(match.team1);
  const flagAway  = flagUrl(match.team2);

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 8,
        border: `1px solid ${C.hairline}`,
        overflow: "hidden",
        fontFamily: "Inter, sans-serif",
        transition: "box-shadow 0.15s",
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 16px rgba(0,0,0,0.06)"; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "none"; }}
    >
      {/* ── Main row ─────────────────────────────────────────── */}
      <div style={{
        padding: "12px 14px",
        display: "grid",
        gridTemplateColumns: "52px 1px minmax(0,1fr) 60px minmax(0,1fr)",
        alignItems: "center",
        gap: "0 8px",
      }}>

        {/* Date */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11, letterSpacing: "0.4px",       // 11px min, #595959 = 7.0:1 ✓
            textTransform: "uppercase", color: C.muted,
          }}>
            {weekday}
          </span>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.ink, lineHeight: 1.2, textAlign: "center" }}>
            {date}
          </span>
          {timeClean && (
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: C.muted }}>
              {timeClean}
            </span>
          )}
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 28, backgroundColor: C.hairline, flexShrink: 0 }} />

        {/* Home team — right-aligned so it sits above the home scorers */}
        <div style={{
          display: "flex", alignItems: "center", gap: 5,
          justifyContent: "flex-end", flexDirection: "row", minWidth: 0,
        }}>
          <span style={{
            fontSize: 14, fontWeight: homeWins ? 600 : 400,
            color: homeWins ? C.ink : C.secondary,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0,
            textAlign: "right",
          }}>
            {match.team1}
          </span>
          {flagHome
            ? <img src={flagHome} alt={match.team1}
                style={{ width: 20, height: 15, objectFit: "cover", borderRadius: 2, flexShrink: 0 }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            : <div style={{ width: 20, height: 15, backgroundColor: C.surface, borderRadius: 2, flexShrink: 0 }} />
          }
        </div>

        {/* Score */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, flexDirection: "column", gap: 1 }}>
          {played ? (
            <>
              <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
                {/* Home: ft (pen) */}
                <div style={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                  <span style={{ fontSize: 18, lineHeight: 1, fontWeight: homeWins ? 600 : 300, color: C.ink }}>
                    {g1}
                  </span>
                  {hasPens && (
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: homeWins ? 700 : 400, color: homeWins ? C.ink : C.muted }}>
                      ({p1})
                    </span>
                  )}
                </div>
                <span style={{ fontSize: 11, color: C.subtle }}>–</span>
                {/* Away: (pen) ft */}
                <div style={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                  {hasPens && (
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: awayWins ? 700 : 400, color: awayWins ? C.ink : C.muted }}>
                      ({p2})
                    </span>
                  )}
                  <span style={{ fontSize: 18, lineHeight: 1, fontWeight: awayWins ? 600 : 300, color: C.ink }}>
                    {g2}
                  </span>
                </div>
              </div>
              {hasPens && (
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.5px", textTransform: "uppercase", color: C.muted }}>
                  pen.
                </span>
              )}
              {isAet && !hasPens && (
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: "0.5px", textTransform: "uppercase", color: C.muted }}>
                  a.e.t.
                </span>
              )}
            </>
          ) : (
            <span style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11, letterSpacing: "0.5px", color: C.muted,
              backgroundColor: C.surface, padding: "3px 8px",
              borderRadius: 50, textTransform: "uppercase", whiteSpace: "nowrap",
            }}>
              vs
            </span>
          )}
        </div>

        {/* Away team */}
        <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
          {flagAway
            ? <img src={flagAway} alt={match.team2}
                style={{ width: 20, height: 15, objectFit: "cover", borderRadius: 2, flexShrink: 0 }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
              />
            : <div style={{ width: 20, height: 15, backgroundColor: C.surface, borderRadius: 2, flexShrink: 0 }} />
          }
          <span style={{
            fontSize: 14, fontWeight: awayWins ? 600 : 400, // 14px, #3d3d3d = 10.7:1 ✓
            color: awayWins ? C.ink : C.secondary,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0,
          }}>
            {match.team2}
          </span>
        </div>
      </div>

      {/* ── Scorers row ──────────────────────────────────────── */}
      {/* Completely independent two-column layout — no alignment with main grid.
          Each name is always one line (ellipsis if needed). */}
      {hasGoals && (
        <div style={{
          borderTop: `1px solid ${C.hairlineS}`,
          backgroundColor: C.surface,
          padding: "7px 14px 9px",
          display: "flex",
          gap: 8,
        }}>
          {/* Home scorers — right-aligned */}
          <div style={{
            flex: 1, minWidth: 0,
            display: "flex", flexDirection: "column", gap: 4,
            alignItems: "flex-end",
          }}>
            {(match.goals1 ?? []).map((g, i) => (
              <GoalLine key={i} goal={g} align="right" />
            ))}
          </div>

          {/* Center separator */}
          <div style={{ width: 1, backgroundColor: C.hairline, flexShrink: 0, alignSelf: "stretch" }} />

          {/* Away scorers — left-aligned */}
          <div style={{
            flex: 1, minWidth: 0,
            display: "flex", flexDirection: "column", gap: 4,
            alignItems: "flex-start",
          }}>
            {(match.goals2 ?? []).map((g, i) => (
              <GoalLine key={i} goal={g} align="left" />
            ))}
          </div>
        </div>
      )}

      {/* ── Ground ───────────────────────────────────────────── */}
      {match.ground && (
        <div style={{
          padding: "4px 14px 6px",
          backgroundColor: hasGoals ? C.surface : "#ffffff",
          borderTop: hasGoals ? "none" : `1px solid ${C.hairlineS}`,
        }}>
          <span style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 11, letterSpacing: "0.4px", color: C.subtle, // #767676 = 4.5:1 ✓
          }}>
            📍 {match.ground}
          </span>
        </div>
      )}
    </div>
  );
}
