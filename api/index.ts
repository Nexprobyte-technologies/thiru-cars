import handler from '../server.ts';

export default async function vercelEntry(req: any, res: any) {
  try {
    const rawUrl = typeof req.url === 'string' ? req.url : '/';
    const parsed = new URL(rawUrl, 'http://localhost');
    const targetPath = parsed.searchParams.get('__path');
    if (targetPath) {
      parsed.searchParams.delete('__path');
      const remainingQuery = parsed.searchParams.toString();
      const normalizedPath = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
      req.url = remainingQuery ? `${normalizedPath}?${remainingQuery}` : normalizedPath;
    }
  } catch {
    // Keep original req.url if URL parsing fails
  }
  return handler(req, res);
}