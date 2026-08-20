"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/admin/", label: "Dashboard", icon: "dashboard" },
  { href: "/admin/leads/", label: "Заявки", icon: "leads" },
  { href: "/admin/seo/", label: "SEO", icon: "seo" },
  { href: "/admin/blog/", label: "Блог / CMS", icon: "blog" },
  { href: "/admin/integrations/", label: "Інтеграції", icon: "integrations" },
] as const;

function NavIcon({ name }: { name: (typeof navItems)[number]["icon"] }) {
  if (name === "dashboard") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>;
  }
  if (name === "leads") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 7h8M8 12h8M8 17h5"/><rect x="3" y="3" width="18" height="18" rx="4"/></svg>;
  }
  if (name === "seo") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6"/><path d="m16 16 4 4M8.5 12.5l2-2 1.7 1.7 3.3-3.7"/></svg>;
  }
  if (name === "blog") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h9l3 3v13H6z"/><path d="M14 4v4h4M9 12h6M9 16h6"/></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 8.5 6 6a3 3 0 0 0-4 4l3 3a3 3 0 0 0 4 0l2-2M15.5 15.5 18 18a3 3 0 0 0 4-4l-3-3a3 3 0 0 0-4 0l-2 2M9 15l6-6"/></svg>;
}

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="admin-nav" aria-label="Admin navigation">
      <div className="admin-nav-label">Workspace</div>
      {navItems.map((item) => {
        const active = item.href === "/admin/"
          ? pathname === "/admin" || pathname === "/admin/"
          : pathname.startsWith(item.href);

        return (
          <Link key={item.href} href={item.href} className={`admin-nav-link${active ? " active" : ""}`}>
            <span className="admin-nav-icon"><NavIcon name={item.icon} /></span>
            <span className="admin-nav-text">{item.label}</span>
            <span className="admin-nav-indicator" aria-hidden="true" />
          </Link>
        );
      })}
    </nav>
  );
}
