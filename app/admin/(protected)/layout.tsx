import Link from "next/link";
import { requireAdmin } from "../../../lib/admin-auth";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand">RESET Admin</div>
        <nav className="admin-nav" aria-label="Admin navigation">
          <Link href="/admin/">Dashboard</Link>
          <Link href="/admin/leads/">Заявки</Link>
          <Link href="/admin/seo/">SEO</Link>
          <Link href="/admin/blog/">Блог / CMS</Link>
          <Link href="/admin/integrations/">Інтеграції</Link>
        </nav>
        <div className="admin-sidebar-footer">
          <div>{session.user.email}</div>
          <div>{session.admin.role}</div>
          <form action="/api/admin/logout" method="post">
            <button className="admin-btn secondary" type="submit">Вийти</button>
          </form>
        </div>
      </aside>
      <main className="admin-main">{children}</main>
    </div>
  );
}
