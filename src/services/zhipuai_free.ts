import { ZhipuAI } from 'zhipuai';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import express from 'express';

dotenv.config();

// 启动本地图片服务（开发环境临时方案）
const app = express();
app.get('/temp-image', async (req: express.Request, res: express.Response) => {
  try {
    const filePath = decodeURIComponent(req.query.path as string);
    const imageBuffer = await fs.readFile(filePath);
    res.type('png').send(imageBuffer);
  } catch (error) {
    res.status(500).send('Image not found');
  }
});
const PORT = 3000;
app.listen(PORT, () => console.log(`Local image server running on http://localhost:${PORT}`));

let zhipuai: ZhipuAI | null = null;
let language = process.env.LANGUAGE || "Python";

interface Config {
  apiKey: string;
  language: string;
}

function updateConfig(config: Config) {
  if (!config.apiKey) {
    throw new Error('ZhipuAI API key is required');
  }
  
  try {
    zhipuai = new ZhipuAI({
      apiKey: config.apiKey.trim(),
      timeout: 300 * 1000,
    });
    language = config.language || 'Python';
  } catch (error) {
    console.error('Error initializing ZhipuAI client:', error);
    throw error;
  }
}

if (process.env.ZHIPUAI_API_KEY) {
  try {
    updateConfig({
      apiKey: process.env.ZHIPUAI_API_KEY,
      language: process.env.LANGUAGE || 'Python',
    });
  } catch (error) {
    console.error('Error initializing ZhipuAI with environment variables:', error);
  }
}

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
  if (!zhipuai) {
    throw new Error('ZhipuAI client not initialized. Please configure API key first.');
  }

  try {
    const messages = [
      {
        role: "system" as const,
        content: [{
          type: "text", 
          text: `You are an expert coding interview assistant...` // 保持原有提示
        }]
      },
      {
        role: "user" as const,
        content: [] as MessageContent[]
      }
    ];

    const userMessage = messages.find(m => m.role === 'user')!;
    
    // 先添加文本描述
    userMessage.content = userMessage.content.concat([{
      type: "text",
      text: "Here is a coding interview question. Please analyze and provide a solution."
    }]);

    // 添加图片（通过本地服务URL）
    for (const screenshot of screenshots) {
      const testUrl = `http://localhost:${PORT}/temp-image?path=${encodeURIComponent(screenshot.path)}`;
      console.log('Testing image URL:', testUrl); // 打印可点击的超链接（支持VS Code终端）
      
      userMessage.content.push({
        type: "image_url",
        image_url: { 
          url: testUrl,
        }
      });
    }

    const response = await zhipuai.chat.completions.create({
      model: "GLM-4V-Flash",
      messages: messages as any,
      max_tokens: 2000,
      temperature: 0.7
    });

    const content = response.choices[0].message.content || '{}';
    
    try {
      return JSON.parse(content) as ProcessedSolution;
    } catch (e) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) return JSON.parse(jsonMatch[0]);
      throw new Error('Failed to parse response as JSON');
    }
  } catch (error) {
    console.error('Error processing screenshots:', error);
    throw error;
  }
}

export default {
  processScreenshots,
  updateConfig
};