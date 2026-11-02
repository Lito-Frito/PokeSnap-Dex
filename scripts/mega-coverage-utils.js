function isMegaPokemonName(name) {
  return /(?:^|-)mega(?:-|$)/i.test(name || '');
}

function normalizeMegaLabel(label) {
  const normalized = String(label || '')
    .replace(/^Shiny\s+/i, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .sort()
    .join(' ');
  const aliases = {
    'eternal floette flower mega': 'floette mega',
    'color magearna mega original': 'magearna mega original'
  };
  return aliases[normalized] || normalized;
}

function hasEntries(entryMap, label) {
  return Boolean(entryMap && Array.isArray(entryMap[label]) && entryMap[label].length > 0);
}

function buildMegaCoverageReport(pokemonForms, data, overrideEntries) {
  const apiForms = pokemonForms
    .filter((pokemon) => isMegaPokemonName(pokemon.name))
    .map((pokemon) => ({
      dexNumber: String(pokemon.dexNumber).padStart(3, '0'),
      name: pokemon.name
    }))
    .sort((left, right) => {
      return Number(left.dexNumber) - Number(right.dexNumber) || left.name.localeCompare(right.name);
    });

  const localForms = [];
  const allLocalLabels = [];
  for (const [dexNumber, species] of Object.entries(data)) {
    for (const variant of species.variants || []) {
      const label = variant.label || '';
      if (!/\bMega\b/i.test(label)) {
        continue;
      }

      allLocalLabels.push({ dexNumber, label });
      if (!/^Shiny\s+/i.test(label)) {
        localForms.push({ dexNumber, label });
      }
    }
  }

  function sortByDexNumberAndLabel(left, right) {
    return Number(left.dexNumber) - Number(right.dexNumber) || left.label.localeCompare(right.label);
  }
  localForms.sort(sortByDexNumberAndLabel);
  allLocalLabels.sort(sortByDexNumberAndLabel);

  const apiFormKeys = new Set(apiForms.map((form) => normalizeMegaLabel(form.name)));
  const localFormKeys = new Set(localForms.map((form) => normalizeMegaLabel(form.label)));
  const overrideForms = overrideEntries || {};
  const missingOverrides = allLocalLabels.filter(({ dexNumber, label }) => {
    const speciesOverrides = overrideForms[dexNumber] || {};
    return !hasEntries(speciesOverrides.variants, label)
      && !hasEntries(speciesOverrides.variantsGrouped, label);
  });

  return {
    apiForms,
    localForms,
    missingAppForms: apiForms.filter((form) => {
      return !localFormKeys.has(normalizeMegaLabel(form.name));
    }),
    unmatchedAppForms: localForms.filter((form) => {
      return !apiFormKeys.has(normalizeMegaLabel(form.label));
    }),
    missingOverrides
  };
}

module.exports = {
  buildMegaCoverageReport,
  isMegaPokemonName
};
