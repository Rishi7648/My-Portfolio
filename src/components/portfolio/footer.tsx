"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Instagram, Facebook, Mail, Phone, MapPin } from "lucide-react";

const EMAIL = "rishi.silwal19@gmail.com";
const PHONE_DISPLAY = "+977 9823167724";
const PHONE_TEL = "9779823167724";

export function Footer() {
  return (
    <footer className="relative mt-auto border-t border-border/60">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <p className="font-display text-2xl font-bold text-foreground sm:text-3xl">
          Rishi Silwal
        </p>

        {/* Bumped 3-col breakpoint from sm (640px) to md (768px).
            At 640-767px the "rhs.meh@gmail.com" text in the Contact column
            (text-lg font-bold) is wider than the ~1/3 column share, and flex/grid
            children don't shrink below their content's intrinsic width by default
            — so the column overflowed and squeezed the layout. md: gives enough
            room before switching to 3 columns. min-w-0 on each column is a second
            safety net so long content can never force overflow again. */}
        <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 md:gap-10">
          {/* Location */}
          <div className="min-w-0">
            <p className="text-base font-bold uppercase tracking-wider text-foreground">
              Location
            </p>
            <p className="mt-4 inline-flex min-w-0 items-center gap-1.5 text-base font-bold text-foreground sm:text-lg">
              <MapPin className="h-5 w-5 shrink-0 text-muted-foreground" />
              Kathmandu, Nepal
            </p>
          </div>

          {/* Socials */}
          <div className="min-w-0">
            <p className="text-base font-bold uppercase tracking-wider text-foreground">
              Socials
            </p>
            <ul className="mt-4 space-y-2">
              <li className="cursor-pointer">
                <a href="https://www.instagram.com/hem.shr/" target="_blank" rel="noopener noreferrer" className="group inline-flex cursor-pointer items-center gap-1.5 text-lg font-bold text-foreground transition-colors hover:text-primary">
                  <Instagram className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                  Instagram
                </a>
              </li>
              <li className="cursor-pointer">
                <a href="https://www.facebook.com/hem.shr1" target="_blank" rel="noopener noreferrer" className="group inline-flex cursor-pointer items-center gap-1.5 text-lg font-bold text-foreground transition-colors hover:text-primary">
                  <Facebook className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                  Facebook
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div className="min-w-0">
            <p className="text-base font-bold uppercase tracking-wider text-foreground">
              Contact
            </p>
            <ul className="mt-4 space-y-2">
              <li className="cursor-pointer">
                <a href={`https://mail.google.com/mail/?view=cm&fs=1&to=${EMAIL}`} target="_blank" rel="noopener noreferrer" className="group inline-flex min-w-0 cursor-pointer items-center gap-1.5 break-all text-base font-bold text-foreground transition-colors hover:text-primary sm:text-lg sm:break-words">
                  <Mail className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                  {EMAIL}
                </a>
              </li>
              <li className="cursor-pointer">
                <a href={`https://wa.me/${PHONE_TEL}`} target="_blank" rel="noopener noreferrer" className="group inline-flex min-w-0 cursor-pointer items-center gap-1.5 break-words text-base font-bold text-foreground transition-colors hover:text-primary sm:text-lg">
                  <Phone className="h-5 w-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" />
                  {PHONE_DISPLAY}
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 sm:mt-14">
          <p className="text-xs text-muted-foreground">
            © 2026 Rishi Silwal. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
