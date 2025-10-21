// api/split-tasks.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { transcript } = req.body;
    if (!transcript) return res.status(400).json({ error: 'Missing transcript' });

    console.log('🧩 Sending transcript to AssemblyAI for task extraction...');

    // Request with entity detection and auto highlights
    const aiResponse = await axios.post(
      'https://api.assemblyai.com/v2/transcript',
      {
        text: transcript,
        entity_detection: true,
        auto_chapters: true,
        iab_categories: true,
      },
      {
        headers: {
          authorization: ASSEMBLYAI_API_KEY!,
          'Content-Type': 'application/json',
        },
      }
    );

    const transcriptId = aiResponse.data.id;
    console.log('⏳ Processing entities and chapters, ID:', transcriptId);

    // Poll until completed
    let result: any;
    while (true) {
      const poll = await axios.get(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: { authorization: ASSEMBLYAI_API_KEY! },
      });

      if (poll.data.status === 'completed') {
        result = poll.data;
        console.log('✅ Task extraction completed');
        break;
      } else if (poll.data.status === 'error') {
        throw new Error(`AssemblyAI error: ${poll.data.error}`);
      }

      await new Promise((resolve) => setTimeout(resolve, 2500));
    }

    // Extract potential tasks from detected entities or key phrases
    const entities = result.entities || [];
    const chapters = result.chapters || [];

    const entityTasks = entities
      .map((e: any) => e.text)
      .filter((text: string) => /^[A-Z]/.test(text))
      .slice(0, 15);

    const chapterSummaries = chapters.map((c: any) => c.summary);

    const combinedTasks = [...new Set([...entityTasks, ...chapterSummaries])]
      .filter((t) => t && t.length > 2);

    return res.status(200).json({ tasks: combinedTasks });
  } catch (err: any) {
    console.error('❌ Task split error:', err.response?.data || err.message);
    return res.status(500).json({
      error: err.response?.data || err.message || 'Failed to split tasks',
    });
  }
}
