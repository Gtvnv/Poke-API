import { Pokemon } from './pokemon-model.js';
import { API_BASE_URL } from './config.js';
import { cache } from './storage.js';

// Converte o payload cru da PokeAPI para o nosso modelo de domínio (completo).
function convertPokeApiDetailToPokemon(pokeDetail) {
    const pokemon = new Pokemon();

    pokemon.number = pokeDetail.id;
    pokemon.name = pokeDetail.name;

    const types = pokeDetail.types.map((typeSlot) => typeSlot.type.name);
    pokemon.types = types;
    pokemon.type = types[0];

    // Fallbacks de imagem: dream_world pode vir nulo para alguns Pokémon.
    pokemon.photo =
        pokeDetail.sprites?.other?.dream_world?.front_default ||
        pokeDetail.sprites?.other?.['official-artwork']?.front_default ||
        pokeDetail.sprites?.front_default ||
        '';

    pokemon.height = pokeDetail.height / 10; // decímetros -> metros
    pokemon.weight = pokeDetail.weight / 10; // hectogramas -> quilos

    pokemon.stats = pokeDetail.stats.map((statSlot) => ({
        name: statSlot.stat.name,
        value: statSlot.base_stat,
    }));

    pokemon.abilities = pokeDetail.abilities.map((a) => a.ability.name);

    pokemon.detailed = true;
    return pokemon;
}

// Reconstrói uma instância de Pokemon a partir de um objeto puro do cache.
function reviveFromCache(plain) {
    return Object.assign(new Pokemon(), plain);
}

async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Falha ao buscar dados (HTTP ${response.status})`);
    }
    return response.json();
}

export const pokeApi = {
    // Detalhe completo de um Pokémon (número, tipos, foto, stats, altura...).
    // Consulta o cache antes de ir à rede; o modal usa isto sob demanda.
    async getPokemonDetail(number) {
        const cached = cache.get(number);
        if (cached?.detailed) {
            return reviveFromCache(cached);
        }

        const detail = await fetchJson(`${API_BASE_URL}/pokemon/${number}`);
        const pokemon = convertPokeApiDetailToPokemon(detail);
        cache.set(number, pokemon);
        return pokemon;
    },

    // Carrega uma faixa de Pokémon para a listagem.
    // Hoje reutiliza o detalhe completo porque o card precisa de tipo e foto,
    // que o endpoint de listagem leve (/pokemon?offset&limit) não traz.
    async getPokemons(offset = 0, limit = 15) {
        const numbers = [];
        for (let i = 0; i < limit; i++) {
            numbers.push(offset + i + 1);
        }

        const requests = numbers.map((number) => this.getPokemonDetail(number));
        return Promise.all(requests);
    },
};
