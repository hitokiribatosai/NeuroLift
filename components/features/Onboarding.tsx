import React, { useState } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { SpotlightButton } from '../ui/SpotlightButton';
import { Card } from '../ui/Card';
import { useLanguage } from '../../contexts/LanguageContext';

interface OnboardingProps {
  onComplete: () => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const { t } = useLanguage();
  const [currentScreen, setCurrentScreen] = useState(0);
  const [[page, direction], setPage] = useState([0, 0]);

  const handleComplete = () => {
    localStorage.setItem('neuroLift_hasCompletedOnboarding', 'true');
    onComplete();
  };

  // Placeholder screen components - will implement next
  const screens = [
    <WelcomeScreen key="welcome" />,
    <TrackingScreen key="tracking" />,
    <LibraryScreen key="library" />,
    <OfflineScreen key="offline" onComplete={onComplete} />
  ];

  return (
    <div className="fixed inset-0 bg-zinc-950 z-50 flex flex-col">
      {/* Header with Skip button */}
      <div className="flex justify-end p-6">
        <button
          onClick={handleComplete}
          className="text-zinc-400 hover:text-white transition-colors text-sm font-medium"
        >
          Skip
        </button>
      </div>

      {/* Progress Dots */}
      <div className="flex justify-center mb-8">
        <div className="flex gap-2">
          {screens.map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentScreen ? 'bg-teal-500' : 'bg-zinc-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Swipeable Container */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence initial={false} custom={direction}>
          <motion.div
            key={page}
            custom={direction}
            initial="enter"
            animate="center"
            exit="exit"
            variants={{
              enter: (direction: number) => ({
                x: direction > 0 ? 300 : -300,
                opacity: 0,
              }),
              center: {
                zIndex: 1,
                x: 0,
                opacity: 1,
              },
              exit: (direction: number) => ({
                zIndex: 0,
                x: direction < 0 ? 300 : -300,
                opacity: 0,
              }),
            }}
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 },
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={1}
            onDragEnd={(e: any, { offset, velocity }: PanInfo) => {
              const swipe = swipePower(offset.x, velocity.x);

              if (swipe < -swipeConfidenceThreshold) {
                paginate(1);
              } else if (swipe > swipeConfidenceThreshold) {
                paginate(-1);
              }
            }}
            className="h-full"
          >
            <div className="h-full px-6 py-8">
              {screens[currentScreen]}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );

  function paginate(newDirection: number) {
    const newPage = page + newDirection;
    if (newPage >= 0 && newPage < screens.length) {
      setPage([newPage, newDirection]);
      setCurrentScreen(newPage);
    }
  }
};

const swipeConfidenceThreshold = 10000;
const swipePower = (offset: number, velocity: number) => {
  return Math.abs(offset) * velocity;
};

// Screen Components
const WelcomeScreen: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full text-center">
    <div className="mb-12">
      {/* App Logo placeholder */}
      <div className="w-24 h-24 bg-teal-500 rounded-full flex items-center justify-center mb-6">
        <span className="text-2xl font-black text-white">NL</span>
      </div>
    </div>
    <h1 className="text-3xl font-black uppercase tracking-tight text-white mb-4">
      Welcome to NeuroLift
    </h1>
    <p className="text-zinc-400 font-medium text-lg max-w-sm">
      Your science-backed fitness companion for tracking, planning, and achieving your goals.
    </p>
  </div>
);

const TrackingScreen: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full text-center">
    <Card className="mb-8 w-full max-w-sm">
      <div className="text-center">
        <div className="w-16 h-16 bg-teal-500 rounded-2xl flex items-center justify-center mb-4 mx-auto">
          📊
        </div>
        <h2 className="text-xl font-black uppercase tracking-tight text-white mb-2">
          Smart Tracking
        </h2>
        <p className="text-zinc-400 font-medium">
          Track your workouts, progress, and achievements with precision and insights.
        </p>
      </div>
    </Card>
  </div>
);

const LibraryScreen: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full text-center">
    <Card className="mb-8 w-full max-w-sm">
      <div className="text-center">
        <div className="w-16 h-16 bg-teal-500 rounded-2xl flex items-center justify-center mb-4 mx-auto">
          💪
        </div>
        <h2 className="text-xl font-black uppercase tracking-tight text-white mb-2">
          Exercise Library
        </h2>
        <p className="text-zinc-400 font-medium">
          Access hundreds of exercises with proper form guidance and variations.
        </p>
      </div>
    </Card>
  </div>
);

const OfflineScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const handleComplete = () => {
    localStorage.setItem('neuroLift_hasCompletedOnboarding', 'true');
    onComplete();
  };

  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <Card className="mb-8 w-full max-w-sm">
        <div className="text-center">
          <div className="w-16 h-16 bg-teal-500 rounded-2xl flex items-center justify-center mb-4 mx-auto">
            🔄
          </div>
          <h2 className="text-xl font-black uppercase tracking-tight text-white mb-2">
            Offline First
          </h2>
          <p className="text-zinc-400 font-medium mb-8">
            Work out anywhere, anytime. Your data syncs when you're back online.
          </p>
          <SpotlightButton onClick={handleComplete} className="w-full">
            Get Started
          </SpotlightButton>
        </div>
      </Card>
    </div>
  );
};

export default Onboarding;