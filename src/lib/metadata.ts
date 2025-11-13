import type { Metadata } from 'next';
import { withBasePath } from '@/lib/base-path';

export function createMetadata(override: Metadata): Metadata {
  return {
    ...override,
    icons: {
      icon: withBasePath('/favicon.ico'),
      shortcut: withBasePath('/favicon.ico'),
      apple: withBasePath('/assets/logo.png'),
    },
    openGraph: {
      title: override.title ?? undefined,
      description: override.description ?? undefined,
      url: 'https://www.newapi.ai',
      images: withBasePath('/assets/logo.png'),
      siteName: 'New API',
      type: 'website',
      ...override.openGraph,
    },
    twitter: {
      card: 'summary_large_image',
      title: override.title ?? undefined,
      description: override.description ?? undefined,
      images: withBasePath('/assets/logo.png'),
      ...override.twitter,
    },
  };
}

export const baseUrl =
  process.env.NODE_ENV === 'development' ||
  !process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? new URL('http://localhost:3000')
    : new URL(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
