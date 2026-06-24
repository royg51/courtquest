// Read-only bracket viewer — used on public tournament page and player dashboard.
// Renders rounds left-to-right, with MatchCards connected by SVG lines.
// When `mode="organizer"`, MatchCards show a score entry button.
// Implemented in Step 6 (Bracket viewer).

import type { BracketTree } from '@/types';

interface Props {
  bracket: BracketTree;
  mode?: 'public' | 'organizer';
}

export default function BracketViewer(_props: Props) {
  return <div>BracketViewer — not yet implemented</div>;
}
