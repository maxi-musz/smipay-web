"use client";

import { AlertCircle } from "lucide-react";
import { motion } from "motion/react";

interface FormErrorProps {
  message?: string;
}

export function FormError({ message }: FormErrorProps) {
  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex items-center gap-2 p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-xl"
    >
      <AlertCircle className="h-4 w-4 flex-shrink-0 text-red-600" />
      <p>{message}</p>
    </motion.div>
  );
}
