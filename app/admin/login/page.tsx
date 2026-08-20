import { redirect } from "next/navigation";
import { getAdminSession } from "../../../lib/admin-auth";

const errors: Record<string, string> = {
  missing_credentials: "Введіть email і пароль.",
  invalid_credentials: "Невірний email або пароль.",
  not_authorized: "Цей акаунт не має доступу до RESET Admin.",
};

type Props = { searchParams: Promise<{ error?: string }> };

export default async function AdminLoginPage({ searchParams }: Props) {
  const existing = await getAdminSession();
  if (existing) redirect("/admin/");

  const params = await searchParams;
  const error = params.error ? errors[params.error] ?? "Не вдалося увійти." : null;

  return (
    <main className="admin-login">
      <section className="admin-login-card">
        <div className="admin-label">Private workspace</div>
        <h1>RESET Admin</h1>
        <p>Ліди, CRM, блог, SEO, Search Console та аналітика в одному місці.</p>
        {error ? <div className="admin-alert bad">{error}</div> : null}
        <form className="admin-form" action="/api/admin/login" method="post">
          <label>
            Email
            <input type="email" name="email" autoComplete="email" required />
          </label>
          <label>
            Пароль
            <input type="password" name="password" autoComplete="current-password" required />
          </label>
          <button className="admin-btn" type="submit">Увійти</button>
        </form>
      </section>
    </main>
  );
}
