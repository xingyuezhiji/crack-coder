"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processScreenshots = processScreenshots;
const zhipuai_1 = require("zhipuai");
const dotenv_1 = __importDefault(require("dotenv"));
const promises_1 = __importDefault(require("fs/promises"));
dotenv_1.default.config();
let zhipuai = null;
let language = process.env.LANGUAGE || "Python";
function updateConfig(config) {
    if (!config.apiKey) {
        throw new Error('ZhipuAI API key is required');
    }
    try {
        zhipuai = new zhipuai_1.ZhipuAI({
            apiKey: config.apiKey.trim(),
            timeout: 300 * 1000, // 5 minutes timeout
        });
        language = config.language || 'Python';
    }
    catch (error) {
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
    }
    catch (error) {
        console.error('Error initializing ZhipuAI with environment variables:', error);
    }
}
async function processScreenshots(screenshots) {
    if (!zhipuai) {
        throw new Error('ZhipuAI client not initialized. Please configure API key first. Click CTRL/CMD + P to open settings and set the API key.');
    }
    try {
        const messages = [
            {
                role: "system",
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
                role: "user",
                content: []
            }
        ];
        // 获取用户消息并添加图像
        const userMessage = messages.find(m => m.role === 'user');
        for (const screenshot of screenshots) {
            const base64Image = await promises_1.default.readFile(screenshot.path, { encoding: 'base64' });
            userMessage.content.push({
                type: "image_url",
                image_url: {
                    url: base64Image
                }
            });
        }
        // 添加文本内容
        userMessage.content.push({
            type: "text",
            text: "Here is a coding interview question. Please analyze and provide a solution."
        });
        // 调用智谱AI API
        const response = await zhipuai.chat.completions.create({
            model: "glm-4v-plus-0111",
            // model:"glm-4v-flash",
            messages: messages,
            max_tokens: 2000,
            temperature: 0.7
        });
        const content = response.choices[0].message.content || '{}';
        try {
            // 尝试解析返回的内容为JSON
            return JSON.parse(content);
        }
        catch (e) {
            // 如果返回的不是JSON，尝试提取JSON部分或手动转换
            console.warn('Response is not in JSON format, attempting to extract...');
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
            throw new Error('Failed to parse response as JSON');
        }
    }
    catch (error) {
        console.error('Error processing screenshots:', error);
        throw error;
    }
}
exports.default = {
    processScreenshots,
    updateConfig
};
