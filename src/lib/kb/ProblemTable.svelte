<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import { splitTicket } from '#lib/kb/problems';
  import type { Report } from '#lib/kb/causes';
  import { tenantOf } from '#lib/kb/locales';

  // tickets: problem → link to the ticket filed for it. A problem with no link has no ticket yet.
  let { ticket, tickets = {} }: { ticket: number; tickets?: Record<string, string> } = $props();

  const split = $derived(splitTicket(reports as Report[], ticket, tenantOf, notes.oneDayMove));
  const ref = (url: string) => '#' + url.split('/').pop();
  const tags = (taggedAs: Record<string, number>) =>
    Object.entries(taggedAs)
      .map(([tag, n]) => `${tag} ×${n}`)
      .join(' · ');
  const untagged = $derived(split.groups.filter((g) => !g.intakeHasTag).map((g) => g.problem));
</script>

<p class="sum">
  <strong>{split.merged}</strong> reports merged into #{ticket} ·
  <strong>{split.groups.length}</strong>
  {split.groups.length === 1 ? 'problem' : 'problems'}
  {#if split.rows !== split.merged}
    <span class="note">({split.rows} rows in the export; {split.rows - split.merged} are repeats from overlapping pages)</span>
  {/if}
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>intake tagged as</th><th>tenants</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each split.groups as g (g.problem)}
      <tr>
        <td><code>{g.problem}</code></td>
        <td>{g.reports.length}</td>
        <td class="tags">
          {tags(g.taggedAs)}
          {#if !g.intakeHasTag}<span class="note">(intake has no {g.problem} tag)</span>{/if}
        </td>
        <td title={g.tenants.join(', ')}>{g.tenants.length}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
        <td>
          {#if tickets[g.problem]}<a href={tickets[g.problem]}>{ref(tickets[g.problem])}</a>
          {:else}<span class="none">no ticket yet</span>{/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

<p class="note">
  Intake tags a report from the reporter's browser, with one of {split.intakeTags.length} tags:
  {#each split.intakeTags as tag, i (tag)}{i ? ' or ' : ''}<code>{tag}</code>{/each}.
  {#each untagged as problem (problem)}
    It has no tag for <code>{problem}</code>, so that row shows what intake tagged those reports as, not a mismatch.
  {/each}
</p>

<style>
  .sum { font-size: 1.1rem; }
  .note { color: var(--muted); font-size: 0.85em; }
  .tags { font-size: 0.85em; }
  .none { color: var(--warn); font-weight: 600; }
</style>
