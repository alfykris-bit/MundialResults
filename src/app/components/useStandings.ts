import { Round } from "./useWorldCupData";

// ─── Groups hardcoded from worldcup.groups.json ───────────────────────────────
// Source: openfootball/worldcup.json/master/2026/worldcup.groups.json

export const GROUPS: Record<string, string[]> = {
  "Group A": ["Mexico", "South Africa", "South Korea", "Czech Republic"],
  "Group B": ["Canada", "Bosnia & Herzegovina", "Qatar", "Switzerland"],
  "Group C": ["Brazil", "Morocco", "Haiti", "Scotland"],
  "Group D": ["USA", "Paraguay", "Australia", "Turkey"],
  "Group E": ["Germany", "Curaçao", "Ivory Coast", "Ecuador"],
  "Group F": ["Netherlands", "Japan", "Sweden", "Tunisia"],
  "Group G": ["Belgium", "Egypt", "Iran", "New Zealand"],
  "Group H": ["Spain", "Cape Verde", "Saudi Arabia", "Uruguay"],
  "Group I": ["France", "Senegal", "Iraq", "Norway"],
  "Group J": ["Argentina", "Algeria", "Austria", "Jordan"],
  "Group K": ["Portugal", "DR Congo", "Uzbekistan", "Colombia"],
  "Group L": ["England", "Croatia", "Ghana", "Panama"],
};

export interface TeamStat {
  team: string;
  group: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  gf: number;  // goals for
  ga: number;  // goals against
  gd: number;  // goal difference
  pts: number;
}

export type GroupStandings = Record<string, TeamStat[]>;

function emptyStats(team: string, group: string): TeamStat {
  return { team, group, played: 0, won: 0, drawn: 0, lost: 0, gf: 0, ga: 0, gd: 0, pts: 0 };
}

export function computeStandings(rounds: Round[]): GroupStandings {
  // Initialize all teams
  const stats: Record<string, TeamStat> = {};
  for (const [group, teams] of Object.entries(GROUPS)) {
    for (const team of teams) {
      stats[team] = emptyStats(team, group);
    }
  }

  // Walk every played group-phase match
  for (const round of rounds) {
    if (round.phase !== "groups") continue;
    for (const match of round.matches) {
      if (!Array.isArray(match.score)) continue;
      const [g1, g2] = match.score;
      const home = stats[match.team1];
      const away = stats[match.team2];
      if (!home || !away) continue;

      home.played++; away.played++;
      home.gf += g1; home.ga += g2;
      away.gf += g2; away.ga += g1;
      home.gd = home.gf - home.ga;
      away.gd = away.gf - away.ga;

      if (g1 > g2) {
        home.won++; home.pts += 3;
        away.lost++;
      } else if (g1 < g2) {
        away.won++; away.pts += 3;
        home.lost++;
      } else {
        home.drawn++; home.pts += 1;
        away.drawn++; away.pts += 1;
      }
    }
  }

  // Group and sort: pts desc → gd desc → gf desc → name asc
  const result: GroupStandings = {};
  for (const [group, teams] of Object.entries(GROUPS)) {
    result[group] = teams
      .map((t) => stats[t])
      .sort((a, b) =>
        b.pts - a.pts ||
        b.gd  - a.gd  ||
        b.gf  - a.gf  ||
        a.team.localeCompare(b.team)
      );
  }
  return result;
}
