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

function getEntriesForVariant(number, variantLabel) {
    const speciesEntries = dexEntriesByNumber[number];
    if (!speciesEntries) {
        return [];
    }

    if (Array.isArray(speciesEntries)) {
        return speciesEntries.map(normalizeEntryItem);
    }

    if (speciesEntries.variants && Array.isArray(speciesEntries.variants[variantLabel])) {
        return speciesEntries.variants[variantLabel].map(normalizeEntryItem);
    }

    if (speciesEntries.variantsGrouped && Array.isArray(speciesEntries.variantsGrouped[variantLabel])) {
        return speciesEntries.variantsGrouped[variantLabel].map(normalizeEntryItem);
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
        const [response, entriesResponse] = await Promise.all([
            fetch('data.json'),
            fetch('data-entries.json')
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

let currentEntry = null;
let currentImageIndex = 0;
let currentEntryIndex = 0;
let showAll = false;

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
        dexEntry.innerHTML = '';

        if (entries && entries.length > 0) {
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
        } else {
            dexEntry.innerHTML = '';
        }

        requestAnimationFrame(updateDexEntryScrollHint);
    }
}

// Theme toggle with persistence
const themeToggle = document.getElementById('theme-toggle');
const searchInput = document.getElementById('search-input');
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

// Search functionality
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const entries = dexContainer.querySelectorAll('.entry');
    let visibleCount = 0;
    entries.forEach(entry => {
        const name = entry.dataset.name.toLowerCase();
        if (name.includes(query)) {
            entry.style.display = '';
            visibleCount++;
        } else {
            entry.style.display = 'none';
        }
    });
    if (visibleCount <= 2) {
        dexContainer.classList.add('flex-layout');
        dexContainer.classList.remove('grid-layout');
    } else {
        dexContainer.classList.add('grid-layout');
        dexContainer.classList.remove('flex-layout');
    }
});

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
        entryDiv.className = 'entry';
        entryDiv.dataset.number = number;
        entryDiv.dataset.name = entryData.name;

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
    console.log('Dex rendered, total entries:', dexContainer.children.length);
}

// Open gallery for an entry
function openGallery(number, imgIndex) {
    currentEntry = number;
    currentImageIndex = imgIndex;
    currentEntryIndex = 0;
    document.body.classList.add('gallery-open');
    updateGalleryImage();
    gallery.classList.remove('hidden');
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
    gallery.classList.add('hidden');
    document.body.classList.remove('gallery-open');
    currentEntry = null;
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
