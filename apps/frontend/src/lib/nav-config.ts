/**
 * Single source of truth for the main site navigation
 * (plan/09-site-shell-seo.md P2: Header, Header mobile menu, and Footer all
 * render from this list instead of three hand-maintained copies).
 */
export interface NavItem {
  href: string;
  label: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Home' },
  { href: '/play', label: 'Play Hub' },
  { href: '/quiz-mcq', label: 'Quiz' },
  { href: '/jokes', label: 'Dad Jokes' },
  { href: '/riddle-mcq', label: 'Riddles' },
  { href: '/image-riddles', label: 'Image Riddles' },
  { href: '/about', label: 'About' },
];

/** Home is rendered as the logo in the Header, so nav menus skip it there. */
export const NAV_MENU_ITEMS: NavItem[] = NAV_ITEMS.filter((item) => item.href !== '/');
