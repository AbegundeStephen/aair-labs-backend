// api/transcribe.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { audioBase64 } = req.body;
    if (!audioBase64) {
      return res.status(400).json({ error: 'Missing audioBase64' });
    }

    console.log('Received audio data, decoding...');
    const buffer = Buffer.from(audioBase64, 'base64');

    console.log('Uploading audio to AssemblyAI...');
    const uploadRes = await axios.post('https://api.assemblyai.com/v2/upload', buffer, {
      headers: {
        authorization: ASSEMBLYAI_API_KEY!,
        'transfer-encoding': 'chunked',
      },
    });

    const audioUrl = uploadRes.data.upload_url;
    console.log('Uploaded audio. URL:', audioUrl);

    console.log('Requesting transcription...');
    const transcriptRes = await axios.post(
      'https://api.assemblyai.com/v2/transcript',
      { audio_url: audioUrl },
      {
        headers: {
          authorization: ASSEMBLYAI_API_KEY!,
          'Content-Type': 'application/json',
        },
      }
    );

    const transcriptId = transcriptRes.data.id;
    console.log('Transcription started, ID:', transcriptId);

    // Poll until transcription completes
    let transcriptionText = '';
    while (true) {
      const poll = await axios.get(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
        headers: { authorization: ASSEMBLYAI_API_KEY! },
      });

      if (poll.data.status === 'completed') {
        transcriptionText = poll.data.text;
        console.log('Transcription complete');
        break;
      } else if (poll.data.status === 'error') {
        throw new Error(`AssemblyAI error: ${poll.data.error}`);
      }

      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    return res.status(200).json({ text: transcriptionText });
  } catch (err: any) {
    console.error('Transcription error:', err.response?.data || err.message);
    return res.status(500).json({
      error: err.response?.data || err.message || 'Failed to transcribe audio',
    });
  }
}
