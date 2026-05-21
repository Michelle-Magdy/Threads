"use client";

import { Show, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Button } from "../ui/button";
import { Bell, Menu } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

function Navbar() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  const navItems = [
    {
      href: "/chat",
      label: "Chat",
      isActive: pathname === "/chat",
      match: (p?: string | null) => p?.startsWith("chat"),
    },
    {
      href: "/profile",
      label: "Profile",
      isActive: pathname === "/profile",
      match: (p?: string | null) => p?.startsWith("profile"),
    },
  ];

  const renderNavLinks = (item: (typeof navItems)[number]) => {
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={() => setIsMobileMenuOpen(false)}
        className={cn(
          "flex items-center rounded-sm md:rounded-full px-3 py-2 text-sm font-medium transition-colors text-foreground shadow-sm",
          item.isActive
            ? "bg-primary"
            : "md:hover:border-2 md:border-primary hover:bg-primary/30",
        )}
      >
        {item.label}
      </Link>
    );
  };

  return (
    <header
      ref={menuRef}
      className="sticky top-0 z-40 border-b border-sidebar-border bg-sidebar/95 backdrop-blur-sm"
    >
      <div className="mx-auto h-16 max-w-6xl flex items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-bold text-lg text-sidebar-foreground"
          >
            <span className="bg-linear-to-r from-primary to-chart-2 bg-clip-text text-transparent text-xl">
              Threads
            </span>
          </Link>

          <nav className="hidden items-center gap-2 md:flex">
            {navItems.map(renderNavLinks)}
          </nav>
        </div>

        <div className="flex items-center gap-2 md:gap-4">
          <Show when={"signed-in"}>
            <Link href="/notifications">
              <Button
                size="icon"
                className="relative cursor-pointer h-9 w-9 text-muted-foreground hover:bg-card/10 bg-card"
              >
                <Bell className="h-4 w-4" />
                <span className="absolute -right-1 -top-1 inline-flex min-h-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground shadow-sm p-1 shadow-primary/40">
                  {unreadCount}
                </span>
              </Button>
            </Link>
            <UserButton signInUrl="/sign-in" />
          </Show>

          <Show when="signed-out">
            <Link
              href="/sign-in"
              className="flex items-center rounded-full px-3 py-2 text-sm font-medium transition-colors bg-primary text-foreground shadow-sm"
            >
              Sign in
            </Link>
          </Show>

          <Button
            className={cn(
              "md:hidden bg-transparent hover:bg-transparent border-2 cursor-pointer hover:border-primary transition-all duration-300",
              isMobileMenuOpen
                ? "bg-primary hover:bg-primary rotate-90"
                : "hover:bg-primary/30",
            )}
            onClick={() => setIsMobileMenuOpen((prev) => !prev)}
          >
            <Menu />
          </Button>
        </div>
      </div>

      {/* CHANGES HERE:
              - Removed conditional rendering wrapper '{isMobileMenuOpen && ...}'
              - Added transition classes (`transition-all duration-300 ease-in-out`)
              - Used `cn` to toggle height, opacity, and visibility classes dynamically.
            */}
      <div
        className={cn(
          "border-sidebar-border bg-sidebar/90 md:hidden overflow-hidden transition-all duration-300 ease-in-out border-t",
          isMobileMenuOpen
            ? "max-h-40 opacity-100 pointer-events-auto visible"
            : "max-h-0 opacity-0 pointer-events-none invisible border-t-transparent",
        )}
      >
        <nav className="p-4 flex flex-col gap-2">
          {navItems.map(renderNavLinks)}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
