function getAdjacentPokemonNumber(pokemonNumbers, currentNumber, direction) {
    if (direction !== -1 && direction !== 1) {
        return null;
    }

    const currentIndex = pokemonNumbers.indexOf(currentNumber);
    if (currentIndex === -1) {
        return null;
    }

    return pokemonNumbers[currentIndex + direction] || null;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getAdjacentPokemonNumber };
} else {
    globalThis.DexNavigationUtils = { getAdjacentPokemonNumber };
}
