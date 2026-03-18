// 这个文件是核心代理，处理所有请求
const axios = require('axios');

module.exports = async (req, res) => {
  // 设置 CORS 头，允许任何网站访问
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // 预检请求直接通过
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 只允许 POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持 POST' });
  }

  try {
    const { prompt, model = 'qwen-max' } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: '缺少 prompt' });
    }

    // 从环境变量读取你的 API Key（安全！）
    const apiKey = process.env.DASHSCOPE_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: '后端 API Key 未配置' });
    }

    // 调用通义千问
    const response = await axios.post(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
      {
        model: model,
        input: {
          messages: [
            { role: 'user', content: prompt }
          ]
        },
        parameters: {
          result_format: 'message'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = response.data.output.choices[0].message.content;
    res.json({ result });

  } catch (error) {
    console.error('代理错误:', error.response?.data || error.message);
    res.status(500).json({ 
      error: '调用通义千问失败',
      details: error.response?.data || error.message 
    });
  }
};
