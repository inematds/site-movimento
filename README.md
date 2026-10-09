# 🎬 Site em Movimento

**🇧🇷 [Português](README.md) · 🇺🇸 [English](README.en.md) · 🇪🇸 [Español](README.es.md)**

[![Site em Movimento](guia/assets/banner.jpg)](https://inematds.github.io/site-movimento/guia/)

## O que é

Site em Movimento é uma skill para o Claude Code (e o Codex) que monta um site cujo topo é um vídeo contínuo: a câmera avança conforme a pessoa rola a página. O vídeo é gerado por IA em clipes curtos encadeados, e scripts conferem que não há pulos entre eles. Abaixo do filme, cada seção ganha uma animação feita em código que explica o que ela diz. Serve para quem quer uma página de abertura com cara de filme. Você precisa do Claude Code e, se quiser vídeo de verdade, de um gerador de vídeo (Kling, Agnes, Kie ou outro); sem gerador, ela monta tudo em código.

> Não confundir com o **filmarca**, que faz o caminho inverso (transforma um site existente num filme de marca).

## 📖 Guia de uso

Guia completo (landing + passo a passo): **https://inematds.github.io/site-movimento/guia/**

Piloto no ar (cópia de teste da home do eventos.inema.pro com filme na abertura): **https://inematds.github.io/site-movimento/piloto/eventos/**

## Instalar

```bash
git clone https://github.com/inematds/site-movimento ~/projetos/site-movimento
ln -s ~/projetos/site-movimento/skill/site-movimento ~/.claude/skills/site-movimento
bash ~/.claude/skills/site-movimento/tests/motores-contrato.sh     # 4/4 motores OK
```

Depois, no Claude Code: `/site-movimento` com as suas referências anexadas.

## O que tem aqui

| Pasta | O que é |
|---|---|
| `skill/site-movimento/SKILL.md` | os sete passos e os portões |
| `skill/site-movimento/referencias/` | referências, motores, página, camada de movimento, críticos, texto e delegação (medida) |
| `skill/site-movimento/motores/` | `kling.sh`, `agnes.sh`, `kie.sh`, `custom.sh` (mesmo contrato) e `imagem_local.py` |
| `skill/site-movimento/scripts/` | keyframes por aproximação, folha, vetor, filme, loop, fixação, cortes, montagem, suavização, continuidade, capturas, críticos, verificação e portão de texto |
| `skill/site-movimento/runtime/` | `motor-rolagem.js` (canvas + quadros) e `chave-movimento.js` (Parado / Ligado / Raio-X) |
| `piloto/eventos/` | o piloto publicado e, em `trabalho/`, os keyframes, roteiro, ledger e scripts que o montaram |
| `guia/` | este guia em PT, EN e ES |

## Motores de vídeo

| Motor | Autenticação | Fixa início e fim | Medido |
|---|---|---|---|
| `kling` | CLI `kling` pela assinatura | sim | 30 créditos por clipe de 5 s em 720p |
| `agnes` | `AGNES_API_KEY` | sim | 1 clipe: pontas 0,91, 80 s; o meio vira metamorfose |
| `kie` | `KIE_API_KEY` | depende do modelo | construído e testado no contrato |
| `custom` | `MOTOR_CMD` (qualquer IA) | depende | — |
| código | nenhum | — | zero custo |

## Números do piloto

- Kling 720p: 300 créditos no total. 150 na 1ª versão (3 clipes + loop, um refeito), 60 para tirar as letras do painel (30 perdidos) e 90 no filme vertical do celular (3 clipes 9:16).
- Filme horizontal com 285 quadros; vertical (celular em pé) com 361, em `frames-v/`.
- Fixação dos quadros entre 0,91 e 0,997; zero cortes escondidos; continuidade PASSA nos dois filmes.
- Travada máxima de 33 a 36 ms na rolagem (era 150 a 315 ms antes de corrigir a janela de bitmaps).

## Delegação medida

Construir peças com gosto ficou com o modelo mais forte (8 de 10 aprovadas às cegas contra 2 de 5 do
modelo menor). Os três críticos deram os mesmos vereditos nos dois modelos. Detalhes em
[`skill/site-movimento/referencias/7-delegacao.md`](skill/site-movimento/referencias/7-delegacao.md).

---

Aberto e gratuito · [INEMA.CLUB](https://inema.club)
