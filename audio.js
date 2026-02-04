import express from "express";
import fs from "fs";
import multer from "multer";
import OpenAI from "openai";
import { events } from "../../../events.js";




const router = express.Router();

// Salva temporariamente os arquivos enviados
const upload = multer({ dest: "uploads/" });

// Cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

router.post("/audio", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Áudio não enviado" });
    }

    const audioPath = req.file.path;

    console.log("🎧 Enviando áudio para Whisper API...");

    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(audioPath),
      model: "whisper-1",
      language: "pt"
    });

    const transcricao = transcription.text;

    console.log("📝 Transcrição pronta:", transcricao);

    // Envia evento para websocket (se estiver usando)
    events.emit("TRANSCRICAO_PRONTA", transcricao);

    // Remove arquivo temporário
    fs.unlinkSync(audioPath);

    res.json({ transcricao });

  } catch (err) {
    console.error("Erro na transcrição:", err);

    res.status(500).json({
      error: "Erro ao processar áudio",
      detalhe: err.message
    });
  }
});

export default router;
