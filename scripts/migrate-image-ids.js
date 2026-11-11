#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const ImageCollectionsUtils = require('../image-collections-utils.js');

function parseArgs(args) {
    const options = {
        dataFile: 'data.json',
        registryFile: 'images.json',
        datasetId: 'pokesnap-dex-main',
        backupRoot: '.data-backups'
    };
    for (let index = 0; index < args.length; index++) {
        const option = args[index];
        const value = args[index + 1];
        if (!value || value.startsWith('--')) {
            throw new Error(`Expected a value after ${option}.`);
        }
        if (option === '--data') {
            options.dataFile = value;
        } else if (option === '--registry') {
            options.registryFile = value;
        } else if (option === '--dataset-id') {
            options.datasetId = value;
        } else if (option === '--backup-root') {
            options.backupRoot = value;
        } else {
            throw new Error(`Unknown option "${option}".`);
        }
        index++;
    }
    return options;
}

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function ensureBackup(sourcePath, backupPath, bytes) {
    fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    if (fs.existsSync(backupPath)) {
        const existing = fs.readFileSync(backupPath);
        if (!existing.equals(bytes)) {
            throw new Error(`Refusing to overwrite non-matching backup: ${backupPath}`);
        }
        return;
    }
    fs.copyFileSync(sourcePath, backupPath, fs.constants.COPYFILE_EXCL);
}

function writeTemporary(filePath, contents) {
    const temporaryPath = `${filePath}.tmp-${process.pid}-${crypto.randomUUID()}`;
    fs.writeFileSync(temporaryPath, contents, { flag: 'wx' });
    return temporaryPath;
}

function stringifyPokemonData(data) {
    const entries = Object.entries(data).sort(([first], [second]) => Number(first) - Number(second));
    const serializedEntries = entries.map(([number, pokemon]) => {
        const serializedPokemon = JSON.stringify(pokemon, null, 2)
            .split('\n')
            .map(line => `  ${line}`)
            .join('\n');
        return `  ${JSON.stringify(number)}: ${serializedPokemon}`;
    });
    return `{\n${serializedEntries.join(',\n')}\n}\n`;
}

function migrate(options) {
    const dataBytes = fs.readFileSync(options.dataFile);
    const registryBytes = fs.existsSync(options.registryFile)
        ? fs.readFileSync(options.registryFile)
        : null;
    const pokemonData = JSON.parse(dataBytes.toString('utf8'));
    const existingRegistry = registryBytes ? JSON.parse(registryBytes.toString('utf8')) : null;
    const alreadyMigrated = Boolean(
        existingRegistry &&
        existingRegistry._meta &&
        existingRegistry._meta.datasetId === options.datasetId &&
        existingRegistry._meta.dataSchemaVersion === ImageCollectionsUtils.DATA_SCHEMA_VERSION
    );

    const { pokemonData: migratedData, imageRegistry } = ImageCollectionsUtils.migratePokemonData(
        pokemonData,
        existingRegistry,
        options.datasetId,
        () => crypto.randomUUID()
    );
    const dataContents = ImageCollectionsUtils.stringifyPokemonData(migratedData);
    if (alreadyMigrated && dataBytes.toString('utf8') === dataContents) {
        console.log(`Already migrated and validated ${options.datasetId}; existing image IDs were preserved.`);
        return;
    }

    const backupDirectory = path.join(options.backupRoot, options.datasetId);
    if (!alreadyMigrated) {
        ensureBackup(
            options.dataFile,
            path.join(backupDirectory, path.basename(options.dataFile)),
            dataBytes
        );
        if (registryBytes) {
            ensureBackup(
                options.registryFile,
                path.join(backupDirectory, path.basename(options.registryFile)),
                registryBytes
            );
        }
    }

    const dataTemporaryPath = writeTemporary(options.dataFile, dataContents);
    const registryTemporaryPath = writeTemporary(options.registryFile, `${JSON.stringify(imageRegistry, null, 2)}\n`);
    try {
        fs.renameSync(registryTemporaryPath, options.registryFile);
        fs.renameSync(dataTemporaryPath, options.dataFile);
    } catch (error) {
        for (const temporaryPath of [dataTemporaryPath, registryTemporaryPath]) {
            if (fs.existsSync(temporaryPath)) {
                fs.unlinkSync(temporaryPath);
            }
        }
        throw new Error(`Migration write failed; original files are backed up in ${backupDirectory}: ${error.message}`);
    }

    const imageCount = Object.keys(imageRegistry.images).length;
    console.log(`${alreadyMigrated ? 'Normalized' : 'Migrated'} ${Object.keys(migratedData).length} Pokédex entries to image IDs.`);
    console.log(`Registered ${imageCount} unique image URLs in ${options.registryFile}.`);
    if (alreadyMigrated) {
        console.log('Existing image IDs were preserved; pre-migration backups were left untouched.');
    } else {
        console.log(`Pre-migration files backed up to ${backupDirectory} (gitignored; copy backups off-device for disaster recovery).`);
    }
}

if (require.main === module) {
    try {
        migrate(parseArgs(process.argv.slice(2)));
    } catch (error) {
        console.error(`Image-ID migration failed: ${error.message}`);
        process.exitCode = 1;
    }
}

module.exports = { migrate, parseArgs };
