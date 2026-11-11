#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const ImageCollectionsUtils = require('../image-collections-utils.js');

function parseArgs(args) {
    const options = {};
    for (let index = 0; index < args.length; index++) {
        const key = args[index];
        const value = args[index + 1];
        if (!value || value.startsWith('--')) {
            throw new Error(`Expected a value after ${key}.`);
        }
        const optionNames = {
            '--number': 'number',
            '--label': 'label',
            '--url': 'url',
            '--first-encountered': 'firstEncountered',
            '--data': 'dataFile',
            '--registry': 'registryFile'
        };
        if (!optionNames[key]) {
            throw new Error(`Unknown option "${key}".`);
        }
        options[optionNames[key]] = value;
        index++;
    }
    for (const required of ['number', 'label', 'url']) {
        if (!options[required]) {
            throw new Error(`Missing required option --${required}.`);
        }
    }
    options.dataFile = options.dataFile || 'data.json';
    options.registryFile = options.registryFile || 'images.json';
    if (!/^\d{3,4}$/.test(options.number)) {
        throw new Error('Pokédex number must contain three or four digits.');
    }
    return options;
}

function writeTemporary(filePath, contents) {
    const temporaryPath = `${filePath}.tmp-${process.pid}-${crypto.randomUUID()}`;
    fs.writeFileSync(temporaryPath, contents, { flag: 'wx' });
    return temporaryPath;
}

function addImage(options) {
    const pokemonData = JSON.parse(fs.readFileSync(options.dataFile, 'utf8'));
    const imageRegistry = JSON.parse(fs.readFileSync(options.registryFile, 'utf8'));
    const result = ImageCollectionsUtils.addImageReference(
        pokemonData,
        imageRegistry,
        options.number,
        options.label,
        options.url,
        options.firstEncountered
    );
    const dataTemporaryPath = writeTemporary(
        options.dataFile,
        ImageCollectionsUtils.stringifyPokemonData(result.pokemonData)
    );
    const registryTemporaryPath = writeTemporary(
        options.registryFile,
        `${JSON.stringify(result.imageRegistry, null, 2)}\n`
    );
    try {
        fs.renameSync(registryTemporaryPath, options.registryFile);
        fs.renameSync(dataTemporaryPath, options.dataFile);
    } catch (error) {
        for (const temporaryPath of [dataTemporaryPath, registryTemporaryPath]) {
            if (fs.existsSync(temporaryPath)) {
                fs.unlinkSync(temporaryPath);
            }
        }
        throw new Error(`Could not save image data: ${error.message}`);
    }
    console.log(`Added ${options.number} ${options.label} image as ${result.imageId}.`);
    console.log(`If this image belongs in a published collection, use the ID ${result.imageId} in collections.json.`);
}

if (require.main === module) {
    try {
        addImage(parseArgs(process.argv.slice(2)));
    } catch (error) {
        console.error(`Could not add image: ${error.message}`);
        process.exitCode = 1;
    }
}

module.exports = { addImage, parseArgs };
