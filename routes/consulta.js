import express from "express";
import { analisarChunk, gerarRelatorio } from "../agent/agent.js";
import { createInitialState } from "../agent/state.js";
import { processarAudio } from "../src/audio.js";

router.post("/audio", async (req, res) => {
  try {
    const caminhoAudio = req.file.path;

    const resultado = await processarAudio(caminhoAudio);

    res.json(resultado);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      erro: "Falha ao processar áudio",
    });
  }
});

const router = express.Router();

let consultaAtiva = null;

router.post("/iniciar", (req, res) => {
  consultaAtiva = createInitialState();
  res.json({ status: "Consulta iniciada" });
});

router.post("/chunk", (req, res) => {
  const { texto } = req.body;
  if (!consultaAtiva) {
    return res.status(400).json({ erro: "Nenhuma consulta ativa" });
  }

  analisarChunk(consultaAtiva, texto);
  res.json({ status: "Chunk processado" });
});

router.post("/finalizar", (req, res) => {
  if (!consultaAtiva) {
    return res.status(400).json({ erro: "Nenhuma consulta ativa" });
  }

  const relatorio = gerarRelatorio(consultaAtiva);
  consultaAtiva = null;

  res.json(relatorio);
});

export default router;
