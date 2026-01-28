import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Handling
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const token = process.env.REPLICATE_API_TOKEN;
  if (!token) {
    return res.status(500).json({ error: 'Server Error: REPLICATE_API_TOKEN is not configured.' });
  }

  // POST: Create Prediction
  if (req.method === 'POST') {
    try {
      const { version, input } = req.body;
      
      const response = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ version, input }),
      });

      if (response.status !== 201) {
        const error = await response.json();
        return res.status(500).json({ error: error.detail || 'Failed to create prediction' });
      }

      const prediction = await response.json();
      return res.status(201).json(prediction);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  // GET: Check Status
  if (req.method === 'GET') {
    const { id } = req.query;
    if (!id || Array.isArray(id)) {
      return res.status(400).json({ error: 'Missing or invalid prediction ID' });
    }

    try {
      const response = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.status !== 200) {
        const error = await response.json();
        return res.status(500).json({ error: error.detail || 'Failed to fetch prediction' });
      }

      const prediction = await response.json();
      return res.status(200).json(prediction);
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
