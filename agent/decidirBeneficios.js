// decidirBeneficios.js

export function decidirBeneficios(dados) {
  const beneficios = [];
  const orientacoes = [];

  const {
    idade,
    rendaPerCapita,
    possuiDeficiencia,
    possuiDoencaCronica,
    incapacidadeParaTrabalho,
    possuiDependente,
    riscoDespejo,
    insegurancaAlimentar,
    cadastroUnicoAtualizado
  } = dados;

  // 🔹 BPC / LOAS
  if (
    idade >= 65 &&
    rendaPerCapita === 0 &&
    (incapacidadeParaTrabalho || possuiDeficiencia || possuiDoencaCronica)
  ) {
    beneficios.push("BPC/LOAS – Benefício de Prestação Continuada");
    orientacoes.push(
      "Encaminhar para requerimento do BPC junto ao INSS.",
      "Garantir que o Cadastro Único esteja atualizado."
    );
  }

  // 🔹 Bolsa Família
  if (rendaPerCapita === 0 && possuiDependente) {
    beneficios.push("Programa Bolsa Família");
    orientacoes.push(
      "Manter Cadastro Único atualizado.",
      "Acompanhar condicionalidades de saúde e educação."
    );
  }

  // 🔹 Benefícios Eventuais (assistência social)
  if (insegurancaAlimentar) {
    beneficios.push("Benefícios Eventuais – Cesta básica / auxílio alimentação");
    orientacoes.push(
      "Solicitar benefício eventual junto ao CRAS.",
      "Avaliar inclusão em programas de segurança alimentar."
    );
  }

  // 🔹 Risco de despejo
  if (riscoDespejo) {
    beneficios.push("Auxílio moradia / mediação habitacional");
    orientacoes.push(
      "Encaminhar para setor de habitação do município.",
      "Avaliar possibilidade de aluguel social."
    );
  }

  // 🔹 Saúde (SUS)
  if (possuiDoencaCronica) {
    beneficios.push("Acompanhamento pelo SUS");
    orientacoes.push(
      "Encaminhar para Unidade Básica de Saúde.",
      "Solicitar avaliação para acesso a medicamentos contínuos."
    );
  }

  // 🔹 Caso nenhum benefício seja identificado
  if (beneficios.length === 0) {
    orientacoes.push(
      "Coletar mais informações para avaliação social completa."
    );
  }

  return {
    beneficios,
    orientacoes
  };
}
