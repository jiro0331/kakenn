export default async function handler(req, res) {
  // POSTメソッド以外は弾く
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POSTメソッドのみ許可されています' });
  }

  const { image, mimeType } = req.body;
  const apiKey = process.env.GEMINI_API_KEY; 

  if (!apiKey) {
    return res.status(500).json({ error: 'APIキーが設定されていません。Vercelの設定を確認してください。' });
  }

  // 【重要】エラーメッセージでGoogleから直接指定された最新モデル「gemini-3.8-flash」を使用
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;
  
  const prompt = `
    このレシートの画像から「合計金額」を読み取ってください。
    結果は必ず以下のJSON形式のみで出力してください。
    {"total_amount": 金額の数字}
  `;

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: prompt },
            { inline_data: { mime_type: mimeType, data: image } }
          ]
        }]
      })
    });

    const data = await response.json();

