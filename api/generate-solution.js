const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
require('dotenv').config();

const MODEL_NAME = 'gemini-1.5-flash-latest';
const API_KEY = process.env.GEMINI_API_KEY;

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { title, description, imageBase64 } = req.body;
    if (!imageBase64 || !title || !description) {
      res.status(400).json({ error: 'Missing imageBase64, title, or description.' });
      return;
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: MODEL_NAME });

    const prompt = `Analyze this report to provide a solution to prevent malaria, respond in portuguese. Title: ${title}, Description: ${description}. Also analyze the image and what to fix in the image to avoid malaria`;

    const result = await model.generateContent({
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: imageBase64,
              },
            },
          ],
        },
      ],
      generationConfig: { temperature: 0.4 },
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    });

    const solution = result.response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Não foi possível gerar uma solução.';
    res.status(200).json({ solution });
  } catch (error) {
    console.error('Error generating solution:', error);
    res.status(500).json({ error: 'Failed to generate solution.' });
  }
};
