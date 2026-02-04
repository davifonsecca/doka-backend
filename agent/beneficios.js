export function decidirBeneficios(state) {
  const beneficios = [];
  const orientacoes = [];

  const textoCompleto = state.resumoParcial.join(" ").toLowerCase();

  // 🔎 REGRAS SOCIAIS (exemplos reais)
  if (textoCompleto.includes("desempregado")) {
    beneficios.push("Seguro-desemprego");
    orientacoes.push("Encaminhar para o SINE ou Casa do Trabalhador");
  }

  if (textoCompleto.includes("aluguel")) {
    beneficios.push("Auxílio aluguel");
    orientacoes.push("Verificar programas habitacionais do município");
  }

  if (textoCompleto.includes("filho")) {
    beneficios.push("Bolsa Família");
    orientacoes.push("Atualizar o CadÚnico");
  }

  if (
    textoCompleto.includes("ansioso") ||
    textoCompleto.includes("depressivo")
  ) {
    beneficios.push("Acompanhamento psicológico pelo SUS");
    orientacoes.push("Encaminhar para CAPS ou UBS");
  }

  // 🔴 CASO NÃO DETECTE NADA
  if (beneficios.length === 0) {
    orientacoes.push(
      "Coletar mais informações para avaliação social completa"
    );
  }

  return {
    beneficios,
    orientacoes,
  };
}
