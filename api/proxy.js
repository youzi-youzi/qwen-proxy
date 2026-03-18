const axios = require('axios');

module.exports = async (req, res) => {
  // 设置 CORS 头，允许你的前端页面访问
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持 POST' });
  }

  try {
    // 从请求体中获取必要参数
    const { prompt, apiKey, model = 'qwen-max' } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: '缺少 API Key' });
    }
    if (!prompt) {
      return res.status(400).json({ error: '缺少 prompt' });
    }

    // 调用通义千问（使用前端传来的 Key）
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
