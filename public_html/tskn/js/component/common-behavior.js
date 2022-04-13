/**
 * @param {HTMLElement} rootElement
 */
const show = (rootElement) => {
    rootElement.removeAttribute('hidden');
}

/**
 * @param {HTMLElement} rootElement
 */
const hide = (rootElement) => {
    rootElement.setAttribute('hidden', 'hidden');
}

export const CommonBehavior = {
    show,
    hide,
};