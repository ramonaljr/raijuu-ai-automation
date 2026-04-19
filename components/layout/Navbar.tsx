"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Zap } from "lucide-react";
import { useUser, UserButton } from "@clerk/nextjs";
import { NAV_ITEMS } from "@/lib/constants";
import Link from "next/link";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const { isSignedIn, isLoaded } = useUser();

  const close = useCallback(() => setIsOpen(false), []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Click-outside and Escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        close();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, close]);

  return (
    <header
      ref={headerRef}
      className="fixed top-0 left-0 right-0 z-50 flex justify-center pt-4 px-4"
    >
      <nav
        className={`flex items-center gap-2 rounded-full border px-2 py-2 transition-all duration-300 ${
          scrolled
            ? "border-gray-200/80 bg-white/80 shadow-lg backdrop-blur-xl"
            : "border-white/10 bg-white/5 backdrop-blur-md"
        }`}
      >
        {/* Logo */}
        <Link
          href="/"
          className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
            scrolled ? "bg-gray-100" : "bg-white/10"
          }`}
          aria-label="Raijuu AI Automation home"
        >
          <Zap
            className={`h-5 w-5 ${scrolled ? "text-foreground" : "text-white"}`}
          />
        </Link>

        {/* Menu toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-label="Navigation menu"
          className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
            scrolled
              ? "text-foreground hover:bg-gray-100"
              : "text-white hover:bg-white/10"
          }`}
        >
          {isOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          Menu
        </button>

        {/* Auth entry */}
        {isLoaded && isSignedIn ? (
          <Link
            href="/app"
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              scrolled
                ? "text-foreground hover:bg-gray-100"
                : "text-white hover:bg-white/10"
            }`}
          >
            Portal
          </Link>
        ) : (
          <Link
            href="/sign-in"
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              scrolled
                ? "text-foreground hover:bg-gray-100"
                : "text-white hover:bg-white/10"
            }`}
          >
            Sign in
          </Link>
        )}

        {/* CTA / user */}
        {isLoaded && isSignedIn ? (
          <div
            className={`flex items-center justify-center rounded-full ${
              scrolled ? "bg-gray-100" : "bg-white/10"
            } h-10 w-10`}
          >
            <UserButton />
          </div>
        ) : (
          <Link
            href="/demo"
            className={`rounded-full px-5 py-2 text-sm font-medium transition-all duration-500 active:scale-[0.97] ${
              scrolled
                ? "bg-foreground text-background hover:bg-gray-800"
                : "bg-white text-foreground hover:bg-gray-100"
            }`}
          >
            Work with Us
          </Link>
        )}
      </nav>

      {/* Dropdown menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="menu"
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-20 rounded-2xl border border-white/10 bg-dark-surface/95 p-6 shadow-2xl backdrop-blur-xl"
          >
            <div className="grid grid-cols-2 gap-x-12 gap-y-4">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  role="menuitem"
                  onClick={close}
                  className="text-sm font-medium text-white/80 transition-colors hover:text-white"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
