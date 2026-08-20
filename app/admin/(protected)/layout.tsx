import { requireAdmin } from "../../../lib/admin-auth";
import AdminNav from "../AdminNav";

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdmin();
  const initial = session.user.username?.trim().charAt(0).toUpperCase() || "A";

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-sidebar-inner">
          <div className="admin-brand-zone">
            <div className="admin-brand-mark" aria-hidden="true">R</div>
            <div>
              <div className="admin-brand-name">RESET</div>
              <div className="admin-brand-meta">Clinic Control</div>
            </div>
          </div>

          <div className="admin-environment">
            <span className="admin-environment-dot" />
            Production workspace
          </div>

          <AdminNav />

          <div className="admin-sidebar-footer">
            <div className="admin-account-card">
              <div className="admin-avatar">{initial}</div>
              <div className="admin-account-copy">
                <strong>{session.user.username}</strong>
                <span>{session.admin.role}</span>
              </div>
              <form action="/api/admin/logout" method="post">
                <button className="admin-logout" type="submit" aria-label="Вийти" title="Вийти">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 5H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4M14 8l4 4-4 4M18 12H9" /></svg>
                </button>
              </form>
            </div>
            <div className="admin-sidebar-caption">RESET Clinic · Internal system</div>
          </div>
        </div>
      </aside>

      <div className="admin-content-shell">
        <div className="admin-content-glow" aria-hidden="true" />
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
