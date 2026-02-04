import express from "express";
import http from "http";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import FormData from "form-data";
import { WebSocketServer } from "ws";
import crypto from "crypto";
import { analisarComGemini } from "./agent/gemini.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

// Middlewares
app.use(cors());
app.use(express.json());

// 🗺️ Armazena clientes conectados
const clients = new Map();

// 🔧 Configuração do multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "audios");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || ".wav";
    cb(null, `consulta-${Date.now()}${ext}`);
  },
});

const upload = multer({ storage });

/* ===========================
   🔌 WEBSOCKET
============================ */
const wss = new WebSocketServer({ server });

console.log("🟢 WebSocket ativo");

wss.on("connection", (ws) => {
  const clientId = crypto.randomUUID();
  clients.set(clientId, ws);

  console.log(`📡 Cliente conectado: ${clientId}`);

  ws.send(
    JSON.stringify({
      type: "CONNECTED",
      clientId,
      message: "Conectado ao servidor",
    })
  );

  ws.on("close", () => {
    clients.delete(clientId);
    console.log(`🔴 Cliente desconectado: ${clientId}`);
  });

  ws.on("error", (err) => {
    clients.delete(clientId);
    console.error(`❌ Erro no cliente ${clientId}:`, err.message);
  });
});

function enviarParaCliente(clientId, data) {
  const client = clients.get(clientId);

  if (client && client.readyState === 1) {
    client.send(JSON.stringify(data));
    console.log(`📤 Enviado para cliente ${clientId}: ${data.type}`);
  } else {
    console.warn(`⚠️ Cliente não encontrado: ${clientId}`);
  }
}

/* ===========================
   🎙️ TRANSCREVER COM DEEPGRAM (GRATUITO)
============================ */
async function transcreverComDeepgram(audioPath) {
  const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY;

  if (!DEEPGRAM_API_KEY) {
    throw new Error("DEEPGRAM_API_KEY não configurada no .env");
  }

  console.log("🎙️ Transcrevendo com Deepgram...");

  const audioBuffer = fs.readFileSync(audioPath);

  const response = await fetch(
    "https://api.deepgram.com/v1/listen?model=nova-2&language=pt-BR&smart_format=true",
    {
      method: "POST",
      headers: {
        Authorization: `Token ${DEEPGRAM_API_KEY}`,
        "Content-Type": "audio/wav",
      },
      body: audioBuffer,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Deepgram API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  const transcript =
    data?.results?.channels?.[0]?.alternatives?.[0]?.transcript;

  if (!transcript) {
    throw new Error("Nenhuma transcrição retornada pelo Deepgram");
  }

  console.log(
    `✅ Transcrição concluída: ${transcript.substring(0, 100)}...`
  );

  return transcript;
}

/* ===========================
   📤 ROTA DE UPLOAD DE ÁUDIO
============================ */
app.post("/audio", upload.single("audio"), async (req, res) => {
  let audioPath = null;

  try {
    if (!req.file) {
      return res.status(400).json({ error: "Áudio não enviado" });
    }

    const clientId = req.body.clientId;

    if (!clientId) {
      return res.status(400).json({ error: "clientId não fornecido" });
    }

    audioPath = req.file.path;

    console.log(`🎧 Áudio recebido de: ${clientId}`);
    console.log("📊 Tamanho:", (req.file.size / 1024).toFixed(2), "KB");

    // 🎙️ TRANSCREVER
    enviarParaCliente(clientId, {
      type: "STATUS",
      message: "Transcrevendo áudio...",
    });

    const transcricao = await transcreverComDeepgram(audioPath);

    console.log("✅ Transcrição concluída");

    // 🧠 GERAR RELATÓRIO
    enviarParaCliente(clientId, {
      type: "STATUS",
      message: "Gerando relatório com IA...",
    });

    const relatorio = await analisarComGemini(transcricao);

    console.log("✅ Relatório gerado");

    // 📤 ENVIAR PARA O CLIENTE
    enviarParaCliente(clientId, {
      type: "REPORT",
      relatorio,
    });

    res.json({ transcricao });
  } catch (err) {
    console.error("❌ Erro:", err.message);

    enviarParaCliente(req.body.clientId, {
      type: "ERROR",
      message: "Erro ao processar áudio",
    });

    res.status(500).json({ error: err.message });
  } finally {
    if (audioPath && fs.existsSync(audioPath)) {
      try {
        fs.unlinkSync(audioPath);
        console.log("🗑️ Arquivo deletado");
      } catch (e) {
        console.error("⚠️ Erro ao deletar:", e.message);
      }
    }
  }
});

app.get("/", (req, res) => {
  res.json({ status: "DOKA Backend Online ✅" });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Backend + WebSocket rodando na porta ${PORT}`);
});
