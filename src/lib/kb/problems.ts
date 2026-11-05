// The problems inside one merged ticket. causes.ts says which cause a report belongs to, by tenant.
// The desk's own notes (desk-notes.json) set apart reports that read as a one-day move, not a
// day/month flip. Here those are a problem of their own, not a footnote under their tenant's cause.
import { causeOf, uniqueById, type Cause, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = Cause | 'one-day move' | 'unplaced';
export const PROBLEMS: readonly Problem[] = ['parser', 'hint', 'one-day move', 'unplaced'];

export function problemOf(r: Report, t: Tenant | undefined, oneDayMove: readonly string[]): Problem {
  if (oneDayMove.includes(r.id)) return 'one-day move';
  return causeOf(r, t) ?? 'unplaced';
}

export type ProblemGroup = {
  problem: Problem;
  reports: Report[];
  tenants: string[];
  // What intake tagged these reports as: tag → count, in PROBLEMS order.
  taggedAs: Record<string, number>;
  // Does intake have a tag of this problem's name at all? Intake knows only the tags in the data,
  // so for a problem it has no tag for, taggedAs shows what it chose instead, not a mismatch.
  intakeHasTag: boolean;
  firstSeen: string;
  lastSeen: string;
};

export type Split = {
  // Rows in the export, before repeats from overlapping pages are dropped.
  rows: number;
  // Distinct reports merged into the ticket.
  merged: number;
  // Every tag intake used on these reports, in PROBLEMS order.
  intakeTags: string[];
  groups: ProblemGroup[];
};

export function splitTicket(
  rows: Report[],
  ticket: number,
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): Split {
  const merged = uniqueById(rows).filter((r) => r.mergedInto === ticket);
  const intakeTags = new Set(merged.map((r) => r.meta.intakeTag));
  const rank = (tag: string) => (PROBLEMS.includes(tag as Problem) ? PROBLEMS.indexOf(tag as Problem) : PROBLEMS.length);
  const groups = PROBLEMS.map((problem) => {
    const rs = merged.filter((r) => problemOf(r, tenantOf(r), oneDayMove) === problem);
    const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
    const tags = [...new Set(rs.map((r) => r.meta.intakeTag))].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b));
    return {
      problem,
      reports: rs,
      tenants: [...new Set(rs.map((r) => r.tenant))].sort(),
      taggedAs: Object.fromEntries(tags.map((tag) => [tag, rs.filter((r) => r.meta.intakeTag === tag).length])),
      intakeHasTag: intakeTags.has(problem),
      firstSeen: days[0],
      lastSeen: days[days.length - 1],
    };
  }).filter((g) => g.reports.length > 0);
  return {
    rows: rows.filter((r) => r.mergedInto === ticket).length,
    merged: merged.length,
    intakeTags: [...intakeTags].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b)),
    groups,
  };
}
