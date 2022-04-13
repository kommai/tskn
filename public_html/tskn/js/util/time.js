import { roundFloat } from './math.js';

/**
 * Converts seconds to minutes.
 * @param {number} value
 * @return {number}
 */
export const secondsToMinutes = (value) => {
    return value / 60;
};

/**
 * Converts minutes to seconds.
 * @param {number} value
 * @return {number}
 */
export const minutesToSeconds = (value) => {
    return value * 60;
};

/**
 * Converts seconds to hours.
 * @param {number} value
 * @return {number}
 */
export const secondsToHours = (value) => {
    return value / 3600;
};

/**
 * Converts hours to seconds.
 * @param {number} value
 * @return {number}
 */
export const hoursToSeconds = (value) => {
    return value * 3600;
};

/**
 * Converts seconds to days.
 * @param {number} value
 * @return {number}
 */
export const secondsToDays = (value) => {
    return value / 86400;
};

/**
 * Converts days to seconds.
 * @param {number} value
 * @return {number}
 */
export const daysToSeconds = (value) => {
    return value * 86400;
};

/**
 * Converts seconds to a value/unit pair.
 * @param {number} value
 * @param {number} precision
 * @return {Array}
 */
export const secondsToValueUnit = (value, precision = 0) => {
    /*
    if (value >= daysToSeconds(1)) {
        return [
            roundFloat(secondsToDays(value), precision),
            '日'
        ];
    }
    */
    if (value >= hoursToSeconds(1)) {
        return [
            roundFloat(secondsToHours(value), precision),
            '時間'
        ];
    }
    return [
        Math.round(secondsToMinutes(value)),
        '分'
    ];
};