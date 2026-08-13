// Pontos do livro que precisam de revisão humana; nenhum foi corrigido automaticamente.
export default [
  {
    "id": "atributos-pontos-iniciais",
    "severity": "medium",
    "topic": "Distribuição de atributos",
    "issue": "O livro diz “Começa com 4 pontos para distribuir” e também “Todos os atributos começam em 1”; falta explicitar com precisão o limite inicial e a conversão ao reduzir para 0.",
    "references": [
      "atributos"
    ]
  },
  {
    "id": "defesa-formula",
    "severity": "high",
    "topic": "Defesa",
    "issue": "Defesa é central e aparece em armaduras, condições e habilidades, mas não há fórmula-base consolidada de Defesa.",
    "references": [
      "defesa",
      "armaduras"
    ]
  },
  {
    "id": "pd-uso",
    "severity": "high",
    "topic": "Pontos de Determinação",
    "issue": "Valores iniciais e progressão de PD são definidos, mas o uso/gasto/recuperação de PD não está consolidado.",
    "references": [
      "pd"
    ]
  },
  {
    "id": "acao-economia",
    "severity": "high",
    "topic": "Economia de ações",
    "issue": "Ação Padrão, Livre, Leve e de Movimento aparecem frequentemente, mas não há uma seção global definindo quantas ações cada personagem possui por turno.",
    "references": [
      "acao-padrao",
      "acao-livre",
      "acao-leve",
      "movimento"
    ]
  },
  {
    "id": "ataque-formula",
    "severity": "high",
    "topic": "Teste de ataque",
    "issue": "Bônus, Defesa e penalidades são citados, mas não há uma fórmula geral consolidada para resolver ataques.",
    "references": [
      "ataque",
      "defesa"
    ]
  },
  {
    "id": "contra-ataque-metade",
    "severity": "high",
    "topic": "Contra-Ataque",
    "issue": "“Faça um ataque imediato com metade do resultado no teste de ataque” é ambíguo. É necessário definir exatamente o que é dividido pela metade.",
    "references": [
      "contra-ataque"
    ]
  },
  {
    "id": "encharcado-definicao",
    "severity": "high",
    "topic": "Encharcado",
    "issue": "O próprio livro contém a nota “define como regra global depois”. A condição não foi consolidada na tabela final de status.",
    "references": [
      "encharcado",
      "jato-de-agua"
    ]
  },
  {
    "id": "ataque-leve-vs-acao-leve",
    "severity": "high",
    "topic": "Ataque Leve / Ação Leve",
    "issue": "Passo do Vento usa “Ataque Leve adicional”, enquanto outras partes usam “Ação Leve”. É necessário confirmar se são conceitos diferentes.",
    "references": [
      "passo-do-vento",
      "acao-leve"
    ]
  },
  {
    "id": "colosso-requisito",
    "severity": "medium",
    "topic": "Colosso de Ferro",
    "issue": "O requisito aparece como “Corpo de Metal”, enquanto a habilidade anterior da linha é “Corpo de Rocha”. Provável inconsistência nominal.",
    "references": [
      "colosso-de-ferro",
      "corpo-de-rocha"
    ]
  },
  {
    "id": "nucleo-defensivo-duplicado",
    "severity": "low",
    "topic": "Núcleo Defensivo",
    "issue": "Existem duas habilidades chamadas Núcleo Defensivo em linhas Universais diferentes (Armadura Imbuída e Barreira Elemental), com efeitos distintos. IDs precisam ser desambiguados.",
    "references": [
      "nucleo-defensivo-universal"
    ]
  },
  {
    "id": "pulso-arcano-grau",
    "severity": "medium",
    "topic": "Pulso Arcano",
    "issue": "Em versões anteriores/dados do site Pulso Arcano aparece com Grau/RES 2, enquanto no livro atual ele está como Grau de Ressonância 1.",
    "references": [
      "pulso-arcano"
    ]
  },
  {
    "id": "critico-geral",
    "severity": "medium",
    "topic": "Crítico",
    "issue": "Existem regras de crítico para Ressonância e Esquiva, mas não uma regra geral de crítico de ataque.",
    "references": [
      "critico"
    ]
  },
  {
    "id": "cobertura-geral",
    "severity": "medium",
    "topic": "Cobertura",
    "issue": "Cobertura é citada em habilidades, mas faltam regras gerais de bônus e tipos de cobertura.",
    "references": [
      "cobertura"
    ]
  },
  {
    "id": "oportunidade-geral",
    "severity": "medium",
    "topic": "Ataque de oportunidade",
    "issue": "Diversas habilidades removem ataques de oportunidade, mas o gatilho e a resolução base não são definidos globalmente.",
    "references": [
      "ataque-de-oportunidade"
    ]
  },
  {
    "id": "rd-acumulo",
    "severity": "medium",
    "topic": "Redução de Dano",
    "issue": "Falta definir se múltiplas fontes de RD acumulam e a ordem de aplicação com reduções em dados.",
    "references": [
      "rd"
    ]
  },
  {
    "id": "status-duracoes",
    "severity": "medium",
    "topic": "Duração dos status",
    "issue": "Vários status da tabela final não possuem duração/recuperação global e dependem da habilidade. Isso deve ser explicitado na UI.",
    "references": [
      "acumulo-de-status",
      "remocao-de-status"
    ]
  }
];
