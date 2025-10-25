# AAIR Labs Backend - Voice Transcription API

Backend service for TodoApp voice input. Handles audio transcription and task splitting using AssemblyAI.

---

## Why Separate Backend?

Expo apps run in a client environment where direct API calls with authentication tokens aren't secure. This backend acts as a secure proxy between the mobile app and AssemblyAI services.

---

## API Endpoints

### POST `/api/transcribe`
Converts audio to text.

**Request:**
```json
{
  "audioBase64": "base64_encoded_audio_data"
}
```

**Response:**
```json
{
  "text": "Buy groceries and call mom"
}
```

### POST `/api/split-tasks`
Splits transcript into individual tasks.

**Request:**
```json
{
  "transcript": "Buy groceries and call mom"
}
```

**Response:**
```json
{
  "tasks": ["Buy groceries", "Call mom"]
}
```

---

## Tech Stack

- Node.js + TypeScript
- AssemblyAI API
- Vercel Serverless Functions

---

## Local Development
```bash
# Clone and install
git clone https://github.com/AbegundeStephen/aair-labs-backend.git
cd aair-labs-backend
npm install

# Add environment variable
echo "ASSEMBLYAI_API_KEY=your_key" > .env

# Run locally
npx vercel dev
```

---

## Deployment
```bash
# Deploy to Vercel
vercel --prod
```

Add `ASSEMBLYAI_API_KEY` in Vercel Dashboard → Settings → Environment Variables.

---

## Frontend Usage
```typescript
// Transcribe
const res = await fetch('https://aair-labs-backend.vercel.app/api/transcribe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ audioBase64 })
});
const { text } = await res.json();

// Split tasks
const taskRes = await fetch('https://aair-labs-backend.vercel.app/api/split-tasks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ transcript: text })
});
const { tasks } = await taskRes.json();
```

---

## Features

- Audio transcription with AssemblyAI
- Intelligent task splitting via LLM
- Fallback regex splitting if API fails
- Handles common phrases like "and", "then", "also"

---

## Related

Frontend: [aairlabs-todo-voice-app](https://github.com/AbegundeStephen/aairlabs-todo-voice-app)