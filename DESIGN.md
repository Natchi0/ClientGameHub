# Design system

<!-- impeccable:design-schema 1 -->

## Direction

GameHub is a compact, contemporary game room: energetic enough to signal play, but calm enough to help people choose, coordinate, and return frequently. It is an operational product UI, not a game launcher fantasy or a generic SaaS dashboard.

## Visual language

- **Typography:** Red Hat Display for headings and DM Sans for reading and controls. Headings are tight, direct, and never need an eyebrow label to establish hierarchy.
- **Palette:** moss-green and near-black structure both themes; lime is a high-attention action/online signal; coral communicates social or caution states. Light mode is a soft warm white, not a washed-out version of dark mode. The palette is user-selectable: green (default), blue, orange and violet each ship a light and a dark variant, exposed as color swatches rather than names.
- **Surfaces:** one clear elevated surface for grouped decisions; otherwise use dividers and tonal fields. Corners are compact (12px), not pill-heavy.
- **Signature move:** activity and presence appear as small, purposeful dots and a restrained side panel, rather than decorative neon effects.

## Layout

- A 64px top navigation stays consistent across product routes and collapses to a menu on small screens.
- Routes are wrapped by a layout resolved from `meta.layout` (`src/app/layouts`); the header, navigation and chrome live there so a different layout (admin, sidebar) can replace it without touching the pages.
- The header leads with the current user's identity (avatar + nickname, including guests) and keeps sign-in and sign-up as secondary, icon-first affordances.
- Dashboard content is a scan-first sequence: immediate next-play context, game catalogue, then community and friends.
- Forms use a split composition on wide screens and collapse to the focused form on small screens.
- Content width is capped at `max-w-7xl`; standard responsive padding is 16px / 24px.

## Components

- Prefer installed shadcn-vue `Button` and `Input` components for controls. Use semantic token variants before adding local style rules.
- Use Lucide icons only where they add meaning; icon-only controls require an accessible label.
- Forms pair visible labels with inputs, validation text, and `aria-invalid` state.

## Responsive and accessibility behavior

- Preserve every action at mobile widths; desktop navigation becomes a disclosure menu.
- Theme switching is always visible and persisted by the existing theme composable; palette and light/dark mode live behind a single appearance button.
- Use semantic headings, native buttons/links, visible focus rings, and contrast-aware semantic tokens in both themes.

## Avoid

- Gradients, generic metric cards, decorative glass, and fake game-console UI.
- Replacing content hierarchy with a uniform grid of tiles.
- Raw controls where a matching shadcn-vue component is already installed.
