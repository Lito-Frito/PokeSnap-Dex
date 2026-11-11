(function (root, factory) {
    const api = factory();
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = api;
    } else {
        root.ImageCollectionsUtils = api;
    }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    const IMAGE_REGISTRY_SCHEMA_VERSION = 1;
    const DATA_SCHEMA_VERSION = 2;
    const COLLECTIONS_SCHEMA_VERSION = 1;
    const MAX_COLLECTION_DIMENSION = 5;

    function validateImageRegistry(registry) {
        if (!registry || typeof registry !== 'object' ||
            !registry._meta || registry._meta.schemaVersion !== IMAGE_REGISTRY_SCHEMA_VERSION ||
            registry._meta.dataSchemaVersion !== DATA_SCHEMA_VERSION ||
            typeof registry._meta.datasetId !== 'string' || !registry._meta.datasetId.trim() ||
            !registry.images || typeof registry.images !== 'object' || Array.isArray(registry.images)) {
            throw new Error('Image registry metadata or images map is invalid.');
        }

        for (const [id, image] of Object.entries(registry.images)) {
            if (!id || !image || typeof image.url !== 'string' || !image.url.trim()) {
                throw new Error(`Image registry entry "${id}" needs a URL.`);
            }
        }
        return registry;
    }

    function validatePokemonImageReferences(pokemonData, registry) {
        validateImageRegistry(registry);
        const ids = new Set(Object.keys(registry.images));
        let count = 0;
        for (const [number, pokemon] of Object.entries(pokemonData)) {
            if (!/^\d{3,4}$/.test(number) || !pokemon || !Array.isArray(pokemon.variants)) {
                throw new Error(`Pokédex entry "${number}" is invalid.`);
            }
            for (const variant of pokemon.variants) {
                if (!Array.isArray(variant.images)) {
                    throw new Error(`${number} ${variant.label || 'variant'} must have an images array.`);
                }
                for (const id of variant.images) {
                    if (typeof id !== 'string' || !ids.has(id)) {
                        throw new Error(`${number} ${variant.label || 'variant'} references missing image ID "${id}".`);
                    }
                    count++;
                }
            }
        }
        return count;
    }

    function getCollectionAudioPlayback(audioUrl) {
        if (audioUrl === null || audioUrl === undefined || audioUrl === '') {
            return null;
        }
        let parsed;
        try {
            parsed = new URL(audioUrl);
        } catch {
            throw new Error('Collection audio must be a valid URL.');
        }
        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
            throw new Error('Collection audio URL must use HTTP or HTTPS.');
        }

        if (parsed.hostname === 'open.spotify.com') {
            const trackMatch = parsed.pathname.match(/^\/track\/([A-Za-z0-9]+)\/?$/);
            if (!trackMatch) {
                throw new Error('Spotify audio links must point to a track.');
            }
            return {
                type: 'spotify',
                src: `https://open.spotify.com/embed/track/${trackMatch[1]}`
            };
        }

        if (['soundcloud.com', 'www.soundcloud.com', 'm.soundcloud.com', 'on.soundcloud.com'].includes(parsed.hostname)) {
            return {
                type: 'soundcloud',
                oembedUrl: `https://soundcloud.com/oembed?${new URLSearchParams({
                    format: 'json',
                    url: parsed.href
                }).toString()}`
            };
        }

        return { type: 'audio', src: parsed.href };
    }

    async function resolveSoundCloudPlayerUrl(audioUrl, fetchImpl = globalThis.fetch) {
        const playback = getCollectionAudioPlayback(audioUrl);
        if (playback?.type !== 'soundcloud') {
            throw new Error('A SoundCloud URL is required to resolve its player.');
        }
        if (typeof fetchImpl !== 'function') {
            throw new Error('SoundCloud player resolution is unavailable in this browser.');
        }
        const response = await fetchImpl(playback.oembedUrl);
        if (!response.ok) {
            throw new Error(`SoundCloud could not resolve this link (HTTP ${response.status}).`);
        }
        const payload = await response.json();
        const source = typeof payload.html === 'string'
            ? payload.html.match(/<iframe\b[^>]*\bsrc=(?:"([^"]+)"|'([^']+)')/i)
            : null;
        if (!source) {
            throw new Error('SoundCloud did not return a playable track embed.');
        }
        let playerUrl;
        try {
            playerUrl = new URL((source[1] || source[2]).replace(/&amp;/g, '&'));
        } catch {
            throw new Error('SoundCloud returned an invalid player URL.');
        }
        if (playerUrl.protocol !== 'https:' ||
            playerUrl.hostname !== 'w.soundcloud.com' ||
            playerUrl.pathname !== '/player/') {
            throw new Error('SoundCloud returned an untrusted player URL.');
        }
        playerUrl.searchParams.set('auto_play', 'false');
        playerUrl.searchParams.set('visual', 'false');
        return playerUrl.href;
    }

    function stringifyPokemonData(pokemonData) {
        const entries = Object.entries(pokemonData).sort(([first], [second]) => Number(first) - Number(second));
        const serializedEntries = entries.map(([number, pokemon]) => {
            const serializedPokemon = JSON.stringify(pokemon, null, 2)
                .split('\n')
                .map(line => `  ${line}`)
                .join('\n');
            return `  ${JSON.stringify(number)}: ${serializedPokemon}`;
        });
        return `{\n${serializedEntries.join(',\n')}\n}\n`;
    }

    function migratePokemonData(pokemonData, existingRegistry, datasetId, idFactory) {
        if (!datasetId || typeof datasetId !== 'string') {
            throw new Error('A dataset ID is required.');
        }
        const createId = idFactory || (() => {
            if (!globalThis.crypto || typeof globalThis.crypto.randomUUID !== 'function') {
                throw new Error('Secure UUID generation is not available.');
            }
            return globalThis.crypto.randomUUID();
        });
        const matchingRegistry = existingRegistry &&
            existingRegistry._meta &&
            existingRegistry._meta.datasetId === datasetId
            ? existingRegistry
            : null;
        const urlsById = new Map();
        const idsByUrl = new Map();

        if (matchingRegistry) {
            for (const [id, image] of Object.entries(matchingRegistry.images || {})) {
                if (!image || typeof image.url !== 'string' || !image.url.trim()) {
                    throw new Error(`Existing image ID "${id}" does not have a URL.`);
                }
                urlsById.set(id, image.url);
                if (!idsByUrl.has(image.url)) {
                    idsByUrl.set(image.url, id);
                }
            }
        }

        const migratedData = {};
        for (const [number, pokemon] of Object.entries(pokemonData)) {
            const migratedPokemon = { ...pokemon };
            migratedPokemon.variants = (pokemon.variants || []).map(variant => {
                if (!Array.isArray(variant.images)) {
                    throw new Error(`${number} ${variant.label || 'variant'} must have an images array.`);
                }
                const imageIds = variant.images.map(imageOrId => {
                    if (typeof imageOrId !== 'string' || !imageOrId.trim()) {
                        throw new Error(`${number} ${variant.label || 'variant'} contains an invalid image reference.`);
                    }
                    if (matchingRegistry) {
                        if (urlsById.has(imageOrId)) {
                            return imageOrId;
                        }
                        if (!/^https?:\/\//i.test(imageOrId)) {
                            throw new Error(`${number} ${variant.label || 'variant'} references missing image ID "${imageOrId}".`);
                        }
                    } else if (!/^https?:\/\//i.test(imageOrId)) {
                        throw new Error(`${number} ${variant.label || 'variant'} contains an image ID without a matching dataset registry.`);
                    }

                    let id = idsByUrl.get(imageOrId);
                    if (!id) {
                        id = createId();
                        if (urlsById.has(id)) {
                            throw new Error(`Generated duplicate image ID "${id}".`);
                        }
                        urlsById.set(id, imageOrId);
                        idsByUrl.set(imageOrId, id);
                    }
                    return id;
                });
                return { ...variant, images: imageIds };
            });
            migratedData[number] = migratedPokemon;
        }

        const registry = {
            _meta: {
                schemaVersion: IMAGE_REGISTRY_SCHEMA_VERSION,
                dataSchemaVersion: DATA_SCHEMA_VERSION,
                datasetId,
                description: 'Stable image IDs mapped to the current URLs used to fetch each Dex image. Pokémon variants and collections reference IDs, not URLs or array positions.'
            },
            images: {}
        };
        for (const [id, url] of urlsById) {
            registry.images[id] = { url };
        }
        validatePokemonImageReferences(migratedData, registry);
        return { pokemonData: migratedData, imageRegistry: registry };
    }

    function addImageReference(pokemonData, imageRegistry, number, label, url, firstEncountered, idFactory) {
        validateImageRegistry(imageRegistry);
        const pokemon = pokemonData[number];
        if (!pokemon) {
            throw new Error(`Pokédex entry "${number}" was not found.`);
        }
        const variant = (pokemon.variants || []).find(item => item.label === label);
        if (!variant) {
            throw new Error(`Variant "${label}" was not found for ${pokemon.name}.`);
        }
        let parsedUrl;
        try {
            parsedUrl = new URL(url);
        } catch {
            throw new Error('Image URL must be a valid HTTP(S) URL.');
        }
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            throw new Error('Image URL must use HTTP or HTTPS.');
        }

        const urlToId = new Map(
            Object.entries(imageRegistry.images).map(([id, image]) => [image.url, id])
        );
        const createId = idFactory || (() => globalThis.crypto.randomUUID());
        const id = urlToId.get(url) || createId();
        if (!imageRegistry.images[id]) {
            imageRegistry.images[id] = { url };
        }
        if (variant.images.includes(id)) {
            throw new Error(`This image is already listed for ${pokemon.name} — ${label}.`);
        }

        const updatedData = { ...pokemonData, [number]: { ...pokemon } };
        const updatedPokemon = updatedData[number];
        updatedPokemon.variants = pokemon.variants.map(item => (
            item === variant ? { ...item, images: [...item.images, id] } : item
        ));
        if (firstEncountered !== undefined) {
            if (variant.firstEncountered !== undefined && !Array.isArray(variant.firstEncountered)) {
                throw new Error(`${pokemon.name} — ${label} has invalid firstEncountered metadata.`);
            }
            const existingIndex = pokemon.variants.indexOf(variant);
            const updatedVariant = updatedPokemon.variants[existingIndex];
            const encounters = variant.firstEncountered
                ? variant.firstEncountered.slice()
                : new Array(variant.images.length).fill(null);
            encounters.push(firstEncountered);
            updatedVariant.firstEncountered = encounters;
        }
        validatePokemonImageReferences(updatedData, imageRegistry);
        return { pokemonData: updatedData, imageRegistry, imageId: id };
    }

    function validateCollection(collection, imageRegistry, datasetId) {
        if (!collection || typeof collection !== 'object' || Array.isArray(collection)) {
            throw new Error('Collection must be an object.');
        }
        if (typeof collection.id !== 'string' || !collection.id.trim() || collection.id.length > 100) {
            throw new Error('Collection needs a valid ID.');
        }
        if (typeof collection.name !== 'string' || !collection.name.trim() || collection.name.trim().length > 100) {
            throw new Error('Collection name must be between 1 and 100 characters.');
        }
        const description = collection.description === undefined ? '' : collection.description;
        if (typeof description !== 'string' || description.length > 500) {
            throw new Error('Collection description must be 500 characters or fewer.');
        }
        const size = collection.size;
        if (!size || !Number.isInteger(size.x) || size.x < 1 || size.x > MAX_COLLECTION_DIMENSION ||
            !Number.isInteger(size.y) || size.y < 1 || size.y > MAX_COLLECTION_DIMENSION) {
            throw new Error(`Collection dimensions must each be between 1 and ${MAX_COLLECTION_DIMENSION}.`);
        }
        if (!Array.isArray(collection.cells) || collection.cells.length !== size.x * size.y) {
            throw new Error('Collection must have exactly one cell value for every grid position.');
        }
        if (collection.datasetId !== undefined && collection.datasetId !== datasetId) {
            throw new Error(`Collection "${collection.name}" was made for a different image dataset.`);
        }
        const knownImages = new Set(Object.keys(imageRegistry.images));
        collection.cells.forEach((imageId, index) => {
            if (imageId !== 'blank' && (typeof imageId !== 'string' || !knownImages.has(imageId))) {
                throw new Error(`Collection "${collection.name}" references unknown image ID "${imageId}" in cell ${index + 1}.`);
            }
        });
        const audioUrl = collection.audioUrl === undefined ? null : collection.audioUrl;
        try {
            getCollectionAudioPlayback(audioUrl);
        } catch (error) {
            throw new Error(`Collection "${collection.name}" audio URL is invalid: ${error.message}`);
        }

        return {
            id: collection.id.trim(),
            name: collection.name.trim(),
            description,
            size: { x: size.x, y: size.y },
            cells: collection.cells.slice(),
            audioUrl,
            datasetId
        };
    }

    function validateCollectionsFile(payload, imageRegistry) {
        validateImageRegistry(imageRegistry);
        if (!payload || !payload._meta ||
            payload._meta.schemaVersion !== COLLECTIONS_SCHEMA_VERSION ||
            payload._meta.datasetId !== imageRegistry._meta.datasetId ||
            !Array.isArray(payload.collections)) {
            throw new Error('Collections file metadata or collection list is invalid for this image dataset.');
        }
        const seenIds = new Set();
        const collections = payload.collections.map(collection => {
            const validated = validateCollection(collection, imageRegistry, payload._meta.datasetId);
            if (seenIds.has(validated.id)) {
                throw new Error(`Duplicate collection ID "${validated.id}".`);
            }
            seenIds.add(validated.id);
            return validated;
        });
        return { ...payload, collections };
    }

    function createCollectionsFile(datasetId, collections) {
        const payload = {
            _meta: {
                schemaVersion: COLLECTIONS_SCHEMA_VERSION,
                datasetId,
                description: 'Collection catalog. Collections reference stable image IDs from images.json.',
                cellOrder: 'Cells are listed row by row, left to right. Use "blank" for an empty black cell.',
                size: 'x is rows and y is columns. Each dimension is 1 through 5, with exactly x*y cell values.',
                audioUrl: 'Optional HTTP(S) URL. Playback must be started by the user.'
            },
            collections
        };
        return payload;
    }

    return {
        COLLECTIONS_SCHEMA_VERSION,
        DATA_SCHEMA_VERSION,
        IMAGE_REGISTRY_SCHEMA_VERSION,
        MAX_COLLECTION_DIMENSION,
        addImageReference,
        createCollectionsFile,
        getCollectionAudioPlayback,
        migratePokemonData,
        resolveSoundCloudPlayerUrl,
        stringifyPokemonData,
        validateCollection,
        validateCollectionsFile,
        validateImageRegistry,
        validatePokemonImageReferences
    };
}));
