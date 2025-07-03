import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Home, ArrowLeft, Search, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useState, useEffect } from "react";

export default function NotFound() {
  const [isVisible, setIsVisible] = useState(false);
  const [floatingElements, setFloatingElements] = useState<Array<{id: number, x: number, y: number}>>([]);

  useEffect(() => {
    setIsVisible(true);
    // Create floating elements
    const elements = Array.from({length: 8}, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100
    }));
    setFloatingElements(elements);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 30, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { 
        type: "spring", 
        stiffness: 100,
        damping: 12
      }
    }
  };

  const floatingVariants = {
    animate: {
      y: [0, -20, 0],
      x: [0, 10, 0],
      rotate: [0, 180, 360],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const glitchVariants = {
    animate: {
      x: [0, -5, 5, -3, 3, 0],
      skew: [0, -2, 2, -1, 1, 0],
      transition: {
        duration: 0.5,
        repeat: Infinity,
        repeatDelay: 3
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 p-4 relative overflow-hidden">
      {/* Background floating elements */}
      {floatingElements.map((element) => (
        <motion.div
          key={element.id}
          className="absolute w-2 h-2 bg-blue-400/20 rounded-full"
          style={{
            left: `${element.x}%`,
            top: `${element.y}%`,
          }}
          variants={floatingVariants}
          animate="animate"
          transition={{
            delay: element.id * 0.5,
            duration: 4 + element.id,
            repeat: Infinity
          }}
        />
      ))}

      {/* Main content */}
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0, rotateY: -15 }}
            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ 
              type: "spring", 
              stiffness: 100,
              damping: 15,
              duration: 0.8
            }}
            className="relative"
          >
            <Card className="w-full max-w-lg mx-4 relative overflow-hidden backdrop-blur-sm bg-white/80 dark:bg-gray-900/80 border-2 border-white/20 shadow-2xl">
              {/* Animated background patterns */}
              <motion.div 
                className="absolute -top-32 -right-32 w-64 h-64 bg-gradient-to-br from-red-400/20 to-pink-400/20 rounded-full"
                animate={{
                  scale: [1, 1.3, 1],
                  rotate: [0, 360],
                  opacity: [0.3, 0.6, 0.3]
                }}
                transition={{
                  duration: 10,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />
              
              <motion.div 
                className="absolute -bottom-16 -left-16 w-32 h-32 bg-gradient-to-tr from-blue-400/20 to-cyan-400/20 rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  rotate: [360, 0],
                  opacity: [0.4, 0.7, 0.4]
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              />

              <CardContent className="pt-8 pb-8 relative z-10">
                <motion.div 
                  className="text-center"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  {/* 404 Number */}
                  <motion.div 
                    className="mb-6"
                    variants={itemVariants}
                  >
                    <motion.h1 
                      className="text-8xl font-black bg-gradient-to-r from-red-500 via-pink-500 to-purple-500 bg-clip-text text-transparent"
                      variants={glitchVariants}
                      animate="animate"
                    >
                      404
                    </motion.h1>
                  </motion.div>

                  {/* Icon */}
                  <motion.div 
                    className="flex justify-center mb-6"
                    variants={itemVariants}
                  >
                    <motion.div
                      animate={{
                        rotate: [0, 10, -10, 5, -5, 0],
                        scale: [1, 1.1, 1, 1.05, 1]
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="relative"
                    >
                      <AlertCircle className="h-16 w-16 text-red-500" />
                      <motion.div
                        className="absolute -top-2 -right-2"
                        animate={{
                          scale: [1, 1.5, 1],
                          opacity: [0.7, 1, 0.7]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity
                        }}
                      >
                        <Sparkles className="h-6 w-6 text-yellow-400" />
                      </motion.div>
                    </motion.div>
                  </motion.div>

                  {/* Title */}
                  <motion.h2 
                    className="text-2xl font-bold text-gray-900 dark:text-white mb-4"
                    variants={itemVariants}
                  >
                    ¡Página No Encontrada!
                  </motion.h2>

                  {/* Description */}
                  <motion.p 
                    className="text-gray-600 dark:text-gray-300 mb-8 max-w-sm mx-auto"
                    variants={itemVariants}
                  >
                    La página que buscas parece haber desaparecido en el espacio digital. 
                    No te preocupes, te ayudamos a volver al camino correcto.
                  </motion.p>

                  {/* Action buttons */}
                  <motion.div
                    className="flex flex-col sm:flex-row gap-4 justify-center"
                    variants={itemVariants}
                  >
                    <Link href="/">
                      <motion.div
                        whileHover={{ scale: 1.05, y: -2 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Button className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-xl shadow-lg">
                          <Home className="h-4 w-4 mr-2" />
                          Ir al Inicio
                        </Button>
                      </motion.div>
                    </Link>

                    <motion.div
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Button 
                        variant="outline" 
                        onClick={() => window.history.back()}
                        className="border-2 px-6 py-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Regresar
                      </Button>
                    </motion.div>
                  </motion.div>

                  {/* Search suggestion */}
                  <motion.div
                    className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800"
                    variants={itemVariants}
                  >
                    <div className="flex items-center justify-center text-blue-700 dark:text-blue-300 text-sm">
                      <Search className="h-4 w-4 mr-2" />
                      ¿Necesitas ayuda? Usa el menú de navegación para encontrar lo que buscas
                    </div>
                  </motion.div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Additional floating sparkles */}
      <motion.div
        className="absolute top-1/4 left-1/4 text-yellow-400"
        animate={{
          y: [0, -30, 0],
          opacity: [0.4, 1, 0.4],
          scale: [1, 1.2, 1]
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          delay: 1
        }}
      >
        <Sparkles className="h-6 w-6" />
      </motion.div>

      <motion.div
        className="absolute bottom-1/3 right-1/4 text-purple-400"
        animate={{
          y: [0, 20, 0],
          opacity: [0.3, 0.8, 0.3],
          rotate: [0, 180, 360]
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          delay: 2
        }}
      >
        <Sparkles className="h-4 w-4" />
      </motion.div>
    </div>
  );
}