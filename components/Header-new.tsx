"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Menu, X, LogOut, User, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "./ui/button";

export default function HeaderNew() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isServicesOpen, setIsServicesOpen] = useState(false);
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const handleSignOut = () => {
    logout();
    window.location.href = "/";
  };

  return (
    <header className="w-full bg-white border-b border-dashboard-border/60">
      <div className="mx-auto flex h-header max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center hover:opacity-90">
          <Image
            src="/smipay-logo.png"
            alt="Smipay"
            width={140}
            height={32}
            className="h-7 w-auto sm:h-8"
            priority
          />
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden items-center gap-8 text-sm lg:flex text-brand-text-primary">
          <nav className="flex items-center gap-8">
            <Link href="/" className="hover:text-brand-bg-primary transition-colors">
              Home
            </Link>
            <div className="group relative">
              <button className="flex items-center gap-2 hover:text-brand-bg-primary transition-colors">
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
            <Link href="#" className="hover:text-brand-bg-primary transition-colors">
              About Us
            </Link>
            <Link href="#" className="hover:text-brand-bg-primary transition-colors">
              Support
            </Link>
          </nav>

          {/* Auth Buttons / User Menu */}
          {!isLoading && (
            <>
              {isAuthenticated && user ? (
                <div className="relative group">
                  <button className="flex items-center gap-2 hover:text-brand-bg-primary py-2">
                    <div className="w-8 h-8 rounded-full bg-brand-bg-primary/10 flex items-center justify-center text-brand-bg-primary">
                      <User className="h-4 w-4" />
                    </div>
                    <span className="font-medium">{user.first_name}</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  <div className="invisible absolute right-0 top-full z-20 mt-3 w-48 rounded-md bg-white p-2 text-black opacity-0 shadow-lg transition-all group-hover:visible group-hover:opacity-100">
                    <Link
                      href="/dashboard"
                      className="block rounded px-3 py-2 hover:bg-zinc-100"
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/profile"
                      className="block rounded px-3 py-2 hover:bg-zinc-100"
                    >
                      Profile
                    </Link>
                    <Link
                      href="/settings"
                      className="block rounded px-3 py-2 hover:bg-zinc-100"
                    >
                      Settings
                    </Link>
                    {user.role && user.role !== "user" && (
                      <>
                        <hr className="my-2" />
                        <Link
                          href="/unified-admin/dashboard"
                          className="flex items-center gap-2 rounded px-3 py-2 hover:bg-zinc-100 text-orange-600 font-medium"
                        >
                          <ShieldCheck className="h-4 w-4" />
                          Admin Dashboard
                        </Link>
                      </>
                    )}
                    <hr className="my-2" />
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 w-full rounded px-3 py-2 hover:bg-zinc-100 text-red-600"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Button
                    asChild
                    variant="ghost"
                    className="text-brand-text-primary hover:bg-brand-bg-primary/5"
                  >
                    <Link href="/auth/signin">Sign In</Link>
                  </Button>
                  <Button
                    asChild
                    className="bg-brand-bg-primary text-white hover:bg-brand-bg-primary/90"
                  >
                    <Link href="/auth/register">Register</Link>
                  </Button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center gap-2 lg:hidden">
          {/* Mobile Auth CTAs – always visible on landing for quick access */}
          {!isLoading && (
            <>
              {isAuthenticated && user ? (
                <Button
                  asChild
                  size="sm"
                  className="h-8 px-3 rounded-full bg-brand-bg-primary text-white hover:bg-brand-bg-primary/90 text-xs font-semibold"
                >
                  <Link href="/dashboard">Dashboard</Link>
                </Button>
              ) : (
                <>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 rounded-full text-xs text-brand-text-primary hover:bg-brand-bg-primary/5"
                  >
                    <Link href="/auth/signin">Sign In</Link>
                  </Button>
                  <Button
                    asChild
                    size="sm"
                    className="h-8 px-3 rounded-full bg-brand-bg-primary text-white hover:bg-brand-bg-primary/90 text-xs font-semibold"
                  >
                    <Link href="/auth/register">Register</Link>
                  </Button>
                </>
              )}
            </>
          )}

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile Sidebar Overlay */}
      <div
        className={`fixed inset-0 z-40 lg:hidden transition-opacity duration-300 ${
          isMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50"
          onClick={() => setIsMenuOpen(false)}
        />

        {/* Sidebar Panel */}
        <div
          className={`absolute top-0 right-0 h-full w-3/4 max-w-xs bg-brand-bg-primary text-white shadow-2xl transition-transform duration-300 ease-in-out ${
            isMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Close Button */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <span className="text-lg font-semibold">Menu</span>
            <button
              onClick={() => setIsMenuOpen(false)}
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <nav className="flex flex-col gap-1 px-5 py-5 text-sm overflow-y-auto h-[calc(100%-60px)]">
            {/* Auth Section */}
            {!isLoading && (
              <>
                {isAuthenticated && user ? (
                  <div className="pb-4 mb-2 border-b border-white/10 space-y-1">
                    <div className="flex items-center gap-3 py-3">
                      <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                        <User className="h-4 w-4" />
                      </div>
                      <span className="font-medium">
                        {user.first_name} {user.last_name}
                      </span>
                    </div>
                    <Link
                      href="/dashboard"
                      className="block py-2.5 hover:bg-white/10 rounded-lg px-3 -mx-3"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/profile"
                      className="block py-2.5 hover:bg-white/10 rounded-lg px-3 -mx-3"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Profile
                    </Link>
                    <Link
                      href="/settings"
                      className="block py-2.5 hover:bg-white/10 rounded-lg px-3 -mx-3"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Settings
                    </Link>
                    {user.role && user.role !== "user" && (
                      <Link
                        href="/unified-admin/dashboard"
                        className="flex items-center gap-2 py-2.5 hover:bg-white/10 rounded-lg px-3 -mx-3 text-orange-300 font-medium"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        <ShieldCheck className="h-4 w-4" />
                        Admin Dashboard
                      </Link>
                    )}
                    <button
                      onClick={() => {
                        handleSignOut();
                        setIsMenuOpen(false);
                      }}
                      className="flex items-center gap-2 py-2.5 hover:bg-white/10 rounded-lg px-3 -mx-3 text-red-300 w-full"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="pb-4 mb-2 border-b border-white/10 flex flex-col gap-2">
                    <Button
                      asChild
                      variant="ghost"
                      className="w-full text-white hover:bg-white/10 justify-center"
                    >
                      <Link
                        href="/auth/signin"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Sign In
                      </Link>
                    </Button>
                    <Button
                      asChild
                      className="w-full bg-white text-brand-bg-primary hover:bg-white/90 justify-center"
                    >
                      <Link
                        href="/auth/register"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Register
                      </Link>
                    </Button>
                  </div>
                )}
              </>
            )}

            <Link
              href="/"
              className="block py-2.5 hover:bg-white/10 rounded-lg px-3 -mx-3"
              onClick={() => setIsMenuOpen(false)}
            >
              Home
            </Link>
            <div>
              <button
                className="flex items-center gap-2 hover:bg-white/10 rounded-lg px-3 -mx-3 py-2.5 w-full"
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
                <div className="ml-3 flex flex-col gap-1">
                  <Link
                    href="#"
                    className="block py-2 hover:bg-white/10 rounded-lg px-3"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Airtime & Data
                  </Link>
                  <Link
                    href="#"
                    className="block py-2 hover:bg-white/10 rounded-lg px-3"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Bills Payment
                  </Link>
                </div>
              )}
            </div>
            <Link
              href="#"
              className="block py-2.5 hover:bg-white/10 rounded-lg px-3 -mx-3"
              onClick={() => setIsMenuOpen(false)}
            >
              About Us
            </Link>
            <Link
              href="#"
              className="block py-2.5 hover:bg-white/10 rounded-lg px-3 -mx-3"
              onClick={() => setIsMenuOpen(false)}
            >
              Support
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}

