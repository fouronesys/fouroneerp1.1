import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Building2, Users, BarChart3, Shield, Zap, Globe } from "lucide-react";

interface WelcomeAnimationProps {
  userName?: string;
  companyName?: string;
  onComplete: () => void;
}

export default function WelcomeAnimation({ userName, companyName, onComplete }: WelcomeAnimationProps) {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [showFeatures, setShowFeatures] = useState(false);

  const features = [
    { icon: Building2, text: "Gestión Empresarial", color: "text-blue-400" },
    { icon: Users, text: "Recursos Humanos", color: "text-green-400" },
    { icon: BarChart3, text: "Análisis Avanzado", color: "text-purple-400" },
    { icon: Shield, text: "Seguridad Total", color: "text-red-400" },
    { icon: Zap, text: "Alto Rendimiento", color: "text-yellow-400" },
    { icon: Globe, text: "Solución Dominicana", color: "text-indigo-400" }
  ];

  useEffect(() => {
    const timeouts = [
      setTimeout(() => setCurrentPhase(1), 500),
      setTimeout(() => setCurrentPhase(2), 1500),
      setTimeout(() => setShowFeatures(true), 2500),
      setTimeout(() => setCurrentPhase(3), 4000),
      setTimeout(() => onComplete(), 6000)
    ];

    return () => timeouts.forEach(clearTimeout);
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950 flex items-center justify-center z-50"
      >
        {/* Fondo animado con partículas */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-blue-300 rounded-full opacity-30"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -100],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto px-6">
          {/* Logo y título principal */}
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: currentPhase >= 0 ? 1 : 0, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            className="mb-8"
          >
            <div className="relative inline-block">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="w-32 h-32 border-4 border-blue-400 border-t-white rounded-full mx-auto mb-4"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center shadow-2xl">
                  <span className="text-blue-900 font-bold text-3xl">41</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Título de bienvenida */}
          <AnimatePresence mode="wait">
            {currentPhase >= 1 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="mb-6"
              >
                <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
                  ¡Bienvenido{userName ? `, ${userName}` : ""}!
                </h1>
                <p className="text-2xl text-blue-200">
                  Four One Solutions
                </p>
                {companyName && (
                  <p className="text-xl text-blue-300 mt-2">
                    {companyName}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Descripción */}
          <AnimatePresence mode="wait">
            {currentPhase >= 2 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="mb-8"
              >
                <p className="text-xl text-blue-100 max-w-2xl mx-auto">
                  Tu plataforma integral de gestión empresarial dominicana está lista para potenciar tu negocio
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Características animadas */}
          <AnimatePresence>
            {showFeatures && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8 }}
                className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8"
              >
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ 
                      delay: index * 0.1,
                      type: "spring",
                      stiffness: 200
                    }}
                    className="flex flex-col items-center p-4 bg-white/10 rounded-lg backdrop-blur-sm"
                  >
                    <feature.icon className={`w-8 h-8 ${feature.color} mb-2`} />
                    <span className="text-white text-sm font-medium">
                      {feature.text}
                    </span>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mensaje final */}
          <AnimatePresence mode="wait">
            {currentPhase >= 3 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="mb-8"
              >
                <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full">
                  <Zap className="w-5 h-5 text-white mr-2" />
                  <span className="text-white font-semibold">
                    ¡Comenzemos a revolucionar tu empresa!
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Barra de progreso */}
          <div className="w-full max-w-md mx-auto bg-blue-800/30 rounded-full h-2">
            <motion.div
              className="bg-gradient-to-r from-blue-400 to-white h-2 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${(currentPhase + 1) * 25}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="text-blue-300 text-sm mt-6"
          >
            Solución empresarial 100% dominicana - Tecnología de vanguardia
          </motion.p>
        </div>

        {/* Efectos de fondo */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500 rounded-full opacity-10 blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-indigo-500 rounded-full opacity-10 blur-3xl" />
      </motion.div>
    </AnimatePresence>
  );
}