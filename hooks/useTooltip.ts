import { useState, useEffect } from 'react';

export const useTooltip = (tooltipId: string) => {
  const [isOpen, setIsOpen] = useState(false);
  const storageKey = `neuroLift_tooltip_${tooltipId}`;

  useEffect(() => {
    // Check if tooltip has been dismissed
    const dismissed = localStorage.getItem(storageKey);
    if (!dismissed) {
      // Show tooltip after 1 second delay
      const timer = setTimeout(() => setIsOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [storageKey]);

  const dismiss = () => {
    setIsOpen(false);
    localStorage.setItem(storageKey, 'true');
  };

  const reset = () => {
    localStorage.removeItem(storageKey);
    setIsOpen(true);
  };

  return { isOpen, dismiss, reset };
};