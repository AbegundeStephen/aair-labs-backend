// api/transcribe.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { audioBase64 } = req.body;
    if (!audioBase64) return res.status(400).json({ error: 'Missing audioBase64' });

    // Decode the base64 into a temporary file
    const buffer = Buffer.from(audioBase64, 'base64');
    fs.writeFileSync('/tmp/audio.m4a', buffer);

    const formData = new FormData();
    formData.append('file', fs.createReadStream('/tmp/audio.m4a'));
    formData.append('model', 'whisper-1');
    formData.append('language', 'en');
    formData.append('response_format', 'json');

    const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        ...formData.getHeaders(),
      },
    });

    res.status(200).json({ text: response.data.text });
  } catch (err: any) {
    console.error('Transcription error:', err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to transcribe audio' });
  }
}
