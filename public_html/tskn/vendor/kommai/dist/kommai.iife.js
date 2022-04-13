(function (exports) {
  'use strict';

  // Older browsers don't support event options, feature detect it.

  // Adopted and modified solution from Bohdan Didukh (2017)
  // https://stackoverflow.com/questions/41594997/ios-10-safari-prevent-scrolling-behind-a-fixed-overlay-and-maintain-scroll-posi

  let hasPassiveEvents = false;
  if (typeof window !== 'undefined') {
    const passiveTestOptions = {
      get passive() {
        hasPassiveEvents = true;
        return undefined;
      }
    };
    window.addEventListener('testPassive', null, passiveTestOptions);
    window.removeEventListener('testPassive', null, passiveTestOptions);
  }

  const isIosDevice = typeof window !== 'undefined' && window.navigator && window.navigator.platform && (/iP(ad|hone|od)/.test(window.navigator.platform) || window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1);


  let locks = [];
  let documentListenerAdded = false;
  let initialClientY = -1;
  let previousBodyOverflowSetting;
  let previousBodyPaddingRight;

  // returns true if `el` should be allowed to receive touchmove events.
  const allowTouchMove = el => locks.some(lock => {
    if (lock.options.allowTouchMove && lock.options.allowTouchMove(el)) {
      return true;
    }

    return false;
  });

  const preventDefault = rawEvent => {
    const e = rawEvent || window.event;

    // For the case whereby consumers adds a touchmove event listener to document.
    // Recall that we do document.addEventListener('touchmove', preventDefault, { passive: false })
    // in disableBodyScroll - so if we provide this opportunity to allowTouchMove, then
    // the touchmove event on document will break.
    if (allowTouchMove(e.target)) {
      return true;
    }

    // Do not prevent if the event has more than one touch (usually meaning this is a multi touch gesture like pinch to zoom).
    if (e.touches.length > 1) return true;

    if (e.preventDefault) e.preventDefault();

    return false;
  };

  const setOverflowHidden = options => {
    // If previousBodyPaddingRight is already set, don't set it again.
    if (previousBodyPaddingRight === undefined) {
      const reserveScrollBarGap = !!options && options.reserveScrollBarGap === true;
      const scrollBarGap = window.innerWidth - document.documentElement.clientWidth;

      if (reserveScrollBarGap && scrollBarGap > 0) {
        previousBodyPaddingRight = document.body.style.paddingRight;
        document.body.style.paddingRight = `${scrollBarGap}px`;
      }
    }

    // If previousBodyOverflowSetting is already set, don't set it again.
    if (previousBodyOverflowSetting === undefined) {
      previousBodyOverflowSetting = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
  };

  const restoreOverflowSetting = () => {
    if (previousBodyPaddingRight !== undefined) {
      document.body.style.paddingRight = previousBodyPaddingRight;

      // Restore previousBodyPaddingRight to undefined so setOverflowHidden knows it
      // can be set again.
      previousBodyPaddingRight = undefined;
    }

    if (previousBodyOverflowSetting !== undefined) {
      document.body.style.overflow = previousBodyOverflowSetting;

      // Restore previousBodyOverflowSetting to undefined
      // so setOverflowHidden knows it can be set again.
      previousBodyOverflowSetting = undefined;
    }
  };

  // https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollHeight#Problems_and_solutions
  const isTargetElementTotallyScrolled = targetElement => targetElement ? targetElement.scrollHeight - targetElement.scrollTop <= targetElement.clientHeight : false;

  const handleScroll = (event, targetElement) => {
    const clientY = event.targetTouches[0].clientY - initialClientY;

    if (allowTouchMove(event.target)) {
      return false;
    }

    if (targetElement && targetElement.scrollTop === 0 && clientY > 0) {
      // element is at the top of its scroll.
      return preventDefault(event);
    }

    if (isTargetElementTotallyScrolled(targetElement) && clientY < 0) {
      // element is at the bottom of its scroll.
      return preventDefault(event);
    }

    event.stopPropagation();
    return true;
  };

  const disableBodyScroll = (targetElement, options) => {
    // targetElement must be provided
    if (!targetElement) {
      // eslint-disable-next-line no-console
      console.error('disableBodyScroll unsuccessful - targetElement must be provided when calling disableBodyScroll on IOS devices.');
      return;
    }

    // disableBodyScroll must not have been called on this targetElement before
    if (locks.some(lock => lock.targetElement === targetElement)) {
      return;
    }

    const lock = {
      targetElement,
      options: options || {}
    };

    locks = [...locks, lock];

    if (isIosDevice) {
      targetElement.ontouchstart = event => {
        if (event.targetTouches.length === 1) {
          // detect single touch.
          initialClientY = event.targetTouches[0].clientY;
        }
      };
      targetElement.ontouchmove = event => {
        if (event.targetTouches.length === 1) {
          // detect single touch.
          handleScroll(event, targetElement);
        }
      };

      if (!documentListenerAdded) {
        document.addEventListener('touchmove', preventDefault, hasPassiveEvents ? { passive: false } : undefined);
        documentListenerAdded = true;
      }
    } else {
      setOverflowHidden(options);
    }
  };

  const enableBodyScroll = targetElement => {
    if (!targetElement) {
      // eslint-disable-next-line no-console
      console.error('enableBodyScroll unsuccessful - targetElement must be provided when calling enableBodyScroll on IOS devices.');
      return;
    }

    locks = locks.filter(lock => lock.targetElement !== targetElement);

    if (isIosDevice) {
      targetElement.ontouchstart = null;
      targetElement.ontouchmove = null;

      if (documentListenerAdded && locks.length === 0) {
        document.removeEventListener('touchmove', preventDefault, hasPassiveEvents ? { passive: false } : undefined);
        documentListenerAdded = false;
      }
    } else if (!locks.length) {
      restoreOverflowSetting();
    }
  };

  if (document.querySelectorAll('.kc.sidebar').length > 1) throw new Error('Only one sidebar element is allowed');

  const root$1 = document.querySelector('.kc.sidebar');
  //if (!root) throw new Error('The sidebar element is missing');

  //const body = root.querySelector('.items');
  //const closer = root.querySelector('.closer');

  // sidebar CAN BE OMITTED! remember this for the next version

  const open$1 = () => {
      // what a bad implementation!
      if (!root$1) throw new Error('The sidebar element is missing');
      const body = root$1.querySelector('.items');
      const closer = root$1.querySelector('.closer');
      return new Promise((resolve) => {
          console.log('opening sidebar...');
          disableBodyScroll(body);
          root$1.classList.add('awake');
          root$1.classList.add('opened');
          root$1.addEventListener('transitionend', () => {
              closer.addEventListener('click', close$1, { once: true });
              resolve();
          }, { once: true });
      });
  };

  const close$1 = () => {
      // what a bad implementation!
      if (!root$1) throw new Error('The sidebar element is missing');
      const body = root$1.querySelector('.items');
      root$1.querySelector('.closer');
      return new Promise((resolve) => {
          console.log('closing sidebar...');
          enableBodyScroll(body);
          root$1.classList.remove('opened');
          root$1.addEventListener('transitionend', () => {
              body.addEventListener('click', open$1, { once: true });
              resolve();
          }, { once: true });
      });
  };

  //init();
  if (root$1) {
      // bad implementation!
      const body = root$1.querySelector('.items');
      body.addEventListener('click', open$1, { once: true });
  }

  const Sidebar = {
      open: open$1,
      close: close$1
  };

  const Modal = (() => {

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

  const verifyElement$1 = (element) => {
      if (
          !(element instanceof HTMLButtonElement) ||
          !element.matches('.kc.button')
      ) throw new Error('Invalid element');
  };

  const enable = (element) => {
      verifyElement$1(element);
      //console.log('enabling:', element);
      if (element instanceof HTMLButtonElement) element.disabled = false;
      element.classList.remove('disabled');
  };

  const disable = (element) => {
      verifyElement$1(element);
      //console.log('disabling:', element);
      if (element instanceof HTMLButtonElement) element.disabled = true;
      element.classList.add('disabled');
  };

  const Button = {
      enable,
      disable
  };

  const verifyElement = (element) => {
      if (
          !(element instanceof HTMLButtonElement) ||
          !element.matches('.kc.staging.button')
      ) throw new Error('Invalid element');
  };

  const stage = (element, from, to) => {
      verifyElement(element);
      //console.log('Staging:', element, `from "${from}" to "${to}"...`);
      return new Promise((resolve) => {
          const stages = element.querySelectorAll('.stage');
          stages.forEach((stage) => stage.style.visibility = 'hidden');

          const ghosts = element.querySelectorAll('.ghost');
          ghosts.forEach((ghost) => ghost.remove());

          const fromStage = element.querySelector(`.stage[data-stage-name="${from}"]`);
          if (!fromStage) throw new Error(`Stage named "${from}" does not exist`);
          const fromStageGhost = fromStage.cloneNode(true);
          fromStageGhost.classList.add('ghost');
          element.appendChild(fromStageGhost);
          fromStageGhost.style.visibility = 'visible';
          fromStageGhost.style.top = '0';
          fromStageGhost.style.transform = `translateY(${Math.ceil(element.offsetHeight) * -1}px)`;

          const toStage = element.querySelector(`.stage[data-stage-name="${to}"]`);
          if (!toStage) throw new Error(`Stage named "${to}" does not exist`);
          const toStageGhost = toStage.cloneNode(true);
          toStageGhost.classList.add('ghost');
          element.appendChild(toStageGhost);
          toStageGhost.style.visibility = 'visible';
          toStageGhost.style.top = `${element.offsetHeight}px`;
          toStageGhost.style.transform = `translateY(${Math.ceil(element.offsetHeight) * -1}px)`;

          toStageGhost.addEventListener('transitionend', () => resolve(), { once: true });
      });
  };

  const reset = (element) => {
      verifyElement(element);
      const stages = element.querySelectorAll('.stage');
      stages.forEach((stage) => stage.style.removeProperty('visibility'));

      const ghosts = element.querySelectorAll('.ghost');
      ghosts.forEach((ghost) => ghost.remove());
  };

  const StagingButton = {
      enable: Button.enable,
      disable: Button.disable,
      stage,
      reset,
  };

  const root = document.querySelector('.kc.blocker');
  //if (!root) throw new Error('The blobker element is missing');

  // blocker CAN BE OMITTED. remember this for the next version

  const open = () => {
      if (!root) throw new Error('The blobker element is missing');
      return new Promise((resolve) => {
          console.log('opeing blocker...');
          root.classList.add('opened');
          resolve();
      });
  };

  const close = () => {
      if (!root) throw new Error('The blobker element is missing');
      return new Promise((resolve) => {
          console.log('closing blocker...');
          root.classList.remove('opened');
          resolve();
      });
  };

  const Blocker = {
      open,
      close
  };

  exports.Blocker = Blocker;
  exports.Button = Button;
  exports.Modal = Modal;
  exports.Sidebar = Sidebar;
  exports.StagingButton = StagingButton;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

}({}));
