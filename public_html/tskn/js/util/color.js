const SOURCE_COLORS_500 = [
    '#f44336',
    '#e91e63',
    '#9c27b0',
    '#673ab7',
    '#3f51b5',
    '#2196f3',
    '#03a9f4',
    '#00bcd4',
    '#009688',
    '#4caf50',
    '#8bc34a',
    '#cddc39',
    '#ffeb3b',
    '#ffc107',
    '#ff9800',
    '#ff5722'
];

const SOURCE_COLORS_400 = [
    '#ef5350',
    '#ec407a',
    '#ab47bc',
    '#7e57c2',
    '#5c6bc0',
    '#42a5f5',
    '#29b6f6',
    '#26c6da',
    '#26a69a',
    '#66bb6a',
    '#9ccc65',
    '#d4e157',
    '#ffee58',
    '#ffca28',
    '#ffa726',
    '#ff7043'
];

/**
 * @param {Array} [sourceColors]
 * @returns {Array}
 */
const generatePalette = (sourceColors) => {
    const step = 4;
    const palette = [];
    let p = 0;
    let r = 0;
    palette.push(sourceColors[p]);
    for (let i = 1; i < sourceColors.length; i++) {
        p = p + step + 1;
        if (p >= sourceColors.length) {
            r++;
            p = (step + 1) - r;
        }
        palette.push(sourceColors[p]);
    }
    return palette;
}

/**
 * @returns {Array}
 */
const getPalette = () => {
    return palette;
}

/**
 * @param {string} [currentColor]
 * @returns {string}
 */
export const getNextColorOf = (currentColor = null) => {
    console.log('getting next color of:', currentColor);

    if (currentColor === null) {
        return palette[0];
    }

    const matchedIndex = palette.indexOf(currentColor.toLowerCase());
    if (matchedIndex === -1) {
        return palette[0];
    } else {
        return palette[(matchedIndex + 1) % palette.length];
    }
}

export const getNewColor = (fromColor = null) => {
    return getNextColorOf(fromColor);
};

export const getRandomColor = () => {
    return palette[Math.floor(Math.random() * palette.length)];
};

const palette = generatePalette(SOURCE_COLORS_500);

/*
export const Color = {
    getPalette,
    getNextColorOf
};
*/