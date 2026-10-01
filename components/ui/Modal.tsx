import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
 children: React.ReactNode;
 isOpen: boolean;
 onClose: () => void;
 label?: string;
}
export const Modal: React.FC<ModalProps> = ({ children, isOpen, onClose, label = 'Details' }) => {
 const panel = useRef<HTMLDivElement>(null);
 const close = useRef(onClose);
 close.current = onClose;
 useEffect(() => {
  if (!isOpen) return;
  const previous = document.activeElement as HTMLElement | null;
  const overflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  panel.current?.focus();
  const keyboard = (e: KeyboardEvent) => {
   if (e.key === 'Escape') { e.preventDefault(); close.current(); }
   if (e.key !== 'Tab') return;
   const elements = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]') || []).filter(el => el.getClientRects().length);
   const first = elements[0], last = elements.at(-1);
   if (!first) { e.preventDefault(); panel.current?.focus(); }
   else if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {e.preventDefault(); last?.focus();}
   else if (!e.shiftKey && document.activeElement === last) {e.preventDefault(); first.focus();}
  };
  document.addEventListener('keydown', keyboard);
  return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown',keyboard); previous?.focus(); };
 }, [isOpen]);
 if (!isOpen) return null;
 return createPortal(
  <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-zinc-950/40 dark:bg-black/80 backdrop-blur-md"
   style={{WebkitBackdropFilter:'blur(12px)'}} onClick={e => {if (e.target === e.currentTarget) onClose();}}>
   <div ref={panel} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}
    className="w-full max-w-2xl max-h-[90dvh] overflow-y-auto rounded-3xl focus:outline-none">
    {children}
   </div>
  </div>, document.body);
};
