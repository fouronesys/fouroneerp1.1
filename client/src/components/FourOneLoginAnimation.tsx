import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, Zap, Lock, Puzzle } from "lucide-react";

interface FourOneLoginAnimationProps {
  isVisible: boolean;
  onComplete?: () => void;
}

export default function FourOneLoginAnimation({ isVisible, onComplete }: FourOneLoginAnimationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [showLogo, setShowLogo] = useState(false);

  // Icons representing the four "1"s of Four One Solutions
  const fourOnes = [
    { icon: Cpu, label: "Tecnología", color: "text-blue-600" },
    { icon: Zap, label: "Rapidez", color: "text-yellow-500" },
    { icon: Lock, label: "Seguridad", color: "text-green-600" },
    { icon: Puzzle, label: "Integración", color: "text-orange-500" }
  ];

  useEffect(() => {
    if (!isVisible) return;

    const timer = setTimeout(() => {
      if (currentStep < fourOnes.length) {
        setCurrentStep(currentStep + 1);
      } else if (!showLogo) {
        setShowLogo(true);
        setTimeout(() => {
          onComplete?.();
        }, 3000);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [currentStep, isVisible, showLogo, onComplete, fourOnes.length]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-slate-900 flex items-center justify-center z-50 overflow-hidden">
      {/* Animated Background Particles */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-blue-500 rounded-full blur-3xl animate-pulse opacity-30"></div>
        <div className="absolute bottom-1/4 right-1/4 w-24 h-24 bg-purple-500 rounded-full blur-2xl animate-pulse delay-1000 opacity-25"></div>
        <div className="absolute top-1/2 right-1/3 w-20 h-20 bg-indigo-500 rounded-full blur-xl animate-pulse delay-500 opacity-20"></div>
        <div className="absolute top-3/4 left-1/3 w-16 h-16 bg-cyan-400 rounded-full blur-lg animate-pulse delay-700 opacity-15"></div>
        <div className="absolute top-1/6 right-1/2 w-28 h-28 bg-violet-500 rounded-full blur-2xl animate-pulse delay-300 opacity-25"></div>
      </div>

      {/* Geometric Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
                           radial-gradient(circle at 75% 75%, rgba(147, 51, 234, 0.1) 0%, transparent 50%),
                           radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.05) 0%, transparent 50%)`
        }}></div>
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-60"
            initial={{
              x: Math.random() * window.innerWidth,
              y: window.innerHeight + 10,
              scale: Math.random() * 0.5 + 0.5
            }}
            animate={{
              y: -10,
              x: Math.random() * window.innerWidth,
              opacity: [0, 0.8, 0]
            }}
            transition={{
              duration: Math.random() * 3 + 4,
              repeat: Infinity,
              delay: Math.random() * 2,
              ease: "linear"
            }}
          />
        ))}
      </div>

      <div className="relative flex flex-col items-center space-y-8 z-10">
        {/* Four "1"s Animation */}
        <div className="flex items-center justify-center space-x-8">
          {fourOnes.map((item, index) => {
            const IconComponent = item.icon;
            const isActive = currentStep > index;

            return (
              <motion.div
                key={index}
                initial={{ scale: 0, opacity: 0, y: 20 }}
                animate={{
                  scale: isActive ? 1 : 0,
                  opacity: isActive ? 1 : 0,
                  y: isActive ? 0 : 20,
                  rotate: isActive ? [0, 10, -10, 0] : 0
                }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.2,
                  rotate: { delay: index * 0.2 + 0.3, duration: 0.4 }
                }}
                className="flex flex-col items-center"
              >
                {/* Enhanced Glow Effects */}
                <motion.div
                  className={`absolute inset-0 ${item.color} rounded-full blur-xl`}
                  animate={{
                    scale: isActive ? [1, 1.4, 1] : 1,
                    opacity: isActive ? [0.4, 0.8, 0.4] : 0
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: index * 0.2
                  }}
                />
                <motion.div
                  className={`absolute inset-2 ${item.color} rounded-full blur-lg`}
                  animate={{
                    scale: isActive ? [1, 1.3, 1] : 1,
                    opacity: isActive ? [0.2, 0.5, 0.2] : 0
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: index * 0.2 + 0.3
                  }}
                />

                {/* Icon Container */}
                <motion.div 
                  className="relative w-20 h-20 bg-gradient-to-br from-white/25 to-white/5 backdrop-blur-lg rounded-full flex items-center justify-center border border-white/40 shadow-2xl"
                  animate={{
                    boxShadow: isActive ? [
                      "0 0 20px rgba(255,255,255,0.3)",
                      "0 0 40px rgba(255,255,255,0.5)",
                      "0 0 20px rgba(255,255,255,0.3)"
                    ] : "0 0 0px rgba(255,255,255,0)"
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: index * 0.2
                  }}
                >
                  <motion.div
                    animate={{
                      scale: isActive ? [1, 1.1, 1] : 1,
                      rotate: isActive ? [0, 5, -5, 0] : 0
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      delay: index * 0.2 + 0.5
                    }}
                  >
                    <IconComponent className={`w-10 h-10 ${item.color} drop-shadow-lg`} />
                  </motion.div>

                  {/* Inner glow ring */}
                  <motion.div
                    className={`absolute inset-2 rounded-full border-2 ${item.color} opacity-40`}
                    animate={{
                      scale: isActive ? [1, 1.1, 1] : 1,
                      opacity: isActive ? [0.4, 0.8, 0.4] : 0
                    }}
                    transition={{
                      duration: 1.8,
                      repeat: Infinity,
                      delay: index * 0.2 + 0.7
                    }}
                  />
                </motion.div>

                {/* Centered Label Below Icon */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 10 }}
                  transition={{ delay: index * 0.2 + 0.3 }}
                  className="mt-4 w-full text-center"
                >
                  <span className={`text-sm font-medium ${item.color} drop-shadow-lg whitespace-nowrap`}>
                    {item.label}
                  </span>
                </motion.div>
              </motion.div>
            );
          })}
        </div>

        {/* Four One Solutions Logo Text */}
        <AnimatePresence>
          {showLogo && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-center"
            >
              {/* Main Title with Enhanced Effects */}
              <motion.h1
                className="text-5xl md:text-7xl font-bold mb-4 tracking-wide"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ 
                  opacity: 1, 
                  scale: 1,
                  textShadow: [
                    "0 0 20px rgba(255,255,255,0.8), 0 0 40px rgba(59,130,246,0.6)",
                    "0 0 30px rgba(255,255,255,1), 0 0 60px rgba(147,51,234,0.8)",
                    "0 0 20px rgba(255,255,255,0.8), 0 0 40px rgba(59,130,246,0.6)"
                  ]
                }}
                transition={{ 
                  delay: 0.3,
                  textShadow: { duration: 2.5, repeat: Infinity }
                }}
              >
                <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                  Four One
                </span>
              </motion.h1>

              {/* Subtitle with Glow */}
              <motion.p
                className="text-2xl md:text-3xl font-semibold mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  textShadow: [
                    "0 0 15px rgba(168,85,247,0.8)",
                    "0 0 25px rgba(236,72,153,0.8)",
                    "0 0 15px rgba(168,85,247,0.8)"
                  ]
                }}
                transition={{ 
                  delay: 0.6,
                  textShadow: { duration: 2, repeat: Infinity, delay: 0.5 }
                }}
              >
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                  Solutions
                </span>
              </motion.p>

              {/* Tagline */}
              <motion.p
                className="text-sm text-blue-300 mt-4 font-light"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.9 }}
              >
                Una solución. Cuatro pilares. Infinitas posibilidades.
              </motion.p>

              {/* Binary Code Animation */}
              <motion.div
                className="flex justify-center mt-6 space-x-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                {[1, 1, 1, 1].map((digit, index) => (
                  <motion.span
                    key={index}
                    className="text-2xl font-mono text-blue-400"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ 
                      opacity: [0, 1, 1, 0.5, 1],
                      scale: [0, 1.2, 1, 1.1, 1]
                    }}
                    transition={{
                      delay: 1.2 + index * 0.1,
                      duration: 0.8,
                      repeat: Infinity,
                      repeatDelay: 2
                    }}
                  >
                    {digit}
                  </motion.span>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showLogo ? 1 : 0 }}
          transition={{ delay: 1.5 }}
          className="mt-8"
        >
          <div className="flex space-x-1">
            {[0, 1, 2].map((index) => (
              <motion.div
                key={index}
                className="w-2 h-2 bg-blue-400 rounded-full"
                animate={{
                  y: [0, -8, 0],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{
                  duration: 0.6,
                  repeat: Infinity,
                  delay: index * 0.1
                }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}