export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    const url = new URL(request.url);

    // Health check
    if (request.method === 'GET') {
      return new Response('OK', { status: 200 });
    }

    // Only allow POST to /chat
    if (url.pathname !== '/chat' || request.method !== 'POST') {
      return new Response('Not found', { status: 404 });
    }

    try {
      const body = await request.json();
      const { messages } = body;

      if (!messages || !Array.isArray(messages)) {
        return new Response('Missing messages array', { status: 400 });
      }

      const res = await fetch('https://api.deepseek.com/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + env.DEEPSEEK_API_KEY
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          max_tokens: 300,
          messages: [
            {
              role: 'system',
              content: '你是一个食物热量查询助手。用户会问各种食物的热量。请简洁回复：给出每份/每100g的热量（千卡/kcal），如果用户问的是常见分量，给出该分量的热量。回复格式：食物名（分量）：热量 kcal。尽量简短，3-5句话以内。只回答食物热量相关问题，其他问题礼貌拒绝。'
            },
            ...messages
          ]
        })
      });

      const data = await res.json();

      return new Response(JSON.stringify(data), {
        status: res.status,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
};
