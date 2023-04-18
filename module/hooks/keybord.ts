import { useCallback, useEffect, MutableRefObject } from 'react';

type keyType = KeyboardEvent['keyCode'] | KeyboardEvent['key'];
type keyFilter = keyType | Array<keyType>;
type EventHandler = (event: KeyboardEvent) => void;
type keyEvent = 'keydown' | 'keyup';
type BasicElement = HTMLElement | Element | Document | Window;
type TargetElement = BasicElement | MutableRefObject<null | undefined>;
type EventOptions = {
  events?: Array<keyEvent>;
  target?: TargetElement;
};

const modifierKey: any = {
  ctrl: (event: KeyboardEvent) => event.ctrlKey,
  shift: (event: KeyboardEvent) => event.shiftKey,
  alt: (event: KeyboardEvent) => event.altKey,
  meta: (event: KeyboardEvent) => event.metaKey,
};

const defaultEvents: Array<keyEvent> = ['keydown'];

/**
 * 判断对象类型
 * @param obj 参数对象
 * @returns String
 */
function isType<T>(obj: T): string {
  return Object.prototype.toString
    .call(obj)
    .replace(/^[object (.+)]$/, '$1')
    .toLowerCase();
}

/**
 * 获取当前元素
 * @param target TargetElement
 * @param defaultElement 默认绑定的元素
 */
function getTargetElement(target?: TargetElement, defaultElement?: BasicElement) {
  if (!target) {
    return defaultElement;
  }

  if ('current' in target) {
    return target.current;
  }

  return target;
}

/**
 * 按键是否激活
 * @param event 键盘事件
 * @param keyFilter 当前键
 */
const keyActivated = (event: KeyboardEvent, keyFilter: any) => {
  const type = isType(keyFilter);
  const { keyCode } = event;

  if (type === 'number') {
    return keyCode == keyFilter;
  }

  const keyCodeArr = keyFilter.split('.');
  // 符合条件的长度
  let genLen = 0;
  // 组合键
  for (const key of keyCodeArr) {
    const genModifier = modifierKey[key];

    if ((genModifier && genModifier) || keyCode == key) {
      genLen++;
    }
  }

  return genLen === keyCodeArr.length;
};

/**
 * 键盘按下预处理方法
 * @param event 键盘事件
 * @param keyFilter 键码集
 */
const genKeyFormate = (event: KeyboardEvent, keyFilter: any) => {
  const type = isType(keyFilter);

  if (type === 'string' || type === 'number') {
    return keyActivated(event, keyFilter);
  }

  // 多个键
  if (type === 'array') {
    return keyFilter.some((item: keyFilter) => keyActivated(event, item));
  }
};

/**
 * 监听键盘按下/松开
 * @param keyCode
 * @param eventHandler
 * @param options
 */
const useKeyPress = (
  keyCode: keyFilter,
  eventHandler?: EventHandler,
  options: EventOptions = {},
) => {
  const { target, events = defaultEvents } = options;

  const callbackHandler = useCallback(
    (event: any) => {
      if (genKeyFormate(event, keyCode)) {
        typeof eventHandler === 'function' && eventHandler(event);
      }
    },
    [keyCode],
  );

  useEffect(() => {
    const el = getTargetElement(target, window)!;

    for (const eventName of events) {
      el.addEventListener(eventName, callbackHandler);
    }

    return () => {
      for (const eventName of events) {
        el.removeEventListener(eventName, callbackHandler);
      }
    };
  }, [keyCode, events, callbackHandler]);
};

export default useKeyPress;
