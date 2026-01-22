# MixBlueprint (vanilla) — Mobile‑first AAA

Um web‑app **mobile‑first** (PWA) feito em **HTML + CSS + JavaScript puro** para ajudar profissionais de áudio (iniciante → avançado) com:

- **Cadeias mínimas** por **gênero** e **instrumento** (vocal, drums, bass/808, guitarra, synth/keys, mix bus, master).
- **Medições reais** (ponto de partida): dBFS, LUFS, True Peak, GR etc.
- **Variações** por gênero e notas de workflow.
- **Arquitetura modular** pronta para **DLC/expansões** sem alterar o core.
- **Admin local** (modo estático) para gerenciar DLCs e instalar conteúdos extras via JSON.

> ⚠️ Observação: valores são guias. O áudio “certo” é o que funciona no contexto e com referências.

---

## Rodar localmente

Como o projeto usa **ES Modules**, você precisa de um servidor estático (não abre certo via `file://`).

### Opção 1 (Python)

```bash
python -m http.server 8080
```

Abra:

- App: `http://localhost:8080/`
- Admin: `http://localhost:8080/admin.html`

### Opção 2 (Node)

```bash
npx serve .
```

---

## Deploy no GitHub Pages

1. Suba o repositório para o GitHub.
2. Vá em **Settings → Pages**.
3. Em **Build and deployment**, selecione:
   - **Source**: Deploy from a branch
   - **Branch**: `main` (ou `master`)
   - **Folder**: `/root`
4. Salve.

O app é SPA com **hash‑routing**, então funciona bem no Pages.

---

## Admin (local)

- Acesse: `admin.html`
- Senha padrão: **admin**
- Troque em: **Segurança**

> **Importante**: isso **não é segurança real**. É um “login local” só para modo estático.  
> Se você quiser transformar em produto comercial com segurança, é só integrar backend (auth + storage).

---

## Estrutura de pastas (principal)

```
/
├─ index.html
├─ admin.html
├─ styles/
├─ src/
│  ├─ app.js
│  ├─ admin.js
│  ├─ router.js
│  ├─ content/
│  │  ├─ manager.js
│  │  └─ store.js
│  ├─ ui/
│  │  ├─ render.js
│  │  ├─ icons.js
│  │  └─ toast.js
│  ├─ utils/
│  │  ├─ dom.js
│  │  ├─ storage.js
│  │  └─ format.js
│  └─ pwa/
│     └─ register.js
├─ pwa/
│  ├─ manifest.webmanifest
│  └─ sw.js
└─ content/
   ├─ registry.json
   ├─ core/
   │  ├─ manifest.json
   │  └─ data/
   │     ├─ genres.json
   │     └─ chains.json
   └─ dlc/
      └─ lofi_pack/
         ├─ manifest.json
         └─ data/
            ├─ genres.json
            └─ chains.json
```

---

## Sistema de DLC / Expansões

### Como funciona

- `content/registry.json` lista pacotes disponíveis (core + DLCs embutidos).
- Cada pacote tem um `manifest.json` com `entrypoints` para arquivos JSON.
- O **core** define:
  - lista de instrumentos
  - cadeias base (`baseChains`)
  - guias por gênero (`genreGuides`)
- Um **DLC** pode:
  - adicionar gêneros novos
  - adicionar guias (`genreGuides`)
  - aplicar **patches** em cadeias via `patch.chainMods` (ex.: inserir um step extra)

### Exemplo (patch)

O DLC **Lo‑Fi & Chill Pack** adiciona o gênero `lofi` e aplica um patch:

- insere um step de **Vinyl/Noise** em `keys_synth (beginner)`
- adiciona um step de **Tape** na master (intermediate)

Veja em: `content/dlc/lofi_pack/data/chains.json`

---

## Formato de bundle para importar DLC no Admin

O Admin instala DLC local via um único JSON (bundle):

```json
{
  "bundleVersion": "1.0",
  "manifest": {
    "id": "dlc_meu_pack",
    "type": "dlc",
    "name": "Meu DLC",
    "version": "0.1.0",
    "description": "…"
  },
  "data": {
    "genres": [ ... ],
    "chains": {
      "schemaVersion": "1.0",
      "genreGuides": { ... },
      "patch": { "chainMods": [ ... ] }
    }
  }
}
```

---

## Nota sobre medições (prática)

O app mostra **pontos de partida** para:

- **dBFS** (picos / headroom)
- **LUFS** (short‑term / integrated)
- **True Peak (dBTP)**
- **Gain Reduction** em comp/de‑esser

Você deve adaptar ao material e às referências. Para decisões confiáveis:
- compare com referência usando **loudness match**
- cheque em mono e em volume baixo
- use automação antes de esmagar com dinâmica

---

## Próximos upgrades (fáceis de encaixar)

- Backend (login real + storage em DB)
- Conta por usuário + sync cloud
- Conteúdo com assets (imagens por gênero/instrumento)
- “Profiles” de mastering (Streaming / Club / Dynamic)
- Export de “session checklist” por DAW

---

## Licença

Você pode adicionar uma licença (MIT, Apache-2.0, proprietária) conforme seu objetivo comercial.


## Exemplo de bundle

Há um exemplo pronto em `examples/lofi_pack.bundle.json` (você pode importar no Admin).
