#!/usr/bin/env node
// Portão de texto: confere o que a pessoa LÊ na página. Sem modelo, sem rede, sem custo.
//
// Reprova:
//  - a página explicando a si mesma ("role para baixo", "esta página mostra...") em vez de vender;
//  - vocabulário de filmagem no texto (câmera, zoom, travelling, plano-sequência): o roteiro do filme
//    é instrução de produção, não texto para o visitante;
//  - travessão (— ou –) e jargão de IA ("revolucionário", "potencializar", "próximo nível"...);
//  - texto provisório (lorem ipsum, TODO, "seu título aqui");
//  - quadro do filme repetido como <img> logo abaixo (mostra a mesma imagem duas vezes e mata o final).
// Vale para PT, EN e ES.
//
//   node portao-texto.js <index.html> [outro.html ...]      → saída 0 = limpo, 1 = defeitos
const fs = require('node:fs');

const REGRAS = [
  // a página narrando a si mesma
  [/\b(role|continue\s+rolando|desça|siga\s+rolando)\s+(para\s+baixo|a\s+página|e\s+veja)?/i, 'manda a pessoa rolar'],
  [/\b(keep|continue)\s+scrolling\b|\bscroll\s+(down|on|to\s+(begin|start|explore))\b|\bas\s+you\s+scroll\b/i, 'manda a pessoa rolar (EN)'],
  [/\b(desplázate|sigue\s+desplazando|baja\s+para\s+ver)\b/i, 'manda a pessoa rolar (ES)'],
  [/\b(esta|essa)\s+(página|site)\s+(é|foi|mostra|explica|conta)\b|\bthis\s+(page|site)\s+(is|shows|explains)\b|\besta\s+página\s+(es|muestra|explica)\b/i, 'a página fala de si mesma'],
  [/\bcomo\s+ler\s+esta\s+página\b|\bhow\s+to\s+read\s+this\s+page\b/i, 'ensina a ler a página'],
  // filmagem no texto do visitante
  [/\b(câmera|camera|cámara)\s+(avança|recua|entra|sai|desce|sobe|pushes|pulls|moves|avanza|retrocede)/i, 'narra a câmera'],
  [/\b(travelling|dolly|zoom[-\s]?in|zoom[-\s]?out|plano[-\s]sequência|one\s+continuous\s+shot|tracking\s+shot|plano\s+secuencia)\b/i, 'vocabulário de filmagem como texto'],
  // texto provisório
  [/lorem\s+ipsum/i, 'lorem ipsum'],
  [/\b(TODO|FIXME|TBD|XXX)\b/, 'marcador provisório'],
  [/\b(seu|your|tu)\s+(título|texto|headline|text|titular)\s+(aqui|here)\b/i, 'texto de modelo'],
  [/\[(nome|título|resultado|name|title)[^\]]*\]/i, 'colchete de modelo não preenchido'],
];

const JARGAO = /\b(revolucion\w+|incrível|incríveis|potencializ\w+|alavanc\w+|desbloque\w+|próximo\s+nível|sem\s+esforço|game[-\s]?chang\w+|unlock\w*|seamless\w*|supercharg\w+|leverag\w+|cutting[-\s]edge|next[-\s]level|elevat\w+|delve\w*|increíble\w*|potenciar|siguiente\s+nivel)\b/i;
const QUADRO_REPETIDO = /<img[^>]+src="[^"]*frames?\/f?_?\d{3,4}\.(jpg|jpeg|png|webp)"/i;

// Só o <body> é lido pela pessoa (título e metas do <head> ficam de fora).
const visivel = h => (h.match(/<body[\s\S]*<\/body>/i) || [h])[0]
  .replace(/<script[\s\S]*?<\/script>/gi, ' ')
  .replace(/<style[\s\S]*?<\/style>/gi, ' ')
  .replace(/<!--[\s\S]*?-->/g, ' ');

const arquivos = process.argv.slice(2);
if (!arquivos.length) { console.error('uso: node portao-texto.js <index.html> [outro.html ...]'); process.exit(2); }
let falhou = false;

for (const arq of arquivos) {
  let html;
  try { html = fs.readFileSync(arq, 'utf8'); } catch (e) { console.error(`✗ ${arq} — não li: ${e.message}`); falhou = true; continue; }
  const texto = visivel(html);
  const puro = texto.replace(/<[^>]+>/g, ' ');
  const achados = [];
  const trecho = i => puro.slice(Math.max(0, i - 40), i + 40).replace(/\s+/g, ' ').trim();

  const tr = /[—–]/.exec(puro);
  if (tr) achados.push(`  travessão no texto visível (use ponto, vírgula ou dois-pontos)\n    …${trecho(tr.index)}…`);
  const jg = JARGAO.exec(puro);
  if (jg) achados.push(`  jargão: "${jg[0]}" (diga a coisa simples)\n    …${trecho(jg.index)}…`);
  for (const [re, porque] of REGRAS) {
    const m = re.exec(puro);
    if (m) achados.push(`  ${porque}\n    …${trecho(m.index)}…`);
  }
  const rep = QUADRO_REPETIDO.exec(html);
  if (rep) achados.push(`  quadro do filme repetido como <img> abaixo do filme: ${rep[0].slice(0, 90)}`);

  if (achados.length) { falhou = true; console.error(`✗ ${arq} — ${achados.length} defeito(s)\n${achados.join('\n')}`); }
  else console.log(`✓ ${arq} — texto limpo`);
}
if (falhou) {
  console.error('\nREPROVADO. Reescreva o texto para vender o assunto; não explique o mecanismo. Corrija o texto, nunca o portão.');
  process.exit(1);
}
