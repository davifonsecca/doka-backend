import crypto from "crypto";
import WebSocket, { WebSocketServer } from "ws";
import { analisarComGemini } from "./agent/gemini.js";
import { events } from "./events.js";

// 🗺️ Armazena clientes conectados com seus IDs
const clients = new Map();

export function startWebSocket(server) {
  const wss = new WebSocketServer({ server });

  console.log("🟢 WebSocket ativo");

  wss.on("connection", (ws) => {
    // Gera um ID único para cada cliente
    const clientId = crypto.randomUUID();
    clients.set(clientId, ws);

    console.log(`📡 Cliente conectado: ${clientId}`);

    // Envia o ID para o cliente
    ws.send(
      JSON.stringify({
        type: "CONNECTED",
        clientId,
        message: "Conectado ao servidor",
      })
    );

    // Remove cliente quando desconecta
    ws.on("close", () => {
      clients.delete(clientId);
      console.log(`🔴 Cliente desconectado: ${clientId}`);
    });

    ws.on("error", (err) => {
      clients.delete(clientId);
      console.error(`❌ Erro no cliente ${clientId}:`, err.message);
    });
  });

  // 🔥 RECEBE TRANSCRIÇÃO — PROCESSA APENAS PARA O CLIENTE CORRETO
  events.on("TRANSCRICAO_PRONTA", async ({ clientId, texto }) => {
    console.log(`🧠 Processando relatório para cliente: ${clientId}`);
    console.log(`📏 Texto: ${texto.length} caracteres`);

    // Envia status apenas para o cliente que enviou
    enviarParaCliente(clientId, {
      type: "STATUS",
      message: "Analisando com IA...",
    });

    try {
      const startTime = Date.now();
      const relatorio = await analisarComGemini(texto);
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log(`✅ Relatório gerado em ${duration}s para cliente: ${clientId}`);

      // Envia relatório APENAS para o cliente que pediu
      enviarParaCliente(clientId, {
        type: "REPORT",
        relatorio,
      });
    } catch (err) {
      console.error(`❌ Erro ao gerar relatório para ${clientId}:`, err.message);

      enviarParaCliente(clientId, {
        type: "ERROR",
        message: "Erro ao gerar relatório",
      });
    }
  });
}

/**
 * Envia mensagem apenas para um cliente específico
 */
function enviarParaCliente(clientId, data) {
  const client = clients.get(clientId);

  if (client && client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(data));
    console.log(`📤 Mensagem enviada para: ${clientId} — Tipo: ${data.type}`);
  } else {
    console.warn(`⚠️ Cliente não encontrado ou desconectado: ${clientId}`);
  }
}