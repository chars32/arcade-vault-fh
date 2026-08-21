"use client";

// ===== components/nav.tsx — barra de navegación =====
// Portado de references/templates/nav.jsx

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/lib/session";

export function Nav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useSession();

  const isActive = (name: "inicio" | "biblioteca" | "salon" | "acerca" | "auth") => {
    if (name === "inicio") return pathname === "/";
    if (name === "biblioteca") return pathname === "/biblioteca" || pathname.startsWith("/juegos");
    if (name === "salon") return pathname === "/salon-de-la-fama";
    if (name === "acerca") return pathname === "/acerca-de";
    return pathname === "/auth";
  };

  const go = (href: string) => {
    setOpen(false);
    router.push(href);
  };

  return (
    <>
      <nav className="av-nav">
        <div className="logo" onClick={() => go("/")}>
          <div className="logo-mark" />
          <div className="logo-text neon-cyan">
            ARCADE <span className="neon-magenta">VAULT</span>
          </div>
        </div>
        <div className="links">
          <Link href="/" className={isActive("inicio") ? "active" : ""}>
            Inicio
          </Link>
          <Link href="/biblioteca" className={isActive("biblioteca") ? "active" : ""}>
            Biblioteca
          </Link>
          <Link href="/salon-de-la-fama" className={isActive("salon") ? "active" : ""}>
            Salón de la Fama
          </Link>
          <Link href="/acerca-de" className={isActive("acerca") ? "active" : ""}>
            Acerca de
          </Link>
        </div>
        <div className="spacer" />
        <div className="coin-counter">
          <span className="coin" />
          <span>CRÉDITOS · 03</span>
        </div>
        {user ? (
          <button className="btn ghost auth-btn" onClick={logout}>
            {user.name} ▾
          </button>
        ) : (
          <button className="btn auth-btn" onClick={() => go("/auth")}>
            Iniciar Sesión
          </button>
        )}
        <button
          className="btn ghost hamburger"
          onClick={() => setOpen(true)}
          aria-label="Menú"
        >
          ≡
        </button>
      </nav>

      <div
        className={"av-mobile-backdrop" + (open ? " open" : "")}
        onClick={() => setOpen(false)}
      />
      <aside className={"av-mobile-panel" + (open ? " open" : "")}>
        <div className="pixel neon-cyan" style={{ fontSize: 11, marginBottom: 16 }}>
          MENÚ
        </div>
        <a className={isActive("inicio") ? "active" : ""} onClick={() => go("/")}>
          Inicio
        </a>
        <a className={isActive("biblioteca") ? "active" : ""} onClick={() => go("/biblioteca")}>
          Biblioteca
        </a>
        <a
          className={isActive("salon") ? "active" : ""}
          onClick={() => go("/salon-de-la-fama")}
        >
          Salón de la Fama
        </a>
        <a className={isActive("acerca") ? "active" : ""} onClick={() => go("/acerca-de")}>
          Acerca de
        </a>
        <a className={isActive("auth") ? "active" : ""} onClick={() => go("/auth")}>
          {user ? "Cuenta" : "Iniciar Sesión"}
        </a>
        <div style={{ flex: 1 }} />
        <div
          className="pixel"
          style={{ fontSize: 9, color: "var(--ink-faint)", letterSpacing: "0.16em" }}
        >
          CRÉDITOS · 03
        </div>
      </aside>
    </>
  );
}
