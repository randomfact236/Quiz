/**
 * Single source of truth for the main site navigation
 * (plan/09-site-shell-seo.md P2: Header, Header mobile menu, and Footer all
 * render from this list instead of three hand-maintained copies).
 */
interface NavItem {
  href: string;
  label: string;
}

/** Primary destinations — the top bar (desktop) and the mobile menu drawer. */
export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/play', label: 'Play Hub' },
  { href: '/quiz-mcq', label: 'Quiz' },
  { href: '/games', label: 'Games' },
  { href: '/jokes', label: 'Dad Jokes' },
  { href: '/riddle-mcq', label: 'Riddles' },
  { href: '/image-riddles', label: 'Image Riddles' },
];

/**
 * Secondary destinations — the footer and the logged-in user menu. Deliberately
 * not in the top bar: Achievements is personal (meaningful when signed in) and
 * About is secondary.
 */
export const NAV_SECONDARY_ITEMS: NavItem[] = [
  { href: '/achievements', label: 'Achievements' },
  { href: '/about', label: 'About' },
];

/** Mobile menu drawer: everything except Home (rendered as the logo there). */
export const NAV_MENU_ITEMS: NavItem[] = [...NAV_ITEMS, ...NAV_SECONDARY_ITEMS];
