// api/upload.js
import multer from "multer";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Multer setup for memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Helper to run multer in serverless
function runMiddleware(req, res, fn) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result) => {
      if (result instanceof Error) return reject(result);
      return resolve(result);
    });
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    await runMiddleware(req, res, upload.single("pdf"));

    if (!req.file) {
      return res.status(400).json({ reply: "No file uploaded" });
    }

    const pdfBase64 = req.file.buffer.toString("base64");
    const pdfFile = {
      inlineData: {
        data: pdfBase64,
        mimeType: "application/pdf",
      },
    };

    const { questionCount, difficulty } = req.body;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent([
      {
        text: `Read the PDF and generate ${questionCount} - ${difficulty} difficulty multiple-choice questions.
        Return ONLY raw JSON, no code fences, no markdown, no explanations.
        Format:
        {
          "quiz": [
            {
              "question": "string",
              "options": ["string", "string", "string", "string"],
              "answer": "string"
            }
          ]
        }`,
      },
      pdfFile,
    ]);

    const aiText = (await result.response).text();
    const cleaned = aiText.replace(/```json/g, "").replace(/```/g, "").trim();

    let quizData;
    try {
      quizData = JSON.parse(cleaned);
    } catch (err) {
      console.error("Failed to parse AI JSON:", err);
      return res.status(500).json({ reply: aiText });
    }

    res.json({ reply: "It worked bud!", quiz: quizData.quiz });
  } catch (error) {
    console.error(error);
    res.status(500).json({ reply: "Error processing PDF or talking to AI" });
  }
}
