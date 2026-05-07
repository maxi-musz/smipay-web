"use client";

import { ReactNode } from "react";
import Image from "next/image";
import { motion } from "motion/react";

interface AuthCardProps {
  children: ReactNode;
  title: string;
  description?: string;
}

export function AuthCard({ children, title, description }: AuthCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="w-full max-w-md mx-auto"
    >
      <div className="auth-card">
        <div className="mb-6 sm:mb-8 text-center">
          <div className="flex justify-center mb-4">
            <Image
              src="/smipay-logo.png"
              alt="SmiPay — Pay with a smile"
              width={200}
              height={80}
              className="w-full max-w-[180px] h-auto"
              priority
            />
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-slate-800 tracking-tight mb-1.5">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-slate-500">{description}</p>
          )}
        </div>
        {children}
      </div>
    </motion.div>
  );
}
