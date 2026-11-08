export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Metode tidak diizinkan.' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'Layanan analisis belum diaktifkan. Tambahkan OPENAI_API_KEY di Vercel.' });
  }

  const { image } = req.body || {};
  if (typeof image !== 'string' || !/^data:image\/(png|jpeg|webp);base64,/.test(image)) {
    return res.status(400).json({ error: 'Foto tidak valid. Unggah JPG, PNG, atau WEBP.' });
  }
  if (image.length > 3_900_000) {
    return res.status(413).json({ error: 'Ukuran foto terlalu besar. Pilih foto yang lebih kecil.' });
  }

  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4.1-mini',
        store: false,
        input: [{
          role: 'user',
          content: [
            {
              type: 'input_text',
              text: 'Buat deskripsi visual karakter untuk prompt video berdasarkan foto ini. Tulis dalam Bahasa Indonesia, satu paragraf ringkas namun spesifik. Jelaskan hanya hal yang terlihat: perkiraan rentang usia dewasa bila relevan, bentuk dan ciri wajah yang tampak, rambut, pakaian, aksesori, postur, dan ciri visual pembeda. Jangan menebak identitas, nama, etnis, agama, kepribadian, pekerjaan, atau hal yang tidak dapat dipastikan dari foto. Jangan menyimpulkan emosi atau sifat permanen. Jika bagian tidak terlihat, jangan mengarang. Hasil hanya deskripsi karakter, tanpa pembuka atau bullet.'
            },
            { type: 'input_image', image_url: image, detail: 'high' }
          ]
        }]
      })
    });

    const result = await response.json();
    if (!response.ok) {
      const message = result?.error?.message || 'OpenAI gagal menganalisis foto.';
      return res.status(response.status === 401 ? 503 : 502).json({ error: message });
    }

    const description = (result.output || [])
      .flatMap(item => item.content || [])
      .filter(item => item.type === 'output_text')
      .map(item => item.text)
      .join('\n')
      .trim();

    if (!description) return res.status(502).json({ error: 'AI tidak menghasilkan deskripsi. Coba foto lain.' });
    return res.status(200).json({ description });
  } catch (error) {
    return res.status(500).json({ error: 'Tidak dapat menghubungi layanan analisis. Coba lagi.' });
  }
}
