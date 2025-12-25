import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }
  const { username, password } = req.body;
  
  const envUser = process.env.APP_USER;
  const envPass = process.env.APP_PASS;
  
  // Check if env vars are set
  if (!envUser || !envPass) {
    console.error('Environment variables APP_USER or APP_PASS are not set');
    return res.status(500).json({ error: 'Server configuration error' });
  }
  
  // Use server-side env vars (no NEXT_PUBLIC_ prefix for security)
  if (username === envUser && password === envPass) {
    // In a real app, set a secure cookie or JWT here
    res.status(200).json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
}
