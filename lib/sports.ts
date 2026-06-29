// Central catalog of sports, formats, and entry types. Single source of
// truth shared by the Zod schemas, the create/edit forms, and (later) the
// sport-specific scoring rules. Keeping these as `as const` tuples means the
// Zod enums and the TS unions stay in lockstep automatically.

export const SPORTS = ['Pickleball', 'Tennis', 'Basketball'] as const;
export type Sport = (typeof SPORTS)[number];

// `implemented: false` lets the UI disable a format and the bracket
// generator reject it until its engine lands, rather than silently
// producing an incorrect bracket.
export const FORMATS = [
  { value: 'SINGLE_ELIM', label: 'Single Elimination', implemented: true },
  { value: 'ROUND_ROBIN', label: 'Round Robin', implemented: true },
  { value: 'DOUBLE_ELIM', label: 'Double Elimination', implemented: true },
  { value: 'SWISS', label: 'Swiss', implemented: false },
  { value: 'GROUP_STAGE', label: 'Group Stage + Playoffs', implemented: true },
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
