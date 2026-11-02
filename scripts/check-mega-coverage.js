#!/usr/bin/env node

const fs = require('fs');
const https = require('https');
const { buildMegaCoverageReport, isMegaPokemonName } = require('./mega-coverage-utils.js');

const POKEAPI_BASE_URL = 'https://pokeapi.co/api/v2';
const PAGE_SIZE = 1000;
const MAX_RETRIES = 3;
const CONCURRENCY = 12;

function readJson(path) {
  return JSON.parse(fs.readFileSync(path, 'utf8'));
}

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, { headers: { 'User-Agent': 'PokeSnap-Dex Mega coverage checker' } }, (response) => {
      const chunks = [];
      response.on('data', (chunk) => chunks.push(chunk));
      response.on('end', () => {
        if (response.statusCode < 200 || response.statusCode >= 300) {
          reject(new Error('HTTP ' + response.statusCode + ' for ' + url));
          return;
        }

        try {
          resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
        } catch (error) {
          reject(new Error('Invalid JSON from ' + url + ': ' + error.message));
        }
      });
    });

    request.on('error', reject);
    request.setTimeout(15000, () => {
      request.destroy(new Error('Request timeout for ' + url));
    });
  });
}

async function fetchWithRetry(url) {
  let lastError;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    try {
      return await fetchJson(url);
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

async function fetchAllPokemonResources() {
  const resources = [];
  let nextUrl = POKEAPI_BASE_URL + '/pokemon?limit=' + PAGE_SIZE;

  while (nextUrl) {
    const page = await fetchWithRetry(nextUrl);
    if (!Array.isArray(page.results)) {
      throw new Error('PokeAPI returned an invalid Pokémon resource page.');
    }
    resources.push(...page.results);
    nextUrl = page.next;
  }

  return resources;
}

async function mapWithConcurrency(items, worker, concurrency) {
  const results = new Array(items.length);
  let cursor = 0;

  async function runWorker() {
    while (true) {
      const current = cursor;
      cursor += 1;
      if (current >= items.length) {
        return;
      }
      results[current] = await worker(items[current]);
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => runWorker()));
  return results;
}

function getDexNumber(speciesUrl) {
  const match = String(speciesUrl || '').match(/\/pokemon-species\/(\d+)\/?$/);
  if (!match) {
    throw new Error('PokeAPI returned an invalid species URL: ' + speciesUrl);
  }
  return match[1];
}

async function fetchMegaPokemonForms() {
  const resources = await fetchAllPokemonResources();
  const megaResources = resources.filter((pokemon) => isMegaPokemonName(pokemon.name));
  return mapWithConcurrency(megaResources, async (resource) => {
    const pokemon = await fetchWithRetry(POKEAPI_BASE_URL + '/pokemon/' + encodeURIComponent(resource.name));
    if (!pokemon.species || !pokemon.species.url) {
      throw new Error('PokeAPI Pokémon resource is missing its species: ' + resource.name);
    }
    return {
      name: pokemon.name,
      dexNumber: getDexNumber(pokemon.species.url)
    };
  }, CONCURRENCY);
}

function printReport(report) {
  const speciesCount = new Set(report.apiForms.map((form) => form.dexNumber)).size;
  console.log('Mega coverage report (PokeAPI)');
  console.log('Discovered ' + report.apiForms.length + ' Mega forms across ' + speciesCount + ' species.');

  function printSection(title, items, formatItem) {
    console.log('\n' + title + ' (' + items.length + ')');
    if (items.length === 0) {
      console.log('  None');
      return;
    }
    for (const item of items) {
      console.log('  ' + formatItem(item));
    }
  }

  printSection('PokeAPI Mega forms missing from data.json', report.missingAppForms,
    (form) => form.dexNumber + ' ' + form.name);
  printSection('data.json Mega labels not matched to a PokeAPI form', report.unmatchedAppForms,
    (form) => form.dexNumber + ' ' + form.label);
  printSection('Mega labels missing form-specific override entries', report.missingOverrides,
    (form) => form.dexNumber + ' ' + form.label);
  console.log('\nMissing overrides do not imply missing displayed entries: the app falls back to species-level Pokédex text.');
}

async function main() {
  const [data, overridePayload] = await Promise.all([
    Promise.resolve(readJson('data.json')),
    Promise.resolve(readJson('data-entries-overrides.json'))
  ]);
  const pokemonForms = await fetchMegaPokemonForms();
  printReport(buildMegaCoverageReport(pokemonForms, data, overridePayload.entries));
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Mega coverage check failed:', error.message);
    process.exit(1);
  });
}

module.exports = {
  getDexNumber
};
