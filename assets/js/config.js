// Constantes de configuração centralizadas (sem números mágicos espalhados).
export const API_BASE_URL = 'https://pokeapi.co/api/v2';

// Primeira geração completa (Kanto).
export const MAX_POKEMON = 151;

// Quantos Pokémon carregar por página no "carregar mais".
export const PAGE_SIZE = 15;

// Tamanho máximo do time, regra clássica da franquia.
export const MAX_TEAM_SIZE = 6;

// Chaves usadas no localStorage.
export const STORAGE_KEYS = {
    favorites: 'pokedex:favorites',
    team: 'pokedex:team',
    pokemonCache: 'pokedex:pokemon-cache',
    theme: 'pokedex:theme',
};

// Todos os tipos conhecidos, usados para montar o filtro.
export const POKEMON_TYPES = [
    'normal', 'fire', 'water', 'electric', 'grass', 'ice',
    'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
    'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy',
];

// Tradução dos tipos para exibição em português.
export const TYPE_LABELS = {
    normal: 'Normal', fire: 'Fogo', water: 'Água', electric: 'Elétrico',
    grass: 'Planta', ice: 'Gelo', fighting: 'Lutador', poison: 'Venenoso',
    ground: 'Terrestre', flying: 'Voador', psychic: 'Psíquico', bug: 'Inseto',
    rock: 'Pedra', ghost: 'Fantasma', dragon: 'Dragão', dark: 'Sombrio',
    steel: 'Aço', fairy: 'Fada',
};

// Tradução dos nomes de stats para exibição.
export const STAT_LABELS = {
    hp: 'HP',
    attack: 'Ataque',
    defense: 'Defesa',
    'special-attack': 'At. Esp.',
    'special-defense': 'Def. Esp.',
    speed: 'Velocidade',
};
