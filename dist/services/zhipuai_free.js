"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.processScreenshots = processScreenshots;
const zhipuai_1 = require("zhipuai");
const dotenv_1 = __importDefault(require("dotenv"));
const promises_1 = __importDefault(require("fs/promises"));
const express_1 = __importDefault(require("express"));
dotenv_1.default.config();
// 启动本地图片服务（开发环境临时方案）
const app = (0, express_1.default)();
app.get('/temp-image', async (req, res) => {
    try {
        const filePath = decodeURIComponent(req.query.path);
        const imageBuffer = await promises_1.default.readFile(filePath);
        res.type('png').send(imageBuffer);
    }
    catch (error) {
        res.status(500).send('Image not found');
    }
});
const PORT = 3000;
app.listen(PORT, () => console.log(`Local image server running on http://localhost:${PORT}`));
let zhipuai = null;
let language = process.env.LANGUAGE || "Python";
function updateConfig(config) {
    if (!config.apiKey) {
        throw new Error('ZhipuAI API key is required');
    }
    try {
        zhipuai = new zhipuai_1.ZhipuAI({
            apiKey: config.apiKey.trim(),
            timeout: 300 * 1000,
        });
        language = config.language || 'Python';
    }
    catch (error) {
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
    }
    catch (error) {
        console.error('Error initializing ZhipuAI with environment variables:', error);
    }
}
async function processScreenshots(screenshots) {
    if (!zhipuai) {
        throw new Error('ZhipuAI client not initialized. Please configure API key first.');
    }
    try {
        const messages = [
            {
                role: "system",
                content: [{
                        type: "text",
                        text: `You are an expert coding interview assistant...` // 保持原有提示
                    }]
            },
            {
                role: "user",
                content: []
            }
        ];
        const userMessage = messages.find(m => m.role === 'user');
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
            messages: messages,
            max_tokens: 2000,
            temperature: 0.7
        });
        const content = response.choices[0].message.content || '{}';
        try {
            return JSON.parse(content);
        }
        catch (e) {
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch)
                return JSON.parse(jsonMatch[0]);
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
