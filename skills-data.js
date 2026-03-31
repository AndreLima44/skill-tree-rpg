const SKILLS = {
  terra: {
    paths: [
      {
        name: "Caminho do Projétil",
        skills: [
          {
            name: "Projétil Rochoso",
            desc: "Você arremessa um fragmento de rocha com força bruta contra o alvo.",
            prereq: "Nenhum",
            type: "Ataque",
            range: "12m",
            effect: "2d6 contundente. Falha em Força: −1 Defesa até o próximo turno. Alvo sob controle recebe +1d6 adicional.",
            res: 1
          },
          {
            name: "Disparo Pesado",
            desc: "Você aumenta a densidade e o peso do projétil.",
            prereq: "Projétil Rochoso",
            type: "Ataque",
            range: "12m",
            effect: "2d6 + 2 dano. Falha: −2 Defesa. Empurra 1,5m.",
            res: 2
          },
          {
            name: "Impacto Sísmico",
            desc: "O projétil carrega energia do solo, causando impacto ampliado.",
            prereq: "Disparo Pesado",
            type: "Ataque em área",
            range: "12m",
            effect: "3d6 dano. Adjacentes sofrem 1d6. Falha em Agilidade: Caído. Alvo com penalidade de Defesa sofre +2d6.",
            res: 3
          },
          {
            name: "Colapso de Metal",
            desc: "Você lança um projétil massivo metal que colapsa ao atingir o alvo.",
            prereq: "Impacto Sísmico",
            type: "Ataque em área",
            range: "12m",
            effect: "3d6 dano. Ignora até 2 RD. Falha: Caído e −2 Defesa por 1 rodada. Alvo Caído sofre +2d6.",
            res: 4
          }
        ]
      },
      {
        name: "Caminho da Defesa",
        skills: [
          {
            name: "Pele de Pedra",
            desc: "Sua pele se endurece como rocha, reduzindo o impacto dos ataques.",
            prereq: "Nenhum",
            type: "Defesa",
            range: "Pessoal",
            effect: "+1 Defesa, RD 2, −3m deslocamento. +2 testes contra empurrão ou queda.",
            res: 1
          },
          {
            name: "Couraça Rochosa",
            desc: "A camada de pedra se torna mais espessa e eficiente.",
            prereq: "Pele de Pedra",
            type: "Defesa",
            range: "Pessoal",
            effect: "+1 Defesa, RD 3, −3m deslocamento. 1x/rodada reduz +1d6 dano. Se não se mover: +1 Defesa.",
            res: 2
          },
          {
            name: "Corpo de Rocha",
            desc: "Seu corpo se torna parcialmente mineral.",
            prereq: "Couraça Rochosa",
            type: "Defesa",
            range: "Pessoal",
            effect: "+2 Defesa, RD 4, −6m deslocamento. Não pode ser empurrado ou derrubado. Corpo a corpo contra você sofre 1d6.",
            res: 3
          },
          {
            name: "Colosso de Ferro",
            desc: "Você assume uma forma massiva de metal.",
            prereq: "Corpo de Rocha",
            type: "Defesa",
            range: "Pessoal",
            effect: "+2 Defesa, RD 5, −6m deslocamento. Inamovível. 1x/rodada reduz um ataque em 2d6. Se ficou parado, próximo ataque +2d6.",
            res: 4
          }
        ]
      },
      {
        name: "Caminho do Tremor",
        skills: [
          {
            name: "Tremor",
            desc: "Você faz o solo tremer sob seus inimigos, desestabilizando seus movimentos.",
            prereq: "Nenhum",
            type: "Área",
            range: "6m",
            effect: "Área 3m: 1d6 dano. Falha em Agilidade: Caído. Solo fica instável até o próximo turno.",
            res: 1
          },
          {
            name: "Abalo Contínuo",
            desc: "O tremor se mantém ativo por mais tempo.",
            prereq: "Tremor",
            type: "Área",
            range: "6m",
            effect: "1d6 dano, duração 2 rodadas. Falha: Caído. Sucesso: −1 em ataques. Quem começa na área testa novamente.",
            res: 2
          },
          {
            name: "Fissura Sísmica",
            desc: "Você rompe o solo, criando rachaduras perigosas.",
            prereq: "Abalo Contínuo",
            type: "Área",
            range: "6m",
            effect: "Área 6m, 2d6 dano, duração 3 rodadas. Falha: Caído e −2 Defesa. Mover-se na área causa +1d6.",
            res: 3
          },
          {
            name: "Colapso Sísmico",
            desc: "Você causa um colapso massivo no terreno.",
            prereq: "Fissura Sísmica",
            type: "Área",
            range: "6m",
            effect: "Área 6m, 2d6 dano, duração 3 rodadas. Falha: Caído e −2 Defesa. Zona causa 1d6/rodada. Alvos Caídos sofrem +2d6 Terra.",
            res: 4
          }
        ]
      }
    ]
  },

  fogo: {
    paths: [
      {
        name: "Caminho da Chama Breve",
        skills: [
          {
            name: "Chama Breve",
            desc: "Você cria uma pequena explosão de fogo em direção a um alvo.",
            prereq: "Nenhum",
            type: "Ataque",
            range: "9m",
            effect: "2d6 fogo. Falha em Vigor: 1d4 no próximo turno. Alvo já sob efeito de fogo recebe +1d6.",
            res: 1
          },
          {
            name: "Chama Intensificada",
            desc: "O fogo se torna mais agressivo e persistente.",
            prereq: "Chama Breve",
            type: "Ataque",
            range: "9m",
            effect: "2d6 fogo. Falha: 1d6 por 2 rodadas. Adjacente sofre 1d6.",
            res: 2
          },
          {
            name: "Explosão Incandescente",
            desc: "Você transforma a chama em uma detonação instável.",
            prereq: "Chama Intensificada",
            type: "Ataque em área",
            range: "9m",
            effect: "3d6 fogo. Adjacentes sofrem 1d6. Falha: 1d6 por 2 rodadas. Alvo em fogo sofre +2d6.",
            res: 3
          },
          {
            name: "Incêndio Descontrolado",
            desc: "Você libera fogo de forma quase incontrolável, consumindo tudo ao redor.",
            prereq: "Explosão Incandescente",
            type: "Ataque em área",
            range: "9m",
            effect: "3d6 fogo em área 3m. Todos sofrem 1d6 por 2 rodadas. Alvos em fogo propagam 1d6 para adjacentes. Inimigos em chamas: −1 testes.",
            res: 4
          }
        ]
      },
      {
        name: "Caminho da Lâmina Flamejante",
        skills: [
          {
            name: "Lâmina Flamejante",
            desc: "Você envolve sua arma em chamas instáveis que reagem ao impacto.",
            prereq: "Nenhum",
            type: "Aprimoramento",
            range: "Pessoal",
            effect: "+1d4 fogo corpo a corpo. Cada acerto consecutivo no mesmo alvo: +1 dano, máx +3. No máximo: +1d6 e reinicia.",
            res: 1
          },
          {
            name: "Corte Incandescente",
            desc: "Seus ataques começam a liberar energia acumulada em golpes mais violentos.",
            prereq: "Lâmina Flamejante",
            type: "Ataque",
            range: "Corpo a corpo",
            effect: "+1d6 fogo. Ao atingir 3 acúmulos: +2d6 e 1d6 em adjacentes. Alvo em fogo recebe +1d6.",
            res: 2
          },
          {
            name: "Fúria Flamejante",
            desc: "Você entra em um estado agressivo onde o fogo responde à sua ofensiva constante.",
            prereq: "Corte Incandescente",
            type: "Ataque",
            range: "Corpo a corpo",
            effect: "+1d6 fogo. Cada acerto bem-sucedido concede +1d6, máx +3d6. Ao errar ou trocar de alvo perde acúmulo. Alvos sofrem 1d6 por rodada enquanto você mantiver foco.",
            res: 3
          },
          {
            name: "Carnificina Ígnea",
            desc: "Você libera toda a energia acumulada em uma sequência devastadora de ataques.",
            prereq: "Fúria Flamejante",
            type: "Ataque",
            range: "Corpo a corpo",
            effect: "+2d6 fogo. Ao atingir um alvo pode atacar outro adjacente 1x/turno. Alvo em fogo sofre +2d6 e espalha 1d6. No fim, todos sofrem 1d6 por acúmulos restantes.",
            res: 4
          }
        ]
      },
      {
        name: "Caminho da Onda de Calor",
        skills: [
          {
            name: "Onda de Calor",
            desc: "Você libera calor intenso ao seu redor, tornando o ambiente sufocante.",
            prereq: "Nenhum",
            type: "Controle",
            range: "Pessoal (aura 3m)",
            effect: "1d6 fogo por rodada. Falha em Vigor: −1 em testes. Permanecer 2 rodadas: −3m deslocamento.",
            res: 1
          },
          {
            name: "Calor Crescente",
            desc: "O calor se intensifica conforme o combate se prolonga.",
            prereq: "Onda de Calor",
            type: "Controle",
            range: "Pessoal (aura 3m)",
            effect: "1d6+1 fogo por rodada. −2 testes. Cada rodada na área: +1 dano extra, máx +3.",
            res: 2
          },
          {
            name: "Zona de Combustão",
            desc: "O calor se torna tão intenso que começa a afetar o espaço ao redor.",
            prereq: "Calor Crescente",
            type: "Controle",
            range: "Pessoal (aura 6m)",
            effect: "Área 6m. 1d6 dano por rodada e −2 testes. Alvos em fogo sofrem +1d6 por rodada. Entrar na área causa 1d6.",
            res: 3
          },
          {
            name: "Inferno Localizado",
            desc: "Você transforma a área ao seu redor em um núcleo de calor extremo.",
            prereq: "Zona de Combustão",
            type: "Controle",
            range: "Pessoal (aura 6m)",
            effect: "Área 6m por 4 rodadas. 2d6 dano por rodada, −2 testes, −3m movimento. Inimigos em fogo sofrem +2d6 imediato 1x/rodada. Aliados recebem +1d6 fogo em ataques.",
            res: 4
          }
        ]
      }
    ]
  },

  agua: {
    paths: [
      {
        name: "Caminho da Correnteza",
        skills: [
          {
            name: "Jato de Água",
            desc: "Você dispara um jato pressurizado de água contra um inimigo.",
            prereq: "Nenhum",
            type: "Ataque",
            range: "12m",
            effect: "2d6 dano. Falha em Força: empurra 3m. Alvo fica Encharcado até o próximo turno.",
            res: 1
          },
          {
            name: "Correnteza Forçada",
            desc: "O fluxo de água se torna mais forte e difícil de resistir.",
            prereq: "Jato de Água",
            type: "Ataque",
            range: "12m",
            effect: "2d6 dano, empurra 6m. Falha: também fica Caído. Alvo Encharcado recebe +1d6 e não evita empurrão.",
            res: 2
          },
          {
            name: "Impacto Hidráulico",
            desc: "Você concentra pressão suficiente para causar impacto real.",
            prereq: "Correnteza Forçada",
            type: "Ataque",
            range: "12m",
            effect: "3d6 dano, empurra 6m. Colisão: +2d6. Criaturas no caminho sofrem 1d6. Alvo Encharcado: −2 testes físicos.",
            res: 3
          },
          {
            name: "Torrente Devastadora",
            desc: "Você libera uma corrente massiva que domina o espaço e o movimento.",
            prereq: "Impacto Hidráulico",
            type: "Ataque em área",
            range: "Linha 12m",
            effect: "Todos sofrem 3d6 dano e empurrão 6m. Teste reduz pela metade. Alvos Encharcados são empurrados automaticamente e ficam Caídos. Você pode mover até 6m junto.",
            res: 4
          }
        ]
      },
      {
        name: "Caminho do Arsenal Hidrostático",
        skills: [
          {
            name: "Arsenal Hidrostático",
            desc: "Você molda água em uma arma de alta pressão e a dispara contra o alvo.",
            prereq: "Nenhum",
            type: "Ataque",
            range: "12m",
            effect: "2d6 perfurante + água. Falha em Vigor: +1d6 implosão. Alvo Encharcado sofre implosão automaticamente.",
            res: 1
          },
          {
            name: "Arma Compressiva",
            desc: "Você aumenta a densidade e multiplica suas construções de água.",
            prereq: "Arsenal Hidrostático",
            type: "Ataque",
            range: "12m",
            effect: "2d6 dano e +2d6 implosão. Pode criar 2 armas simultaneamente. Encharcado: +1d6 adicional.",
            res: 2
          },
          {
            name: "Ruptura Hidrostática",
            desc: "Você domina a pressão interna, causando colapsos destrutivos dentro do alvo.",
            prereq: "Arma Compressiva",
            type: "Ataque",
            range: "12m",
            effect: "3d6 dano e +2d6 implosão. Alvo sob efeito sofre +2d6 adicional e −1 testes físicos.",
            res: 3
          },
          {
            name: "Arsenal Abissal",
            desc: "Você cria múltiplas armas de água altamente instáveis.",
            prereq: "Ruptura Hidrostática",
            type: "Ataque",
            range: "12m",
            effect: "3d6 dano e +3d6 implosão. Até 3 armas. Encharcado: cada impacto aplica implosão completa. Abaixo de 50% PV: +2d6.",
            res: 4
          }
        ]
      },
      {
        name: "Caminho da Maré Vital",
        skills: [
          {
            name: "Cura Fluida",
            desc: "Você canaliza água vital no alvo, restaurando seu fluxo interno.",
            prereq: "Nenhum",
            type: "Cura",
            range: "Toque",
            effect: "Cura 2d6 + Intelecto. Escolha: +1d6 PV, remove condição leve ou +1 testes por 1 rodada. Alvo Encharcado: +1d6 cura.",
            res: 1
          },
          {
            name: "Corrente Restauradora",
            desc: "A energia passa a fluir entre múltiplos alvos.",
            prereq: "Cura Fluida",
            type: "Cura",
            range: "3m",
            effect: "Cura 2d6 + Intelecto em um alvo e metade em outro a até 3m. Alvos recebem +1 Defesa ou +1 testes por 1 rodada.",
            res: 2
          },
          {
            name: "Maré Vital",
            desc: "Você cria um fluxo contínuo de regeneração.",
            prereq: "Corrente Restauradora",
            type: "Cura",
            range: "Pessoal/Toque",
            effect: "Cura imediata 2d6 + Intelecto e mais 1d6 por rodada durante 2 rodadas. Encharcado: cura contínua vira 1d6+1.",
            res: 3
          },
          {
            name: "Maré da Vida",
            desc: "Você libera uma onda poderosa de energia vital, restaurando e fortalecendo aliados.",
            prereq: "Maré Vital",
            type: "Cura",
            range: "6m",
            effect: "Cura 3d6 + Intelecto em área. Remove até 2 condições leves. Alvo cheio recebe escudo 2d6. Encharcado: +1d6 cura.",
            res: 4
          }
        ]
      }
    ]
  },

  vento: {
    paths: [
      {
        name: "Caminho da Rajada",
        skills: [
          {
            name: "Rajada de Vento",
            desc: "Você dispara uma rajada concentrada de vento contra o alvo.",
            prereq: "Nenhum",
            type: "Ataque",
            range: "12m",
            effect: "2d6 dano. Falha em Força: empurra 3m. Próximo ataque contra o alvo: +1. Colisão: 1d4 em ambos.",
            res: 1
          },
          {
            name: "Corrente de Ar",
            desc: "Você melhora o fluxo do vento, tornando-o mais controlado.",
            prereq: "Rajada de Vento",
            type: "Ataque",
            range: "12m",
            effect: "2d6 dano, empurra 4,5m na direção escolhida. Falha: −1 Defesa.",
            res: 2
          },
          {
            name: "Fluxo Cortante",
            desc: "A rajada se torna mais afiada e estratégica.",
            prereq: "Corrente de Ar",
            type: "Ataque",
            range: "12m",
            effect: "3d6 dano, empurra 4,5m, ignora +1 Defesa. Se mover após ser atingido: +1d6. Se já foi movido no turno: +1d6.",
            res: 3
          },
          {
            name: "Tempestade Direcionada",
            desc: "Você controla múltiplas correntes de vento simultaneamente.",
            prereq: "Fluxo Cortante",
            type: "Ataque em área",
            range: "12m",
            effect: "3d6 dano em até 3 alvos. Empurra 4,5m cada. Colisão: 2d6 em ambos. Para cada alvo atingido: +1 em testes até o próximo turno, máx +3.",
            res: 4
          }
        ]
      },
      {
        name: "Caminho do Passo do Vento",
        skills: [
          {
            name: "Passo do Vento",
            desc: "Você acelera seu corpo com correntes de vento.",
            prereq: "Nenhum",
            type: "Mobilidade",
            range: "Pessoal",
            effect: "+6m deslocamento e +1 Ataque Leve por turno. Após atacar pode mover 1,5m sem ataque de oportunidade.",
            res: 1
          },
          {
            name: "Ritmo Acelerado",
            desc: "Você entra em um fluxo constante de ataques rápidos.",
            prereq: "Passo do Vento",
            type: "Mobilidade",
            range: "Pessoal",
            effect: "+6m deslocamento, +1 Ataque Leve. Se acertar dois ataques no turno: +1 no próximo ataque. Pode dividir deslocamento entre ataques.",
            res: 2
          },
          {
            name: "Dança dos Ventos",
            desc: "Você transforma velocidade em ofensiva constante.",
            prereq: "Ritmo Acelerado",
            type: "Mobilidade",
            range: "Pessoal",
            effect: "+9m deslocamento, +2 Ataques Leves. Ataques consecutivos no mesmo alvo: +1 dano cumulativo, máx +3. Após atacar: +1 Defesa.",
            res: 3
          },
          {
            name: "Tempestade de Golpes",
            desc: "Você atinge uma velocidade absurda, atacando múltiplas vezes em um instante.",
            prereq: "Dança dos Ventos",
            type: "Mobilidade",
            range: "Pessoal",
            effect: "+9m deslocamento, +3 Ataques Leves. Se acertar o mesmo alvo 3 vezes: +2d6. Pode mover sem AoO entre ataques. Cada ataque após o primeiro: +1 acerto.",
            res: 4
          }
        ]
      },
      {
        name: "Caminho do Corte de Ar",
        skills: [
          {
            name: "Corte de Ar",
            desc: "Você dispara uma lâmina de ar comprimido extremamente precisa.",
            prereq: "Nenhum",
            type: "Ataque",
            range: "15m",
            effect: "2d6 cortante e +1 no teste de ataque. Alvo que não se moveu no último turno sofre +1d6.",
            res: 1
          },
          {
            name: "Lâmina Direcionada",
            desc: "Você passa a controlar melhor a trajetória do corte.",
            prereq: "Corte de Ar",
            type: "Ataque",
            range: "15m",
            effect: "2d6 dano e +2 no ataque. Ignora −1 de cobertura ou Defesa. Alvo abaixo de 50% PV sofre +1d6.",
            res: 2
          },
          {
            name: "Fenda de Vento",
            desc: "O corte se torna mais profundo e difícil de resistir.",
            prereq: "Lâmina Direcionada",
            type: "Ataque",
            range: "15m",
            effect: "3d6 dano e +2 no ataque. Ignora +2 Defesa. O alvo sofre +1d6 no próximo turno. Se se moveu no turno anterior: +1d6.",
            res: 3
          },
          {
            name: "Lâmina do Vácuo",
            desc: "Você cria um corte tão preciso que rasga o próprio ar.",
            prereq: "Fenda de Vento",
            type: "Ataque",
            range: "15m",
            effect: "3d6 dano e +3 no ataque. Ignora +3 Defesa. Alvo abaixo de 50% PV sofre +2d6. Ao acertar: segundo ataque com −2.",
            res: 4
          }
        ]
      }
    ]
  },

  energia: {
    paths: [
      {
        name: "Caminho da Descarga Elétrica",
        skills: [
          {
            name: "Descarga Elétrica",
            desc: "Você dispara uma descarga elétrica que percorre o corpo do alvo, interferindo em seus movimentos.",
            prereq: "Nenhum",
            type: "Ataque",
            range: "12m",
            effect: "2d6 elétrico. Falha em Vigor: −2 em testes de ataque. Também sofre −1 em todos os testes.",
            res: 1
          },
          {
            name: "Sobrecarga",
            desc: "A energia começa a se acumular no corpo do alvo.",
            prereq: "Descarga Elétrica",
            type: "Ataque",
            range: "12m",
            effect: "2d6 dano. Falha: −2 em testes e fica Sobrecarregado. Segundo alvo a até 3m sofre 1d6.",
            res: 2
          },
          {
            name: "Corrente Instável",
            desc: "A descarga passa a saltar entre alvos e desestabilizar o campo.",
            prereq: "Sobrecarga",
            type: "Ataque em área",
            range: "12m",
            effect: "3d6 dano. Atinge até 2 alvos adicionais a 3m entre si. Alvos sofrem −2 em testes e −1 ação leve. Sobrecarregados sofrem +2d6.",
            res: 3
          },
          {
            name: "Colapso Elétrico",
            desc: "Você provoca uma falha total no sistema do alvo.",
            prereq: "Corrente Instável",
            type: "Ataque em área",
            range: "12m",
            effect: "3d6 dano em até 3 alvos. Falha: Atordoado por 1 rodada. Sucesso: −2 testes. Sobrecarregado falha automaticamente e sofre +2d6.",
            res: 4
          }
        ]
      },
      {
        name: "Caminho do Campo Energético",
        skills: [
          {
            name: "Campo Energético",
            desc: "Você cria um campo de energia instável que absorve e distorce impactos.",
            prereq: "Nenhum",
            type: "Defesa",
            range: "Pessoal",
            effect: "RD 2. Ao sofrer dano, atacante sofre −1 testes. Se for atingido, seu próximo ataque causa +1d6 elétrico.",
            res: 1
          },
          {
            name: "Campo Reativo",
            desc: "O campo passa a reagir diretamente aos ataques recebidos.",
            prereq: "Campo Energético",
            type: "Defesa",
            range: "Pessoal",
            effect: "RD 2. Corpo a corpo contra você sofre 1d6 elétrico e −1 testes. Se o mesmo inimigo te atacar duas vezes: fica Sobrecarregado.",
            res: 2
          },
          {
            name: "Campo de Interferência",
            desc: "O campo começa a afetar o fluxo de ações ao redor.",
            prereq: "Campo Reativo",
            type: "Defesa",
            range: "Pessoal (aura 3m)",
            effect: "RD 3. Inimigos adjacentes sofrem −2 testes. Se falharem em teste na área, perdem 1 ação leve. Sobrecarregados sofrem 1d6 por rodada.",
            res: 3
          },
          {
            name: "Núcleo de Sobrecarga",
            desc: "Você se torna o centro de um campo elétrico altamente instável.",
            prereq: "Campo de Interferência",
            type: "Defesa",
            range: "Pessoal (aura 3m)",
            effect: "RD 3. Inimigos adjacentes sofrem descarga. Sobrecarregados na área entram em colapso com mais facilidade. Ideal para controle reativo.",
            res: 4
          }
        ]
      },
      {
        name: "Caminho do Pulso Arcano",
        skills: [
          {
            name: "Pulso Arcano",
            desc: "Uma onda instável de energia que afeta múltiplos alvos e desorganiza seus testes.",
            prereq: "Nenhum",
            type: "Área",
            range: "6m",
            effect: "2d6 elétrico em área 3m. Falha: −1 testes. Se atingir 2+ alvos, aplica −1 adicional.",
            res: 2
          },
          {
            name: "Pulso Instável",
            desc: "A explosão se torna mais persistente e aplica sobrecarga.",
            prereq: "Pulso Arcano",
            type: "Área",
            range: "6m",
            effect: "2d6 elétrico em área 3m. Falha: −2 testes e Sobrecarregado. Eco: 1d6 no próximo turno.",
            res: 2
          },
          {
            name: "Ruptura Energética",
            desc: "A energia desorganiza o corpo e quebra o ritmo do alvo.",
            prereq: "Pulso Instável",
            type: "Área",
            range: "6m",
            effect: "3d6 elétrico em área 3m. Falha: −2 testes e −1 ação leve. Sobrecarregado: +2d6. A área permanece por 1 rodada.",
            res: 3
          },
          {
            name: "Colapso Arcano",
            desc: "O pulso evolui para uma explosão que colapsa o sistema dos alvos afetados.",
            prereq: "Ruptura Energética",
            type: "Área",
            range: "6m",
            effect: "3d6 elétrico em área 3m. Falha: Atordoado. Sobrecarregado: falha automática e +2d6. A zona permanece por 2 rodadas.",
            res: 4
          }
        ]
      }
    ]
  },

  frio: {
    paths: [
      {
        name: "Caminho do Toque Congelante",
        skills: [
          {
            name: "Toque Congelante",
            desc: "Frio direto desacelerando movimento e preparando o alvo.",
            prereq: "Nenhum",
            type: "Ataque",
            range: "Toque",
            effect: "2d6 frio. −3m deslocamento. Penalidade leve ao movimento.",
            res: 1
          },
          {
            name: "Congelamento Parcial",
            desc: "O frio começa a afetar a mobilidade de forma mais severa.",
            prereq: "Toque Congelante",
            type: "Ataque",
            range: "Toque",
            effect: "2d6 dano. −6m deslocamento. Falha em Vigor: −1 testes. Novo efeito de Frio: fica Lento.",
            res: 2
          },
          {
            name: "Prisão Gélida",
            desc: "Você começa a prender o alvo com gelo sólido.",
            prereq: "Congelamento Parcial",
            type: "Ataque",
            range: "Toque",
            effect: "3d6 dano. Falha em Vigor: Imobilizado por 1 rodada. Sucesso: −6m deslocamento. Alvo Imobilizado recebe +1d6 de qualquer ataque.",
            res: 3
          },
          {
            name: "Congelamento Total",
            desc: "Você leva o frio ao limite, travando completamente o alvo.",
            prereq: "Prisão Gélida",
            type: "Ataque",
            range: "Toque",
            effect: "3d6 dano. Falha: Congelado por 1 rodada. Sucesso: Imobilizado. Alvos Congelados recebem +2d6. Ao terminar: +1d6 ruptura.",
            res: 4
          }
        ]
      },
      {
        name: "Caminho da Arma de Gelo",
        skills: [
          {
            name: "Arma de Gelo",
            desc: "Você cria uma arma de gelo moldada pela sua vontade.",
            prereq: "Nenhum",
            type: "Ataque",
            range: "12m / Corpo a corpo",
            effect: "2d6 dano + frio. Escolha: cortante (+1 ataque), perfurante (ignora −1 Defesa) ou impacto (+2 dano). Alvo: −3m deslocamento.",
            res: 1
          },
          {
            name: "Arsenal Gélido",
            desc: "A arma de gelo evolui para versões mais adaptáveis e perigosas.",
            prereq: "Arma de Gelo",
            type: "Ataque",
            range: "12m / Corpo a corpo",
            effect: "2d6 frio. Permite alternar melhor as formas e manter pressão com estilhaços e resfriamento.",
            res: 2
          },
          {
            name: "Arma Cristalina",
            desc: "O gelo se torna mais denso, preciso e perigoso.",
            prereq: "Arsenal Gélido",
            type: "Ataque",
            range: "12m / Corpo a corpo",
            effect: "3d6 frio. Ignora +2 Defesa. Alvos reduzidos ou Imobilizados sofrem +2d6. Quebra atinge adjacentes.",
            res: 3
          },
          {
            name: "Arsenal Glacial",
            desc: "Você domina múltiplas armas de gelo e pressão glacial.",
            prereq: "Arma Cristalina",
            type: "Ataque",
            range: "12m / Corpo a corpo",
            effect: "3d6 frio e 2 ataques. Execução progressiva em alvos fragilizados. Derrotar um alvo pode estilhaçar em área.",
            res: 4
          }
        ]
      },
      {
        name: "Caminho da Prisão de Gelo",
        skills: [
          {
            name: "Prisão de Gelo",
            desc: "Você envolve o alvo em gelo, limitando o movimento.",
            prereq: "Nenhum",
            type: "Controle",
            range: "9m",
            effect: "Teste de Força: Imobilizado ou −3m deslocamento. O alvo sofre −1 Defesa.",
            res: 1
          },
          {
            name: "Cárcere Gélido",
            desc: "O gelo se torna mais resistente e opressivo.",
            prereq: "Prisão de Gelo",
            type: "Controle",
            range: "9m",
            effect: "Imobilizado por 2 rodadas ou Lento. Pressão: 1d6 por rodada. Alvos presos recebem +1d6.",
            res: 2
          },
          {
            name: "Prisão Cristalina",
            desc: "A prisão se solidifica com resistência e potencial de ruptura.",
            prereq: "Cárcere Gélido",
            type: "Controle",
            range: "9m",
            effect: "Imobiliza por 1 a 2 rodadas. Exige alto dano para escapar. Ao romper, causa 2d6.",
            res: 3
          },
          {
            name: "Sepultamento Glacial",
            desc: "O alvo é engolido pelo frio extremo e estilhaçamento.",
            prereq: "Prisão Cristalina",
            type: "Controle",
            range: "9m",
            effect: "Teste: Congelado ou Imobilizado. Fragilidade: +2d6. Ao estilhaçar, causa 2d6 em área.",
            res: 4
          }
        ]
      }
    ]
  },

  universais: {
    paths: [
      {
        name: "Caminho da Arma Imbuída",
        skills: [
          {
            name: "Embuir Arma",
            desc: "Você canaliza sua afinidade elemental para envolver uma arma empunhada com energia do elemento escolhido.",
            prereq: "Nenhum",
            type: "Aprimoramento",
            range: "Pessoal",
            effect: "+1d6 dano elemental. Fogo: 1d4 próximo turno. Água: empurra 1,5m. Terra: +1 dano. Vento: +1 ataque. Energia: −1 ataque no alvo. Frio: −3m deslocamento.",
            res: 1
          },
          {
            name: "Arma Energizada",
            desc: "A energia elemental se torna mais densa e agressiva, reagindo com maior intensidade ao impacto.",
            prereq: "Embuir Arma",
            type: "Aprimoramento",
            range: "Pessoal",
            effect: "+2d6 dano elemental. Efeitos aprimorados: Fogo 1d6, Água empurra 3m, Terra +2 dano, Vento +2 ataque, Energia −2 ataque, Frio −6m movimento. Dois acertos aplicam o efeito duas vezes.",
            res: 2
          },
          {
            name: "Arsenal Elemental",
            desc: "Você domina o fluxo elemental ao ponto de adaptá-lo em tempo real durante o combate.",
            prereq: "Arma Energizada",
            type: "Aprimoramento",
            range: "Pessoal",
            effect: "+2d6 dano elemental. Troca de elemento 1x por rodada. Adjacentes sofrem 1d6. Efeitos secundários ficam mais fortes.",
            res: 3
          },
          {
            name: "Manifestação Bélica",
            desc: "Sua arma se torna um canal direto da força elemental, liberando energia a cada golpe.",
            prereq: "Arsenal Elemental",
            type: "Aprimoramento",
            range: "Pessoal",
            effect: "+3d6 dano elemental. Ao acertar: 1d6 em área 3m. Troca livre de elemento. Se o alvo já estiver sob efeito elemental: +1d6.",
            res: 4
          }
        ]
      },
      {
        name: "Caminho da Armadura Imbuída",
        skills: [
          {
            name: "Embuir Armadura",
            desc: "Você canaliza energia elemental para reforçar sua armadura ou o próprio corpo.",
            prereq: "Nenhum",
            type: "Aprimoramento",
            range: "Pessoal",
            effect: "+2 Defesa. Fogo reflete 1d4 corpo a corpo. Água reduz 1d6 1x/rodada. Terra RD 2. Vento +3m. Energia +1 resistência. Frio: adjacentes sofrem −3m.",
            res: 1
          },
          {
            name: "Armadura Elemental",
            desc: "A energia se condensa, tornando a proteção mais consistente e reativa.",
            prereq: "Embuir Armadura",
            type: "Aprimoramento",
            range: "Pessoal",
            effect: "+3 Defesa. Efeitos aprimorados: fogo 1d6 refletido, água reduz 1d6 2x, terra RD 3, vento +6m, energia +2 resistência, frio −6m em adjacentes.",
            res: 2
          },
          {
            name: "Núcleo Defensivo",
            desc: "Você estabiliza a energia ao redor do corpo, criando um núcleo constante de proteção e interferência.",
            prereq: "Armadura Elemental",
            type: "Aprimoramento",
            range: "Pessoal",
            effect: "+3 Defesa e RD 3. Área 3m com efeito elemental para aliados e inimigos. Em Campo Elemental recebe +1 Defesa extra.",
            res: 3
          },
          {
            name: "Forma Elemental",
            desc: "Seu corpo se torna um canal direto do elemento, assumindo forma parcialmente transformada.",
            prereq: "Núcleo Defensivo",
            type: "Aprimoramento",
            range: "Pessoal",
            effect: "+4 Defesa, RD 5 e aura 3m com efeito elemental constante. Quando sofre dano, causa 1d6 elemental no atacante 1x/rodada.",
            res: 4
          }
        ]
      },
      {
        name: "Caminho do Golpe Elemental",
        skills: [
          {
            name: "Golpe Elemental",
            desc: "Você concentra energia elemental em um único impacto instável.",
            prereq: "Nenhum",
            type: "Ataque",
            range: "Corpo a corpo",
            effect: "+2d6 dano elemental. Marca o alvo até o fim do próximo turno. Efeito adicional depende do elemento.",
            res: 1
          },
          {
            name: "Impacto Elemental",
            desc: "Você aprende a detonar a marca elemental no momento do impacto.",
            prereq: "Golpe Elemental",
            type: "Ataque",
            range: "Corpo a corpo",
            effect: "+2d6 dano elemental. Se o alvo estiver Marcado: consome a marca e causa +2d6, com efeito extra por elemento.",
            res: 2
          },
          {
            name: "Ruptura Elemental",
            desc: "Você rompe completamente o fluxo de energia do alvo.",
            prereq: "Impacto Elemental",
            type: "Ataque",
            range: "Corpo a corpo",
            effect: "+3d6 dano elemental, ignora 2 Defesa. Se o alvo estiver sob efeito elemental: +2d6 e prolonga efeitos em 1 rodada.",
            res: 3
          },
          {
            name: "Execução Elemental",
            desc: "Você transforma o estado do alvo em uma oportunidade de finalização absoluta.",
            prereq: "Ruptura Elemental",
            type: "Ataque",
            range: "Corpo a corpo",
            effect: "+3d6 dano elemental, ignora 3 Defesa. Marcado: +2d6. Sob efeito elemental: +2d6. Menos de 50% PV: +2d6 e efeito automático.",
            res: 4
          }
        ]
      }
    ]
  },

  forca: {
    paths: [
      {
        name: "Caminho do Golpe Brutal",
        skills: [
          {
            name: "Golpe Brutal",
            desc: "Golpe direto com força total.",
            prereq: "Nenhum",
            type: "Ataque",
            range: "Corpo a corpo",
            effect: "2d6 físico. O alvo sofre −1 Defesa no próximo turno.",
            res: 1
          },
          {
            name: "Força Descomunal",
            desc: "Corpo ultrapassa limites humanos.",
            prereq: "Golpe Brutal",
            type: "Ataque",
            range: "Corpo a corpo",
            effect: "2d6 + 2 físico. Ignora 1 Defesa. Contra defesa pesada: +1d6.",
            res: 2
          },
          {
            name: "Investida Devastadora",
            desc: "Seu corpo vira uma arma em movimento.",
            prereq: "Força Descomunal",
            type: "Ataque",
            range: "Corpo a corpo",
            effect: "Move até 6m e ataca com 3d6 físico. Colisão: +2d6.",
            res: 3
          },
          {
            name: "Massacre Corporal",
            desc: "Estado de violência física total.",
            prereq: "Investida Devastadora",
            type: "Ataque",
            range: "Corpo a corpo",
            effect: "Por 2 rodadas: +2 ataques/turno e +2d6 dano. Alvo abaixo de 50% PV sofre +2d6.",
            res: 4
          }
        ]
      },
      {
        name: "Caminho da Resistência Inata",
        skills: [
          {
            name: "Corpo Endurecido",
            desc: "Pele e músculos endurecem absorvendo impactos.",
            prereq: "Nenhum",
            type: "Defesa",
            range: "Pessoal",
            effect: "RD 2.",
            res: 1
          },
          {
            name: "Resistência Sobre-Humana",
            desc: "Corpo resiste danos além do limite humano.",
            prereq: "Corpo Endurecido",
            type: "Defesa",
            range: "Pessoal",
            effect: "RD 3. 1x/turno reduz +1d6.",
            res: 2
          },
          {
            name: "Corpo Inquebrável",
            desc: "Estrutura física não pode ser derrubada.",
            prereq: "Resistência Sobre-Humana",
            type: "Defesa",
            range: "Pessoal",
            effect: "RD 4. Não pode ser derrubado. Imune a controle leve.",
            res: 3
          },
          {
            name: "Titã Vivo",
            desc: "Forma colossal praticamente indestrutível.",
            prereq: "Corpo Inquebrável",
            type: "Defesa",
            range: "Pessoal",
            effect: "RD 5. Ignora controle leve. 1x/rodada reduz 2d6.",
            res: 4
          }
        ]
      },
      {
        name: "Caminho da Velocidade Inata",
        skills: [
          {
            name: "Reflexo Instintivo",
            desc: "Reações instintivas aceleram seus movimentos.",
            prereq: "Nenhum",
            type: "Mobilidade",
            range: "Pessoal",
            effect: "+1 ação leve por turno.",
            res: 1
          },
          {
            name: "Velocidade Sobre-Humana",
            desc: "Movimento vira vantagem ofensiva.",
            prereq: "Reflexo Instintivo",
            type: "Mobilidade",
            range: "Pessoal",
            effect: "+1 ataque adicional e +3m deslocamento.",
            res: 2
          },
          {
            name: "Movimento Relâmpago",
            desc: "Movimento entre ataques sem reação inimiga.",
            prereq: "Velocidade Sobre-Humana",
            type: "Mobilidade",
            range: "Pessoal",
            effect: "Move entre ataques sem AoO e recebe +1 ataque.",
            res: 3
          },
          {
            name: "Fluxo de Combate",
            desc: "Movimento absoluto em combate.",
            prereq: "Movimento Relâmpago",
            type: "Mobilidade",
            range: "Pessoal",
            effect: "+2 ataques adicionais. Se acertar 3 vezes: +2d6. Em sequência pode ganhar +1 ataque extra.",
            res: 4
          }
        ]
      }
    ]
  }
};