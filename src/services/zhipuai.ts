import { ZhipuAI } from 'zhipuai';
import dotenv from 'dotenv';
import fs from 'fs/promises';

dotenv.config();

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
      timeout: 300 * 1000, // 5 minutes timeout
    });
    language = config.language || 'Python';
  } catch (error) {
    console.error('Error initializing ZhipuAI client:', error);
    throw error;
  }
}

// Initialize with environment variables if available
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
    throw new Error('ZhipuAI client not initialized. Please configure API key first. Click CTRL/CMD + P to open settings and set the API key.');
  }

  try {
    const messages = [
        {
          role: "system" as const,
          content: `You are an expert coding interview assistant. Analyze the coding question from the screenshots and provide a solution in ${language}.
                   Return the response in the following JSON format:
                   { 
                     "approach": "Detailed approach to solve the problem on how are we solving the problem, that the interviewee will speak out loud and in easy explainatory words", 
                     "code": "The complete solution code", 
                     "timeComplexity": "Big O analysis of time complexity with the reason", 
                     "spaceComplexity": "Big O analysis of space complexity with the reason" 
                   }, 并将json里面的内容翻译成中文`
        },
        {
          role: "user" as const,
          content: [] as MessageContent[]
        }
      ];

    // 获取用户消息并添加图像
    const userMessage = messages.find(m => m.role === 'user')!;
    for (const screenshot of screenshots) {
      const base64Image = await fs.readFile(screenshot.path, { encoding: 'base64' });
      userMessage.content.push({
        type: "image_url",
        image_url: { 
          url: base64Image
        }
      } as MessageContent);
    }

    // 添加文本内容
    userMessage.content.push({
      type: "text",
      text: "Here is a coding interview question. Please analyze and provide a solution."
    } as MessageContent);

    // 调用智谱AI API
    const response = await zhipuai.chat.completions.create({
      model: "glm-4v-plus-0111",
      // model:"glm-4v-flash",
      messages: messages as any,
      max_tokens: 2000,
      temperature: 0.7
    });

    const content = response.choices[0].message.content || '{}';
    
    try {
      // 尝试解析返回的内容为JSON
      return JSON.parse(content) as ProcessedSolution;
    } catch (e) {
      // 如果返回的不是JSON，尝试提取JSON部分或手动转换
      console.warn('Response is not in JSON format, attempting to extract...');
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]) as ProcessedSolution;
      }
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