export default async function handler(req, res) {
  // POSTメソッド以外は弾く
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POSTメソッドのみ許可されています' });
  }

  const { image, mimeType } = req.body;
  const apiKey = process.env.GEMINI_API_KEY; 

  // 万が一APIキーが読み込めていない場合のエラー
  if (!apiKey) {
    return res.status(500).json({ error: 'APIキーが設定されていません。Vercelの設定を確認してください。' });
  }

  // 【重要】前に成功実績のある安定モデルに完全固定
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${apiKey}`;
  
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
    
    // API側からエラーが返ってきた場合の詳細なハンドリング
    if (!response.ok) {
      throw new Error(`Google APIエラー: ${data.error?.message || '不明なエラー'}`);
    }

    if (!data.candidates || data.candidates.length === 0) {
      throw new Error('AIが回答を生成できませんでした。');
    }

    const text = data.candidates[0].content.parts[0].text;
    res.status(200).send(text);

  } catch (error) {
    console.error("バックエンド処理エラー:", error);
    res.status(500).json({ error: error.message });
  }
}
