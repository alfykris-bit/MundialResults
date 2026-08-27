import { Round, Match } from "./useWorldCupData";
import { computeStandings, GroupStandings, TeamStat, GROUPS } from "./useStandings";

// ─── Types ────────────────────────────────────────────────────────────────────

export type SlotStatus = "confirmed" | "provisional" | "tbd";

export interface ResolvedSlot {
  team: string;        // team name or original placeholder
  status: SlotStatus;  // confirmed = group done / provisional = ongoing / tbd = unknown
  position?: number;   // 1-based position in group (1st, 2nd, 3rd...)
  group?: string;      // e.g. "Group A"
}

// ─── Group completion check ───────────────────────────────────────────────────
// A group is complete when all 6 matches have been played (4 teams × 3 matchdays / 2 = 6).

function isGroupComplete(groupName: string, rounds: Round[]): boolean {
  const groupMatches = rounds
    .filter((r) => r.phase === "groups")
    .flatMap((r) => r.matches)
    .filter((m) => m.group === groupName);
  return groupMatches.length > 0 && groupMatches.every((m) => Array.isArray(m.score));
}

function compareStat(a: TeamStat, b: TeamStat): number {
  return b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || a.team.localeCompare(b.team);
}

// ─── Global 3rd-place assignment ─────────────────────────────────────────────
// The 8 R32 slots that host a 3rd-placed team, in match order.
// Each slot lists its eligible group codes (as in the openfootball data).
// A team can only be assigned to ONE slot — solved with a greedy unique assignment.

const THIRD_SLOTS: { key: string; groups: Set<string> }[] = [
  { key: "3A/B/C/D/F", groups: new Set(["A","B","C","D","F"]) },
  { key: "3C/D/F/G/H", groups: new Set(["C","D","F","G","H"]) },
  { key: "3C/E/F/H/I", groups: new Set(["C","E","F","H","I"]) },
  { key: "3E/H/I/J/K", groups: new Set(["E","H","I","J","K"]) },
  { key: "3B/E/F/I/J", groups: new Set(["B","E","F","I","J"]) },
  { key: "3A/E/H/I/J", groups: new Set(["A","E","H","I","J"]) },
  { key: "3E/F/G/I/J", groups: new Set(["E","F","G","I","J"]) },
  { key: "3D/E/I/J/L", groups: new Set(["D","E","I","J","L"]) },
];

// Returns a map of slot-key → resolved team (no duplicates).
function computeThirdAssignment(
  standings: GroupStandings,
  rounds: Round[],
): Map<string, ResolvedSlot> {
  // Collect all 3rd-placed teams that have played at least 1 match
  const allThirds: TeamStat[] = [];
  for (const [, rows] of Object.entries(standings)) {
    if (rows.length >= 3 && rows[2].played > 0) allThirds.push(rows[2]);
  }
  allThirds.sort(compareStat);

  const assignment = new Map<string, ResolvedSlot>();
  const used = new Set<string>();

  for (const { key, groups } of THIRD_SLOTS) {
    // Best unassigned team whose group is eligible for this slot
    const candidate = allThirds.find(
      (t) => groups.has(t.group.replace("Group ", "")) && !used.has(t.team)
    );
    if (!candidate) continue;

    const allComplete = [...groups].every((g) => isGroupComplete(`Group ${g}`, rounds));
    assignment.set(key, {
      team: candidate.team,
      status: allComplete ? "confirmed" : "provisional",
      position: 3,
      group: candidate.group,
    });
    used.add(candidate.team);
  }

  return assignment;
}

// ─── Main resolver ────────────────────────────────────────────────────────────
// Resolves a slot label like "1A", "2B", "3C/D/F/G/H", "W73", "L101" etc.
// Returns { team, status }.

export function buildSlotResolver(rounds: Round[]) {
  const standings = computeStandings(rounds);
  // Pre-compute unique global assignment of 8 best 3rds to their slots
  const thirdAssignment = computeThirdAssignment(standings, rounds);

  // Map W73→R32-1, W74→R32-2, ... W88→R32-16 etc.
  const wNumToId: Record<number, string> = {
    73:"R32-1",74:"R32-2",75:"R32-3",76:"R32-4",
    77:"R32-5",78:"R32-6",79:"R32-7",80:"R32-8",
    81:"R32-9",82:"R32-10",83:"R32-11",84:"R32-12",
    85:"R32-13",86:"R32-14",87:"R32-15",88:"R32-16",
    89:"R16-1",90:"R16-2",91:"R16-3",92:"R16-4",
    93:"R16-5",94:"R16-6",95:"R16-7",96:"R16-8",
    97:"QF-1",98:"QF-2",99:"QF-3",100:"QF-4",
    101:"SF-1",102:"SF-2",
  };

  // Helper: resolve a raw team slot to a real name using standings only
  // (one level — no recursive W lookup yet, used to build winnerMap)
  function resolveGroupSlot(slot: string): string {
    const gm = slot.match(/^([12])([A-L])$/);
    if (gm) {
      const pos = parseInt(gm[1]) - 1;
      const rows = standings[`Group ${gm[2]}`];
      if (rows && rows[pos].played > 0) return rows[pos].team;
    }
    // Already a real team name
    if (!/^[12WL3]/.test(slot) && slot.length > 2) return slot;
    return slot; // keep as-is (W-slot or 3rd-place slot)
  }

  // Build winner/loser maps: match id → actual team name
  // We resolve team1/team2 slot codes first so the name stored is always real.
  const winnerMap = new Map<string, string>();
  const loserMap  = new Map<string, string>();
  for (const r of rounds) {
    for (const m of r.matches) {
      if (!Array.isArray(m.score)) continue;
      const [g1, g2] = m.score as [number, number];
      const t1 = resolveGroupSlot(m.team1);
      const t2 = resolveGroupSlot(m.team2);

      if (Array.isArray(m.penalties)) {
        // Penalty shootout decides the winner when FT+ET was a draw
        const [p1, p2] = m.penalties as [number, number];
        if (p1 > p2) { winnerMap.set(m.id, t1); loserMap.set(m.id, t2); }
        else          { winnerMap.set(m.id, t2); loserMap.set(m.id, t1); }
      } else if (g1 > g2) {
        winnerMap.set(m.id, t1); loserMap.set(m.id, t2);
      } else if (g2 > g1) {
        winnerMap.set(m.id, t2); loserMap.set(m.id, t1);
      }
      // pure FT draw without pens shouldn't occur in knockout
    }
  }

  return function resolve(slot: string): ResolvedSlot {
    // ── 1X / 2X group slots ─────────────────────────────────────────────────
    const groupMatch = slot.match(/^([12])([A-L])$/);
    if (groupMatch) {
      const pos = parseInt(groupMatch[1]) - 1;
      const groupName = `Group ${groupMatch[2]}`;
      const rows = standings[groupName];
      if (!rows || rows[pos].played === 0) return { team: slot, status: "tbd" };
      const complete = isGroupComplete(groupName, rounds);
      return {
        team: rows[pos].team,
        status: complete ? "confirmed" : "provisional",
        position: pos + 1,
        group: groupName,
      };
    }

    // ── 3X/Y/Z best third slots ─────────────────────────────────────────────
    // Look up in the pre-computed global assignment (no duplicates guaranteed)
    const thirdMatch = slot.match(/^3([A-L](?:\/[A-L])+)$/);
    if (thirdMatch) {
      const resolved = thirdAssignment.get(slot);
      if (resolved) return resolved;
      return { team: slot, status: "tbd" };
    }

    // ── W{n} winner of match n ───────────────────────────────────────────────
    const wMatch = slot.match(/^W(\d+)$/);
    if (wMatch) {
      const n = parseInt(wMatch[1]);
      const matchId = wNumToId[n];

      // Confirmed: the match has been played
      if (matchId && winnerMap.has(matchId)) {
        return { team: winnerMap.get(matchId)!, status: "confirmed" };
      }

      // Provisional: match not played yet, but we know one candidate (single-team slot)
      // Find the match in rounds and try to resolve its team1/team2 one level deep
      if (matchId) {
        for (const r of rounds) {
          const m = r.matches.find((x) => x.id === matchId);
          if (m) {
            // If both slots resolve to the same team (e.g. already confirmed 1st in a group)
            // we can show it as provisional
            const r1 = resolveGroupSlot(m.team1);
            const r2 = resolveGroupSlot(m.team2);
            // Only show provisional if at least one slot is a known team
            const known1 = r1 !== m.team1;
            const known2 = r2 !== m.team2;
            if (known1 || known2) {
              // Can't predict winner, but show "TBD (team1 vs team2)" context
              return { team: slot, status: "tbd" };
            }
            break;
          }
        }
      }

      return { team: slot, status: "tbd" };
    }

    // ── L{n} loser of match n (3rd place) ───────────────────────────────────
    const lMatch = slot.match(/^L(\d+)$/);
    if (lMatch) {
      const n = parseInt(lMatch[1]);
      const matchId = wNumToId[n];
      if (matchId && loserMap.has(matchId)) {
        return { team: loserMap.get(matchId)!, status: "confirmed" };
      }
      return { team: slot, status: "tbd" };
    }

    // ── Already a real team name (openfootball resolved it in JSON) ──────────
    // If the slot doesn't match any pattern, it's already a team name
    if (!/^[12WL]/.test(slot) && slot.length > 2) {
      return { team: slot, status: "confirmed" };
    }

    return { team: slot, status: "tbd" };
  };
}
