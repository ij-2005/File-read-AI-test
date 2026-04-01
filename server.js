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
      { text: "Generate me 5 questions from the pdf:" },
      pdfFile,
    ]);

    const aiText = (await result.response).text();

    res.json({ reply: aiText });
  } catch (error) {
    console.error(error);
    res.status(500).json({ reply: "Error processing PDF or talking to AI" });
  }
});
