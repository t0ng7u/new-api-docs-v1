import Image, { type ImageProps } from 'next/image';
import { withBasePath } from '@/lib/base-path';

/**
 * MDX Image component with automatic basePath handling
 */
export function MDXImage(props: ImageProps) {
  const { src, ...rest } = props;

  // Only add basePath to string paths, not imported images or external URLs
  const processedSrc = typeof src === 'string' ? withBasePath(src) : src;

  return <Image src={processedSrc} {...rest} unoptimized />;
}
