import { useEffect, useRef, useState } from 'react';

function FindReact(dom: { [x: string]: any }, traverseUp = 0) {
  const key = Object.keys(dom).find(key => {
    return (
      key.startsWith('__reactFiber$') || // react 17+
      key.startsWith('__reactInternalInstance$')
    ); // react <17
  }) as string;

  const domFiber = dom[key];
  if (domFiber == null) return null;

  // react <16
  if (domFiber._currentElement) {
    let compFiber = domFiber._currentElement._owner;
    for (let i = 0; i < traverseUp; i++) {
      compFiber = compFiber._currentElement._owner;
    }
    return compFiber._instance;
  }

  // react 16+
  const GetCompFiber = (fiber: { return: any }) => {
    //return fiber._debugOwner; // this also works, but is __DEV__ only
    let parentFiber = fiber.return;
    while (typeof parentFiber.type == 'string') {
      parentFiber = parentFiber.return;
    }
    return parentFiber;
  };
  let compFiber = GetCompFiber(domFiber);
  for (let i = 0; i < traverseUp; i++) {
    compFiber = GetCompFiber(compFiber);
  }
  return compFiber;
}

const useParentName = (ref: { current: any }) => {
  const [parentName, setParentName] = useState();
  useEffect(() => {
    if (ref.current) {
      let node = FindReact(ref.current, 1);
      console.log('node -->', node);
      setParentName(node.type.name);
    }
  }, []);

  return { ref, parentName };
};

export { useParentName };
