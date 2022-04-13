const root = document.querySelector('.kc.blocker');
if (!root) throw new Error('The blobker element is missing');

const open = () => {
    return new Promise((resolve) => {
        console.log('opeing blocker...');
        root.classList.add('opened');
        resolve();
    });
};

const close = () => {
    return new Promise((resolve) => {
        console.log('closing blocker...');
        root.classList.remove('opened');
        resolve();
    });
};

export const Blocker = {
    open,
    close
};