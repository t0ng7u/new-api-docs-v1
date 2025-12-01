import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { QQGroupQuiz } from '@/components/qq-group-quiz';
import { APIPage } from '@/components/api-page';

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...(defaultMdxComponents as MDXComponents),
    QQGroupQuiz,
    // APIPage is an async server component, need type assertion to bypass MDX type check
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    APIPage: APIPage as any,
    ...components,
  };
}
