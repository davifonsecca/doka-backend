import fetch from "node-fetch";

// 🔧 MODELO CORRETO E DISPONÍVEL
const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

export async function analisarComGemini(textoCompleto) {
  const systemPrompt = `
Você é um assistente técnico de SERVIÇO SOCIAL no contexto brasileiro (CRAS, SUS, INSS, INCA).

Você receberá a TRANSCRIÇÃO COMPLETA de uma consulta entre uma ASSISTENTE SOCIAL e um PACIENTE.

Sua função é:
1. Analisar a conversa e extrair informações relevantes
2. Identificar vulnerabilidades sociais, econômicas e de saúde
3. Mapear benefícios sociais aplicáveis
4. Sugerir encaminhamentos técnicos

IMPORTANTE:
- Seja objetivo, técnico e fundamentado
- Cite sempre órgãos responsáveis (INSS, INCA, CRAS, Bolsa Família, BPC/LOAS, Receita Federal, etc)
- Identifique riscos sociais concretos
- Sugira ações práticas para a assistente social

ESTRUTURA DO RELATÓRIO:
- **Resumo**: Síntese do caso (3-5 linhas) incluindo informações do paciente
- **Riscos**: Vulnerabilidades socioeconômicas, de saúde mental, alimentar, habitacional
- **Estado emocional**: Como o paciente/família está emocionalmente
- **Benefícios indicados**: Programas sociais aplicáveis
- **Orientações**: Ações concretas que a assistente social deve tomar
`;

  const prompt = `
${systemPrompt}

Retorne APENAS um JSON válido, SEM markdown, SEM explicações.

Formato EXATO:
{
  "resumo": "Descrição completa do caso em 3-5 linhas",
  "riscos": ["Risco 1", "Risco 2"],
  "emocional": ["Aspecto emocional 1", "Aspecto emocional 2"],
  "beneficios": ["Benefício 1 (órgão responsável)", "Benefício 2"],
  "orientacoes": ["Orientação técnica 1", "Orientação técnica 2"]
}

TRANSCRIÇÃO DA CONSULTA:
${textoCompleto}
`;

  try {
    console.log("📤 Enviando para Gemini 2.5 Flash...");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    const response = await fetch(
      `${GEMINI_URL}?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 8192,
            topP: 0.95,
            topK: 40,
          },
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    console.log("📊 Status HTTP:", response.status);

    const responseText = await response.text();

    if (!response.ok) {
      console.error("❌ Erro HTTP:", response.status);
      console.error("Resposta:", responseText.substring(0, 500));
      throw new Error(`API retornou status ${response.status}`);
    }

    const data = JSON.parse(responseText);

    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawText) {
      console.error("❌ Texto não encontrado");
      console.error("Resposta:", JSON.stringify(data, null, 2));
      throw new Error("Resposta vazia");
    }

    console.log("📝 Gemini retornou:", rawText.substring(0, 200) + "...");

    // 🧹 LIMPEZA
    const cleaned = rawText
      .trim()
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .replace(/^\s*[\r\n]/gm, "");

    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");

    if (start === -1 || end === -1) {
      console.error("❌ JSON não encontrado");
      throw new Error("JSON incompleto");
    }

    const safeJson = cleaned.slice(start, end + 1);
    const parsed = JSON.parse(safeJson);

    // 🛡️ VALIDAÇÃO
    if (
      typeof parsed.resumo !== "string" ||
      !Array.isArray(parsed.riscos) ||
      !Array.isArray(parsed.emocional) ||
      !Array.isArray(parsed.beneficios) ||
      !Array.isArray(parsed.orientacoes)
    ) {
      console.error("❌ Estrutura inválida");
      throw new Error("Estrutura JSON inválida");
    }

    console.log("✅ Relatório gerado com sucesso");
    return parsed;
  } catch (err) {
    console.error("❌ Erro Gemini:", err.message);

    if (err.name === "AbortError") {
      console.error("⏱️ Timeout");
    }

    // 🧯 FALLBACK
    return {
      resumo: "Paciente relatou sintomas e mal-estar. Análise automática indisponível no momento. Revisar transcrição manualmente.",
      riscos: ["Revisar transcrição manualmente", "Verificar histórico de saúde do paciente"],
      emocional: ["Desconforto relatado pelo paciente", "Necessário acompanhamento"],
      beneficios: ["Verificar elegibilidade para BPC/LOAS", "Avaliar necessidade de auxílio-doença (INSS)"],
      orientacoes: [
        "Realizar entrevista social detalhada",
        "Solicitar documentação pessoal e comprovante de renda",
        "Encaminhar para avaliação médica no SUS",
        "Verificar situação cadastral no CadÚnico",
      ],
    };
  }
}