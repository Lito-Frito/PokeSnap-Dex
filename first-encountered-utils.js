function getFirstEncounteredLabel(encounters, imageIndex) {
    if (!Array.isArray(encounters) || !Number.isInteger(imageIndex) || imageIndex < 0) {
        return '???';
    }

    const value = encounters[imageIndex];
    return typeof value === 'string' && value.trim() ? value.trim() : '???';
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { getFirstEncounteredLabel };
} else {
    globalThis.FirstEncounteredUtils = { getFirstEncounteredLabel };
}
