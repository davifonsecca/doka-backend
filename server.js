import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";

import audioRoutes from "./audio.js";
import { startWebSocket } from "./ws.js";

dotenv.config();

const app = express();
const server = http.createServer(app);

// Middlewares básicos
app.use(cors());
app.use(express.json());

// Usa sua nova rota de áudio com Whisper API
app.use("/api", audioRoutes);

// Inicia websocket se você estiver usando
startWebSocket(server);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
