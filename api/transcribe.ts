// api/transcribe.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { audioBase64 } = req.body;

    if (!audioBase64) {
      return res.status(400).json({ error: 'Missing audioBase64' });
    }

    console.log('🎧 Received audio data, decoding...');
    const buffer = Buffer.from(audioBase64, 'base64');

    // Convert buffer to Blob (OpenAI SDK handles multipart automatically)
    const file = new Blob([buffer], { type: 'audio/m4a' });

    console.log('🧠 Sending audio to OpenAI Whisper...');
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'gpt-4o-mini-transcribe', // modern replacement for whisper-1
      language: 'en',
    });

    console.log('✅ Transcription complete');
    return res.status(200).json({ text: transcription.text });
  } catch (err: any) {
    console.error('❌ Transcription error:', err.response?.data || err.message || err);
    return res.status(500).json({
      error: err.response?.data || err.message || 'Failed to transcribe audio',
    });
  }
}
