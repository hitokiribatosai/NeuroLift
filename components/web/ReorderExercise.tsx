import React, { useEffect, useRef, useState } from 'react';
import { Reorder, useDragControls, useReducedMotion } from 'framer-motion';
import { ActiveExercise } from '../../types';

/** Drag only from the handle, so scrolling and the keyboard move buttons remain usable. */
export function ReorderExercise({ exercise, selected, select, label, children }: {
  exercise: ActiveExercise; selected: boolean; select: () => void; label: string; children: React.ReactNode;
}) {
  const controls = useDragControls();
  const reduced = useReducedMotion();
  const item = useRef<HTMLLIElement>(null);
  const pointerY = useRef(0);
  const [dragging, setDragging] = useState(false);
  useEffect(() => {
    if (!dragging) return;
    let frame = 0;
    const move = (event: PointerEvent) => { pointerY.current = event.clientY; };
    const stop = () => setDragging(false);
    const tick = () => {
      const list = item.current?.closest<HTMLElement>('[data-reorder-list]');
      if (list) {
        const bounds = list.getBoundingClientRect();
        const edge = 55;
        const delta = pointerY.current < bounds.top + edge ? -Math.min(8, (bounds.top + edge - pointerY.current) / 6)
          : pointerY.current > bounds.bottom - edge ? Math.min(8, (pointerY.current - bounds.bottom + edge) / 6) : 0;
        list.scrollTop += delta;
      }
      frame = requestAnimationFrame(tick);
    };
    document.addEventListener('pointermove', move);
    document.addEventListener('pointerup', stop);
    document.addEventListener('pointercancel', stop);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('pointermove', move);
      document.removeEventListener('pointerup', stop);
      document.removeEventListener('pointercancel', stop);
    };
  }, [dragging]);
  return <Reorder.Item ref={item} value={exercise} dragListener={false} dragControls={controls}
    onDragStart={() => { select(); setDragging(true); }} onDragEnd={() => setDragging(false)}
    onPointerDownCapture={select} data-exercise={exercise.name} data-moved={selected ? 'true' : undefined}
    data-dragging={dragging ? 'true' : undefined}
    transition={{ layout: { duration: reduced ? 0 : 0.2 } }}
    className="web-reorder-item flex items-center gap-3 p-4 border rounded-2xl">
    <button type="button" className="web-drag-handle" aria-label={label}
      onPointerDown={event => { pointerY.current = event.clientY; controls.start(event); }}><span aria-hidden="true">⠿</span></button>
    {children}
  </Reorder.Item>;
}
