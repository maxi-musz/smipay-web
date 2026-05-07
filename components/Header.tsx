"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Menu } from "lucide-react";
import { useState } from "react";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);

  return (
    <header className="w-full bg-[#F9FAFB] text-brand-text-primary">
      <div className="mx-auto flex h-header max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2">
          <Image
            src="/smipay-icon.jpg"
            alt="Smipay"
            width={36}
            height={36}
            className="rounded-lg"
            priority
          />
          <span className="text-lg font-bold tracking-tight text-slate-900">
            Smi<span className="text-brand-bg-primary">pay</span>
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-8 text-sm lg:flex">
          <Link href="/" className="hover:opacity-90">
            Home
          </Link>
          <div className="group relative">
            <button className="flex items-center gap-2 hover:opacity-90">
              <span>Services</span>
              <ChevronDown className="h-4 w-4" />
            </button>
            <div className="invisible absolute left-0 top-full z-20 mt-3 w-48 rounded-md bg-white p-2 text-black opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
              <Link
                href="#"
                className="block rounded px-3 py-2 hover:bg-zinc-100"
              >
                Airtime & Data
              </Link>
              <Link
                href="#"
                className="block rounded px-3 py-2 hover:bg-zinc-100"
              >
                Bills Payment
              </Link>
            </div>
          </div>
          <Link href="#" className="hover:opacity-90">
            About Us
          </Link>
          <Link href="#" className="hover:opacity-90">
            Support
          </Link>
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          aria-label="Toggle menu"
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="bg-brand-bg-primary text-white border-t border-white/10 lg:hidden">
          <nav className="mx-auto max-w-7xl px-6 py-6 flex flex-col gap-4 text-sm">
            <Link
              href="/"
              className="hover:opacity-90"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <div>
              <button
                className="flex items-center gap-2 hover:opacity-90 w-full"
                onClick={() => setIsServicesOpen(!isServicesOpen)}
              >
                <span>Services</span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${
                    isServicesOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isServicesOpen && (
                <div className="mt-2 ml-4 flex flex-col gap-2">
                  <Link
                    href="#"
                    className="block py-2 hover:opacity-90"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Airtime & Data
                  </Link>
                  <Link
                    href="#"
                    className="block py-2 hover:opacity-90"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Bills Payment
                  </Link>
                </div>
              )}
            </div>
            <Link
              href="#"
              className="hover:opacity-90"
              onClick={() => setIsMenuOpen(false)}
            >
              About Us
            </Link>
            <Link
              href="#"
              className="hover:opacity-90"
              onClick={() => setIsMenuOpen(false)}
            >
              Support
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
