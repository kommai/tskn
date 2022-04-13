/**
 * @param {number} time
 * @returns {Promise}
 */
export const wait = (time = 0) => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve();
        }, time);
    });
};
