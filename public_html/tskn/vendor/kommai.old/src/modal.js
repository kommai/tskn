//import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock';
import { disableBodyScroll, enableBodyScroll } from '../../body-scroll-lock/lib/bodyScrollLock.es6.js';

export const Modal = (() => {

    //const elementOptionMaps = [];
    const elementOptionMap = new WeakMap();


    const verifyElement = (element) => {
        if (
            !(element instanceof HTMLElement) ||
            !element.matches('.kc.modal')
        ) throw new Error('Invalid element');
    };
    const open = (element, options = {}) => {
        console.log('opeing modal... options:', options);
        verifyElement(element);
        return new Promise((resolve) => {
            elementOptionMap.set(element, options);
            const dialog = element.querySelector('.dialog');
            const dialogHeight = dialog.getBoundingClientRect().height;
            dialog.style.top = `${Math.ceil(dialogHeight) * -1}px`;
            dialog.style.transform = `translateY(${Math.floor(dialogHeight)}px)`;

            const dialogContent = dialog.querySelector('.content');
            dialogContent.scrollTop = 0;
            disableBodyScroll(dialogContent);

            elementOptionMap.get(element)?.beforeOpen?.();
            element.classList.add('opened');
            element.addEventListener('transitionend', () => {
                element.querySelector('.backdrop').addEventListener('click', () => {
                    close(element);
                }, { once: true });
                resolve();
            }, { once: true });
        });
    };
    const close = (element) => {
        console.log('closing modal...');
        verifyElement(element);
        return new Promise((resolve) => {
            const dialog = element.querySelector('.dialog');
            dialog.style.transform = 'translateY(0)';

            const dialogContent = dialog.querySelector('.content');
            enableBodyScroll(dialogContent);

            elementOptionMap.get(element)?.beforeClose?.();
            element.classList.remove('opened');
            element.addEventListener('transitionend', () => {
                resolve();
            }, { once: true });
        });
    };
    return {
        open,
        close,
    };
})();
