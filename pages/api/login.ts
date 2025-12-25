import { NextApiRequest, NextApiResponse } from 'next';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }
  const { username, password } = req.body;
  // Use process.env for credentials
  if (
    username === process.env.NEXT_PUBLIC_APP_USER &&
    password === process.env.NEXT_PUBLIC_APP_PASS
  ) {
    // In a real app, set a secure cookie or JWT here
    res.status(200).json({ success: true });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
}
