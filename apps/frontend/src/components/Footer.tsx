import Link from 'next/link';

import { SubscribeForm } from '@/components/newsletter/SubscribeForm';
import { SocialLinks } from '@/components/SocialLinks';

import { NAV_ITEMS } from '@/lib/nav-config';
import { getPublicSettings, resolveMediaUrl } from '@/lib/public-settings';

const byHref = (href: string) => NAV_ITEMS.find((item) => item.href === href)!;

// Derived from nav-config so new modules appear here automatically.
const footerLinks = {
  product: ['/play', '/quiz-mcq', '/image-riddles', '/jokes', '/riddle-mcq'].map(byHref),
  company: [{ href: '/about', label: 'About' }],
};

const legalLinks = [
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms of Service' },
  { href: '/contact', label: 'Contact' },
];

export default async function Footer(): Promise<JSX.Element> {
  const currentYear = new Date().getFullYear();

  // Same cached fetch as the root layout (Next dedupes it within the pass).
  const { site, seo } = await getPublicSettings();
  const siteName = site?.siteName?.trim() || seo?.siteName?.trim() || 'AI Quiz';
  const description =
    site?.siteDescription?.trim() ||
    'Enterprise-grade interactive quiz platform. Test your knowledge and have fun!';
  const logo = resolveMediaUrl(site?.logo?.trim() ?? '');

  return (
    <footer
      className="border-t border-secondary-200 bg-white dark:bg-secondary-800 px-4 py-8 dark:border-secondary-800 dark:bg-secondary-900"
      role="contentinfo"
      aria-label="Site footer"
    >
      <div className="container mx-auto">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link
              href="/"
              className="inline-flex items-center gap-2"
              aria-label={`${siteName} - Home`}
            >
              {logo && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={logo} alt="" className="h-9 w-auto max-w-[190px] object-contain" />
              )}
              <span className="text-xl font-bold text-primary-600">{siteName}</span>
            </Link>
            <p className="mt-2 text-secondary-600 dark:text-secondary-400">{description}</p>
            <SocialLinks socialLinks={site?.socialLinks} />
            <div className="mt-4 max-w-sm">
              <h3 className="font-semibold text-secondary-900 dark:text-secondary-100">
                Get new quizzes in your inbox
              </h3>
              <div className="mt-2">
                <SubscribeForm />
              </div>
            </div>
          </div>

          {/* Product Links */}
          <nav aria-label="Product links">
            <h3 className="font-semibold text-secondary-900 dark:text-secondary-100">Product</h3>
            <ul className="mt-2 space-y-2">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-secondary-600 hover:text-primary-600 dark:text-secondary-400 dark:hover:text-primary-400"
                    aria-label={`Go to ${link.label}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Company Links */}
          <nav aria-label="Company links">
            <h3 className="font-semibold text-secondary-900 dark:text-secondary-100">Company</h3>
            <ul className="mt-2 space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-secondary-600 hover:text-primary-600 dark:text-secondary-400 dark:hover:text-primary-400"
                    aria-label={`Go to ${link.label}`}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-8 border-t border-secondary-200 pt-4 text-center text-sm text-secondary-500 dark:border-secondary-800 dark:text-secondary-500">
          <nav
            aria-label="Legal links"
            className="mb-2 flex flex-wrap items-center justify-center gap-x-4 gap-y-1"
          >
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="hover:text-primary-600 dark:hover:text-primary-400"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <p>
            © {currentYear} {siteName}. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
