// Modelo de domínio de um Pokémon.
// Mantém apenas os dados que a UI precisa, desacoplados do formato cru da PokeAPI.
export class Pokemon {
    number;
    name;
    type;
    types = [];
    photo;

    // Detalhes carregados sob demanda (ao abrir o modal).
    detailed = false; // true quando height/weight/stats/abilities já foram preenchidos
    height;      // em metros
    weight;      // em quilos
    stats = [];  // [{ name, value }]
    abilities = []; // nomes das habilidades

    get displayName() {
        return this.name.charAt(0).toUpperCase() + this.name.slice(1);
    }

    get formattedNumber() {
        return `#${String(this.number).padStart(3, '0')}`;
    }
}
