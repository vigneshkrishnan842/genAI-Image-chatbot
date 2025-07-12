import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const server = express();
const port = 3000;

const googleAiStudioApiKey = process.env['GOOGLE_AI_STUDIO_API_KEY'];

if (!googleAiStudioApiKey) {
  throw new Error('Provide GOOGLE_AI_STUDIO_API_KEY in a .env file');
}

const genAI = new GoogleGenerativeAI(googleAiStudioApiKey);
const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash-latest" });
const chat = model.startChat();

server.use(express.json());
server.use(cors());

server.listen(port, () => {
  console.log('Server is running on port', port);
});

server.post('/message', async (req: Request, res: Response) => {
  // const prompt: string = req.body;
  const { text, image } = req.body;

  console.log('Received prompt:', text);

  if (!text) {
    return res.status(400).send("Missing 'text' in request body");
  }

  try {
    const parts: any[] = [];

    // Add text part
    parts.push({ text });

    // ✅ Add image if provided
    if (image) {
      const base64Data = image.replace(/^data:image\/\w+;base64,/, '');

      parts.push({
        inlineData: {
          mimeType: 'image/jpeg', // You could dynamically detect type if needed
          data: base64Data,
        },
      });
    }
    console.log('Generating response:');
    const result = await chat.sendMessageStream(parts);

    for await (const chunk of result.stream) {
      const chunkText = chunk.text();
      console.log(chunkText);
      res.write(chunkText);
    }
  } catch (err) {
    res.status(500);
    console.error('Error from Google API:', err);
  }

  return res.end();
});
