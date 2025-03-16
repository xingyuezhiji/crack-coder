import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs/promises';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const language = "JavaScript";

interface ProcessedSolution {
  approach: string;
  code: string;
  timeComplexity: string;
  spaceComplexity: string;
}

type MessageContent = 
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export async function processScreenshots(screenshots: { path: string }[]): Promise<ProcessedSolution> {
  try {
    const messages = [
      {
        role: "system" as const,
        content: `You are an expert coding interview assistant. Analyze the coding question from the screenshots and provide a solution in ${language}.
                 Return the response in the following JSON format:
                 {
                   "approach": "Detailed approach to solve the problem on how are we solving the problem, that the interviewee will speak out loud and in easy explainatory words",
                   "code": "The complete solution code",
                   "timeComplexity": "Big O analysis of time complexity",
                   "spaceComplexity": "Big O analysis of space complexity"
                 }`
      },
      {
        role: "user" as const,
        content: [
          { type: "text", text: "Here is a coding interview question. Please analyze and provide a solution." } as MessageContent
        ]
      }
    ];

    // Add screenshots as image URLs
    for (const screenshot of screenshots) {
      const base64Image = await fs.readFile(screenshot.path, { encoding: 'base64' });
      messages.push({
        role: "user" as const,
        content: [
          {
            type: "image_url",
            image_url: {
              url: `data:image/png;base64,${base64Image}`
            }
          } as MessageContent
        ]
      });
    }

    // Get response from OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: messages as any,
      max_tokens: 2000,
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const content = response.choices[0].message.content || '{}';
    return JSON.parse(content) as ProcessedSolution;
  } catch (error) {
    console.error('Error processing screenshots:', error);
    throw error;
  }
}

export default {
  processScreenshots
};
