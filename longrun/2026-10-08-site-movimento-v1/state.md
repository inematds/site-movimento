# Estado — site-movimento-v1 (08/10/2026 ~21h30)

Feito e verificado:
- skill/site-movimento (SKILL + 7 referências + motores kling/agnes/kie/custom + scripts + runtime), validador 0 erros, links em ~/.claude/skills e ~/.agents/skills; scroll-film-studio ganhou 1 linha apontando.
- tests/sem-fonte.sh → 0 ocorrências; tests/motores-contrato.sh → 4/4.
- piloto/eventos publicado: cutscan 0, continuidade PASSA, jank máx 35 ms no Pages, 0 erros de console. Kling 150 créditos (5255,8 → 5105,8 = ledger).
- Repo público inematds/site-movimento c715bc1; guia PT/EN/ES 200; portal 9f39b0d + da6e0eb (EN/ES), inemabuscas 8d84763, mono 4cdc440.
- Motion lab: 20/20 no testar-pecas, 60 vídeos; 5 reprovadas pelo crítico cego corrigidas.
- referencias/7-delegacao.md com a medição (menor 2/5 × topo 8/10 em construção; críticos iguais).

- Motion lab publicado 3bbd0eb (guia/README PT/EN/ES com 20 peças, 200 no Pages); portal 4652f8f + f40e668, buscas a39229e, mono 462304b.

Em aberto (decisão do Nei):
- Agnes e Kie: só construídos (contrato 4/4; zero chamadas sem autorização de API).
- Filme 9:16 para celular (hoje cobre a tela com o 16:9 centrado).

## 2ª rodada de críticos (Haiku, piloto publicado) — ainda REPROVA
- briefing: painel gerado pelo Kling com letras deformadas; topo das capturas sem a pista.
- sistema: bloco amarelo do PRO e botões salmão (herdados do eventos original); corpo < 18 px.
- ofício: prefere o original, porque o pacote mostra faixas pretas enquanto os quadros carregam do Pages.
Próximo: refazer kf04 + clipe 3 pedindo painel SEM letras (~30 cr); pré-carregar o 1º trecho de quadros / pôster no canvas; decidir se o piloto herda as cores do eventos.
Teste reproduzível: tests/piloto-secoes.cjs (deu 1 erro 503 transitório do Pages na última rodada).

## 3ª etapa (08/10 ~23h, pedido do Nei: refazer painel, 1 clipe Agnes, filme do celular) — commit 54c1012
- Painel sem letras: as letras nasciam no kf03 (flux), não no clipe. Filme = c1 + c2[1..44] + c3c (c2.q44 → kf04). 285 quadros, continuidade PASSA. c3b (30 cr) perdido: partiu de quadro com letras.
- Filme vertical: kf-v/ (fatia 9:16 de cada kf, kf01v remendado à mão), clipes-v v1–v3 (90 cr), frames-v/ 361 quadros, continuidade PASSA; movimento.js escolhe frames-v no celular em pé.
- Agnes: 1 clipe (mesmas pontas/prompt do c3b): pontas 0,915/0,908, sem corte, 80 s, 1280x704; meio vira metamorfose. Motor corrigido (consulta /agnesapi, JPEG, retry) e chave fora do argv (agnes e kie).
- Faixas pretas: motor baixa 1 a cada 8 primeiro + pôster; publicado sem preto mesmo com 4–11% carregado.
- Kling total 300 (5255,8 → 4955,8 = ledger). Jank publicado máx 29,7 ms (desktop). Guia/README PT/EN/ES atualizados.
- Não rodado: 3ª rodada de críticos; jank no celular. Aberto: cores herdadas do eventos; Kie sem clipe (não autorizado).
