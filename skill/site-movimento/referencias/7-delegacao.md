# Quem faz o quê: o que dá para passar a um modelo menor (medido)

Medição de 08/10/2026, no piloto (cópia da home do eventos.inema.pro) e nas 15 peças novas do
INEMA Motion Lab. "Topo" = o modelo mais forte disponível na sessão; "menor" = um modelo rápido e
barato (aqui, Haiku 5.5). Mesmo briefing para os dois em cada teste.

## Teste 1: construir peças de interface (gosto + código)

15 peças com o mesmo brief: 5 feitas pelo modelo menor, 10 pelo topo. Depois, um crítico (topo)
julgou as 15 **às cegas**, por capturas embaralhadas, sem saber quem fez qual.

| | Passou no teste automático de primeira | Aprovada pelo crítico cego | Tempo | Tokens |
|---|---|---|---|---|
| Modelo menor (5 peças) | **5/5** | **2/5** | 27 min | 356 mil |
| Topo (10 peças, 2 lotes) | 7/10 | **8/10** | 31–36 min por lote de 5 | 267–304 mil por lote |

Reprovadas do modelo menor: cores fora da marca (paleta de bala, roxo), prévias que cobrem o
conteúdo e estouram a tela no celular. Reprovadas do topo: um mini-jogo poluído com cores fora da
paleta e uma abertura que parecia quebrada.

**Leitura:** o teste automático mede se funciona (sem erro, sem rolagem horizontal, movimento
reduzido); não mede gosto. O modelo menor entrega código que passa no teste e erra a identidade.
Construção com gosto fica no topo.

## Teste 2: os três críticos do passo 6

Os três papéis rodados nos dois modelos sobre o mesmo pacote de imagens do piloto.

| Papel | Menor | Topo | Concordaram? |
|---|---|---|---|
| Briefing | REPROVA — "o filme não pousa no painel real" | REPROVA — "o filme não termina no painel real" | **sim**, mesma maior diferença |
| Sistema | REPROVA — título final apagado, vermelho fora da paleta, chave cobrindo conteúdo | REPROVA — mesmos itens + rótulos mono fora de caixa alta | **sim** (topo achou 1 item a mais) |
| Ofício (A/B às cegas) | venceu o original | venceu o original | **sim** |
| Tempo / tokens | 17–38 s / 88–109 mil | 20–37 s / 87–105 mil | — |

Os dois também acharam os defeitos reais que eu não tinha visto: a lista do News vazia (um script
tinha sido truncado na cópia) e um vazio preto no pacote de capturas (flag de GPU no capturador).

**2ª rodada (depois das correções, só modelo menor):** briefing e sistema ainda REPROVAM (letras deformadas no painel gerado pela IA; bloco amarelo e botões salmão herdados do site original); ofício ainda prefere o original porque o pacote de capturas mostra faixas pretas enquanto os quadros do filme carregam pela rede.

**Leitura:** julgar imagens contra um briefing ou um sistema escrito é tarefa fechada; o modelo
menor faz igual, em menos de um minuto, por menos custo por token. O topo achou um detalhe a mais
no crítico de sistema.

## A tabela que a skill segue

| Trabalho | Quem | Por quê |
|---|---|---|
| Leitura das referências, `barra.md`, conceito, direção de arte, `sistema.md` | topo | é gosto |
| Roteiro do filme (keyframes, prompts de clipe, vetor) | topo | erro aqui custa crédito |
| Construir a página e as peças de movimento | topo | medido: menor 2/5 contra topo 8/10 |
| Texto visível | topo, depois `portao-texto.js` | voz e precisão |
| Parceiro que ataca o conceito | menor serve | crítica fechada a partir de texto |
| Críticos de briefing, sistema e ofício | **menor** (topo na rodada final) | medido: mesmos vereditos e mesma maior diferença |
| Ajustes mecânicos pedidos por um crítico (trocar cor, mover elemento, corrigir caminho) | menor serve | tarefa fechada com critério claro |
| ffmpeg, SSIM, cortes, fixação, montagem, capturas, ledger | scripts, sem modelo | custo zero, determinístico |
| Verificar de verdade (olhar as fotos antes de dizer pronto) | topo | é o último portão |

Regra prática: **o modelo menor julga e conserta; o topo cria.** Na rodada final, um crítico no
topo confirma antes de publicar.

## Como repetir a medição

1. Mesmo brief para os dois modelos (para peças: `tools/BRIEF-PECA.md` do motion lab).
2. Teste automático (`testar-pecas.cjs`) para função.
3. Capturas embaralhadas com nomes neutros e um crítico que não sabe a origem.
4. Para críticos: mesmo pacote (`pacote-criticos.sh`), formato de resposta fixo (VEREDITO / MAIOR DIFERENÇA / PROBLEMAS).
