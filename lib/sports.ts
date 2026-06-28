// Central catalog of sports, formats, and entry types. Single source of
// truth shared by the Zod schemas, the create/edit forms, and (later) the
// sport-specific scoring rules. Keeping these as `as const` tuples means the
// Zod enums and the TS unions stay in lockstep automatically.

export const SPORTS = ['Pickleball', 'Tennis', 'Basketball'] as const;
export type Sport = (typeof SPORTS)[number];

// Only SINGLE_ELIM has a working bracket engine today. The others are listed
// so organizers can see what's coming and so creation stores intent, but
// `implemented: false` lets the UI disable them and the bracket generator
// reject them until their engines land (roadmap Phase 6).
export const FORMATS = [
  { value: 'SINGLE_ELIM', label: 'Single Elimination', implemented: true },
  { value: 'ROUND_ROBIN', label: 'Round Robin', implemented: true },
  { value: 'DOUBLE_ELIM', label: 'Double Elimination', implemented: false },
  { value: 'SWISS', label: 'Swiss', implemented: false },
] as const;

export type TournamentFormatValue = (typeof FORMATS)[number]['value'];

export function isFormatImplemented(format: string): boolean {
  return FORMATS.some((f) => f.value === format && f.implemented);
}

export const ENTRY_TYPES = [
  { value: 'SOLO', label: 'Solo (1 player)', teamSize: 1 },
  { value: 'TEAM', label: 'Team / Doubles (2 players)', teamSize: 2 },
] as const;

export type EntryType = (typeof ENTRY_TYPES)[number]['value'];

export function teamSizeForEntryType(entryType: string): number {
  return ENTRY_TYPES.find((e) => e.value === entryType)?.teamSize ?? 1;
}
