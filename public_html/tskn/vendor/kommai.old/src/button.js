const verifyElement = (element) => {
    if (
        !(element instanceof HTMLButtonElement) ||
        !element.matches('.kc.button')
    ) throw new Error('Invalid element');
};

const enable = (element) => {
    verifyElement(element);
    //console.log('enabling:', element);
    if (element instanceof HTMLButtonElement) element.disabled = false;
    element.classList.remove('disabled');
};

const disable = (element) => {
    verifyElement(element);
    //console.log('disabling:', element);
    if (element instanceof HTMLButtonElement) element.disabled = true;
    element.classList.add('disabled');
};

export const Button = {
    enable,
    disable
};
