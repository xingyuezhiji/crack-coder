import OpenAI from 'openai';
import dotenv from 'dotenv';
import fs from 'fs/promises';

dotenv.config();

let openai: OpenAI | null = null;
let language = process.env.LANGUAGE || "Python";

interface Config {
  apiKey: string;
  language: string;
}

function updateConfig(config: Config) {
  if (!config.apiKey) {
    throw new Error('OpenAI API key is required');
  }
  
  try {
    openai = new OpenAI({
      apiKey: config.apiKey.trim(),
      // baseURL: "https://api.siliconflow.cn/v1/",
      baseURL: "https://open.bigmodel.cn/api/paas/v4/",
      timeout: 300 * 1000, // 5 minutes timeout
    });
    language = config.language || 'Python';
    // console.log('OpenAI client initialized with new config');
  } catch (error) {
    console.error('Error initializing OpenAI client:', error);
    throw error;
  }
}

// Initialize with environment variables if available
if (process.env.OPENAI_API_KEY) {
  try {
    updateConfig({
      apiKey: process.env.OPENAI_API_KEY,
      language: process.env.LANGUAGE || 'Python',
      // baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
    });
  } catch (error) {
    console.error('Error initializing OpenAI with environment variables:', error);
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
  if (!openai) {
    throw new Error('OpenAI client not initialized. Please configure API key first. Click CTRL/CMD + P to open settings and set the API key.');
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
        // content:`你是一名专业的编程面试辅助助手。根据截图中的编程问题进行分析，并提供${language}语言的解决方案。   
        // 返回的响应需遵循以下JSON格式：   {   
        // "approach": "详细的问题解决思路，用易于解释的语言描述面试者将如何口头阐述解决步骤",     
        // "code": "完整的解决方案代码",     
        // "timeComplexity": "时间复杂度的Big O分析及原因说明",     
        // "spaceComplexity": "空间复杂度的Big O分析及原因说明"   
        // }`
      },
      {
        role: "user" as const,
        content: [
          { type: "text", 
            text: "Here is a coding interview question. Please analyze and provide a solution." } as MessageContent
            // text: "这是一道编程面试题。请分析并给出一个solution." } as MessageContent
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
      // model: "Qwen/Qwen3-8B",
      model: "glm-4v-plus-0111",
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
  processScreenshots,
  updateConfig
};
