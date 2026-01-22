# MixBlueprint Pro (v2) — Mobile-first • Vanilla • DLC-ready

Este projeto é um **assistente interativo de mix e masterização** (web app/PWA), focado em **decisão profissional**:
o usuário escolhe **gênero → instrumento → nível**, responde **decisões (vibe, voz, arranjo, etc.)** e a **cadeia muda em tempo real**.

## ✅ Stack
- HTML + CSS + JavaScript (vanilla)
- SPA por hash routing (compatível com GitHub Pages)
- Conteúdo modular via **registry + manifests + JSON**
- Admin local para gerenciar pacotes/DLCs

## Rodar localmente
> Use servidor local (ES Modules não funcionam bem via `file://`).

### Python
```bash
python -m http.server 8080
```

Abra:
- App: `http://localhost:8080/`
- Admin: `http://localhost:8080/admin.html`

### Node
```bash
npx serve .
```

## PWA / Offline
O app registra Service Worker (`sw.js`) e faz cache do “shell” + conteúdo (quando possível).

## Estrutura de conteúdo (Core + DLC)
- `content/registry.json` → lista pacotes
- Cada pacote tem `manifest.json` com arquivos JSON.
- `content/core/...` → conteúdo base
- `content/dlc/...` → DLCs no repositório
- DLCs **locais** podem ser instaladas via Admin (localStorage), sem alterar o core.

### Tipos de dados
- `genres.json` → lista de gêneros + cores
- `instruments.json` → instrumentos/buses
- `blueprints.json` → cadeias interativas (mix)
- `masters.json` → modos de master

## Blueprints interativos (modelo)
Cada blueprint pode ter:
- `decisions`: segmented (botões) e slider
- `baseChain`: passos principais
- `rules`: aplicam patch na cadeia conforme decisões

Exemplo de regra:
```json
{
  "when": {"vibe":"aggressive"},
  "patch": [
    {"op":"insertAfter","afterStepId":"comp_main","step": {"id":"clipper","name":"Clipper","type":"dynamics","why":"..."}}
  ],
  "meterBias": {"gr": 2, "dyn": -10}
}
```

## Admin (local)
Abra `admin.html`.

### Login
- Senha padrão: `admin`
- Troque em “Segurança (local)”

> Observação: este login é **modo local** (não é segurança real). A arquitetura está pronta para substituir por backend.

### Funções
- Ativar/desativar pacotes (core/DLC)
- Instalar DLC via “bundle JSON”
- Remover DLC local
- Exportar/restaurar backups do estado local (favoritos, DLCs etc.)

## Deploy no GitHub Pages
1. Suba o repositório com estes arquivos.
2. GitHub → Settings → Pages:
   - Source: `Deploy from a branch`
   - Branch: `main` / folder: `/ (root)`
3. Acesse a URL gerada.

Como é hash routing, não precisa configurar redirects.

## Próximos passos AAA (já preparados)
- Paywall real (Stripe/Checkout) plugável
- Packs premium por gênero/engenheiro
- Sistema de progresso e perfil (além de favoritos)
- “Master Pro” com comparadores e validações avançadas

---
Criado para evolução em DLCs sem alterar o core.


## v3 — Comercial (DLC)
- Paywall lógico por DLC
- Progresso do usuário (local)
- Master Pro marcado como Premium


## v4 — Diferencial de Mercado
- Tela de Upgrade comercial
- Checklists profissionais por blueprint
- Base pronta para DLCs premium reais
