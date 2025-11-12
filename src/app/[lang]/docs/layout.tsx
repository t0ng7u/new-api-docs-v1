import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions, linkItems } from '@/lib/layout.shared';
import 'katex/dist/katex.min.css';

export default async function Layout({
  params,
  children,
}: {
  params: Promise<{ lang: string }>;
  children: React.ReactNode;
}) {
  const { lang } = await params;
  const base = baseOptions(lang);

  return (
    <DocsLayout
      {...base}
      tree={source.pageTree[lang]}
      links={linkItems.filter((item) => item.type === 'icon')}
      sidebar={{
        defaultOpenLevel: 0,
        banner: (
          <div className="bg-fd-primary/10 text-fd-primary border-fd-primary/20 mb-2 rounded-lg border px-4 py-3 text-sm">
            <p className="mb-1 font-semibold">📚 Documentation</p>
            <p className="text-fd-muted-foreground text-xs">
              Enterprise-grade AI Gateway & API Orchestration Platform
            </p>
          </div>
        ),
        tabs: {
          transform(option, node) {
            if (!node.icon) return option;

            return {
              ...option,
              icon: (
                <div className="max-md:bg-fd-primary/10 max-md:border-fd-primary/20 size-full rounded-lg max-md:border max-md:p-1.5 [&_svg]:size-full">
                  {node.icon}
                </div>
              ),
            };
          },
        },
      }}
    >
      {children}
    </DocsLayout>
  );
}
