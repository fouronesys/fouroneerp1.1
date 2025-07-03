import { useEffect, useState } from "react";
import { motion } from "framer-motion";

export default function LoginAnimation() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % 4);
    }, 1500);

    return () => clearInterval(interval);
  }, []);

  const steps = [
    {
      title: "Conectando",
      description: "Accediendo a Four One Solutions",
      icon: "🔗"
    },
    {
      title: "Validando", 
      description: "Verificando credenciales",
      icon: "🔐"
    },
    {
      title: "Sincronizando",
      description: "Cargando datos empresariales", 
      icon: "🔄"
    },
    {
      title: "Listo",
      description: "Bienvenido a Four One Solutions",
      icon: "✨"
    }
  ];

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center z-50">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-indigo-600/20"></div>
      </div>

      <div className="relative z-10 text-center max-w-md mx-auto px-6">
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 20,
            duration: 1
          }}
          className="mb-8"
        >
          <div className="relative">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear"
              }}
              className="w-24 h-24 mx-auto border-4 border-blue-300 border-t-white rounded-full"
            />
            
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
                <div className="text-blue-900 font-bold text-xl">41</div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-4xl font-bold text-white mb-2"
        >
          Four One Solutions
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
          className="text-blue-200 mb-8 text-lg"
        >
          Soluciones Empresariales Dominicanas
        </motion.p>

        <div className="mb-8">
          <div className="flex justify-center space-x-2 mb-4">
            {steps.map((_, index) => (
              <motion.div
                key={index}
                className={`w-3 h-3 rounded-full ${
                  index <= currentStep ? "bg-white" : "bg-blue-600"
                }`}
                initial={{ scale: 0 }}
                animate={{ scale: index <= currentStep ? 1.2 : 1 }}
                transition={{ duration: 0.3 }}
              />
            ))}
          </div>

          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4 }}
            className="text-center"
          >
            <div className="text-3xl mb-2">{steps[currentStep]?.icon}</div>
            <h3 className="text-white font-semibold text-lg mb-1">
              {steps[currentStep]?.title}
            </h3>
            <p className="text-blue-200 text-sm">
              {steps[currentStep]?.description}
            </p>
          </motion.div>
        </div>

        <div className="w-full bg-blue-800 rounded-full h-2 mb-6">
          <motion.div
            className="bg-gradient-to-r from-blue-400 to-white h-2 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <div className="absolute -top-20 -left-20 w-40 h-40 bg-blue-500 rounded-full opacity-20 blur-xl" />
        <div className="absolute -bottom-20 -right-20 w-32 h-32 bg-indigo-400 rounded-full opacity-20 blur-xl" />
        
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full opacity-30"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [-20, 20],
              opacity: [0.3, 0.7, 0.3],
            }}
            transition={{
              duration: 2 + i * 0.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
          className="text-blue-300 text-xs mt-8"
        >
          © 2025 Four One Solutions - Tecnología Empresarial Dominicana
        </motion.p>
      </div>
    </div>
  );
}