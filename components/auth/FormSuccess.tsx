"use client";

import { CheckCircle } from "lucide-react";
import { motion } from "motion/react";

interface FormSuccessProps {
  message?: string;
}

export function FormSuccess({ message }: FormSuccessProps) {
  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="flex items-center gap-2 p-3 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl"
    >
      <CheckCircle className="h-4 w-4 flex-shrink-0 text-emerald-600" />
      <p>{message}</p>
    </motion.div>
  );
}
