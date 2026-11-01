const PokemonCryUtils = (() => {
  function slugifyPokemonName(name) {
    return String(name)
      .toLowerCase()
      .replace(/♀/g, '-f')
      .replace(/♂/g, '-m')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  function escapeRegExp(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function getPokemonCryIdentifier(dexNumber, pokemonName, variantLabel) {
    const label = String(variantLabel || '').replace(/^Shiny\s+/i, '');
    const megaMatch = label.match(/^Mega\s+(.+)$/i);

    if (!megaMatch) {
      return String(Number(dexNumber));
    }

    const suffix = megaMatch[1]
      .replace(new RegExp(`^${escapeRegExp(pokemonName)}(?:\\s+|$)`, 'i'), '')
      .trim();
    const formSuffix = slugifyPokemonName(suffix);
    const speciesSlug = slugifyPokemonName(pokemonName);

    return `${speciesSlug}-mega${formSuffix ? `-${formSuffix}` : ''}`;
  }

  return Object.freeze({ getPokemonCryIdentifier });
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = PokemonCryUtils;
}
