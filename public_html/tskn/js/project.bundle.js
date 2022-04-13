(function () {
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

  const open$1$1 = () => {
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
              closer.addEventListener('click', close$1$1, { once: true });
              resolve();
          }, { once: true });
      });
  };

  const close$1$1 = () => {
      // what a bad implementation!
      if (!root$1) throw new Error('The sidebar element is missing');
      const body = root$1.querySelector('.items');
      root$1.querySelector('.closer');
      return new Promise((resolve) => {
          console.log('closing sidebar...');
          enableBodyScroll(body);
          root$1.classList.remove('opened');
          root$1.addEventListener('transitionend', () => {
              body.addEventListener('click', open$1$1, { once: true });
              resolve();
          }, { once: true });
      });
  };

  //init();
  if (root$1) {
      // bad implementation!
      const body = root$1.querySelector('.items');
      body.addEventListener('click', open$1$1, { once: true });
  }

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

  const open$7 = () => {
      if (!root) throw new Error('The blobker element is missing');
      return new Promise((resolve) => {
          console.log('opeing blocker...');
          root.classList.add('opened');
          resolve();
      });
  };

  const close$7 = () => {
      if (!root) throw new Error('The blobker element is missing');
      return new Promise((resolve) => {
          console.log('closing blocker...');
          root.classList.remove('opened');
          resolve();
      });
  };

  const Blocker = {
      open: open$7,
      close: close$7
  };

  class Abstract {
      static isEqual(instanceA, instanceB) {
          const propertiesA = Object.getOwnPropertyNames(instanceA);
          const propertiesB = Object.getOwnPropertyNames(instanceB);
          if (propertiesA.length !== propertiesB.length) {
              return false;
          }
          for (let property of propertiesA) {
              if (instanceA[property] !== instanceB[property]) {
                  return false;
              }
          }
          return true;
      }
      static isEmpty(instance) {
          const emptyInstance = new this();
          return this.isEqual(instance, emptyInstance);
      }
      hasId() {
          return !!this.id;
      }
  }

  class Project extends Abstract {
      /** @type {?number} */
      id = null;
      /** @type {?number} */
      createdAt = null;
      /** @type {?number} */
      modifiedAt = null;
      /** @type {string} */
      slug = '';
      /** @type {string} */
      title = '';
      /** @type {number} */
      //timeInTotal = 0;

      /*
      static createFromResponseData(responseData) {
          const project = new this();
          project.id = parseInt(responseData.id);
          project.slug = responseData.slug;
          project.title = responseData.title;
          return project;
      }
      */
  }

  // Network is physically unavailable or timed out

  class NetworkError extends Error {
      constructor(message) {
          super(message);
          //super(`${message}: Network is unavailable or timed out`);
          this.name = 'NetworkError';
      }
  }

  // Response status code is not 200

  class UnexpectedResponseError extends Error {
      /*
      constructor(message) {
          super(message);
          this.name = 'UnexpectedResponseError';
      }
      */

      /**
       * @param {Response} response
       */
      constructor(response) {
          super(`Unexpected response: ${response.status}`);
          this.name = 'UnexpectedResponseError';
          this.status = response.status;
      }
  }

  /**
   * @param {string} message
   */
  const showMessage = (message) => {
      /*
      setTimeout(() => {
          alert(message.toString());
      }, 500);
      */
      alert(message.toString());
  };

  /**
   * @param {NetworkError} error
   */
  const handleNetworkError = (error) => {
      showMessage('通信エラーです。サーバーか回線の調子が悪いのかもしれません。しばらくしてからやり直してください。');
      console.error(error);
  };

  /**
   * @param {UnexpectedResponseError} error
   */
  const handleUnexpectedResponseError = (error) => {
      let callback;
      switch (error.status) {
          case 400:
              showMessage('不正なリクエストです。');
              break;
          case 403:
              showMessage('セッションが切れています。もう一度合言葉を入力してください。');
              callback = () => {
                  location.reload();
              };
              break;
          case 410:
              showMessage('存在しないか、すでに削除されています。');
              break;
          case 500:
              showMessage('サーバーエラーです。（何回も出るようだったらこっそり作者に伝えてください…）');
              break;
          default:
              showMessage('予期しないレスポンスです。（何回も出るようだったらこっそり作者に伝えてください…）');
      }
      console.error(error);
      if (typeof callback === 'function') {
          callback();
      }
  };

  /**
   * @param {Error} error
   */
  const handleError = (error) => {
      showMessage('バグりました。すみません。（何回も出るようだったらこっそり作者に伝えてください…）');
      console.error(error);
  };

  /**
   * @param {*} error
   */
  const handle = (error) => {
      if (error instanceof NetworkError) {
          handleNetworkError(error);
          return;
      }
      if (error instanceof UnexpectedResponseError) {
          handleUnexpectedResponseError(error);
          return;
      }
      handleError(error);
  };

  const ErrorHandler = {
      handle,
  };

  /**
   * @param {HTMLElement} rootElement
   */
  const show$4 = (rootElement) => {
      rootElement.removeAttribute('hidden');
  };

  /**
   * @param {HTMLElement} rootElement
   */
  const hide$4 = (rootElement) => {
      rootElement.setAttribute('hidden', 'hidden');
  };

  const CommonBehavior = {
      show: show$4,
      hide: hide$4,
  };

  /** @type {HTMLElement} */
  const rootElement$a = document.querySelector('.project > .title');
  /** @type {HTMLElement} */
  const projectTitleElement = rootElement$a.querySelector('h1');
  /** @type {Project} */
  let targetProject$4 = new Project();

  const show$3 = () => {
      CommonBehavior.show(rootElement$a);
  };

  const hide$3 = () => {
      CommonBehavior.hide(rootElement$a);
  };

  /**
   * @param {Project} project
   * @returns {TaskDeleteDialog}
   */
  const setProject$1 = (project) => {
      try {
          if (!(project instanceof Project)) {
              throw new TypeError('Invalid project');
          }
          targetProject$4 = project;
          return ProjectTitle;
      } catch (error) {
          ErrorHandler.handle();
      }
  };

  /**
   * @param {Project} project
   */
  const updateProject$2 = (project) => {
      try {
          setProject$1(project);
          projectTitleElement.textContent = project.title;
          document.title = `たすくん - ${project.title}`;
      } catch (error) {
          ErrorHandler.handle();
      }
  };

  const ProjectTitle = {
      show: show$3,
      hide: hide$3,
      setProject: setProject$1,
      updateProject: updateProject$2,
  };

  /*!
   * Chart.js v3.1.1
   * https://www.chartjs.org
   * (c) 2021 Chart.js Contributors
   * Released under the MIT License
   */
  const requestAnimFrame = (function() {
    if (typeof window === 'undefined') {
      return function(callback) {
        return callback();
      };
    }
    return window.requestAnimationFrame;
  }());
  function throttled(fn, thisArg, updateFn) {
    const updateArgs = updateFn || ((args) => Array.prototype.slice.call(args));
    let ticking = false;
    let args = [];
    return function(...rest) {
      args = updateArgs(rest);
      if (!ticking) {
        ticking = true;
        requestAnimFrame.call(window, () => {
          ticking = false;
          fn.apply(thisArg, args);
        });
      }
    };
  }
  function debounce(fn, delay) {
    let timeout;
    return function() {
      if (delay) {
        clearTimeout(timeout);
        timeout = setTimeout(fn, delay);
      } else {
        fn();
      }
      return delay;
    };
  }
  const _toLeftRightCenter = (align) => align === 'start' ? 'left' : align === 'end' ? 'right' : 'center';
  const _alignStartEnd = (align, start, end) => align === 'start' ? start : align === 'end' ? end : (start + end) / 2;
  const uid = (function() {
    let id = 0;
    return function() {
      return id++;
    };
  }());
  function isNullOrUndef(value) {
    return value === null || typeof value === 'undefined';
  }
  function isArray(value) {
    if (Array.isArray && Array.isArray(value)) {
      return true;
    }
    const type = Object.prototype.toString.call(value);
    if (type.substr(0, 7) === '[object' && type.substr(-6) === 'Array]') {
      return true;
    }
    return false;
  }
  function isObject(value) {
    return value !== null && Object.prototype.toString.call(value) === '[object Object]';
  }
  const isNumberFinite = (value) => (typeof value === 'number' || value instanceof Number) && isFinite(+value);
  function finiteOrDefault(value, defaultValue) {
    return isNumberFinite(value) ? value : defaultValue;
  }
  function valueOrDefault(value, defaultValue) {
    return typeof value === 'undefined' ? defaultValue : value;
  }
  const toPercentage = (value, dimension) =>
    typeof value === 'string' && value.endsWith('%') ?
      parseFloat(value) / 100
      : value / dimension;
  const toDimension = (value, dimension) =>
    typeof value === 'string' && value.endsWith('%') ?
      parseFloat(value) / 100 * dimension
      : +value;
  function callback(fn, args, thisArg) {
    if (fn && typeof fn.call === 'function') {
      return fn.apply(thisArg, args);
    }
  }
  function each(loopable, fn, thisArg, reverse) {
    let i, len, keys;
    if (isArray(loopable)) {
      len = loopable.length;
      if (reverse) {
        for (i = len - 1; i >= 0; i--) {
          fn.call(thisArg, loopable[i], i);
        }
      } else {
        for (i = 0; i < len; i++) {
          fn.call(thisArg, loopable[i], i);
        }
      }
    } else if (isObject(loopable)) {
      keys = Object.keys(loopable);
      len = keys.length;
      for (i = 0; i < len; i++) {
        fn.call(thisArg, loopable[keys[i]], keys[i]);
      }
    }
  }
  function _elementsEqual(a0, a1) {
    let i, ilen, v0, v1;
    if (!a0 || !a1 || a0.length !== a1.length) {
      return false;
    }
    for (i = 0, ilen = a0.length; i < ilen; ++i) {
      v0 = a0[i];
      v1 = a1[i];
      if (v0.datasetIndex !== v1.datasetIndex || v0.index !== v1.index) {
        return false;
      }
    }
    return true;
  }
  function clone$1(source) {
    if (isArray(source)) {
      return source.map(clone$1);
    }
    if (isObject(source)) {
      const target = Object.create(null);
      const keys = Object.keys(source);
      const klen = keys.length;
      let k = 0;
      for (; k < klen; ++k) {
        target[keys[k]] = clone$1(source[keys[k]]);
      }
      return target;
    }
    return source;
  }
  function isValidKey(key) {
    return ['__proto__', 'prototype', 'constructor'].indexOf(key) === -1;
  }
  function _merger(key, target, source, options) {
    if (!isValidKey(key)) {
      return;
    }
    const tval = target[key];
    const sval = source[key];
    if (isObject(tval) && isObject(sval)) {
      merge(tval, sval, options);
    } else {
      target[key] = clone$1(sval);
    }
  }
  function merge(target, source, options) {
    const sources = isArray(source) ? source : [source];
    const ilen = sources.length;
    if (!isObject(target)) {
      return target;
    }
    options = options || {};
    const merger = options.merger || _merger;
    for (let i = 0; i < ilen; ++i) {
      source = sources[i];
      if (!isObject(source)) {
        continue;
      }
      const keys = Object.keys(source);
      for (let k = 0, klen = keys.length; k < klen; ++k) {
        merger(keys[k], target, source, options);
      }
    }
    return target;
  }
  function mergeIf(target, source) {
    return merge(target, source, {merger: _mergerIf});
  }
  function _mergerIf(key, target, source) {
    if (!isValidKey(key)) {
      return;
    }
    const tval = target[key];
    const sval = source[key];
    if (isObject(tval) && isObject(sval)) {
      mergeIf(tval, sval);
    } else if (!Object.prototype.hasOwnProperty.call(target, key)) {
      target[key] = clone$1(sval);
    }
  }
  const emptyString = '';
  const dot = '.';
  function indexOfDotOrLength(key, start) {
    const idx = key.indexOf(dot, start);
    return idx === -1 ? key.length : idx;
  }
  function resolveObjectKey(obj, key) {
    if (key === emptyString) {
      return obj;
    }
    let pos = 0;
    let idx = indexOfDotOrLength(key, pos);
    while (obj && idx > pos) {
      obj = obj[key.substr(pos, idx - pos)];
      pos = idx + 1;
      idx = indexOfDotOrLength(key, pos);
    }
    return obj;
  }
  function _capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
  const defined = (value) => typeof value !== 'undefined';
  const isFunction = (value) => typeof value === 'function';

  const PI = Math.PI;
  const TAU = 2 * PI;
  const INFINITY = Number.POSITIVE_INFINITY;
  const HALF_PI = PI / 2;
  const log10 = Math.log10;
  const sign = Math.sign;
  function _factorize(value) {
    const result = [];
    const sqrt = Math.sqrt(value);
    let i;
    for (i = 1; i < sqrt; i++) {
      if (value % i === 0) {
        result.push(i);
        result.push(value / i);
      }
    }
    if (sqrt === (sqrt | 0)) {
      result.push(sqrt);
    }
    result.sort((a, b) => a - b).pop();
    return result;
  }
  function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }
  function toRadians(degrees) {
    return degrees * (PI / 180);
  }
  function toDegrees(radians) {
    return radians * (180 / PI);
  }
  function getAngleFromPoint(centrePoint, anglePoint) {
    const distanceFromXCenter = anglePoint.x - centrePoint.x;
    const distanceFromYCenter = anglePoint.y - centrePoint.y;
    const radialDistanceFromCenter = Math.sqrt(distanceFromXCenter * distanceFromXCenter + distanceFromYCenter * distanceFromYCenter);
    let angle = Math.atan2(distanceFromYCenter, distanceFromXCenter);
    if (angle < (-0.5 * PI)) {
      angle += TAU;
    }
    return {
      angle,
      distance: radialDistanceFromCenter
    };
  }
  function _normalizeAngle(a) {
    return (a % TAU + TAU) % TAU;
  }
  function _angleBetween(angle, start, end) {
    const a = _normalizeAngle(angle);
    const s = _normalizeAngle(start);
    const e = _normalizeAngle(end);
    const angleToStart = _normalizeAngle(s - a);
    const angleToEnd = _normalizeAngle(e - a);
    const startToAngle = _normalizeAngle(a - s);
    const endToAngle = _normalizeAngle(a - e);
    return a === s || a === e || (angleToStart > angleToEnd && startToAngle < endToAngle);
  }
  function _limitValue(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }
  function _int16Range(value) {
    return _limitValue(value, -32768, 32767);
  }

  const atEdge = (t) => t === 0 || t === 1;
  const elasticIn = (t, s, p) => -(Math.pow(2, 10 * (t -= 1)) * Math.sin((t - s) * TAU / p));
  const elasticOut = (t, s, p) => Math.pow(2, -10 * t) * Math.sin((t - s) * TAU / p) + 1;
  const effects = {
    linear: t => t,
    easeInQuad: t => t * t,
    easeOutQuad: t => -t * (t - 2),
    easeInOutQuad: t => ((t /= 0.5) < 1)
      ? 0.5 * t * t
      : -0.5 * ((--t) * (t - 2) - 1),
    easeInCubic: t => t * t * t,
    easeOutCubic: t => (t -= 1) * t * t + 1,
    easeInOutCubic: t => ((t /= 0.5) < 1)
      ? 0.5 * t * t * t
      : 0.5 * ((t -= 2) * t * t + 2),
    easeInQuart: t => t * t * t * t,
    easeOutQuart: t => -((t -= 1) * t * t * t - 1),
    easeInOutQuart: t => ((t /= 0.5) < 1)
      ? 0.5 * t * t * t * t
      : -0.5 * ((t -= 2) * t * t * t - 2),
    easeInQuint: t => t * t * t * t * t,
    easeOutQuint: t => (t -= 1) * t * t * t * t + 1,
    easeInOutQuint: t => ((t /= 0.5) < 1)
      ? 0.5 * t * t * t * t * t
      : 0.5 * ((t -= 2) * t * t * t * t + 2),
    easeInSine: t => -Math.cos(t * HALF_PI) + 1,
    easeOutSine: t => Math.sin(t * HALF_PI),
    easeInOutSine: t => -0.5 * (Math.cos(PI * t) - 1),
    easeInExpo: t => (t === 0) ? 0 : Math.pow(2, 10 * (t - 1)),
    easeOutExpo: t => (t === 1) ? 1 : -Math.pow(2, -10 * t) + 1,
    easeInOutExpo: t => atEdge(t) ? t : t < 0.5
      ? 0.5 * Math.pow(2, 10 * (t * 2 - 1))
      : 0.5 * (-Math.pow(2, -10 * (t * 2 - 1)) + 2),
    easeInCirc: t => (t >= 1) ? t : -(Math.sqrt(1 - t * t) - 1),
    easeOutCirc: t => Math.sqrt(1 - (t -= 1) * t),
    easeInOutCirc: t => ((t /= 0.5) < 1)
      ? -0.5 * (Math.sqrt(1 - t * t) - 1)
      : 0.5 * (Math.sqrt(1 - (t -= 2) * t) + 1),
    easeInElastic: t => atEdge(t) ? t : elasticIn(t, 0.075, 0.3),
    easeOutElastic: t => atEdge(t) ? t : elasticOut(t, 0.075, 0.3),
    easeInOutElastic(t) {
      const s = 0.1125;
      const p = 0.45;
      return atEdge(t) ? t :
        t < 0.5
          ? 0.5 * elasticIn(t * 2, s, p)
          : 0.5 + 0.5 * elasticOut(t * 2 - 1, s, p);
    },
    easeInBack(t) {
      const s = 1.70158;
      return t * t * ((s + 1) * t - s);
    },
    easeOutBack(t) {
      const s = 1.70158;
      return (t -= 1) * t * ((s + 1) * t + s) + 1;
    },
    easeInOutBack(t) {
      let s = 1.70158;
      if ((t /= 0.5) < 1) {
        return 0.5 * (t * t * (((s *= (1.525)) + 1) * t - s));
      }
      return 0.5 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2);
    },
    easeInBounce: t => 1 - effects.easeOutBounce(1 - t),
    easeOutBounce(t) {
      const m = 7.5625;
      const d = 2.75;
      if (t < (1 / d)) {
        return m * t * t;
      }
      if (t < (2 / d)) {
        return m * (t -= (1.5 / d)) * t + 0.75;
      }
      if (t < (2.5 / d)) {
        return m * (t -= (2.25 / d)) * t + 0.9375;
      }
      return m * (t -= (2.625 / d)) * t + 0.984375;
    },
    easeInOutBounce: t => (t < 0.5)
      ? effects.easeInBounce(t * 2) * 0.5
      : effects.easeOutBounce(t * 2 - 1) * 0.5 + 0.5,
  };

  /*!
   * @kurkle/color v0.1.9
   * https://github.com/kurkle/color#readme
   * (c) 2020 Jukka Kurkela
   * Released under the MIT License
   */
  const map = {0: 0, 1: 1, 2: 2, 3: 3, 4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9, A: 10, B: 11, C: 12, D: 13, E: 14, F: 15, a: 10, b: 11, c: 12, d: 13, e: 14, f: 15};
  const hex = '0123456789ABCDEF';
  const h1 = (b) => hex[b & 0xF];
  const h2 = (b) => hex[(b & 0xF0) >> 4] + hex[b & 0xF];
  const eq = (b) => (((b & 0xF0) >> 4) === (b & 0xF));
  function isShort(v) {
  	return eq(v.r) && eq(v.g) && eq(v.b) && eq(v.a);
  }
  function hexParse(str) {
  	var len = str.length;
  	var ret;
  	if (str[0] === '#') {
  		if (len === 4 || len === 5) {
  			ret = {
  				r: 255 & map[str[1]] * 17,
  				g: 255 & map[str[2]] * 17,
  				b: 255 & map[str[3]] * 17,
  				a: len === 5 ? map[str[4]] * 17 : 255
  			};
  		} else if (len === 7 || len === 9) {
  			ret = {
  				r: map[str[1]] << 4 | map[str[2]],
  				g: map[str[3]] << 4 | map[str[4]],
  				b: map[str[5]] << 4 | map[str[6]],
  				a: len === 9 ? (map[str[7]] << 4 | map[str[8]]) : 255
  			};
  		}
  	}
  	return ret;
  }
  function hexString(v) {
  	var f = isShort(v) ? h1 : h2;
  	return v
  		? '#' + f(v.r) + f(v.g) + f(v.b) + (v.a < 255 ? f(v.a) : '')
  		: v;
  }
  function round(v) {
  	return v + 0.5 | 0;
  }
  const lim = (v, l, h) => Math.max(Math.min(v, h), l);
  function p2b(v) {
  	return lim(round(v * 2.55), 0, 255);
  }
  function n2b(v) {
  	return lim(round(v * 255), 0, 255);
  }
  function b2n(v) {
  	return lim(round(v / 2.55) / 100, 0, 1);
  }
  function n2p(v) {
  	return lim(round(v * 100), 0, 100);
  }
  const RGB_RE = /^rgba?\(\s*([-+.\d]+)(%)?[\s,]+([-+.e\d]+)(%)?[\s,]+([-+.e\d]+)(%)?(?:[\s,/]+([-+.e\d]+)(%)?)?\s*\)$/;
  function rgbParse(str) {
  	const m = RGB_RE.exec(str);
  	let a = 255;
  	let r, g, b;
  	if (!m) {
  		return;
  	}
  	if (m[7] !== r) {
  		const v = +m[7];
  		a = 255 & (m[8] ? p2b(v) : v * 255);
  	}
  	r = +m[1];
  	g = +m[3];
  	b = +m[5];
  	r = 255 & (m[2] ? p2b(r) : r);
  	g = 255 & (m[4] ? p2b(g) : g);
  	b = 255 & (m[6] ? p2b(b) : b);
  	return {
  		r: r,
  		g: g,
  		b: b,
  		a: a
  	};
  }
  function rgbString(v) {
  	return v && (
  		v.a < 255
  			? `rgba(${v.r}, ${v.g}, ${v.b}, ${b2n(v.a)})`
  			: `rgb(${v.r}, ${v.g}, ${v.b})`
  	);
  }
  const HUE_RE = /^(hsla?|hwb|hsv)\(\s*([-+.e\d]+)(?:deg)?[\s,]+([-+.e\d]+)%[\s,]+([-+.e\d]+)%(?:[\s,]+([-+.e\d]+)(%)?)?\s*\)$/;
  function hsl2rgbn(h, s, l) {
  	const a = s * Math.min(l, 1 - l);
  	const f = (n, k = (n + h / 30) % 12) => l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
  	return [f(0), f(8), f(4)];
  }
  function hsv2rgbn(h, s, v) {
  	const f = (n, k = (n + h / 60) % 6) => v - v * s * Math.max(Math.min(k, 4 - k, 1), 0);
  	return [f(5), f(3), f(1)];
  }
  function hwb2rgbn(h, w, b) {
  	const rgb = hsl2rgbn(h, 1, 0.5);
  	let i;
  	if (w + b > 1) {
  		i = 1 / (w + b);
  		w *= i;
  		b *= i;
  	}
  	for (i = 0; i < 3; i++) {
  		rgb[i] *= 1 - w - b;
  		rgb[i] += w;
  	}
  	return rgb;
  }
  function rgb2hsl(v) {
  	const range = 255;
  	const r = v.r / range;
  	const g = v.g / range;
  	const b = v.b / range;
  	const max = Math.max(r, g, b);
  	const min = Math.min(r, g, b);
  	const l = (max + min) / 2;
  	let h, s, d;
  	if (max !== min) {
  		d = max - min;
  		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  		h = max === r
  			? ((g - b) / d) + (g < b ? 6 : 0)
  			: max === g
  				? (b - r) / d + 2
  				: (r - g) / d + 4;
  		h = h * 60 + 0.5;
  	}
  	return [h | 0, s || 0, l];
  }
  function calln(f, a, b, c) {
  	return (
  		Array.isArray(a)
  			? f(a[0], a[1], a[2])
  			: f(a, b, c)
  	).map(n2b);
  }
  function hsl2rgb(h, s, l) {
  	return calln(hsl2rgbn, h, s, l);
  }
  function hwb2rgb(h, w, b) {
  	return calln(hwb2rgbn, h, w, b);
  }
  function hsv2rgb(h, s, v) {
  	return calln(hsv2rgbn, h, s, v);
  }
  function hue(h) {
  	return (h % 360 + 360) % 360;
  }
  function hueParse(str) {
  	const m = HUE_RE.exec(str);
  	let a = 255;
  	let v;
  	if (!m) {
  		return;
  	}
  	if (m[5] !== v) {
  		a = m[6] ? p2b(+m[5]) : n2b(+m[5]);
  	}
  	const h = hue(+m[2]);
  	const p1 = +m[3] / 100;
  	const p2 = +m[4] / 100;
  	if (m[1] === 'hwb') {
  		v = hwb2rgb(h, p1, p2);
  	} else if (m[1] === 'hsv') {
  		v = hsv2rgb(h, p1, p2);
  	} else {
  		v = hsl2rgb(h, p1, p2);
  	}
  	return {
  		r: v[0],
  		g: v[1],
  		b: v[2],
  		a: a
  	};
  }
  function rotate(v, deg) {
  	var h = rgb2hsl(v);
  	h[0] = hue(h[0] + deg);
  	h = hsl2rgb(h);
  	v.r = h[0];
  	v.g = h[1];
  	v.b = h[2];
  }
  function hslString(v) {
  	if (!v) {
  		return;
  	}
  	const a = rgb2hsl(v);
  	const h = a[0];
  	const s = n2p(a[1]);
  	const l = n2p(a[2]);
  	return v.a < 255
  		? `hsla(${h}, ${s}%, ${l}%, ${b2n(v.a)})`
  		: `hsl(${h}, ${s}%, ${l}%)`;
  }
  const map$1 = {
  	x: 'dark',
  	Z: 'light',
  	Y: 're',
  	X: 'blu',
  	W: 'gr',
  	V: 'medium',
  	U: 'slate',
  	A: 'ee',
  	T: 'ol',
  	S: 'or',
  	B: 'ra',
  	C: 'lateg',
  	D: 'ights',
  	R: 'in',
  	Q: 'turquois',
  	E: 'hi',
  	P: 'ro',
  	O: 'al',
  	N: 'le',
  	M: 'de',
  	L: 'yello',
  	F: 'en',
  	K: 'ch',
  	G: 'arks',
  	H: 'ea',
  	I: 'ightg',
  	J: 'wh'
  };
  const names = {
  	OiceXe: 'f0f8ff',
  	antiquewEte: 'faebd7',
  	aqua: 'ffff',
  	aquamarRe: '7fffd4',
  	azuY: 'f0ffff',
  	beige: 'f5f5dc',
  	bisque: 'ffe4c4',
  	black: '0',
  	blanKedOmond: 'ffebcd',
  	Xe: 'ff',
  	XeviTet: '8a2be2',
  	bPwn: 'a52a2a',
  	burlywood: 'deb887',
  	caMtXe: '5f9ea0',
  	KartYuse: '7fff00',
  	KocTate: 'd2691e',
  	cSO: 'ff7f50',
  	cSnflowerXe: '6495ed',
  	cSnsilk: 'fff8dc',
  	crimson: 'dc143c',
  	cyan: 'ffff',
  	xXe: '8b',
  	xcyan: '8b8b',
  	xgTMnPd: 'b8860b',
  	xWay: 'a9a9a9',
  	xgYF: '6400',
  	xgYy: 'a9a9a9',
  	xkhaki: 'bdb76b',
  	xmagFta: '8b008b',
  	xTivegYF: '556b2f',
  	xSange: 'ff8c00',
  	xScEd: '9932cc',
  	xYd: '8b0000',
  	xsOmon: 'e9967a',
  	xsHgYF: '8fbc8f',
  	xUXe: '483d8b',
  	xUWay: '2f4f4f',
  	xUgYy: '2f4f4f',
  	xQe: 'ced1',
  	xviTet: '9400d3',
  	dAppRk: 'ff1493',
  	dApskyXe: 'bfff',
  	dimWay: '696969',
  	dimgYy: '696969',
  	dodgerXe: '1e90ff',
  	fiYbrick: 'b22222',
  	flSOwEte: 'fffaf0',
  	foYstWAn: '228b22',
  	fuKsia: 'ff00ff',
  	gaRsbSo: 'dcdcdc',
  	ghostwEte: 'f8f8ff',
  	gTd: 'ffd700',
  	gTMnPd: 'daa520',
  	Way: '808080',
  	gYF: '8000',
  	gYFLw: 'adff2f',
  	gYy: '808080',
  	honeyMw: 'f0fff0',
  	hotpRk: 'ff69b4',
  	RdianYd: 'cd5c5c',
  	Rdigo: '4b0082',
  	ivSy: 'fffff0',
  	khaki: 'f0e68c',
  	lavFMr: 'e6e6fa',
  	lavFMrXsh: 'fff0f5',
  	lawngYF: '7cfc00',
  	NmoncEffon: 'fffacd',
  	ZXe: 'add8e6',
  	ZcSO: 'f08080',
  	Zcyan: 'e0ffff',
  	ZgTMnPdLw: 'fafad2',
  	ZWay: 'd3d3d3',
  	ZgYF: '90ee90',
  	ZgYy: 'd3d3d3',
  	ZpRk: 'ffb6c1',
  	ZsOmon: 'ffa07a',
  	ZsHgYF: '20b2aa',
  	ZskyXe: '87cefa',
  	ZUWay: '778899',
  	ZUgYy: '778899',
  	ZstAlXe: 'b0c4de',
  	ZLw: 'ffffe0',
  	lime: 'ff00',
  	limegYF: '32cd32',
  	lRF: 'faf0e6',
  	magFta: 'ff00ff',
  	maPon: '800000',
  	VaquamarRe: '66cdaa',
  	VXe: 'cd',
  	VScEd: 'ba55d3',
  	VpurpN: '9370db',
  	VsHgYF: '3cb371',
  	VUXe: '7b68ee',
  	VsprRggYF: 'fa9a',
  	VQe: '48d1cc',
  	VviTetYd: 'c71585',
  	midnightXe: '191970',
  	mRtcYam: 'f5fffa',
  	mistyPse: 'ffe4e1',
  	moccasR: 'ffe4b5',
  	navajowEte: 'ffdead',
  	navy: '80',
  	Tdlace: 'fdf5e6',
  	Tive: '808000',
  	TivedBb: '6b8e23',
  	Sange: 'ffa500',
  	SangeYd: 'ff4500',
  	ScEd: 'da70d6',
  	pOegTMnPd: 'eee8aa',
  	pOegYF: '98fb98',
  	pOeQe: 'afeeee',
  	pOeviTetYd: 'db7093',
  	papayawEp: 'ffefd5',
  	pHKpuff: 'ffdab9',
  	peru: 'cd853f',
  	pRk: 'ffc0cb',
  	plum: 'dda0dd',
  	powMrXe: 'b0e0e6',
  	purpN: '800080',
  	YbeccapurpN: '663399',
  	Yd: 'ff0000',
  	Psybrown: 'bc8f8f',
  	PyOXe: '4169e1',
  	saddNbPwn: '8b4513',
  	sOmon: 'fa8072',
  	sandybPwn: 'f4a460',
  	sHgYF: '2e8b57',
  	sHshell: 'fff5ee',
  	siFna: 'a0522d',
  	silver: 'c0c0c0',
  	skyXe: '87ceeb',
  	UXe: '6a5acd',
  	UWay: '708090',
  	UgYy: '708090',
  	snow: 'fffafa',
  	sprRggYF: 'ff7f',
  	stAlXe: '4682b4',
  	tan: 'd2b48c',
  	teO: '8080',
  	tEstN: 'd8bfd8',
  	tomato: 'ff6347',
  	Qe: '40e0d0',
  	viTet: 'ee82ee',
  	JHt: 'f5deb3',
  	wEte: 'ffffff',
  	wEtesmoke: 'f5f5f5',
  	Lw: 'ffff00',
  	LwgYF: '9acd32'
  };
  function unpack() {
  	const unpacked = {};
  	const keys = Object.keys(names);
  	const tkeys = Object.keys(map$1);
  	let i, j, k, ok, nk;
  	for (i = 0; i < keys.length; i++) {
  		ok = nk = keys[i];
  		for (j = 0; j < tkeys.length; j++) {
  			k = tkeys[j];
  			nk = nk.replace(k, map$1[k]);
  		}
  		k = parseInt(names[ok], 16);
  		unpacked[nk] = [k >> 16 & 0xFF, k >> 8 & 0xFF, k & 0xFF];
  	}
  	return unpacked;
  }
  let names$1;
  function nameParse(str) {
  	if (!names$1) {
  		names$1 = unpack();
  		names$1.transparent = [0, 0, 0, 0];
  	}
  	const a = names$1[str.toLowerCase()];
  	return a && {
  		r: a[0],
  		g: a[1],
  		b: a[2],
  		a: a.length === 4 ? a[3] : 255
  	};
  }
  function modHSL(v, i, ratio) {
  	if (v) {
  		let tmp = rgb2hsl(v);
  		tmp[i] = Math.max(0, Math.min(tmp[i] + tmp[i] * ratio, i === 0 ? 360 : 1));
  		tmp = hsl2rgb(tmp);
  		v.r = tmp[0];
  		v.g = tmp[1];
  		v.b = tmp[2];
  	}
  }
  function clone(v, proto) {
  	return v ? Object.assign(proto || {}, v) : v;
  }
  function fromObject(input) {
  	var v = {r: 0, g: 0, b: 0, a: 255};
  	if (Array.isArray(input)) {
  		if (input.length >= 3) {
  			v = {r: input[0], g: input[1], b: input[2], a: 255};
  			if (input.length > 3) {
  				v.a = n2b(input[3]);
  			}
  		}
  	} else {
  		v = clone(input, {r: 0, g: 0, b: 0, a: 1});
  		v.a = n2b(v.a);
  	}
  	return v;
  }
  function functionParse(str) {
  	if (str.charAt(0) === 'r') {
  		return rgbParse(str);
  	}
  	return hueParse(str);
  }
  class Color {
  	constructor(input) {
  		if (input instanceof Color) {
  			return input;
  		}
  		const type = typeof input;
  		let v;
  		if (type === 'object') {
  			v = fromObject(input);
  		} else if (type === 'string') {
  			v = hexParse(input) || nameParse(input) || functionParse(input);
  		}
  		this._rgb = v;
  		this._valid = !!v;
  	}
  	get valid() {
  		return this._valid;
  	}
  	get rgb() {
  		var v = clone(this._rgb);
  		if (v) {
  			v.a = b2n(v.a);
  		}
  		return v;
  	}
  	set rgb(obj) {
  		this._rgb = fromObject(obj);
  	}
  	rgbString() {
  		return this._valid ? rgbString(this._rgb) : this._rgb;
  	}
  	hexString() {
  		return this._valid ? hexString(this._rgb) : this._rgb;
  	}
  	hslString() {
  		return this._valid ? hslString(this._rgb) : this._rgb;
  	}
  	mix(color, weight) {
  		const me = this;
  		if (color) {
  			const c1 = me.rgb;
  			const c2 = color.rgb;
  			let w2;
  			const p = weight === w2 ? 0.5 : weight;
  			const w = 2 * p - 1;
  			const a = c1.a - c2.a;
  			const w1 = ((w * a === -1 ? w : (w + a) / (1 + w * a)) + 1) / 2.0;
  			w2 = 1 - w1;
  			c1.r = 0xFF & w1 * c1.r + w2 * c2.r + 0.5;
  			c1.g = 0xFF & w1 * c1.g + w2 * c2.g + 0.5;
  			c1.b = 0xFF & w1 * c1.b + w2 * c2.b + 0.5;
  			c1.a = p * c1.a + (1 - p) * c2.a;
  			me.rgb = c1;
  		}
  		return me;
  	}
  	clone() {
  		return new Color(this.rgb);
  	}
  	alpha(a) {
  		this._rgb.a = n2b(a);
  		return this;
  	}
  	clearer(ratio) {
  		const rgb = this._rgb;
  		rgb.a *= 1 - ratio;
  		return this;
  	}
  	greyscale() {
  		const rgb = this._rgb;
  		const val = round(rgb.r * 0.3 + rgb.g * 0.59 + rgb.b * 0.11);
  		rgb.r = rgb.g = rgb.b = val;
  		return this;
  	}
  	opaquer(ratio) {
  		const rgb = this._rgb;
  		rgb.a *= 1 + ratio;
  		return this;
  	}
  	negate() {
  		const v = this._rgb;
  		v.r = 255 - v.r;
  		v.g = 255 - v.g;
  		v.b = 255 - v.b;
  		return this;
  	}
  	lighten(ratio) {
  		modHSL(this._rgb, 2, ratio);
  		return this;
  	}
  	darken(ratio) {
  		modHSL(this._rgb, 2, -ratio);
  		return this;
  	}
  	saturate(ratio) {
  		modHSL(this._rgb, 1, ratio);
  		return this;
  	}
  	desaturate(ratio) {
  		modHSL(this._rgb, 1, -ratio);
  		return this;
  	}
  	rotate(deg) {
  		rotate(this._rgb, deg);
  		return this;
  	}
  }
  function index_esm(input) {
  	return new Color(input);
  }

  const isPatternOrGradient = (value) => value instanceof CanvasGradient || value instanceof CanvasPattern;
  function color(value) {
    return isPatternOrGradient(value) ? value : index_esm(value);
  }
  function getHoverColor(value) {
    return isPatternOrGradient(value)
      ? value
      : index_esm(value).saturate(0.5).darken(0.1).hexString();
  }

  const overrides = Object.create(null);
  const descriptors = Object.create(null);
  function getScope$1(node, key) {
    if (!key) {
      return node;
    }
    const keys = key.split('.');
    for (let i = 0, n = keys.length; i < n; ++i) {
      const k = keys[i];
      node = node[k] || (node[k] = Object.create(null));
    }
    return node;
  }
  function set(root, scope, values) {
    if (typeof scope === 'string') {
      return merge(getScope$1(root, scope), values);
    }
    return merge(getScope$1(root, ''), scope);
  }
  class Defaults {
    constructor(_descriptors) {
      this.animation = undefined;
      this.backgroundColor = 'rgba(0,0,0,0.1)';
      this.borderColor = 'rgba(0,0,0,0.1)';
      this.color = '#666';
      this.datasets = {};
      this.devicePixelRatio = (context) => context.chart.platform.getDevicePixelRatio();
      this.elements = {};
      this.events = [
        'mousemove',
        'mouseout',
        'click',
        'touchstart',
        'touchmove'
      ];
      this.font = {
        family: "'Helvetica Neue', 'Helvetica', 'Arial', sans-serif",
        size: 12,
        style: 'normal',
        lineHeight: 1.2,
        weight: null
      };
      this.hover = {};
      this.hoverBackgroundColor = (ctx, options) => getHoverColor(options.backgroundColor);
      this.hoverBorderColor = (ctx, options) => getHoverColor(options.borderColor);
      this.hoverColor = (ctx, options) => getHoverColor(options.color);
      this.indexAxis = 'x';
      this.interaction = {
        mode: 'nearest',
        intersect: true
      };
      this.maintainAspectRatio = true;
      this.onHover = null;
      this.onClick = null;
      this.parsing = true;
      this.plugins = {};
      this.responsive = true;
      this.scale = undefined;
      this.scales = {};
      this.showLine = true;
      this.describe(_descriptors);
    }
    set(scope, values) {
      return set(this, scope, values);
    }
    get(scope) {
      return getScope$1(this, scope);
    }
    describe(scope, values) {
      return set(descriptors, scope, values);
    }
    override(scope, values) {
      return set(overrides, scope, values);
    }
    route(scope, name, targetScope, targetName) {
      const scopeObject = getScope$1(this, scope);
      const targetScopeObject = getScope$1(this, targetScope);
      const privateName = '_' + name;
      Object.defineProperties(scopeObject, {
        [privateName]: {
          value: scopeObject[name],
          writable: true
        },
        [name]: {
          enumerable: true,
          get() {
            const local = this[privateName];
            const target = targetScopeObject[targetName];
            if (isObject(local)) {
              return Object.assign({}, target, local);
            }
            return valueOrDefault(local, target);
          },
          set(value) {
            this[privateName] = value;
          }
        }
      });
    }
  }
  var defaults = new Defaults({
    _scriptable: (name) => !name.startsWith('on'),
    _indexable: (name) => name !== 'events',
    hover: {
      _fallback: 'interaction'
    },
    interaction: {
      _scriptable: false,
      _indexable: false,
    }
  });

  function toFontString(font) {
    if (!font || isNullOrUndef(font.size) || isNullOrUndef(font.family)) {
      return null;
    }
    return (font.style ? font.style + ' ' : '')
  		+ (font.weight ? font.weight + ' ' : '')
  		+ font.size + 'px '
  		+ font.family;
  }
  function _measureText(ctx, data, gc, longest, string) {
    let textWidth = data[string];
    if (!textWidth) {
      textWidth = data[string] = ctx.measureText(string).width;
      gc.push(string);
    }
    if (textWidth > longest) {
      longest = textWidth;
    }
    return longest;
  }
  function _alignPixel(chart, pixel, width) {
    const devicePixelRatio = chart.currentDevicePixelRatio;
    const halfWidth = width !== 0 ? Math.max(width / 2, 0.5) : 0;
    return Math.round((pixel - halfWidth) * devicePixelRatio) / devicePixelRatio + halfWidth;
  }
  function clearCanvas(canvas, ctx) {
    ctx = ctx || canvas.getContext('2d');
    ctx.save();
    ctx.resetTransform();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }
  function _isPointInArea(point, area, margin) {
    margin = margin || 0.5;
    return point && point.x > area.left - margin && point.x < area.right + margin &&
  		point.y > area.top - margin && point.y < area.bottom + margin;
  }
  function clipArea(ctx, area) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(area.left, area.top, area.right - area.left, area.bottom - area.top);
    ctx.clip();
  }
  function unclipArea(ctx) {
    ctx.restore();
  }
  function renderText(ctx, text, x, y, font, opts = {}) {
    const lines = isArray(text) ? text : [text];
    const stroke = opts.strokeWidth > 0 && opts.strokeColor !== '';
    let i, line;
    ctx.save();
    if (opts.translation) {
      ctx.translate(opts.translation[0], opts.translation[1]);
    }
    if (!isNullOrUndef(opts.rotation)) {
      ctx.rotate(opts.rotation);
    }
    ctx.font = font.string;
    if (opts.color) {
      ctx.fillStyle = opts.color;
    }
    if (opts.textAlign) {
      ctx.textAlign = opts.textAlign;
    }
    if (opts.textBaseline) {
      ctx.textBaseline = opts.textBaseline;
    }
    for (i = 0; i < lines.length; ++i) {
      line = lines[i];
      if (stroke) {
        if (opts.strokeColor) {
          ctx.strokeStyle = opts.strokeColor;
        }
        if (!isNullOrUndef(opts.strokeWidth)) {
          ctx.lineWidth = opts.strokeWidth;
        }
        ctx.strokeText(line, x, y, opts.maxWidth);
      }
      ctx.fillText(line, x, y, opts.maxWidth);
      if (opts.strikethrough || opts.underline) {
        const metrics = ctx.measureText(line);
        const left = x - metrics.actualBoundingBoxLeft;
        const right = x + metrics.actualBoundingBoxRight;
        const top = y - metrics.actualBoundingBoxAscent;
        const bottom = y + metrics.actualBoundingBoxDescent;
        const yDecoration = opts.strikethrough ? (top + bottom) / 2 : bottom;
        ctx.strokeStyle = ctx.fillStyle;
        ctx.beginPath();
        ctx.lineWidth = opts.decorationWidth || 2;
        ctx.moveTo(left, yDecoration);
        ctx.lineTo(right, yDecoration);
        ctx.stroke();
      }
      y += font.lineHeight;
    }
    ctx.restore();
  }

  const LINE_HEIGHT = new RegExp(/^(normal|(\d+(?:\.\d+)?)(px|em|%)?)$/);
  const FONT_STYLE = new RegExp(/^(normal|italic|initial|inherit|unset|(oblique( -?[0-9]?[0-9]deg)?))$/);
  function toLineHeight(value, size) {
    const matches = ('' + value).match(LINE_HEIGHT);
    if (!matches || matches[1] === 'normal') {
      return size * 1.2;
    }
    value = +matches[2];
    switch (matches[3]) {
    case 'px':
      return value;
    case '%':
      value /= 100;
      break;
    }
    return size * value;
  }
  const numberOrZero = v => +v || 0;
  function _readValueToProps(value, props) {
    const ret = {};
    const objProps = isObject(props);
    const keys = objProps ? Object.keys(props) : props;
    const read = isObject(value)
      ? objProps
        ? prop => valueOrDefault(value[prop], value[props[prop]])
        : prop => value[prop]
      : () => value;
    for (const prop of keys) {
      ret[prop] = numberOrZero(read(prop));
    }
    return ret;
  }
  function toTRBL(value) {
    return _readValueToProps(value, {top: 'y', right: 'x', bottom: 'y', left: 'x'});
  }
  function toPadding(value) {
    const obj = toTRBL(value);
    obj.width = obj.left + obj.right;
    obj.height = obj.top + obj.bottom;
    return obj;
  }
  function toFont(options, fallback) {
    options = options || {};
    fallback = fallback || defaults.font;
    let size = valueOrDefault(options.size, fallback.size);
    if (typeof size === 'string') {
      size = parseInt(size, 10);
    }
    let style = valueOrDefault(options.style, fallback.style);
    if (style && !('' + style).match(FONT_STYLE)) {
      console.warn('Invalid font style specified: "' + style + '"');
      style = '';
    }
    const font = {
      family: valueOrDefault(options.family, fallback.family),
      lineHeight: toLineHeight(valueOrDefault(options.lineHeight, fallback.lineHeight), size),
      size,
      style,
      weight: valueOrDefault(options.weight, fallback.weight),
      string: ''
    };
    font.string = toFontString(font);
    return font;
  }
  function resolve(inputs, context, index, info) {
    let cacheable = true;
    let i, ilen, value;
    for (i = 0, ilen = inputs.length; i < ilen; ++i) {
      value = inputs[i];
      if (value === undefined) {
        continue;
      }
      if (context !== undefined && typeof value === 'function') {
        value = value(context);
        cacheable = false;
      }
      if (index !== undefined && isArray(value)) {
        value = value[index % value.length];
        cacheable = false;
      }
      if (value !== undefined) {
        if (info && !cacheable) {
          info.cacheable = false;
        }
        return value;
      }
    }
  }
  function _addGrace(minmax, grace) {
    const {min, max} = minmax;
    return {
      min: min - Math.abs(toDimension(grace, min)),
      max: max + toDimension(grace, max)
    };
  }

  function _lookup(table, value, cmp) {
    cmp = cmp || ((index) => table[index] < value);
    let hi = table.length - 1;
    let lo = 0;
    let mid;
    while (hi - lo > 1) {
      mid = (lo + hi) >> 1;
      if (cmp(mid)) {
        lo = mid;
      } else {
        hi = mid;
      }
    }
    return {lo, hi};
  }
  const _lookupByKey = (table, key, value) =>
    _lookup(table, value, index => table[index][key] < value);
  const _rlookupByKey = (table, key, value) =>
    _lookup(table, value, index => table[index][key] >= value);
  const arrayEvents = ['push', 'pop', 'shift', 'splice', 'unshift'];
  function listenArrayEvents(array, listener) {
    if (array._chartjs) {
      array._chartjs.listeners.push(listener);
      return;
    }
    Object.defineProperty(array, '_chartjs', {
      configurable: true,
      enumerable: false,
      value: {
        listeners: [listener]
      }
    });
    arrayEvents.forEach((key) => {
      const method = '_onData' + _capitalize(key);
      const base = array[key];
      Object.defineProperty(array, key, {
        configurable: true,
        enumerable: false,
        value(...args) {
          const res = base.apply(this, args);
          array._chartjs.listeners.forEach((object) => {
            if (typeof object[method] === 'function') {
              object[method](...args);
            }
          });
          return res;
        }
      });
    });
  }
  function unlistenArrayEvents(array, listener) {
    const stub = array._chartjs;
    if (!stub) {
      return;
    }
    const listeners = stub.listeners;
    const index = listeners.indexOf(listener);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
    if (listeners.length > 0) {
      return;
    }
    arrayEvents.forEach((key) => {
      delete array[key];
    });
    delete array._chartjs;
  }

  function _createResolver(scopes, prefixes = [''], rootScopes = scopes, fallback, getTarget = () => scopes[0]) {
    if (!defined(fallback)) {
      fallback = _resolve('_fallback', scopes);
    }
    const cache = {
      [Symbol.toStringTag]: 'Object',
      _cacheable: true,
      _scopes: scopes,
      _rootScopes: rootScopes,
      _fallback: fallback,
      _getTarget: getTarget,
      override: (scope) => _createResolver([scope, ...scopes], prefixes, rootScopes, fallback),
    };
    return new Proxy(cache, {
      deleteProperty(target, prop) {
        delete target[prop];
        delete target._keys;
        delete scopes[0][prop];
        return true;
      },
      get(target, prop) {
        return _cached(target, prop,
          () => _resolveWithPrefixes(prop, prefixes, scopes, target));
      },
      getOwnPropertyDescriptor(target, prop) {
        return Reflect.getOwnPropertyDescriptor(target._scopes[0], prop);
      },
      getPrototypeOf() {
        return Reflect.getPrototypeOf(scopes[0]);
      },
      has(target, prop) {
        return getKeysFromAllScopes(target).includes(prop);
      },
      ownKeys(target) {
        return getKeysFromAllScopes(target);
      },
      set(target, prop, value) {
        const storage = target._storage || (target._storage = getTarget());
        storage[prop] = value;
        delete target[prop];
        delete target._keys;
        return true;
      }
    });
  }
  function _attachContext(proxy, context, subProxy, descriptorDefaults) {
    const cache = {
      _cacheable: false,
      _proxy: proxy,
      _context: context,
      _subProxy: subProxy,
      _stack: new Set(),
      _descriptors: _descriptors(proxy, descriptorDefaults),
      setContext: (ctx) => _attachContext(proxy, ctx, subProxy, descriptorDefaults),
      override: (scope) => _attachContext(proxy.override(scope), context, subProxy, descriptorDefaults)
    };
    return new Proxy(cache, {
      deleteProperty(target, prop) {
        delete target[prop];
        delete proxy[prop];
        return true;
      },
      get(target, prop, receiver) {
        return _cached(target, prop,
          () => _resolveWithContext(target, prop, receiver));
      },
      getOwnPropertyDescriptor(target, prop) {
        return target._descriptors.allKeys
          ? Reflect.has(proxy, prop) ? {enumerable: true, configurable: true} : undefined
          : Reflect.getOwnPropertyDescriptor(proxy, prop);
      },
      getPrototypeOf() {
        return Reflect.getPrototypeOf(proxy);
      },
      has(target, prop) {
        return Reflect.has(proxy, prop);
      },
      ownKeys() {
        return Reflect.ownKeys(proxy);
      },
      set(target, prop, value) {
        proxy[prop] = value;
        delete target[prop];
        return true;
      }
    });
  }
  function _descriptors(proxy, defaults = {scriptable: true, indexable: true}) {
    const {_scriptable = defaults.scriptable, _indexable = defaults.indexable, _allKeys = defaults.allKeys} = proxy;
    return {
      allKeys: _allKeys,
      scriptable: _scriptable,
      indexable: _indexable,
      isScriptable: isFunction(_scriptable) ? _scriptable : () => _scriptable,
      isIndexable: isFunction(_indexable) ? _indexable : () => _indexable
    };
  }
  const readKey = (prefix, name) => prefix ? prefix + _capitalize(name) : name;
  const needsSubResolver = (prop, value) => isObject(value) && prop !== 'adapters';
  function _cached(target, prop, resolve) {
    let value = target[prop];
    if (defined(value)) {
      return value;
    }
    value = resolve();
    if (defined(value)) {
      target[prop] = value;
    }
    return value;
  }
  function _resolveWithContext(target, prop, receiver) {
    const {_proxy, _context, _subProxy, _descriptors: descriptors} = target;
    let value = _proxy[prop];
    if (isFunction(value) && descriptors.isScriptable(prop)) {
      value = _resolveScriptable(prop, value, target, receiver);
    }
    if (isArray(value) && value.length) {
      value = _resolveArray(prop, value, target, descriptors.isIndexable);
    }
    if (needsSubResolver(prop, value)) {
      value = _attachContext(value, _context, _subProxy && _subProxy[prop], descriptors);
    }
    return value;
  }
  function _resolveScriptable(prop, value, target, receiver) {
    const {_proxy, _context, _subProxy, _stack} = target;
    if (_stack.has(prop)) {
      throw new Error('Recursion detected: ' + [..._stack].join('->') + '->' + prop);
    }
    _stack.add(prop);
    value = value(_context, _subProxy || receiver);
    _stack.delete(prop);
    if (isObject(value)) {
      value = createSubResolver(_proxy._scopes, _proxy, prop, value);
    }
    return value;
  }
  function _resolveArray(prop, value, target, isIndexable) {
    const {_proxy, _context, _subProxy, _descriptors: descriptors} = target;
    if (defined(_context.index) && isIndexable(prop)) {
      value = value[_context.index % value.length];
    } else if (isObject(value[0])) {
      const arr = value;
      const scopes = _proxy._scopes.filter(s => s !== arr);
      value = [];
      for (const item of arr) {
        const resolver = createSubResolver(scopes, _proxy, prop, item);
        value.push(_attachContext(resolver, _context, _subProxy && _subProxy[prop], descriptors));
      }
    }
    return value;
  }
  function resolveFallback(fallback, prop, value) {
    return isFunction(fallback) ? fallback(prop, value) : fallback;
  }
  const getScope = (key, parent) => key === true ? parent
    : typeof key === 'string' ? resolveObjectKey(parent, key) : undefined;
  function addScopes(set, parentScopes, key, parentFallback) {
    for (const parent of parentScopes) {
      const scope = getScope(key, parent);
      if (scope) {
        set.add(scope);
        const fallback = resolveFallback(scope._fallback, key, scope);
        if (defined(fallback) && fallback !== key && fallback !== parentFallback) {
          return fallback;
        }
      } else if (scope === false && defined(parentFallback) && key !== parentFallback) {
        return null;
      }
    }
    return false;
  }
  function createSubResolver(parentScopes, resolver, prop, value) {
    const rootScopes = resolver._rootScopes;
    const fallback = resolveFallback(resolver._fallback, prop, value);
    const allScopes = [...parentScopes, ...rootScopes];
    const set = new Set();
    set.add(value);
    let key = addScopesFromKey(set, allScopes, prop, fallback || prop);
    if (key === null) {
      return false;
    }
    if (defined(fallback) && fallback !== prop) {
      key = addScopesFromKey(set, allScopes, fallback, key);
      if (key === null) {
        return false;
      }
    }
    return _createResolver([...set], [''], rootScopes, fallback, () => {
      const parent = resolver._getTarget();
      if (!(prop in parent)) {
        parent[prop] = {};
      }
      return parent[prop];
    });
  }
  function addScopesFromKey(set, allScopes, key, fallback) {
    while (key) {
      key = addScopes(set, allScopes, key, fallback);
    }
    return key;
  }
  function _resolveWithPrefixes(prop, prefixes, scopes, proxy) {
    let value;
    for (const prefix of prefixes) {
      value = _resolve(readKey(prefix, prop), scopes);
      if (defined(value)) {
        return needsSubResolver(prop, value)
          ? createSubResolver(scopes, proxy, prop, value)
          : value;
      }
    }
  }
  function _resolve(key, scopes) {
    for (const scope of scopes) {
      if (!scope) {
        continue;
      }
      const value = scope[key];
      if (defined(value)) {
        return value;
      }
    }
  }
  function getKeysFromAllScopes(target) {
    let keys = target._keys;
    if (!keys) {
      keys = target._keys = resolveKeysFromAllScopes(target._scopes);
    }
    return keys;
  }
  function resolveKeysFromAllScopes(scopes) {
    const set = new Set();
    for (const scope of scopes) {
      for (const key of Object.keys(scope).filter(k => !k.startsWith('_'))) {
        set.add(key);
      }
    }
    return [...set];
  }

  function _getParentNode(domNode) {
    let parent = domNode.parentNode;
    if (parent && parent.toString() === '[object ShadowRoot]') {
      parent = parent.host;
    }
    return parent;
  }
  function parseMaxStyle(styleValue, node, parentProperty) {
    let valueInPixels;
    if (typeof styleValue === 'string') {
      valueInPixels = parseInt(styleValue, 10);
      if (styleValue.indexOf('%') !== -1) {
        valueInPixels = valueInPixels / 100 * node.parentNode[parentProperty];
      }
    } else {
      valueInPixels = styleValue;
    }
    return valueInPixels;
  }
  const getComputedStyle$1 = (element) => window.getComputedStyle(element, null);
  function getStyle(el, property) {
    return getComputedStyle$1(el).getPropertyValue(property);
  }
  const positions = ['top', 'right', 'bottom', 'left'];
  function getPositionedStyle(styles, style, suffix) {
    const result = {};
    suffix = suffix ? '-' + suffix : '';
    for (let i = 0; i < 4; i++) {
      const pos = positions[i];
      result[pos] = parseFloat(styles[style + '-' + pos + suffix]) || 0;
    }
    result.width = result.left + result.right;
    result.height = result.top + result.bottom;
    return result;
  }
  const useOffsetPos = (x, y, target) => (x > 0 || y > 0) && (!target || !target.shadowRoot);
  function getCanvasPosition(evt, canvas) {
    const e = evt.native || evt;
    const touches = e.touches;
    const source = touches && touches.length ? touches[0] : e;
    const {offsetX, offsetY} = source;
    let box = false;
    let x, y;
    if (useOffsetPos(offsetX, offsetY, e.target)) {
      x = offsetX;
      y = offsetY;
    } else {
      const rect = canvas.getBoundingClientRect();
      x = source.clientX - rect.left;
      y = source.clientY - rect.top;
      box = true;
    }
    return {x, y, box};
  }
  function getRelativePosition$1(evt, chart) {
    const {canvas, currentDevicePixelRatio} = chart;
    const style = getComputedStyle$1(canvas);
    const borderBox = style.boxSizing === 'border-box';
    const paddings = getPositionedStyle(style, 'padding');
    const borders = getPositionedStyle(style, 'border', 'width');
    const {x, y, box} = getCanvasPosition(evt, canvas);
    const xOffset = paddings.left + (box && borders.left);
    const yOffset = paddings.top + (box && borders.top);
    let {width, height} = chart;
    if (borderBox) {
      width -= paddings.width + borders.width;
      height -= paddings.height + borders.height;
    }
    return {
      x: Math.round((x - xOffset) / width * canvas.width / currentDevicePixelRatio),
      y: Math.round((y - yOffset) / height * canvas.height / currentDevicePixelRatio)
    };
  }
  function getContainerSize(canvas, width, height) {
    let maxWidth, maxHeight;
    if (width === undefined || height === undefined) {
      const container = _getParentNode(canvas);
      if (!container) {
        width = canvas.clientWidth;
        height = canvas.clientHeight;
      } else {
        const rect = container.getBoundingClientRect();
        const containerStyle = getComputedStyle$1(container);
        const containerBorder = getPositionedStyle(containerStyle, 'border', 'width');
        const containerPadding = getPositionedStyle(containerStyle, 'padding');
        width = rect.width - containerPadding.width - containerBorder.width;
        height = rect.height - containerPadding.height - containerBorder.height;
        maxWidth = parseMaxStyle(containerStyle.maxWidth, container, 'clientWidth');
        maxHeight = parseMaxStyle(containerStyle.maxHeight, container, 'clientHeight');
      }
    }
    return {
      width,
      height,
      maxWidth: maxWidth || INFINITY,
      maxHeight: maxHeight || INFINITY
    };
  }
  const round1 = v => Math.round(v * 10) / 10;
  function getMaximumSize(canvas, bbWidth, bbHeight, aspectRatio) {
    const style = getComputedStyle$1(canvas);
    const margins = getPositionedStyle(style, 'margin');
    const maxWidth = parseMaxStyle(style.maxWidth, canvas, 'clientWidth') || INFINITY;
    const maxHeight = parseMaxStyle(style.maxHeight, canvas, 'clientHeight') || INFINITY;
    const containerSize = getContainerSize(canvas, bbWidth, bbHeight);
    let {width, height} = containerSize;
    if (style.boxSizing === 'content-box') {
      const borders = getPositionedStyle(style, 'border', 'width');
      const paddings = getPositionedStyle(style, 'padding');
      width -= paddings.width + borders.width;
      height -= paddings.height + borders.height;
    }
    width = Math.max(0, width - margins.width);
    height = Math.max(0, aspectRatio ? Math.floor(width / aspectRatio) : height - margins.height);
    width = round1(Math.min(width, maxWidth, containerSize.maxWidth));
    height = round1(Math.min(height, maxHeight, containerSize.maxHeight));
    if (width && !height) {
      height = round1(width / 2);
    }
    return {
      width,
      height
    };
  }
  function retinaScale(chart, forceRatio, forceStyle) {
    const pixelRatio = chart.currentDevicePixelRatio = forceRatio || 1;
    const {canvas, width, height} = chart;
    canvas.height = height * pixelRatio;
    canvas.width = width * pixelRatio;
    chart.ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    if (canvas.style && (forceStyle || (!canvas.style.height && !canvas.style.width))) {
      canvas.style.height = height + 'px';
      canvas.style.width = width + 'px';
    }
  }
  const supportsEventListenerOptions = (function() {
    let passiveSupported = false;
    try {
      const options = {
        get passive() {
          passiveSupported = true;
          return false;
        }
      };
      window.addEventListener('test', null, options);
      window.removeEventListener('test', null, options);
    } catch (e) {
    }
    return passiveSupported;
  }());
  function readUsedSize(element, property) {
    const value = getStyle(element, property);
    const matches = value && value.match(/^(\d+)(\.\d+)?px$/);
    return matches ? +matches[1] : undefined;
  }

  const intlCache = new Map();
  function getNumberFormat(locale, options) {
    options = options || {};
    const cacheKey = locale + JSON.stringify(options);
    let formatter = intlCache.get(cacheKey);
    if (!formatter) {
      formatter = new Intl.NumberFormat(locale, options);
      intlCache.set(cacheKey, formatter);
    }
    return formatter;
  }
  function formatNumber(num, locale, options) {
    return getNumberFormat(locale, options).format(num);
  }

  /*!
   * Chart.js v3.1.1
   * https://www.chartjs.org
   * (c) 2021 Chart.js Contributors
   * Released under the MIT License
   */

  class Animator {
    constructor() {
      this._request = null;
      this._charts = new Map();
      this._running = false;
      this._lastDate = undefined;
    }
    _notify(chart, anims, date, type) {
      const callbacks = anims.listeners[type];
      const numSteps = anims.duration;
      callbacks.forEach(fn => fn({
        chart,
        numSteps,
        currentStep: Math.min(date - anims.start, numSteps)
      }));
    }
    _refresh() {
      const me = this;
      if (me._request) {
        return;
      }
      me._running = true;
      me._request = requestAnimFrame.call(window, () => {
        me._update();
        me._request = null;
        if (me._running) {
          me._refresh();
        }
      });
    }
    _update(date = Date.now()) {
      const me = this;
      let remaining = 0;
      me._charts.forEach((anims, chart) => {
        if (!anims.running || !anims.items.length) {
          return;
        }
        const items = anims.items;
        let i = items.length - 1;
        let draw = false;
        let item;
        for (; i >= 0; --i) {
          item = items[i];
          if (item._active) {
            if (item._total > anims.duration) {
              anims.duration = item._total;
            }
            item.tick(date);
            draw = true;
          } else {
            items[i] = items[items.length - 1];
            items.pop();
          }
        }
        if (draw) {
          chart.draw();
          me._notify(chart, anims, date, 'progress');
        }
        if (!items.length) {
          anims.running = false;
          me._notify(chart, anims, date, 'complete');
        }
        remaining += items.length;
      });
      me._lastDate = date;
      if (remaining === 0) {
        me._running = false;
      }
    }
    _getAnims(chart) {
      const charts = this._charts;
      let anims = charts.get(chart);
      if (!anims) {
        anims = {
          running: false,
          items: [],
          listeners: {
            complete: [],
            progress: []
          }
        };
        charts.set(chart, anims);
      }
      return anims;
    }
    listen(chart, event, cb) {
      this._getAnims(chart).listeners[event].push(cb);
    }
    add(chart, items) {
      if (!items || !items.length) {
        return;
      }
      this._getAnims(chart).items.push(...items);
    }
    has(chart) {
      return this._getAnims(chart).items.length > 0;
    }
    start(chart) {
      const anims = this._charts.get(chart);
      if (!anims) {
        return;
      }
      anims.running = true;
      anims.start = Date.now();
      anims.duration = anims.items.reduce((acc, cur) => Math.max(acc, cur._duration), 0);
      this._refresh();
    }
    running(chart) {
      if (!this._running) {
        return false;
      }
      const anims = this._charts.get(chart);
      if (!anims || !anims.running || !anims.items.length) {
        return false;
      }
      return true;
    }
    stop(chart) {
      const anims = this._charts.get(chart);
      if (!anims || !anims.items.length) {
        return;
      }
      const items = anims.items;
      let i = items.length - 1;
      for (; i >= 0; --i) {
        items[i].cancel();
      }
      anims.items = [];
      this._notify(chart, anims, Date.now(), 'complete');
    }
    remove(chart) {
      return this._charts.delete(chart);
    }
  }
  var animator = new Animator();

  const transparent = 'transparent';
  const interpolators = {
    boolean(from, to, factor) {
      return factor > 0.5 ? to : from;
    },
    color(from, to, factor) {
      const c0 = color(from || transparent);
      const c1 = c0.valid && color(to || transparent);
      return c1 && c1.valid
        ? c1.mix(c0, factor).hexString()
        : to;
    },
    number(from, to, factor) {
      return from + (to - from) * factor;
    }
  };
  class Animation {
    constructor(cfg, target, prop, to) {
      const currentValue = target[prop];
      to = resolve([cfg.to, to, currentValue, cfg.from]);
      const from = resolve([cfg.from, currentValue, to]);
      this._active = true;
      this._fn = cfg.fn || interpolators[cfg.type || typeof from];
      this._easing = effects[cfg.easing] || effects.linear;
      this._start = Math.floor(Date.now() + (cfg.delay || 0));
      this._duration = this._total = Math.floor(cfg.duration);
      this._loop = !!cfg.loop;
      this._target = target;
      this._prop = prop;
      this._from = from;
      this._to = to;
      this._promises = undefined;
    }
    active() {
      return this._active;
    }
    update(cfg, to, date) {
      const me = this;
      if (me._active) {
        me._notify(false);
        const currentValue = me._target[me._prop];
        const elapsed = date - me._start;
        const remain = me._duration - elapsed;
        me._start = date;
        me._duration = Math.floor(Math.max(remain, cfg.duration));
        me._total += elapsed;
        me._loop = !!cfg.loop;
        me._to = resolve([cfg.to, to, currentValue, cfg.from]);
        me._from = resolve([cfg.from, currentValue, to]);
      }
    }
    cancel() {
      const me = this;
      if (me._active) {
        me.tick(Date.now());
        me._active = false;
        me._notify(false);
      }
    }
    tick(date) {
      const me = this;
      const elapsed = date - me._start;
      const duration = me._duration;
      const prop = me._prop;
      const from = me._from;
      const loop = me._loop;
      const to = me._to;
      let factor;
      me._active = from !== to && (loop || (elapsed < duration));
      if (!me._active) {
        me._target[prop] = to;
        me._notify(true);
        return;
      }
      if (elapsed < 0) {
        me._target[prop] = from;
        return;
      }
      factor = (elapsed / duration) % 2;
      factor = loop && factor > 1 ? 2 - factor : factor;
      factor = me._easing(Math.min(1, Math.max(0, factor)));
      me._target[prop] = me._fn(from, to, factor);
    }
    wait() {
      const promises = this._promises || (this._promises = []);
      return new Promise((res, rej) => {
        promises.push({res, rej});
      });
    }
    _notify(resolved) {
      const method = resolved ? 'res' : 'rej';
      const promises = this._promises || [];
      for (let i = 0; i < promises.length; i++) {
        promises[i][method]();
      }
    }
  }

  const numbers = ['x', 'y', 'borderWidth', 'radius', 'tension'];
  const colors = ['color', 'borderColor', 'backgroundColor'];
  defaults.set('animation', {
    delay: undefined,
    duration: 1000,
    easing: 'easeOutQuart',
    fn: undefined,
    from: undefined,
    loop: undefined,
    to: undefined,
    type: undefined,
  });
  const animationOptions = Object.keys(defaults.animation);
  defaults.describe('animation', {
    _fallback: false,
    _indexable: false,
    _scriptable: (name) => name !== 'onProgress' && name !== 'onComplete' && name !== 'fn',
  });
  defaults.set('animations', {
    colors: {
      type: 'color',
      properties: colors
    },
    numbers: {
      type: 'number',
      properties: numbers
    },
  });
  defaults.describe('animations', {
    _fallback: 'animation',
  });
  defaults.set('transitions', {
    active: {
      animation: {
        duration: 400
      }
    },
    resize: {
      animation: {
        duration: 0
      }
    },
    show: {
      animations: {
        colors: {
          from: 'transparent'
        },
        visible: {
          type: 'boolean',
          duration: 0
        },
      }
    },
    hide: {
      animations: {
        colors: {
          to: 'transparent'
        },
        visible: {
          type: 'boolean',
          easing: 'linear',
          fn: v => v | 0
        },
      }
    }
  });
  class Animations {
    constructor(chart, config) {
      this._chart = chart;
      this._properties = new Map();
      this.configure(config);
    }
    configure(config) {
      if (!isObject(config)) {
        return;
      }
      const animatedProps = this._properties;
      Object.getOwnPropertyNames(config).forEach(key => {
        const cfg = config[key];
        if (!isObject(cfg)) {
          return;
        }
        const resolved = {};
        for (const option of animationOptions) {
          resolved[option] = cfg[option];
        }
        (isArray(cfg.properties) && cfg.properties || [key]).forEach((prop) => {
          if (prop === key || !animatedProps.has(prop)) {
            animatedProps.set(prop, resolved);
          }
        });
      });
    }
    _animateOptions(target, values) {
      const newOptions = values.options;
      const options = resolveTargetOptions(target, newOptions);
      if (!options) {
        return [];
      }
      const animations = this._createAnimations(options, newOptions);
      if (newOptions.$shared) {
        awaitAll(target.options.$animations, newOptions).then(() => {
          target.options = newOptions;
        }, () => {
        });
      }
      return animations;
    }
    _createAnimations(target, values) {
      const animatedProps = this._properties;
      const animations = [];
      const running = target.$animations || (target.$animations = {});
      const props = Object.keys(values);
      const date = Date.now();
      let i;
      for (i = props.length - 1; i >= 0; --i) {
        const prop = props[i];
        if (prop.charAt(0) === '$') {
          continue;
        }
        if (prop === 'options') {
          animations.push(...this._animateOptions(target, values));
          continue;
        }
        const value = values[prop];
        let animation = running[prop];
        const cfg = animatedProps.get(prop);
        if (animation) {
          if (cfg && animation.active()) {
            animation.update(cfg, value, date);
            continue;
          } else {
            animation.cancel();
          }
        }
        if (!cfg || !cfg.duration) {
          target[prop] = value;
          continue;
        }
        running[prop] = animation = new Animation(cfg, target, prop, value);
        animations.push(animation);
      }
      return animations;
    }
    update(target, values) {
      if (this._properties.size === 0) {
        Object.assign(target, values);
        return;
      }
      const animations = this._createAnimations(target, values);
      if (animations.length) {
        animator.add(this._chart, animations);
        return true;
      }
    }
  }
  function awaitAll(animations, properties) {
    const running = [];
    const keys = Object.keys(properties);
    for (let i = 0; i < keys.length; i++) {
      const anim = animations[keys[i]];
      if (anim && anim.active()) {
        running.push(anim.wait());
      }
    }
    return Promise.all(running);
  }
  function resolveTargetOptions(target, newOptions) {
    if (!newOptions) {
      return;
    }
    let options = target.options;
    if (!options) {
      target.options = newOptions;
      return;
    }
    if (options.$shared) {
      target.options = options = Object.assign({}, options, {$shared: false, $animations: {}});
    }
    return options;
  }

  function scaleClip(scale, allowedOverflow) {
    const opts = scale && scale.options || {};
    const reverse = opts.reverse;
    const min = opts.min === undefined ? allowedOverflow : 0;
    const max = opts.max === undefined ? allowedOverflow : 0;
    return {
      start: reverse ? max : min,
      end: reverse ? min : max
    };
  }
  function defaultClip(xScale, yScale, allowedOverflow) {
    if (allowedOverflow === false) {
      return false;
    }
    const x = scaleClip(xScale, allowedOverflow);
    const y = scaleClip(yScale, allowedOverflow);
    return {
      top: y.end,
      right: x.end,
      bottom: y.start,
      left: x.start
    };
  }
  function toClip(value) {
    let t, r, b, l;
    if (isObject(value)) {
      t = value.top;
      r = value.right;
      b = value.bottom;
      l = value.left;
    } else {
      t = r = b = l = value;
    }
    return {
      top: t,
      right: r,
      bottom: b,
      left: l
    };
  }
  function getSortedDatasetIndices(chart, filterVisible) {
    const keys = [];
    const metasets = chart._getSortedDatasetMetas(filterVisible);
    let i, ilen;
    for (i = 0, ilen = metasets.length; i < ilen; ++i) {
      keys.push(metasets[i].index);
    }
    return keys;
  }
  function applyStack(stack, value, dsIndex, options) {
    const keys = stack.keys;
    const singleMode = options.mode === 'single';
    let i, ilen, datasetIndex, otherValue;
    if (value === null) {
      return;
    }
    for (i = 0, ilen = keys.length; i < ilen; ++i) {
      datasetIndex = +keys[i];
      if (datasetIndex === dsIndex) {
        if (options.all) {
          continue;
        }
        break;
      }
      otherValue = stack.values[datasetIndex];
      if (isNumberFinite(otherValue) && (singleMode || (value === 0 || sign(value) === sign(otherValue)))) {
        value += otherValue;
      }
    }
    return value;
  }
  function convertObjectDataToArray(data) {
    const keys = Object.keys(data);
    const adata = new Array(keys.length);
    let i, ilen, key;
    for (i = 0, ilen = keys.length; i < ilen; ++i) {
      key = keys[i];
      adata[i] = {
        x: key,
        y: data[key]
      };
    }
    return adata;
  }
  function isStacked(scale, meta) {
    const stacked = scale && scale.options.stacked;
    return stacked || (stacked === undefined && meta.stack !== undefined);
  }
  function getStackKey(indexScale, valueScale, meta) {
    return `${indexScale.id}.${valueScale.id}.${meta.stack || meta.type}`;
  }
  function getUserBounds(scale) {
    const {min, max, minDefined, maxDefined} = scale.getUserBounds();
    return {
      min: minDefined ? min : Number.NEGATIVE_INFINITY,
      max: maxDefined ? max : Number.POSITIVE_INFINITY
    };
  }
  function getOrCreateStack(stacks, stackKey, indexValue) {
    const subStack = stacks[stackKey] || (stacks[stackKey] = {});
    return subStack[indexValue] || (subStack[indexValue] = {});
  }
  function updateStacks(controller, parsed) {
    const {chart, _cachedMeta: meta} = controller;
    const stacks = chart._stacks || (chart._stacks = {});
    const {iScale, vScale, index: datasetIndex} = meta;
    const iAxis = iScale.axis;
    const vAxis = vScale.axis;
    const key = getStackKey(iScale, vScale, meta);
    const ilen = parsed.length;
    let stack;
    for (let i = 0; i < ilen; ++i) {
      const item = parsed[i];
      const {[iAxis]: index, [vAxis]: value} = item;
      const itemStacks = item._stacks || (item._stacks = {});
      stack = itemStacks[vAxis] = getOrCreateStack(stacks, key, index);
      stack[datasetIndex] = value;
    }
  }
  function getFirstScaleId(chart, axis) {
    const scales = chart.scales;
    return Object.keys(scales).filter(key => scales[key].axis === axis).shift();
  }
  function createDatasetContext(parent, index) {
    return Object.assign(Object.create(parent),
      {
        active: false,
        dataset: undefined,
        datasetIndex: index,
        index,
        mode: 'default',
        type: 'dataset'
      }
    );
  }
  function createDataContext(parent, index, element) {
    return Object.assign(Object.create(parent), {
      active: false,
      dataIndex: index,
      parsed: undefined,
      raw: undefined,
      element,
      index,
      mode: 'default',
      type: 'data'
    });
  }
  function clearStacks(meta, items) {
    items = items || meta._parsed;
    for (const parsed of items) {
      const stacks = parsed._stacks;
      if (!stacks || stacks[meta.vScale.id] === undefined || stacks[meta.vScale.id][meta.index] === undefined) {
        return;
      }
      delete stacks[meta.vScale.id][meta.index];
    }
  }
  const isDirectUpdateMode = (mode) => mode === 'reset' || mode === 'none';
  const cloneIfNotShared = (cached, shared) => shared ? cached : Object.assign({}, cached);
  class DatasetController {
    constructor(chart, datasetIndex) {
      this.chart = chart;
      this._ctx = chart.ctx;
      this.index = datasetIndex;
      this._cachedDataOpts = {};
      this._cachedMeta = this.getMeta();
      this._type = this._cachedMeta.type;
      this.options = undefined;
      this._parsing = false;
      this._data = undefined;
      this._objectData = undefined;
      this._sharedOptions = undefined;
      this._drawStart = undefined;
      this._drawCount = undefined;
      this.enableOptionSharing = false;
      this.$context = undefined;
      this.initialize();
    }
    initialize() {
      const me = this;
      const meta = me._cachedMeta;
      me.configure();
      me.linkScales();
      meta._stacked = isStacked(meta.vScale, meta);
      me.addElements();
    }
    updateIndex(datasetIndex) {
      this.index = datasetIndex;
    }
    linkScales() {
      const me = this;
      const chart = me.chart;
      const meta = me._cachedMeta;
      const dataset = me.getDataset();
      const chooseId = (axis, x, y, r) => axis === 'x' ? x : axis === 'r' ? r : y;
      const xid = meta.xAxisID = valueOrDefault(dataset.xAxisID, getFirstScaleId(chart, 'x'));
      const yid = meta.yAxisID = valueOrDefault(dataset.yAxisID, getFirstScaleId(chart, 'y'));
      const rid = meta.rAxisID = valueOrDefault(dataset.rAxisID, getFirstScaleId(chart, 'r'));
      const indexAxis = meta.indexAxis;
      const iid = meta.iAxisID = chooseId(indexAxis, xid, yid, rid);
      const vid = meta.vAxisID = chooseId(indexAxis, yid, xid, rid);
      meta.xScale = me.getScaleForId(xid);
      meta.yScale = me.getScaleForId(yid);
      meta.rScale = me.getScaleForId(rid);
      meta.iScale = me.getScaleForId(iid);
      meta.vScale = me.getScaleForId(vid);
    }
    getDataset() {
      return this.chart.data.datasets[this.index];
    }
    getMeta() {
      return this.chart.getDatasetMeta(this.index);
    }
    getScaleForId(scaleID) {
      return this.chart.scales[scaleID];
    }
    _getOtherScale(scale) {
      const meta = this._cachedMeta;
      return scale === meta.iScale
        ? meta.vScale
        : meta.iScale;
    }
    reset() {
      this._update('reset');
    }
    _destroy() {
      const meta = this._cachedMeta;
      if (this._data) {
        unlistenArrayEvents(this._data, this);
      }
      if (meta._stacked) {
        clearStacks(meta);
      }
    }
    _dataCheck() {
      const me = this;
      const dataset = me.getDataset();
      const data = dataset.data || (dataset.data = []);
      if (isObject(data)) {
        me._data = convertObjectDataToArray(data);
      } else if (me._data !== data) {
        if (me._data) {
          unlistenArrayEvents(me._data, me);
          clearStacks(me._cachedMeta);
        }
        if (data && Object.isExtensible(data)) {
          listenArrayEvents(data, me);
        }
        me._data = data;
      }
    }
    addElements() {
      const me = this;
      const meta = me._cachedMeta;
      me._dataCheck();
      if (me.datasetElementType) {
        meta.dataset = new me.datasetElementType();
      }
    }
    buildOrUpdateElements(resetNewElements) {
      const me = this;
      const meta = me._cachedMeta;
      const dataset = me.getDataset();
      let stackChanged = false;
      me._dataCheck();
      meta._stacked = isStacked(meta.vScale, meta);
      if (meta.stack !== dataset.stack) {
        stackChanged = true;
        clearStacks(meta);
        meta.stack = dataset.stack;
      }
      me._resyncElements(resetNewElements);
      if (stackChanged) {
        updateStacks(me, meta._parsed);
      }
    }
    configure() {
      const me = this;
      const config = me.chart.config;
      const scopeKeys = config.datasetScopeKeys(me._type);
      const scopes = config.getOptionScopes(me.getDataset(), scopeKeys, true);
      me.options = config.createResolver(scopes, me.getContext());
      me._parsing = me.options.parsing;
    }
    parse(start, count) {
      const me = this;
      const {_cachedMeta: meta, _data: data} = me;
      const {iScale, _stacked} = meta;
      const iAxis = iScale.axis;
      let sorted = start === 0 && count === data.length ? true : meta._sorted;
      let prev = start > 0 && meta._parsed[start - 1];
      let i, cur, parsed;
      if (me._parsing === false) {
        meta._parsed = data;
        meta._sorted = true;
      } else {
        if (isArray(data[start])) {
          parsed = me.parseArrayData(meta, data, start, count);
        } else if (isObject(data[start])) {
          parsed = me.parseObjectData(meta, data, start, count);
        } else {
          parsed = me.parsePrimitiveData(meta, data, start, count);
        }
        const isNotInOrderComparedToPrev = () => cur[iAxis] === null || (prev && cur[iAxis] < prev[iAxis]);
        for (i = 0; i < count; ++i) {
          meta._parsed[i + start] = cur = parsed[i];
          if (sorted) {
            if (isNotInOrderComparedToPrev()) {
              sorted = false;
            }
            prev = cur;
          }
        }
        meta._sorted = sorted;
      }
      if (_stacked) {
        updateStacks(me, parsed);
      }
    }
    parsePrimitiveData(meta, data, start, count) {
      const {iScale, vScale} = meta;
      const iAxis = iScale.axis;
      const vAxis = vScale.axis;
      const labels = iScale.getLabels();
      const singleScale = iScale === vScale;
      const parsed = new Array(count);
      let i, ilen, index;
      for (i = 0, ilen = count; i < ilen; ++i) {
        index = i + start;
        parsed[i] = {
          [iAxis]: singleScale || iScale.parse(labels[index], index),
          [vAxis]: vScale.parse(data[index], index)
        };
      }
      return parsed;
    }
    parseArrayData(meta, data, start, count) {
      const {xScale, yScale} = meta;
      const parsed = new Array(count);
      let i, ilen, index, item;
      for (i = 0, ilen = count; i < ilen; ++i) {
        index = i + start;
        item = data[index];
        parsed[i] = {
          x: xScale.parse(item[0], index),
          y: yScale.parse(item[1], index)
        };
      }
      return parsed;
    }
    parseObjectData(meta, data, start, count) {
      const {xScale, yScale} = meta;
      const {xAxisKey = 'x', yAxisKey = 'y'} = this._parsing;
      const parsed = new Array(count);
      let i, ilen, index, item;
      for (i = 0, ilen = count; i < ilen; ++i) {
        index = i + start;
        item = data[index];
        parsed[i] = {
          x: xScale.parse(resolveObjectKey(item, xAxisKey), index),
          y: yScale.parse(resolveObjectKey(item, yAxisKey), index)
        };
      }
      return parsed;
    }
    getParsed(index) {
      return this._cachedMeta._parsed[index];
    }
    getDataElement(index) {
      return this._cachedMeta.data[index];
    }
    applyStack(scale, parsed, mode) {
      const chart = this.chart;
      const meta = this._cachedMeta;
      const value = parsed[scale.axis];
      const stack = {
        keys: getSortedDatasetIndices(chart, true),
        values: parsed._stacks[scale.axis]
      };
      return applyStack(stack, value, meta.index, {mode});
    }
    updateRangeFromParsed(range, scale, parsed, stack) {
      const parsedValue = parsed[scale.axis];
      let value = parsedValue === null ? NaN : parsedValue;
      const values = stack && parsed._stacks[scale.axis];
      if (stack && values) {
        stack.values = values;
        range.min = Math.min(range.min, value);
        range.max = Math.max(range.max, value);
        value = applyStack(stack, parsedValue, this._cachedMeta.index, {all: true});
      }
      range.min = Math.min(range.min, value);
      range.max = Math.max(range.max, value);
    }
    getMinMax(scale, canStack) {
      const me = this;
      const meta = me._cachedMeta;
      const _parsed = meta._parsed;
      const sorted = meta._sorted && scale === meta.iScale;
      const ilen = _parsed.length;
      const otherScale = me._getOtherScale(scale);
      const stack = canStack && meta._stacked && {keys: getSortedDatasetIndices(me.chart, true), values: null};
      const range = {min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY};
      const {min: otherMin, max: otherMax} = getUserBounds(otherScale);
      let i, value, parsed, otherValue;
      function _skip() {
        parsed = _parsed[i];
        value = parsed[scale.axis];
        otherValue = parsed[otherScale.axis];
        return !isNumberFinite(value) || otherMin > otherValue || otherMax < otherValue;
      }
      for (i = 0; i < ilen; ++i) {
        if (_skip()) {
          continue;
        }
        me.updateRangeFromParsed(range, scale, parsed, stack);
        if (sorted) {
          break;
        }
      }
      if (sorted) {
        for (i = ilen - 1; i >= 0; --i) {
          if (_skip()) {
            continue;
          }
          me.updateRangeFromParsed(range, scale, parsed, stack);
          break;
        }
      }
      return range;
    }
    getAllParsedValues(scale) {
      const parsed = this._cachedMeta._parsed;
      const values = [];
      let i, ilen, value;
      for (i = 0, ilen = parsed.length; i < ilen; ++i) {
        value = parsed[i][scale.axis];
        if (isNumberFinite(value)) {
          values.push(value);
        }
      }
      return values;
    }
    getMaxOverflow() {
      return false;
    }
    getLabelAndValue(index) {
      const me = this;
      const meta = me._cachedMeta;
      const iScale = meta.iScale;
      const vScale = meta.vScale;
      const parsed = me.getParsed(index);
      return {
        label: iScale ? '' + iScale.getLabelForValue(parsed[iScale.axis]) : '',
        value: vScale ? '' + vScale.getLabelForValue(parsed[vScale.axis]) : ''
      };
    }
    _update(mode) {
      const me = this;
      const meta = me._cachedMeta;
      me.configure();
      me._cachedDataOpts = {};
      me.update(mode || 'default');
      meta._clip = toClip(valueOrDefault(me.options.clip, defaultClip(meta.xScale, meta.yScale, me.getMaxOverflow())));
    }
    update(mode) {}
    draw() {
      const me = this;
      const ctx = me._ctx;
      const chart = me.chart;
      const meta = me._cachedMeta;
      const elements = meta.data || [];
      const area = chart.chartArea;
      const active = [];
      const start = me._drawStart || 0;
      const count = me._drawCount || (elements.length - start);
      let i;
      if (meta.dataset) {
        meta.dataset.draw(ctx, area, start, count);
      }
      for (i = start; i < start + count; ++i) {
        const element = elements[i];
        if (element.active) {
          active.push(element);
        } else {
          element.draw(ctx, area);
        }
      }
      for (i = 0; i < active.length; ++i) {
        active[i].draw(ctx, area);
      }
    }
    getStyle(index, active) {
      const mode = active ? 'active' : 'default';
      return index === undefined && this._cachedMeta.dataset
        ? this.resolveDatasetElementOptions(mode)
        : this.resolveDataElementOptions(index || 0, mode);
    }
    getContext(index, active, mode) {
      const me = this;
      const dataset = me.getDataset();
      let context;
      if (index >= 0 && index < me._cachedMeta.data.length) {
        const element = me._cachedMeta.data[index];
        context = element.$context ||
          (element.$context = createDataContext(me.getContext(), index, element));
        context.parsed = me.getParsed(index);
        context.raw = dataset.data[index];
      } else {
        context = me.$context ||
          (me.$context = createDatasetContext(me.chart.getContext(), me.index));
        context.dataset = dataset;
      }
      context.active = !!active;
      context.mode = mode;
      return context;
    }
    resolveDatasetElementOptions(mode) {
      return this._resolveElementOptions(this.datasetElementType.id, mode);
    }
    resolveDataElementOptions(index, mode) {
      return this._resolveElementOptions(this.dataElementType.id, mode, index);
    }
    _resolveElementOptions(elementType, mode = 'default', index) {
      const me = this;
      const active = mode === 'active';
      const cache = me._cachedDataOpts;
      const cacheKey = elementType + '-' + mode;
      const cached = cache[cacheKey];
      const sharing = me.enableOptionSharing && defined(index);
      if (cached) {
        return cloneIfNotShared(cached, sharing);
      }
      const config = me.chart.config;
      const scopeKeys = config.datasetElementScopeKeys(me._type, elementType);
      const prefixes = active ? [`${elementType}Hover`, 'hover', elementType, ''] : [elementType, ''];
      const scopes = config.getOptionScopes(me.getDataset(), scopeKeys);
      const names = Object.keys(defaults.elements[elementType]);
      const context = () => me.getContext(index, active);
      const values = config.resolveNamedOptions(scopes, names, context, prefixes);
      if (values.$shared) {
        values.$shared = sharing;
        cache[cacheKey] = Object.freeze(cloneIfNotShared(values, sharing));
      }
      return values;
    }
    _resolveAnimations(index, transition, active) {
      const me = this;
      const chart = me.chart;
      const cache = me._cachedDataOpts;
      const cacheKey = `animation-${transition}`;
      const cached = cache[cacheKey];
      if (cached) {
        return cached;
      }
      let options;
      if (chart.options.animation !== false) {
        const config = me.chart.config;
        const scopeKeys = config.datasetAnimationScopeKeys(me._type, transition);
        const scopes = config.getOptionScopes(me.getDataset(), scopeKeys);
        options = config.createResolver(scopes, me.getContext(index, active, transition));
      }
      const animations = new Animations(chart, options && options.animations);
      if (options && options._cacheable) {
        cache[cacheKey] = Object.freeze(animations);
      }
      return animations;
    }
    getSharedOptions(options) {
      if (!options.$shared) {
        return;
      }
      return this._sharedOptions || (this._sharedOptions = Object.assign({}, options));
    }
    includeOptions(mode, sharedOptions) {
      return !sharedOptions || isDirectUpdateMode(mode) || this.chart._animationsDisabled;
    }
    updateElement(element, index, properties, mode) {
      if (isDirectUpdateMode(mode)) {
        Object.assign(element, properties);
      } else {
        this._resolveAnimations(index, mode).update(element, properties);
      }
    }
    updateSharedOptions(sharedOptions, mode, newOptions) {
      if (sharedOptions && !isDirectUpdateMode(mode)) {
        this._resolveAnimations(undefined, mode).update(sharedOptions, newOptions);
      }
    }
    _setStyle(element, index, mode, active) {
      element.active = active;
      const options = this.getStyle(index, active);
      this._resolveAnimations(index, mode, active).update(element, {
        options: (!active && this.getSharedOptions(options)) || options
      });
    }
    removeHoverStyle(element, datasetIndex, index) {
      this._setStyle(element, index, 'active', false);
    }
    setHoverStyle(element, datasetIndex, index) {
      this._setStyle(element, index, 'active', true);
    }
    _removeDatasetHoverStyle() {
      const element = this._cachedMeta.dataset;
      if (element) {
        this._setStyle(element, undefined, 'active', false);
      }
    }
    _setDatasetHoverStyle() {
      const element = this._cachedMeta.dataset;
      if (element) {
        this._setStyle(element, undefined, 'active', true);
      }
    }
    _resyncElements(resetNewElements) {
      const me = this;
      const numMeta = me._cachedMeta.data.length;
      const numData = me._data.length;
      if (numData > numMeta) {
        me._insertElements(numMeta, numData - numMeta, resetNewElements);
      } else if (numData < numMeta) {
        me._removeElements(numData, numMeta - numData);
      }
      const count = Math.min(numData, numMeta);
      if (count) {
        me.parse(0, count);
      }
    }
    _insertElements(start, count, resetNewElements = true) {
      const me = this;
      const meta = me._cachedMeta;
      const data = meta.data;
      const end = start + count;
      let i;
      const move = (arr) => {
        arr.length += count;
        for (i = arr.length - 1; i >= end; i--) {
          arr[i] = arr[i - count];
        }
      };
      move(data);
      for (i = start; i < end; ++i) {
        data[i] = new me.dataElementType();
      }
      if (me._parsing) {
        move(meta._parsed);
      }
      me.parse(start, count);
      if (resetNewElements) {
        me.updateElements(data, start, count, 'reset');
      }
    }
    updateElements(element, start, count, mode) {}
    _removeElements(start, count) {
      const me = this;
      const meta = me._cachedMeta;
      if (me._parsing) {
        const removed = meta._parsed.splice(start, count);
        if (meta._stacked) {
          clearStacks(meta, removed);
        }
      }
      meta.data.splice(start, count);
    }
    _onDataPush() {
      const count = arguments.length;
      this._insertElements(this.getDataset().data.length - count, count);
    }
    _onDataPop() {
      this._removeElements(this._cachedMeta.data.length - 1, 1);
    }
    _onDataShift() {
      this._removeElements(0, 1);
    }
    _onDataSplice(start, count) {
      this._removeElements(start, count);
      this._insertElements(start, arguments.length - 2);
    }
    _onDataUnshift() {
      this._insertElements(0, arguments.length);
    }
  }
  DatasetController.defaults = {};
  DatasetController.prototype.datasetElementType = null;
  DatasetController.prototype.dataElementType = null;

  function getRatioAndOffset(rotation, circumference, cutout) {
    let ratioX = 1;
    let ratioY = 1;
    let offsetX = 0;
    let offsetY = 0;
    if (circumference < TAU) {
      const startAngle = rotation;
      const endAngle = startAngle + circumference;
      const startX = Math.cos(startAngle);
      const startY = Math.sin(startAngle);
      const endX = Math.cos(endAngle);
      const endY = Math.sin(endAngle);
      const calcMax = (angle, a, b) => _angleBetween(angle, startAngle, endAngle) ? 1 : Math.max(a, a * cutout, b, b * cutout);
      const calcMin = (angle, a, b) => _angleBetween(angle, startAngle, endAngle) ? -1 : Math.min(a, a * cutout, b, b * cutout);
      const maxX = calcMax(0, startX, endX);
      const maxY = calcMax(HALF_PI, startY, endY);
      const minX = calcMin(PI, startX, endX);
      const minY = calcMin(PI + HALF_PI, startY, endY);
      ratioX = (maxX - minX) / 2;
      ratioY = (maxY - minY) / 2;
      offsetX = -(maxX + minX) / 2;
      offsetY = -(maxY + minY) / 2;
    }
    return {ratioX, ratioY, offsetX, offsetY};
  }
  class DoughnutController extends DatasetController {
    constructor(chart, datasetIndex) {
      super(chart, datasetIndex);
      this.enableOptionSharing = true;
      this.innerRadius = undefined;
      this.outerRadius = undefined;
      this.offsetX = undefined;
      this.offsetY = undefined;
    }
    linkScales() {}
    parse(start, count) {
      const data = this.getDataset().data;
      const meta = this._cachedMeta;
      let i, ilen;
      for (i = start, ilen = start + count; i < ilen; ++i) {
        meta._parsed[i] = +data[i];
      }
    }
    _getRotation() {
      return toRadians(this.options.rotation - 90);
    }
    _getCircumference() {
      return toRadians(this.options.circumference);
    }
    _getRotationExtents() {
      let min = TAU;
      let max = -TAU;
      const me = this;
      for (let i = 0; i < me.chart.data.datasets.length; ++i) {
        if (me.chart.isDatasetVisible(i)) {
          const controller = me.chart.getDatasetMeta(i).controller;
          const rotation = controller._getRotation();
          const circumference = controller._getCircumference();
          min = Math.min(min, rotation);
          max = Math.max(max, rotation + circumference);
        }
      }
      return {
        rotation: min,
        circumference: max - min,
      };
    }
    update(mode) {
      const me = this;
      const chart = me.chart;
      const {chartArea} = chart;
      const meta = me._cachedMeta;
      const arcs = meta.data;
      const spacing = me.getMaxBorderWidth() + me.getMaxOffset(arcs);
      const maxSize = Math.max((Math.min(chartArea.width, chartArea.height) - spacing) / 2, 0);
      const cutout = Math.min(toPercentage(me.options.cutout, maxSize), 1);
      const chartWeight = me._getRingWeight(me.index);
      const {circumference, rotation} = me._getRotationExtents();
      const {ratioX, ratioY, offsetX, offsetY} = getRatioAndOffset(rotation, circumference, cutout);
      const maxWidth = (chartArea.width - spacing) / ratioX;
      const maxHeight = (chartArea.height - spacing) / ratioY;
      const maxRadius = Math.max(Math.min(maxWidth, maxHeight) / 2, 0);
      const outerRadius = toDimension(me.options.radius, maxRadius);
      const innerRadius = Math.max(outerRadius * cutout, 0);
      const radiusLength = (outerRadius - innerRadius) / me._getVisibleDatasetWeightTotal();
      me.offsetX = offsetX * outerRadius;
      me.offsetY = offsetY * outerRadius;
      meta.total = me.calculateTotal();
      me.outerRadius = outerRadius - radiusLength * me._getRingWeightOffset(me.index);
      me.innerRadius = Math.max(me.outerRadius - radiusLength * chartWeight, 0);
      me.updateElements(arcs, 0, arcs.length, mode);
    }
    _circumference(i, reset) {
      const me = this;
      const opts = me.options;
      const meta = me._cachedMeta;
      const circumference = me._getCircumference();
      if ((reset && opts.animation.animateRotate) || !this.chart.getDataVisibility(i) || meta._parsed[i] === null) {
        return 0;
      }
      return me.calculateCircumference(meta._parsed[i] * circumference / TAU);
    }
    updateElements(arcs, start, count, mode) {
      const me = this;
      const reset = mode === 'reset';
      const chart = me.chart;
      const chartArea = chart.chartArea;
      const opts = chart.options;
      const animationOpts = opts.animation;
      const centerX = (chartArea.left + chartArea.right) / 2;
      const centerY = (chartArea.top + chartArea.bottom) / 2;
      const animateScale = reset && animationOpts.animateScale;
      const innerRadius = animateScale ? 0 : me.innerRadius;
      const outerRadius = animateScale ? 0 : me.outerRadius;
      const firstOpts = me.resolveDataElementOptions(start, mode);
      const sharedOptions = me.getSharedOptions(firstOpts);
      const includeOptions = me.includeOptions(mode, sharedOptions);
      let startAngle = me._getRotation();
      let i;
      for (i = 0; i < start; ++i) {
        startAngle += me._circumference(i, reset);
      }
      for (i = start; i < start + count; ++i) {
        const circumference = me._circumference(i, reset);
        const arc = arcs[i];
        const properties = {
          x: centerX + me.offsetX,
          y: centerY + me.offsetY,
          startAngle,
          endAngle: startAngle + circumference,
          circumference,
          outerRadius,
          innerRadius
        };
        if (includeOptions) {
          properties.options = sharedOptions || me.resolveDataElementOptions(i, mode);
        }
        startAngle += circumference;
        me.updateElement(arc, i, properties, mode);
      }
      me.updateSharedOptions(sharedOptions, mode, firstOpts);
    }
    calculateTotal() {
      const meta = this._cachedMeta;
      const metaData = meta.data;
      let total = 0;
      let i;
      for (i = 0; i < metaData.length; i++) {
        const value = meta._parsed[i];
        if (value !== null && !isNaN(value) && this.chart.getDataVisibility(i)) {
          total += Math.abs(value);
        }
      }
      return total;
    }
    calculateCircumference(value) {
      const total = this._cachedMeta.total;
      if (total > 0 && !isNaN(value)) {
        return TAU * (Math.abs(value) / total);
      }
      return 0;
    }
    getLabelAndValue(index) {
      const me = this;
      const meta = me._cachedMeta;
      const chart = me.chart;
      const labels = chart.data.labels || [];
      const value = formatNumber(meta._parsed[index], chart.options.locale);
      return {
        label: labels[index] || '',
        value,
      };
    }
    getMaxBorderWidth(arcs) {
      const me = this;
      let max = 0;
      const chart = me.chart;
      let i, ilen, meta, controller, options;
      if (!arcs) {
        for (i = 0, ilen = chart.data.datasets.length; i < ilen; ++i) {
          if (chart.isDatasetVisible(i)) {
            meta = chart.getDatasetMeta(i);
            arcs = meta.data;
            controller = meta.controller;
            if (controller !== me) {
              controller.configure();
            }
            break;
          }
        }
      }
      if (!arcs) {
        return 0;
      }
      for (i = 0, ilen = arcs.length; i < ilen; ++i) {
        options = controller.resolveDataElementOptions(i);
        if (options.borderAlign !== 'inner') {
          max = Math.max(max, options.borderWidth || 0, options.hoverBorderWidth || 0);
        }
      }
      return max;
    }
    getMaxOffset(arcs) {
      let max = 0;
      for (let i = 0, ilen = arcs.length; i < ilen; ++i) {
        const options = this.resolveDataElementOptions(i);
        max = Math.max(max, options.offset || 0, options.hoverOffset || 0);
      }
      return max;
    }
    _getRingWeightOffset(datasetIndex) {
      let ringWeightOffset = 0;
      for (let i = 0; i < datasetIndex; ++i) {
        if (this.chart.isDatasetVisible(i)) {
          ringWeightOffset += this._getRingWeight(i);
        }
      }
      return ringWeightOffset;
    }
    _getRingWeight(datasetIndex) {
      return Math.max(valueOrDefault(this.chart.data.datasets[datasetIndex].weight, 1), 0);
    }
    _getVisibleDatasetWeightTotal() {
      return this._getRingWeightOffset(this.chart.data.datasets.length) || 1;
    }
  }
  DoughnutController.id = 'doughnut';
  DoughnutController.defaults = {
    datasetElementType: false,
    dataElementType: 'arc',
    animation: {
      animateRotate: true,
      animateScale: false
    },
    animations: {
      numbers: {
        type: 'number',
        properties: ['circumference', 'endAngle', 'innerRadius', 'outerRadius', 'startAngle', 'x', 'y', 'offset', 'borderWidth']
      },
    },
    cutout: '50%',
    rotation: 0,
    circumference: 360,
    radius: '100%',
    indexAxis: 'r',
  };
  DoughnutController.overrides = {
    aspectRatio: 1,
    plugins: {
      legend: {
        labels: {
          generateLabels(chart) {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const meta = chart.getDatasetMeta(0);
                const style = meta.controller.getStyle(i);
                return {
                  text: label,
                  fillStyle: style.backgroundColor,
                  strokeStyle: style.borderColor,
                  lineWidth: style.borderWidth,
                  hidden: !chart.getDataVisibility(i),
                  index: i
                };
              });
            }
            return [];
          }
        },
        onClick(e, legendItem, legend) {
          legend.chart.toggleDataVisibility(legendItem.index);
          legend.chart.update();
        }
      },
      tooltip: {
        callbacks: {
          title() {
            return '';
          },
          label(tooltipItem) {
            let dataLabel = tooltipItem.label;
            const value = ': ' + tooltipItem.formattedValue;
            if (isArray(dataLabel)) {
              dataLabel = dataLabel.slice();
              dataLabel[0] += value;
            } else {
              dataLabel += value;
            }
            return dataLabel;
          }
        }
      }
    }
  };

  function getRelativePosition(e, chart) {
    if ('native' in e) {
      return {
        x: e.x,
        y: e.y
      };
    }
    return getRelativePosition$1(e, chart);
  }
  function evaluateAllVisibleItems(chart, handler) {
    const metasets = chart.getSortedVisibleDatasetMetas();
    let index, data, element;
    for (let i = 0, ilen = metasets.length; i < ilen; ++i) {
      ({index, data} = metasets[i]);
      for (let j = 0, jlen = data.length; j < jlen; ++j) {
        element = data[j];
        if (!element.skip) {
          handler(element, index, j);
        }
      }
    }
  }
  function binarySearch(metaset, axis, value, intersect) {
    const {controller, data, _sorted} = metaset;
    const iScale = controller._cachedMeta.iScale;
    if (iScale && axis === iScale.axis && _sorted && data.length) {
      const lookupMethod = iScale._reversePixels ? _rlookupByKey : _lookupByKey;
      if (!intersect) {
        return lookupMethod(data, axis, value);
      } else if (controller._sharedOptions) {
        const el = data[0];
        const range = typeof el.getRange === 'function' && el.getRange(axis);
        if (range) {
          const start = lookupMethod(data, axis, value - range);
          const end = lookupMethod(data, axis, value + range);
          return {lo: start.lo, hi: end.hi};
        }
      }
    }
    return {lo: 0, hi: data.length - 1};
  }
  function optimizedEvaluateItems(chart, axis, position, handler, intersect) {
    const metasets = chart.getSortedVisibleDatasetMetas();
    const value = position[axis];
    for (let i = 0, ilen = metasets.length; i < ilen; ++i) {
      const {index, data} = metasets[i];
      const {lo, hi} = binarySearch(metasets[i], axis, value, intersect);
      for (let j = lo; j <= hi; ++j) {
        const element = data[j];
        if (!element.skip) {
          handler(element, index, j);
        }
      }
    }
  }
  function getDistanceMetricForAxis(axis) {
    const useX = axis.indexOf('x') !== -1;
    const useY = axis.indexOf('y') !== -1;
    return function(pt1, pt2) {
      const deltaX = useX ? Math.abs(pt1.x - pt2.x) : 0;
      const deltaY = useY ? Math.abs(pt1.y - pt2.y) : 0;
      return Math.sqrt(Math.pow(deltaX, 2) + Math.pow(deltaY, 2));
    };
  }
  function getIntersectItems(chart, position, axis, useFinalPosition) {
    const items = [];
    if (!_isPointInArea(position, chart.chartArea, chart._minPadding)) {
      return items;
    }
    const evaluationFunc = function(element, datasetIndex, index) {
      if (element.inRange(position.x, position.y, useFinalPosition)) {
        items.push({element, datasetIndex, index});
      }
    };
    optimizedEvaluateItems(chart, axis, position, evaluationFunc, true);
    return items;
  }
  function getNearestItems(chart, position, axis, intersect, useFinalPosition) {
    const distanceMetric = getDistanceMetricForAxis(axis);
    let minDistance = Number.POSITIVE_INFINITY;
    let items = [];
    if (!_isPointInArea(position, chart.chartArea, chart._minPadding)) {
      return items;
    }
    const evaluationFunc = function(element, datasetIndex, index) {
      if (intersect && !element.inRange(position.x, position.y, useFinalPosition)) {
        return;
      }
      const center = element.getCenterPoint(useFinalPosition);
      const distance = distanceMetric(position, center);
      if (distance < minDistance) {
        items = [{element, datasetIndex, index}];
        minDistance = distance;
      } else if (distance === minDistance) {
        items.push({element, datasetIndex, index});
      }
    };
    optimizedEvaluateItems(chart, axis, position, evaluationFunc);
    return items;
  }
  function getAxisItems(chart, e, options, useFinalPosition) {
    const position = getRelativePosition(e, chart);
    const items = [];
    const axis = options.axis;
    const rangeMethod = axis === 'x' ? 'inXRange' : 'inYRange';
    let intersectsItem = false;
    evaluateAllVisibleItems(chart, (element, datasetIndex, index) => {
      if (element[rangeMethod](position[axis], useFinalPosition)) {
        items.push({element, datasetIndex, index});
      }
      if (element.inRange(position.x, position.y, useFinalPosition)) {
        intersectsItem = true;
      }
    });
    if (options.intersect && !intersectsItem) {
      return [];
    }
    return items;
  }
  var Interaction = {
    modes: {
      index(chart, e, options, useFinalPosition) {
        const position = getRelativePosition(e, chart);
        const axis = options.axis || 'x';
        const items = options.intersect
          ? getIntersectItems(chart, position, axis, useFinalPosition)
          : getNearestItems(chart, position, axis, false, useFinalPosition);
        const elements = [];
        if (!items.length) {
          return [];
        }
        chart.getSortedVisibleDatasetMetas().forEach((meta) => {
          const index = items[0].index;
          const element = meta.data[index];
          if (element && !element.skip) {
            elements.push({element, datasetIndex: meta.index, index});
          }
        });
        return elements;
      },
      dataset(chart, e, options, useFinalPosition) {
        const position = getRelativePosition(e, chart);
        const axis = options.axis || 'xy';
        let items = options.intersect
          ? getIntersectItems(chart, position, axis, useFinalPosition) :
          getNearestItems(chart, position, axis, false, useFinalPosition);
        if (items.length > 0) {
          const datasetIndex = items[0].datasetIndex;
          const data = chart.getDatasetMeta(datasetIndex).data;
          items = [];
          for (let i = 0; i < data.length; ++i) {
            items.push({element: data[i], datasetIndex, index: i});
          }
        }
        return items;
      },
      point(chart, e, options, useFinalPosition) {
        const position = getRelativePosition(e, chart);
        const axis = options.axis || 'xy';
        return getIntersectItems(chart, position, axis, useFinalPosition);
      },
      nearest(chart, e, options, useFinalPosition) {
        const position = getRelativePosition(e, chart);
        const axis = options.axis || 'xy';
        return getNearestItems(chart, position, axis, options.intersect, useFinalPosition);
      },
      x(chart, e, options, useFinalPosition) {
        options.axis = 'x';
        return getAxisItems(chart, e, options, useFinalPosition);
      },
      y(chart, e, options, useFinalPosition) {
        options.axis = 'y';
        return getAxisItems(chart, e, options, useFinalPosition);
      }
    }
  };

  const STATIC_POSITIONS = ['left', 'top', 'right', 'bottom'];
  function filterByPosition(array, position) {
    return array.filter(v => v.pos === position);
  }
  function filterDynamicPositionByAxis(array, axis) {
    return array.filter(v => STATIC_POSITIONS.indexOf(v.pos) === -1 && v.box.axis === axis);
  }
  function sortByWeight(array, reverse) {
    return array.sort((a, b) => {
      const v0 = reverse ? b : a;
      const v1 = reverse ? a : b;
      return v0.weight === v1.weight ?
        v0.index - v1.index :
        v0.weight - v1.weight;
    });
  }
  function wrapBoxes(boxes) {
    const layoutBoxes = [];
    let i, ilen, box;
    for (i = 0, ilen = (boxes || []).length; i < ilen; ++i) {
      box = boxes[i];
      layoutBoxes.push({
        index: i,
        box,
        pos: box.position,
        horizontal: box.isHorizontal(),
        weight: box.weight
      });
    }
    return layoutBoxes;
  }
  function setLayoutDims(layouts, params) {
    let i, ilen, layout;
    for (i = 0, ilen = layouts.length; i < ilen; ++i) {
      layout = layouts[i];
      if (layout.horizontal) {
        layout.width = layout.box.fullSize && params.availableWidth;
        layout.height = params.hBoxMaxHeight;
      } else {
        layout.width = params.vBoxMaxWidth;
        layout.height = layout.box.fullSize && params.availableHeight;
      }
    }
  }
  function buildLayoutBoxes(boxes) {
    const layoutBoxes = wrapBoxes(boxes);
    const fullSize = sortByWeight(layoutBoxes.filter(wrap => wrap.box.fullSize), true);
    const left = sortByWeight(filterByPosition(layoutBoxes, 'left'), true);
    const right = sortByWeight(filterByPosition(layoutBoxes, 'right'));
    const top = sortByWeight(filterByPosition(layoutBoxes, 'top'), true);
    const bottom = sortByWeight(filterByPosition(layoutBoxes, 'bottom'));
    const centerHorizontal = filterDynamicPositionByAxis(layoutBoxes, 'x');
    const centerVertical = filterDynamicPositionByAxis(layoutBoxes, 'y');
    return {
      fullSize,
      leftAndTop: left.concat(top),
      rightAndBottom: right.concat(centerVertical).concat(bottom).concat(centerHorizontal),
      chartArea: filterByPosition(layoutBoxes, 'chartArea'),
      vertical: left.concat(right).concat(centerVertical),
      horizontal: top.concat(bottom).concat(centerHorizontal)
    };
  }
  function getCombinedMax(maxPadding, chartArea, a, b) {
    return Math.max(maxPadding[a], chartArea[a]) + Math.max(maxPadding[b], chartArea[b]);
  }
  function updateMaxPadding(maxPadding, boxPadding) {
    maxPadding.top = Math.max(maxPadding.top, boxPadding.top);
    maxPadding.left = Math.max(maxPadding.left, boxPadding.left);
    maxPadding.bottom = Math.max(maxPadding.bottom, boxPadding.bottom);
    maxPadding.right = Math.max(maxPadding.right, boxPadding.right);
  }
  function updateDims(chartArea, params, layout) {
    const box = layout.box;
    const maxPadding = chartArea.maxPadding;
    if (!isObject(layout.pos)) {
      if (layout.size) {
        chartArea[layout.pos] -= layout.size;
      }
      layout.size = layout.horizontal ? box.height : box.width;
      chartArea[layout.pos] += layout.size;
    }
    if (box.getPadding) {
      updateMaxPadding(maxPadding, box.getPadding());
    }
    const newWidth = Math.max(0, params.outerWidth - getCombinedMax(maxPadding, chartArea, 'left', 'right'));
    const newHeight = Math.max(0, params.outerHeight - getCombinedMax(maxPadding, chartArea, 'top', 'bottom'));
    const widthChanged = newWidth !== chartArea.w;
    const heightChanged = newHeight !== chartArea.h;
    chartArea.w = newWidth;
    chartArea.h = newHeight;
    return layout.horizontal
      ? {same: widthChanged, other: heightChanged}
      : {same: heightChanged, other: widthChanged};
  }
  function handleMaxPadding(chartArea) {
    const maxPadding = chartArea.maxPadding;
    function updatePos(pos) {
      const change = Math.max(maxPadding[pos] - chartArea[pos], 0);
      chartArea[pos] += change;
      return change;
    }
    chartArea.y += updatePos('top');
    chartArea.x += updatePos('left');
    updatePos('right');
    updatePos('bottom');
  }
  function getMargins(horizontal, chartArea) {
    const maxPadding = chartArea.maxPadding;
    function marginForPositions(positions) {
      const margin = {left: 0, top: 0, right: 0, bottom: 0};
      positions.forEach((pos) => {
        margin[pos] = Math.max(chartArea[pos], maxPadding[pos]);
      });
      return margin;
    }
    return horizontal
      ? marginForPositions(['left', 'right'])
      : marginForPositions(['top', 'bottom']);
  }
  function fitBoxes(boxes, chartArea, params) {
    const refitBoxes = [];
    let i, ilen, layout, box, refit, changed;
    for (i = 0, ilen = boxes.length, refit = 0; i < ilen; ++i) {
      layout = boxes[i];
      box = layout.box;
      box.update(
        layout.width || chartArea.w,
        layout.height || chartArea.h,
        getMargins(layout.horizontal, chartArea)
      );
      const {same, other} = updateDims(chartArea, params, layout);
      refit |= same && refitBoxes.length;
      changed = changed || other;
      if (!box.fullSize) {
        refitBoxes.push(layout);
      }
    }
    return refit && fitBoxes(refitBoxes, chartArea, params) || changed;
  }
  function placeBoxes(boxes, chartArea, params) {
    const userPadding = params.padding;
    let x = chartArea.x;
    let y = chartArea.y;
    let i, ilen, layout, box;
    for (i = 0, ilen = boxes.length; i < ilen; ++i) {
      layout = boxes[i];
      box = layout.box;
      if (layout.horizontal) {
        box.left = box.fullSize ? userPadding.left : chartArea.left;
        box.right = box.fullSize ? params.outerWidth - userPadding.right : chartArea.left + chartArea.w;
        box.top = y;
        box.bottom = y + box.height;
        box.width = box.right - box.left;
        y = box.bottom;
      } else {
        box.left = x;
        box.right = x + box.width;
        box.top = box.fullSize ? userPadding.top : chartArea.top;
        box.bottom = box.fullSize ? params.outerHeight - userPadding.right : chartArea.top + chartArea.h;
        box.height = box.bottom - box.top;
        x = box.right;
      }
    }
    chartArea.x = x;
    chartArea.y = y;
  }
  defaults.set('layout', {
    padding: {
      top: 0,
      right: 0,
      bottom: 0,
      left: 0
    }
  });
  var layouts = {
    addBox(chart, item) {
      if (!chart.boxes) {
        chart.boxes = [];
      }
      item.fullSize = item.fullSize || false;
      item.position = item.position || 'top';
      item.weight = item.weight || 0;
      item._layers = item._layers || function() {
        return [{
          z: 0,
          draw(chartArea) {
            item.draw(chartArea);
          }
        }];
      };
      chart.boxes.push(item);
    },
    removeBox(chart, layoutItem) {
      const index = chart.boxes ? chart.boxes.indexOf(layoutItem) : -1;
      if (index !== -1) {
        chart.boxes.splice(index, 1);
      }
    },
    configure(chart, item, options) {
      item.fullSize = options.fullSize;
      item.position = options.position;
      item.weight = options.weight;
    },
    update(chart, width, height, minPadding) {
      if (!chart) {
        return;
      }
      const padding = toPadding(chart.options.layout.padding);
      const availableWidth = width - padding.width;
      const availableHeight = height - padding.height;
      const boxes = buildLayoutBoxes(chart.boxes);
      const verticalBoxes = boxes.vertical;
      const horizontalBoxes = boxes.horizontal;
      each(chart.boxes, box => {
        if (typeof box.beforeLayout === 'function') {
          box.beforeLayout();
        }
      });
      const visibleVerticalBoxCount = verticalBoxes.reduce((total, wrap) =>
        wrap.box.options && wrap.box.options.display === false ? total : total + 1, 0) || 1;
      const params = Object.freeze({
        outerWidth: width,
        outerHeight: height,
        padding,
        availableWidth,
        availableHeight,
        vBoxMaxWidth: availableWidth / 2 / visibleVerticalBoxCount,
        hBoxMaxHeight: availableHeight / 2
      });
      const maxPadding = Object.assign({}, padding);
      updateMaxPadding(maxPadding, toPadding(minPadding));
      const chartArea = Object.assign({
        maxPadding,
        w: availableWidth,
        h: availableHeight,
        x: padding.left,
        y: padding.top
      }, padding);
      setLayoutDims(verticalBoxes.concat(horizontalBoxes), params);
      fitBoxes(boxes.fullSize, chartArea, params);
      fitBoxes(verticalBoxes, chartArea, params);
      if (fitBoxes(horizontalBoxes, chartArea, params)) {
        fitBoxes(verticalBoxes, chartArea, params);
      }
      handleMaxPadding(chartArea);
      placeBoxes(boxes.leftAndTop, chartArea, params);
      chartArea.x += chartArea.w;
      chartArea.y += chartArea.h;
      placeBoxes(boxes.rightAndBottom, chartArea, params);
      chart.chartArea = {
        left: chartArea.left,
        top: chartArea.top,
        right: chartArea.left + chartArea.w,
        bottom: chartArea.top + chartArea.h,
        height: chartArea.h,
        width: chartArea.w,
      };
      each(boxes.chartArea, (layout) => {
        const box = layout.box;
        Object.assign(box, chart.chartArea);
        box.update(chartArea.w, chartArea.h);
      });
    }
  };

  class BasePlatform {
    acquireContext(canvas, aspectRatio) {}
    releaseContext(context) {
      return false;
    }
    addEventListener(chart, type, listener) {}
    removeEventListener(chart, type, listener) {}
    getDevicePixelRatio() {
      return 1;
    }
    getMaximumSize(element, width, height, aspectRatio) {
      width = Math.max(0, width || element.width);
      height = height || element.height;
      return {
        width,
        height: Math.max(0, aspectRatio ? Math.floor(width / aspectRatio) : height)
      };
    }
    isAttached(canvas) {
      return true;
    }
  }

  class BasicPlatform extends BasePlatform {
    acquireContext(item) {
      return item && item.getContext && item.getContext('2d') || null;
    }
  }

  const EXPANDO_KEY = '$chartjs';
  const EVENT_TYPES = {
    touchstart: 'mousedown',
    touchmove: 'mousemove',
    touchend: 'mouseup',
    pointerenter: 'mouseenter',
    pointerdown: 'mousedown',
    pointermove: 'mousemove',
    pointerup: 'mouseup',
    pointerleave: 'mouseout',
    pointerout: 'mouseout'
  };
  const isNullOrEmpty = value => value === null || value === '';
  function initCanvas(canvas, aspectRatio) {
    const style = canvas.style;
    const renderHeight = canvas.getAttribute('height');
    const renderWidth = canvas.getAttribute('width');
    canvas[EXPANDO_KEY] = {
      initial: {
        height: renderHeight,
        width: renderWidth,
        style: {
          display: style.display,
          height: style.height,
          width: style.width
        }
      }
    };
    style.display = style.display || 'block';
    style.boxSizing = style.boxSizing || 'border-box';
    if (isNullOrEmpty(renderWidth)) {
      const displayWidth = readUsedSize(canvas, 'width');
      if (displayWidth !== undefined) {
        canvas.width = displayWidth;
      }
    }
    if (isNullOrEmpty(renderHeight)) {
      if (canvas.style.height === '') {
        canvas.height = canvas.width / (aspectRatio || 2);
      } else {
        const displayHeight = readUsedSize(canvas, 'height');
        if (displayHeight !== undefined) {
          canvas.height = displayHeight;
        }
      }
    }
    return canvas;
  }
  const eventListenerOptions = supportsEventListenerOptions ? {passive: true} : false;
  function addListener(node, type, listener) {
    node.addEventListener(type, listener, eventListenerOptions);
  }
  function removeListener(chart, type, listener) {
    chart.canvas.removeEventListener(type, listener, eventListenerOptions);
  }
  function fromNativeEvent(event, chart) {
    const type = EVENT_TYPES[event.type] || event.type;
    const {x, y} = getRelativePosition$1(event, chart);
    return {
      type,
      chart,
      native: event,
      x: x !== undefined ? x : null,
      y: y !== undefined ? y : null,
    };
  }
  function createAttachObserver(chart, type, listener) {
    const canvas = chart.canvas;
    const container = canvas && _getParentNode(canvas);
    const element = container || canvas;
    const observer = new MutationObserver(entries => {
      const parent = _getParentNode(element);
      entries.forEach(entry => {
        for (let i = 0; i < entry.addedNodes.length; i++) {
          const added = entry.addedNodes[i];
          if (added === element || added === parent) {
            listener(entry.target);
          }
        }
      });
    });
    observer.observe(document, {childList: true, subtree: true});
    return observer;
  }
  function createDetachObserver(chart, type, listener) {
    const canvas = chart.canvas;
    const container = canvas && _getParentNode(canvas);
    if (!container) {
      return;
    }
    const observer = new MutationObserver(entries => {
      entries.forEach(entry => {
        for (let i = 0; i < entry.removedNodes.length; i++) {
          if (entry.removedNodes[i] === canvas) {
            listener();
            break;
          }
        }
      });
    });
    observer.observe(container, {childList: true});
    return observer;
  }
  const drpListeningCharts = new Map();
  let oldDevicePixelRatio = 0;
  function onWindowResize() {
    const dpr = window.devicePixelRatio;
    if (dpr === oldDevicePixelRatio) {
      return;
    }
    oldDevicePixelRatio = dpr;
    drpListeningCharts.forEach((resize, chart) => {
      if (chart.currentDevicePixelRatio !== dpr) {
        resize();
      }
    });
  }
  function listenDevicePixelRatioChanges(chart, resize) {
    if (!drpListeningCharts.size) {
      window.addEventListener('resize', onWindowResize);
    }
    drpListeningCharts.set(chart, resize);
  }
  function unlistenDevicePixelRatioChanges(chart) {
    drpListeningCharts.delete(chart);
    if (!drpListeningCharts.size) {
      window.removeEventListener('resize', onWindowResize);
    }
  }
  function createResizeObserver(chart, type, listener) {
    const canvas = chart.canvas;
    const container = canvas && _getParentNode(canvas);
    if (!container) {
      return;
    }
    const resize = throttled((width, height) => {
      const w = container.clientWidth;
      listener(width, height);
      if (w < container.clientWidth) {
        listener();
      }
    }, window);
    const observer = new ResizeObserver(entries => {
      const entry = entries[0];
      const width = entry.contentRect.width;
      const height = entry.contentRect.height;
      if (width === 0 && height === 0) {
        return;
      }
      resize(width, height);
    });
    observer.observe(container);
    listenDevicePixelRatioChanges(chart, resize);
    return observer;
  }
  function releaseObserver(chart, type, observer) {
    if (observer) {
      observer.disconnect();
    }
    if (type === 'resize') {
      unlistenDevicePixelRatioChanges(chart);
    }
  }
  function createProxyAndListen(chart, type, listener) {
    const canvas = chart.canvas;
    const proxy = throttled((event) => {
      if (chart.ctx !== null) {
        listener(fromNativeEvent(event, chart));
      }
    }, chart, (args) => {
      const event = args[0];
      return [event, event.offsetX, event.offsetY];
    });
    addListener(canvas, type, proxy);
    return proxy;
  }
  class DomPlatform extends BasePlatform {
    acquireContext(canvas, aspectRatio) {
      const context = canvas && canvas.getContext && canvas.getContext('2d');
      if (context && context.canvas === canvas) {
        initCanvas(canvas, aspectRatio);
        return context;
      }
      return null;
    }
    releaseContext(context) {
      const canvas = context.canvas;
      if (!canvas[EXPANDO_KEY]) {
        return false;
      }
      const initial = canvas[EXPANDO_KEY].initial;
      ['height', 'width'].forEach((prop) => {
        const value = initial[prop];
        if (isNullOrUndef(value)) {
          canvas.removeAttribute(prop);
        } else {
          canvas.setAttribute(prop, value);
        }
      });
      const style = initial.style || {};
      Object.keys(style).forEach((key) => {
        canvas.style[key] = style[key];
      });
      canvas.width = canvas.width;
      delete canvas[EXPANDO_KEY];
      return true;
    }
    addEventListener(chart, type, listener) {
      this.removeEventListener(chart, type);
      const proxies = chart.$proxies || (chart.$proxies = {});
      const handlers = {
        attach: createAttachObserver,
        detach: createDetachObserver,
        resize: createResizeObserver
      };
      const handler = handlers[type] || createProxyAndListen;
      proxies[type] = handler(chart, type, listener);
    }
    removeEventListener(chart, type) {
      const proxies = chart.$proxies || (chart.$proxies = {});
      const proxy = proxies[type];
      if (!proxy) {
        return;
      }
      const handlers = {
        attach: releaseObserver,
        detach: releaseObserver,
        resize: releaseObserver
      };
      const handler = handlers[type] || removeListener;
      handler(chart, type, proxy);
      proxies[type] = undefined;
    }
    getDevicePixelRatio() {
      return window.devicePixelRatio;
    }
    getMaximumSize(canvas, width, height, aspectRatio) {
      return getMaximumSize(canvas, width, height, aspectRatio);
    }
    isAttached(canvas) {
      const container = _getParentNode(canvas);
      return !!(container && _getParentNode(container));
    }
  }

  class Element {
    constructor() {
      this.x = undefined;
      this.y = undefined;
      this.active = false;
      this.options = undefined;
      this.$animations = undefined;
    }
    tooltipPosition(useFinalPosition) {
      const {x, y} = this.getProps(['x', 'y'], useFinalPosition);
      return {x, y};
    }
    hasValue() {
      return isNumber(this.x) && isNumber(this.y);
    }
    getProps(props, final) {
      const me = this;
      const anims = this.$animations;
      if (!final || !anims) {
        return me;
      }
      const ret = {};
      props.forEach(prop => {
        ret[prop] = anims[prop] && anims[prop].active() ? anims[prop]._to : me[prop];
      });
      return ret;
    }
  }
  Element.defaults = {};
  Element.defaultRoutes = undefined;

  const formatters = {
    values(value) {
      return isArray(value) ? value : '' + value;
    },
    numeric(tickValue, index, ticks) {
      if (tickValue === 0) {
        return '0';
      }
      const locale = this.chart.options.locale;
      let notation;
      let delta = tickValue;
      if (ticks.length > 1) {
        const maxTick = Math.max(Math.abs(ticks[0].value), Math.abs(ticks[ticks.length - 1].value));
        if (maxTick < 1e-4 || maxTick > 1e+15) {
          notation = 'scientific';
        }
        delta = calculateDelta(tickValue, ticks);
      }
      const logDelta = log10(Math.abs(delta));
      const numDecimal = Math.max(Math.min(-1 * Math.floor(logDelta), 20), 0);
      const options = {notation, minimumFractionDigits: numDecimal, maximumFractionDigits: numDecimal};
      Object.assign(options, this.options.ticks.format);
      return formatNumber(tickValue, locale, options);
    },
    logarithmic(tickValue, index, ticks) {
      if (tickValue === 0) {
        return '0';
      }
      const remain = tickValue / (Math.pow(10, Math.floor(log10(tickValue))));
      if (remain === 1 || remain === 2 || remain === 5) {
        return formatters.numeric.call(this, tickValue, index, ticks);
      }
      return '';
    }
  };
  function calculateDelta(tickValue, ticks) {
    let delta = ticks.length > 3 ? ticks[2].value - ticks[1].value : ticks[1].value - ticks[0].value;
    if (Math.abs(delta) > 1 && tickValue !== Math.floor(tickValue)) {
      delta = tickValue - Math.floor(tickValue);
    }
    return delta;
  }
  var Ticks = {formatters};

  defaults.set('scale', {
    display: true,
    offset: false,
    reverse: false,
    beginAtZero: false,
    bounds: 'ticks',
    grace: 0,
    grid: {
      display: true,
      lineWidth: 1,
      drawBorder: true,
      drawOnChartArea: true,
      drawTicks: true,
      tickLength: 8,
      tickWidth: (_ctx, options) => options.lineWidth,
      tickColor: (_ctx, options) => options.color,
      offset: false,
      borderDash: [],
      borderDashOffset: 0.0,
      borderWidth: 1
    },
    title: {
      display: false,
      text: '',
      padding: {
        top: 4,
        bottom: 4
      }
    },
    ticks: {
      minRotation: 0,
      maxRotation: 50,
      mirror: false,
      textStrokeWidth: 0,
      textStrokeColor: '',
      padding: 3,
      display: true,
      autoSkip: true,
      autoSkipPadding: 3,
      labelOffset: 0,
      callback: Ticks.formatters.values,
      minor: {},
      major: {},
      align: 'center',
      crossAlign: 'near',
    }
  });
  defaults.route('scale.ticks', 'color', '', 'color');
  defaults.route('scale.grid', 'color', '', 'borderColor');
  defaults.route('scale.grid', 'borderColor', '', 'borderColor');
  defaults.route('scale.title', 'color', '', 'color');
  defaults.describe('scale', {
    _fallback: false,
    _scriptable: (name) => !name.startsWith('before') && !name.startsWith('after') && name !== 'callback' && name !== 'parser',
    _indexable: (name) => name !== 'borderDash' && name !== 'tickBorderDash',
  });
  defaults.describe('scales', {
    _fallback: 'scale',
  });

  function autoSkip(scale, ticks) {
    const tickOpts = scale.options.ticks;
    const ticksLimit = tickOpts.maxTicksLimit || determineMaxTicks(scale);
    const majorIndices = tickOpts.major.enabled ? getMajorIndices(ticks) : [];
    const numMajorIndices = majorIndices.length;
    const first = majorIndices[0];
    const last = majorIndices[numMajorIndices - 1];
    const newTicks = [];
    if (numMajorIndices > ticksLimit) {
      skipMajors(ticks, newTicks, majorIndices, numMajorIndices / ticksLimit);
      return newTicks;
    }
    const spacing = calculateSpacing(majorIndices, ticks, ticksLimit);
    if (numMajorIndices > 0) {
      let i, ilen;
      const avgMajorSpacing = numMajorIndices > 1 ? Math.round((last - first) / (numMajorIndices - 1)) : null;
      skip(ticks, newTicks, spacing, isNullOrUndef(avgMajorSpacing) ? 0 : first - avgMajorSpacing, first);
      for (i = 0, ilen = numMajorIndices - 1; i < ilen; i++) {
        skip(ticks, newTicks, spacing, majorIndices[i], majorIndices[i + 1]);
      }
      skip(ticks, newTicks, spacing, last, isNullOrUndef(avgMajorSpacing) ? ticks.length : last + avgMajorSpacing);
      return newTicks;
    }
    skip(ticks, newTicks, spacing);
    return newTicks;
  }
  function determineMaxTicks(scale) {
    const offset = scale.options.offset;
    const tickLength = scale._tickSize();
    const maxScale = scale._length / tickLength + (offset ? 0 : 1);
    const maxChart = scale._maxLength / tickLength;
    return Math.floor(Math.min(maxScale, maxChart));
  }
  function calculateSpacing(majorIndices, ticks, ticksLimit) {
    const evenMajorSpacing = getEvenSpacing(majorIndices);
    const spacing = ticks.length / ticksLimit;
    if (!evenMajorSpacing) {
      return Math.max(spacing, 1);
    }
    const factors = _factorize(evenMajorSpacing);
    for (let i = 0, ilen = factors.length - 1; i < ilen; i++) {
      const factor = factors[i];
      if (factor > spacing) {
        return factor;
      }
    }
    return Math.max(spacing, 1);
  }
  function getMajorIndices(ticks) {
    const result = [];
    let i, ilen;
    for (i = 0, ilen = ticks.length; i < ilen; i++) {
      if (ticks[i].major) {
        result.push(i);
      }
    }
    return result;
  }
  function skipMajors(ticks, newTicks, majorIndices, spacing) {
    let count = 0;
    let next = majorIndices[0];
    let i;
    spacing = Math.ceil(spacing);
    for (i = 0; i < ticks.length; i++) {
      if (i === next) {
        newTicks.push(ticks[i]);
        count++;
        next = majorIndices[count * spacing];
      }
    }
  }
  function skip(ticks, newTicks, spacing, majorStart, majorEnd) {
    const start = valueOrDefault(majorStart, 0);
    const end = Math.min(valueOrDefault(majorEnd, ticks.length), ticks.length);
    let count = 0;
    let length, i, next;
    spacing = Math.ceil(spacing);
    if (majorEnd) {
      length = majorEnd - majorStart;
      spacing = length / Math.floor(length / spacing);
    }
    next = start;
    while (next < 0) {
      count++;
      next = Math.round(start + count * spacing);
    }
    for (i = Math.max(start, 0); i < end; i++) {
      if (i === next) {
        newTicks.push(ticks[i]);
        count++;
        next = Math.round(start + count * spacing);
      }
    }
  }
  function getEvenSpacing(arr) {
    const len = arr.length;
    let i, diff;
    if (len < 2) {
      return false;
    }
    for (diff = arr[0], i = 1; i < len; ++i) {
      if (arr[i] - arr[i - 1] !== diff) {
        return false;
      }
    }
    return diff;
  }

  const reverseAlign = (align) => align === 'left' ? 'right' : align === 'right' ? 'left' : align;
  const offsetFromEdge = (scale, edge, offset) => edge === 'top' || edge === 'left' ? scale[edge] + offset : scale[edge] - offset;
  function sample(arr, numItems) {
    const result = [];
    const increment = arr.length / numItems;
    const len = arr.length;
    let i = 0;
    for (; i < len; i += increment) {
      result.push(arr[Math.floor(i)]);
    }
    return result;
  }
  function getPixelForGridLine(scale, index, offsetGridLines) {
    const length = scale.ticks.length;
    const validIndex = Math.min(index, length - 1);
    const start = scale._startPixel;
    const end = scale._endPixel;
    const epsilon = 1e-6;
    let lineValue = scale.getPixelForTick(validIndex);
    let offset;
    if (offsetGridLines) {
      if (length === 1) {
        offset = Math.max(lineValue - start, end - lineValue);
      } else if (index === 0) {
        offset = (scale.getPixelForTick(1) - lineValue) / 2;
      } else {
        offset = (lineValue - scale.getPixelForTick(validIndex - 1)) / 2;
      }
      lineValue += validIndex < index ? offset : -offset;
      if (lineValue < start - epsilon || lineValue > end + epsilon) {
        return;
      }
    }
    return lineValue;
  }
  function garbageCollect(caches, length) {
    each(caches, (cache) => {
      const gc = cache.gc;
      const gcLen = gc.length / 2;
      let i;
      if (gcLen > length) {
        for (i = 0; i < gcLen; ++i) {
          delete cache.data[gc[i]];
        }
        gc.splice(0, gcLen);
      }
    });
  }
  function getTickMarkLength(options) {
    return options.drawTicks ? options.tickLength : 0;
  }
  function getTitleHeight(options, fallback) {
    if (!options.display) {
      return 0;
    }
    const font = toFont(options.font, fallback);
    const padding = toPadding(options.padding);
    const lines = isArray(options.text) ? options.text.length : 1;
    return (lines * font.lineHeight) + padding.height;
  }
  function createScaleContext(parent, scale) {
    return Object.assign(Object.create(parent), {
      scale,
      type: 'scale'
    });
  }
  function createTickContext(parent, index, tick) {
    return Object.assign(Object.create(parent), {
      tick,
      index,
      type: 'tick'
    });
  }
  function titleAlign(align, position, reverse) {
    let ret = _toLeftRightCenter(align);
    if ((reverse && position !== 'right') || (!reverse && position === 'right')) {
      ret = reverseAlign(ret);
    }
    return ret;
  }
  function titleArgs(scale, offset, position, align) {
    const {top, left, bottom, right} = scale;
    let rotation = 0;
    let maxWidth, titleX, titleY;
    if (scale.isHorizontal()) {
      titleX = _alignStartEnd(align, left, right);
      titleY = offsetFromEdge(scale, position, offset);
      maxWidth = right - left;
    } else {
      titleX = offsetFromEdge(scale, position, offset);
      titleY = _alignStartEnd(align, bottom, top);
      rotation = position === 'left' ? -HALF_PI : HALF_PI;
    }
    return {titleX, titleY, maxWidth, rotation};
  }
  class Scale extends Element {
    constructor(cfg) {
      super();
      this.id = cfg.id;
      this.type = cfg.type;
      this.options = undefined;
      this.ctx = cfg.ctx;
      this.chart = cfg.chart;
      this.top = undefined;
      this.bottom = undefined;
      this.left = undefined;
      this.right = undefined;
      this.width = undefined;
      this.height = undefined;
      this._margins = {
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
      };
      this.maxWidth = undefined;
      this.maxHeight = undefined;
      this.paddingTop = undefined;
      this.paddingBottom = undefined;
      this.paddingLeft = undefined;
      this.paddingRight = undefined;
      this.axis = undefined;
      this.labelRotation = undefined;
      this.min = undefined;
      this.max = undefined;
      this._range = undefined;
      this.ticks = [];
      this._gridLineItems = null;
      this._labelItems = null;
      this._labelSizes = null;
      this._length = 0;
      this._maxLength = 0;
      this._longestTextCache = {};
      this._startPixel = undefined;
      this._endPixel = undefined;
      this._reversePixels = false;
      this._userMax = undefined;
      this._userMin = undefined;
      this._suggestedMax = undefined;
      this._suggestedMin = undefined;
      this._ticksLength = 0;
      this._borderValue = 0;
      this._cache = {};
      this._dataLimitsCached = false;
      this.$context = undefined;
    }
    init(options) {
      const me = this;
      me.options = options.setContext(me.getContext());
      me.axis = options.axis;
      me._userMin = me.parse(options.min);
      me._userMax = me.parse(options.max);
      me._suggestedMin = me.parse(options.suggestedMin);
      me._suggestedMax = me.parse(options.suggestedMax);
    }
    parse(raw, index) {
      return raw;
    }
    getUserBounds() {
      let {_userMin, _userMax, _suggestedMin, _suggestedMax} = this;
      _userMin = finiteOrDefault(_userMin, Number.POSITIVE_INFINITY);
      _userMax = finiteOrDefault(_userMax, Number.NEGATIVE_INFINITY);
      _suggestedMin = finiteOrDefault(_suggestedMin, Number.POSITIVE_INFINITY);
      _suggestedMax = finiteOrDefault(_suggestedMax, Number.NEGATIVE_INFINITY);
      return {
        min: finiteOrDefault(_userMin, _suggestedMin),
        max: finiteOrDefault(_userMax, _suggestedMax),
        minDefined: isNumberFinite(_userMin),
        maxDefined: isNumberFinite(_userMax)
      };
    }
    getMinMax(canStack) {
      const me = this;
      let {min, max, minDefined, maxDefined} = me.getUserBounds();
      let range;
      if (minDefined && maxDefined) {
        return {min, max};
      }
      const metas = me.getMatchingVisibleMetas();
      for (let i = 0, ilen = metas.length; i < ilen; ++i) {
        range = metas[i].controller.getMinMax(me, canStack);
        if (!minDefined) {
          min = Math.min(min, range.min);
        }
        if (!maxDefined) {
          max = Math.max(max, range.max);
        }
      }
      return {
        min: finiteOrDefault(min, finiteOrDefault(max, min)),
        max: finiteOrDefault(max, finiteOrDefault(min, max))
      };
    }
    getPadding() {
      const me = this;
      return {
        left: me.paddingLeft || 0,
        top: me.paddingTop || 0,
        right: me.paddingRight || 0,
        bottom: me.paddingBottom || 0
      };
    }
    getTicks() {
      return this.ticks;
    }
    getLabels() {
      const data = this.chart.data;
      return this.options.labels || (this.isHorizontal() ? data.xLabels : data.yLabels) || data.labels || [];
    }
    beforeLayout() {
      this._cache = {};
      this._dataLimitsCached = false;
    }
    beforeUpdate() {
      callback(this.options.beforeUpdate, [this]);
    }
    update(maxWidth, maxHeight, margins) {
      const me = this;
      const tickOpts = me.options.ticks;
      const sampleSize = tickOpts.sampleSize;
      me.beforeUpdate();
      me.maxWidth = maxWidth;
      me.maxHeight = maxHeight;
      me._margins = margins = Object.assign({
        left: 0,
        right: 0,
        top: 0,
        bottom: 0
      }, margins);
      me.ticks = null;
      me._labelSizes = null;
      me._gridLineItems = null;
      me._labelItems = null;
      me.beforeSetDimensions();
      me.setDimensions();
      me.afterSetDimensions();
      me._maxLength = me.isHorizontal()
        ? me.width + margins.left + margins.right
        : me.height + margins.top + margins.bottom;
      if (!me._dataLimitsCached) {
        me.beforeDataLimits();
        me.determineDataLimits();
        me.afterDataLimits();
        me._range = _addGrace(me, me.options.grace);
        me._dataLimitsCached = true;
      }
      me.beforeBuildTicks();
      me.ticks = me.buildTicks() || [];
      me.afterBuildTicks();
      const samplingEnabled = sampleSize < me.ticks.length;
      me._convertTicksToLabels(samplingEnabled ? sample(me.ticks, sampleSize) : me.ticks);
      me.configure();
      me.beforeCalculateLabelRotation();
      me.calculateLabelRotation();
      me.afterCalculateLabelRotation();
      if (tickOpts.display && (tickOpts.autoSkip || tickOpts.source === 'auto')) {
        me.ticks = autoSkip(me, me.ticks);
        me._labelSizes = null;
      }
      if (samplingEnabled) {
        me._convertTicksToLabels(me.ticks);
      }
      me.beforeFit();
      me.fit();
      me.afterFit();
      me.afterUpdate();
    }
    configure() {
      const me = this;
      let reversePixels = me.options.reverse;
      let startPixel, endPixel;
      if (me.isHorizontal()) {
        startPixel = me.left;
        endPixel = me.right;
      } else {
        startPixel = me.top;
        endPixel = me.bottom;
        reversePixels = !reversePixels;
      }
      me._startPixel = startPixel;
      me._endPixel = endPixel;
      me._reversePixels = reversePixels;
      me._length = endPixel - startPixel;
      me._alignToPixels = me.options.alignToPixels;
    }
    afterUpdate() {
      callback(this.options.afterUpdate, [this]);
    }
    beforeSetDimensions() {
      callback(this.options.beforeSetDimensions, [this]);
    }
    setDimensions() {
      const me = this;
      if (me.isHorizontal()) {
        me.width = me.maxWidth;
        me.left = 0;
        me.right = me.width;
      } else {
        me.height = me.maxHeight;
        me.top = 0;
        me.bottom = me.height;
      }
      me.paddingLeft = 0;
      me.paddingTop = 0;
      me.paddingRight = 0;
      me.paddingBottom = 0;
    }
    afterSetDimensions() {
      callback(this.options.afterSetDimensions, [this]);
    }
    _callHooks(name) {
      const me = this;
      me.chart.notifyPlugins(name, me.getContext());
      callback(me.options[name], [me]);
    }
    beforeDataLimits() {
      this._callHooks('beforeDataLimits');
    }
    determineDataLimits() {}
    afterDataLimits() {
      this._callHooks('afterDataLimits');
    }
    beforeBuildTicks() {
      this._callHooks('beforeBuildTicks');
    }
    buildTicks() {
      return [];
    }
    afterBuildTicks() {
      this._callHooks('afterBuildTicks');
    }
    beforeTickToLabelConversion() {
      callback(this.options.beforeTickToLabelConversion, [this]);
    }
    generateTickLabels(ticks) {
      const me = this;
      const tickOpts = me.options.ticks;
      let i, ilen, tick;
      for (i = 0, ilen = ticks.length; i < ilen; i++) {
        tick = ticks[i];
        tick.label = callback(tickOpts.callback, [tick.value, i, ticks], me);
      }
      for (i = 0; i < ilen; i++) {
        if (isNullOrUndef(ticks[i].label)) {
          ticks.splice(i, 1);
          ilen--;
          i--;
        }
      }
    }
    afterTickToLabelConversion() {
      callback(this.options.afterTickToLabelConversion, [this]);
    }
    beforeCalculateLabelRotation() {
      callback(this.options.beforeCalculateLabelRotation, [this]);
    }
    calculateLabelRotation() {
      const me = this;
      const options = me.options;
      const tickOpts = options.ticks;
      const numTicks = me.ticks.length;
      const minRotation = tickOpts.minRotation || 0;
      const maxRotation = tickOpts.maxRotation;
      let labelRotation = minRotation;
      let tickWidth, maxHeight, maxLabelDiagonal;
      if (!me._isVisible() || !tickOpts.display || minRotation >= maxRotation || numTicks <= 1 || !me.isHorizontal()) {
        me.labelRotation = minRotation;
        return;
      }
      const labelSizes = me._getLabelSizes();
      const maxLabelWidth = labelSizes.widest.width;
      const maxLabelHeight = labelSizes.highest.height;
      const maxWidth = _limitValue(me.chart.width - maxLabelWidth, 0, me.maxWidth);
      tickWidth = options.offset ? me.maxWidth / numTicks : maxWidth / (numTicks - 1);
      if (maxLabelWidth + 6 > tickWidth) {
        tickWidth = maxWidth / (numTicks - (options.offset ? 0.5 : 1));
        maxHeight = me.maxHeight - getTickMarkLength(options.grid)
  				- tickOpts.padding - getTitleHeight(options.title, me.chart.options.font);
        maxLabelDiagonal = Math.sqrt(maxLabelWidth * maxLabelWidth + maxLabelHeight * maxLabelHeight);
        labelRotation = toDegrees(Math.min(
          Math.asin(Math.min((labelSizes.highest.height + 6) / tickWidth, 1)),
          Math.asin(Math.min(maxHeight / maxLabelDiagonal, 1)) - Math.asin(maxLabelHeight / maxLabelDiagonal)
        ));
        labelRotation = Math.max(minRotation, Math.min(maxRotation, labelRotation));
      }
      me.labelRotation = labelRotation;
    }
    afterCalculateLabelRotation() {
      callback(this.options.afterCalculateLabelRotation, [this]);
    }
    beforeFit() {
      callback(this.options.beforeFit, [this]);
    }
    fit() {
      const me = this;
      const minSize = {
        width: 0,
        height: 0
      };
      const {chart, options: {ticks: tickOpts, title: titleOpts, grid: gridOpts}} = me;
      const display = me._isVisible();
      const isHorizontal = me.isHorizontal();
      if (display) {
        const titleHeight = getTitleHeight(titleOpts, chart.options.font);
        if (isHorizontal) {
          minSize.width = me.maxWidth;
          minSize.height = getTickMarkLength(gridOpts) + titleHeight;
        } else {
          minSize.height = me.maxHeight;
          minSize.width = getTickMarkLength(gridOpts) + titleHeight;
        }
        if (tickOpts.display && me.ticks.length) {
          const {first, last, widest, highest} = me._getLabelSizes();
          const tickPadding = tickOpts.padding * 2;
          const angleRadians = toRadians(me.labelRotation);
          const cos = Math.cos(angleRadians);
          const sin = Math.sin(angleRadians);
          if (isHorizontal) {
            const labelHeight = tickOpts.mirror ? 0 : sin * widest.width + cos * highest.height;
            minSize.height = Math.min(me.maxHeight, minSize.height + labelHeight + tickPadding);
          } else {
            const labelWidth = tickOpts.mirror ? 0 : cos * widest.width + sin * highest.height;
            minSize.width = Math.min(me.maxWidth, minSize.width + labelWidth + tickPadding);
          }
          me._calculatePadding(first, last, sin, cos);
        }
      }
      me._handleMargins();
      if (isHorizontal) {
        me.width = me._length = chart.width - me._margins.left - me._margins.right;
        me.height = minSize.height;
      } else {
        me.width = minSize.width;
        me.height = me._length = chart.height - me._margins.top - me._margins.bottom;
      }
    }
    _calculatePadding(first, last, sin, cos) {
      const me = this;
      const {ticks: {align, padding}, position} = me.options;
      const isRotated = me.labelRotation !== 0;
      const labelsBelowTicks = position !== 'top' && me.axis === 'x';
      if (me.isHorizontal()) {
        const offsetLeft = me.getPixelForTick(0) - me.left;
        const offsetRight = me.right - me.getPixelForTick(me.ticks.length - 1);
        let paddingLeft = 0;
        let paddingRight = 0;
        if (isRotated) {
          if (labelsBelowTicks) {
            paddingLeft = cos * first.width;
            paddingRight = sin * last.height;
          } else {
            paddingLeft = sin * first.height;
            paddingRight = cos * last.width;
          }
        } else if (align === 'start') {
          paddingRight = last.width;
        } else if (align === 'end') {
          paddingLeft = first.width;
        } else {
          paddingLeft = first.width / 2;
          paddingRight = last.width / 2;
        }
        me.paddingLeft = Math.max((paddingLeft - offsetLeft + padding) * me.width / (me.width - offsetLeft), 0);
        me.paddingRight = Math.max((paddingRight - offsetRight + padding) * me.width / (me.width - offsetRight), 0);
      } else {
        let paddingTop = last.height / 2;
        let paddingBottom = first.height / 2;
        if (align === 'start') {
          paddingTop = 0;
          paddingBottom = first.height;
        } else if (align === 'end') {
          paddingTop = last.height;
          paddingBottom = 0;
        }
        me.paddingTop = paddingTop + padding;
        me.paddingBottom = paddingBottom + padding;
      }
    }
    _handleMargins() {
      const me = this;
      if (me._margins) {
        me._margins.left = Math.max(me.paddingLeft, me._margins.left);
        me._margins.top = Math.max(me.paddingTop, me._margins.top);
        me._margins.right = Math.max(me.paddingRight, me._margins.right);
        me._margins.bottom = Math.max(me.paddingBottom, me._margins.bottom);
      }
    }
    afterFit() {
      callback(this.options.afterFit, [this]);
    }
    isHorizontal() {
      const {axis, position} = this.options;
      return position === 'top' || position === 'bottom' || axis === 'x';
    }
    isFullSize() {
      return this.options.fullSize;
    }
    _convertTicksToLabels(ticks) {
      const me = this;
      me.beforeTickToLabelConversion();
      me.generateTickLabels(ticks);
      me.afterTickToLabelConversion();
    }
    _getLabelSizes() {
      const me = this;
      let labelSizes = me._labelSizes;
      if (!labelSizes) {
        const sampleSize = me.options.ticks.sampleSize;
        let ticks = me.ticks;
        if (sampleSize < ticks.length) {
          ticks = sample(ticks, sampleSize);
        }
        me._labelSizes = labelSizes = me._computeLabelSizes(ticks, ticks.length);
      }
      return labelSizes;
    }
    _computeLabelSizes(ticks, length) {
      const {ctx, _longestTextCache: caches} = this;
      const widths = [];
      const heights = [];
      let widestLabelSize = 0;
      let highestLabelSize = 0;
      let i, j, jlen, label, tickFont, fontString, cache, lineHeight, width, height, nestedLabel;
      for (i = 0; i < length; ++i) {
        label = ticks[i].label;
        tickFont = this._resolveTickFontOptions(i);
        ctx.font = fontString = tickFont.string;
        cache = caches[fontString] = caches[fontString] || {data: {}, gc: []};
        lineHeight = tickFont.lineHeight;
        width = height = 0;
        if (!isNullOrUndef(label) && !isArray(label)) {
          width = _measureText(ctx, cache.data, cache.gc, width, label);
          height = lineHeight;
        } else if (isArray(label)) {
          for (j = 0, jlen = label.length; j < jlen; ++j) {
            nestedLabel = label[j];
            if (!isNullOrUndef(nestedLabel) && !isArray(nestedLabel)) {
              width = _measureText(ctx, cache.data, cache.gc, width, nestedLabel);
              height += lineHeight;
            }
          }
        }
        widths.push(width);
        heights.push(height);
        widestLabelSize = Math.max(width, widestLabelSize);
        highestLabelSize = Math.max(height, highestLabelSize);
      }
      garbageCollect(caches, length);
      const widest = widths.indexOf(widestLabelSize);
      const highest = heights.indexOf(highestLabelSize);
      const valueAt = (idx) => ({width: widths[idx] || 0, height: heights[idx] || 0});
      return {
        first: valueAt(0),
        last: valueAt(length - 1),
        widest: valueAt(widest),
        highest: valueAt(highest)
      };
    }
    getLabelForValue(value) {
      return value;
    }
    getPixelForValue(value, index) {
      return NaN;
    }
    getValueForPixel(pixel) {}
    getPixelForTick(index) {
      const ticks = this.ticks;
      if (index < 0 || index > ticks.length - 1) {
        return null;
      }
      return this.getPixelForValue(ticks[index].value);
    }
    getPixelForDecimal(decimal) {
      const me = this;
      if (me._reversePixels) {
        decimal = 1 - decimal;
      }
      const pixel = me._startPixel + decimal * me._length;
      return _int16Range(me._alignToPixels ? _alignPixel(me.chart, pixel, 0) : pixel);
    }
    getDecimalForPixel(pixel) {
      const decimal = (pixel - this._startPixel) / this._length;
      return this._reversePixels ? 1 - decimal : decimal;
    }
    getBasePixel() {
      return this.getPixelForValue(this.getBaseValue());
    }
    getBaseValue() {
      const {min, max} = this;
      return min < 0 && max < 0 ? max :
        min > 0 && max > 0 ? min :
        0;
    }
    getContext(index) {
      const me = this;
      const ticks = me.ticks || [];
      if (index >= 0 && index < ticks.length) {
        const tick = ticks[index];
        return tick.$context ||
  				(tick.$context = createTickContext(me.getContext(), index, tick));
      }
      return me.$context ||
  			(me.$context = createScaleContext(me.chart.getContext(), me));
    }
    _tickSize() {
      const me = this;
      const optionTicks = me.options.ticks;
      const rot = toRadians(me.labelRotation);
      const cos = Math.abs(Math.cos(rot));
      const sin = Math.abs(Math.sin(rot));
      const labelSizes = me._getLabelSizes();
      const padding = optionTicks.autoSkipPadding || 0;
      const w = labelSizes ? labelSizes.widest.width + padding : 0;
      const h = labelSizes ? labelSizes.highest.height + padding : 0;
      return me.isHorizontal()
        ? h * cos > w * sin ? w / cos : h / sin
        : h * sin < w * cos ? h / cos : w / sin;
    }
    _isVisible() {
      const display = this.options.display;
      if (display !== 'auto') {
        return !!display;
      }
      return this.getMatchingVisibleMetas().length > 0;
    }
    _computeGridLineItems(chartArea) {
      const me = this;
      const axis = me.axis;
      const chart = me.chart;
      const options = me.options;
      const {grid, position} = options;
      const offset = grid.offset;
      const isHorizontal = me.isHorizontal();
      const ticks = me.ticks;
      const ticksLength = ticks.length + (offset ? 1 : 0);
      const tl = getTickMarkLength(grid);
      const items = [];
      const borderOpts = grid.setContext(me.getContext(0));
      const axisWidth = borderOpts.drawBorder ? borderOpts.borderWidth : 0;
      const axisHalfWidth = axisWidth / 2;
      const alignBorderValue = function(pixel) {
        return _alignPixel(chart, pixel, axisWidth);
      };
      let borderValue, i, lineValue, alignedLineValue;
      let tx1, ty1, tx2, ty2, x1, y1, x2, y2;
      if (position === 'top') {
        borderValue = alignBorderValue(me.bottom);
        ty1 = me.bottom - tl;
        ty2 = borderValue - axisHalfWidth;
        y1 = alignBorderValue(chartArea.top) + axisHalfWidth;
        y2 = chartArea.bottom;
      } else if (position === 'bottom') {
        borderValue = alignBorderValue(me.top);
        y1 = chartArea.top;
        y2 = alignBorderValue(chartArea.bottom) - axisHalfWidth;
        ty1 = borderValue + axisHalfWidth;
        ty2 = me.top + tl;
      } else if (position === 'left') {
        borderValue = alignBorderValue(me.right);
        tx1 = me.right - tl;
        tx2 = borderValue - axisHalfWidth;
        x1 = alignBorderValue(chartArea.left) + axisHalfWidth;
        x2 = chartArea.right;
      } else if (position === 'right') {
        borderValue = alignBorderValue(me.left);
        x1 = chartArea.left;
        x2 = alignBorderValue(chartArea.right) - axisHalfWidth;
        tx1 = borderValue + axisHalfWidth;
        tx2 = me.left + tl;
      } else if (axis === 'x') {
        if (position === 'center') {
          borderValue = alignBorderValue((chartArea.top + chartArea.bottom) / 2 + 0.5);
        } else if (isObject(position)) {
          const positionAxisID = Object.keys(position)[0];
          const value = position[positionAxisID];
          borderValue = alignBorderValue(me.chart.scales[positionAxisID].getPixelForValue(value));
        }
        y1 = chartArea.top;
        y2 = chartArea.bottom;
        ty1 = borderValue + axisHalfWidth;
        ty2 = ty1 + tl;
      } else if (axis === 'y') {
        if (position === 'center') {
          borderValue = alignBorderValue((chartArea.left + chartArea.right) / 2);
        } else if (isObject(position)) {
          const positionAxisID = Object.keys(position)[0];
          const value = position[positionAxisID];
          borderValue = alignBorderValue(me.chart.scales[positionAxisID].getPixelForValue(value));
        }
        tx1 = borderValue - axisHalfWidth;
        tx2 = tx1 - tl;
        x1 = chartArea.left;
        x2 = chartArea.right;
      }
      for (i = 0; i < ticksLength; ++i) {
        const optsAtIndex = grid.setContext(me.getContext(i));
        const lineWidth = optsAtIndex.lineWidth;
        const lineColor = optsAtIndex.color;
        const borderDash = grid.borderDash || [];
        const borderDashOffset = optsAtIndex.borderDashOffset;
        const tickWidth = optsAtIndex.tickWidth;
        const tickColor = optsAtIndex.tickColor;
        const tickBorderDash = optsAtIndex.tickBorderDash || [];
        const tickBorderDashOffset = optsAtIndex.tickBorderDashOffset;
        lineValue = getPixelForGridLine(me, i, offset);
        if (lineValue === undefined) {
          continue;
        }
        alignedLineValue = _alignPixel(chart, lineValue, lineWidth);
        if (isHorizontal) {
          tx1 = tx2 = x1 = x2 = alignedLineValue;
        } else {
          ty1 = ty2 = y1 = y2 = alignedLineValue;
        }
        items.push({
          tx1,
          ty1,
          tx2,
          ty2,
          x1,
          y1,
          x2,
          y2,
          width: lineWidth,
          color: lineColor,
          borderDash,
          borderDashOffset,
          tickWidth,
          tickColor,
          tickBorderDash,
          tickBorderDashOffset,
        });
      }
      me._ticksLength = ticksLength;
      me._borderValue = borderValue;
      return items;
    }
    _computeLabelItems(chartArea) {
      const me = this;
      const axis = me.axis;
      const options = me.options;
      const {position, ticks: optionTicks} = options;
      const isHorizontal = me.isHorizontal();
      const ticks = me.ticks;
      const {align, crossAlign, padding, mirror} = optionTicks;
      const tl = getTickMarkLength(options.grid);
      const tickAndPadding = tl + padding;
      const hTickAndPadding = mirror ? -padding : tickAndPadding;
      const rotation = -toRadians(me.labelRotation);
      const items = [];
      let i, ilen, tick, label, x, y, textAlign, pixel, font, lineHeight, lineCount, textOffset;
      let textBaseline = 'middle';
      if (position === 'top') {
        y = me.bottom - hTickAndPadding;
        textAlign = me._getXAxisLabelAlignment();
      } else if (position === 'bottom') {
        y = me.top + hTickAndPadding;
        textAlign = me._getXAxisLabelAlignment();
      } else if (position === 'left') {
        const ret = me._getYAxisLabelAlignment(tl);
        textAlign = ret.textAlign;
        x = ret.x;
      } else if (position === 'right') {
        const ret = me._getYAxisLabelAlignment(tl);
        textAlign = ret.textAlign;
        x = ret.x;
      } else if (axis === 'x') {
        if (position === 'center') {
          y = ((chartArea.top + chartArea.bottom) / 2) + tickAndPadding;
        } else if (isObject(position)) {
          const positionAxisID = Object.keys(position)[0];
          const value = position[positionAxisID];
          y = me.chart.scales[positionAxisID].getPixelForValue(value) + tickAndPadding;
        }
        textAlign = me._getXAxisLabelAlignment();
      } else if (axis === 'y') {
        if (position === 'center') {
          x = ((chartArea.left + chartArea.right) / 2) - tickAndPadding;
        } else if (isObject(position)) {
          const positionAxisID = Object.keys(position)[0];
          const value = position[positionAxisID];
          x = me.chart.scales[positionAxisID].getPixelForValue(value);
        }
        textAlign = me._getYAxisLabelAlignment(tl).textAlign;
      }
      if (axis === 'y') {
        if (align === 'start') {
          textBaseline = 'top';
        } else if (align === 'end') {
          textBaseline = 'bottom';
        }
      }
      const labelSizes = me._getLabelSizes();
      for (i = 0, ilen = ticks.length; i < ilen; ++i) {
        tick = ticks[i];
        label = tick.label;
        const optsAtIndex = optionTicks.setContext(me.getContext(i));
        pixel = me.getPixelForTick(i) + optionTicks.labelOffset;
        font = me._resolveTickFontOptions(i);
        lineHeight = font.lineHeight;
        lineCount = isArray(label) ? label.length : 1;
        const halfCount = lineCount / 2;
        const color = optsAtIndex.color;
        const strokeColor = optsAtIndex.textStrokeColor;
        const strokeWidth = optsAtIndex.textStrokeWidth;
        if (isHorizontal) {
          x = pixel;
          if (position === 'top') {
            if (crossAlign === 'near' || rotation !== 0) {
              textOffset = -lineCount * lineHeight + lineHeight / 2;
            } else if (crossAlign === 'center') {
              textOffset = -labelSizes.highest.height / 2 - halfCount * lineHeight + lineHeight;
            } else {
              textOffset = -labelSizes.highest.height + lineHeight / 2;
            }
          } else {
            if (crossAlign === 'near' || rotation !== 0) {
              textOffset = lineHeight / 2;
            } else if (crossAlign === 'center') {
              textOffset = labelSizes.highest.height / 2 - halfCount * lineHeight;
            } else {
              textOffset = labelSizes.highest.height - lineCount * lineHeight;
            }
          }
          if (mirror) {
            textOffset *= -1;
          }
        } else {
          y = pixel;
          textOffset = (1 - lineCount) * lineHeight / 2;
        }
        items.push({
          rotation,
          label,
          font,
          color,
          strokeColor,
          strokeWidth,
          textOffset,
          textAlign,
          textBaseline,
          translation: [x, y]
        });
      }
      return items;
    }
    _getXAxisLabelAlignment() {
      const me = this;
      const {position, ticks} = me.options;
      const rotation = -toRadians(me.labelRotation);
      if (rotation) {
        return position === 'top' ? 'left' : 'right';
      }
      let align = 'center';
      if (ticks.align === 'start') {
        align = 'left';
      } else if (ticks.align === 'end') {
        align = 'right';
      }
      return align;
    }
    _getYAxisLabelAlignment(tl) {
      const me = this;
      const {position, ticks: {crossAlign, mirror, padding}} = me.options;
      const labelSizes = me._getLabelSizes();
      const tickAndPadding = tl + padding;
      const widest = labelSizes.widest.width;
      let textAlign;
      let x;
      if (position === 'left') {
        if (mirror) {
          textAlign = 'left';
          x = me.right + padding;
        } else {
          x = me.right - tickAndPadding;
          if (crossAlign === 'near') {
            textAlign = 'right';
          } else if (crossAlign === 'center') {
            textAlign = 'center';
            x -= (widest / 2);
          } else {
            textAlign = 'left';
            x = me.left;
          }
        }
      } else if (position === 'right') {
        if (mirror) {
          textAlign = 'right';
          x = me.left + padding;
        } else {
          x = me.left + tickAndPadding;
          if (crossAlign === 'near') {
            textAlign = 'left';
          } else if (crossAlign === 'center') {
            textAlign = 'center';
            x += widest / 2;
          } else {
            textAlign = 'right';
            x = me.right;
          }
        }
      } else {
        textAlign = 'right';
      }
      return {textAlign, x};
    }
    _computeLabelArea() {
      const me = this;
      if (me.options.ticks.mirror) {
        return;
      }
      const chart = me.chart;
      const position = me.options.position;
      if (position === 'left' || position === 'right') {
        return {top: 0, left: me.left, bottom: chart.height, right: me.right};
      } if (position === 'top' || position === 'bottom') {
        return {top: me.top, left: 0, bottom: me.bottom, right: chart.width};
      }
    }
    drawBackground() {
      const {ctx, options: {backgroundColor}, left, top, width, height} = this;
      if (backgroundColor) {
        ctx.save();
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(left, top, width, height);
        ctx.restore();
      }
    }
    getLineWidthForValue(value) {
      const me = this;
      const grid = me.options.grid;
      if (!me._isVisible() || !grid.display) {
        return 0;
      }
      const ticks = me.ticks;
      const index = ticks.findIndex(t => t.value === value);
      if (index >= 0) {
        const opts = grid.setContext(me.getContext(index));
        return opts.lineWidth;
      }
      return 0;
    }
    drawGrid(chartArea) {
      const me = this;
      const grid = me.options.grid;
      const ctx = me.ctx;
      const chart = me.chart;
      const borderOpts = grid.setContext(me.getContext());
      const axisWidth = grid.drawBorder ? borderOpts.borderWidth : 0;
      const items = me._gridLineItems || (me._gridLineItems = me._computeGridLineItems(chartArea));
      let i, ilen;
      const drawLine = (p1, p2, style) => {
        if (!style.width || !style.color) {
          return;
        }
        ctx.save();
        ctx.lineWidth = style.width;
        ctx.strokeStyle = style.color;
        ctx.setLineDash(style.borderDash || []);
        ctx.lineDashOffset = style.borderDashOffset;
        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);
        ctx.stroke();
        ctx.restore();
      };
      if (grid.display) {
        for (i = 0, ilen = items.length; i < ilen; ++i) {
          const item = items[i];
          if (grid.drawOnChartArea) {
            drawLine(
              {x: item.x1, y: item.y1},
              {x: item.x2, y: item.y2},
              item
            );
          }
          if (grid.drawTicks) {
            drawLine(
              {x: item.tx1, y: item.ty1},
              {x: item.tx2, y: item.ty2},
              {
                color: item.tickColor,
                width: item.tickWidth,
                borderDash: item.tickBorderDash,
                borderDashOffset: item.tickBorderDashOffset
              }
            );
          }
        }
      }
      if (axisWidth) {
        const lastLineWidth = borderOpts.lineWidth;
        const borderValue = me._borderValue;
        let x1, x2, y1, y2;
        if (me.isHorizontal()) {
          x1 = _alignPixel(chart, me.left, axisWidth) - axisWidth / 2;
          x2 = _alignPixel(chart, me.right, lastLineWidth) + lastLineWidth / 2;
          y1 = y2 = borderValue;
        } else {
          y1 = _alignPixel(chart, me.top, axisWidth) - axisWidth / 2;
          y2 = _alignPixel(chart, me.bottom, lastLineWidth) + lastLineWidth / 2;
          x1 = x2 = borderValue;
        }
        drawLine(
          {x: x1, y: y1},
          {x: x2, y: y2},
          {width: axisWidth, color: borderOpts.borderColor});
      }
    }
    drawLabels(chartArea) {
      const me = this;
      const optionTicks = me.options.ticks;
      if (!optionTicks.display) {
        return;
      }
      const ctx = me.ctx;
      const area = me._computeLabelArea();
      if (area) {
        clipArea(ctx, area);
      }
      const items = me._labelItems || (me._labelItems = me._computeLabelItems(chartArea));
      let i, ilen;
      for (i = 0, ilen = items.length; i < ilen; ++i) {
        const item = items[i];
        const tickFont = item.font;
        const label = item.label;
        let y = item.textOffset;
        renderText(ctx, label, 0, y, tickFont, item);
      }
      if (area) {
        unclipArea(ctx);
      }
    }
    drawTitle() {
      const {ctx, options: {position, title, reverse}} = this;
      if (!title.display) {
        return;
      }
      const font = toFont(title.font);
      const padding = toPadding(title.padding);
      const align = title.align;
      let offset = font.lineHeight / 2;
      if (position === 'bottom') {
        offset += padding.bottom;
        if (isArray(title.text)) {
          offset += font.lineHeight * (title.text.length - 1);
        }
      } else {
        offset += padding.top;
      }
      const {titleX, titleY, maxWidth, rotation} = titleArgs(this, offset, position, align);
      renderText(ctx, title.text, 0, 0, font, {
        color: title.color,
        maxWidth,
        rotation,
        textAlign: titleAlign(align, position, reverse),
        textBaseline: 'middle',
        translation: [titleX, titleY],
      });
    }
    draw(chartArea) {
      const me = this;
      if (!me._isVisible()) {
        return;
      }
      me.drawBackground();
      me.drawGrid(chartArea);
      me.drawTitle();
      me.drawLabels(chartArea);
    }
    _layers() {
      const me = this;
      const opts = me.options;
      const tz = opts.ticks && opts.ticks.z || 0;
      const gz = opts.grid && opts.grid.z || 0;
      if (!me._isVisible() || tz === gz || me.draw !== Scale.prototype.draw) {
        return [{
          z: tz,
          draw(chartArea) {
            me.draw(chartArea);
          }
        }];
      }
      return [{
        z: gz,
        draw(chartArea) {
          me.drawBackground();
          me.drawGrid(chartArea);
          me.drawTitle();
        }
      }, {
        z: tz,
        draw(chartArea) {
          me.drawLabels(chartArea);
        }
      }];
    }
    getMatchingVisibleMetas(type) {
      const me = this;
      const metas = me.chart.getSortedVisibleDatasetMetas();
      const axisID = me.axis + 'AxisID';
      const result = [];
      let i, ilen;
      for (i = 0, ilen = metas.length; i < ilen; ++i) {
        const meta = metas[i];
        if (meta[axisID] === me.id && (!type || meta.type === type)) {
          result.push(meta);
        }
      }
      return result;
    }
    _resolveTickFontOptions(index) {
      const opts = this.options.ticks.setContext(this.getContext(index));
      return toFont(opts.font);
    }
  }

  class TypedRegistry {
    constructor(type, scope, override) {
      this.type = type;
      this.scope = scope;
      this.override = override;
      this.items = Object.create(null);
    }
    isForType(type) {
      return Object.prototype.isPrototypeOf.call(this.type.prototype, type.prototype);
    }
    register(item) {
      const me = this;
      const proto = Object.getPrototypeOf(item);
      let parentScope;
      if (isIChartComponent(proto)) {
        parentScope = me.register(proto);
      }
      const items = me.items;
      const id = item.id;
      const scope = me.scope + '.' + id;
      if (!id) {
        throw new Error('class does not have id: ' + item);
      }
      if (id in items) {
        return scope;
      }
      items[id] = item;
      registerDefaults(item, scope, parentScope);
      if (me.override) {
        defaults.override(item.id, item.overrides);
      }
      return scope;
    }
    get(id) {
      return this.items[id];
    }
    unregister(item) {
      const items = this.items;
      const id = item.id;
      const scope = this.scope;
      if (id in items) {
        delete items[id];
      }
      if (scope && id in defaults[scope]) {
        delete defaults[scope][id];
        if (this.override) {
          delete overrides[id];
        }
      }
    }
  }
  function registerDefaults(item, scope, parentScope) {
    const itemDefaults = merge(Object.create(null), [
      parentScope ? defaults.get(parentScope) : {},
      defaults.get(scope),
      item.defaults
    ]);
    defaults.set(scope, itemDefaults);
    if (item.defaultRoutes) {
      routeDefaults(scope, item.defaultRoutes);
    }
    if (item.descriptors) {
      defaults.describe(scope, item.descriptors);
    }
  }
  function routeDefaults(scope, routes) {
    Object.keys(routes).forEach(property => {
      const propertyParts = property.split('.');
      const sourceName = propertyParts.pop();
      const sourceScope = [scope].concat(propertyParts).join('.');
      const parts = routes[property].split('.');
      const targetName = parts.pop();
      const targetScope = parts.join('.');
      defaults.route(sourceScope, sourceName, targetScope, targetName);
    });
  }
  function isIChartComponent(proto) {
    return 'id' in proto && 'defaults' in proto;
  }

  class Registry {
    constructor() {
      this.controllers = new TypedRegistry(DatasetController, 'datasets', true);
      this.elements = new TypedRegistry(Element, 'elements');
      this.plugins = new TypedRegistry(Object, 'plugins');
      this.scales = new TypedRegistry(Scale, 'scales');
      this._typedRegistries = [this.controllers, this.scales, this.elements];
    }
    add(...args) {
      this._each('register', args);
    }
    remove(...args) {
      this._each('unregister', args);
    }
    addControllers(...args) {
      this._each('register', args, this.controllers);
    }
    addElements(...args) {
      this._each('register', args, this.elements);
    }
    addPlugins(...args) {
      this._each('register', args, this.plugins);
    }
    addScales(...args) {
      this._each('register', args, this.scales);
    }
    getController(id) {
      return this._get(id, this.controllers, 'controller');
    }
    getElement(id) {
      return this._get(id, this.elements, 'element');
    }
    getPlugin(id) {
      return this._get(id, this.plugins, 'plugin');
    }
    getScale(id) {
      return this._get(id, this.scales, 'scale');
    }
    removeControllers(...args) {
      this._each('unregister', args, this.controllers);
    }
    removeElements(...args) {
      this._each('unregister', args, this.elements);
    }
    removePlugins(...args) {
      this._each('unregister', args, this.plugins);
    }
    removeScales(...args) {
      this._each('unregister', args, this.scales);
    }
    _each(method, args, typedRegistry) {
      const me = this;
      [...args].forEach(arg => {
        const reg = typedRegistry || me._getRegistryForType(arg);
        if (typedRegistry || reg.isForType(arg) || (reg === me.plugins && arg.id)) {
          me._exec(method, reg, arg);
        } else {
          each(arg, item => {
            const itemReg = typedRegistry || me._getRegistryForType(item);
            me._exec(method, itemReg, item);
          });
        }
      });
    }
    _exec(method, registry, component) {
      const camelMethod = _capitalize(method);
      callback(component['before' + camelMethod], [], component);
      registry[method](component);
      callback(component['after' + camelMethod], [], component);
    }
    _getRegistryForType(type) {
      for (let i = 0; i < this._typedRegistries.length; i++) {
        const reg = this._typedRegistries[i];
        if (reg.isForType(type)) {
          return reg;
        }
      }
      return this.plugins;
    }
    _get(id, typedRegistry, type) {
      const item = typedRegistry.get(id);
      if (item === undefined) {
        throw new Error('"' + id + '" is not a registered ' + type + '.');
      }
      return item;
    }
  }
  var registry = new Registry();

  class PluginService {
    constructor() {
      this._init = [];
    }
    notify(chart, hook, args, filter) {
      const me = this;
      if (hook === 'beforeInit') {
        me._init = me._createDescriptors(chart, true);
        me._notify(me._init, chart, 'install');
      }
      const descriptors = filter ? me._descriptors(chart).filter(filter) : me._descriptors(chart);
      const result = me._notify(descriptors, chart, hook, args);
      if (hook === 'destroy') {
        me._notify(descriptors, chart, 'stop');
        me._notify(me._init, chart, 'uninstall');
      }
      return result;
    }
    _notify(descriptors, chart, hook, args) {
      args = args || {};
      for (const descriptor of descriptors) {
        const plugin = descriptor.plugin;
        const method = plugin[hook];
        const params = [chart, args, descriptor.options];
        if (callback(method, params, plugin) === false && args.cancelable) {
          return false;
        }
      }
      return true;
    }
    invalidate() {
      if (!isNullOrUndef(this._cache)) {
        this._oldCache = this._cache;
        this._cache = undefined;
      }
    }
    _descriptors(chart) {
      if (this._cache) {
        return this._cache;
      }
      const descriptors = this._cache = this._createDescriptors(chart);
      this._notifyStateChanges(chart);
      return descriptors;
    }
    _createDescriptors(chart, all) {
      const config = chart && chart.config;
      const options = valueOrDefault(config.options && config.options.plugins, {});
      const plugins = allPlugins(config);
      return options === false && !all ? [] : createDescriptors(chart, plugins, options, all);
    }
    _notifyStateChanges(chart) {
      const previousDescriptors = this._oldCache || [];
      const descriptors = this._cache;
      const diff = (a, b) => a.filter(x => !b.some(y => x.plugin.id === y.plugin.id));
      this._notify(diff(previousDescriptors, descriptors), chart, 'stop');
      this._notify(diff(descriptors, previousDescriptors), chart, 'start');
    }
  }
  function allPlugins(config) {
    const plugins = [];
    const keys = Object.keys(registry.plugins.items);
    for (let i = 0; i < keys.length; i++) {
      plugins.push(registry.getPlugin(keys[i]));
    }
    const local = config.plugins || [];
    for (let i = 0; i < local.length; i++) {
      const plugin = local[i];
      if (plugins.indexOf(plugin) === -1) {
        plugins.push(plugin);
      }
    }
    return plugins;
  }
  function getOpts(options, all) {
    if (!all && options === false) {
      return null;
    }
    if (options === true) {
      return {};
    }
    return options;
  }
  function createDescriptors(chart, plugins, options, all) {
    const result = [];
    const context = chart.getContext();
    for (let i = 0; i < plugins.length; i++) {
      const plugin = plugins[i];
      const id = plugin.id;
      const opts = getOpts(options[id], all);
      if (opts === null) {
        continue;
      }
      result.push({
        plugin,
        options: pluginOpts(chart.config, plugin, opts, context)
      });
    }
    return result;
  }
  function pluginOpts(config, plugin, opts, context) {
    const keys = config.pluginScopeKeys(plugin);
    const scopes = config.getOptionScopes(opts, keys);
    return config.createResolver(scopes, context, [''], {scriptable: false, indexable: false, allKeys: true});
  }

  function getIndexAxis(type, options) {
    const datasetDefaults = defaults.datasets[type] || {};
    const datasetOptions = (options.datasets || {})[type] || {};
    return datasetOptions.indexAxis || options.indexAxis || datasetDefaults.indexAxis || 'x';
  }
  function getAxisFromDefaultScaleID(id, indexAxis) {
    let axis = id;
    if (id === '_index_') {
      axis = indexAxis;
    } else if (id === '_value_') {
      axis = indexAxis === 'x' ? 'y' : 'x';
    }
    return axis;
  }
  function getDefaultScaleIDFromAxis(axis, indexAxis) {
    return axis === indexAxis ? '_index_' : '_value_';
  }
  function axisFromPosition(position) {
    if (position === 'top' || position === 'bottom') {
      return 'x';
    }
    if (position === 'left' || position === 'right') {
      return 'y';
    }
  }
  function determineAxis(id, scaleOptions) {
    if (id === 'x' || id === 'y') {
      return id;
    }
    return scaleOptions.axis || axisFromPosition(scaleOptions.position) || id.charAt(0).toLowerCase();
  }
  function mergeScaleConfig(config, options) {
    const chartDefaults = overrides[config.type] || {scales: {}};
    const configScales = options.scales || {};
    const chartIndexAxis = getIndexAxis(config.type, options);
    const firstIDs = Object.create(null);
    const scales = Object.create(null);
    Object.keys(configScales).forEach(id => {
      const scaleConf = configScales[id];
      const axis = determineAxis(id, scaleConf);
      const defaultId = getDefaultScaleIDFromAxis(axis, chartIndexAxis);
      const defaultScaleOptions = chartDefaults.scales || {};
      firstIDs[axis] = firstIDs[axis] || id;
      scales[id] = mergeIf(Object.create(null), [{axis}, scaleConf, defaultScaleOptions[axis], defaultScaleOptions[defaultId]]);
    });
    config.data.datasets.forEach(dataset => {
      const type = dataset.type || config.type;
      const indexAxis = dataset.indexAxis || getIndexAxis(type, options);
      const datasetDefaults = overrides[type] || {};
      const defaultScaleOptions = datasetDefaults.scales || {};
      Object.keys(defaultScaleOptions).forEach(defaultID => {
        const axis = getAxisFromDefaultScaleID(defaultID, indexAxis);
        const id = dataset[axis + 'AxisID'] || firstIDs[axis] || axis;
        scales[id] = scales[id] || Object.create(null);
        mergeIf(scales[id], [{axis}, configScales[id], defaultScaleOptions[defaultID]]);
      });
    });
    Object.keys(scales).forEach(key => {
      const scale = scales[key];
      mergeIf(scale, [defaults.scales[scale.type], defaults.scale]);
    });
    return scales;
  }
  function initOptions(config) {
    const options = config.options || (config.options = {});
    options.plugins = valueOrDefault(options.plugins, {});
    options.scales = mergeScaleConfig(config, options);
  }
  function initData(data) {
    data = data || {};
    data.datasets = data.datasets || [];
    data.labels = data.labels || [];
    return data;
  }
  function initConfig(config) {
    config = config || {};
    config.data = initData(config.data);
    initOptions(config);
    return config;
  }
  const keyCache = new Map();
  const keysCached = new Set();
  function cachedKeys(cacheKey, generate) {
    let keys = keyCache.get(cacheKey);
    if (!keys) {
      keys = generate();
      keyCache.set(cacheKey, keys);
      keysCached.add(keys);
    }
    return keys;
  }
  const addIfFound = (set, obj, key) => {
    const opts = resolveObjectKey(obj, key);
    if (opts !== undefined) {
      set.add(opts);
    }
  };
  class Config$1 {
    constructor(config) {
      this._config = initConfig(config);
      this._scopeCache = new Map();
      this._resolverCache = new Map();
    }
    get type() {
      return this._config.type;
    }
    set type(type) {
      this._config.type = type;
    }
    get data() {
      return this._config.data;
    }
    set data(data) {
      this._config.data = initData(data);
    }
    get options() {
      return this._config.options;
    }
    set options(options) {
      this._config.options = options;
    }
    get plugins() {
      return this._config.plugins;
    }
    update() {
      const config = this._config;
      this.clearCache();
      initOptions(config);
    }
    clearCache() {
      this._scopeCache.clear();
      this._resolverCache.clear();
    }
    datasetScopeKeys(datasetType) {
      return cachedKeys(datasetType,
        () => [[
          `datasets.${datasetType}`,
          ''
        ]]);
    }
    datasetAnimationScopeKeys(datasetType, transition) {
      return cachedKeys(`${datasetType}.transition.${transition}`,
        () => [
          [
            `datasets.${datasetType}.transitions.${transition}`,
            `transitions.${transition}`,
          ],
          [
            `datasets.${datasetType}`,
            ''
          ]
        ]);
    }
    datasetElementScopeKeys(datasetType, elementType) {
      return cachedKeys(`${datasetType}-${elementType}`,
        () => [[
          `datasets.${datasetType}.elements.${elementType}`,
          `datasets.${datasetType}`,
          `elements.${elementType}`,
          ''
        ]]);
    }
    pluginScopeKeys(plugin) {
      const id = plugin.id;
      const type = this.type;
      return cachedKeys(`${type}-plugin-${id}`,
        () => [[
          `plugins.${id}`,
          ...plugin.additionalOptionScopes || [],
        ]]);
    }
    _cachedScopes(mainScope, resetCache) {
      const _scopeCache = this._scopeCache;
      let cache = _scopeCache.get(mainScope);
      if (!cache || resetCache) {
        cache = new Map();
        _scopeCache.set(mainScope, cache);
      }
      return cache;
    }
    getOptionScopes(mainScope, keyLists, resetCache) {
      const {options, type} = this;
      const cache = this._cachedScopes(mainScope, resetCache);
      const cached = cache.get(keyLists);
      if (cached) {
        return cached;
      }
      const scopes = new Set();
      keyLists.forEach(keys => {
        if (mainScope) {
          scopes.add(mainScope);
          keys.forEach(key => addIfFound(scopes, mainScope, key));
        }
        keys.forEach(key => addIfFound(scopes, options, key));
        keys.forEach(key => addIfFound(scopes, overrides[type] || {}, key));
        keys.forEach(key => addIfFound(scopes, defaults, key));
        keys.forEach(key => addIfFound(scopes, descriptors, key));
      });
      const array = [...scopes];
      if (keysCached.has(keyLists)) {
        cache.set(keyLists, array);
      }
      return array;
    }
    chartOptionScopes() {
      const {options, type} = this;
      return [
        options,
        overrides[type] || {},
        defaults.datasets[type] || {},
        {type},
        defaults,
        descriptors
      ];
    }
    resolveNamedOptions(scopes, names, context, prefixes = ['']) {
      const result = {$shared: true};
      const {resolver, subPrefixes} = getResolver(this._resolverCache, scopes, prefixes);
      let options = resolver;
      if (needContext(resolver, names)) {
        result.$shared = false;
        context = isFunction(context) ? context() : context;
        const subResolver = this.createResolver(scopes, context, subPrefixes);
        options = _attachContext(resolver, context, subResolver);
      }
      for (const prop of names) {
        result[prop] = options[prop];
      }
      return result;
    }
    createResolver(scopes, context, prefixes = [''], descriptorDefaults) {
      const {resolver} = getResolver(this._resolverCache, scopes, prefixes);
      return isObject(context)
        ? _attachContext(resolver, context, undefined, descriptorDefaults)
        : resolver;
    }
  }
  function getResolver(resolverCache, scopes, prefixes) {
    let cache = resolverCache.get(scopes);
    if (!cache) {
      cache = new Map();
      resolverCache.set(scopes, cache);
    }
    const cacheKey = prefixes.join();
    let cached = cache.get(cacheKey);
    if (!cached) {
      const resolver = _createResolver(scopes, prefixes);
      cached = {
        resolver,
        subPrefixes: prefixes.filter(p => !p.toLowerCase().includes('hover'))
      };
      cache.set(cacheKey, cached);
    }
    return cached;
  }
  function needContext(proxy, names) {
    const {isScriptable, isIndexable} = _descriptors(proxy);
    for (const prop of names) {
      if ((isScriptable(prop) && isFunction(proxy[prop]))
        || (isIndexable(prop) && isArray(proxy[prop]))) {
        return true;
      }
    }
    return false;
  }

  var version = "3.1.1";

  const KNOWN_POSITIONS = ['top', 'bottom', 'left', 'right', 'chartArea'];
  function positionIsHorizontal(position, axis) {
    return position === 'top' || position === 'bottom' || (KNOWN_POSITIONS.indexOf(position) === -1 && axis === 'x');
  }
  function compare2Level(l1, l2) {
    return function(a, b) {
      return a[l1] === b[l1]
        ? a[l2] - b[l2]
        : a[l1] - b[l1];
    };
  }
  function onAnimationsComplete(context) {
    const chart = context.chart;
    const animationOptions = chart.options.animation;
    chart.notifyPlugins('afterRender');
    callback(animationOptions && animationOptions.onComplete, [context], chart);
  }
  function onAnimationProgress(context) {
    const chart = context.chart;
    const animationOptions = chart.options.animation;
    callback(animationOptions && animationOptions.onProgress, [context], chart);
  }
  function isDomSupported() {
    return typeof window !== 'undefined' && typeof document !== 'undefined';
  }
  function getCanvas(item) {
    if (isDomSupported() && typeof item === 'string') {
      item = document.getElementById(item);
    } else if (item && item.length) {
      item = item[0];
    }
    if (item && item.canvas) {
      item = item.canvas;
    }
    return item;
  }
  const instances = {};
  const getChart = (key) => {
    const canvas = getCanvas(key);
    return Object.values(instances).filter((c) => c.canvas === canvas).pop();
  };
  class Chart$1 {
    constructor(item, config) {
      const me = this;
      this.config = config = new Config$1(config);
      const initialCanvas = getCanvas(item);
      const existingChart = getChart(initialCanvas);
      if (existingChart) {
        throw new Error(
          'Canvas is already in use. Chart with ID \'' + existingChart.id + '\'' +
  				' must be destroyed before the canvas can be reused.'
        );
      }
      const options = config.createResolver(config.chartOptionScopes(), me.getContext());
      this.platform = me._initializePlatform(initialCanvas, config);
      const context = me.platform.acquireContext(initialCanvas, options.aspectRatio);
      const canvas = context && context.canvas;
      const height = canvas && canvas.height;
      const width = canvas && canvas.width;
      this.id = uid();
      this.ctx = context;
      this.canvas = canvas;
      this.width = width;
      this.height = height;
      this._options = options;
      this._aspectRatio = this.aspectRatio;
      this._layers = [];
      this._metasets = [];
      this._stacks = undefined;
      this.boxes = [];
      this.currentDevicePixelRatio = undefined;
      this.chartArea = undefined;
      this._active = [];
      this._lastEvent = undefined;
      this._listeners = {};
      this._sortedMetasets = [];
      this.scales = {};
      this.scale = undefined;
      this._plugins = new PluginService();
      this.$proxies = {};
      this._hiddenIndices = {};
      this.attached = false;
      this._animationsDisabled = undefined;
      this.$context = undefined;
      this._doResize = debounce(() => this.update('resize'), options.resizeDelay || 0);
      instances[me.id] = me;
      if (!context || !canvas) {
        console.error("Failed to create chart: can't acquire context from the given item");
        return;
      }
      animator.listen(me, 'complete', onAnimationsComplete);
      animator.listen(me, 'progress', onAnimationProgress);
      me._initialize();
      if (me.attached) {
        me.update();
      }
    }
    get aspectRatio() {
      const {options: {aspectRatio, maintainAspectRatio}, width, height, _aspectRatio} = this;
      if (!isNullOrUndef(aspectRatio)) {
        return aspectRatio;
      }
      if (maintainAspectRatio && _aspectRatio) {
        return _aspectRatio;
      }
      return height ? width / height : null;
    }
    get data() {
      return this.config.data;
    }
    set data(data) {
      this.config.data = data;
    }
    get options() {
      return this._options;
    }
    set options(options) {
      this.config.options = options;
    }
    _initialize() {
      const me = this;
      me.notifyPlugins('beforeInit');
      if (me.options.responsive) {
        me.resize();
      } else {
        retinaScale(me, me.options.devicePixelRatio);
      }
      me.bindEvents();
      me.notifyPlugins('afterInit');
      return me;
    }
    _initializePlatform(canvas, config) {
      if (config.platform) {
        return new config.platform();
      } else if (!isDomSupported() || (typeof OffscreenCanvas !== 'undefined' && canvas instanceof OffscreenCanvas)) {
        return new BasicPlatform();
      }
      return new DomPlatform();
    }
    clear() {
      clearCanvas(this.canvas, this.ctx);
      return this;
    }
    stop() {
      animator.stop(this);
      return this;
    }
    resize(width, height) {
      if (!animator.running(this)) {
        this._resize(width, height);
      } else {
        this._resizeBeforeDraw = {width, height};
      }
    }
    _resize(width, height) {
      const me = this;
      const options = me.options;
      const canvas = me.canvas;
      const aspectRatio = options.maintainAspectRatio && me.aspectRatio;
      const newSize = me.platform.getMaximumSize(canvas, width, height, aspectRatio);
      const oldRatio = me.currentDevicePixelRatio;
      const newRatio = options.devicePixelRatio || me.platform.getDevicePixelRatio();
      if (me.width === newSize.width && me.height === newSize.height && oldRatio === newRatio) {
        return;
      }
      me.width = newSize.width;
      me.height = newSize.height;
      me._aspectRatio = me.aspectRatio;
      retinaScale(me, newRatio, true);
      me.notifyPlugins('resize', {size: newSize});
      callback(options.onResize, [me, newSize], me);
      if (me.attached) {
        if (me._doResize()) {
          me.render();
        }
      }
    }
    ensureScalesHaveIDs() {
      const options = this.options;
      const scalesOptions = options.scales || {};
      each(scalesOptions, (axisOptions, axisID) => {
        axisOptions.id = axisID;
      });
    }
    buildOrUpdateScales() {
      const me = this;
      const options = me.options;
      const scaleOpts = options.scales;
      const scales = me.scales;
      const updated = Object.keys(scales).reduce((obj, id) => {
        obj[id] = false;
        return obj;
      }, {});
      let items = [];
      if (scaleOpts) {
        items = items.concat(
          Object.keys(scaleOpts).map((id) => {
            const scaleOptions = scaleOpts[id];
            const axis = determineAxis(id, scaleOptions);
            const isRadial = axis === 'r';
            const isHorizontal = axis === 'x';
            return {
              options: scaleOptions,
              dposition: isRadial ? 'chartArea' : isHorizontal ? 'bottom' : 'left',
              dtype: isRadial ? 'radialLinear' : isHorizontal ? 'category' : 'linear'
            };
          })
        );
      }
      each(items, (item) => {
        const scaleOptions = item.options;
        const id = scaleOptions.id;
        const axis = determineAxis(id, scaleOptions);
        const scaleType = valueOrDefault(scaleOptions.type, item.dtype);
        if (scaleOptions.position === undefined || positionIsHorizontal(scaleOptions.position, axis) !== positionIsHorizontal(item.dposition)) {
          scaleOptions.position = item.dposition;
        }
        updated[id] = true;
        let scale = null;
        if (id in scales && scales[id].type === scaleType) {
          scale = scales[id];
        } else {
          const scaleClass = registry.getScale(scaleType);
          scale = new scaleClass({
            id,
            type: scaleType,
            ctx: me.ctx,
            chart: me
          });
          scales[scale.id] = scale;
        }
        scale.init(scaleOptions, options);
      });
      each(updated, (hasUpdated, id) => {
        if (!hasUpdated) {
          delete scales[id];
        }
      });
      each(scales, (scale) => {
        layouts.configure(me, scale, scale.options);
        layouts.addBox(me, scale);
      });
    }
    _updateMetasetIndex(meta, index) {
      const metasets = this._metasets;
      const oldIndex = meta.index;
      if (oldIndex !== index) {
        metasets[oldIndex] = metasets[index];
        metasets[index] = meta;
        meta.index = index;
      }
    }
    _updateMetasets() {
      const me = this;
      const metasets = me._metasets;
      const numData = me.data.datasets.length;
      const numMeta = metasets.length;
      if (numMeta > numData) {
        for (let i = numData; i < numMeta; ++i) {
          me._destroyDatasetMeta(i);
        }
        metasets.splice(numData, numMeta - numData);
      }
      me._sortedMetasets = metasets.slice(0).sort(compare2Level('order', 'index'));
    }
    _removeUnreferencedMetasets() {
      const me = this;
      const {_metasets: metasets, data: {datasets}} = me;
      if (metasets.length > datasets.length) {
        delete me._stacks;
      }
      metasets.forEach((meta, index) => {
        if (datasets.filter(x => x === meta._dataset).length === 0) {
          me._destroyDatasetMeta(index);
        }
      });
    }
    buildOrUpdateControllers() {
      const me = this;
      const newControllers = [];
      const datasets = me.data.datasets;
      let i, ilen;
      me._removeUnreferencedMetasets();
      for (i = 0, ilen = datasets.length; i < ilen; i++) {
        const dataset = datasets[i];
        let meta = me.getDatasetMeta(i);
        const type = dataset.type || me.config.type;
        if (meta.type && meta.type !== type) {
          me._destroyDatasetMeta(i);
          meta = me.getDatasetMeta(i);
        }
        meta.type = type;
        meta.indexAxis = dataset.indexAxis || getIndexAxis(type, me.options);
        meta.order = dataset.order || 0;
        me._updateMetasetIndex(meta, i);
        meta.label = '' + dataset.label;
        meta.visible = me.isDatasetVisible(i);
        if (meta.controller) {
          meta.controller.updateIndex(i);
          meta.controller.linkScales();
        } else {
          const ControllerClass = registry.getController(type);
          const {datasetElementType, dataElementType} = defaults.datasets[type];
          Object.assign(ControllerClass.prototype, {
            dataElementType: registry.getElement(dataElementType),
            datasetElementType: datasetElementType && registry.getElement(datasetElementType)
          });
          meta.controller = new ControllerClass(me, i);
          newControllers.push(meta.controller);
        }
      }
      me._updateMetasets();
      return newControllers;
    }
    _resetElements() {
      const me = this;
      each(me.data.datasets, (dataset, datasetIndex) => {
        me.getDatasetMeta(datasetIndex).controller.reset();
      }, me);
    }
    reset() {
      this._resetElements();
      this.notifyPlugins('reset');
    }
    update(mode) {
      const me = this;
      const config = me.config;
      config.update();
      me._options = config.createResolver(config.chartOptionScopes(), me.getContext());
      each(me.scales, (scale) => {
        layouts.removeBox(me, scale);
      });
      const animsDisabled = me._animationsDisabled = !me.options.animation;
      me.ensureScalesHaveIDs();
      me.buildOrUpdateScales();
      me._plugins.invalidate();
      if (me.notifyPlugins('beforeUpdate', {mode, cancelable: true}) === false) {
        return;
      }
      const newControllers = me.buildOrUpdateControllers();
      me.notifyPlugins('beforeElementsUpdate');
      let minPadding = 0;
      for (let i = 0, ilen = me.data.datasets.length; i < ilen; i++) {
        const {controller} = me.getDatasetMeta(i);
        const reset = !animsDisabled && newControllers.indexOf(controller) === -1;
        controller.buildOrUpdateElements(reset);
        minPadding = Math.max(+controller.getMaxOverflow(), minPadding);
      }
      me._minPadding = minPadding;
      me._updateLayout(minPadding);
      if (!animsDisabled) {
        each(newControllers, (controller) => {
          controller.reset();
        });
      }
      me._updateDatasets(mode);
      me.notifyPlugins('afterUpdate', {mode});
      me._layers.sort(compare2Level('z', '_idx'));
      if (me._lastEvent) {
        me._eventHandler(me._lastEvent, true);
      }
      me.render();
    }
    _updateLayout(minPadding) {
      const me = this;
      if (me.notifyPlugins('beforeLayout', {cancelable: true}) === false) {
        return;
      }
      layouts.update(me, me.width, me.height, minPadding);
      const area = me.chartArea;
      const noArea = area.width <= 0 || area.height <= 0;
      me._layers = [];
      each(me.boxes, (box) => {
        if (noArea && box.position === 'chartArea') {
          return;
        }
        if (box.configure) {
          box.configure();
        }
        me._layers.push(...box._layers());
      }, me);
      me._layers.forEach((item, index) => {
        item._idx = index;
      });
      me.notifyPlugins('afterLayout');
    }
    _updateDatasets(mode) {
      const me = this;
      const isFunction = typeof mode === 'function';
      if (me.notifyPlugins('beforeDatasetsUpdate', {mode, cancelable: true}) === false) {
        return;
      }
      for (let i = 0, ilen = me.data.datasets.length; i < ilen; ++i) {
        me._updateDataset(i, isFunction ? mode({datasetIndex: i}) : mode);
      }
      me.notifyPlugins('afterDatasetsUpdate', {mode});
    }
    _updateDataset(index, mode) {
      const me = this;
      const meta = me.getDatasetMeta(index);
      const args = {meta, index, mode, cancelable: true};
      if (me.notifyPlugins('beforeDatasetUpdate', args) === false) {
        return;
      }
      meta.controller._update(mode);
      args.cancelable = false;
      me.notifyPlugins('afterDatasetUpdate', args);
    }
    render() {
      const me = this;
      if (me.notifyPlugins('beforeRender', {cancelable: true}) === false) {
        return;
      }
      if (animator.has(me)) {
        if (me.attached && !animator.running(me)) {
          animator.start(me);
        }
      } else {
        me.draw();
        onAnimationsComplete({chart: me});
      }
    }
    draw() {
      const me = this;
      let i;
      if (me._resizeBeforeDraw) {
        const {width, height} = me._resizeBeforeDraw;
        me._resize(width, height);
        me._resizeBeforeDraw = null;
      }
      me.clear();
      if (me.width <= 0 || me.height <= 0) {
        return;
      }
      if (me.notifyPlugins('beforeDraw', {cancelable: true}) === false) {
        return;
      }
      const layers = me._layers;
      for (i = 0; i < layers.length && layers[i].z <= 0; ++i) {
        layers[i].draw(me.chartArea);
      }
      me._drawDatasets();
      for (; i < layers.length; ++i) {
        layers[i].draw(me.chartArea);
      }
      me.notifyPlugins('afterDraw');
    }
    _getSortedDatasetMetas(filterVisible) {
      const me = this;
      const metasets = me._sortedMetasets;
      const result = [];
      let i, ilen;
      for (i = 0, ilen = metasets.length; i < ilen; ++i) {
        const meta = metasets[i];
        if (!filterVisible || meta.visible) {
          result.push(meta);
        }
      }
      return result;
    }
    getSortedVisibleDatasetMetas() {
      return this._getSortedDatasetMetas(true);
    }
    _drawDatasets() {
      const me = this;
      if (me.notifyPlugins('beforeDatasetsDraw', {cancelable: true}) === false) {
        return;
      }
      const metasets = me.getSortedVisibleDatasetMetas();
      for (let i = metasets.length - 1; i >= 0; --i) {
        me._drawDataset(metasets[i]);
      }
      me.notifyPlugins('afterDatasetsDraw');
    }
    _drawDataset(meta) {
      const me = this;
      const ctx = me.ctx;
      const clip = meta._clip;
      const area = me.chartArea;
      const args = {
        meta,
        index: meta.index,
        cancelable: true
      };
      if (me.notifyPlugins('beforeDatasetDraw', args) === false) {
        return;
      }
      clipArea(ctx, {
        left: clip.left === false ? 0 : area.left - clip.left,
        right: clip.right === false ? me.width : area.right + clip.right,
        top: clip.top === false ? 0 : area.top - clip.top,
        bottom: clip.bottom === false ? me.height : area.bottom + clip.bottom
      });
      meta.controller.draw();
      unclipArea(ctx);
      args.cancelable = false;
      me.notifyPlugins('afterDatasetDraw', args);
    }
    getElementsAtEventForMode(e, mode, options, useFinalPosition) {
      const method = Interaction.modes[mode];
      if (typeof method === 'function') {
        return method(this, e, options, useFinalPosition);
      }
      return [];
    }
    getDatasetMeta(datasetIndex) {
      const me = this;
      const dataset = me.data.datasets[datasetIndex];
      const metasets = me._metasets;
      let meta = metasets.filter(x => x && x._dataset === dataset).pop();
      if (!meta) {
        meta = metasets[datasetIndex] = {
          type: null,
          data: [],
          dataset: null,
          controller: null,
          hidden: null,
          xAxisID: null,
          yAxisID: null,
          order: dataset && dataset.order || 0,
          index: datasetIndex,
          _dataset: dataset,
          _parsed: [],
          _sorted: false
        };
      }
      return meta;
    }
    getContext() {
      return this.$context || (this.$context = {chart: this, type: 'chart'});
    }
    getVisibleDatasetCount() {
      return this.getSortedVisibleDatasetMetas().length;
    }
    isDatasetVisible(datasetIndex) {
      const dataset = this.data.datasets[datasetIndex];
      if (!dataset) {
        return false;
      }
      const meta = this.getDatasetMeta(datasetIndex);
      return typeof meta.hidden === 'boolean' ? !meta.hidden : !dataset.hidden;
    }
    setDatasetVisibility(datasetIndex, visible) {
      const meta = this.getDatasetMeta(datasetIndex);
      meta.hidden = !visible;
    }
    toggleDataVisibility(index) {
      this._hiddenIndices[index] = !this._hiddenIndices[index];
    }
    getDataVisibility(index) {
      return !this._hiddenIndices[index];
    }
    _updateDatasetVisibility(datasetIndex, visible) {
      const me = this;
      const mode = visible ? 'show' : 'hide';
      const meta = me.getDatasetMeta(datasetIndex);
      const anims = meta.controller._resolveAnimations(undefined, mode);
      me.setDatasetVisibility(datasetIndex, visible);
      anims.update(meta, {visible});
      me.update((ctx) => ctx.datasetIndex === datasetIndex ? mode : undefined);
    }
    hide(datasetIndex) {
      this._updateDatasetVisibility(datasetIndex, false);
    }
    show(datasetIndex) {
      this._updateDatasetVisibility(datasetIndex, true);
    }
    _destroyDatasetMeta(datasetIndex) {
      const me = this;
      const meta = me._metasets && me._metasets[datasetIndex];
      if (meta && meta.controller) {
        meta.controller._destroy();
        delete me._metasets[datasetIndex];
      }
    }
    destroy() {
      const me = this;
      const {canvas, ctx} = me;
      let i, ilen;
      me.stop();
      animator.remove(me);
      for (i = 0, ilen = me.data.datasets.length; i < ilen; ++i) {
        me._destroyDatasetMeta(i);
      }
      me.config.clearCache();
      if (canvas) {
        me.unbindEvents();
        clearCanvas(canvas, ctx);
        me.platform.releaseContext(ctx);
        me.canvas = null;
        me.ctx = null;
      }
      me.notifyPlugins('destroy');
      delete instances[me.id];
    }
    toBase64Image(...args) {
      return this.canvas.toDataURL(...args);
    }
    bindEvents() {
      const me = this;
      const listeners = me._listeners;
      const platform = me.platform;
      const _add = (type, listener) => {
        platform.addEventListener(me, type, listener);
        listeners[type] = listener;
      };
      const _remove = (type, listener) => {
        if (listeners[type]) {
          platform.removeEventListener(me, type, listener);
          delete listeners[type];
        }
      };
      let listener = function(e, x, y) {
        e.offsetX = x;
        e.offsetY = y;
        me._eventHandler(e);
      };
      each(me.options.events, (type) => _add(type, listener));
      if (me.options.responsive) {
        listener = (width, height) => {
          if (me.canvas) {
            me.resize(width, height);
          }
        };
        let detached;
        const attached = () => {
          _remove('attach', attached);
          me.attached = true;
          me.resize();
          _add('resize', listener);
          _add('detach', detached);
        };
        detached = () => {
          me.attached = false;
          _remove('resize', listener);
          _add('attach', attached);
        };
        if (platform.isAttached(me.canvas)) {
          attached();
        } else {
          detached();
        }
      } else {
        me.attached = true;
      }
    }
    unbindEvents() {
      const me = this;
      const listeners = me._listeners;
      if (!listeners) {
        return;
      }
      delete me._listeners;
      each(listeners, (listener, type) => {
        me.platform.removeEventListener(me, type, listener);
      });
    }
    updateHoverStyle(items, mode, enabled) {
      const prefix = enabled ? 'set' : 'remove';
      let meta, item, i, ilen;
      if (mode === 'dataset') {
        meta = this.getDatasetMeta(items[0].datasetIndex);
        meta.controller['_' + prefix + 'DatasetHoverStyle']();
      }
      for (i = 0, ilen = items.length; i < ilen; ++i) {
        item = items[i];
        const controller = item && this.getDatasetMeta(item.datasetIndex).controller;
        if (controller) {
          controller[prefix + 'HoverStyle'](item.element, item.datasetIndex, item.index);
        }
      }
    }
    getActiveElements() {
      return this._active || [];
    }
    setActiveElements(activeElements) {
      const me = this;
      const lastActive = me._active || [];
      const active = activeElements.map(({datasetIndex, index}) => {
        const meta = me.getDatasetMeta(datasetIndex);
        if (!meta) {
          throw new Error('No dataset found at index ' + datasetIndex);
        }
        return {
          datasetIndex,
          element: meta.data[index],
          index,
        };
      });
      const changed = !_elementsEqual(active, lastActive);
      if (changed) {
        me._active = active;
        me._updateHoverStyles(active, lastActive);
      }
    }
    notifyPlugins(hook, args, filter) {
      return this._plugins.notify(this, hook, args, filter);
    }
    _updateHoverStyles(active, lastActive, replay) {
      const me = this;
      const hoverOptions = me.options.hover;
      const diff = (a, b) => a.filter(x => !b.some(y => x.datasetIndex === y.datasetIndex && x.index === y.index));
      const deactivated = diff(lastActive, active);
      const activated = replay ? active : diff(active, lastActive);
      if (deactivated.length) {
        me.updateHoverStyle(deactivated, hoverOptions.mode, false);
      }
      if (activated.length && hoverOptions.mode) {
        me.updateHoverStyle(activated, hoverOptions.mode, true);
      }
    }
    _eventHandler(e, replay) {
      const me = this;
      const args = {event: e, replay, cancelable: true};
      const eventFilter = (plugin) => (plugin.options.events || this.options.events).includes(e.type);
      if (me.notifyPlugins('beforeEvent', args, eventFilter) === false) {
        return;
      }
      const changed = me._handleEvent(e, replay);
      args.cancelable = false;
      me.notifyPlugins('afterEvent', args, eventFilter);
      if (changed || args.changed) {
        me.render();
      }
      return me;
    }
    _handleEvent(e, replay) {
      const me = this;
      const {_active: lastActive = [], options} = me;
      const hoverOptions = options.hover;
      const useFinalPosition = replay;
      let active = [];
      let changed = false;
      let lastEvent = null;
      if (e.type !== 'mouseout') {
        active = me.getElementsAtEventForMode(e, hoverOptions.mode, hoverOptions, useFinalPosition);
        lastEvent = e.type === 'click' ? me._lastEvent : e;
      }
      me._lastEvent = null;
      if (_isPointInArea(e, me.chartArea, me._minPadding)) {
        callback(options.onHover, [e, active, me], me);
        if (e.type === 'mouseup' || e.type === 'click' || e.type === 'contextmenu') {
          callback(options.onClick, [e, active, me], me);
        }
      }
      changed = !_elementsEqual(active, lastActive);
      if (changed || replay) {
        me._active = active;
        me._updateHoverStyles(active, lastActive, replay);
      }
      me._lastEvent = lastEvent;
      return changed;
    }
  }
  const invalidatePlugins = () => each(Chart$1.instances, (chart) => chart._plugins.invalidate());
  const enumerable = true;
  Object.defineProperties(Chart$1, {
    defaults: {
      enumerable,
      value: defaults
    },
    instances: {
      enumerable,
      value: instances
    },
    overrides: {
      enumerable,
      value: overrides
    },
    registry: {
      enumerable,
      value: registry
    },
    version: {
      enumerable,
      value: version
    },
    getChart: {
      enumerable,
      value: getChart
    },
    register: {
      enumerable,
      value: (...items) => {
        registry.add(...items);
        invalidatePlugins();
      }
    },
    unregister: {
      enumerable,
      value: (...items) => {
        registry.remove(...items);
        invalidatePlugins();
      }
    }
  });

  function clipArc(ctx, element) {
    const {startAngle, endAngle, pixelMargin, x, y, outerRadius, innerRadius} = element;
    let angleMargin = pixelMargin / outerRadius;
    ctx.beginPath();
    ctx.arc(x, y, outerRadius, startAngle - angleMargin, endAngle + angleMargin);
    if (innerRadius > pixelMargin) {
      angleMargin = pixelMargin / innerRadius;
      ctx.arc(x, y, innerRadius, endAngle + angleMargin, startAngle - angleMargin, true);
    } else {
      ctx.arc(x, y, pixelMargin, endAngle + HALF_PI, startAngle - HALF_PI);
    }
    ctx.closePath();
    ctx.clip();
  }
  function toRadiusCorners(value) {
    return _readValueToProps(value, ['outerStart', 'outerEnd', 'innerStart', 'innerEnd']);
  }
  function parseBorderRadius$1(arc, innerRadius, outerRadius, angleDelta) {
    const o = toRadiusCorners(arc.options.borderRadius);
    const halfThickness = (outerRadius - innerRadius) / 2;
    const innerLimit = Math.min(halfThickness, angleDelta * innerRadius / 2);
    const computeOuterLimit = (val) => {
      const outerArcLimit = (outerRadius - Math.min(halfThickness, val)) * angleDelta / 2;
      return _limitValue(val, 0, Math.min(halfThickness, outerArcLimit));
    };
    return {
      outerStart: computeOuterLimit(o.outerStart),
      outerEnd: computeOuterLimit(o.outerEnd),
      innerStart: _limitValue(o.innerStart, 0, innerLimit),
      innerEnd: _limitValue(o.innerEnd, 0, innerLimit),
    };
  }
  function rThetaToXY(r, theta, x, y) {
    return {
      x: x + r * Math.cos(theta),
      y: y + r * Math.sin(theta),
    };
  }
  function pathArc(ctx, element) {
    const {x, y, startAngle, endAngle, pixelMargin} = element;
    const outerRadius = Math.max(element.outerRadius - pixelMargin, 0);
    const innerRadius = element.innerRadius + pixelMargin;
    const {outerStart, outerEnd, innerStart, innerEnd} = parseBorderRadius$1(element, innerRadius, outerRadius, endAngle - startAngle);
    const outerStartAdjustedRadius = outerRadius - outerStart;
    const outerEndAdjustedRadius = outerRadius - outerEnd;
    const outerStartAdjustedAngle = startAngle + outerStart / outerStartAdjustedRadius;
    const outerEndAdjustedAngle = endAngle - outerEnd / outerEndAdjustedRadius;
    const innerStartAdjustedRadius = innerRadius + innerStart;
    const innerEndAdjustedRadius = innerRadius + innerEnd;
    const innerStartAdjustedAngle = startAngle + innerStart / innerStartAdjustedRadius;
    const innerEndAdjustedAngle = endAngle - innerEnd / innerEndAdjustedRadius;
    ctx.beginPath();
    ctx.arc(x, y, outerRadius, outerStartAdjustedAngle, outerEndAdjustedAngle);
    if (outerEnd > 0) {
      const pCenter = rThetaToXY(outerEndAdjustedRadius, outerEndAdjustedAngle, x, y);
      ctx.arc(pCenter.x, pCenter.y, outerEnd, outerEndAdjustedAngle, endAngle + HALF_PI);
    }
    const p4 = rThetaToXY(innerEndAdjustedRadius, endAngle, x, y);
    ctx.lineTo(p4.x, p4.y);
    if (innerEnd > 0) {
      const pCenter = rThetaToXY(innerEndAdjustedRadius, innerEndAdjustedAngle, x, y);
      ctx.arc(pCenter.x, pCenter.y, innerEnd, endAngle + HALF_PI, innerEndAdjustedAngle + Math.PI);
    }
    ctx.arc(x, y, innerRadius, endAngle - (innerEnd / innerRadius), startAngle + (innerStart / innerRadius), true);
    if (innerStart > 0) {
      const pCenter = rThetaToXY(innerStartAdjustedRadius, innerStartAdjustedAngle, x, y);
      ctx.arc(pCenter.x, pCenter.y, innerStart, innerStartAdjustedAngle + Math.PI, startAngle - HALF_PI);
    }
    const p8 = rThetaToXY(outerStartAdjustedRadius, startAngle, x, y);
    ctx.lineTo(p8.x, p8.y);
    if (outerStart > 0) {
      const pCenter = rThetaToXY(outerStartAdjustedRadius, outerStartAdjustedAngle, x, y);
      ctx.arc(pCenter.x, pCenter.y, outerStart, startAngle - HALF_PI, outerStartAdjustedAngle);
    }
    ctx.closePath();
  }
  function drawArc(ctx, element) {
    if (element.fullCircles) {
      element.endAngle = element.startAngle + TAU;
      pathArc(ctx, element);
      for (let i = 0; i < element.fullCircles; ++i) {
        ctx.fill();
      }
    }
    if (!isNaN(element.circumference)) {
      element.endAngle = element.startAngle + element.circumference % TAU;
    }
    pathArc(ctx, element);
    ctx.fill();
  }
  function drawFullCircleBorders(ctx, element, inner) {
    const {x, y, startAngle, endAngle, pixelMargin} = element;
    const outerRadius = Math.max(element.outerRadius - pixelMargin, 0);
    const innerRadius = element.innerRadius + pixelMargin;
    let i;
    if (inner) {
      element.endAngle = element.startAngle + TAU;
      clipArc(ctx, element);
      element.endAngle = endAngle;
      if (element.endAngle === element.startAngle) {
        element.endAngle += TAU;
        element.fullCircles--;
      }
    }
    ctx.beginPath();
    ctx.arc(x, y, innerRadius, startAngle + TAU, startAngle, true);
    for (i = 0; i < element.fullCircles; ++i) {
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(x, y, outerRadius, startAngle, startAngle + TAU);
    for (i = 0; i < element.fullCircles; ++i) {
      ctx.stroke();
    }
  }
  function drawBorder(ctx, element) {
    const {options} = element;
    const inner = options.borderAlign === 'inner';
    if (!options.borderWidth) {
      return;
    }
    if (inner) {
      ctx.lineWidth = options.borderWidth * 2;
      ctx.lineJoin = 'round';
    } else {
      ctx.lineWidth = options.borderWidth;
      ctx.lineJoin = 'bevel';
    }
    if (element.fullCircles) {
      drawFullCircleBorders(ctx, element, inner);
    }
    if (inner) {
      clipArc(ctx, element);
    }
    pathArc(ctx, element);
    ctx.stroke();
  }
  class ArcElement extends Element {
    constructor(cfg) {
      super();
      this.options = undefined;
      this.circumference = undefined;
      this.startAngle = undefined;
      this.endAngle = undefined;
      this.innerRadius = undefined;
      this.outerRadius = undefined;
      this.pixelMargin = 0;
      this.fullCircles = 0;
      if (cfg) {
        Object.assign(this, cfg);
      }
    }
    inRange(chartX, chartY, useFinalPosition) {
      const point = this.getProps(['x', 'y'], useFinalPosition);
      const {angle, distance} = getAngleFromPoint(point, {x: chartX, y: chartY});
      const {startAngle, endAngle, innerRadius, outerRadius, circumference} = this.getProps([
        'startAngle',
        'endAngle',
        'innerRadius',
        'outerRadius',
        'circumference'
      ], useFinalPosition);
      const betweenAngles = circumference >= TAU || _angleBetween(angle, startAngle, endAngle);
      const withinRadius = (distance >= innerRadius && distance <= outerRadius);
      return (betweenAngles && withinRadius);
    }
    getCenterPoint(useFinalPosition) {
      const {x, y, startAngle, endAngle, innerRadius, outerRadius} = this.getProps([
        'x',
        'y',
        'startAngle',
        'endAngle',
        'innerRadius',
        'outerRadius'
      ], useFinalPosition);
      const halfAngle = (startAngle + endAngle) / 2;
      const halfRadius = (innerRadius + outerRadius) / 2;
      return {
        x: x + Math.cos(halfAngle) * halfRadius,
        y: y + Math.sin(halfAngle) * halfRadius
      };
    }
    tooltipPosition(useFinalPosition) {
      return this.getCenterPoint(useFinalPosition);
    }
    draw(ctx) {
      const me = this;
      const options = me.options;
      const offset = options.offset || 0;
      me.pixelMargin = (options.borderAlign === 'inner') ? 0.33 : 0;
      me.fullCircles = Math.floor(me.circumference / TAU);
      if (me.circumference === 0 || me.innerRadius < 0 || me.outerRadius < 0) {
        return;
      }
      ctx.save();
      if (offset && me.circumference < TAU) {
        const halfAngle = (me.startAngle + me.endAngle) / 2;
        ctx.translate(Math.cos(halfAngle) * offset, Math.sin(halfAngle) * offset);
      }
      ctx.fillStyle = options.backgroundColor;
      ctx.strokeStyle = options.borderColor;
      drawArc(ctx, me);
      drawBorder(ctx, me);
      ctx.restore();
    }
  }
  ArcElement.id = 'arc';
  ArcElement.defaults = {
    borderAlign: 'center',
    borderColor: '#fff',
    borderRadius: 0,
    borderWidth: 2,
    offset: 0,
    angle: undefined,
  };
  ArcElement.defaultRoutes = {
    backgroundColor: 'backgroundColor'
  };

  const values = {
      MIN_RESPONSE_WAIT: 250,
      NOTIFICATION_WAIT: 1000,
  };

  Object.freeze(values);

  const Config = values;

  class Task extends Abstract {
      /** @type {?number} */
      id = null;
      /** @type {?number} */
      projectId = null;
      /** @type {?number} */
      createdAt = null;
      /** @type {?number} */
      modifiedAt = null;
      /** @type {string} */
      title = '';
      /** @type {string} */
      color = '';
      /** @type {number} */
      time = 0;
      /** @type {number} */
      percentage = 0;

      /*
      static createFromResponseData(responseData) {
          const task = new this();
          task.id = parseInt(responseData.id);
          task.projectId = parseInt(responseData.projectId);
          task.color = responseData.color;
          task.title = responseData.title;
          task.time = parseInt(responseData.time);
          return task;
      }
      */
  }

  const SOURCE_COLORS_500 = [
      '#f44336',
      '#e91e63',
      '#9c27b0',
      '#673ab7',
      '#3f51b5',
      '#2196f3',
      '#03a9f4',
      '#00bcd4',
      '#009688',
      '#4caf50',
      '#8bc34a',
      '#cddc39',
      '#ffeb3b',
      '#ffc107',
      '#ff9800',
      '#ff5722'
  ];

  /**
   * @param {Array} [sourceColors]
   * @returns {Array}
   */
  const generatePalette = (sourceColors) => {
      const step = 4;
      const palette = [];
      let p = 0;
      let r = 0;
      palette.push(sourceColors[p]);
      for (let i = 1; i < sourceColors.length; i++) {
          p = p + step + 1;
          if (p >= sourceColors.length) {
              r++;
              p = (step + 1) - r;
          }
          palette.push(sourceColors[p]);
      }
      return palette;
  };

  /**
   * @param {string} [currentColor]
   * @returns {string}
   */
  const getNextColorOf = (currentColor = null) => {
      console.log('getting next color of:', currentColor);

      if (currentColor === null) {
          return palette[0];
      }

      const matchedIndex = palette.indexOf(currentColor.toLowerCase());
      if (matchedIndex === -1) {
          return palette[0];
      } else {
          return palette[(matchedIndex + 1) % palette.length];
      }
  };

  const getRandomColor = () => {
      return palette[Math.floor(Math.random() * palette.length)];
  };

  const palette = generatePalette(SOURCE_COLORS_500);

  /*
  export const Color = {
      getPalette,
      getNextColorOf
  };
  */

  /**
   * @param {number} min
   * @param {number} max
   * @returns {number}
   */

  /**
   * @param {number} value
   * @param {number} digits
   * @returns {number}
   */
  const roundFloat = (value, digits) => {
      if (digits < 0) {
          throw new TypeError('Digits cannot be negative');
      }
      if (digits === 0) {
          return Math.round(value);
      }
      return Math.round(value * Math.pow(10, digits)) / Math.pow(10, digits);
  };

  /**
   * Converts seconds to minutes.
   * @param {number} value
   * @return {number}
   */
  const secondsToMinutes = (value) => {
      return value / 60;
  };

  /**
   * Converts minutes to seconds.
   * @param {number} value
   * @return {number}
   */
  const minutesToSeconds = (value) => {
      return value * 60;
  };

  /**
   * Converts seconds to hours.
   * @param {number} value
   * @return {number}
   */
  const secondsToHours = (value) => {
      return value / 3600;
  };

  /**
   * Converts hours to seconds.
   * @param {number} value
   * @return {number}
   */
  const hoursToSeconds = (value) => {
      return value * 3600;
  };

  /**
   * Converts seconds to a value/unit pair.
   * @param {number} value
   * @param {number} precision
   * @return {Array}
   */
  const secondsToValueUnit = (value, precision = 0) => {
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

  /** @type {?Project} */
  let myProject = null;

  const createNewProject = () => {
      const newProject = new Project();
      return newProject;
  };

  const setProject = (project) => {
      if (!(project instanceof Project)) {
          throw new TypeError('Invalid project');
      }
      myProject = project;
  };

  const getProject = () => {
      return myProject;
  };

  const deleteProject$1 = (project) => {
      if (!(project instanceof Project)) {
          throw new TypeError('Invalid project');
      }
      myProject = null;
  };

  const updateProject$1 = setProject;

  const ProjectController = {
      createNewProject,
      setProject,
      getProject,
      deleteProject: deleteProject$1,
      updateProject: updateProject$1,
  };

  const TIMEOUT = 3000;

  /**
   * @param {string} method
   * @param {string} url
   * @param {FormData} [data]
   * @returns {Promise<Response>}
   */
  const request = async (method, url, formData = null) => {
      if (method !== 'GET' && method !== 'POST') {
          throw new TypeError(`"${method}" method is not supported`);
      }
      if (!(formData instanceof FormData) && formData !== null) {
          throw new TypeError('Invalid type of data');
      }
      const abortController = new AbortController();
      setTimeout(() => {
          abortController.abort();
      }, TIMEOUT);
      const params = {
          signal: abortController.signal,
          method: method.toUpperCase(),
          //mode: 'cors',
          headers: {
              'X-Requested-With': 'XMLHttpRequest'
          }
      };
      if (method === 'POST') {
          params.body = formData;
      }
      try {
          const response = await fetch(url, params);
          return response;
      } catch (error) {
          throw new Error(`Request failed: ${error.toString()}`);
      }
  };

  const get = async (url) => {
      return request('GET', url);
  };

  const post = async (url, formData = null) => {
      return request('POST', url, formData);
  };

  const Ajax = {
      get,
      post,
  };

  function createTaskFromResponseData(responseData) {
      const newTask = new Task();
      newTask.id = parseInt(responseData.id);
      newTask.projectId = parseInt(responseData.projectId);
      newTask.createdAt = parseInt(responseData.createdAt);
      newTask.modifiedAt = responseData.modifiedAt ? parseInt(responseData.modifiedAt) : null;
      newTask.color = responseData.color;
      newTask.title = responseData.title;
      newTask.time = parseInt(responseData.time);
      return newTask;
  }

  async function getTasksForProject(project) {
      if (!(project instanceof Project)) {
          throw new TypeError('Invalid project');
      }
      const response = await Ajax.get(`api/task/belongs-to/${project.id}`).catch(() => {
          throw new NetworkError(`Failed to get tasks for project #${project.id}`);
      });
      if (!response.ok) {
          throw new UnexpectedResponseError(response);
      }
      const responseData = await response.json();
      //console.log('raw response data:', responseData);
      const tasks = [];
      responseData.forEach((item) => {
          tasks.push(createTaskFromResponseData(item));
      });
      //console.log('tasks fetched:', tasks);
      return tasks;
  }

  async function addTaskToProject(task, project) {
      if (!(task instanceof Task)) {
          throw new TypeError('Invalid task');
      }
      if (!(project instanceof Project)) {
          throw new TypeError('Invalid project');
      }
      const formData = new FormData();
      formData.append('projectId', project.id);
      formData.append('title', task.title);
      formData.append('time', task.time);
      formData.append('color', task.color);


      const response = await Ajax.post('api/task/create', formData).catch(() => {
          throw new NetworkError(`Failed to add a task to project #${project.id}`);
      });
      if (!response.ok) {
          throw new UnexpectedResponseError(response);
      }
      const responseData = await response.json();
      return createTaskFromResponseData(responseData);

      /*
      try {
          const responseData = await Ajax.post('api/task/create', formData);
          return createTaskFromResponseData(responseData);
      } catch (error) {
          console.error(`Failed to add a task to a project #${project.id}`);
          throw error;
      }
      */
  }

  async function updateTask(task) {
      if (!(task instanceof Task)) {
          throw new TypeError('Invalid task');
      }
      if (!task.id) {
          throw new TypeError('Task is missing its ID');
      }
      const formData = new FormData();
      formData.append('projectId', task.projectId);
      formData.append('title', task.title);
      formData.append('time', task.time);
      //formData.append('color', task.color); // color is unchangeable



      const response = await Ajax.post(`api/task/update/${task.id}`, formData).catch(() => {
          throw new NetworkError(`Failed to update task #${task.id}`);
      });
      if (!response.ok) {
          throw new UnexpectedResponseError(response);
      }
      const responseData = await response.json();
      return createTaskFromResponseData(responseData);

      /*
      try {
          const responseData = await Ajax.post(`api/task/update/${task.id}`, formData);
          return createTaskFromResponseData(responseData);
      } catch (error) {
          console.error(`Failed to update task #${task.id}`);
          throw error;
      }
      */
  }

  async function deleteTask$2(task) {
      if (!(task instanceof Task)) {
          throw new TypeError('Invalid task');
      }
      if (!task.id) {
          throw new TypeError('Task is missing its ID');
      }
      console.log('deleting task:', task);
      const formData = new FormData();
      formData.append('projectId', task.projectId);
      const response = await Ajax.post(`api/task/destroy/${task.id}`, formData).catch((error) => {
          console.error(error);
          throw new NetworkError(`Failed to delete task #${task.id}`);
      });
      if (!response.ok) {
          throw new UnexpectedResponseError(response);
      }
      const responseData = await response.json();
      return createTaskFromResponseData(responseData);




      /*
      try {
          const responseData = await Ajax.post(`api/task/destroy/${task.id}`);
          return createTaskFromResponseData(responseData);
      } catch (error) {
          console.error(`Failed to delete task #${task.id}`);
          throw error;
      }
      */
  }

  const TaskApi = {
      getTasksForProject,
      addTaskToProject,
      updateTask,
      deleteTask: deleteTask$2,
  };

  /**
   * @param {number} time
   * @returns {Promise}
   */
  const wait = (time = 0) => {
      return new Promise((resolve) => {
          setTimeout(() => {
              resolve();
          }, time);
      });
  };

  /**
   * @param  {...Function} rules
   * @returns {Object}
   */
  const create$1 = (...rules) => {
      let errors = [];
      /**
       * @param {Function} rule
       * @returns {Object}
       */
      const addRule = (rule) => {
          rules.push(rule);
          return validator;
      };
      /**
       * @param {*} target
       * @returns {boolean}
       */
      const validate = (target) => {
          errors = [];
          for (const rule of rules) {
              const result = rule(target);
              if (result !== true && result !== undefined) {
                  errors.push(result);
              }
          }
          return (errors.length === 0);
      };
      /**
       * @returns {Array}
       */
      const getErrors = () => {
          return errors;
      };
      /**
       * @returns {*}
       */
      const getError = () => {
          return errors[0];
      };
      const validator = {
          addRule,
          validate,
          getErrors,
          getError,
      };
      return validator;
  };

  // TODO: some presets for common rules?

  const Validator = {
      create: create$1,
  };

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

  const show$2 = (element, message) => {


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

  const hide$2 = (element) => {
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

  const Tooltip = {
      show: show$2,
      hide: hide$2,
      destroy,
      destroyAll,
  };

  /**
   * @param {HTMLFormElement} targetForm
   * @returns {Object} // TODO: how to explain custom object?
   */
  const create = (targetForm) => {
      const elementValidatorMap = new Map();
      const elementErrorMap = new Map();
      let hasValidated = false;

      /**
       * @param {Validator} validator
       * @param {*} targetElement
       * @returns {ValidatableForm}
       */
      const setValidatorToElement = (validator, targetElement) => {
          elementValidatorMap.set(targetElement, validator);
          return validatableForm;
      };

      const validateElements = () => {
          console.group('validatable form is validating...');
          elementErrorMap.clear();
          for (const [element, validator] of elementValidatorMap) {
              console.log('validating:', element);
              if (validator.validate(element) !== true) {
                  elementErrorMap.set(element, validator.getError());
                  console.warn('ivalid input:', validator.getError(), element);
              }
          }
          hasValidated = true;
          console.groupEnd();
          return (elementErrorMap.size === 0);
      };

      const showErrors = () => {
          for (const [element] of elementValidatorMap) {
              if (elementErrorMap.has(element)) {
                  const error = elementErrorMap.get(element);
                  Tooltip.show(element, error);
              } else {
                  Tooltip.hide(element);
              }
          }
      };

      const destroyErrors = () => {
          for (const [element] of elementValidatorMap) {
              Tooltip.destroy(element);
          }
      };

      const clearValidations = () => {
          elementErrorMap.clear();
          hasValidated = false;
          destroyErrors();
          console.log('validations have been cleared');
      };

      const onTargetFormChange = () => {
          if (hasValidated) {
              validateElements();
          }
          showErrors();
      };

      const onTargetFormInput = onTargetFormChange;

      const onTargetFormSubmit = (event) => {
          if (!validateElements()) {
              event.preventDefault();
              event.stopImmediatePropagation();
              event.stopPropagation();
          }
          showErrors();
      };

      //targetForm.addEventListener('change', onTargetFormChange);
      targetForm.addEventListener('input', onTargetFormInput);
      targetForm.addEventListener('submit', onTargetFormSubmit);

      const validatableForm = {
          setValidatorToElement,
          clearValidations,
      };
      return validatableForm;
  };

  const ValidatableForm = {
      create,
  };

  // @see https://ja.wikipedia.org/wiki/ASCII
  // @see https://so-zou.jp/web-app/text/fullwidth-halfwidth/
  // @see https://www.yoheim.net/blog.php?q=20191101

  const mojiAsciiPrintableMap = new Map();
  mojiAsciiPrintableMap.set('　', ' ');
  mojiAsciiPrintableMap.set('！', '!');
  mojiAsciiPrintableMap.set('＂', '"');
  mojiAsciiPrintableMap.set('”', '"');
  mojiAsciiPrintableMap.set('“', '"');
  mojiAsciiPrintableMap.set('＃', '#');
  mojiAsciiPrintableMap.set('＄', '$');
  mojiAsciiPrintableMap.set('％', '%');
  mojiAsciiPrintableMap.set('＆', '&');
  mojiAsciiPrintableMap.set('＇', '\'');
  mojiAsciiPrintableMap.set('（', '(');
  mojiAsciiPrintableMap.set('）', ')');
  mojiAsciiPrintableMap.set('＊', '*');
  mojiAsciiPrintableMap.set('＋', '+');
  mojiAsciiPrintableMap.set('，', ',');
  mojiAsciiPrintableMap.set('－', '-');
  mojiAsciiPrintableMap.set('．', '.');
  mojiAsciiPrintableMap.set('／', '/');
  mojiAsciiPrintableMap.set('：', ':');
  mojiAsciiPrintableMap.set('；', ';');
  mojiAsciiPrintableMap.set('＜', '<');
  mojiAsciiPrintableMap.set('＝', '=');
  mojiAsciiPrintableMap.set('＞', '>');
  mojiAsciiPrintableMap.set('？', '?');
  mojiAsciiPrintableMap.set('＠', '@');
  mojiAsciiPrintableMap.set('［', '[');
  mojiAsciiPrintableMap.set('＼', '\\');
  mojiAsciiPrintableMap.set('］', ']');
  mojiAsciiPrintableMap.set('＾', '^');
  mojiAsciiPrintableMap.set('＿', '_');
  mojiAsciiPrintableMap.set('｀', '`');
  mojiAsciiPrintableMap.set('｛', '{');
  mojiAsciiPrintableMap.set('｜', '|');
  mojiAsciiPrintableMap.set('｝', '}');
  mojiAsciiPrintableMap.set('～', '~');

  /**
   * @param {*} value
   * @returns {string}
   */
  const mojiToAsciiSymbol = (value) => {
      let replaced = '';
      for (const char of value.toString()) {
          if (mojiAsciiPrintableMap.has(char)) {
              replaced += mojiAsciiPrintableMap.get(char);
          } else {
              replaced += char;
          }
      }
      return replaced;
  };

  /**
   * @param {*} value
   * @returns {string}
   */
  const mojiToAsciiAlphanumeric = (value) => {
      return value.toString().replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) => {
          return String.fromCharCode(char.charCodeAt(0) - 0xFEE0);
      });
  };

  /**
   * @param {*} value
   * @returns {string}
   */
  const mojiToAsciiPrintable = (value) => {
      return mojiToAsciiSymbol(mojiToAsciiAlphanumeric(value));
  };

  /**
   * @param {*} value
   * @returns {number}
   */
  const mojiToNumber = (value) => {
      return Number.parseFloat(mojiToAsciiPrintable(value));
  };

  /** @type {HTMLElement} */
  const rootElement$9 = document.getElementById('modal-edit');
  /** @type {HTMLFormElement} */
  const formElement$4 = rootElement$9.querySelector('form');
  /** @type {HTMLInputElement} */
  const titleInputElement$1 = rootElement$9.querySelector('.field.title input');
  /** @type {HTMLInputElement} */
  const hoursInputElement = rootElement$9.querySelector('.field.hour input');
  /** @type {HTMLInputElement} */
  const minutesInputElement = rootElement$9.querySelector('.field.min input');
  /** @type {NodeList} */
  const actionButtonElements$6 = rootElement$9.querySelectorAll('.actions > .button');
  /** @type {HTMLButtonElement} */
  const cancelButtonElement$6 = actionButtonElements$6.item(0);
  /** @type {HTMLButtonElement} */
  const okButtonElement$4 = actionButtonElements$6.item(1);
  /** @type {?Project} */
  let targetProject$3 = null;
  /** @type {?Task} */
  let targetTask$1 = null;
  /** @type {Object} */
  const validatableForm$3 = ValidatableForm.create(formElement$4);

  const initValidation$3 = () => {
      const titleValidator = Validator.create(
          (element) => {
              if (!element.value) {
                  return '入力してください';
              }
              return true;
          },
      );
      const hoursAndMinutesValidator = Validator.create(
          (element) => {
              if (Number.isNaN(mojiToNumber(element.value || 0))) {
                  return '数字を入力してください';
              }
              return true;
          },
      );
      validatableForm$3
          .setValidatorToElement(titleValidator, titleInputElement$1)
          .setValidatorToElement(hoursAndMinutesValidator, hoursInputElement)
          .setValidatorToElement(hoursAndMinutesValidator, minutesInputElement);
  };

  const initEventListeners$8 = () => {
      formElement$4.addEventListener('submit', submit$4);
      cancelButtonElement$6.addEventListener('click', close$6);
  };

  const clearInputs = () => {
      titleInputElement$1.value = '';
      hoursInputElement.value = '';
      minutesInputElement.value = '';
  };

  const open$6 = (task) => {
      try {
          if (!(task instanceof Task)) {
              throw new TypeError('Invalid task');
          }
          targetTask$1 = task;
          targetProject$3 = ProjectController.getProject();
          clearInputs();
          if (targetTask$1.hasId()) {
              titleInputElement$1.value = targetTask$1.title;
              hoursInputElement.focus();
          } else {
              titleInputElement$1.focus();
          }
          StagingButton.reset(okButtonElement$4);
          Modal.open(rootElement$9, {
              beforeClose: () => {
                  document.activeElement.blur();
                  validatableForm$3.clearValidations();
              },
          });
      } catch (error) {
          ErrorHandler.handle(error);
      }
  };

  const close$6 = () => {
      Modal.close(rootElement$9);
  };

  const submit$4 = async (event) => {
      try {
          event.preventDefault();
          Blocker.open();
          StagingButton.stage(okButtonElement$4, 'idle', 'busy');

          if (!(targetTask$1 instanceof Task)) {
              throw new ReferenceError('No target task');
          }
          if (!(targetProject$3 instanceof Project)) {
              throw new ReferenceError('No target project');
          }
          //console.log('saving:', targetTask, 'to project:', targetProject);

          const title = titleInputElement$1.value;
          const hours = mojiToNumber(hoursInputElement.value || 0);
          const minutes = mojiToNumber(minutesInputElement.value || 0);
          const seconds = hoursToSeconds(hours) + minutesToSeconds(minutes);

          const taskToSend = Object.assign(TaskController.createNewTask(), targetTask$1);
          taskToSend.title = title;
          taskToSend.time += seconds;
          console.log('task to send:', taskToSend);

          let api, callback;
          if (targetTask$1.hasId()) {
              api = TaskApi.updateTask;
              callback = (taskUpdated) => {
                  TaskController.replaceTask(targetTask$1, taskUpdated);
                  Tasks.replaceTask(targetTask$1, taskUpdated);
                  targetTask$1 = taskUpdated; // bad implementation!
              };
          } else {
              api = TaskApi.addTaskToProject;
              callback = (newTask) => {
                  TaskController.addTask(newTask);
                  Tasks.addTask(newTask);
              };
          }
          const [task] = await Promise.all([api(taskToSend, targetProject$3), wait(Config.MIN_RESPONSE_WAIT)]);
          callback(task);
          Chart.update();
          close$6();
          /*
          StagingButton.stage(okButtonElement, 'busy', 'done');
          setTimeout(() => {
              StagingButton.stage(okButtonElement, 'done', 'idle');
          }, Config.NOTIFICATION_WAIT);
          */
      } catch (error) {
          StagingButton.stage(okButtonElement$4, 'busy', 'idle');
          ErrorHandler.handle(error);
      } finally {
          Blocker.close();
          //StagingButton.reset(okButtonElement);
      }
  };

  initValidation$3();
  initEventListeners$8();

  const TaskEditDialog = {
      open: open$6,
      close: close$6,
  };

  /** @type {HTMLElement} */
  const rootElement$8 = document.getElementById('modal-delete-task');
  /** @type {HTMLFormElement} */
  const formElement$3 = rootElement$8.querySelector('form');
  /** @type {HTMLElement} */
  const contentElement$1 = rootElement$8.querySelector('.content > p');
  /** @type {NodeList} */
  const actionButtonElements$5 = rootElement$8.querySelectorAll('.actions > .button');
  /** @type {HTMLButtonElement} */
  const cancelButtonElement$5 = actionButtonElements$5.item(0);
  /** @type {HTMLButtonElement} */
  const okButtonElement$3 = actionButtonElements$5.item(1);
  /** @type {?Task} */
  let targetTask = null;

  const initEventListeners$7 = () => {
      formElement$3.addEventListener('submit', submit$3);
      cancelButtonElement$5.addEventListener('click', close$5);
  };

  const open$5 = (task) => {
      try {
          if (!(task instanceof Task)) {
              throw new TypeError('Invalid task');
          }
          targetTask = task;
          contentElement$1.textContent = `「${targetTask.title}」を削除しますか？`;
          StagingButton.reset(okButtonElement$3);
          Modal.open(rootElement$8);
      } catch (error) {
          ErrorHandler.handle(error);
      }
  };

  const close$5 = () => {
      Modal.close(rootElement$8);
  };

  const submit$3 = async (event) => {
      try {
          event.preventDefault();
          Blocker.open();
          StagingButton.stage(okButtonElement$3, 'idle', 'busy');

          if (!(targetTask instanceof Task)) {
              throw new ReferenceError('No target task');
          }
          //console.log('deleting:', targetTask);

          await Promise.all([TaskApi.deleteTask(targetTask), wait(Config.MIN_RESPONSE_WAIT)]);
          TaskController.deleteTask(targetTask);
          Tasks.deleteTask(targetTask);
          Chart.update();
          close$5();
          /*
          StagingButton.stage(okButtonElement, 'busy', 'done');
          setTimeout(() => {
              StagingButton.stage(okButtonElement, 'done', 'idle');
          }, Config.NOTIFICATION_WAIT);
          */
      } catch (error) {
          StagingButton.stage(okButtonElement$3, 'busy', 'idle');
          ErrorHandler.handle(error);
      } finally {
          Blocker.close();
          //StagingButton.reset(okButtonElement);
      }
  };

  initEventListeners$7();

  const TaskDeleteDialog = {
      open: open$5,
      close: close$5,
  };

  /**
   * @param {Task} taskA
   * @param {Task} taskB
   */
  const sorter = (taskA, taskB) => {
      if (taskA.time === taskB.time) {
          return taskA.id - taskB.id;
      }
      return taskB.time - taskA.time;
  };

  const TaskHelper = {
      sorter,
  };

  /** @type {HTMLElement} */
  const rootElement$7 = document.querySelector('.project > .tasks');
  /** @type {HTMLElement} */
  const taskTemplateElement = rootElement$7.querySelector('.task.template');
  /** @type {HTMLElement} */
  const taskAdderElement = rootElement$7.querySelector('.task.adder');
  /** @type {Map} */
  const taskElementMap = new Map();
  /** @type {Map} */
  const elementTaskMap = new Map();

  const show$1 = () => {
      CommonBehavior.show(rootElement$7);
      resizeTaskElements();
  };

  const hide$1 = () => {
      CommonBehavior.hide(rootElement$7);
  };

  /**
   * @param {HTMLElement} taskElement
   * @returns {boolean}
   */
  function isTaskElement(taskElement) {
      return taskElement instanceof HTMLElement && taskElement.matches('.task');
  }

  function createNewTaskElement(task = null) {
      const newTaskElement = taskTemplateElement.cloneNode(true);
      if (task === null) {
          return newTaskElement;
      }
      if (!(task instanceof Task)) {
          throw new TypeError('Invalid task');
      }
      assignTaskToTaskElement(task, newTaskElement);
      return newTaskElement;
  }

  function appendTaskElement(taskElement) {
      if (!isTaskElement(taskElement)) {
          throw new TypeError('Invalid task element');
      }
      rootElement$7.insertBefore(taskElement, taskAdderElement);
      taskElement.classList.remove('template');
  }

  function deleteTaskElement(taskElement) {
      if (!isTaskElement(taskElement)) {
          throw new TypeError('Invalid task element');
      }
      taskElement.remove();
  }

  function assignTaskToTaskElement(task, taskElement) {
      if (!(task instanceof Task)) {
          throw new TypeError('Invalid task');
      }
      if (!isTaskElement(taskElement)) {
          throw new TypeError('Invalid task element');
      }
      const taskTitleElement = taskElement.querySelector('.title');
      const taskChartBarElement = taskElement.querySelector('.chart > .bar');
      const taskTimeValueElement = taskElement.querySelector('.time > .value');
      const taskTimeUnitElement = taskElement.querySelector('.time > .unit');

      taskTitleElement.textContent = task.title;

      taskChartBarElement.style.backgroundColor = task.color;
      taskChartBarElement.style.width = '0%';

      const [taskTimeValue, taskTimeUnit] = secondsToValueUnit(task.time, 1);
      if (taskTimeValue % 1 === 0) {
          taskTimeValueElement.textContent = taskTimeValue.toString();
      } else {
          const [l, r] = taskTimeValue.toString().split('.');
          taskTimeValueElement.innerHTML = `${l}<small>.${r}</small>`;
      }
      taskTimeUnitElement.textContent = taskTimeUnit;
  }

  function mapTaskAndTaskElement(task, taskElement) {
      if (!(task instanceof Task)) {
          throw new TypeError('Invalid task');
      }
      if (!isTaskElement(taskElement)) {
          throw new TypeError('Invalid task element');
      }
      taskElementMap.set(task, taskElement);
      elementTaskMap.set(taskElement, task);
      //console.log('mapped:', taskElementMap, elementTaskMap);
  }

  function unmapTaskAndTaskElement(task, taskElement) {
      if (!(task instanceof Task)) {
          throw new TypeError('Invalid task');
      }
      if (!isTaskElement(taskElement)) {
          throw new TypeError('Invalid task element');
      }
      taskElementMap.delete(task);
      elementTaskMap.delete(taskElement);
      //console.log('unmapped:', taskElementMap, elementTaskMap);
  }

  function getTaskForTaskElement(taskElement) {
      if (!isTaskElement(taskElement)) {
          throw new TypeError('Invalid task element');
      }
      return elementTaskMap.get(taskElement);
  }

  function getTaskElementForTask(task) {
      if (!(task instanceof Task)) {
          throw new TypeError('Invalid task');
      }
      return taskElementMap.get(task);
  }

  function addTask$1(task) {
      try {
          if (!(task instanceof Task)) {
              throw new TypeError('Invalid task');
          }
          const newTaskElement = createNewTaskElement(task);
          appendTaskElement(newTaskElement);
          mapTaskAndTaskElement(task, newTaskElement);
          rootElement$7.dispatchEvent(createUpdateEvent());
      } catch (error) {
          ErrorHandler(error);
      }
  }

  function replaceTask$1(targetTask, newTask) {
      try {
          if (!(targetTask instanceof Task) || !(newTask instanceof Task)) {
              throw new TypeError('Invalid task');
          }
          const targetTaskElement = getTaskElementForTask(targetTask);
          if (!isTaskElement(targetTaskElement)) {
              throw new ReferenceError('No task element to be replaced');
          }
          //throw new Error('test');
          unmapTaskAndTaskElement(targetTask, targetTaskElement);
          mapTaskAndTaskElement(newTask, targetTaskElement);
          assignTaskToTaskElement(newTask, targetTaskElement);
          rootElement$7.dispatchEvent(createUpdateEvent());
      } catch (error) {
          ErrorHandler.handle(error);
      }
  }

  function deleteTask$1(task) {
      try {
          if (!(task instanceof Task)) {
              throw new TypeError('Invalid task');
          }
          const taskElement = getTaskElementForTask(task);
          if (!isTaskElement(taskElement)) {
              throw new ReferenceError('No task element to be deleted');
          }
          unmapTaskAndTaskElement(task, taskElement);
          deleteTaskElement(taskElement);
          rootElement$7.dispatchEvent(createUpdateEvent());
      } catch (error) {
          ErrorHandler.handle(error);
      }
  }

  function resizeTaskElements() {
      const taskTimeElements = rootElement$7.querySelectorAll('.task:not(.template) .time');
      if (taskTimeElements.length === 0) {
          return;
      }
      const taskTimeElementWidths = [];
      taskTimeElements.forEach((taskTimeElement) => {
          taskTimeElementWidths.push(Math.ceil(taskTimeElement.offsetWidth));
      });
      const taskTimeElementMaxWidth = Math.max(...taskTimeElementWidths);
      taskTimeElements.forEach((taskTimeElement) => {
          taskTimeElement.style.width = `${taskTimeElementMaxWidth}px`;
      });
  }

  function sortTaskElements() {
      const taskElements = rootElement$7.querySelectorAll('.task:not(.template):not(.adder)');
      if (taskElements.length === 0) {
          return;
      }
      const taskElementStartingPosition = rootElement$7.getBoundingClientRect().y + window.scrollY;
      const taskElementPositions = [taskElementStartingPosition];
      taskElements.forEach((taskElement, i) => {
          taskElementPositions.push(taskElementPositions[i] + taskElement.getBoundingClientRect().height);
      });
      taskElementPositions.pop();
      taskElementPositions.sort((positionA, positionB) => {
          return positionA - positionB;
      });
      const taskElementsSorted = Array.from(taskElements).sort((taskElementA, taskElementB) => {
          const taskA = getTaskForTaskElement(taskElementA);
          const taskB = getTaskForTaskElement(taskElementB);
          if (taskA.time === taskB.time) {
              return taskA.id - taskB.id;
          }
          return taskB.time - taskA.time;
      });
      taskElementsSorted.forEach((taskElement, i) => {
          const taskElementPosition = taskElement.getBoundingClientRect().y + window.scrollY;
          const taskElementMatrix = getComputedStyle(taskElement).transform;
          const taskElementTranslate = (taskElementMatrix === 'none') ? 0 : parseFloat(taskElementMatrix.split(', ')[5]);
          taskElement.style.transform = `translateY(${Math.floor(taskElementTranslate + taskElementPositions[i] - taskElementPosition)}px)`;
      });
  }

  function updateTaskPercentages() {
      const taskChartBarElements = rootElement$7.querySelectorAll('.task:not(.template) .bar');
      if (taskChartBarElements.length === 0) {
          return;
      }
      taskChartBarElements.forEach((taskChartBarElement) => {
          const taskElement = taskChartBarElement.parentElement.parentElement;
          const task = getTaskForTaskElement(taskElement);
          const percentage = (task.time >= 1) ? Math.round((task.time / TaskController.getTaskTimeInTotal()) * 100) : 0;
          taskChartBarElement.style.width = `${percentage}%`;
      });
  }

  /**
   * @param {Task[]} tasks
   */
  function setInitialTasks(tasks) {
      try {
          //console.log('setting initial tasks:', tasks);
          tasks.sort(TaskHelper.sorter);
          tasks.forEach((task) => {
              if (!(task instanceof Task)) {
                  throw new TypeError('Invalid task');
              }
              const newTaskElement = createNewTaskElement(task);
              appendTaskElement(newTaskElement);
              mapTaskAndTaskElement(task, newTaskElement);
          });
          rootElement$7.dispatchEvent(createUpdateEvent(true, false, true));
      } catch (error) {
          ErrorHandler.handle(error);
      }
  }

  function createUpdateEvent(resize = true, sort = true, percentage = true) {
      return new CustomEvent('my-update', {
          bubbles: false,
          detail: {
              'resize': resize,
              'sort': sort,
              'percentage': percentage,
          }
      });
  }

  rootElement$7.addEventListener('my-update', (event) => {
      console.warn('TasksComponent updated!');
      console.log('event detail:', event.detail);
      if (event.detail.resize) {
          resizeTaskElements();
      }
      if (event.detail.sort) {
          sortTaskElements();
      }
      if (event.detail.percentage) {
          updateTaskPercentages();
      }
  });

  rootElement$7.addEventListener('click', (event) => {
      event.stopPropagation();
      const taskElementClicked = event.target.closest('.task');
      if (event.target.closest('.task:not(.template):not(.adder) > .action')) {
          console.log('deleting:', taskElementClicked);
          TaskDeleteDialog.open(getTaskForTaskElement(taskElementClicked));
          return;
      }
      if (event.target.closest('.task.adder')) {
          console.log('adding a new task');
          TaskEditDialog.open(TaskController.createNewTask());
          return;
      }
      console.log('editing:', taskElementClicked);
      TaskEditDialog.open(getTaskForTaskElement(taskElementClicked));
  });

  const Tasks = {
      show: show$1,
      hide: hide$1,
      setInitialTasks,
      addTask: addTask$1,
      replaceTask: replaceTask$1,
      deleteTask: deleteTask$1,
  };

  /** @type {Task[]} */
  let myTasks = [];
  /** @type {number} */
  let timeInTotal = 0;

  function findIndexOfTask(task) {
      if (!(task instanceof Task)) {
          throw new TypeError('Invalid task');
      }
      return myTasks.findIndex((myTask) => {
          return task === myTask;
      });
  }
  function createNewTask() {
      //return new Task();
      const newTask = new Task();
      newTask.color = (myTasks.length === 0) ? getRandomColor() : getNextColorOf(getNewestTask().color);
      return newTask;
  }

  function addTask(task) {
      if (!(task instanceof Task)) {
          throw new TypeError('Invalid task');
      }
      myTasks.push(task);
      timeInTotal += task.time;
  }

  /**
   * @param {Task[]} tasks
   */
  function setTasks(tasks) {
      myTasks = [];
      tasks.forEach((task) => {
          addTask(task);
      });
  }

  function replaceTask(targetTask, newTask) {
      if (!(targetTask instanceof Task) || !(newTask instanceof Task)) {
          throw new TypeError('Invalid task');
      }
      const targetIndex = findIndexOfTask(targetTask);
      if (targetIndex === -1) {
          throw new ReferenceError('No task to be replaced');
      }
      myTasks[targetIndex] = newTask;
      timeInTotal += (newTask.time - targetTask.time);
  }

  function deleteTask(task) {
      if (!(task instanceof Task)) {
          throw new TypeError('Invalid task');
      }
      const targetIndex = findIndexOfTask(task);
      if (targetIndex === -1) {
          throw new Error('No task to be removed');
      }
      timeInTotal -= task.time;
      myTasks.splice(targetIndex, 1);
  }

  function getTasks() {
      return myTasks;
  }

  function getTaskById(id) {
      return myTasks.find((myTask) => {
          return myTask.id === id;
      });
  }

  function getNewestTask() {
      myTasks.sort((taskA, taskB) => {
          return taskB.id - taskA.id;
      });
      return myTasks[0];
  }


  function getTaskTimeInTotal() {
      return timeInTotal;
  }

  const TaskController = {
      createNewTask,
      addTask,
      setTasks,
      replaceTask,
      deleteTask,
      getTasks,
      getTaskById,
      getNewestTask,
      getTaskTimeInTotal,
  };

  /**
   * @param {number} toNumber
   * @param {number} fromNumber
   * @param {number} duration
   * @param {Function} callback
   */
  const animateCounter = (toNumber, fromNumber = 0, duration = 1000, callback = (count) => {}) => {
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

  /** @type {HTMLElement} */
  const rootElement$6 = document.querySelector('.project > .chart');
  /** @type {HTMLCanvasElement} */
  const canvasElement = rootElement$6.querySelector('canvas');
  /** @type {HTMLElement} */
  const summaryElement = rootElement$6.querySelector('.summary');
  /** @type {HTMLElement} */
  const summaryTitleElement = summaryElement.querySelector('.title');
  /** @type {HTMLElement} */
  const summaryValueElement = summaryElement.querySelector('.value');
  /** @type {HTMLElement} */
  const summaryUnitElement = summaryElement.querySelector('.unit');

  let chart;

  const chartData = {
      labels: [],
      datasets: [{
          data: [],
          backgroundColor: []
      }]
  };

  const show = () => {
      CommonBehavior.show(rootElement$6);
      resize();
  };

  const hide = () => {
      CommonBehavior.hide(rootElement$6);
  };

  const initEventListeners$6 = () => {
      document.addEventListener('DOMContentLoaded', resize);
      window.addEventListener('resize', resize);
  };

  const resize = () => {
      rootElement$6.style.height = `${Math.ceil(rootElement$6.offsetWidth)}px`;
      fitSummary();
  };

  const update = () => {
      try {
          updateSummary('合計', '時間', secondsToHours(TaskController.getTaskTimeInTotal()));
          updateChart();
      } catch (error) {
          ErrorHandler.handle(error);
      }
  };

  const fitSummary = () => {
      const parentElement = summaryElement;
      const childElement = summaryValueElement;
      const parentElementRect = parentElement.getBoundingClientRect();
      const childElementRect = childElement.getBoundingClientRect();
      const availableWidth = parentElementRect.width;
      const availableHeight = parentElementRect.height - summaryTitleElement.offsetHeight - summaryUnitElement.offsetHeight;
      const scale = Math.min(availableWidth, availableHeight) / Math.max(childElementRect.width, childElementRect.height);
      const scaleComputed = parseFloat(getComputedStyle(childElement).transform.split(', ')[3]);
      childElement.style.transformOrigin = 'center';
      childElement.style.transform = `scale(${scale * (scaleComputed || 1)})`;
      //childElement.style.transform = `scale(${scale * (scaleComputed || 1)}) translate3d(0)`; // translate3d is to fix blurry text but seems to be ignored... why??
      //childElement.style.transform += ` translate3d(0)`; // this actually be ignored

      const childElementRectResized = childElement.getBoundingClientRect();
      summaryTitleElement.style.transform = `translateY(${Math.ceil(childElementRectResized.height / 2) * -1}px)`;
      summaryUnitElement.style.transform = `translateY(${Math.ceil(childElementRectResized.height / 2)}px)`;
  };

  const updateSummary = (title, unit, value) => {
      //console.group('updating summary...');
      //console.log({ title, unit, value });
      summaryTitleElement.textContent = title;
      summaryUnitElement.textContent = unit;
      const fromValue = Number.parseFloat(summaryValueElement.textContent);
      const toValue = roundFloat(value, 1);
      //console.log('counting from:', fromValue, 'to:', toValue);
      animateCounter(toValue * 10, fromValue * 10, 250, (count) => {
          const countRounded = count / 10;
          //console.log(countRounded);
          if (Number.isInteger(countRounded)) {
              summaryValueElement.innerHTML = `${countRounded.toString()}<small>.0</small>`;
          } else {
              const [l, r] = countRounded.toString().split('.');
              summaryValueElement.innerHTML = `${l}<small>.${r}</small>`;
          }
          fitSummary();
      });
      //console.groupEnd();
  };

  const initChart = () => {
      Chart$1.register(ArcElement, DoughnutController);
      chart = new Chart$1(canvasElement.getContext('2d'), {
          data: chartData,
          type: 'doughnut',
          options: {
              aspectRatio: 1,
              cutoutPercentage: 50,
              legend: {
                  display: false,
              },
              events: [],
              animation: {
                  duration: 250,
                  easing: 'easeOutCubic',
              }
          }
      });
  };

  const updateChart = () => {
      console.group('updating chart');
      const tasks = TaskController.getTasks();
      console.log('tasks:', tasks);
      console.log('time in total:', TaskController.getTaskTimeInTotal());
      if (tasks.length >= 1 && TaskController.getTaskTimeInTotal() >= 1) {
          const tasksToRender = [...tasks];
          tasksToRender.sort(TaskHelper.sorter);
          //console.log('tasks to RENDER:', tasksToRender);
          //console.log('make sure original is not affected:', tasks);
          chartData.datasets[0].data = [];
          chartData.datasets[0].backgroundColor = [];
          for (const task of tasksToRender) {
              chartData.datasets[0].data.push(task.time);
              chartData.datasets[0].backgroundColor.push(task.color);
          }
      } else {
          chartData.datasets[0].data = [1];
          chartData.datasets[0].backgroundColor = ['rgba(0, 0, 0, .1)']; // TODO: use CSS custom property or config!
      }
      chart.update();
      console.groupEnd();
  };

  initChart();
  initEventListeners$6();

  const Chart = {
      show,
      hide,
      update,
  };

  /** @type {HTMLElement} */
  const rootElement$5 = document.getElementById('modal-welcome');
  /** @type {HTMLFormElement} */
  rootElement$5.querySelector('form');
  /** @type {HTMLElement} */
  rootElement$5.querySelector('.content > p');
  /** @type {HTMLInputElement} */
  const urlInputElement$1 = rootElement$5.querySelector('input[name="url"]');
  /** @type {NodeList} */
  const actionButtonElements$4 = rootElement$5.querySelectorAll('.actions > .button');
  /** @type {HTMLButtonElement} */
  const cancelButtonElement$4 = actionButtonElements$4.item(0);
  /** @type {HTMLButtonElement} */
  const copyButtonElement$1 = actionButtonElements$4.item(1);
  /** @type {?Project} */
  //let targetProject = null;

  const initEventListeners$5 = () => {
      cancelButtonElement$4.addEventListener('click', close$4);
      copyButtonElement$1.addEventListener('click', copyUrl$1);
  };

  const copyUrl$1 = () => {
      urlInputElement$1.select();
      document.execCommand('copy');
      StagingButton.stage(copyButtonElement$1, 'idle', 'done');
      setTimeout(() => {
          StagingButton.stage(copyButtonElement$1, 'done', 'idle');
      }, 1000);
  };

  const open$4 = () => {
      try {
          urlInputElement$1.value = location.href;
          //urlInputElement.select();
          StagingButton.reset(copyButtonElement$1);
          Modal.open(rootElement$5, {
              beforeClose: () => {
                  document.activeElement.blur();
              },
          });
      } catch (error) {
          ErrorHandler.handle(error);
      }
  };

  const close$4 = () => {
      Modal.close(rootElement$5);
  };

  initEventListeners$5();

  const ProjectWelcomeDialog = {
      open: open$4,
      close: close$4,
  };

  function createProjectFromResponseData(responseData) {
      const newProject = new Project();
      newProject.id = parseInt(responseData.id);
      newProject.createdAt = parseInt(responseData.createdAt);
      newProject.modifiedAt = responseData.modifiedAt ? parseInt(responseData.modifiedAt) : null;
      newProject.slug = responseData.slug;
      newProject.title = responseData.title;
      return newProject;
  }

  /**
   * @param {Project} project
   * @param {string} key
   * @returns {Promise<Project>}
   */
  async function addProject(project, key) {
      if (!(project instanceof Project)) {
          throw new TypeError('Invalid project');
      }

      const formData = new FormData();
      formData.append('title', project.title);
      formData.append('key', key);

      const response = await Ajax.post('api/project/create', formData).catch(() => {
          throw new NetworkError('Failed to add a project');
      });
      if (!response.ok) {
          throw new UnexpectedResponseError(response);
      }
      const responseData = await response.json();
      return createProjectFromResponseData(responseData);
  }

  /**
   * @param {Project} project
   * @param {string} key
   * @returns {Promise<Project>}
   */
  async function updateProject(project, key = null) {
      if (!(project instanceof Project)) {
          throw new TypeError('Invalid project');
      }
      const formData = new FormData();
      formData.append('title', project.title);
      if (key !== null) {
          formData.append('key', key.toString());
      }
      const response = await Ajax.post(`api/project/update/${project.id}`, formData).catch(() => {
          throw new NetworkError(`Failed to update project #${project.id}`);
      });
      if (!response.ok) {
          throw new UnexpectedResponseError(response);
      }
      const responseData = await response.json();
      return createProjectFromResponseData(responseData);
  }

  /**
   * @param {Project} project
   * @param {string} key
   * @returns {Promise<Project>}
   */
  async function deleteProject(project, key) {
      if (!(project instanceof Project)) {
          throw new TypeError('Invalid project');
      }

      const formData = new FormData();
      formData.append('key', key.toString());

      const response = await Ajax.post(`api/project/destroy/${project.id}`, formData).catch(() => {
          throw new NetworkError(`Failed to delete project #${project.id}`);
      });
      if (!response.ok) {
          throw new UnexpectedResponseError(response);
      }
      const responseData = await response.json();
      //return createProjectFromResponseData(responseData);
      return responseData ? createProjectFromResponseData(responseData) : 'Authorization failed';
  }

  /**
   * @param {string} slug
   * @returns {Promise<Project>}
   */
  async function getProjectBySlug(slug) {
      const response = await Ajax.get(`api/project/slug/${slug}`).catch(() => {
          throw new NetworkError(`Failed to get a project slugged "${slug}"`);
      });
      if (!response.ok) {
          throw new UnexpectedResponseError(response);
      }
      const responseData = await response.json();
      return createProjectFromResponseData(responseData);
  }

  /**
   * @param {Project} project
   * @param {string} key
   * @returns {Promise<(Project|string)>}
   */
  async function authProjectByKey(project, key) {
      if (!(project instanceof Project)) {
          throw new TypeError('Invalid project');
      }

      const formData = new FormData();
      formData.append('key', key.toString());

      const response = await Ajax.post(`api/project/auth/${project.id}`, formData).catch(() => {
          throw new NetworkError(`Failed to auth project #${project.id}`);
      });
      if (!response.ok) {
          throw new UnexpectedResponseError(response);
      }
      const responseData = await response.json();
      return responseData ? createProjectFromResponseData(responseData) : 'Authorization failed';
      //return createProjectFromResponseData(await response.json());
  }

  async function unauthProject(project) {
      if (!(project instanceof Project)) {
          throw new TypeError('Invalid project');
      }
      const response = await Ajax.post(`api/project/unauth/${project.id}`).catch(() => {
          throw new NetworkError(`Failed to unauth project #${project.id}`);
      });
      if (!response.ok) {
          throw new UnexpectedResponseError(response);
      }
      const responseData = await response.json();
      return createProjectFromResponseData(responseData);
  }

  const ProjectApi = {
      addProject,
      updateProject,
      deleteProject,
      getProjectBySlug,
      authProjectByKey,
      unauthProject,
  };

  // @see: https://scrapbox.io/nwtgck/SHA256%E3%81%AE%E3%83%8F%E3%83%83%E3%82%B7%E3%83%A5%E3%82%92JavaScript%E3%81%AEWeb%E6%A8%99%E6%BA%96%E3%81%AE%E3%83%A9%E3%82%A4%E3%83%96%E3%83%A9%E3%83%AA%E3%81%A0%E3%81%91%E3%81%A7%E8%A8%88%E7%AE%97%E3%81%99%E3%82%8B
  const sha256 = async (value) => {
      const buff = new Uint8Array([].map.call(value.toString(), (c) => c.charCodeAt(0))).buffer;
      const digest = await crypto.subtle.digest('SHA-256', buff);
      return [].map.call(new Uint8Array(digest), x => ('00' + x.toString(16)).slice(-2)).join('');
  };

  /**
   * @param {(Location|URL)} url
   * @returns {Promise<Project>}
   */
  const getProjectFromUrl = async (url) => {
      const slug = url.pathname.replace(/\/|\/+$/g, '');
      return await ProjectApi.getProjectBySlug(slug);
  };

  /**
   * @param {string} key
   * @returns {string}
   */
  const hashProjectKey = async (key) => {
      const TIMES = 1000;
      let hash = key;
      for (let i = 0; i < TIMES; i++) {
          hash = await sha256(hash);
      }
      return hash;
  };

  const ProjectHelper = {
      getProjectFromUrl,
      hashProjectKey,
  };

  let lastTouch = 0;
  document.addEventListener('touchend', event => {
      const now = window.performance.now();
      if (now - lastTouch <= 500) {
          event.preventDefault();
      }
      lastTouch = now;
  }, true);

  /** @type {HTMLElement} */
  const rootElement$4 = document.getElementById('modal-delete');
  /** @type {HTMLFormElement} */
  const formElement$2 = rootElement$4.querySelector('form');
  /** @type {HTMLElement} */
  const contentElement = rootElement$4.querySelector('.content > p');
  /** @type {HTMLInputElement} */
  const keyInputElement = rootElement$4.querySelector('input[name="key"]');
  /** @type {NodeList} */
  const actionButtonElements$3 = rootElement$4.querySelectorAll('.actions > .button');
  /** @type {HTMLButtonElement} */
  const cancelButtonElement$3 = actionButtonElements$3.item(0);
  /** @type {HTMLButtonElement} */
  const okButtonElement$2 = actionButtonElements$3.item(1);
  /** @type {?Project} */
  let targetProject$2 = null;
  /** @type {Object} */
  const validatableForm$2 = ValidatableForm.create(formElement$2);

  const initValidation$2 = () => {
      const keyValidator = Validator.create((element) => {
          if (!element.value) {
              return '入力してください';
          }
          return true;
      });
      validatableForm$2.setValidatorToElement(keyValidator, keyInputElement);
  };

  const initEventListeners$4 = () => {
      formElement$2.addEventListener('submit', submit$2);
      cancelButtonElement$3.addEventListener('click', close$3);
  };

  const open$3 = () => {
      try {
          targetProject$2 = ProjectController.getProject();
          contentElement.textContent = `プロジェクト「${targetProject$2.title}」を削除するには合言葉を入力してください。`;
          keyInputElement.value = '';
          keyInputElement.focus();
          StagingButton.reset(okButtonElement$2);
          Modal.open(rootElement$4, {
              beforeClose: () => {
                  document.activeElement.blur();
                  validatableForm$2.clearValidations();
              },
          });
      } catch (error) {
          ErrorHandler.handle(error);
      }
  };

  const close$3 = () => {
      Modal.close(rootElement$4);
  };

  const submit$2 = async (event) => {
      try {
          event.preventDefault();
          Blocker.open();
          StagingButton.stage(okButtonElement$2, 'idle', 'busy');

          if (!(targetProject$2 instanceof Project)) {
              throw new ReferenceError('No target project');
          }
          console.log('deleting project:', targetProject$2);

          const key = await ProjectHelper.hashProjectKey(keyInputElement.value);
          const [response] = await Promise.all([ProjectApi.deleteProject(targetProject$2, key), wait(Config.MIN_RESPONSE_WAIT)]);
          console.log('response:', response);
          if (response instanceof Project) {
              const projectDeleted = response;
              ProjectController.deleteProject(projectDeleted);
              Tooltip.destroy(keyInputElement);
              //alert('Success!');
              history.replaceState(null, '', './');
              location.reload();
          } else {
              Tooltip.show(keyInputElement, '合言葉が違います');
              StagingButton.stage(okButtonElement$2, 'busy', 'idle');
          }
      } catch (error) {
          ErrorHandler.handle(error);
      } finally {
          Blocker.close();
      }
  };

  initValidation$2();
  initEventListeners$4();

  const ProjectDeleteDialog = {
      open: open$3,
      close: close$3,
  };

  /** @type {HTMLElement} */
  const rootElement$3 = document.getElementById('modal-rename');
  /** @type {HTMLFormElement} */
  const formElement$1 = rootElement$3.querySelector('form');
  /** @type {HTMLElement} */
  rootElement$3.querySelector('.content > p');
  /** @type {HTMLInputElement} */
  const titleInputElement = rootElement$3.querySelector('input[name="title"]');
  /** @type {NodeList} */
  const actionButtonElements$2 = rootElement$3.querySelectorAll('.actions > .button');
  /** @type {HTMLButtonElement} */
  const cancelButtonElement$2 = actionButtonElements$2.item(0);
  /** @type {HTMLButtonElement} */
  const okButtonElement$1 = actionButtonElements$2.item(1);
  /** @type {?Project} */
  let targetProject$1 = null;
  /** @type {Object} */
  const validatableForm$1 = ValidatableForm.create(formElement$1);

  const initValidation$1 = () => {
      const titleValidator = Validator.create((element) => {
          if (!element.value) {
              return '入力してください';
          }
          return true;
      });
      validatableForm$1.setValidatorToElement(titleValidator, titleInputElement);
  };

  const initEventListeners$3 = () => {
      formElement$1.addEventListener('submit', submit$1);
      cancelButtonElement$2.addEventListener('click', close$2);
  };

  const open$2 = () => {
      try {
          targetProject$1 = ProjectController.getProject();
          //titleInputElement.value = '';
          titleInputElement.value = targetProject$1.title;
          titleInputElement.focus();
          StagingButton.reset(okButtonElement$1);
          Modal.open(rootElement$3, {
              beforeClose: () => {
                  document.activeElement.blur();
                  validatableForm$1.clearValidations();
              },
          });
      } catch (error) {
          ErrorHandler.handle(error);
      }
  };

  const close$2 = () => {
      Modal.close(rootElement$3);
  };

  const submit$1 = async (event) => {
      try {
          event.preventDefault();
          Blocker.open();
          StagingButton.stage(okButtonElement$1, 'idle', 'busy');

          if (!(targetProject$1 instanceof Project)) {
              throw new ReferenceError('No target project');
          }
          console.log('updating project:', targetProject$1);

          const projectToSend = Object.assign(ProjectController.createNewProject(), targetProject$1);
          projectToSend.title = titleInputElement.value;

          const [projectUpdated] = await Promise.all([ProjectApi.updateProject(projectToSend), wait(Config.MIN_RESPONSE_WAIT)]);
          console.log('project updated:', projectUpdated);
          //alert('project updated!');
          ProjectController.setProject(projectUpdated);
          ProjectTitle.updateProject(projectUpdated);

          //close();
          StagingButton.stage(okButtonElement$1, 'busy', 'done');
          setTimeout(() => {
              StagingButton.stage(okButtonElement$1, 'done', 'idle');
          }, Config.NOTIFICATION_WAIT);
      } catch (error) {
          StagingButton.stage(okButtonElement$1, 'busy', 'idle');
          ErrorHandler.handle(error);
      } finally {
          Blocker.close();
          //StagingButton.reset(okButtonElement);
      }
  };

  initValidation$1();
  initEventListeners$3();

  const ProjectRenameDialog = {
      open: open$2,
      close: close$2,
  };

  /** @type {HTMLElement} */
  const rootElement$2 = document.getElementById('modal-key');
  /** @type {HTMLFormElement} */
  const formElement = rootElement$2.querySelector('form');
  /** @type {HTMLElement} */
  rootElement$2.querySelector('.content > p');
  /** @type {HTMLInputElement} */
  rootElement$2.querySelector('input[name="title"]');
  /** @type {HTMLInputElement} */
  const currentInputElement = rootElement$2.querySelector('input[name="current"]');
  /** @type {HTMLInputElement} */
  const newInputElement = rootElement$2.querySelector('input[name="new"]');
  /** @type {NodeList} */
  const actionButtonElements$1 = rootElement$2.querySelectorAll('.actions > .button');
  /** @type {HTMLButtonElement} */
  const cancelButtonElement$1 = actionButtonElements$1.item(0);
  /** @type {HTMLButtonElement} */
  const okButtonElement = actionButtonElements$1.item(1);
  /** @type {?Project} */
  let targetProject = null;
  /** @type {Object} */
  const validatableForm = ValidatableForm.create(formElement);

  const initValidation = () => {
      const keyValidator = Validator.create((element) => {
          if (!element.value) {
              return '入力してください';
          }
          return true;
      });
      validatableForm
          .setValidatorToElement(keyValidator, currentInputElement)
          .setValidatorToElement(keyValidator, newInputElement);
  };

  const initEventListeners$2 = () => {
      formElement.addEventListener('submit', submit);
      cancelButtonElement$1.addEventListener('click', close$1);
  };

  const open$1 = () => {
      try {
          targetProject = ProjectController.getProject();
          currentInputElement.value = '';
          currentInputElement.focus();
          newInputElement.value = '';
          StagingButton.reset(okButtonElement);
          Modal.open(rootElement$2, {
              beforeClose: () => {
                  document.activeElement.blur();
                  validatableForm.clearValidations();
              },
          });
      } catch (error) {
          ErrorHandler.handle(error);
      }
  };

  const close$1 = () => {
      Modal.close(rootElement$2);
  };

  const submit = async (event) => {
      try {
          event.preventDefault();
          Blocker.open();
          StagingButton.stage(okButtonElement, 'idle', 'busy');

          if (!(targetProject instanceof Project)) {
              throw new ReferenceError('No target project');
          }
          console.log('updating project:', targetProject);

          const currentKey = await ProjectHelper.hashProjectKey(currentInputElement.value);
          const newKey = await ProjectHelper.hashProjectKey(newInputElement.value);
          const response = await ProjectApi.authProjectByKey(targetProject, currentKey);
          if (response instanceof Project) {
              const projectToSend = Object.assign(ProjectController.createNewProject(), targetProject);
              const [projectUpdated] = await Promise.all([ProjectApi.updateProject(projectToSend, newKey), wait(Config.MIN_RESPONSE_WAIT)]);
              console.log('project updated:', projectUpdated);
              //alert('project updated!');
              ProjectController.setProject(projectUpdated);
              ProjectTitle.updateProject(projectUpdated);
              //close();
              currentInputElement.value = '';
              currentInputElement.focus();
              newInputElement.value = '';
              StagingButton.stage(okButtonElement, 'busy', 'done');
              setTimeout(() => {
                  StagingButton.stage(okButtonElement, 'done', 'idle');
              }, Config.NOTIFICATION_WAIT);
          } else {
              Tooltip.show(currentInputElement, '合言葉が違います');
              StagingButton.stage(okButtonElement, 'busy', 'idle');
          }
      } catch (error) {
          ErrorHandler.handle(error);
      } finally {
          Blocker.close();
      }
  };

  initValidation();
  initEventListeners$2();

  const ProjectKeyDialog = {
      open: open$1,
      close: close$1,
  };

  /** @type {HTMLElement} */
  const rootElement$1 = document.getElementById('modal-share');
  /** @type {HTMLFormElement} */
  rootElement$1.querySelector('form');
  /** @type {HTMLElement} */
  rootElement$1.querySelector('.content > p');
  /** @type {HTMLInputElement} */
  const urlInputElement = rootElement$1.querySelector('input[name="url"]');
  /** @type {NodeList} */
  const actionButtonElements = rootElement$1.querySelectorAll('.actions > .button');
  /** @type {HTMLButtonElement} */
  const cancelButtonElement = actionButtonElements.item(0);
  /** @type {HTMLButtonElement} */
  const copyButtonElement = actionButtonElements.item(1);
  /** @type {?Project} */
  //let targetProject = null;

  const initEventListeners$1 = () => {
      cancelButtonElement.addEventListener('click', close);
      copyButtonElement.addEventListener('click', copyUrl);
  };

  const copyUrl = () => {
      //console.log('copying url');
      urlInputElement.select();
      document.execCommand('copy');
      StagingButton.stage(copyButtonElement, 'idle', 'done');
      setTimeout(() => {
          StagingButton.stage(copyButtonElement, 'done', 'idle');
      }, 1000);
  };

  const open = () => {
      try {
          urlInputElement.value = location.href;
          //urlInputElement.select();
          StagingButton.reset(copyButtonElement);
          Modal.open(rootElement$1, {
              beforeClose: () => {
                  document.activeElement.blur();
              },
          });
      } catch (error) {
          ErrorHandler.handle(error);
      }
  };

  const close = () => {
      Modal.close(rootElement$1);
  };

  initEventListeners$1();

  const ProjectShareDialog = {
      open,
      close,
  };

  /** @type {HTMLElement} */
  const rootElement = document.querySelector('.sidebar');
  /** @type {HTMLAnchorElement[]} */
  const anchorElements = rootElement.querySelectorAll('a');

  //console.log('sidebar anchors:', anchorElements);

  const initEventListeners = () => {
      anchorElements[1].addEventListener('click', (event) => {
          event.preventDefault();
          ProjectShareDialog.open();
      });
      anchorElements[2].addEventListener('click', (event) => {
          event.preventDefault();
          ProjectRenameDialog.open();
      });
      anchorElements[3].addEventListener('click', (event) => {
          event.preventDefault();
          ProjectKeyDialog.open();
      });
      anchorElements[4].addEventListener('click', async (event) => {
          event.preventDefault();
          const project = ProjectController.getProject();
          console.log('logging out:', project);
          const projectUnauthorized = await ProjectApi.unauthProject(project);
          console.log('logged out:', projectUnauthorized);
          location.href = './';
      });
      anchorElements[5].addEventListener('click', (event) => {
          event.preventDefault();
          ProjectDeleteDialog.open();
      });
  };

  initEventListeners();

  (async () => {
      try {
          Blocker.open();

          const project = await ProjectHelper.getProjectFromUrl(location);
          //console.log('project fetched:', project);
          const tasks = await TaskApi.getTasksForProject(project);
          //console.log('tasks fetched:', tasks);

          ProjectController.setProject(project);
          TaskController.setTasks(tasks);

          ProjectTitle.setProject(project).updateProject(project);
          Chart.update();
          Tasks.setInitialTasks(tasks);

          if (!project.modifiedAt) {
              ProjectWelcomeDialog.open();
          }
      } catch (error) {
          ErrorHandler.handle(error);
      } finally {
          Blocker.close();
      }
  })();

}());
