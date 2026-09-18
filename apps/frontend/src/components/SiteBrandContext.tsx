'use client';

import { createContext, useContext } from 'react';

import { BUILT_IN_BRAND_ASSETS } from '@/lib/brand-assets';

/**
 * Site brand values resolved server-side in the root layout (from the `site`
 * settings group) and handed to client components — the Header renders the
 * logo/name without an extra client fetch or flash of fallback text.
 */
export interface SiteBrand {
  /** Resolved brand name (site → seo → built-in default) */
  siteName: string;
  /** Wide/whole logo URL for large screens, or '' when unset */
  logo: string;
  /** Dark-mode variant of the main logo, or '' to reuse the main logo */
  logoDark: string;
  /** Square icon URL (app icon) for mobile surfaces + browser tab, or '' */
  favicon: string;
  /** Mobile-only header logo, or '' to use the square icon + site name */
  mobileLogo: string;
  /** Show the site-name text in the mobile header beside the icon */
  mobileShowSiteName: boolean;
}

/** Built-in PigZap marks — the brand floor. An empty admin setting must never
 * regress a surface to a generic placeholder: these ship with the app and are
 * the defaults every consumer falls back to (BUG: old bolt placeholder regressed
 * desktop/tablet when no logo was uploaded). Admin uploads still override. */
const DEFAULT_BRAND: SiteBrand = {
  siteName: 'PigZap',
  logo: BUILT_IN_BRAND_ASSETS.logo,
  logoDark: BUILT_IN_BRAND_ASSETS.logoDark,
  favicon: BUILT_IN_BRAND_ASSETS.favicon,
  mobileLogo: '',
  mobileShowSiteName: true,
};

const SiteBrandContext = createContext<SiteBrand>(DEFAULT_BRAND);

export function SiteBrandProvider({
  value,
  children,
}: {
  value: SiteBrand;
  children: React.ReactNode;
}): JSX.Element {
  return <SiteBrandContext.Provider value={value}>{children}</SiteBrandContext.Provider>;
}

export function useSiteBrand(): SiteBrand {
  return useContext(SiteBrandContext);
}
