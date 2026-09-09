'use client';

import { createContext, useContext } from 'react';

/**
 * Site brand values resolved server-side in the root layout (from the `site`
 * settings group) and handed to client components — the Header renders the
 * logo/name without an extra client fetch or flash of fallback text.
 */
export interface SiteBrand {
  /** Resolved brand name (site → seo → built-in default) */
  siteName: string;
  /** Absolute logo URL, or '' when unset (render the text brand) */
  logo: string;
}

const DEFAULT_BRAND: SiteBrand = { siteName: 'AI Quiz', logo: '' };

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
