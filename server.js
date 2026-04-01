import dotenv from "dotenv";
import multer from "multer";
import express from "express";
import cors from "cors";
import fs from "fs";
import { GoogleGenerativeAI } from "@google/generative-ai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT;

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

const storage = multer.memoryStorage();
const upload = multer({ storage });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/api/upload", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ reply: "No file uploaded" });
    }

    // Convert PDF buffer to base64
    const pdfBase64 = req.file.buffer.toString("base64");

    // Prepare inlineData for Gemini
    const pdfFile = {
      inlineData: {
        data: pdfBase64,
        mimeType: "application/pdf",
      },
    };

    // Send file directly to Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent([
      { text: `Read the PDF and generate 5 multiple-choice questions. 
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
    }`
     },
      pdfFile,
    ]);

    

    const aiText = (await result.response).text();
    console.log("Gemini raw reply:", aiText);
    
    const cleaned = aiText
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

    let quizData;
    try {
    quizData = JSON.parse(cleaned);
    } catch (err) {
    console.error("Failed to parse AI JSON:", err);
    return res.status(500).json({ reply: aiText });
    }

    res.json({ reply: "Quiz generated successfully!", quiz: quizData.quiz });

  } catch (error) {
    console.error(error);
    res.status(500).json({ reply: "Error processing PDF or talking to AI" });
  }
});
