import Link from 'next/link';

const footerLinks = {
  product: [
    { href: '/quiz', label: 'Quiz' },
    { href: '/jokes', label: 'Dad Jokes' },
    { href: '/riddles', label: 'Riddles' },
  ],
  company: [
    { href: '/about', label: 'About Us' },
  ],
};

export default function Footer(): JSX.Element {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-secondary-200 bg-white px-4 py-8 dark:border-secondary-800 dark:bg-secondary-900" role="contentinfo" aria-label="Site footer">
      <div className="container mx-auto">
        <div className="grid gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="text-xl font-bold text-primary-600" aria-label="AI Quiz - Home">
              AI Quiz
            </Link>
            <p className="mt-2 text-secondary-600 dark:text-secondary-400">
              Enterprise-grade interactive quiz platform. Test your knowledge and have fun!
            </p>
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

        <div className="mt-8 border-t border-secondary-200 pt-4 text-center text-secondary-500 text-sm dark:border-secondary-800 dark:text-secondary-500">
          <p>© {currentYear} AI Quiz Platform. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}