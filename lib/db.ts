// Database helper for Cloudflare D1
// Uses getCloudflareContext for production, falls back to null for local dev

export async function getDB(): Promise<any | null> {
  try {
    // Dynamic import to avoid build issues
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const ctx = getCloudflareContext();
    return (ctx?.env as any)?.DB || null;
  } catch (error) {
    console.log('D1 not available, using local mode');
    return null;
  }
}

export async function getInviteCode(): Promise<string | undefined> {
  try {
    const { getCloudflareContext } = await import('@opennextjs/cloudflare');
    const ctx = getCloudflareContext();
    return (ctx?.env as any)?.INVITE_CODE || process.env.INVITE_CODE;
  } catch {
    return process.env.INVITE_CODE;
  }
}
