'use client';

import { RootProvider } from 'fumadocs-ui/provider/next';
import { Banner } from 'fumadocs-ui/components/banner';
import type { ReactNode } from 'react';
import Link from 'next/link';

const bannerText: Record<string, { message: string; linkText: string }> = {
  en: {
    message: 'API docs upgrading. For non-relay API docs, visit',
    linkText: 'docs.newapi.pro',
  },
  zh: {
    message: 'API 文档升级中，非中继接口文档请访问',
    linkText: 'docs.newapi.pro',
  },
  ja: {
    message: 'APIドキュメント更新中。非中継APIドキュメントは',
    linkText: 'docs.newapi.pro',
  },
};

export function Provider({
  children,
  i18n,
  lang,
}: {
  children: ReactNode;
  i18n: Parameters<typeof RootProvider>[0]['i18n'];
  lang?: string;
}) {
  const text = bannerText[lang || 'en'] || bannerText.en;

  return (
    <RootProvider i18n={i18n}>
      <Banner id="api-docs-upgrade" variant="rainbow">
        <span className="text-center">
          {text.message}{' '}
          <Link
            href="https://docs.newapi.pro/api/auth-system-description/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-fd-primary inline-flex font-semibold whitespace-nowrap underline underline-offset-2"
          >
            {text.linkText}
          </Link>
        </span>
      </Banner>
      {children}
    </RootProvider>
  );
}
