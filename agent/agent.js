export function analisarChunk(state, texto) {
  const t = texto.toLowerCase();

  /* ==========================
     🧠 RESUMO
  =========================== */
  state.resumoParcial.push(texto);

  /* ==========================
     👵 IDADE / IDOSO
  =========================== */
  const idadeMatch = t.match(/(\d{2})\s*anos/);
  if (idadeMatch) {
    const idade = parseInt(idadeMatch[1], 10);
    state.fatos.idade = idade;

    if (idade >= 65) {
      state.fatos.idosa = true;
    }
  }

  if (t.includes("idosa") || t.includes("idoso")) {
    state.fatos.idosa = true;
  }

  /* ==========================
     💰 RENDA
  =========================== */
  if (
    t.includes("sem renda") ||
    t.includes("nenhuma renda") ||
    t.includes("vive de doações") ||
    t.includes("renda zero")
  ) {
    state.fatos.rendaPerCapita = 0;
  }

  /* ==========================
     🏥 DOENÇA / INCAPACIDADE
  =========================== */
  if (
    t.includes("artrose") ||
    t.includes("doença crônica") ||
    t.includes("problema de saúde")
  ) {
    state.fatos.doencaCronica = true;
  }

  if (
    t.includes("não consegue trabalhar") ||
    t.includes("não pode trabalhar") ||
    t.includes("impede de trabalhar") ||
    t.includes("incapaz de trabalhar")
  ) {
    state.fatos.incapacidadeTrabalho = true;
  }

  /* ==========================
     👶 DEPENDENTES
  =========================== */
  if (
    t.includes("neta") ||
    t.includes("filho") ||
    t.includes("criança")
  ) {
    const menorMatch = t.match(/(\d{1,2})\s*anos/);
    if (menorMatch) {
      const idadeDep = parseInt(menorMatch[1], 10);
      if (idadeDep < 18) {
        state.fatos.dependenteMenor = true;
      }
    }
  }

  /* ==========================
     🏠 MORADIA / RISCO
  =========================== */
  if (
    t.includes("aluguel") ||
    t.includes("risco de despejo") ||
    t.includes("vai ser despejada")
  ) {
    state.fatos.moradiaRisco = true;
    state.riscos.push("Risco de moradia");
  }

  /* ==========================
     ⚠️ RISCOS SOCIAIS
  =========================== */
  if (state.fatos.rendaPerCapita === 0) {
    state.riscos.push("Vulnerabilidade econômica");
  }

  /* ==========================
     😟 EMOCIONAL
  =========================== */
  if (
    t.includes("ansiosa") ||
    t.includes("ansioso") ||
    t.includes("deprimida") ||
    t.includes("triste")
  ) {
    state.emocional.push("Sofrimento emocional");
  }
}
