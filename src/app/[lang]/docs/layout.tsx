import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions, linkItems } from '@/lib/layout.shared';
import { Footer } from '@/components/footer';
// AI 功能暂时禁用
// import { AISearchTrigger } from '@/components/search';
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
      tabMode="top"
      tree={source.pageTree[lang]}
      links={linkItems.filter((item) => item.type === 'icon')}
      sidebar={{
        defaultOpenLevel: 0,
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
      <Footer lang={lang} />
      {/* AI 功能暂时禁用 */}
      {/* <AISearchTrigger /> */}
    </DocsLayout>
  );
}
