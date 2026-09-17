import { requireAdmin } from "../../../../lib/admin-auth";
import { DOCTORS, doctorPath } from "../../../../lib/doctors";
import { auditDoctorEeat, doctorEeat } from "../../../../lib/doctor-eeat";

export default async function AdminDoctorsEeatPage() {
  await requireAdmin();
  const audits = DOCTORS.map(auditDoctorEeat);
  const verifiedCore = audits.filter((item) => item.verifiedFields.length >= 6).length;
  const credentialsComplete = audits.filter((item) => item.missingCredentialFields.length === 0).length;
  const relatedPages = audits.reduce((sum, item) => sum + item.relatedPageCount, 0);

  return (
    <>
      <header className="admin-topbar">
        <div>
          <h1>Doctor E-E-A-T</h1>
          <div className="admin-subtitle">Публічні профілі лікарів, підтверджені напрямки, schema entity graph та контроль відсутніх credentials.</div>
        </div>
      </header>

      <section className="admin-grid">
        <div className="admin-card"><div className="admin-label">Профілі</div><div className="admin-metric">{DOCTORS.length}</div><div className="admin-kpi-note">Усі indexable та мають canonical</div></div>
        <div className="admin-card"><div className="admin-label">Published expertise</div><div className="admin-metric">{verifiedCore}/{DOCTORS.length}</div><div className="admin-kpi-note">ПІБ + роль + bio + фото + topics + related pages</div></div>
        <div className="admin-card"><div className="admin-label">Credentials complete</div><div className="admin-metric">{credentialsComplete}/{DOCTORS.length}</div><div className="admin-kpi-note">Освіта + сертифікати + стаж + графік</div></div>
        <div className="admin-card"><div className="admin-label">Entity links</div><div className="admin-metric">{relatedPages}</div><div className="admin-kpi-note">Звʼязків doctor → SEO landing</div></div>
      </section>

      <div className="admin-alert admin-section">
        Правило YMYL: не додавати освіту, сертифікат, стаж або статус medical reviewer без фактичного підтвердження RESET Clinic. Conversion doctor та medical reviewer — різні сутності. Після підтвердження credentials вони автоматично можуть бути відображені в профілі та structured data.
      </div>

      <section className="admin-section">
        <div className="admin-section-header"><h2>Профілі лікарів</h2><span>{credentialsComplete} повністю заповнених credentials</span></div>
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Лікар</th><th>Published expertise</th><th>SEO/entity coverage</th><th>Чого бракує</th><th>Профіль</th></tr></thead>
            <tbody>
              {audits.map((audit) => {
                const eeat = doctorEeat(audit.doctor);
                return (
                  <tr key={audit.doctor.slug}>
                    <td><strong>{audit.doctor.name}</strong><br /><span className="admin-kpi-note">{audit.doctor.role}</span></td>
                    <td>{eeat.expertise.map((item) => <div key={item}>{item}</div>)}</td>
                    <td><strong>{audit.relatedPageCount}</strong> related URLs<br /><span className="admin-kpi-note">{audit.expertiseCount} expertise topics · Person schema</span></td>
                    <td>
                      {audit.missingCredentialFields.length
                        ? audit.missingCredentialFields.map((item) => <div key={item}><span className="admin-badge warn">{item}</span></div>)
                        : <span className="admin-badge good">Complete</span>}
                    </td>
                    <td><a className="admin-code" href={doctorPath(audit.doctor)} target="_blank" rel="noreferrer">Відкрити →</a></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-section">
        <div className="admin-section-header"><h2>Що потрібно зібрати у клініки</h2><span>тільки підтверджені дані</span></div>
        <div className="admin-grid">
          <div className="admin-card"><div className="admin-label">01 · Освіта</div><div className="admin-kpi-note">ВНЗ, спеціальність, роки навчання або інша формально підтверджена освіта.</div></div>
          <div className="admin-card"><div className="admin-label">02 · Credentials</div><div className="admin-kpi-note">Сертифікати, курси, підвищення кваліфікації — з точною назвою та, за можливості, роком.</div></div>
          <div className="admin-card"><div className="admin-label">03 · Досвід</div><div className="admin-kpi-note">Підтверджений стаж або конкретний опис професійного досвіду без маркетингових перебільшень.</div></div>
          <div className="admin-card"><div className="admin-label">04 · Review ownership</div><div className="admin-kpi-note">Які конкретні медичні сторінки лікар реально перевірив — тільки після цього додаємо Person reviewedBy.</div></div>
        </div>
      </section>
    </>
  );
}
