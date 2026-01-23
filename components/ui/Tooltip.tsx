import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

interface TooltipProps {
  id: string; // Unique ID for storage
  isOpen: boolean;
  onDismiss: () => void;
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
  targetRef?: React.RefObject<HTMLElement>;
}

export const Tooltip: React.FC<TooltipProps> = ({
  id,
  isOpen,
  onDismiss,
  position = 'top',
  children,
  targetRef
}) => {
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    setMounted(true);

    if (targetRef?.current) {
      const rect = targetRef.current.getBoundingClientRect();
      const tooltipWidth = 280;

      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = rect.top - 80;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case 'bottom':
          top = rect.bottom + 20;
          left = rect.left + rect.width / 2 - tooltipWidth / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2 - 40;
          left = rect.left - tooltipWidth - 20;
          break;
        case 'right':
          top = rect.top + rect.height / 2 - 40;
          left = rect.right + 20;
          break;
      }

      setCoords({ top, left });
    }
  }, [targetRef, position]);

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onDismiss, 8000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onDismiss]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 10 }}
          style={{
            position: 'fixed',
            top: coords.top,
            left: coords.left,
            zIndex: 1000
          }}
          className="w-72"
        >
          <div className="relative bg-teal-500 border border-teal-400 rounded-2xl p-4 shadow-2xl shadow-teal-500/30">
            {/* Arrow */}
            <div
              className={`absolute w-3 h-3 bg-teal-500 border-teal-400 transform rotate-45 ${
                position === 'top' ? 'bottom-[-6px] left-1/2 -translate-x-1/2 border-b border-r' :
                position === 'bottom' ? 'top-[-6px] left-1/2 -translate-x-1/2 border-t border-l' :
                position === 'left' ? 'right-[-6px] top-1/2 -translate-y-1/2 border-t border-r' :
                'left-[-6px] top-1/2 -translate-y-1/2 border-b border-l'
              }`}
            />

            <div className="relative z-10 text-white">
              {children}
            </div>

            <button
              onClick={onDismiss}
              className="mt-3 w-full py-2 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-black uppercase tracking-widest transition-colors"
            >
              Got it!
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
};