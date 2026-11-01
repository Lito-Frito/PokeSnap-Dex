function getAdjacentPokemonNumber(pokemonNumbers, currentNumber, direction) {
    if (direction !== -1 && direction !== 1) {
        return null;
    }

    const currentIndex = pokemonNumbers.indexOf(currentNumber);
    if (currentIndex !== -1) {
        return pokemonNumbers[currentIndex + direction] || null;
    }

    const currentNumberValue = Number(currentNumber);
    if (!Number.isFinite(currentNumberValue)) {
        return null;
    }

    const candidates = direction === -1
        ? [...pokemonNumbers].reverse()
        : pokemonNumbers;
    return candidates.find(number => (
        direction === -1
            ? Number(number) < currentNumberValue
            : Number(number) > currentNumberValue
    )) || null;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getAdjacentPokemonNumber };
} else {
    globalThis.DexNavigationUtils = { getAdjacentPokemonNumber };
}
