# Passo 6: construtor e três críticos

## Antes do primeiro construtor (um bloco)
- A barra está no disco: capturas em `refs/` e `barra.md`.
- Dá para renderizar o nosso: o site está servido (em background) e `pacote-criticos.sh` gera capturas.
- `sistema.md` existe.
- Diga o que funciona, o que falta e **qual crítico fica cego** se faltar algo. Nunca siga com um
  crítico que não enxerga.

## Peças
As menores partes que dá para julgar sozinhas, três ou quatro (cada peça a mais multiplica a rodada):
1. Topo e filme (primeiro ecrã, a rolagem, a passagem para o conteúdo)
2. As seções e seus gráficos animados
3. Faixa de ação e rodapé (e o pouso do mascote, se houver)
4. Celular (390×844), julgado como peça própria

## Por peça: um construtor, três críticos
**Construtor** (subagente): recebe `BRIEF.md`, `barra.md`, `sistema.md`, as capturas de referência
daquela peça, a lista de arquivos que existem e a maior diferença da rodada anterior. Não gasta
crédito de vídeo; se faltar um arquivo, faz uma alternativa digna e avisa.

**Críticos** (subagentes novos, que nunca veem o código nem o raciocínio do construtor):
- **Briefing:** recebe `BRIEF.md` e o pacote de imagens. Pergunta: esta peça faz o que o briefing
  pede (a promessa de cada seção, a ação, a viagem)? Ignore estética.
- **Sistema:** recebe `sistema.md` e o pacote. Pergunta: a imagem obedece ao sistema (cores, escala
  de tipo, espaço, raios, regras de movimento)? Liste toda violação visível.
- **Ofício:** recebe `barra.md`, as capturas de referência e as nossas, **sem rótulo e em ordem
  embaralhada** (A e B). Pergunta: qual é melhor, e qual a maior diferença entre o perdedor e o
  vencedor? O nosso só passa se vencer.

Escreva o briefing de cada crítico para ESTE site; não cole texto genérico.

Regras:
- Críticos são duros; elogio não serve.
- Críticos julgam o resultado, nunca o código (ler o código faz julgar a intenção).
- **Veredito binário** (PASSA ou REPROVA + a maior diferença). Nota sobe sozinha a cada rodada.
- Os três precisam passar. Qualquer REPROVA volta ao construtor com essa única diferença.
- Sem número fixo de rodadas: a saída é vencer, ou a pessoa parar.
- `progresso.md`: peça, vereditos, histórico das diferenças.
- **As notas da pessoa valem mais que os críticos.** Grave no `BRIEF.md` na hora.

## Pacote de imagens
```bash
bash $S/scripts/pacote-criticos.sh topo "http://127.0.0.1:<porta>/site/?motion=on"
```
Desktop e celular, página inteira em passos de rolagem, folhas de contato < 100 KB.

## Que modelo usa cada papel
Ver `7-delegacao.md` (medido).
