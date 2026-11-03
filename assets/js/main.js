import { pokeApi } from './poke-api.js';
import {
    MAX_POKEMON,
    PAGE_SIZE,
    MAX_TEAM_SIZE,
    POKEMON_TYPES,
    TYPE_LABELS,
    STAT_LABELS,
} from './config.js';
import { favorites, team, themeStore } from './storage.js';
import { escapeHtml, getFocusableElements } from './dom.js';

// ----- Referências do DOM -----
const pokemonList = document.getElementById('pokemonList');
const loadMoreButton = document.getElementById('loadMoreButton');
const searchInput = document.getElementById('searchInput');
const typeFilter = document.getElementById('typeFilter');
const favoritesToggle = document.getElementById('favoritesToggle');
const teamCounter = document.getElementById('teamCounter');
const themeToggle = document.getElementById('themeToggle');
const statusArea = document.getElementById('statusArea');

const modal = document.getElementById('detailModal');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');

// ----- Estado da aplicação -----
const state = {
    loaded: [],          // todos os Pokémon já carregados da API
    offset: 0,
    searchTerm: '',
    typeFilter: '',
    onlyFavorites: false,
    loading: false,
};

// Elemento que tinha o foco antes de abrir o modal (para devolver ao fechar).
let lastFocusedElement = null;

// ----- Renderização dos cards -----
function typesListHtml(types) {
    return types
        .map((type) => `<li class="type ${escapeHtml(type)}">${escapeHtml(TYPE_LABELS[type] ?? type)}</li>`)
        .join('');
}

function pokemonCardTemplate(pokemon) {
    const isFav = favorites.has(pokemon.number);
    const inTeam = team.has(pokemon.number);
    const name = escapeHtml(pokemon.displayName);

    return `
        <li class="pokemon ${escapeHtml(pokemon.type)}" data-number="${pokemon.number}"
            tabindex="0" role="button" aria-label="Ver detalhes de ${name}">
            <div class="card-top">
                <span class="number">${escapeHtml(pokemon.formattedNumber)}</span>
                <button class="icon-btn fav-btn ${isFav ? 'active' : ''}"
                        data-action="favorite" data-number="${pokemon.number}"
                        title="Favoritar" aria-label="Favoritar ${name}"
                        aria-pressed="${isFav}">
                    ${isFav ? '★' : '☆'}
                </button>
            </div>

            <span class="name">${name}</span>

            <div class="detail">
                <ol class="types">${typesListHtml(pokemon.types)}</ol>
                <img src="${escapeHtml(pokemon.photo)}" alt="${name}" loading="lazy">
            </div>

            <button class="team-btn ${inTeam ? 'active' : ''}"
                    data-action="team" data-number="${pokemon.number}"
                    aria-pressed="${inTeam}">
                ${inTeam ? 'No time' : 'Add ao time'}
            </button>
        </li>
    `;
}

// Aplica busca + filtro de tipo + favoritos sobre o que já foi carregado.
function getVisiblePokemons() {
    const term = state.searchTerm.trim().toLowerCase();

    return state.loaded.filter((pokemon) => {
        if (state.onlyFavorites && !favorites.has(pokemon.number)) return false;
        if (state.typeFilter && !pokemon.types.includes(state.typeFilter)) return false;

        if (term) {
            const matchesName = pokemon.name.toLowerCase().includes(term);
            const matchesNumber = String(pokemon.number) === term.replace('#', '');
            if (!matchesName && !matchesNumber) return false;
        }
        return true;
    });
}

function render() {
    const visible = getVisiblePokemons();

    if (visible.length === 0 && !state.loading) {
        pokemonList.innerHTML = '';
        statusArea.innerHTML = `<p class="empty">Nenhum Pokémon encontrado com esses filtros.</p>`;
    } else {
        statusArea.innerHTML = '';
        pokemonList.innerHTML = visible.map(pokemonCardTemplate).join('');
    }

    updateTeamCounter();
    updateLoadMoreVisibility();
}

// Atualiza apenas um card no DOM (evita redesenhar a lista inteira ao favoritar).
function refreshCard(number) {
    const pokemon = state.loaded.find((p) => p.number === number);
    const card = pokemonList.querySelector(`.pokemon[data-number="${number}"]`);
    if (!pokemon || !card) {
        render();
        return;
    }
    card.outerHTML = pokemonCardTemplate(pokemon);
}

function updateTeamCounter() {
    const count = team.getAll().length;
    teamCounter.textContent = `Time ${count}/${MAX_TEAM_SIZE}`;
    teamCounter.classList.toggle('full', count >= MAX_TEAM_SIZE);
}

function updateLoadMoreVisibility() {
    const allLoaded = state.loaded.length >= MAX_POKEMON;
    const hasActiveFilter = state.searchTerm || state.typeFilter || state.onlyFavorites;
    loadMoreButton.hidden = allLoaded || Boolean(hasActiveFilter);

    // Aviso de "fim da lista" quando tudo foi carregado e não há filtro ativo.
    if (allLoaded && !hasActiveFilter) {
        statusArea.innerHTML = `<p class="empty">Você já viu todos os ${MAX_POKEMON} Pokémon de Kanto.</p>`;
    }
}

// ----- Carregamento de dados -----
function showSkeletons(count) {
    const skeletons = Array.from({ length: count })
        .map(() => `<li class="pokemon skeleton"></li>`)
        .join('');
    pokemonList.innerHTML += skeletons;
}

async function loadMore() {
    if (state.loading) return;
    state.loading = true;

    const remaining = MAX_POKEMON - state.offset;
    const limit = Math.min(PAGE_SIZE, remaining);
    if (limit <= 0) {
        state.loading = false;
        return;
    }

    loadMoreButton.disabled = true;
    loadMoreButton.textContent = 'Carregando...';
    showSkeletons(limit);

    try {
        const pokemons = await pokeApi.getPokemons(state.offset, limit);
        state.loaded.push(...pokemons);
        state.offset += limit;
        statusArea.innerHTML = '';
    } catch (error) {
        statusArea.innerHTML = `
            <div class="error">
                <p>Não foi possível carregar os Pokémon. ${escapeHtml(error.message)}</p>
                <button id="retryButton" type="button">Tentar novamente</button>
            </div>`;
        document.getElementById('retryButton')?.addEventListener('click', loadMore);
    } finally {
        state.loading = false;
        loadMoreButton.disabled = false;
        loadMoreButton.textContent = 'Carregar mais';
        render();
    }
}

// ----- Modal de detalhes -----
function statBarTemplate(stat) {
    // Stats base vão tipicamente de 0 a ~255; normalizamos para 0-100%.
    const percent = Math.min(100, Math.round((stat.value / 200) * 100));
    return `
        <div class="stat-row">
            <span class="stat-name">${escapeHtml(STAT_LABELS[stat.name] ?? stat.name)}</span>
            <span class="stat-value">${stat.value}</span>
            <div class="stat-bar"><div class="stat-bar-fill" style="width:${percent}%"></div></div>
        </div>
    `;
}

function modalDetailHtml(pokemon) {
    const abilities = pokemon.abilities.map(escapeHtml).join(', ');
    return `
        <div class="modal-header ${escapeHtml(pokemon.type)}">
            <span class="number">${escapeHtml(pokemon.formattedNumber)}</span>
            <h2>${escapeHtml(pokemon.displayName)}</h2>
            <img src="${escapeHtml(pokemon.photo)}" alt="${escapeHtml(pokemon.displayName)}">
        </div>
        <div class="modal-content">
            <ol class="types">${typesListHtml(pokemon.types)}</ol>
            <div class="measures">
                <span>Altura: <strong>${pokemon.height} m</strong></span>
                <span>Peso: <strong>${pokemon.weight} kg</strong></span>
            </div>
            <div class="abilities">
                <strong>Habilidades:</strong> ${abilities}
            </div>
            <div class="stats">
                <strong>Status base</strong>
                ${pokemon.stats.map(statBarTemplate).join('')}
            </div>
        </div>
    `;
}

// Abre o modal buscando o detalhe sob demanda (com loading e cache).
async function openModal(number) {
    lastFocusedElement = document.activeElement;

    modalBody.innerHTML = `<p class="modal-loading">Carregando detalhes...</p>`;
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    modalClose.focus();

    try {
        const pokemon = await pokeApi.getPokemonDetail(number);

        // Guarda o detalhe no estado para reuso (ex.: reabrir o mesmo card).
        const index = state.loaded.findIndex((p) => p.number === number);
        if (index >= 0) state.loaded[index] = pokemon;

        if (modal.classList.contains('open')) {
            modalBody.innerHTML = modalDetailHtml(pokemon);
        }
    } catch (error) {
        modalBody.innerHTML = `
            <div class="error">
                <p>Não foi possível carregar os detalhes. ${escapeHtml(error.message)}</p>
            </div>`;
    } finally {
        modalClose.focus();
    }
}

function closeModal() {
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    modalBody.innerHTML = '';

    // Devolve o foco ao elemento que o tinha antes de abrir.
    if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
        lastFocusedElement.focus();
    }
    lastFocusedElement = null;
}

// Prende o foco dentro do modal enquanto ele está aberto (focus trap).
function trapFocus(event) {
    if (event.key !== 'Tab' || !modal.classList.contains('open')) return;

    const focusable = getFocusableElements(modal);
    if (focusable.length === 0) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
    }
}

// ----- Feedback temporário (toast) -----
let toastTimer;
function showToast(message) {
    clearTimeout(toastTimer);
    statusArea.innerHTML = `<p class="toast">${escapeHtml(message)}</p>`;
    toastTimer = setTimeout(() => { statusArea.innerHTML = ''; }, 2500);
}

// ----- Monta o filtro de tipos -----
function buildTypeFilter() {
    const options = ['<option value="">Todos os tipos</option>']
        .concat(POKEMON_TYPES.map((t) => `<option value="${escapeHtml(t)}">${escapeHtml(TYPE_LABELS[t])}</option>`));
    typeFilter.innerHTML = options.join('');
}

// ----- Tema claro/escuro -----
function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    themeToggle.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// ----- Debounce genérico -----
function debounce(fn, delay) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

// ----- Eventos -----
function handleListClick(event) {
    const actionBtn = event.target.closest('[data-action]');

    if (actionBtn) {
        const number = Number(actionBtn.dataset.number);

        if (actionBtn.dataset.action === 'favorite') {
            favorites.toggle(number);
            refreshCard(number);
            return;
        }

        if (actionBtn.dataset.action === 'team') {
            const result = team.toggle(number);
            if (!result.ok && result.reason === 'full') {
                showToast(`Seu time já está cheio (máx. ${MAX_TEAM_SIZE}).`);
            }
            refreshCard(number);
            updateTeamCounter();
            return;
        }
    }

    // Clique no card (fora dos botões) abre o modal.
    const card = event.target.closest('.pokemon');
    if (card && !card.classList.contains('skeleton')) {
        openModal(Number(card.dataset.number));
    }
}

// Abre o modal via teclado (Enter/Espaço) quando um card está focado.
function handleListKeydown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;

    const card = event.target.closest('.pokemon');
    // Só trata quando o foco está no próprio card, não num botão interno.
    if (card && card === event.target && !card.classList.contains('skeleton')) {
        event.preventDefault();
        openModal(Number(card.dataset.number));
    }
}

function bindEvents() {
    loadMoreButton.addEventListener('click', loadMore);
    pokemonList.addEventListener('click', handleListClick);
    pokemonList.addEventListener('keydown', handleListKeydown);

    searchInput.addEventListener('input', debounce((e) => {
        state.searchTerm = e.target.value;
        render();
    }, 250));

    typeFilter.addEventListener('change', (e) => {
        state.typeFilter = e.target.value;
        render();
    });

    favoritesToggle.addEventListener('click', () => {
        state.onlyFavorites = !state.onlyFavorites;
        favoritesToggle.classList.toggle('active', state.onlyFavorites);
        favoritesToggle.setAttribute('aria-pressed', String(state.onlyFavorites));
        render();
    });

    themeToggle.addEventListener('click', () => {
        const next = themeStore.get() === 'dark' ? 'light' : 'dark';
        themeStore.set(next);
        applyTheme(next);
    });

    modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('open')) closeModal();
        trapFocus(e);
    });
}

// ----- Inicialização -----
function init() {
    applyTheme(themeStore.get());
    buildTypeFilter();
    bindEvents();
    loadMore();
}

init();
