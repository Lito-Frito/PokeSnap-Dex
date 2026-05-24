#!/usr/bin/env node

const fs = require('fs');
const https = require('https');

const DATA_FILE = 'data.json';
const OUTPUT_FILE = 'data-entries.json';
const TOTAL_POKEMON = 1025;
const MAX_RETRIES = 3;
const CONCURRENCY = 12;

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function writeJson(path, payload) {
  fs.writeFileSync(path, JSON.stringify(payload, null, 2) + '\n', 'utf8');
}

function indentBlock(value, spaces) {
  const prefix = ' '.repeat(spaces);
  return value
    .split('\n')
    .map((line) => (line ? prefix + line : line))
    .join('\n');
}

function writeOrderedDataJson(path, payload) {
  const orderedKeys = [];
  for (let i = 1; i <= TOTAL_POKEMON; i += 1) {
    orderedKeys.push(padDexNumber(i));
  }

  const chunks = ['{'];
  for (let i = 0; i < orderedKeys.length; i += 1) {
    const key = orderedKeys[i];
    const value = payload[key] || { name: '', variants: [] };
    const valueJson = JSON.stringify(value, null, 2);
    chunks.push('  "' + key + '": ' + valueJson.split('\n')[0]);

    const valueLines = valueJson.split('\n');
    for (let j = 1; j < valueLines.length; j += 1) {
      chunks.push(indentBlock(valueLines[j], 2));
    }

    if (i !== orderedKeys.length - 1) {
      chunks[chunks.length - 1] = chunks[chunks.length - 1] + ',';
    }
  }

  chunks.push('}');
  fs.writeFileSync(path, chunks.join('\n') + '\n', 'utf8');
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'PokeSnap-Dex sync script' } }, (res) => {
      const chunks = [];
      res.on('data', (chunk) => {
        chunks.push(chunk);
      });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error('HTTP ' + res.statusCode + ' for ' + url));
          return;
        }
        try {
          const body = Buffer.concat(chunks).toString('utf8');
          resolve(JSON.parse(body));
        } catch (error) {
          reject(new Error('Invalid JSON from ' + url + ': ' + error.message));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(15000, () => {
      req.destroy(new Error('Request timeout for ' + url));
    });
  });
}

async function fetchWithRetry(url, retries) {
  let lastError;
  for (let i = 0; i < retries; i += 1) {
    try {
      return await fetchJson(url);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

function padDexNumber(num) {
  return String(num).padStart(3, '0');
}

function titleCaseWords(value) {
  return value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function normalizeSource(versionName) {
  const overrides = {
    red: 'Red',
    blue: 'Blue',
    yellow: 'Yellow',
    gold: 'Gold',
    silver: 'Silver',
    crystal: 'Crystal',
    ruby: 'Ruby',
    sapphire: 'Sapphire',
    emerald: 'Emerald',
    firered: 'FireRed',
    leafgreen: 'LeafGreen',
    diamond: 'Diamond',
    pearl: 'Pearl',
    platinum: 'Platinum',
    heartgold: 'HeartGold',
    soulsilver: 'SoulSilver',
    black: 'Black',
    white: 'White',
    'black-2': 'Black 2',
    'white-2': 'White 2',
    x: 'X',
    y: 'Y',
    'omega-ruby': 'Omega Ruby',
    'alpha-sapphire': 'Alpha Sapphire',
    sun: 'Sun',
    moon: 'Moon',
    'ultra-sun': 'Ultra Sun',
    'ultra-moon': 'Ultra Moon',
    'lets-go-pikachu': "Let's Go Pikachu",
    'lets-go-eevee': "Let's Go Eevee",
    sword: 'Sword',
    shield: 'Shield',
    'brilliant-diamond': 'Brilliant Diamond',
    'shining-pearl': 'Shining Pearl',
    legends: 'Legends Arceus',
    scarlet: 'Scarlet',
    violet: 'Violet'
  };

  return overrides[versionName] || titleCaseWords(versionName);
}

function normalizeEntryText(text) {
  return text
    .replace(/[\n\f\r\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractGenus(speciesPayload) {
  const genera = speciesPayload.genera || [];
  const englishGenus = genera.find((entry) => {
    return entry.language && entry.language.name === 'en';
  });
  return englishGenus ? englishGenus.genus : '';
}

function buildStructuredEntries(speciesPayload) {
  const englishEntries = speciesPayload.flavor_text_entries.filter((entry) => {
    return entry.language && entry.language.name === 'en';
  });

  const seen = new Set();
  const normalized = [];

  for (const entry of englishEntries) {
    const source = normalizeSource(entry.version.name);
    const text = normalizeEntryText(entry.flavor_text);
    if (!text) {
      continue;
    }

    const dedupeKey = source + '||' + text;
    if (seen.has(dedupeKey)) {
      continue;
    }
    seen.add(dedupeKey);

    normalized.push({ source, text });
  }

  return normalized;
}

function normalizeTextForGrouping(text) {
  return normalizeEntryText(text)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, "'")
    .toLowerCase()
    .replace(/\b([a-z]{4,})s\b/g, '$1')
    .replace(/[^a-z0-9']+/g, ' ')
    .trim();
}

function getDisplayTextPriority(text) {
  const uppercaseWords = (text.match(/\b[A-Z][A-ZÉ'’-]{2,}\b/g) || []).length;
  const legacyPokemonWord = /POK.?.?MON/.test(text) ? 1 : 0;
  return uppercaseWords * 10 + legacyPokemonWord;
}

function chooseGroupedDisplayText(entries) {
  return entries
    .slice()
    .sort((left, right) => getDisplayTextPriority(left.text) - getDisplayTextPriority(right.text))[0]
    .text;
}

function normalizeGroupedSourceLabel(sources) {
  const normalized = [];
  const seen = new Set();
  const remakePairs = [
    { base: 'Red', remake: 'FireRed', label: '(Fire)Red' },
    { base: 'Gold', remake: 'HeartGold', label: '(Heart)Gold' },
    { base: 'Silver', remake: 'SoulSilver', label: '(Soul)Silver' },
    { base: 'Ruby', remake: 'Omega Ruby', label: '(Omega)Ruby' },
    { base: 'Sapphire', remake: 'Alpha Sapphire', label: '(Alpha)Sapphire' },
    { base: 'Diamond', remake: 'Brilliant Diamond', label: '(Brilliant)Diamond' },
    { base: 'Pearl', remake: 'Shining Pearl', label: '(Shining)Pearl' }
  ];

  function findRemakePair(source) {
    return remakePairs.find((pair) => pair.base === source || pair.remake === source);
  }

  for (const source of sources) {
    if (seen.has(source)) {
      continue;
    }

    const remakePair = findRemakePair(source);
    if (remakePair && sources.includes(remakePair.base) && sources.includes(remakePair.remake)) {
      normalized.push(remakePair.label);
      seen.add(remakePair.base);
      seen.add(remakePair.remake);
      continue;
    }

    const sequelMatch = source.match(/^(.*) 2$/);
    if (sequelMatch && seen.has(sequelMatch[1])) {
      continue;
    }

    if (sequelMatch) {
      normalized.push(source);
      seen.add(source);
      continue;
    }

    const sequelSource = source + ' 2';
    if (sources.includes(sequelSource)) {
      normalized.push(source + ' (2)');
      seen.add(source);
      seen.add(sequelSource);
      continue;
    }

    normalized.push(source);
    seen.add(source);
  }

  return normalized.join('/');
}

function buildGroupedEntries(entries) {
  const grouped = new Map();
  const textOrder = [];

  for (const entry of entries) {
    const textKey = normalizeTextForGrouping(entry.text);
    if (!grouped.has(textKey)) {
      grouped.set(textKey, []);
      textOrder.push(textKey);
    }

    grouped.get(textKey).push(entry);
  }

  return textOrder.map((textKey) => {
    const groupEntries = grouped.get(textKey);
    const sources = groupEntries.map((entry) => entry.source);
    return {
      source: normalizeGroupedSourceLabel(sources),
      text: chooseGroupedDisplayText(groupEntries)
    };
  });
}

function stripEmbeddedEntries(data) {
  let removedCount = 0;

  for (const number of Object.keys(data)) {
    const variants = data[number].variants || [];
    for (const variant of variants) {
      if (Object.prototype.hasOwnProperty.call(variant, 'entries')) {
        delete variant.entries;
        removedCount += 1;
      }
    }
  }

  return removedCount;
}

function isShinyLabel(label) {
  return /^Shiny\b/.test(label || '');
}

function baseVariantLabel(label) {
  return (label || '').replace(/^Shiny\s+/, '').trim();
}

function isMegaLabel(label) {
  return /\bMega\b/.test(baseVariantLabel(label));
}

function reorderVariantsForPokemon(pokemon) {
  const variants = pokemon.variants || [];
  if (variants.length <= 1) {
    return false;
  }

  const nonShinyLabels = new Set(
    variants
      .filter((variant) => !isShinyLabel(variant.label))
      .map((variant) => (variant.label || '').trim())
  );

  function getGroupKey(variant) {
    const label = (variant.label || '').trim();
    if (!isShinyLabel(label)) {
      return label;
    }

    const shinyBase = baseVariantLabel(label);
    if (nonShinyLabels.has(shinyBase)) {
      return shinyBase;
    }

    if (nonShinyLabels.has('Regular')) {
      return 'Regular';
    }

    return shinyBase;
  }

  const grouped = new Map();
  const groupOrder = [];
  for (const variant of variants) {
    const baseLabel = getGroupKey(variant);
    if (!grouped.has(baseLabel)) {
      grouped.set(baseLabel, []);
      groupOrder.push(baseLabel);
    }
    grouped.get(baseLabel).push(variant);
  }

  const name = pokemon.name || '';
  const baseGroups = [];
  const nonMegaGroups = [];
  const megaGroups = [];

  for (const label of groupOrder) {
    if (label === name || label === 'Regular') {
      baseGroups.push(label);
    } else if (isMegaLabel(label)) {
      megaGroups.push(label);
    } else {
      nonMegaGroups.push(label);
    }
  }

  const orderedGroups = baseGroups.concat(nonMegaGroups, megaGroups);
  const reordered = [];

  for (const groupLabel of orderedGroups) {
    const groupVariants = grouped.get(groupLabel) || [];
    const normal = groupVariants.filter((item) => !isShinyLabel(item.label));
    const shiny = groupVariants
      .filter((item) => isShinyLabel(item.label))
      .sort((a, b) => {
        const aLabel = (a.label || '').trim();
        const bLabel = (b.label || '').trim();
        const preferred = 'Shiny ' + groupLabel;
        const aPreferred = aLabel === preferred ? 0 : 1;
        const bPreferred = bLabel === preferred ? 0 : 1;
        return aPreferred - bPreferred;
      });
    reordered.push(...normal, ...shiny);
  }

  const before = variants.map((item) => item.label || '').join('|');
  const after = reordered.map((item) => item.label || '').join('|');
  if (before !== after) {
    pokemon.variants = reordered;
    return true;
  }

  return false;
}

function reorderAllPokemonVariants(data) {
  let changedCount = 0;

  for (const number of Object.keys(data)) {
    if (reorderVariantsForPokemon(data[number])) {
      changedCount += 1;
    }
  }

  return changedCount;
}

async function mapWithConcurrency(items, worker, concurrency) {
  const result = new Array(items.length);
  let cursor = 0;

  async function runWorker() {
    while (true) {
      const current = cursor;
      cursor += 1;
      if (current >= items.length) {
        break;
      }
      result[current] = await worker(items[current], current);
    }
  }

  const workers = [];
  for (let i = 0; i < concurrency; i += 1) {
    workers.push(runWorker());
  }

  await Promise.all(workers);
  return result;
}

async function main() {
  const data = readJson(DATA_FILE);
  const removedCount = stripEmbeddedEntries(data);
  const reorderedCount = reorderAllPokemonVariants(data);

  const numbers = [];
  for (let i = 1; i <= TOTAL_POKEMON; i += 1) {
    numbers.push(i);
  }

  console.log('Fetching species entries for ' + TOTAL_POKEMON + ' Pokemon...');

  const speciesResults = await mapWithConcurrency(
    numbers,
    async (number) => {
      const url = 'https://pokeapi.co/api/v2/pokemon-species/' + number;
      const species = await fetchWithRetry(url, MAX_RETRIES);
      return {
        number: padDexNumber(number),
        entries: buildStructuredEntries(species),
        genus: extractGenus(species)
      };
    },
    CONCURRENCY
  );

  const entries = {};
  let totalEntries = 0;
  let emptyCount = 0;

  for (const item of speciesResults) {
    entries[item.number] = {
      default: item.entries,
      defaultGrouped: buildGroupedEntries(item.entries)
    };
    totalEntries += item.entries.length;
    if (item.entries.length === 0) {
      emptyCount += 1;
    }

    // Add genus to data.json
    if (data[item.number]) {
      data[item.number].genus = item.genus;
    }
  }

  // Write updated data.json with genus fields
  writeOrderedDataJson(DATA_FILE, data);

  const orderedEntries = {};
  for (let i = 1; i <= TOTAL_POKEMON; i += 1) {
    const key = padDexNumber(i);
    orderedEntries[key] = entries[key];
  }

  const payload = {
    _meta: {
      schemaVersion: 2,
      source: 'https://pokeapi.co/',
      generatedAt: new Date().toISOString(),
      totalPokemon: TOTAL_POKEMON,
      totalEntries,
      emptySpeciesCount: emptyCount
    },
    entries: orderedEntries
  };

  // JSON.stringify sorts integer-like string keys lexicographically regardless
  // of insertion order, so we build the entries section manually.
  const metaJson = JSON.stringify(payload._meta, null, 2);
  const entryLines = ['  "entries": {'];
  const keys = Array.from({ length: TOTAL_POKEMON }, (_, i) => padDexNumber(i + 1));
  keys.forEach((key, idx) => {
    const comma = idx < keys.length - 1 ? ',' : '';
    const valueJson = JSON.stringify(orderedEntries[key], null, 2);
    const indented = valueJson
      .split('\n')
      .map((line, i2) => (i2 === 0 ? line : '      ' + line))
      .join('\n');
    entryLines.push(`    "${key}": ${indented}${comma}`);
  });
  entryLines.push('  }');
  const fileContent =
    '{\n' +
    '  "_meta": ' +
    metaJson.split('\n').map((line, i2) => (i2 === 0 ? line : '  ' + line)).join('\n') +
    ',\n' +
    entryLines.join('\n') +
    '\n}\n';
  fs.writeFileSync(OUTPUT_FILE, fileContent, 'utf8');

  console.log('Done.');
  console.log('- Removed embedded variant entries from data.json:', removedCount);
  console.log('- Reordered variant lists in data.json:', reorderedCount);
  console.log('- Wrote', OUTPUT_FILE, 'with', totalEntries, 'entries across', TOTAL_POKEMON, 'Pokemon');
  console.log('- Species with no English entries:', emptyCount);
}

main().catch((error) => {
  console.error('sync-dex-entries failed:', error.message);
  process.exit(1);
});
