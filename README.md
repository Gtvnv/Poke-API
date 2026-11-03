<div align="center">

# 🔴 Pokédex JS

### Uma Pokédex da primeira geração feita com JavaScript puro

Explore os 151 Pokémon de Kanto: busque, filtre, favorite e monte seu time.

<br>

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![PokeAPI](https://img.shields.io/badge/PokeAPI-EF5350?style=for-the-badge&logo=pokemon&logoColor=white)

![Sem frameworks](https://img.shields.io/badge/frameworks-nenhum-success?style=flat-square)
![Sem build step](https://img.shields.io/badge/build_step-nenhum-success?style=flat-square)
![Licença](https://img.shields.io/badge/licença-MIT-blue?style=flat-square)

</div>

---

Uma Pokédex da primeira geração (Kanto, 151 Pokémon) construída com **HTML, CSS e
JavaScript puro** (ES Modules), consumindo a [PokeAPI](https://pokeapi.co/).
Sem frameworks, sem build step — o objetivo é explorar bem os fundamentos:
camadas, estado, consumo de API, persistência e UX.

## 📑 Índice

- [✨ Destaques](#-destaques)
- [🚀 Demonstração rápida](#-demonstração-rápida)
- [🎮 Funcionalidades](#-funcionalidades)
- [💻 Como rodar](#-como-rodar)
- [🏗️ Arquitetura](#️-arquitetura)
- [🔄 Como os dados fluem](#-como-os-dados-fluem)
- [🧭 Decisões de projeto](#-decisões-de-projeto)
- [🛣️ Roadmap](#️-roadmap)
- [🙌 Créditos](#-créditos)

## ✨ Destaques

- 🧩 **Zero dependências** — só HTML, CSS e JavaScript (ES Modules).
- 🗂️ **Arquitetura em camadas** — config, modelo, API, storage e UI bem separados.
- 💾 **Persistência local** — favoritos, time e tema salvos entre sessões.
- ⚡ **Cache de API** — evita refetch dos Pokémon já carregados.
- ♿ **Acessível** — navegação por teclado e foco gerenciado no modal.
- 🔒 **Seguro** — dados externos escapados antes de ir ao DOM (anti-XSS).

## 🚀 Demonstração rápida

1. A Pokédex abre já carregando os primeiros Pokémon.
2. Busque por nome (`pikachu`) ou número (`25`).
3. Filtre por tipo no seletor.
4. Clique em um card para abrir o modal com os status base.
5. Favorite (★) e monte seu time (máx. 6) — tudo fica salvo no navegador.
6. Alterne entre tema claro 🌙 e escuro ☀️ no botão do cabeçalho.

## 🎮 Funcionalidades

| Funcionalidade        | Descrição                                                        |
| --------------------- | ---------------------------------------------------------------- |
| 📜 Listagem paginada  | Carrega em blocos com o botão "Carregar mais".                   |
| 🔎 Busca              | Por nome ou número, filtrando o que já foi carregado.            |
| 🏷️ Filtro por tipo    | Fogo, água, planta, etc.                                         |
| 📊 Modal de detalhes  | Status base (HP, ataque, defesa...), altura, peso e habilidades. |
| ⭐ Favoritos          | Marcar/desmarcar e filtrar só os favoritos. Persistido.          |
| 🛡️ Montar time        | Regra clássica de no máximo 6 Pokémon, com aviso ao estourar.    |
| 💾 Cache local        | Pokémon já buscados ficam em cache para reduzir chamadas à API.  |
| 🌗 Tema claro/escuro  | Preferência salva entre sessões.                                 |
| 🔄 Estados de UI      | Skeletons no carregamento, "nada encontrado" e erro com retry.   |

## 💻 Como rodar

O projeto usa ES Modules (`import`/`export`), então precisa ser servido por um
servidor HTTP. Abrir o `index.html` direto pelo `file://` **não funciona**, por
causa da política CORS aplicada a módulos.

```bash
# Com Node (sem instalar nada global)
npx serve .

# Ou com Python 3
python -m http.server 8080
```

Depois acesse o endereço indicado no terminal (ex.: `http://localhost:8080`).

## 🏗️ Arquitetura

O código é dividido em camadas com responsabilidades bem separadas. A regra é:
o `main.js` orquestra a UI, mas não conhece detalhes de API nem de armazenamento —
ele conversa com essas camadas através de interfaces simples.

```
assets/
  css/
    global.css        # variáveis de tema (claro/escuro) e layout base
    pokedex.css       # componentes visuais: cards, modal, toolbar, skeleton
  js/
    config.js         # constantes: URL da API, limites, labels de tipos/stats
    pokemon-model.js  # modelo de domínio (classe Pokemon + getters de exibição)
    poke-api.js       # acesso à PokeAPI + conversão para o modelo + cache
    storage.js        # persistência em localStorage (favoritos, time, cache, tema)
    dom.js            # utilitários de DOM: escape anti-XSS e foco (modal)
    main.js           # orquestração: render, eventos e estado da aplicação
index.html
```

Responsabilidade de cada módulo:

- **config.js** — fonte única de verdade para constantes. Mudar `MAX_POKEMON` aqui
  amplia a Pokédex sem tocar em mais nada.
- **pokemon-model.js** — isola o formato interno do app do formato cru da API.
  Expõe `displayName` e `formattedNumber` para a UI não repetir formatação.
- **poke-api.js** — a única camada que sabe o formato de resposta da PokeAPI.
  Converte o payload para `Pokemon` e consulta o cache antes de ir à rede.
- **storage.js** — encapsula o `localStorage` com um wrapper seguro (degrada sem
  quebrar se o armazenamento falhar). A regra do time de 6 vive aqui.
- **dom.js** — utilitários transversais: `escapeHtml` (segurança) e seleção de
  elementos focáveis (acessibilidade do modal).
- **main.js** — monta o HTML dos cards/modal, trata eventos (com delegação) e
  mantém o estado da sessão (filtros, lista carregada).

## 🔄 Como os dados fluem

```
  usuário clica "Carregar mais"
        │
        ▼
  main.js  ──►  poke-api.js  ──►  cache (storage.js)? ──► sim ──► devolve do cache
        │             │                     │
        │             │                     └── não ──► fetch na PokeAPI
        │             │                                      │
        │             ◄──────── Pokemon (modelo) ◄───────────┘
        ▼
  render() desenha os cards
```

Favoritos, time e tema seguem o mesmo princípio: a UI chama `storage.js`, que lê e
escreve no `localStorage`, e então a tela é redesenhada a partir do estado.

## 🧭 Decisões de projeto

- **JS puro, sem framework.** O foco é entender o que um framework normalmente
  esconde: manipulação de DOM, estado e eventos na mão.
- **ES Modules.** Preferidos a scripts globais para deixar as dependências
  explícitas e evitar variáveis globais vazando entre arquivos.
- **Primeira geração (151).** Escopo enxuto e nostálgico; ampliável via config.
- **Cache em localStorage.** Reduz chamadas repetidas à API e deixa a navegação
  mais rápida entre sessões.

## 🛣️ Roadmap

Pontos mapeados para evoluir o projeto, em ordem aproximada de valor. Servem
também como roteiro de estudo:

**Qualidade e segurança**
- [x] **Escapar dados em `innerHTML`.** Todo dado dinâmico passa por `escapeHtml`
  (em `assets/js/dom.js`) antes de ir para o HTML, evitando XSS.
- [ ] **Versionar o cache.** Incluir um `cacheVersion`; se o formato do `Pokemon`
  mudar, o cache antigo é invalidado em vez de quebrar silenciosamente.

**UX e acessibilidade**
- [x] **Gerenciar foco no modal.** O foco vai para o botão de fechar ao abrir,
  fica preso dentro do modal (focus trap) e volta ao card ao fechar. Os cards
  são focáveis e abrem por Enter/Espaço.
- [x] **Debounce na busca.** A busca espera 250ms após a digitação antes de
  filtrar, evitando re-render a cada tecla.
- [x] **Aviso de "fim da lista".** Mensagem exibida quando os 151 são carregados.
- [x] **Atualização granular do card.** Favoritar/adicionar ao time atualiza só o
  card afetado, não a lista inteira.

**Arquitetura**
- [x] **Detalhe do modal sob demanda.** O modal chama `getPokemonDetail` ao abrir,
  com estado de loading, reaproveitando o cache quando o detalhe já existe.
- [ ] **Aba dedicada ao time.** Tela para visualizar/remover membros do time.
- [ ] **Fraquezas e resistências.** Calcular vantagens de tipo no modal.

**Robustez**
- [ ] **Testes.** Extrair a lógica pura (regra do time, filtros) e cobrir com
  testes unitários.

## 🙌 Créditos

- Dados e sprites: [PokeAPI](https://pokeapi.co/).
- Pokémon é uma marca registrada da Nintendo/Game Freak. Projeto sem fins
  lucrativos, feito para fins de estudo.

---

<div align="center">

Feito com 💛 por [Gtvnv](https://github.com/Gtvnv)

</div>
