import React,{ useEffect,useRef,useState } from 'react';
import { createPortal } from 'react-dom';
import { isTopOverlay,registerOverlay } from '../../utils/overlays';

interface ModalProps {
 children: React.ReactNode;
 isOpen: boolean;
 onClose: () => void;
 label?: string;
 sheet?: boolean;
}
export const Modal: React.FC<ModalProps> = ({ children, isOpen, onClose, label = 'Details', sheet = false }) => {
 const panel = useRef<HTMLDivElement>(null);
 const close = useRef(onClose);
 close.current = onClose;
 const [viewport, setViewport] = useState({ height: window.innerHeight, top: 0 });
 useEffect(() => {
  if (!isOpen) return;
  const update = () => setViewport({ height: window.visualViewport?.height ?? window.innerHeight, top: window.visualViewport?.offsetTop ?? 0 });
  update();
  const visual = window.visualViewport;
  visual?.addEventListener('resize', update);
  visual?.addEventListener('scroll', update);
  window.addEventListener('resize', update);
  return () => { visual?.removeEventListener('resize', update); visual?.removeEventListener('scroll', update); window.removeEventListener('resize', update); };
 }, [isOpen]);
 useEffect(() => {
  if (!isOpen) return;
  const previous = document.activeElement as HTMLElement | null;
  const overflow = document.body.style.overflow;
  document.body.style.overflow = 'hidden';
  panel.current?.focus({ preventScroll: true });
  const dismiss = () => close.current();
  const unregister = registerOverlay(dismiss);
  const keyboard = (e: KeyboardEvent) => {
   if (!isTopOverlay(dismiss)) return;
   if (e.key === 'Escape') { e.preventDefault(); close.current(); }
   if (e.key !== 'Tab') return;
   const elements = Array.from(panel.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [tabindex="0"]') || []).filter(el => el.getClientRects().length);

   e.preventDefault();
   if (!elements.length) panel.current?.focus();
   else {
    const current = elements.indexOf(document.activeElement as HTMLElement);
    const next = e.shiftKey ? (current <= 0 ? elements.length - 1 : current - 1) : (current + 1) % elements.length;
    elements[next].focus();
   }
  };
  document.addEventListener('keydown', keyboard);
  return () => { unregister(); document.body.style.overflow = overflow; document.removeEventListener('keydown',keyboard); previous?.focus({ preventScroll: true }); };
 }, [isOpen]);
 if (!isOpen) return null;
 return createPortal(
  <div className={`fixed inset-0 z-[999] flex items-center justify-center p-4 bg-zinc-950/40 dark:bg-black/80 backdrop-blur-md web-modal-backdrop ${sheet ? 'web-sheet-backdrop' : ''}`}
   style={{WebkitBackdropFilter:'blur(12px)', top: viewport.top, bottom: 'auto', height: viewport.height}} onClick={e => {if (e.target === e.currentTarget) onClose();}}>
   <div ref={panel} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}
    style={{maxHeight: '100%'}} className={`w-full max-w-2xl max-h-[90dvh] overflow-y-auto rounded-3xl focus:outline-none website-redesign web-modal-theme`}>
    {<div className="web-surface">{children}</div>}
   </div>
  </div>, document.body);
};
