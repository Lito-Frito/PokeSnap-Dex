/**
 * PokeSnap-Dex - A Pokémon AR Photo Collection App
 *
 * Overview:
 * This is a web-based PokeSnap-Dex inspired by Pokémon GO's AR photo feature.
 * It displays a grid of Pokémon entries with variants (base, shiny, regional, etc.), allowing multiple images per variant.
 * Users can view captured Pokémon, browse galleries, and toggle themes.
 *
 * Key Features:
 * - Grid view: Shows all real images per Pokémon variant (ignores placeholders).
 * - Capture count: Counts Pokémon with at least one real image (not placeholders).
 * - Gallery: Modal view with image navigation within a Pokémon's all images (keyboard: arrows, escape).
 * - Responsive design: Adapts to mobile with dynamic grid sizing.
 * - Theme toggle: Dark/light mode.
 * - Data integrity: 1025 entries, no duplicates, proper naming.
 *
 * Data Structure (data.json):
 * - Keys: '001' to '1025' (Pokémon numbers).
 * - Each entry: { name: string, variants: [{ label: string, images: [url], position: string, fit: string }] }
 * - Placeholders: "https://your-image-url-here.jpg" for missing images.
 *
 * Data Structure (data-entries.json):
 * - entries[number].default: [{ source: string, text: string }]
 * - entries[number].defaultGrouped: grouped display entries for UI rendering
 * - Optional future extension: entries[number].variants[label] for variant-specific text.
 *
 * Branches:
 * - main/Public: Placeholder images for public demo.
 * - LitoFrito: Real image URLs for personal use.
 *
 * Notes for Future Development:
 * - Ensure capture count excludes placeholders.
 * - Grid creates multiple entries per Pokémon for each image in variants.
 * - Gallery navigates through all images of the Pokémon.
 * - Dex entries are sourced from data-entries.json and can be regenerated via sync script.
 * - Run tests (node test.js) for data integrity.
 * - Mobile: CSS grid with auto-fit and min-width.
 */

// Load data from JSON
let pokedexData = {};
let dexEntriesByNumber = {};

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

function getEntriesForVariant(number, variantLabel) {
    const speciesEntries = dexEntriesByNumber[number];
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

async function loadData() {
  console.log('Starting to load data...');
  try {
        const fetchOptions = { cache: 'no-store' };
        const [response, entriesResponse, overridesResponse] = await Promise.all([
            fetch('data.json?v=20260827-1', fetchOptions),
            fetch('data-entries.json?v=20260827-1', fetchOptions),
            fetch('data-entries-overrides.json?v=20260827-1', fetchOptions).catch(() => null)
        ]);
        console.log('Fetch response:', response);
        pokedexData = await response.json();
        if (entriesResponse.ok) {
            const entriesPayload = await entriesResponse.json();
            dexEntriesByNumber = entriesPayload.entries || {};
        } else {
            dexEntriesByNumber = {};
            console.warn('Could not load data-entries.json, continuing with empty entries.');
        }
        if (overridesResponse && overridesResponse.ok) {
            const overridesPayload = await overridesResponse.json();
            const overrideEntries = overridesPayload.entries || {};
            for (const num in overrideEntries) {
                if (!dexEntriesByNumber[num]) {
                    dexEntriesByNumber[num] = {};
                }
                const src = overrideEntries[num];
                if (src.variants) {
                    dexEntriesByNumber[num].variants = Object.assign(
                        {}, dexEntriesByNumber[num].variants || {}, src.variants
                    );
                }
                if (src.variantsGrouped) {
                    dexEntriesByNumber[num].variantsGrouped = Object.assign(
                        {}, dexEntriesByNumber[num].variantsGrouped || {}, src.variantsGrouped
                    );
                }
            }
        }
    console.log('Data loaded:', Object.keys(pokedexData).length, 'entries');
    // Create flattened allImages for each entry
    for (let num in pokedexData) {
      pokedexData[num].allImages = [];
      for (let variant of pokedexData[num].variants) {
        if (variant.images && variant.images.length > 0) {
          let positions = variant.position;
          if (typeof positions === 'string') {
            positions = new Array(variant.images.length).fill(positions);
          } else if (Array.isArray(positions)) {
            // Pad with 'center' if fewer positions than images
            while (positions.length < variant.images.length) {
              positions.push('center');
            }
          } else {
            positions = new Array(variant.images.length).fill('center');
          }
          for (let i = 0; i < variant.images.length; i++) {
            let img = variant.images[i];
            let pos = positions[i];
            pokedexData[num].allImages.push({
              image: img,
              label: variant.label,
              position: pos,
              fit: variant.fit || 'contain',
              entries: getEntriesForVariant(num, variant.label)
            });
          }
        }
      }
    }
    let capturedCount = 0;
    for (let num in pokedexData) {
        if (pokedexData[num].allImages.some(imgObj => imgObj.image && imgObj.image !== "https://your-image-url-here.jpg")) {
            capturedCount++;
        }
    }
    document.getElementById('captured-count').textContent = `Captured: ${capturedCount}`;
    renderDex();
  } catch (error) {
    console.error('Error loading data:', error);
  }
}

// DOM elements
const dexContainer = document.getElementById('dex-container');
const gallery = document.getElementById('gallery');
const galleryImage = document.getElementById('gallery-image');
const galleryName = document.getElementById('gallery-name');
const dexEntry = document.getElementById('dex-entry');
const dexEntryScrollHint = document.getElementById('dex-entry-scroll-hint');
const prevButton = document.getElementById('prev-variant');
const nextButton = document.getElementById('next-variant');
const prevDescriptionButton = document.getElementById('prev-description');
const nextDescriptionButton = document.getElementById('next-description');
const closeButton = document.getElementById('close-gallery');
const playCryButton = document.getElementById('play-cry');
const cryVersionMenu = document.getElementById('cry-version-menu');
const cryStatus = document.getElementById('cry-status');

let currentEntry = null;
let currentImageIndex = 0;
let currentEntryIndex = 0;
let showAll = false;
let showSpoilers = false;
const pokemonCryCache = new Map();
let currentCryAudio = null;
let cryRequestId = 0;
let availableCryOptions = [];
let selectedCryUrl = '';
let cryHoldTimer = null;
let cryHoldPointerId = null;
let cryHoldStart = null;
let cryHoldOpenedMenu = false;
let suppressCryClick = false;

function isPlaceholderImage(url) {
    return url === 'https://your-image-url-here.jpg';
}

function updateDexEntryScrollHint() {
    if (!dexEntryScrollHint) return;

    const hasOverflow = dexEntry.scrollHeight > dexEntry.clientHeight + 1;
    dexEntryScrollHint.classList.toggle('visible', hasOverflow);
}

// Function to update the Dex entry display with styling
function updateDexEntry() {
    if (currentEntry && pokedexData[currentEntry]) {
        const imgObj = pokedexData[currentEntry].allImages[currentImageIndex];
        const entries = imgObj.entries;
        const locked = isPlaceholderImage(imgObj.image) && !showSpoilers;

        dexEntry.innerHTML = '';

        // Sync spoiler button state
        const spoilerToggle = document.getElementById('spoiler-toggle');
        if (spoilerToggle) {
            spoilerToggle.textContent = showSpoilers ? 'Hide Spoilers' : 'Show Spoilers';
            spoilerToggle.classList.toggle('spoilers-active', showSpoilers);
        }

        // Disable entry navigation when locked
        prevDescriptionButton.disabled = locked || !entries || entries.length === 0;
        nextDescriptionButton.disabled = locked || !entries || entries.length === 0;

        if (locked) {
            const lockedMsg = document.createElement('div');
            lockedMsg.className = 'dex-entry-locked';
            lockedMsg.textContent = 'Entry locked until captured.';
            dexEntry.appendChild(lockedMsg);
        } else if (entries && entries.length > 0) {
            const entryData = normalizeEntryItem(entries[currentEntryIndex]);
            const entryLayout = document.createElement('div');
            entryLayout.className = 'dex-entry-layout';
            const sourceColumn = document.createElement('div');
            sourceColumn.className = 'dex-entry-source';
            const descriptionColumn = document.createElement('div');
            descriptionColumn.className = 'dex-entry-description';

            sourceColumn.textContent = entryData.source || 'Entry';
            descriptionColumn.textContent = entryData.text || '';

            entryLayout.appendChild(sourceColumn);
            entryLayout.appendChild(descriptionColumn);
            dexEntry.appendChild(entryLayout);
        }

        requestAnimationFrame(updateDexEntryScrollHint);
    }
}

function isCurrentPokemonCaptured() {
    return Boolean(
        currentEntry &&
        pokedexData[currentEntry] &&
        pokedexData[currentEntry].allImages.some(imgObj => imgObj.image && !isPlaceholderImage(imgObj.image))
    );
}

function stopCryPlayback() {
    if (currentCryAudio) {
        currentCryAudio.pause();
        currentCryAudio.removeAttribute('src');
        currentCryAudio.load();
        currentCryAudio = null;
    }
}

function setCryStatus(message) {
    cryStatus.textContent = message;
}

function closeCryVersionMenu() {
    cryVersionMenu.hidden = true;
    cryVersionMenu.style.removeProperty('left');
    cryVersionMenu.style.removeProperty('top');
    playCryButton.setAttribute('aria-expanded', 'false');
    cryVersionMenu.querySelectorAll('.cry-version-option').forEach(option => {
        option.classList.remove('is-selected');
    });
}

function openCryVersionMenu() {
    if (availableCryOptions.length < 2 || playCryButton.disabled) {
        return false;
    }

    cryVersionMenu.replaceChildren();
    availableCryOptions.forEach(option => {
        const menuOption = document.createElement('button');
        menuOption.type = 'button';
        menuOption.className = 'cry-version-option';
        menuOption.setAttribute('aria-pressed', String(option.url === selectedCryUrl));
        menuOption.dataset.value = option.url;
        menuOption.textContent = option.textContent;
        menuOption.addEventListener('click', () => selectAndPlayCry(option.url));
        cryVersionMenu.appendChild(menuOption);
    });

    cryVersionMenu.hidden = false;
    const menuRect = cryVersionMenu.getBoundingClientRect();
    const playRect = playCryButton.getBoundingClientRect();
    const horizontalInset = 12;
    const maxLeft = Math.max(horizontalInset, window.innerWidth - menuRect.width - horizontalInset);
    const left = Math.min(
        maxLeft,
        Math.max(horizontalInset, playRect.left + (playRect.width - menuRect.width) / 2)
    );
    const aboveTop = playRect.top - menuRect.height - 8;
    const top = aboveTop >= 8
        ? aboveTop
        : Math.min(window.innerHeight - menuRect.height - 8, playRect.bottom + 8);
    cryVersionMenu.style.left = `${left}px`;
    cryVersionMenu.style.top = `${Math.max(8, top)}px`;
    playCryButton.setAttribute('aria-expanded', 'true');
    return true;
}

function selectCryOptionAtPoint(clientX, clientY) {
    const option = document.elementFromPoint(clientX, clientY)?.closest('.cry-version-option');
    cryVersionMenu.querySelectorAll('.cry-version-option').forEach(item => {
        item.classList.toggle('is-selected', item === option);
    });
    return option;
}

function selectAndPlayCry(url) {
    selectedCryUrl = url;
    closeCryVersionMenu();
    playSelectedCry();
}

async function getPokemonCries(identifier) {
    if (!pokemonCryCache.has(identifier)) {
        const request = fetch(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(identifier)}`, {
            cache: 'force-cache'
        }).then(response => {
            if (!response.ok) {
                throw new Error(`PokeAPI returned ${response.status} for ${identifier}`);
            }
            return response.json();
        }).then(pokemon => pokemon.cries || {});

        pokemonCryCache.set(identifier, request);
        request.catch(() => {
            if (pokemonCryCache.get(identifier) === request) {
                pokemonCryCache.delete(identifier);
            }
        });
    }

    return pokemonCryCache.get(identifier);
}

async function updateCryControls() {
    const requestId = ++cryRequestId;
    stopCryPlayback();
    availableCryOptions = [];
    selectedCryUrl = '';
    closeCryVersionMenu();
    playCryButton.disabled = true;
    document.getElementById('cry-hint').hidden = true;

    if (!currentEntry || !pokedexData[currentEntry]) {
        setCryStatus('');
        return;
    }

    if (!isCurrentPokemonCaptured() && !showSpoilers) {
        setCryStatus('Show Spoilers to unlock cries for uncaptured Pokémon.');
        return;
    }

    const pokemon = pokedexData[currentEntry];
    const image = pokemon.allImages[currentImageIndex];
    const identifier = PokemonCryUtils.getPokemonCryIdentifier(
        currentEntry,
        pokemon.name,
        image.label
    );

    setCryStatus('Loading cries…');
    try {
        const cries = await getPokemonCries(identifier);
        if (requestId !== cryRequestId || gallery.classList.contains('hidden')) {
            return;
        }

        availableCryOptions = ['latest', 'legacy']
            .filter(version => typeof cries[version] === 'string' && cries[version])
            .map(version => ({
                version,
                url: cries[version],
                textContent: version === 'latest' ? 'Latest' : 'Legacy'
            }));

        if (availableCryOptions.length === 0) {
            setCryStatus('No cry recordings are available for this form.');
            return;
        }

        selectedCryUrl = availableCryOptions[0].url;
        playCryButton.disabled = false;
        playCryButton.setAttribute(
            'aria-label',
            availableCryOptions.length > 1
                ? 'Play cry. Hold to choose Latest or Legacy.'
                : 'Play cry.'
        );
        document.getElementById('cry-hint').hidden = availableCryOptions.length < 2;
        setCryStatus('');
    } catch (error) {
        if (requestId !== cryRequestId) {
            return;
        }
        console.error('Error loading Pokémon cries:', error);
        setCryStatus('Could not load cries. Please try again.');
    }
}

function playSelectedCry() {
    if (playCryButton.disabled || !selectedCryUrl || currentCryAudio) {
        return;
    }

    const audio = new Audio(selectedCryUrl);
    currentCryAudio = audio;
    playCryButton.disabled = true;
    setCryStatus('Playing cry…');

    const finishPlayback = () => {
        if (currentCryAudio !== audio) {
            return;
        }
        currentCryAudio = null;
        playCryButton.disabled = false;
        setCryStatus('');
    };

    audio.addEventListener('ended', finishPlayback, { once: true });
    audio.addEventListener('error', () => {
        finishPlayback();
        setCryStatus('Could not play this cry.');
    }, { once: true });

    audio.play().catch(error => {
        finishPlayback();
        console.error('Error playing Pokémon cry:', error);
        setCryStatus('Could not play this cry.');
    });
}

function startCryHold(event) {
    if (!event.isPrimary || event.button !== 0 || availableCryOptions.length < 2 || playCryButton.disabled) {
        return;
    }

    cryHoldPointerId = event.pointerId;
    cryHoldStart = { x: event.clientX, y: event.clientY };
    cryHoldOpenedMenu = false;
    playCryButton.setPointerCapture(event.pointerId);
    cryHoldTimer = window.setTimeout(() => {
        cryHoldOpenedMenu = openCryVersionMenu();
    }, 450);
}

function moveCryHold(event) {
    if (event.pointerId !== cryHoldPointerId) {
        return;
    }

    if (!cryHoldOpenedMenu && cryHoldTimer !== null) {
        const distance = Math.hypot(
            event.clientX - cryHoldStart.x,
            event.clientY - cryHoldStart.y
        );
        if (distance > 12) {
            window.clearTimeout(cryHoldTimer);
            cryHoldTimer = null;
        }
    }

    if (cryHoldOpenedMenu) {
        event.preventDefault();
        selectCryOptionAtPoint(event.clientX, event.clientY);
    }
}

function finishCryHold(event) {
    if (event.pointerId !== cryHoldPointerId) {
        return;
    }

    if (cryHoldTimer !== null) {
        window.clearTimeout(cryHoldTimer);
        cryHoldTimer = null;
    }

    if (cryHoldOpenedMenu) {
        const option = selectCryOptionAtPoint(event.clientX, event.clientY);
        if (option) {
            selectAndPlayCry(option.dataset.value);
        } else {
            closeCryVersionMenu();
        }
        suppressCryClick = true;
        window.setTimeout(() => {
            suppressCryClick = false;
        }, 500);
    }

    cryHoldPointerId = null;
    cryHoldStart = null;
    cryHoldOpenedMenu = false;
}

function cancelCryHold(event) {
    if (event.pointerId !== cryHoldPointerId) {
        return;
    }
    if (cryHoldTimer !== null) {
        window.clearTimeout(cryHoldTimer);
        cryHoldTimer = null;
    }
    if (cryHoldOpenedMenu) {
        closeCryVersionMenu();
    }
    cryHoldPointerId = null;
    cryHoldStart = null;
    cryHoldOpenedMenu = false;
}

// Theme toggle with persistence
const themeToggle = document.getElementById('theme-toggle');
const searchInput = document.getElementById('search-input');
const captureFilter = document.getElementById('capture-filter');
const capturedCountBtn = document.getElementById('captured-count');
const capturedModal = document.getElementById('captured-modal');
const capturedList = document.getElementById('captured-list');
const closeCapturedModal = document.getElementById('close-captured-modal');
const toggleShowAll = document.getElementById('toggle-show-all');
const h1 = document.querySelector('h1');

// Intersection Observer for lazy loading images
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target.querySelector('img');
            if (img && img.dataset.src) {
                img.src = img.dataset.src;
                observer.unobserve(entry.target);
            }
        }
    });
}, { root: dexContainer, threshold: 0.1 });

// Reset search input on page load
searchInput.value = '';

// Load saved theme preference
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    document.body.classList.add('dark-mode');
    h1.textContent = 'Unova Theme: PokeSnap Dex';
} else {
    document.body.classList.remove('dark-mode');
    h1.textContent = 'Kanto Theme: PokeSnap Dex';
}

themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    themeToggle.textContent = 'Toggle';
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    h1.textContent = isDark ? 'Unova Theme: PokeSnap Dex' : 'Kanto Theme: PokeSnap Dex';
});

// Set initial toggle text
themeToggle.textContent = 'Toggle';

function parseSearchTerms(query) {
    if (!query || typeof query !== 'string') {
        return { terms: [], globalShiny: false, globalOnlyShiny: false };
    }

    const raw = query.trim();

    // Bare 'Shiny' -> global-only behavior (show captured shinies)
    if (/^shiny$/i.test(raw)) {
        return { terms: [], globalShiny: true, globalOnlyShiny: true };
    }

    let q = raw;
    let globalShiny = false;
    // Leading 'Shiny &' or 'Shiny and' applies to all following names
    if (/^shiny\s*(?:&|and)(?=\s|$)/i.test(q)) {
        globalShiny = true;
        q = q.replace(/^shiny\s*(?:&|and)(?=\s|$)\s*/i, '');
    }

    const parts = q.split(/\s*,\s*/).filter(Boolean);
    const terms = [];

    parts.forEach(part => {
        // allow multiple names joined by '&' inside a part
        part.split(/\s*&\s*/).forEach(sub => {
            let s = sub.trim();
            if (!s) return;
            let shiny = false;
            let excludeShiny = false;

            if (/^(not\s+shiny|non[- ]?shiny)\b/i.test(s)) {
                excludeShiny = true;
                s = s.replace(/^(not\s+shiny|non[- ]?shiny)\b\s*/i, '').trim();
            }

            if (/^shiny\b/i.test(s)) {
                shiny = true;
                s = s.replace(/^shiny\b\s*/i, '').trim();
            }

            if (!s) return;

            // If leader was 'Shiny &' (global), apply to terms without explicit shiny/exclude
            if (globalShiny && !shiny && !excludeShiny) {
                shiny = true;
            }

            terms.push({ term: s.toLowerCase(), shiny, excludeShiny });
        });
    });

    return { terms, globalShiny, globalOnlyShiny: false };
}

function updateDexLayoutForVisibleCount(visibleCount) {
    if (visibleCount <= 2) {
        dexContainer.classList.add('flex-layout');
        dexContainer.classList.remove('grid-layout');
    } else {
        dexContainer.classList.add('grid-layout');
        dexContainer.classList.remove('flex-layout');
    }
}

function matchesCaptureFilter(entry, filterValue) {
    if (filterValue === 'caught') {
        return entry.dataset.caught === 'true';
    }

    if (filterValue === 'uncaught') {
        return entry.dataset.caught === 'false';
    }

    return true;
}

function applyDexFilters() {
    const parsed = parseSearchTerms(searchInput.value);
    const terms = parsed.terms || [];
    const globalShiny = !!parsed.globalShiny;
    const globalOnlyShiny = !!parsed.globalOnlyShiny;
    const filterValue = captureFilter.value;
    const entries = dexContainer.querySelectorAll('.entry');
    let visibleCount = 0;

    entries.forEach(entry => {
        const number = entry.dataset.number;
        const name = (entry.dataset.name || '').toLowerCase();
        const entryData = pokedexData[number] || { allImages: [] };
        const labels = (entryData.allImages || []).map(i => (i.label || '').toLowerCase());

        const isCaught = entry.dataset.caught === 'true';
        const hasShinyVariant = (entryData.allImages || []).some(i => /^Shiny\b/i.test(i.label || '') && i.image && !isPlaceholderImage(i.image));
        const hasCapturedShiny = (entryData.allImages || []).some(i => /^Shiny\b/i.test(i.label || '') && i.image && !isPlaceholderImage(i.image));

        const imgEl = entry.querySelector('img');

        // Case: bare 'Shiny' -> show captured shiny entries only
        if (globalOnlyShiny) {
            if (hasCapturedShiny) {
                // prefer shiny image
                if (hasShinyVariant && imgEl) {
                    const shinyImgObj = (entryData.allImages || []).find(i => /^Shiny\b/i.test(i.label || '') && i.image && !isPlaceholderImage(i.image));
                    if (shinyImgObj) {
                        if (!imgEl.dataset.originalSrc) imgEl.dataset.originalSrc = imgEl.dataset.src || imgEl.src || '';
                        if (imgEl.src) imgEl.src = shinyImgObj.image; else imgEl.dataset.src = shinyImgObj.image;
                        imgEl.alt = (shinyImgObj.label || entry.dataset.name || '').replace(/-/g, ' ');
                    }
                }
                entry.style.display = '';
                visibleCount++;
            } else {
                entry.style.display = 'none';
            }
            return;
        }

        // No specific search terms -> fallback to capture filter
        if (terms.length === 0) {
            const matchesStatus = matchesCaptureFilter(entry, filterValue);
            if (matchesStatus) {
                // restore original if needed
                if (imgEl && imgEl.dataset.originalSrc) {
                    const orig = imgEl.dataset.originalSrc;
                    if (orig) { if (imgEl.src) imgEl.src = orig; else imgEl.dataset.src = orig; }
                }
                entry.style.display = '';
                visibleCount++;
            } else {
                entry.style.display = 'none';
            }
            return;
        }

        // Per-term matching: entry is shown if any term matches and its status/constraints pass
        let matched = false;
        let preferShinyDisplay = false;

        for (const t of terms) {
            const term = (t.term || '').toLowerCase();
            if (!term) continue;

            const termShiny = !!t.shiny;
            const termExclude = !!t.excludeShiny;

            const nameMatches = name.includes(term) || labels.some(l => l.includes(term));
            if (!nameMatches) continue;

            if (termShiny && !hasShinyVariant) continue;
            if (termExclude) {
                const hasNonShiny = (entryData.allImages || []).some(i => !/^Shiny\b/i.test(i.label || '') && i.image && !isPlaceholderImage(i.image));
                if (!hasNonShiny) continue;
            }

            // Apply capture filter per-term
            let statusOk = true;
            if (filterValue === 'caught') {
                statusOk = termShiny ? hasCapturedShiny : isCaught;
            } else if (filterValue === 'uncaught') {
                statusOk = termShiny ? !hasCapturedShiny : !isCaught;
            }

            if (!statusOk) continue;

            matched = true;
            if (termShiny) preferShinyDisplay = true;
            break;
        }

        if (matched) {
            if (preferShinyDisplay && hasShinyVariant && imgEl) {
                const shinyImgObj = (entryData.allImages || []).find(i => /^Shiny\b/i.test(i.label || '') && i.image && !isPlaceholderImage(i.image));
                if (shinyImgObj) {
                    if (!imgEl.dataset.originalSrc) imgEl.dataset.originalSrc = imgEl.dataset.src || imgEl.src || '';
                    if (imgEl.src) imgEl.src = shinyImgObj.image; else imgEl.dataset.src = shinyImgObj.image;
                    imgEl.alt = (shinyImgObj.label || entry.dataset.name || '').replace(/-/g, ' ');
                }
            } else if (imgEl && imgEl.dataset.originalSrc) {
                const orig = imgEl.dataset.originalSrc;
                if (orig) { if (imgEl.src) imgEl.src = orig; else imgEl.dataset.src = orig; }
            }

            entry.style.display = '';
            visibleCount++;
        } else {
            entry.style.display = 'none';
        }
    });

    updateDexLayoutForVisibleCount(visibleCount);
}

// Search functionality
searchInput.addEventListener('input', applyDexFilters);
captureFilter.addEventListener('change', applyDexFilters);

// Captured modal
capturedCountBtn.addEventListener('click', () => {
    showCapturedModal();
});

closeCapturedModal.addEventListener('click', () => {
    capturedModal.style.display = 'none';
});

toggleShowAll.addEventListener('click', () => {
    showAll = !showAll;
    toggleShowAll.textContent = showAll ? 'Show Less' : 'Show All';
    updateCapturedList();
});

window.addEventListener('click', (e) => {
    if (e.target === capturedModal) {
        capturedModal.style.display = 'none';
    }
});

function showCapturedModal() {
    updateCapturedList();
    capturedModal.style.display = 'block';
}

function updateCapturedList() {
    capturedList.innerHTML = '';
    let count = 0;
    for (let i = 1; i <= 1025; i++) {
        const number = i.toString().padStart(3, '0');
        if (pokedexData[number].allImages.some(imgObj => imgObj.image && imgObj.image !== "https://your-image-url-here.jpg")) {
            const li = document.createElement('li');
            li.textContent = `${number}: ${pokedexData[number].name}`;
            li.style.cursor = 'pointer';
            li.addEventListener('click', () => {
                // Clear search filter before navigating
                searchInput.value = '';
                searchInput.dispatchEvent(new Event('input'));
                scrollToPokemon(number);
                capturedModal.style.display = 'none';
            });
            capturedList.appendChild(li);
            count++;
        }
    }
    if (showAll) {
        capturedList.classList.add('show-all');
    } else {
        capturedList.classList.remove('show-all');
    }
}

function scrollToPokemon(number) {
    const entry = document.querySelector(`.entry[data-number="${number}"]`);
    if (entry) {
        const dexContainer = document.getElementById('dex-container');
        const entryTop = entry.offsetTop;
        const entryHeight = entry.offsetHeight;
        const containerHeight = dexContainer.clientHeight;
        const scrollTop = entryTop - (containerHeight / 2) + (entryHeight / 2);
        dexContainer.scrollTo({ top: scrollTop, behavior: 'smooth' });
    }
}

// Render the grid
function renderDex() {
    console.log('Rendering dex...');
    for (let i = 1; i <= 1025; i++) {  // All generations up to Paldea
        const number = i.toString().padStart(3, '0');
        const entryData = pokedexData[number];
        const entryDiv = document.createElement('div');
        const isCaught = entryData.allImages.some(imgObj => imgObj.image && !isPlaceholderImage(imgObj.image));
        entryDiv.className = 'entry';
        entryDiv.dataset.number = number;
        entryDiv.dataset.name = entryData.name;
        entryDiv.dataset.caught = String(isCaught);

        const firstRealImageIndex = entryData.allImages.findIndex(imgObj => imgObj.image && imgObj.image !== "https://your-image-url-here.jpg");
        if (entryData && firstRealImageIndex !== -1) {
            const imgObj = entryData.allImages[firstRealImageIndex];
            const img = document.createElement('img');
            img.dataset.src = imgObj.image;
            img.loading = 'lazy';
            const baseName = entryData.name;
            const label = imgObj.label;
            let displayName = baseName;
            if (label && label !== baseName) {
                if (label.includes(baseName)) {
                    const suffix = label.replace(baseName, '').trim().replace(/^[- ]+/, '');
                    displayName = suffix ? `${baseName} - ${suffix}` : baseName;
                } else {
                    displayName = `${baseName} - ${label}`;
                }
            }
            displayName = displayName.replace(/-/g, ' ');
            img.alt = displayName;
            img.style.objectPosition = imgObj.position;
            img.style.objectFit = imgObj.fit;
            img.onerror = () => {
                img.style.display = 'none';
                entryDiv.textContent = entryData.name;
                entryDiv.classList.add('empty');
            };
            if (imgObj.fit === 'contain') {
                // entryDiv.style.backgroundColor = document.body.classList.contains('dark-mode') ? '#555' : '#ddd';
            }
            entryDiv.appendChild(img);
            observer.observe(entryDiv);
            entryDiv.addEventListener('click', () => openGallery(number, firstRealImageIndex));
        } else {
            entryDiv.className += ' empty';
            entryDiv.textContent = entryData.name;
        }

        dexContainer.appendChild(entryDiv);
    }
    applyDexFilters();
    console.log('Dex rendered, total entries:', dexContainer.children.length);
}

// Open gallery for an entry
function openGallery(number, imgIndex) {
    currentEntry = number;
    currentImageIndex = imgIndex;
    currentEntryIndex = 0;
    showSpoilers = false;
    document.body.classList.add('gallery-open');
    gallery.classList.remove('hidden');
    updateGalleryImage();
}

// Update gallery image
function updateGalleryImage() {
    if (currentEntry && pokedexData[currentEntry]) {
        const imgObj = pokedexData[currentEntry].allImages[currentImageIndex];
        let imageSrc = imgObj.image;
        if (imageSrc === "https://your-image-url-here.jpg") {
            imageSrc = "https://i.imgur.com/m3idMCk.png";
        }
        galleryImage.style.objectFit = 'contain';
        galleryImage.style.backgroundColor = '#000';
        galleryImage.src = imageSrc;
        const baseName = pokedexData[currentEntry].name;
        const label = imgObj.label;
        let variantSuffix = '';
        if (label && label !== baseName) {
            if (label.includes(baseName)) {
                variantSuffix = label.replace(baseName, '').trim().replace(/^[- ]+/, '');
            } else {
                variantSuffix = label;
            }
        }
        const paldeanBreedMatch = variantSuffix.match(/^(Shiny )?Paldean(?: Tauros)?\s*-\s*(.+)$/);
        if (paldeanBreedMatch) {
            variantSuffix = `${paldeanBreedMatch[1] || ''}Paldean (${paldeanBreedMatch[2].trim()})`;
        }
        const altName = variantSuffix ? `${baseName} - ${variantSuffix}` : baseName;
        galleryImage.alt = imageSrc === "https://i.imgur.com/m3idMCk.png" ? "Missing Snap" : altName;
        const dexNumber = currentEntry.padStart(3, '0');
        let displayName = `#${dexNumber} ${baseName}`;
        const genus = pokedexData[currentEntry].genus;
        if (genus) {
            displayName = `${displayName} (${genus})`;
        }
        if (variantSuffix) {
            displayName = `${displayName} - ${variantSuffix}`;
        }
        galleryName.textContent = displayName;
        // Display Dex entries — clamp index to valid range for new image's entries
        const newEntries = imgObj.entries;
        const maxIndex = newEntries && newEntries.length > 0 ? newEntries.length - 1 : 0;
        currentEntryIndex = Math.min(currentEntryIndex, maxIndex);
        updateDexEntry();
        updateCryControls();
        const prevButton = document.getElementById('prev-variant');
        const nextButton = document.getElementById('next-variant');
        const isSingleImage = pokedexData[currentEntry].allImages.length <= 1;
        prevButton.disabled = isSingleImage;
        nextButton.disabled = isSingleImage;
    }
}

function navigateGalleryImage(delta) {
    if (!currentEntry || !pokedexData[currentEntry]) {
        return;
    }

    const imageCount = pokedexData[currentEntry].allImages.length;
    currentImageIndex = (currentImageIndex + delta + imageCount) % imageCount;
    updateGalleryImage();
}

function navigateGalleryEntry(delta) {
    if (!currentEntry || !pokedexData[currentEntry]) {
        return;
    }

    const imgObj = pokedexData[currentEntry].allImages[currentImageIndex];
    const entries = imgObj.entries;
    if (!entries || entries.length === 0) {
        return;
    }

    currentEntryIndex = (currentEntryIndex + delta + entries.length) % entries.length;
    updateDexEntry();
}

function closeGalleryModal() {
    cryRequestId++;
    stopCryPlayback();
    gallery.classList.add('hidden');
    document.body.classList.remove('gallery-open');
    currentEntry = null;
    availableCryOptions = [];
    selectedCryUrl = '';
    playCryButton.disabled = true;
    setCryStatus('');
}

// Event listeners
prevButton.addEventListener('click', () => {
    navigateGalleryImage(-1);
});

nextButton.addEventListener('click', () => {
    navigateGalleryImage(1);
});

prevDescriptionButton.addEventListener('click', () => {
    navigateGalleryEntry(-1);
});

nextDescriptionButton.addEventListener('click', () => {
    navigateGalleryEntry(1);
});

window.addEventListener('resize', () => {
    if (!gallery.classList.contains('hidden')) {
        updateDexEntryScrollHint();
    }
});

closeButton.addEventListener('click', () => {
    closeGalleryModal();
});

document.getElementById('spoiler-toggle').addEventListener('click', () => {
    showSpoilers = !showSpoilers;
    updateDexEntry();
    updateCryControls();
});

playCryButton.addEventListener('pointerdown', startCryHold);
playCryButton.addEventListener('pointermove', moveCryHold);
playCryButton.addEventListener('pointerup', finishCryHold);
playCryButton.addEventListener('pointercancel', cancelCryHold);
playCryButton.addEventListener('lostpointercapture', cancelCryHold);
playCryButton.addEventListener('click', event => {
    if (suppressCryClick) {
        event.preventDefault();
        suppressCryClick = false;
        return;
    }
    playSelectedCry();
});
playCryButton.addEventListener('keydown', event => {
    if (event.key === 'ArrowDown' && openCryVersionMenu()) {
        event.preventDefault();
        cryVersionMenu.querySelector('.cry-version-option')?.focus();
    }
});
cryVersionMenu.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        closeCryVersionMenu();
        playCryButton.focus();
    } else if (event.key.startsWith('Arrow')) {
        event.preventDefault();
        event.stopPropagation();
        if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            const options = Array.from(cryVersionMenu.querySelectorAll('.cry-version-option'));
            const currentIndex = options.indexOf(document.activeElement);
            const direction = event.key === 'ArrowRight' ? 1 : -1;
            options[(currentIndex + direction + options.length) % options.length]?.focus();
        }
    }
});

gallery.addEventListener('click', (event) => {
    if (event.target === gallery) {
        closeGalleryModal();
    }
});

// Keyboard navigation for gallery
document.addEventListener('keydown', (event) => {
    if (gallery.classList.contains('hidden')) return;

    const isCtrlOrMeta = event.ctrlKey || event.metaKey;

    if (isCtrlOrMeta && event.key === 'ArrowLeft') {
        event.preventDefault();
        navigateGalleryEntry(-1);
    } else if (isCtrlOrMeta && event.key === 'ArrowRight') {
        event.preventDefault();
        navigateGalleryEntry(1);
    } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        navigateGalleryEntry(-1);
    } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        navigateGalleryEntry(1);
    } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        navigateGalleryImage(-1);
    } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        navigateGalleryImage(1);
    } else if (event.key === 'Escape') {
        event.preventDefault();
        closeGalleryModal();
    }
});

// Fixes issue 11
// Fixes issue 12
// Initialize
loadData();
