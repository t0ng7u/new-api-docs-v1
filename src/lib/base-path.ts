/**
 * Base path helper for GitHub Pages deployment
 * Automatically prepends the base path to URLs
 */

export const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

/**
 * Add base path to a URL
 * @param path - The path to add base path to
 * @returns The full path with base path prepended
 */
export function withBasePath(path: string): string {
  if (!path) return basePath || '/';

  // If path is absolute URL, return as is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  // Ensure path starts with /
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;

  // If no base path, return original
  if (!basePath) return normalizedPath;

  // Combine base path and path
  return `${basePath}${normalizedPath}`;
}
