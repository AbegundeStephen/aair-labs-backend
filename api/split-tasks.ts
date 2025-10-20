// api/split-tasks.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { transcript } = req.body;
    if (!transcript) return res.status(400).json({ error: 'Missing transcript' });

    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a task extraction assistant. Return only a JSON array of strings with actionable tasks.`,
          },
          { role: 'user', content: transcript },
        ],
        temperature: 0.3,
        max_tokens: 500,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const content = response.data.choices[0]?.message?.content?.trim();
    const clean = content.replace(/```json\n?|\n?```/g, '').trim();
    const parsed = JSON.parse(clean);

    res.status(200).json({ tasks: Array.isArray(parsed) ? parsed : parsed.tasks || [] });
  } catch (err: any) {
    console.error('Task split error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to split tasks' });
  }
}
