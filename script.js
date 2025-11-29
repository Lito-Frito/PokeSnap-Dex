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
        if (pokedexData[num].variants && pokedexData[num].variants.some(v => v.image)) {
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

// Theme toggle
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
    themeToggle.textContent = document.body.classList.contains('dark-mode') ? 'Toggle Light Mode' : 'Toggle Dark Mode';
});
themeToggle.textContent = 'Toggle Light Mode'; // Since starts dark

// Render the grid
function renderDex() {
    console.log('Rendering dex...');
    for (let i = 1; i <= 1025; i++) {  // All generations up to Paldea
        const number = i.toString().padStart(3, '0');
        const entryDiv = document.createElement('div');
        entryDiv.className = 'entry';
        entryDiv.dataset.number = number;

        const firstWithImage = pokedexData[number].variants.findIndex(v => v.image);
        if (pokedexData[number] && pokedexData[number].variants.length > 0 && firstWithImage !== -1) {
            const img = document.createElement('img');
            img.src = pokedexData[number].variants[firstWithImage].image;
            img.alt = `${pokedexData[number].name} - ${pokedexData[number].variants[firstWithImage].label}`;
            img.style.objectPosition = pokedexData[number].variants[firstWithImage].position || 'center';
            img.style.objectFit = pokedexData[number].variants[firstWithImage].fit || 'contain';
            if (pokedexData[number].variants[firstWithImage].fit === 'contain') {
                // entryDiv.style.backgroundColor = document.body.classList.contains('dark-mode') ? '#555' : '#ddd';
            }
            entryDiv.appendChild(img);
            entryDiv.addEventListener('click', () => openGallery(number));
        } else {
            entryDiv.className += ' empty';
            entryDiv.textContent = number;
        }

        dexContainer.appendChild(entryDiv);
    }
    console.log('Dex rendered, total entries:', dexContainer.children.length);
}

// Open gallery for an entry
function openGallery(number) {
    currentEntry = number;
    const firstWithImage = pokedexData[number].variants.findIndex(v => v.image);
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
        galleryImage.style.objectFit = 'cover';
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
