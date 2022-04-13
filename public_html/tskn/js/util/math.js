/**
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export const getRandomInt = (min, max) => {
    return Math.floor(Math.random() * (max + 1 - min)) + min;
};

/**
 * @param {number} value
 * @param {number} digits
 * @returns {number}
 */
export const roundFloat = (value, digits) => {
    if (digits < 0) {
        throw new TypeError('Digits cannot be negative');
    }
    if (digits === 0) {
        return Math.round(value);
    }
    return Math.round(value * Math.pow(10, digits)) / Math.pow(10, digits);
};
