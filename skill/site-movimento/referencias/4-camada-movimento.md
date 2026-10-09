# Passo 5: a camada de movimento

## 1. Um gráfico animado por seção

Toda seção precisa de um gráfico que **explica** o que ela diz. Seção só com texto e imagem parada reprova.

| A seção diz | Um gráfico que prova |
|---|---|
| "É rápido" | uma corrida em eixo comum que anda com a rolagem; a diferença é o maior número da tela |
| "Três passos" | um objeto que muda de estado três vezes enquanto os passos passam |
| "Conecta com as suas ferramentas" | logos reais fluindo para um nó por caminhos desenhados, um por vez |
| "Seus dados ficam com você" | um documento que dobra num cartão lacrado; o cadeado fecha nos últimos 10% |
| Preços | o cartão do plano se monta linha a linha; o recomendado sobe por último |
| Números | contadores que rodam uma vez, cada um sobre um gráfico que se desenha |

Tipos:
- **Conduzido pela rolagem** (progresso 0→1 vira estado): para sequências.
- **Em loop** (código ou vídeo gerado): para objetos que vivem na seção.
- **Os dois:** um loop cuja velocidade, escala ou cor segue a rolagem.

Regras: poucas coisas se mexendo ao mesmo tempo, cada uma com sentido (se duas se mexem, uma lidera);
um único `requestAnimationFrame` (registre no `MotionEngine.Loop`); só `transform`/`opacity`.

## 2. Catálogo pronto: INEMA Motion Lab

Antes de inventar, procure aqui. Cada peça é um `index.html` autocontido com `PROMPT.md` (o prompt
que a refaz), modo `?demo=1`, movimento reduzido e `data-xray` em tudo que se mexe.
Repositório: `~/projetos/inema-motion-lab/pecas/` · página: https://inematds.github.io/inema-motion-lab/guia/

| Peça | Serve para |
|---|---|
| `busca-cmdk` | busca ⌘K / paleta de comandos |
| `bento-glide` | grade bento com moldura que desliza até o bloco ativo |
| `404-corre` | página 404 jogável |
| `dia-noite` | alternador de tema que é uma cena |
| `rodape-inema` | rodapé com letras que caem com física |
| `menu-morfo` | menu que se transforma ao abrir |
| `adesivo-holo` | adesivo holográfico que reage ao cursor |
| `rodape-cortina` | rodapé que se revela como cortina |
| `cursor-amigo` | mascote que segue o cursor |
| `nav-pulo` | navegação com um marcador que salta entre itens |
| `rodape-flor` | rodapé que floresce |
| `revela-carga` | carregamento que vira a revelação da página |
| `rodape-quebra` | rodapé com mini-jogo de quebrar blocos |
| `rodape-mapa` | rodapé com mapa estilizado |
| `galeria-giro` | galeria giratória |
| `dock-liquido` | barra de ícones com efeito líquido |
| `menu-tela-cheia` | menu que toma a tela |
| `botoes-geleia` | botões com física de geleia |
| `faixa-flap` | faixa de letreiro de placas que viram |
| `rastro-imagens` | rastro de imagens que segue o cursor |

Para usar: copie o HTML/CSS/JS da peça para a seção, troque o conteúdo pelo do site e ajuste as
cores ao `sistema.md`. Mantenha os `data-xray`.

## 3. A chave Parado / Ligado / Raio-X

`vendor/chave-movimento.js` (API `window.Movimento`, compatível com `window.Motion`).
- **Parado** é um site calmo e digno: animações CSS pausam, loops mostram um quadro, o filme fica
  no quadro atual. Movimento reduzido começa aqui.
- **Ligado** é o site completo.
- **Raio-X** desenha caixa tracejada e etiqueta em todo elemento com `data-xray`: âmbar para vídeo
  gerado por IA (com motor e créditos), azul para código. Um resumo no canto soma os dois.

Marcação:
```html
<canvas data-xray="filme do topo · 3 clipes encadeados" data-xray-tool="kling" data-xray-cost="90"
        data-xray-prompt="slow dolly forward toward the glowing terminal..."></canvas>
<svg data-xray="trilha dos três passos · desenha com a rolagem" data-xray-tool="code"></svg>
```

## 4. Mascote (opcional)

Só se o assunto pedir, e precisa parecer intencional.
- **Poleiros:** 5 a 8 pontos pela página (um título, a borda de um cartão, o rodapé).
- **Pula, não flutua:** quando o poleiro ativo muda, salta em arco (antecipa, sobe, aterrissa amassando).
- **Brinca com o cursor:** persegue o ponteiro numa mola; parado, respira e olha para o cursor.
- **Final:** no rodapé aterrissa com um amassado grande, um quique e uma pequena explosão.
- **Parado:** fica imóvel no poleiro ativo. Escondido até o primeiro movimento real do mouse.
Base pronta: peça `cursor-amigo`.

## 5. Vídeo gerado ou código?

| Vídeo gerado | Código |
|---|---|
| Mundos fotográficos ou 3D, materiais, luz | Tudo com texto, número, interface ou dado |
| O filme do topo, objetos 3D girando, produto | Gráficos, corridas, fluxos, contadores, diagramas |
| Loops de coisa física (tecido, ave, disco) | Tudo que precisa reagir com precisão à rolagem ou ao cursor |
