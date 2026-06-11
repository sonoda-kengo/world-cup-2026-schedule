import { readFileSync } from "node:fs";
import path from "node:path";
import { teamCodes } from "@/data/teamCodes";
import type { Match, Stage } from "@/data/types";

const schedulePath = path.join(
  process.cwd(),
  "schedule",
  "fifa_world_cup_2026_schedule_nl.md",
);

const monthIndex: Record<string, number> = {
  Jun: 5,
  June: 5,
  Jul: 6,
  July: 6,
};

const validStages = new Set<Stage>(["group", "r32", "r16", "qf", "sf", "3p", "final"]);

type Row = {
  date: string;
  time: string;
  group?: string;
  stage?: string;
  home?: string;
  away?: string;
  match?: string;
  label?: string;
  venue: string;
};

type ParsedRow = Row & {
  section: string;
};

export function loadScheduleFromMarkdown(): Match[] {
  const markdown = readFileSync(schedulePath, "utf8");
  return parseScheduleMarkdown(markdown);
}

export function parseScheduleMarkdown(markdown: string): Match[] {
  const rows = parseMarkdownTables(markdown);

  if (rows.length === 0) {
    throw new Error("Schedule markdown table is missing.");
  }

  return rows.map((row, index) => {
    const stage = normalizeStage(row.stage || row.section);

    if (!validStages.has(stage)) {
      throw new Error(`Invalid stage "${row.stage || row.section}" on markdown row ${index + 1}.`);
    }

    const { home, away, label } = parseMatch(row.match, row.home, row.away, row.label, stage);

    return {
      id: `m${String(index + 1).padStart(3, "0")}`,
      startsAt: toIsoFromCest(row.date, row.time),
      sourceDate: row.date,
      sourceTime: row.time,
      group: row.group || "—",
      stage,
      home,
      away,
      homeCode: home ? teamCodes[home] ?? null : null,
      awayCode: away ? teamCodes[away] ?? null : null,
      label,
      venue: row.venue,
    };
  });
}

function parseMarkdownTables(markdown: string): ParsedRow[] {
  const rows: ParsedRow[] = [];
  let section = "";
  let headers: string[] | null = null;

  for (const rawLine of markdown.split(/\r?\n/)) {
    const line = rawLine.trim();

    if (line.startsWith("## ")) {
      section = line.replace(/^##\s+/, "");
      headers = null;
      continue;
    }

    if (!line.startsWith("|")) {
      continue;
    }

    if (/^\|\s*-+/.test(line)) {
      continue;
    }

    const values = splitMarkdownRow(line);
    const normalized = values.map(normalizeHeader);

    if (normalized.includes("date") && normalized.includes("time") && normalized.includes("venue")) {
      headers = normalized;
      continue;
    }

    if (!headers) {
      continue;
    }

    const row = Object.fromEntries(headers.map((key, columnIndex) => [key, values[columnIndex] ?? ""])) as Row;

    if (!row.date || !row.time || !row.venue) {
      continue;
    }

    rows.push({ ...row, section });
  }

  return rows;
}

function normalizeStage(stageText: string): Stage {
  const normalized = stageText.toLowerCase().replace(/[\s_-]+/g, "");

  if (normalized.includes("group")) return "group";
  if (normalized.includes("roundof32")) return "r32";
  if (normalized.includes("roundof16")) return "r16";
  if (normalized.includes("quarter")) return "qf";
  if (normalized.includes("semi")) return "sf";
  if (normalized.includes("third") || normalized.includes("3rd")) return "3p";
  if (normalized.includes("final")) return "final";

  return stageText as Stage;
}

function parseMatch(
  match: string | undefined,
  home: string | undefined,
  away: string | undefined,
  label: string | undefined,
  stage: Stage,
): { home: string | null; away: string | null; label: string | null } {
  if (home || away) {
    return {
      home: home || null,
      away: away || null,
      label: label || null,
    };
  }

  if (stage === "group" && match?.includes(" vs ")) {
    const [homeTeam, awayTeam] = match.split(/\s+vs\s+/, 2).map((team) => team.trim());

    return {
      home: homeTeam || null,
      away: awayTeam || null,
      label: null,
    };
  }

  return {
    home: null,
    away: null,
    label: label || match || null,
  };
}

function splitMarkdownRow(line: string): string[] {
  return line
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((value) => value.trim().replaceAll("\\|", "|"));
}

function normalizeHeader(header: string): string {
  return header.toLowerCase().replace(/\s+/g, "");
}

function toIsoFromCest(dateText: string, timeText: string): string {
  const isoDate = dateText.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const [hour, minute] = timeText.split(":").map(Number);

  if (Number.isNaN(hour) || Number.isNaN(minute)) {
    throw new Error(`Invalid CEST date/time: ${dateText} ${timeText}`);
  }

  if (isoDate) {
    const [, year, month, day] = isoDate;
    return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), hour - 2, minute, 0)).toISOString();
  }

  const dateParts = dateText.split(/\s+/);
  const day = Number(dateParts.find((part) => /^\d+$/.test(part)));
  const monthName = dateParts.find((part) => monthIndex[part]);

  if (!day || !monthName) {
    throw new Error(`Invalid CEST date/time: ${dateText} ${timeText}`);
  }

  return new Date(Date.UTC(2026, monthIndex[monthName], day, hour - 2, minute, 0)).toISOString();
}
