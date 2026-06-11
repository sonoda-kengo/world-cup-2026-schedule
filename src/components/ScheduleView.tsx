"use client";

import { useEffect, useMemo, useState } from "react";
import type { Match, Stage } from "@/data/types";
import { flagEmoji } from "@/lib/flags";
import { dictionaries, type Locale, stageLabels, teamName } from "@/lib/i18n";
import { formatMatchDate, type TimezoneKey } from "@/lib/time";

type StageFilter = "all" | "group" | "knockout";
type GroupFilter = "all" | string;
type DateFilter = "all" | string;

type TeamOption = {
  canonical: string;
  code: string | null;
  label: string;
  aliases: string[];
};

type Props = {
  matches: Match[];
};

const stageClass: Record<Stage, string> = {
  group: "stageGroup",
  r32: "stageR32",
  r16: "stageR16",
  qf: "stageQf",
  sf: "stageSf",
  "3p": "stageThird",
  final: "stageFinal",
};

const teamAliases: Record<string, string[]> = {
  "Bosnia & Herzegovina": ["Bosnia", "Bosnia and Herzegovina", "BiH"],
  "Côte d’Ivoire": ["Cote d'Ivoire", "Côte d'Ivoire", "Ivory Coast", "Cote dIvoire"],
  Curaçao: ["Curacao"],
  Czechia: ["Czech Republic"],
  "DR Congo": ["Democratic Republic of the Congo", "D.R. Congo", "Congo DR"],
  England: ["GB England"],
  "South Korea": ["Korea Republic", "Republic of Korea"],
  Türkiye: ["Turkey", "Turkiye"],
  USA: ["United States", "United States of America", "U.S.A."],
};

const pinnedTeamOrder = ["Japan", "Netherlands"];

export function ScheduleView({ matches }: Props) {
  const [locale, setLocale] = useState<Locale>("en");
  const [timezone, setTimezone] = useState<TimezoneKey>("nl");
  const [stageFilter, setStageFilter] = useState<StageFilter>("all");
  const [groupFilter, setGroupFilter] = useState<GroupFilter>("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [showPastMatches, setShowPastMatches] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTeamInputFocused, setIsTeamInputFocused] = useState(false);
  const [teamQuery, setTeamQuery] = useState("");
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);
  const dict = dictionaries[locale];

  useEffect(() => {
    setNow(Date.now());
  }, []);

  const groupOptions = useMemo(() => {
    return Array.from(
      new Set(
        matches
          .filter((match) => match.stage === "group" && match.group !== "—")
          .map((match) => match.group),
      ),
    ).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [matches]);

  const dateOptions = useMemo(() => {
    const options = new Map<string, string>();

    for (const match of matches.toSorted((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))) {
      const { day, dayKey } = formatMatchDate(match.startsAt, timezone, locale);
      options.set(dayKey, day);
    }

    return Array.from(options, ([value, label]) => ({ value, label }));
  }, [locale, matches, timezone]);

  const teamOptions = useMemo<TeamOption[]>(() => {
    const teams = new Map<string, string | null>();

    for (const match of matches) {
      if (match.home) {
        teams.set(match.home, match.homeCode);
      }

      if (match.away) {
        teams.set(match.away, match.awayCode);
      }
    }

    return Array.from(teams, ([canonical, code]) => ({
      canonical,
      code,
      label: teamName(canonical, locale),
      aliases: Array.from(
        new Set([
          canonical,
          teamName(canonical, "en"),
          teamName(canonical, "ja"),
          ...(teamAliases[canonical] ?? []),
        ].filter(Boolean)),
      ),
    })).sort((a, b) => a.label.localeCompare(b.label, locale === "ja" ? "ja" : "en"));
  }, [locale, matches]);

  const teamCandidates = useMemo(() => {
    const normalizedQuery = normalizeSearch(teamQuery);

    if (!normalizedQuery) {
      return sortWithPinnedTeams(teamOptions).slice(0, 8);
    }

    return teamOptions
      .filter((option) => option.aliases.some((alias) => normalizeSearch(alias).includes(normalizedQuery)))
      .slice(0, 8);
  }, [teamOptions, teamQuery]);

  const filtered = useMemo(() => {
    const normalizedTeamQuery = normalizeSearch(teamQuery);
    const todayKey = now === null ? null : formatMatchDate(new Date(now).toISOString(), timezone, locale).dayKey;

    return matches
      .filter((match) => {
        const stageOk =
          stageFilter === "all" ||
          (stageFilter === "group" && match.stage === "group") ||
          (stageFilter === "knockout" && match.stage !== "group");

        const groupOk =
          groupFilter === "all" ||
          (match.stage === "group" && match.group.toLowerCase() === groupFilter.toLowerCase());

        const dateOk =
          dateFilter === "all" || formatMatchDate(match.startsAt, timezone, locale).dayKey === dateFilter;

        const timeOk =
          showPastMatches ||
          dateFilter !== "all" ||
          todayKey === null ||
          formatMatchDate(match.startsAt, timezone, locale).dayKey >= todayKey;

        const selectedTeamOk =
          !selectedTeam || match.home === selectedTeam || match.away === selectedTeam;

        const teamQueryOk =
          !normalizedTeamQuery ||
          Boolean(
            [match.home, match.away]
              .filter(Boolean)
              .some((team) => teamMatchesQuery(team, normalizedTeamQuery)),
          );

        return stageOk && groupOk && dateOk && timeOk && selectedTeamOk && teamQueryOk;
      })
      .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt));
  }, [
    dateFilter,
    groupFilter,
    locale,
    matches,
    now,
    selectedTeam,
    showPastMatches,
    stageFilter,
    teamQuery,
    timezone,
  ]);

  const grouped = useMemo(() => {
    return filtered.reduce<Array<{ day: string; dayKey: string; items: Match[] }>>((days, match) => {
      const { day, dayKey } = formatMatchDate(match.startsAt, timezone, locale);
      const last = days[days.length - 1];

      if (last?.dayKey === dayKey) {
        last.items.push(match);
      } else {
        days.push({ day, dayKey, items: [match] });
      }

      return days;
    }, []);
  }, [filtered, locale, timezone]);

  return (
    <main className="shell">
      <section className="hero" aria-labelledby="page-title">
        <div className="heroCopy">
          <p className="kicker">{dict.kicker}</p>
          <h1 id="page-title">{dict.title}</h1>
          <p className="subtitle">{dict.subtitle}</p>
        </div>

        <div className="heroActions" aria-label="Schedule controls">
          <SegmentedControl
            label={dict.timezone}
            value={timezone}
            options={[
              { value: "nl", label: dict.netherlands },
              { value: "jp", label: dict.japan },
            ]}
            onChange={(value) => setTimezone(value as TimezoneKey)}
          />
          <SegmentedControl
            label={dict.language}
            value={locale}
            options={[
              { value: "en", label: "EN" },
              { value: "ja", label: "日本語" },
            ]}
            onChange={(value) => setLocale(value as Locale)}
          />
        </div>
      </section>

      <section className="toolbar" aria-label="Filters">
        <button
          aria-expanded={isSearchOpen}
          className={teamQuery || selectedTeam ? "searchToggle active" : "searchToggle"}
          onClick={() => setIsSearchOpen((open) => !open)}
          type="button"
        >
          <span aria-hidden="true">⌕</span>
          {dict.searchToggle}
        </button>
        <div className={isSearchOpen ? "teamCombobox open" : "teamCombobox"}>
          <span aria-hidden="true">⌕</span>
          <input
            aria-autocomplete="list"
            aria-expanded={isTeamInputFocused && teamCandidates.length > 0}
            aria-label={dict.search}
            role="combobox"
            value={teamQuery}
            onBlur={() => setIsTeamInputFocused(false)}
            onChange={(event) => {
              setTeamQuery(event.target.value);
              setSelectedTeam(null);
            }}
            onFocus={() => setIsTeamInputFocused(true)}
            placeholder={dict.search}
          />
          {(teamQuery || selectedTeam) && (
            <button
              aria-label={dict.clearTeam}
              className="clearTeamButton"
              onClick={() => {
                setTeamQuery("");
                setSelectedTeam(null);
              }}
              type="button"
            >
              ×
            </button>
          )}
          {isTeamInputFocused && teamCandidates.length > 0 && (
            <div className="teamSuggestions" role="listbox">
              {teamCandidates.map((option) => (
                <button
                  key={option.canonical}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => {
                    setSelectedTeam(option.canonical);
                    setTeamQuery(option.label);
                    setIsTeamInputFocused(false);
                    setIsSearchOpen(true);
                  }}
                  role="option"
                  type="button"
                >
                  <span className="flag" aria-hidden="true">
                    {flagEmoji(option.code)}
                  </span>
                  <span>{option.label}</span>
                  {option.label !== option.canonical && <small>{option.canonical}</small>}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="filterButtons">
          {[
            ["all", dict.all],
            ["group", dict.group],
            ["knockout", dict.knockout],
          ].map(([value, label]) => (
            <button
              className={stageFilter === value ? "filter active" : "filter"}
              key={value}
              onClick={() => {
                const nextStage = value as StageFilter;
                setStageFilter(nextStage);
                if (nextStage !== "group") {
                  setGroupFilter("all");
                }
              }}
              type="button"
            >
              {label}
            </button>
          ))}
        </div>
        <label className="groupSelect">
          <span>{dict.groupFilter}</span>
          <select
            value={groupFilter}
            onChange={(event) => {
              setGroupFilter(event.target.value);
              if (event.target.value !== "all") {
                setStageFilter("group");
              }
            }}
          >
            <option value="all">{dict.allGroups}</option>
            {groupOptions.map((group) => (
              <option key={group} value={group}>
                {dict.groupShort} {group}
              </option>
            ))}
          </select>
        </label>
        <label className="dateSelect">
          <span>{dict.dateFilter}</span>
          <select value={dateFilter} onChange={(event) => setDateFilter(event.target.value)}>
            <option value="all">{dict.allDates}</option>
            {dateOptions.map((date) => (
              <option key={date.value} value={date.value}>
                {date.label}
              </option>
            ))}
          </select>
        </label>
        <label className="pastToggle">
          <input
            checked={showPastMatches}
            onChange={(event) => setShowPastMatches(event.target.checked)}
            type="checkbox"
          />
          <span>{dict.showPastMatches}</span>
        </label>
        <p className="matchCount">
          {filtered.length} / {matches.length} {dict.matches}
        </p>
      </section>

      <section className="scheduleGrid" aria-live="polite">
        {grouped.length === 0 ? (
          <div className="empty">
            <p>{!showPastMatches && dateFilter === "all" ? dict.noUpcomingMatches : dict.noResults}</p>
            {!showPastMatches && dateFilter === "all" && (
              <button onClick={() => setShowPastMatches(true)} type="button">
                {dict.showPastMatches}
              </button>
            )}
          </div>
        ) : (
          grouped.map((day) => (
            <article className="dayPanel" key={day.dayKey}>
              <h2>{day.day}</h2>
              <div className="matchList">
                {day.items.map((match) => (
                  <MatchRow
                    dict={dict}
                    key={match.id}
                    locale={locale}
                    match={match}
                    timezone={timezone}
                  />
                ))}
              </div>
            </article>
          ))
        )}
      </section>

      <footer className="footer">
        <a href="https://github.com/sonoda-kengo" rel="noreferrer" target="_blank">
          {dict.authorCredit}
        </a>
      </footer>
    </main>
  );
}

function MatchRow({
  dict,
  locale,
  match,
  timezone,
}: {
  dict: typeof dictionaries[Locale];
  locale: Locale;
  match: Match;
  timezone: TimezoneKey;
}) {
  const date = formatMatchDate(match.startsAt, timezone, locale);
  const stage = match.stage === "group" ? `${dict.groupShort} ${match.group}` : stageLabels[locale][match.stage];

  return (
    <div className="matchRow">
      <time dateTime={match.startsAt}>{date.time}</time>
      <div className="teams">
        {match.home && match.away ? (
          <>
            <Team name={match.home} code={match.homeCode} locale={locale} />
            <span className="versus">vs</span>
            <Team name={match.away} code={match.awayCode} locale={locale} />
          </>
        ) : (
          <strong>{match.label ? stageLabels[locale][match.stage] : stage}</strong>
        )}
        <span className="venue">{match.venue}</span>
      </div>
      <span className={`stageBadge ${stageClass[match.stage]}`}>{stage}</span>
    </div>
  );
}

function Team({ name, code, locale }: { name: string; code: string | null; locale: Locale }) {
  return (
    <strong className="team">
      <span className="flag" aria-hidden="true">
        {flagEmoji(code)}
      </span>
      <span>{teamName(name, locale)}</span>
    </strong>
  );
}

function normalizeSearch(value: string | null | undefined): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’‘]/g, "'")
    .toLowerCase()
    .trim();
}

function teamMatchesQuery(team: string | null | undefined, normalizedQuery: string): boolean {
  if (!team) return false;

  const aliases = [team, teamName(team, "en"), teamName(team, "ja"), ...(teamAliases[team] ?? [])];

  return aliases.some((alias) => normalizeSearch(alias).includes(normalizedQuery));
}

function sortWithPinnedTeams(options: TeamOption[]): TeamOption[] {
  return [...options].sort((a, b) => {
    const aIndex = pinnedTeamOrder.indexOf(a.canonical);
    const bIndex = pinnedTeamOrder.indexOf(b.canonical);

    if (aIndex !== -1 || bIndex !== -1) {
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    }

    return 0;
  });
}

function SegmentedControl({
  label,
  onChange,
  options,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  value: string;
}) {
  return (
    <div className="segmented">
      <span>{label}</span>
      <div>
        {options.map((option) => (
          <button
            className={value === option.value ? "selected" : ""}
            key={option.value}
            onClick={() => onChange(option.value)}
            type="button"
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
