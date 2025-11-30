/**
 * PhotoDex - A Pokémon AR Photo Collection App
 *
 * Overview:
 * This is a web-based PhotoDex clone inspired by Pokémon GO's AR photo feature.
 * It displays a grid of 1025 Pokémon (Gen 1-9) with variants (base, shiny, regional, etc.).
 * Users can view captured Pokémon, browse galleries, and toggle themes.
 *
 * Key Features:
 * - Grid view: Shows first available real image variant per Pokémon (ignores placeholders).
 * - Capture count: Counts only Pokémon with at least one real image (not placeholders).
 * - Gallery: Modal view with variant navigation (keyboard: arrows, escape).
 * - Responsive design: Adapts to mobile with dynamic grid sizing.
 * - Theme toggle: Dark/light mode.
 * - Data integrity: 1025 entries, no duplicates, proper naming.
 *
 * Data Structure (data.json):
 * - Keys: '001' to '1025' (Pokémon numbers).
 * - Each entry: { name: string, variants: [{ label: string, image: url }] }
 * - Placeholders: "https://your-image-url-here.jpg" for missing images.
 *
 * Branches:
 * - main/Public: Placeholder images for public demo.
 * - LitoFrito: Real image URLs for personal use.
 *
 * Notes for Future Development:
 * - Ensure capture count excludes placeholders.
 * - Grid/gallery use findIndex for first real image variant.
 * - Run tests (node test.js) for data integrity.
 * - Mobile: CSS grid with auto-fit and min-width.
 */

// Load data from JSON
let pokedexData = {};

async function loadData() {
  console.log('Starting to load data...');
  try {
    const response = await fetch('data.json');
    console.log('Fetch response:', response);
    pokedexData = await response.json();
    console.log('Data loaded:', Object.keys(pokedexData).length, 'entries');
    let capturedCount = 0;
    for (let num in pokedexData) {
        if (pokedexData[num].variants && pokedexData[num].variants.some(v => v.image && v.image !== "https://your-image-url-here.jpg")) {
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
const prevButton = document.getElementById('prev-variant');
const nextButton = document.getElementById('next-variant');
const closeButton = document.getElementById('close-gallery');

let currentEntry = null;
let currentVariantIndex = 0;
let showAll = false;

// Theme toggle
const themeToggle = document.getElementById('theme-toggle');
const searchInput = document.getElementById('search-input');
const capturedCountBtn = document.getElementById('captured-count');
const capturedModal = document.getElementById('captured-modal');
const capturedList = document.getElementById('captured-list');
const closeCapturedModal = document.getElementById('close-captured-modal');
const toggleShowAll = document.getElementById('toggle-show-all');
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    themeToggle.textContent = document.body.classList.contains('dark-mode') ? 'Toggle Light Mode' : 'Toggle Dark Mode';
});
themeToggle.textContent = 'Toggle Light Mode'; // Since starts dark

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
        const firstWithImage = pokedexData[number].variants.findIndex(v => v.image && v.image !== "https://your-image-url-here.jpg");
        if (firstWithImage !== -1) {
            const li = document.createElement('li');
            li.textContent = `${number}: ${pokedexData[number].name}`;
            li.style.cursor = 'pointer';
            li.addEventListener('click', () => {
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
        entry.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

// Render the grid
function renderDex() {
    console.log('Rendering dex...');
    for (let i = 1; i <= 1025; i++) {  // All generations up to Paldea
        const number = i.toString().padStart(3, '0');
        const entryDiv = document.createElement('div');
        entryDiv.className = 'entry';
        entryDiv.dataset.number = number;
        entryDiv.dataset.name = pokedexData[number].name;

        const firstWithImage = pokedexData[number].variants.findIndex(v => v.image && v.image !== "https://your-image-url-here.jpg");
        if (pokedexData[number] && pokedexData[number].variants.length > 0 && firstWithImage !== -1) {
            const img = document.createElement('img');
            img.src = pokedexData[number].variants[firstWithImage].image;
            img.alt = `${pokedexData[number].name} - ${pokedexData[number].variants[firstWithImage].label}`;
            img.style.objectPosition = pokedexData[number].variants[firstWithImage].position || 'center';
            img.style.objectFit = pokedexData[number].variants[firstWithImage].fit || 'contain';
            img.onerror = () => {
                img.style.display = 'none';
                entryDiv.textContent = pokedexData[number].name;
                entryDiv.classList.add('empty');
            };
            if (pokedexData[number].variants[firstWithImage].fit === 'contain') {
                // entryDiv.style.backgroundColor = document.body.classList.contains('dark-mode') ? '#555' : '#ddd';
            }
            entryDiv.appendChild(img);
            entryDiv.addEventListener('click', () => openGallery(number));
        } else {
            entryDiv.className += ' empty';
            entryDiv.textContent = pokedexData[number].name;
        }

        dexContainer.appendChild(entryDiv);
    }
    console.log('Dex rendered, total entries:', dexContainer.children.length);
}

// Open gallery for an entry
function openGallery(number) {
    currentEntry = number;
    const firstWithImage = pokedexData[number].variants.findIndex(v => v.image && v.image !== "https://your-image-url-here.jpg");
    currentVariantIndex = firstWithImage !== -1 ? firstWithImage : 0;
    updateGalleryImage();
    gallery.classList.remove('hidden');
}

// Update gallery image
function updateGalleryImage() {
    if (currentEntry && pokedexData[currentEntry]) {
        galleryImage.src = pokedexData[currentEntry].variants[currentVariantIndex].image;
        galleryImage.alt = `${pokedexData[currentEntry].name} - ${pokedexData[currentEntry].variants[currentVariantIndex].label}`;
        galleryImage.style.objectPosition = pokedexData[currentEntry].variants[currentVariantIndex].position || 'center';
        galleryImage.style.objectFit = pokedexData[currentEntry].variants[currentVariantIndex].fit || 'contain';
        if (pokedexData[currentEntry].variants[currentVariantIndex].fit === 'contain') {
            galleryImage.style.backgroundColor = '#000';
        } else {
            galleryImage.style.backgroundColor = '';
        }
    }
}

// Event listeners
prevButton.addEventListener('click', () => {
    if (currentEntry) {
        currentVariantIndex = (currentVariantIndex - 1 + pokedexData[currentEntry].variants.length) % pokedexData[currentEntry].variants.length;
        updateGalleryImage();
    }
});

nextButton.addEventListener('click', () => {
    if (currentEntry) {
        currentVariantIndex = (currentVariantIndex + 1) % pokedexData[currentEntry].variants.length;
        updateGalleryImage();
    }
});

closeButton.addEventListener('click', () => {
    gallery.classList.add('hidden');
    currentEntry = null;
});

gallery.addEventListener('click', (event) => {
    if (event.target === gallery) {
        gallery.classList.add('hidden');
        currentEntry = null;
    }
});

// Keyboard navigation for gallery
document.addEventListener('keydown', (event) => {
    if (gallery.classList.contains('hidden')) return;

    if (event.key === 'ArrowLeft') {
        event.preventDefault();
        if (currentEntry) {
            currentVariantIndex = (currentVariantIndex - 1 + pokedexData[currentEntry].variants.length) % pokedexData[currentEntry].variants.length;
            updateGalleryImage();
        }
    } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        if (currentEntry) {
            currentVariantIndex = (currentVariantIndex + 1) % pokedexData[currentEntry].variants.length;
            updateGalleryImage();
        }
    } else if (event.key === 'Escape') {
        event.preventDefault();
        gallery.classList.add('hidden');
        currentEntry = null;
    }
});

// Initialize
loadData();
