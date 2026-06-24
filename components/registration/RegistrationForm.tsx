// Full registration form for a tournament.
// Handles: 1-player (singles) and 2-player (doubles) flows based on tournament.teamSize.
// Includes: TeamMemberFields, SkillLevelSelect, WaiverCheckbox, submit → POST /api/tournaments/[id]/teams.
// Implemented in Step 5 (Registration flow).

interface Props {
  tournamentId: string;
  teamSize: 1 | 2;
  requiresPayment: boolean;
  entryFeeCents: number;
}

export default function RegistrationForm(_props: Props) {
  return <div>RegistrationForm — not yet implemented</div>;
}
