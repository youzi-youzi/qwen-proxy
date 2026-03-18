const axios = require('axios');

module.exports = async (req, res) => {
  // 允许跨域
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: '仅支持 POST' });
  }

  try {
    const { prompt, apiKey: rawApiKey, model = 'qwen-max' } = req.body;

    if (!rawApiKey) {
      return res.status(400).json({ error: '缺少 API Key' });
    }
    if (!prompt) {
      return res.status(400).json({ error: '缺少 prompt' });
    }

    // 🔥 关键修复：再次清洗，移除所有非 ASCII 字符
    const cleanApiKey = rawApiKey.replace(/[^\x00-\x7F]/g, '');
    console.log('原始 Key 长度:', rawApiKey.length, '清洗后长度:', cleanApiKey.length);
    if (rawApiKey.length !== cleanApiKey.length) {
      console.warn('检测到不可见字符并已移除');
    }

    // 确保 Authorization 头的值完全由 ASCII 组成
    const authHeader = `Bearer ${cleanApiKey}`;

    const response = await axios.post(
      'https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation',
      {
        model: model,
        input: {
          messages: [{ role: 'user', content: prompt }]
        },
        parameters: { result_format: 'message' }
      },
      {
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/json'
        }
      }
    );

    const result = response.data.output.choices[0].message.content;
    res.json({ result });

  } catch (error) {
    // 打印详细错误日志
    console.error('代理错误:', error.response?.data || error.message);
    // 如果错误是 header 非法字符，额外打印信息
    if (error.message.includes('Invalid character')) {
      console.error('Authorization 头可能包含非法字符');
    }
    res.status(500).json({
      error: '调用通义千问失败',
      details: error.response?.data || error.message
    });
  }
};
