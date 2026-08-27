import { useState, useEffect } from "react";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface GoalEvent {
  name: string;
  minute: string;
}

export interface Match {
  id: string;
  round: string;
  date: string;
  time: string;
  team1: string;
  team2: string;
  group: string;
  ground: string;
  // live data — only present after fetch
  score?: [number, number];        // final score (ET score when aet=true)
  aet?: boolean;                   // true when match went to extra time
  penalties?: [number, number];    // knockout only: pen shootout scores when ft+et draw
  goals1?: GoalEvent[];
  goals2?: GoalEvent[];
}

export interface Round {
  name: string;
  phase: "groups" | "knockout";
  matches: Match[];
}

// ─── Static calendar — hardcoded, zero network cost ──────────────────────────
// Source: openfootball/worldcup.json 2026 (fetched once at build time)

// ─── Hardcoded past results — never change, zero network cost ────────────────
// Update this map each time new matches are confirmed and deployed.
// key: "team1|team2|date"
const PAST_RESULTS: Record<string, { score: [number, number]; aet?: boolean; penalties?: [number, number]; goals1: GoalEvent[]; goals2: GoalEvent[] }> = {
  "Mexico|South Africa|2026-06-11": {
    score: [2, 0],
    goals1: [{ name: "Julián Quiñones", minute: "9" }, { name: "Raúl Jiménez", minute: "67" }],
    goals2: [],
  },
  "South Korea|Czech Republic|2026-06-11": {
    score: [2, 1],
    goals1: [{ name: "Hwang In-Beom", minute: "67" }, { name: "Oh Hyeon-Gyu", minute: "80" }],
    goals2: [{ name: "Ladislav Krejcí", minute: "59" }],
  },
  "Canada|Bosnia & Herzegovina|2026-06-12": {
    score: [1, 1],
    goals1: [{ name: "Cyle Larin", minute: "78" }],
    goals2: [{ name: "Jovo Lukić", minute: "21" }],
  },
  "USA|Paraguay|2026-06-12": {
    score: [4, 1],
    goals1: [
      { name: "Damian Bobadilla", minute: "7" },
      { name: "Folarin Balogun", minute: "31" },
      { name: "Folarin Balogun", minute: "45+5" },
      { name: "Giovanni Reyna", minute: "90+8" },
    ],
    goals2: [{ name: "Mauricio", minute: "73" }],
  },
  // ── Round of 32 ──────────────────────────────────────────────────────────────
  "Germany|Paraguay|2026-06-29": {           // R32-2 Boston  — Germany 1-1 Paraguay (pen 3-4)
    score: [1, 1], aet: true, penalties: [3, 4], goals1: [], goals2: [],
  },
  "Netherlands|Morocco|2026-06-29": {        // R32-3 Monterrey — Netherlands 1-1 Morocco (pen 2-3)
    score: [1, 1], aet: true, penalties: [2, 3], goals1: [], goals2: [],
  },
};

const STATIC_MATCHES: Omit<Match, "score" | "goals1" | "goals2">[] = [
  {id:"Mexico-South Africa-2026-06-11",round:"Matchday 1",date:"2026-06-11",time:"13:00",team1:"Mexico",team2:"South Africa",group:"Group A",ground:"Mexico City"},
  {id:"South Korea-Czech Republic-2026-06-11",round:"Matchday 1",date:"2026-06-11",time:"20:00",team1:"South Korea",team2:"Czech Republic",group:"Group A",ground:"Guadalajara (Zapopan)"},
  {id:"Canada-Bosnia & Herzegovina-2026-06-12",round:"Matchday 2",date:"2026-06-12",time:"15:00",team1:"Canada",team2:"Bosnia & Herzegovina",group:"Group B",ground:"Toronto"},
  {id:"USA-Paraguay-2026-06-12",round:"Matchday 2",date:"2026-06-12",time:"18:00",team1:"USA",team2:"Paraguay",group:"Group D",ground:"Los Angeles (Inglewood)"},
  {id:"Qatar-Switzerland-2026-06-13",round:"Matchday 3",date:"2026-06-13",time:"12:00",team1:"Qatar",team2:"Switzerland",group:"Group B",ground:"San Francisco Bay Area (Santa Clara)"},
  {id:"Brazil-Morocco-2026-06-13",round:"Matchday 3",date:"2026-06-13",time:"18:00",team1:"Brazil",team2:"Morocco",group:"Group C",ground:"New York/New Jersey (East Rutherford)"},
  {id:"Haiti-Scotland-2026-06-13",round:"Matchday 3",date:"2026-06-13",time:"21:00",team1:"Haiti",team2:"Scotland",group:"Group C",ground:"Boston (Foxborough)"},
  {id:"Australia-Turkey-2026-06-13",round:"Matchday 3",date:"2026-06-13",time:"21:00",team1:"Australia",team2:"Turkey",group:"Group D",ground:"Vancouver"},
  {id:"Germany-Curaçao-2026-06-14",round:"Matchday 4",date:"2026-06-14",time:"12:00",team1:"Germany",team2:"Curaçao",group:"Group E",ground:"Houston"},
  {id:"Netherlands-Japan-2026-06-14",round:"Matchday 4",date:"2026-06-14",time:"15:00",team1:"Netherlands",team2:"Japan",group:"Group F",ground:"Dallas (Arlington)"},
  {id:"Ivory Coast-Ecuador-2026-06-14",round:"Matchday 4",date:"2026-06-14",time:"19:00",team1:"Ivory Coast",team2:"Ecuador",group:"Group E",ground:"Philadelphia"},
  {id:"Sweden-Tunisia-2026-06-14",round:"Matchday 4",date:"2026-06-14",time:"20:00",team1:"Sweden",team2:"Tunisia",group:"Group F",ground:"Monterrey (Guadalupe)"},
  {id:"Belgium-Egypt-2026-06-15",round:"Matchday 5",date:"2026-06-15",time:"12:00",team1:"Belgium",team2:"Egypt",group:"Group G",ground:"Seattle"},
  {id:"Spain-Cape Verde-2026-06-15",round:"Matchday 5",date:"2026-06-15",time:"12:00",team1:"Spain",team2:"Cape Verde",group:"Group H",ground:"Atlanta"},
  {id:"Iran-New Zealand-2026-06-15",round:"Matchday 5",date:"2026-06-15",time:"18:00",team1:"Iran",team2:"New Zealand",group:"Group G",ground:"Los Angeles (Inglewood)"},
  {id:"Saudi Arabia-Uruguay-2026-06-15",round:"Matchday 5",date:"2026-06-15",time:"18:00",team1:"Saudi Arabia",team2:"Uruguay",group:"Group H",ground:"Miami (Miami Gardens)"},
  {id:"France-Senegal-2026-06-16",round:"Matchday 6",date:"2026-06-16",time:"15:00",team1:"France",team2:"Senegal",group:"Group I",ground:"New York/New Jersey (East Rutherford)"},
  {id:"Iraq-Norway-2026-06-16",round:"Matchday 6",date:"2026-06-16",time:"18:00",team1:"Iraq",team2:"Norway",group:"Group I",ground:"Boston (Foxborough)"},
  {id:"Argentina-Algeria-2026-06-16",round:"Matchday 6",date:"2026-06-16",time:"20:00",team1:"Argentina",team2:"Algeria",group:"Group J",ground:"Kansas City"},
  {id:"Austria-Jordan-2026-06-16",round:"Matchday 6",date:"2026-06-16",time:"21:00",team1:"Austria",team2:"Jordan",group:"Group J",ground:"San Francisco Bay Area (Santa Clara)"},
  {id:"Portugal-DR Congo-2026-06-17",round:"Matchday 7",date:"2026-06-17",time:"12:00",team1:"Portugal",team2:"DR Congo",group:"Group K",ground:"Houston"},
  {id:"England-Croatia-2026-06-17",round:"Matchday 7",date:"2026-06-17",time:"15:00",team1:"England",team2:"Croatia",group:"Group L",ground:"Dallas (Arlington)"},
  {id:"Ghana-Panama-2026-06-17",round:"Matchday 7",date:"2026-06-17",time:"19:00",team1:"Ghana",team2:"Panama",group:"Group L",ground:"Toronto"},
  {id:"Uzbekistan-Colombia-2026-06-17",round:"Matchday 7",date:"2026-06-17",time:"20:00",team1:"Uzbekistan",team2:"Colombia",group:"Group K",ground:"Mexico City"},
  {id:"Czech Republic-South Africa-2026-06-18",round:"Matchday 8",date:"2026-06-18",time:"12:00",team1:"Czech Republic",team2:"South Africa",group:"Group A",ground:"Atlanta"},
  {id:"Switzerland-Bosnia & Herzegovina-2026-06-18",round:"Matchday 8",date:"2026-06-18",time:"12:00",team1:"Switzerland",team2:"Bosnia & Herzegovina",group:"Group B",ground:"Los Angeles (Inglewood)"},
  {id:"Mexico-South Korea-2026-06-18",round:"Matchday 8",date:"2026-06-18",time:"19:00",team1:"Mexico",team2:"South Korea",group:"Group A",ground:"Guadalajara (Zapopan)"},
  {id:"Canada-Qatar-2026-06-18",round:"Matchday 8",date:"2026-06-18",time:"15:00",team1:"Canada",team2:"Qatar",group:"Group B",ground:"Vancouver"},
  {id:"USA-Australia-2026-06-19",round:"Matchday 9",date:"2026-06-19",time:"12:00",team1:"USA",team2:"Australia",group:"Group D",ground:"Seattle"},
  {id:"Scotland-Morocco-2026-06-19",round:"Matchday 9",date:"2026-06-19",time:"18:00",team1:"Scotland",team2:"Morocco",group:"Group C",ground:"Boston (Foxborough)"},
  {id:"Brazil-Haiti-2026-06-19",round:"Matchday 9",date:"2026-06-19",time:"20:30",team1:"Brazil",team2:"Haiti",group:"Group C",ground:"Philadelphia"},
  {id:"Turkey-Paraguay-2026-06-19",round:"Matchday 9",date:"2026-06-19",time:"20:00",team1:"Turkey",team2:"Paraguay",group:"Group D",ground:"San Francisco Bay Area (Santa Clara)"},
  {id:"Netherlands-Sweden-2026-06-20",round:"Matchday 10",date:"2026-06-20",time:"12:00",team1:"Netherlands",team2:"Sweden",group:"Group F",ground:"Houston"},
  {id:"Germany-Ivory Coast-2026-06-20",round:"Matchday 10",date:"2026-06-20",time:"16:00",team1:"Germany",team2:"Ivory Coast",group:"Group E",ground:"Toronto"},
  {id:"Ecuador-Curaçao-2026-06-20",round:"Matchday 10",date:"2026-06-20",time:"19:00",team1:"Ecuador",team2:"Curaçao",group:"Group E",ground:"Kansas City"},
  {id:"Tunisia-Japan-2026-06-20",round:"Matchday 10",date:"2026-06-20",time:"22:00",team1:"Tunisia",team2:"Japan",group:"Group F",ground:"Monterrey (Guadalupe)"},
  {id:"Belgium-Iran-2026-06-21",round:"Matchday 11",date:"2026-06-21",time:"12:00",team1:"Belgium",team2:"Iran",group:"Group G",ground:"Los Angeles (Inglewood)"},
  {id:"Spain-Saudi Arabia-2026-06-21",round:"Matchday 11",date:"2026-06-21",time:"12:00",team1:"Spain",team2:"Saudi Arabia",group:"Group H",ground:"Atlanta"},
  {id:"New Zealand-Egypt-2026-06-21",round:"Matchday 11",date:"2026-06-21",time:"18:00",team1:"New Zealand",team2:"Egypt",group:"Group G",ground:"Vancouver"},
  {id:"Uruguay-Cape Verde-2026-06-21",round:"Matchday 11",date:"2026-06-21",time:"18:00",team1:"Uruguay",team2:"Cape Verde",group:"Group H",ground:"Miami (Miami Gardens)"},
  {id:"Argentina-Austria-2026-06-22",round:"Matchday 12",date:"2026-06-22",time:"12:00",team1:"Argentina",team2:"Austria",group:"Group J",ground:"Dallas (Arlington)"},
  {id:"France-Iraq-2026-06-22",round:"Matchday 12",date:"2026-06-22",time:"17:00",team1:"France",team2:"Iraq",group:"Group I",ground:"Philadelphia"},
  {id:"Jordan-Algeria-2026-06-22",round:"Matchday 12",date:"2026-06-22",time:"20:00",team1:"Jordan",team2:"Algeria",group:"Group J",ground:"San Francisco Bay Area (Santa Clara)"},
  {id:"Norway-Senegal-2026-06-22",round:"Matchday 12",date:"2026-06-22",time:"20:00",team1:"Norway",team2:"Senegal",group:"Group I",ground:"New York/New Jersey (East Rutherford)"},
  {id:"Portugal-Uzbekistan-2026-06-23",round:"Matchday 13",date:"2026-06-23",time:"12:00",team1:"Portugal",team2:"Uzbekistan",group:"Group K",ground:"Houston"},
  {id:"England-Ghana-2026-06-23",round:"Matchday 13",date:"2026-06-23",time:"16:00",team1:"England",team2:"Ghana",group:"Group L",ground:"Boston (Foxborough)"},
  {id:"Panama-Croatia-2026-06-23",round:"Matchday 13",date:"2026-06-23",time:"19:00",team1:"Panama",team2:"Croatia",group:"Group L",ground:"Toronto"},
  {id:"Colombia-DR Congo-2026-06-23",round:"Matchday 13",date:"2026-06-23",time:"20:00",team1:"Colombia",team2:"DR Congo",group:"Group K",ground:"Guadalajara (Zapopan)"},
  {id:"Czech Republic-Mexico-2026-06-24",round:"Matchday 14",date:"2026-06-24",time:"19:00",team1:"Czech Republic",team2:"Mexico",group:"Group A",ground:"Mexico City"},
  {id:"South Africa-South Korea-2026-06-24",round:"Matchday 14",date:"2026-06-24",time:"19:00",team1:"South Africa",team2:"South Korea",group:"Group A",ground:"Monterrey (Guadalupe)"},
  {id:"Switzerland-Canada-2026-06-24",round:"Matchday 14",date:"2026-06-24",time:"12:00",team1:"Switzerland",team2:"Canada",group:"Group B",ground:"Vancouver"},
  {id:"Bosnia & Herzegovina-Qatar-2026-06-24",round:"Matchday 14",date:"2026-06-24",time:"12:00",team1:"Bosnia & Herzegovina",team2:"Qatar",group:"Group B",ground:"Seattle"},
  {id:"Scotland-Brazil-2026-06-24",round:"Matchday 14",date:"2026-06-24",time:"18:00",team1:"Scotland",team2:"Brazil",group:"Group C",ground:"Miami (Miami Gardens)"},
  {id:"Morocco-Haiti-2026-06-24",round:"Matchday 14",date:"2026-06-24",time:"18:00",team1:"Morocco",team2:"Haiti",group:"Group C",ground:"Atlanta"},
  {id:"Turkey-USA-2026-06-25",round:"Matchday 15",date:"2026-06-25",time:"19:00",team1:"Turkey",team2:"USA",group:"Group D",ground:"Los Angeles (Inglewood)"},
  {id:"Paraguay-Australia-2026-06-25",round:"Matchday 15",date:"2026-06-25",time:"19:00",team1:"Paraguay",team2:"Australia",group:"Group D",ground:"San Francisco Bay Area (Santa Clara)"},
  {id:"Curaçao-Ivory Coast-2026-06-25",round:"Matchday 15",date:"2026-06-25",time:"16:00",team1:"Curaçao",team2:"Ivory Coast",group:"Group E",ground:"Philadelphia"},
  {id:"Ecuador-Germany-2026-06-25",round:"Matchday 15",date:"2026-06-25",time:"16:00",team1:"Ecuador",team2:"Germany",group:"Group E",ground:"New York/New Jersey (East Rutherford)"},
  {id:"Japan-Sweden-2026-06-25",round:"Matchday 15",date:"2026-06-25",time:"18:00",team1:"Japan",team2:"Sweden",group:"Group F",ground:"Dallas (Arlington)"},
  {id:"Tunisia-Netherlands-2026-06-25",round:"Matchday 15",date:"2026-06-25",time:"18:00",team1:"Tunisia",team2:"Netherlands",group:"Group F",ground:"Kansas City"},
  {id:"Egypt-Iran-2026-06-26",round:"Matchday 16",date:"2026-06-26",time:"20:00",team1:"Egypt",team2:"Iran",group:"Group G",ground:"Seattle"},
  {id:"New Zealand-Belgium-2026-06-26",round:"Matchday 16",date:"2026-06-26",time:"20:00",team1:"New Zealand",team2:"Belgium",group:"Group G",ground:"Vancouver"},
  {id:"Cape Verde-Saudi Arabia-2026-06-26",round:"Matchday 16",date:"2026-06-26",time:"19:00",team1:"Cape Verde",team2:"Saudi Arabia",group:"Group H",ground:"Houston"},
  {id:"Uruguay-Spain-2026-06-26",round:"Matchday 16",date:"2026-06-26",time:"18:00",team1:"Uruguay",team2:"Spain",group:"Group H",ground:"Guadalajara (Zapopan)"},
  {id:"Norway-France-2026-06-26",round:"Matchday 16",date:"2026-06-26",time:"15:00",team1:"Norway",team2:"France",group:"Group I",ground:"Boston (Foxborough)"},
  {id:"Senegal-Iraq-2026-06-26",round:"Matchday 16",date:"2026-06-26",time:"15:00",team1:"Senegal",team2:"Iraq",group:"Group I",ground:"Toronto"},
  {id:"Algeria-Austria-2026-06-27",round:"Matchday 17",date:"2026-06-27",time:"21:00",team1:"Algeria",team2:"Austria",group:"Group J",ground:"Kansas City"},
  {id:"Jordan-Argentina-2026-06-27",round:"Matchday 17",date:"2026-06-27",time:"21:00",team1:"Jordan",team2:"Argentina",group:"Group J",ground:"Dallas (Arlington)"},
  {id:"Colombia-Portugal-2026-06-27",round:"Matchday 17",date:"2026-06-27",time:"19:30",team1:"Colombia",team2:"Portugal",group:"Group K",ground:"Miami (Miami Gardens)"},
  {id:"DR Congo-Uzbekistan-2026-06-27",round:"Matchday 17",date:"2026-06-27",time:"19:30",team1:"DR Congo",team2:"Uzbekistan",group:"Group K",ground:"Atlanta"},
  {id:"Panama-England-2026-06-27",round:"Matchday 17",date:"2026-06-27",time:"17:00",team1:"Panama",team2:"England",group:"Group L",ground:"New York/New Jersey (East Rutherford)"},
  {id:"Croatia-Ghana-2026-06-27",round:"Matchday 17",date:"2026-06-27",time:"17:00",team1:"Croatia",team2:"Ghana",group:"Group L",ground:"Philadelphia"},
  // Round of 32
  {id:"R32-1",round:"Round of 32",date:"2026-06-28",time:"12:00",team1:"2A",team2:"2B",group:"",ground:"Los Angeles (Inglewood)"},
  {id:"R32-2",round:"Round of 32",date:"2026-06-29",time:"16:30",team1:"Germany",team2:"Paraguay",group:"",ground:"Boston (Foxborough)"},
  {id:"R32-3",round:"Round of 32",date:"2026-06-29",time:"19:00",team1:"Netherlands",team2:"Morocco",group:"",ground:"Monterrey (Guadalupe)"},
  {id:"R32-4",round:"Round of 32",date:"2026-06-29",time:"12:00",team1:"1C",team2:"2F",group:"",ground:"Houston"},
  {id:"R32-5",round:"Round of 32",date:"2026-06-30",time:"17:00",team1:"1I",team2:"3C/D/F/G/H",group:"",ground:"New York/New Jersey (East Rutherford)"},
  {id:"R32-6",round:"Round of 32",date:"2026-06-30",time:"12:00",team1:"2E",team2:"2I",group:"",ground:"Dallas (Arlington)"},
  {id:"R32-7",round:"Round of 32",date:"2026-06-30",time:"19:00",team1:"1A",team2:"3C/E/F/H/I",group:"",ground:"Mexico City"},
  {id:"R32-8",round:"Round of 32",date:"2026-07-01",time:"12:00",team1:"1L",team2:"3E/H/I/J/K",group:"",ground:"Atlanta"},
  {id:"R32-9",round:"Round of 32",date:"2026-07-01",time:"17:00",team1:"1D",team2:"3B/E/F/I/J",group:"",ground:"San Francisco Bay Area (Santa Clara)"},
  {id:"R32-10",round:"Round of 32",date:"2026-07-01",time:"13:00",team1:"1G",team2:"3A/E/H/I/J",group:"",ground:"Seattle"},
  {id:"R32-11",round:"Round of 32",date:"2026-07-02",time:"19:00",team1:"2K",team2:"2L",group:"",ground:"Toronto"},
  {id:"R32-12",round:"Round of 32",date:"2026-07-02",time:"12:00",team1:"1H",team2:"2J",group:"",ground:"Los Angeles (Inglewood)"},
  {id:"R32-13",round:"Round of 32",date:"2026-07-02",time:"20:00",team1:"1B",team2:"3E/F/G/I/J",group:"",ground:"Vancouver"},
  {id:"R32-14",round:"Round of 32",date:"2026-07-03",time:"18:00",team1:"1J",team2:"2H",group:"",ground:"Miami (Miami Gardens)"},
  {id:"R32-15",round:"Round of 32",date:"2026-07-03",time:"20:30",team1:"1K",team2:"3D/E/I/J/L",group:"",ground:"Kansas City"},
  {id:"R32-16",round:"Round of 32",date:"2026-07-03",time:"13:00",team1:"2D",team2:"2G",group:"",ground:"Dallas (Arlington)"},
  // Round of 16
  {id:"R16-1",round:"Round of 16",date:"2026-07-04",time:"17:00",team1:"W74",team2:"W77",group:"",ground:"Philadelphia"},
  {id:"R16-2",round:"Round of 16",date:"2026-07-04",time:"12:00",team1:"W73",team2:"W75",group:"",ground:"Houston"},
  {id:"R16-3",round:"Round of 16",date:"2026-07-05",time:"16:00",team1:"W76",team2:"W78",group:"",ground:"New York/New Jersey (East Rutherford)"},
  {id:"R16-4",round:"Round of 16",date:"2026-07-05",time:"18:00",team1:"W79",team2:"W80",group:"",ground:"Mexico City"},
  {id:"R16-5",round:"Round of 16",date:"2026-07-06",time:"14:00",team1:"W83",team2:"W84",group:"",ground:"Dallas (Arlington)"},
  {id:"R16-6",round:"Round of 16",date:"2026-07-06",time:"17:00",team1:"W81",team2:"W82",group:"",ground:"Seattle"},
  {id:"R16-7",round:"Round of 16",date:"2026-07-07",time:"12:00",team1:"W86",team2:"W88",group:"",ground:"Atlanta"},
  {id:"R16-8",round:"Round of 16",date:"2026-07-07",time:"13:00",team1:"W85",team2:"W87",group:"",ground:"Vancouver"},
  // Quarter-finals
  {id:"QF-1",round:"Quarter-final",date:"2026-07-09",time:"16:00",team1:"W89",team2:"W90",group:"",ground:"Boston (Foxborough)"},
  {id:"QF-2",round:"Quarter-final",date:"2026-07-10",time:"12:00",team1:"W93",team2:"W94",group:"",ground:"Los Angeles (Inglewood)"},
  {id:"QF-3",round:"Quarter-final",date:"2026-07-11",time:"17:00",team1:"W91",team2:"W92",group:"",ground:"Miami (Miami Gardens)"},
  {id:"QF-4",round:"Quarter-final",date:"2026-07-11",time:"20:00",team1:"W95",team2:"W96",group:"",ground:"Kansas City"},
  // Semi-finals
  {id:"SF-1",round:"Semi-final",date:"2026-07-14",time:"14:00",team1:"W97",team2:"W98",group:"",ground:"Dallas (Arlington)"},
  {id:"SF-2",round:"Semi-final",date:"2026-07-15",time:"15:00",team1:"W99",team2:"W100",group:"",ground:"Atlanta"},
  // 3rd place & Final
  {id:"3RD",round:"Match for third place",date:"2026-07-18",time:"17:00",team1:"L101",team2:"L102",group:"",ground:"Miami (Miami Gardens)"},
  {id:"FIN",round:"Final",date:"2026-07-19",time:"15:00",team1:"W101",team2:"W102",group:"",ground:"New York/New Jersey (East Rutherford)"},
];

// ─── Live results cache — refreshes daily at 08:00 hora española ─────────────

const DATA_URL  = "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";
const CACHE_KEY = "wc2026_results_v6";

// Returns the timestamp of the most recent 08:00 Spain time (CET=UTC+1, CEST=UTC+2).
// Spain uses CEST (UTC+2) from last Sunday of March to last Sunday of October.
function last8amSpain(): number {
  const now = new Date();

  // Determine Spain's UTC offset for a given date (CEST=+2 in summer, CET=+1 in winter)
  function spainOffset(d: Date): number {
    const year = d.getFullYear();
    // Last Sunday of March at 02:00 CET → clocks go forward
    const lastSunMarch = new Date(Date.UTC(year, 2, 31));
    lastSunMarch.setUTCDate(31 - lastSunMarch.getUTCDay());
    lastSunMarch.setUTCHours(1); // 02:00 CET = 01:00 UTC
    // Last Sunday of October at 03:00 CEST → clocks go back
    const lastSunOct = new Date(Date.UTC(year, 9, 31));
    lastSunOct.setUTCDate(31 - lastSunOct.getUTCDay());
    lastSunOct.setUTCHours(1); // 03:00 CEST = 01:00 UTC
    return d >= lastSunMarch && d < lastSunOct ? 2 : 1; // hours ahead of UTC
  }

  const offset = spainOffset(now);
  // 08:00 Spain = (8 - offset):00 UTC
  const todayAt8 = new Date(Date.UTC(
    now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(),
    8 - offset, 0, 0, 0,
  ));

  // If it's still before 08:00 Spain today, use yesterday's 08:00
  if (now < todayAt8) todayAt8.setUTCDate(todayAt8.getUTCDate() - 1);
  return todayAt8.getTime();
}

interface LiveResult {
  score?: [number, number];        // final score (ET if aet=true)
  aet?: boolean;                   // true if extra time was played
  penalties?: [number, number];    // pen shootout scores when applicable
  goals1: GoalEvent[];
  goals2: GoalEvent[];
  // Resolved team names from openfootball JSON (for knockout matches)
  team1?: string;
  team2?: string;
}

// Primary key:   "team1|team2|date"  → group stage (stable team names)
// Secondary key: "date|ground"       → knockout stage (openfootball resolves names in JSON)
type ResultsMap = Record<string, LiveResult>;

interface CacheEntry {
  ts: number;       // timestamp when cache was written
  results: ResultsMap;
}

function readCache(): ResultsMap | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    // Cache is valid only if it was written AFTER the last 08:00 Spain
    if (entry.ts < last8amSpain()) return null;
    return entry.results;
  } catch { return null; }
}

function writeCache(results: ResultsMap) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), results }));
  } catch {}
}

// ─── Parse only NEW results (not already hardcoded) from raw API ──────────────

const PAST_KEYS = new Set(Object.keys(PAST_RESULTS));

// Detect whether a team name is a real country name (not a slot code like "1A", "W73")
function isRealTeamName(name: string): boolean {
  if (!name) return false;
  if (/^[12][A-L]$/.test(name)) return false;       // "1A", "2B" …
  if (/^W\d+$/.test(name)) return false;             // "W73", "W89" …
  if (/^L\d+$/.test(name)) return false;             // "L101" …
  if (/^3[A-L]/.test(name)) return false;            // "3A/B/C/D/F" …
  return name.length >= 2;
}

function parseResults(rawMatches: any[]): ResultsMap {
  const map: ResultsMap = {};

  for (const m of rawMatches) {
    const hasEt  = Array.isArray(m.score?.et);   // extra time score
    const hasFt  = Array.isArray(m.score?.ft);   // full time score
    const hasPen = Array.isArray(m.score?.pen);  // penalty shootout

    // Use ET score as the "final" score when extra time was played
    const finalScore: [number, number] | null = hasEt
      ? (m.score.et as [number, number])
      : hasFt
        ? (m.score.ft as [number, number])
        : null;
    const hasScore = finalScore != null;
    const isKnockout = !m.group;

    const result: LiveResult = {
      score:  hasScore ? finalScore : undefined,
      ...(hasEt   ? { aet: true } : {}),
      ...(hasPen  ? { penalties: m.score.pen as [number, number] } : {}),
      goals1: (m.goals1 ?? []).map((g: any) => ({ name: g.name, minute: g.minute })),
      goals2: (m.goals2 ?? []).map((g: any) => ({ name: g.name, minute: g.minute })),
      // Store resolved team names for knockout matches
      ...(isKnockout && isRealTeamName(m.team1) ? { team1: m.team1 } : {}),
      ...(isKnockout && isRealTeamName(m.team2) ? { team2: m.team2 } : {}),
    };

    // Skip if nothing useful to store
    if (!hasScore && !result.team1 && !result.team2) continue;

    // Primary key — group stage (team names stable)
    const primaryKey = `${m.team1}|${m.team2}|${m.date}`;
    if (hasScore && !PAST_KEYS.has(primaryKey)) {
      map[primaryKey] = result;
    }

    // Secondary key — knockout stage, keyed by date|ground (always unique per match)
    if (m.ground && (hasScore || result.team1 || result.team2)) {
      const groundKey = `${m.date}|${m.ground}`;
      map[groundKey] = result;
    }
  }
  return map;
}

// ─── Assemble rounds from static calendar + live results ──────────────────────

const ROUND_ORDER = [
  "Matchday 1","Matchday 2","Matchday 3","Matchday 4","Matchday 5",
  "Matchday 6","Matchday 7","Matchday 8","Matchday 9","Matchday 10",
  "Matchday 11","Matchday 12","Matchday 13","Matchday 14","Matchday 15",
  "Matchday 16","Matchday 17","Round of 32","Round of 16","Quarter-final",
  "Semi-final","Match for third place","Final",
];

const GROUP_ROUNDS = new Set(ROUND_ORDER.slice(0, 17));

function buildRounds(liveResults: ResultsMap): Round[] {
  const roundMap = new Map<string, Match[]>();

  for (const m of STATIC_MATCHES) {
    if (!roundMap.has(m.round)) roundMap.set(m.round, []);

    const isKnockout = !GROUP_ROUNDS.has(m.round);
    const primaryKey = `${m.team1}|${m.team2}|${m.date}`;
    const groundKey  = m.ground ? `${m.date}|${m.ground}` : null;

    // Score lookup: PAST_RESULTS first, then live by primary key, then by ground key
    const pastResult = PAST_RESULTS[primaryKey];
    const liveByPrimary = liveResults[primaryKey];
    const liveByGround  = groundKey ? liveResults[groundKey] : null;
    const result = pastResult ?? liveByPrimary ?? liveByGround ?? null;

    // For knockout matches, use the team names openfootball has resolved in their JSON
    // (they replace "1F", "3A/B/C/D/F" etc. with real country names once groups finish)
    const liveKnockout = isKnockout ? liveByGround : null;
    const resolvedTeam1 = liveKnockout?.team1 ?? m.team1;
    const resolvedTeam2 = liveKnockout?.team2 ?? m.team2;

    roundMap.get(m.round)!.push({
      ...m,
      team1: resolvedTeam1,
      team2: resolvedTeam2,
      ...(result?.score != null ? {
        score:    result.score,
        ...(result.aet       ? { aet: true }                        : {}),
        ...(result.penalties != null ? { penalties: result.penalties } : {}),
        goals1:   result.goals1 ?? [],
        goals2:   result.goals2 ?? [],
      } : {}),
    });
  }

  return Array.from(roundMap.entries())
    .sort(([a], [b]) => ROUND_ORDER.indexOf(a) - ROUND_ORDER.indexOf(b))
    .map(([name, matches]) => ({
      name,
      phase: GROUP_ROUNDS.has(name) ? "groups" : "knockout",
      matches,
    }));
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useWorldCupData() {
  // Start immediately with static calendar — no loading state needed
  const [rounds, setRounds] = useState<Round[]>(() => buildRounds({}));
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Try cache first
    const cached = readCache();
    if (cached) {
      setRounds(buildRounds(cached));
      return;
    }

    // Fetch only results (scores + goalscorers)
    setFetching(true);
    fetch(DATA_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        const results = parseResults(data.matches ?? []);
        writeCache(results);
        setRounds(buildRounds(results));
      })
      .catch((e) => setError(e.message))
      .finally(() => setFetching(false));
  }, []);

  return { rounds, fetching, error };
}
