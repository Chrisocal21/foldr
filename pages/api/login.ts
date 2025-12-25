import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }
  const { username, password } = req.body;
  // Use server-side env vars (no NEXT_PUBLIC_ prefix for security)
  if (
    username === process.env.APP_USER &&
    password === process.env.APP_PASS
  ) {
    // In a real app, set a secure cookie or JWT here
    res.status(200).json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
}
