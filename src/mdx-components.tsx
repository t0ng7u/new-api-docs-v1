import defaultMdxComponents from 'fumadocs-ui/mdx';
import type { MDXComponents } from 'mdx/types';
import { MDXImage } from '@/components/mdx-image';

export function getMDXComponents(components?: MDXComponents): MDXComponents {
  return {
    ...defaultMdxComponents,
    // Override img and Image to handle basePath
    img: (props) => <MDXImage {...(props as any)} />,
    Image: MDXImage,
    ...components,
  };
}
