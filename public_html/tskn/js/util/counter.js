/**
 * @param {number} toNumber
 * @param {number} fromNumber
 * @param {number} duration
 * @param {Function} callback
 */
export const animateCounter = (toNumber, fromNumber = 0, duration = 1000, callback = (count) => {}) => {
    if (Number.isNaN(toNumber) || Number.isNaN(fromNumber)) {
        throw new TypeError('Invalid number(s)');
    }
    if (!Number.isFinite(toNumber) || !Number.isFinite(fromNumber)) {
        throw new RangeError('Infinite number(s)');
    }
    if (Number.isNaN(duration) || !Number.isFinite(duration)) {
        throw new TypeError('Invalid duration');
    }
    if (duration < 0) {
        throw new TypeError('Negative duration');
    }
    if (typeof callback !== 'function') {
        throw new TypeError('Uncallable callback');
    }

    const start = Math.floor(fromNumber);
    const end = Math.floor(toNumber);
    const range = end - start;
    const startTime = new Date().getTime();
    const endTime = startTime + duration;
    const interval = Math.abs(Math.floor(duration / range));
    const timer = setInterval(() => {
        const now = new Date().getTime();
        const remaining = Math.max((endTime - now) / duration, 0);
        const count = Math.round(end - (remaining * range));
        callback(count);
        if (count === end) clearInterval(timer);

    }, interval);
};