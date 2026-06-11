export type Stage = "group" | "r32" | "r16" | "qf" | "sf" | "3p" | "final";

export type Match = {
  id: string;
  startsAt: string;
  sourceDate: string;
  sourceTime: string;
  group: string;
  stage: Stage;
  home: string | null;
  away: string | null;
  homeCode: string | null;
  awayCode: string | null;
  label: string | null;
  venue: string;
};
