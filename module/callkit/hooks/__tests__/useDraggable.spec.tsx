import { fireEvent, renderHook } from '@testing-library/react';
import { createRef } from 'react';
import { useDraggable } from '../useDraggable';

describe('useDraggable', () => {
  it('keeps video layout clicks from dragging and stops after a missed mouseup', () => {
    const container = document.createElement('div');
    const video = document.createElement('div');
    video.dataset.callkitNoDrag = '';
    container.appendChild(video);
    document.body.appendChild(container);

    const containerRef = createRef<HTMLElement>();
    Object.defineProperty(containerRef, 'current', { value: container });
    const onDrag = vi.fn();
    const { unmount } = renderHook(() =>
      useDraggable({ containerRef, onDrag, getCurrentPosition: () => ({ left: 100, top: 100 }) }),
    );

    fireEvent.mouseDown(video, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.mouseMove(document, { buttons: 1, clientX: 40, clientY: 40 });
    expect(onDrag).not.toHaveBeenCalled();

    fireEvent.mouseDown(container, { button: 0, clientX: 10, clientY: 10 });
    fireEvent.mouseMove(document, { buttons: 1, clientX: 13, clientY: 13 });
    expect(onDrag).not.toHaveBeenCalled();

    fireEvent.mouseMove(document, { buttons: 1, clientX: 20, clientY: 20 });
    expect(onDrag).toHaveBeenCalledWith({ x: 110, y: 110 }, { x: 10, y: 10 });

    // Layout changes can swallow mouseup; the next move without a pressed button must cancel dragging.
    fireEvent.mouseMove(document, { buttons: 0, clientX: 200, clientY: 200 });
    fireEvent.mouseMove(document, { buttons: 0, clientX: 300, clientY: 300 });
    expect(onDrag).toHaveBeenCalledTimes(1);

    unmount();
    container.remove();
  });
});
