import { HTMLAttributes, useEffect, useRef } from "react";

interface Options {
  index: number;
  count: number;
  rtl: boolean;
  onSelect: (index: number) => void;
  beforeSwitch: () => void;
}

/** Card-only gesture controller. Does not own workout records or navigate the page. */
export function useExerciseCardSwipe({
  index,
  count,
  rtl,
  onSelect,
  beforeSwitch,
}: Options) {
  const cardRef = useRef<HTMLElement>(null);
  const touchStart = useRef<{
    x: number;
    y: number;
    axis: "pending" | "horizontal" | "vertical";
  } | null>(null);
  const sliding = useRef(false);
  const suppressClickUntil = useRef(0);
  const slideAnimation = useRef<Animation | null>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      slideAnimation.current?.cancel();
    };
  }, []);
  const animateCard = async (from: number, to: number, duration: number) => {
    const card = cardRef.current;
    if (!card) return;
    slideAnimation.current?.cancel();
    card.style.transform = `translateX(${to}px)`;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const animation = card.animate(
      [
        { transform: `translateX(${from}px)` },
        { transform: `translateX(${to}px)` },
      ],
      { duration, easing: "cubic-bezier(.22,.61,.36,1)" },
    );
    slideAnimation.current = animation;
    await animation.finished.catch(() => undefined);
  };
  const returnCard = async () => {
    const card = cardRef.current;
    if (!card || sliding.current) return;
    const offset = new DOMMatrixReadOnly(getComputedStyle(card).transform).m41;
    if (Math.abs(offset) < 0.5) return;
    sliding.current = true;
    await animateCard(offset, 0, 160);
    sliding.current = false;
  };
  const switchExercise = async (next: number) => {
    if (sliding.current) return;
    if (next < 0 || next >= count || next === index) {
      void returnCard();
      return;
    }
    sliding.current = true;
    beforeSwitch();
    // Keep the editor's footprint so shorter exercises cannot clamp the page's scroll.
    // Never scrollIntoView here: switching should leave the user's viewport in place.
    const card = cardRef.current;
    if (card) {
      card.style.minHeight = `${card.getBoundingClientRect().height}px`;
      const direction = (next > index ? 1 : -1) * (rtl ? -1 : 1);
      const width = card.offsetWidth + 24;
      const offset = new DOMMatrixReadOnly(getComputedStyle(card).transform)
        .m41;
      await animateCard(offset, -direction * width, 160);
      if (!mounted.current) return;
      onSelect(next);
      await animateCard(direction * width, 0, 200);
    } else {
      onSelect(next);
    }
    sliding.current = false;
  };

  const swipeHandlers: HTMLAttributes<HTMLElement> = {
    onClickCapture: (event) => {
      // A horizontal gesture over a control must not also activate it on release.
      if (event.detail !== 0 && Date.now() < suppressClickUntil.current) {
        event.preventDefault();
        event.stopPropagation();
        suppressClickUntil.current = 0;
      }
    },
    onTouchStart: (event) => {
      touchStart.current = null;
      suppressClickUntil.current = 0;
      if (sliding.current) return;
      if (event.touches.length !== 1) {
        void returnCard();
        return;
      }
      // Track intent across the entire card, including set fields and controls.
      // Ordinary taps still reach the input/button; only horizontal drags are swipes.
      touchStart.current = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
        axis: "pending",
      };
    },
    onTouchMove: (event) => {
      const start = touchStart.current;
      if (!start || sliding.current) return;
      if (event.touches.length !== 1) {
        touchStart.current = null;
        void returnCard();
        return;
      }
      const dx = event.touches[0].clientX - start.x;
      const dy = event.touches[0].clientY - start.y;
      if (
        start.axis === "pending" &&
        Math.max(Math.abs(dx), Math.abs(dy)) > 10
      ) {
        start.axis =
          Math.abs(dx) > Math.abs(dy) * 1.5 ? "horizontal" : "vertical";
      }
      if (start.axis !== "horizontal") return;
      suppressClickUntil.current = Date.now() + 700;
      beforeSwitch();
      const next = index + (dx < 0 ? 1 : -1) * (rtl ? -1 : 1);
      const offset = next < 0 || next >= count ? dx * 0.2 : dx;
      if (cardRef.current)
        cardRef.current.style.transform = `translateX(${offset}px)`;
    },
    onTouchCancel: () => {
      touchStart.current = null;
      void returnCard();
    },
    onTouchEnd: (event) => {
      const start = touchStart.current;
      touchStart.current = null;
      if (!start || !event.changedTouches.length) return;
      const dx = event.changedTouches[0].clientX - start.x;
      const dy = event.changedTouches[0].clientY - start.y;
      if (start.axis === "horizontal")
        suppressClickUntil.current = Date.now() + 700;
      if (
        start.axis === "vertical" ||
        Math.abs(dx) < 60 ||
        Math.abs(dx) < Math.abs(dy) * 2
      ) {
        void returnCard();
        return;
      }
      void switchExercise(index + (dx < 0 ? 1 : -1) * (rtl ? -1 : 1));
    },
  };
  return { cardRef, switchExercise, swipeHandlers };
}
