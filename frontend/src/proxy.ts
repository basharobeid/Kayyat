import createMiddleware from 'next-intl/middleware';

import { routing } from './i18n/routing';

// Next 16 "proxy" (formerly middleware): redirects / to the preferred locale.
export default createMiddleware(routing);

export const config = {
  // Everything except API routes, Next internals, and files with an extension.
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
