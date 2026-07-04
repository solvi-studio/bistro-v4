import { headers } from 'next/headers';

export async function getClerkProxyConfig() {
  const headerList = await headers();
  const host = headerList.get('host') || '';
  const clerkProxyEndpoint = '/__clerk';

  // 1. Local environment check
  if (host.includes('localhost') || host.includes('127.0.0.1')) {
    return {};
  }

  // 2. Staging / Test environment check
  if (host.includes('test')) {
    return { proxyUrl: 'https://test.solvi.studio' + clerkProxyEndpoint };
  }

  // 3. Fallback to production for everything else (including Vercel production domains)
  return { proxyUrl: 'https://solvi.studio' + clerkProxyEndpoint };
}
