export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POSTメソッドのみ許可されています' });
  }

  const { image, mimeType } = req.body;
  const apiKey = process.env.GEMINI_API_KEY; 

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
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
    if (!response.ok) throw new Error(data.error?.message || 'API Error');

    const text = data.candidates[0].content.parts[0].text;
    res.status(200).send(text);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
