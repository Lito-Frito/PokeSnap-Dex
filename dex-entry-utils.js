const DexEntryUtils = (() => {
  function normalizeEntryItem(entryItem) {
    if (typeof entryItem === 'string') {
      if (entryItem.includes(' - ')) {
        const [source, text] = entryItem.split(' - ', 2);
        return { source, text };
      }
      return { source: 'Entry', text: entryItem };
    }

    if (entryItem && typeof entryItem === 'object') {
      return {
        source: entryItem.source || 'Entry',
        text: entryItem.text || ''
      };
    }

    return { source: 'Entry', text: '' };
  }

  function getVariantLabelCandidates(variantLabel) {
    const candidates = [];

    if (variantLabel) {
      candidates.push(variantLabel);
      if (/^Shiny\s+/.test(variantLabel)) {
        candidates.push(variantLabel.replace(/^Shiny\s+/, '').trim());
      }
      if (/^(?:Shiny\s+)?Unown \([A-Z!?]\)$/.test(variantLabel)) {
        candidates.push('Unown');
      }
    }

    return Array.from(new Set(candidates.filter(Boolean)));
  }

  function getVariantEntries(entryMap, labels) {
    if (!entryMap || typeof entryMap !== 'object') {
      return null;
    }

    for (const label of labels) {
      if (Array.isArray(entryMap[label]) && entryMap[label].length > 0) {
        return entryMap[label].map(normalizeEntryItem);
      }
    }

    return null;
  }

  function getEntriesForVariant(speciesEntries, variantLabel) {
    if (!speciesEntries) {
      return [];
    }

    if (Array.isArray(speciesEntries)) {
      return speciesEntries.map(normalizeEntryItem);
    }

    const labelCandidates = getVariantLabelCandidates(variantLabel);

    const variantEntries = getVariantEntries(speciesEntries.variants, labelCandidates);
    if (variantEntries) {
      return variantEntries;
    }

    const groupedVariantEntries = getVariantEntries(speciesEntries.variantsGrouped, labelCandidates);
    if (groupedVariantEntries) {
      return groupedVariantEntries;
    }

    if (Array.isArray(speciesEntries.defaultGrouped)) {
      return speciesEntries.defaultGrouped.map(normalizeEntryItem);
    }

    if (Array.isArray(speciesEntries.default)) {
      return speciesEntries.default.map(normalizeEntryItem);
    }

    return [];
  }

  return Object.freeze({ normalizeEntryItem, getEntriesForVariant });
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DexEntryUtils;
}
