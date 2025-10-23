// api/split-tasks.ts

import type { VercelRequest, VercelResponse } from '@vercel/node'
import axios from 'axios'

const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY!

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const { transcript } = req.body
    if (!transcript || transcript.trim().length === 0) {
      return res.status(400).json({ error: 'Missing or empty transcript' })
    }

    console.log('Sending transcript to AssemblyAI for task extraction...')

    // AssemblyAI Task Extraction (LLM)
    const aiResponse = await axios.post(
      'https://api.assemblyai.com/v2/generate/task-extraction',
      { input: transcript },
      {
        headers: {
          authorization: ASSEMBLYAI_API_KEY,
          'Content-Type': 'application/json',
        },
      }
    )

    const tasks = aiResponse.data?.response?.tasks || []

    if (!Array.isArray(tasks) || tasks.length === 0) {
      console.warn('No valid tasks returned from AssemblyAI, using fallback')
      const fallback = splitTasksFallback(transcript)
      return res.status(200).json({ tasks: fallback })
    }

    console.log('Extracted tasks:', tasks)
    return res.status(200).json({ tasks })
  } catch (err: any) {
    console.error('Task split error:', err.response?.data || err.message)

    // Fallback if AssemblyAI fails
    const transcript = req.body?.transcript || ''
    const fallback = splitTasksFallback(transcript)
    return res.status(200).json({ tasks: fallback })
  }
}


// Local Fallback Function

function splitTasksFallback(text: string): string[] {
  console.log('Using fallback task splitting')
  const delimiters = /\s+and\s+|,\s*(?:and\s+)?|;\s+|\.\s+|then\s+|also\s+|plus\s+/i

  const tasks = text
    .split(delimiters)
    .map((task) => {
      task = task.trim()
      task = task.replace(
        /^(i need to|i have to|i want to|remind me to|don't forget to)\s+/i,
        ''
      )
      task = task.charAt(0).toUpperCase() + task.slice(1)
      return task
    })
    .filter((task) => task.length > 2 && task.length < 200)
    .slice(0, 10)

  if (tasks.length === 0) {
    const cleaned = text.trim()
    if (cleaned.length > 0)
      return [cleaned.charAt(0).toUpperCase() + cleaned.slice(1)]
  }

  return tasks
}
