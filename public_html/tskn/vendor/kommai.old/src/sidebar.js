//import { disableBodyScroll, enableBodyScroll } from 'body-scroll-lock';
import { disableBodyScroll, enableBodyScroll } from '../../body-scroll-lock/lib/bodyScrollLock.es6.js';

if (document.querySelectorAll('.kc.sidebar').length > 1) throw new Error('Only one sidebar element is allowed');

const root = document.querySelector('.kc.sidebar');
if (!root) throw new Error('The sidebar element is missing');

const body = root.querySelector('.items');
const closer = root.querySelector('.closer');

const open = () => {
    return new Promise((resolve) => {
        console.log('opening sidebar...');
        disableBodyScroll(body);
        root.classList.add('opened');
        root.addEventListener('transitionend', () => {
            closer.addEventListener('click', close, { once: true });
            resolve();
        }, { once: true });
    });
};

const close = () => {
    return new Promise((resolve) => {
        console.log('closing sidebar...');
        enableBodyScroll(body);
        root.classList.remove('opened');
        root.addEventListener('transitionend', () => {
            body.addEventListener('click', open, { once: true });
            resolve();
        }, { once: true });
    });
};

const init = () => {
    console.log('init sidebar');
};

init();

body.addEventListener('click', open, { once: true });

export const Sidebar = {
    open,
    close
};