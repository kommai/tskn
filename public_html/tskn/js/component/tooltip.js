if (typeof tippy !== 'function') {
    throw new ReferenceError('tippy is not loaded');
}

const tippyProps = {
    //trigger: 'focus',
    trigger: 'manual',
    hideOnClick: false,
    placement: 'bottom',
    theme: 'error',
    animation: 'fade',
    duration: 250,
    //showOnCreate: true,
};

const elementTippyMap = new Map();

const show = (element, message) => {


    if (elementTippyMap.has(element)) {
        const tippyInstance = elementTippyMap.get(element);
        if (tippyInstance.props.content === message) {
            console.warn('identical message');
            tippyInstance.show();
            return;
        }
        destroy(element);
    }

    const newTippyInstance = tippy(element, {
        ...tippyProps,
        content: message,
    });
    newTippyInstance.show();
    elementTippyMap.set(element, newTippyInstance);



    /*
    if (elementTippyMap.has(element)) {
        console.warn('tippy has already been attached:', elementTippyMap.get(element));
        destroy(element);
    }
    const tippyInstance = tippy(element, {
        ...tippyProps,
        content: message,
    });
    elementTippyMap.set(element, tippyInstance);
    console.log('element-tippy map:', elementTippyMap);
    setTimeout(() => {
        tippyInstance.props.content = 'ALL YOUR BASE ARE BELONG TO US'; // This has no VISIBLE effect. To change its content, you have to re-create a tippy instance
    }, 500);
    */
};

const hide = (element) => {
    // TODO: round up this part -> getTippyInstance()
    if (!elementTippyMap.has(element)) {
        return;
    }
    const tippyInstance = elementTippyMap.get(element);
    tippyInstance.hide();
};

const destroy = (element) => {
    if (!elementTippyMap.has(element)) {
        return;
    }
    const tippyInstance = elementTippyMap.get(element);
    tippyInstance.destroy();
    elementTippyMap.delete(element);
};

const destroyAll = () => {
    for (const [, tippyInstance] of elementTippyMap) {
        tippyInstance.destroy();
    }
    elementTippyMap.clear();
    console.log('all tippy instances destroyed:', elementTippyMap);
};

export const Tooltip = {
    show,
    hide,
    destroy,
    destroyAll,
};
