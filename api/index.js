const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require('@google/generative-ai');
require('dotenv').config();

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

const MODEL_NAME = 'gemini-1.5-flash-latest';
const API_KEY = process.env.GEMINI_API_KEY;

router.post('/generate-solution', upload.single('image'), async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!req.file || !title || !description) {
      return res.status(400).json({ error: 'Missing image, title, or description.' });
    }

    const imagePath = req.file.path;
    const imageBuffer = fs.readFileSync(imagePath);
    const imageBase64 = imageBuffer.toString('base64');

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

    fs.unlinkSync(imagePath); // Clean up temp file

    const solution = result.response.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || 'Não foi possível gerar uma solução.';
    res.json({ solution });
  } catch (error) {
    console.error('Error generating solution:', error);
    res.status(500).json({ error: 'Failed to generate solution.' });
  }
});

module.exports = router;