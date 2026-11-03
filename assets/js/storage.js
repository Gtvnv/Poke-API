import { STORAGE_KEYS, MAX_TEAM_SIZE } from './config.js';

// Wrapper seguro sobre localStorage: se falhar (modo privado, cota cheia),
// degrada em memória em vez de quebrar a aplicação.
function readJson(key, fallback) {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
    } catch {
        return fallback;
    }
}

function writeJson(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Ignora falhas de escrita silenciosamente (ex.: cota excedida).
    }
}

// ----- Favoritos -----
export const favorites = {
    getAll() {
        return readJson(STORAGE_KEYS.favorites, []);
    },

    has(number) {
        return this.getAll().includes(number);
    },

    toggle(number) {
        const current = this.getAll();
        const next = current.includes(number)
            ? current.filter((n) => n !== number)
            : [...current, number];
        writeJson(STORAGE_KEYS.favorites, next);
        return next.includes(number);
    },
};

// ----- Time (máx. 6) -----
export const team = {
    getAll() {
        return readJson(STORAGE_KEYS.team, []);
    },

    has(number) {
        return this.getAll().includes(number);
    },

    isFull() {
        return this.getAll().length >= MAX_TEAM_SIZE;
    },

    // Retorna { ok, reason } para a UI tratar a regra de negócio do limite.
    toggle(number) {
        const current = this.getAll();

        if (current.includes(number)) {
            writeJson(STORAGE_KEYS.team, current.filter((n) => n !== number));
            return { ok: true, added: false };
        }

        if (current.length >= MAX_TEAM_SIZE) {
            return { ok: false, reason: 'full' };
        }

        writeJson(STORAGE_KEYS.team, [...current, number]);
        return { ok: true, added: true };
    },
};

// ----- Cache de Pokémon já buscados -----
export const cache = {
    _load() {
        return readJson(STORAGE_KEYS.pokemonCache, {});
    },

    get(number) {
        return this._load()[number] ?? null;
    },

    set(number, pokemon) {
        const all = this._load();
        all[number] = pokemon;
        writeJson(STORAGE_KEYS.pokemonCache, all);
    },
};

// ----- Tema -----
export const themeStore = {
    get() {
        return readJson(STORAGE_KEYS.theme, 'light');
    },

    set(value) {
        writeJson(STORAGE_KEYS.theme, value);
    },
};
