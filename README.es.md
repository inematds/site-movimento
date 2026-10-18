# 🎬 Sitio en Movimiento

**🇧🇷 [Português](README.md) · 🇺🇸 [English](README.en.md) · 🇪🇸 [Español](README.es.md)**

[![Sitio en Movimiento](guia/assets/banner-es.jpg)](https://inematds.github.io/site-movimento/guia/es/)

## Qué es

Sitio en Movimiento es una skill para Claude Code (y Codex) que arma un sitio cuya cabecera es un video continuo: la cámara avanza a medida que la persona desplaza la página. El video lo genera la IA en clips cortos encadenados, y los scripts comprueban que no haya saltos entre ellos. Debajo de la película, cada sección recibe una animación hecha en código que explica lo que dice. Sirve para quien quiere una página de apertura con aspecto de película. Necesitas Claude Code y, si quieres video de verdad, un generador de video (Kling, Agnes, Kie u otro); sin generador, arma todo en código.

> No confundir con **filmarca**, que hace el camino inverso (transforma un sitio existente en una película de marca).

## 📖 Guía de uso

Guía completa (landing + paso a paso): **https://inematds.github.io/site-movimento/guia/es/**

Piloto en línea (copia de prueba de la home de eventos.inema.pro con película en la apertura): **https://inematds.github.io/site-movimento/piloto/eventos/**

## Instalar

```bash
git clone https://github.com/inematds/site-movimento ~/projetos/site-movimento
ln -s ~/projetos/site-movimento/skill/site-movimento ~/.claude/skills/site-movimento
bash ~/.claude/skills/site-movimento/tests/motores-contrato.sh     # 4/4 motores OK
```

Después, en Claude Code: `/site-movimento` con tus referencias adjuntas.

## Qué hay aquí

| Carpeta | Qué es |
|---|---|
| `skill/site-movimento/SKILL.md` | los siete pasos y las compuertas |
| `skill/site-movimento/referencias/` | referencias, motores, página, capa de movimiento, críticos, texto y delegación (medida) |
| `skill/site-movimento/motores/` | `kling.sh`, `agnes.sh`, `kie.sh`, `custom.sh` (mismo contrato) e `imagem_local.py` |
| `skill/site-movimento/scripts/` | keyframes por aproximación, hoja, vector, película, loop, fijación, cortes, montaje, suavizado, continuidad, capturas, críticos, verificación y compuerta de texto |
| `skill/site-movimento/runtime/` | `motor-rolagem.js` (canvas + cuadros) y `chave-movimento.js` (Detenido / Activo / Rayos X) |
| `piloto/eventos/` | el piloto publicado y, en `trabalho/`, los keyframes, guion, ledger y scripts que lo armaron |
| `guia/` | esta guía en PT, EN y ES |

## Motores de video

| Motor | Autenticación | Fija inicio y fin | Medido |
|---|---|---|---|
| `kling` | CLI `kling` por suscripción | sí | 30 créditos por clip de 5 s en 720p |
| `agnes` | `AGNES_API_KEY` | sí | 1 clip: extremos 0,91, 80 s; el medio se vuelve metamorfosis |
| `kie` | `KIE_API_KEY` | depende del modelo | construido y probado en el contrato |
| `custom` | `MOTOR_CMD` (cualquier IA) | depende | - |
| código | ninguna | - | costo cero |

## Números del piloto

- Kling 720p: 300 créditos en total. 150 en la 1ª versión (3 clips + loop, uno rehecho), 60 para quitar las letras del panel (30 perdidos) y 90 en la película vertical del celular (3 clips 9:16).
- Película horizontal con 285 cuadros; vertical (celular en vertical) con 361, en `frames-v/`.
- Fijación de los cuadros entre 0,91 y 0,997; cero cortes escondidos; continuidad PASSA en las dos películas.
- Tirón máximo de 33 a 36 ms en el scroll (era de 150 a 315 ms antes de corregir la ventana de bitmaps).

## Delegación medida

Construir piezas con gusto quedó con el modelo más fuerte (8 de 10 aprobadas a ciegas contra 2 de 5 del
modelo menor). Los tres críticos dieron los mismos veredictos en los dos modelos. Detalles en
[`skill/site-movimento/referencias/7-delegacao.md`](skill/site-movimento/referencias/7-delegacao.md) (en portugués).

## Ver también

- [Shaders](https://inematds.github.io/shaders/guia/es/) — más de 200 efectos WebGPU gratis (MIT) como componentes para el fondo de las secciones del sitio.

---

Abierto y gratuito · [INEMA.CLUB](https://inema.club)
