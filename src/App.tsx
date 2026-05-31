import { useState, useEffect, useCallback, useRef } from 'react';
import { Maximize, Minimize, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { alphabetData, AlphabetItem } from './data/alphabetData';

const BACKGROUND_COLORS = [
  'from-pink-400 via-red-400 to-yellow-400',
  'from-green-400 via-cyan-400 to-blue-400',
  'from-yellow-400 via-orange-400 to-red-400',
  'from-blue-400 via-purple-400 to-pink-400',
  'from-teal-400 via-green-400 to-yellow-400',
  'from-orange-400 via-pink-400 to-purple-400',
];

const MILESTONES = [50, 100, 150, 200, 250, 300, 350, 400, 450, 500];

export default function App() {
  const [currentItem, setCurrentItem] = useState<AlphabetItem | null>(null);
  const [counter, setCounter] = useState(0);
  const [milestone, setMilestone] = useState<number | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState(BACKGROUND_COLORS[0]);
  const [showTryAgain, setShowTryAgain] = useState(false);
  const lastLetterRef = useRef<string>('');
  const lastItemIndexRef = useRef<Record<string, number>>({});

  const triggerCelebration = useCallback(() => {
    const count = 200;
    const defaults = {
      origin: { y: 0.7 },
      zIndex: 9999,
    };

    function fire(particleRatio: number, opts: confetti.Options) {
      confetti({
        ...defaults,
        ...opts,
        particleCount: Math.floor(count * particleRatio),
      });
    }

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2, { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1, { spread: 120, startVelocity: 45 });
  }, []);

  const triggerMilestoneCelebration = useCallback(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

    function randomIn(min: number, max: number) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomIn(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ['#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff'],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomIn(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ['#ff00ff', '#ff8800', '#00ff88', '#8800ff', '#ff0088'],
      });
    }, 250);
  }, []);

  const playSound = useCallback((type: 'success' | 'invalid') => {
    const audioContext = new (window.AudioContext || (window as Window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    if (type === 'success') {
      oscillator.frequency.setValueAtTime(523.25, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(659.25, audioContext.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(783.99, audioContext.currentTime + 0.2);
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } else {
      oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    }
  }, []);

  const handleKeyPress = useCallback((event: KeyboardEvent) => {
    const key = event.key.toUpperCase();

    if (!/^[A-Z]$/.test(key)) {
      setShowTryAgain(true);
      playSound('invalid');
      setTimeout(() => setShowTryAgain(false), 1500);
      return;
    }

    const items = alphabetData[key];
    if (!items) return;

    let newItem: AlphabetItem;
    if (lastLetterRef.current === key) {
      const lastIndex = lastItemIndexRef.current[key] ?? -1;
      const nextIndex = (lastIndex + 1) % items.length;
      newItem = items[nextIndex];
      lastItemIndexRef.current[key] = nextIndex;
    } else {
      const randomIndex = Math.floor(Math.random() * items.length);
      newItem = items[randomIndex];
      lastItemIndexRef.current[key] = randomIndex;
    }

    lastLetterRef.current = key;
    setCurrentItem(newItem);
    setShowTryAgain(false);

    const newBackground = BACKGROUND_COLORS[Math.floor(Math.random() * BACKGROUND_COLORS.length)];
    setBackgroundColor(newBackground);

    setCounter((prev) => {
      const newCount = prev + 1;

      if (MILESTONES.includes(newCount)) {
        setMilestone(newCount);
        triggerMilestoneCelebration();
        setTimeout(() => setMilestone(null), 4000);
      } else {
        triggerCelebration();
      }

      return newCount;
    });

    playSound('success');
  }, [playSound, triggerCelebration, triggerMilestoneCelebration]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const handleClear = () => {
    setCurrentItem(null);
    setCounter(0);
    lastLetterRef.current = '';
    lastItemIndexRef.current = {};
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${backgroundColor} flex flex-col items-center justify-center p-4 relative overflow-hidden transition-all duration-500`}>
      <div className="absolute top-4 right-4 z-20 flex gap-2">
        <button
          onClick={handleClear}
          className="bg-white/90 hover:bg-white text-gray-800 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transition-all hover:scale-105 font-semibold"
        >
          <RotateCcw className="w-5 h-5" />
          Clear
        </button>
        <button
          onClick={toggleFullscreen}
          className="bg-white/90 hover:bg-white text-gray-800 px-4 py-2 rounded-full shadow-lg flex items-center gap-2 transition-all hover:scale-105 font-semibold"
        >
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          {isFullscreen ? 'Exit' : 'Fullscreen'}
        </button>
      </div>

      <div className="absolute top-4 left-4 z-20 bg-white/90 px-6 py-3 rounded-full shadow-lg">
        <p className="text-2xl font-bold text-gray-800">Presses: <span className="text-blue-600">{counter}</span></p>
      </div>

      {!currentItem && !showTryAgain && (
        <div className="text-center space-y-6 animate-pulse">
          <h1 className="text-6xl md:text-8xl font-extrabold text-white drop-shadow-2xl">
            Press Any Key!
          </h1>
          <p className="text-2xl md:text-3xl text-white/90 font-semibold">
            Press A-Z to see animals and objects
          </p>
        </div>
      )}

      {showTryAgain && (
        <div className="text-center space-y-6 animate-bounce">
          <div className="text-9xl font-extrabold text-white drop-shadow-2xl">
            Try Again!
          </div>
          <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-8 max-w-lg mx-auto">
            <p className="text-2xl text-white font-bold">Press A-Z keys for animals!</p>
          </div>
        </div>
      )}

      {currentItem && !showTryAgain && (
        <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="bg-white/30 backdrop-blur-md rounded-3xl p-8 shadow-2xl max-w-3xl mx-auto transform hover:scale-105 transition-all duration-300">
            <div className="text-9xl font-extrabold text-white drop-shadow-2xl mb-6 animate-bounce">
              {currentItem.letter}
            </div>
            <p className="text-3xl md:text-5xl font-bold text-white mb-8 tracking-wide">
              {currentItem.letter} is for <span className="text-yellow-300">{currentItem.word}</span>
            </p>
            <div className="relative inline-block w-80 h-80 md:w-96 md:h-96 flex items-center justify-center">
              <div
                className="w-full h-full rounded-3xl shadow-2xl border-8 border-white/50 transform transition-all duration-500 hover:scale-105 flex items-center justify-center bg-white/10"
                dangerouslySetInnerHTML={{ __html: currentItem.svg }}
              />
              <div className="absolute -bottom-4 -right-4 bg-yellow-400 text-gray-900 rounded-full w-20 h-20 flex items-center justify-center text-4xl font-bold shadow-xl animate-pulse">
                {currentItem.letter}
              </div>
            </div>
          </div>
        </div>
      )}

      {milestone && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500 p-1 rounded-3xl shadow-2xl animate-bounce">
            <div className="bg-white rounded-3xl p-12 text-center space-y-6">
              <div className="text-8xl mb-4">🎉</div>
              <h2 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500">
                Milestone!
              </h2>
              <p className="text-4xl font-bold text-gray-800">
                {milestone} Key Presses!
              </p>
              <p className="text-xl text-gray-600 font-semibold">Amazing job learning! Keep going!</p>
              <div className="mt-6 text-6xl">⭐🎊🌟</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
