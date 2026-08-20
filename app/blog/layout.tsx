import Link from "next/link";
import "./blog.css";

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="reset-blog">
      <header className="reset-blog-header">
        <Link className="reset-blog-logo" href="/">RESET Clinic</Link>
        <nav className="reset-blog-nav"><Link href="/services/">Послуги</Link><Link href="/doctors/">Лікарі</Link><Link href="/price/">Прайс</Link><Link href="/contacts/">Контакти</Link></nav>
      </header>
      {children}
      <footer className="reset-blog-footer"><span>RESET Clinic · Львів</span><span>Медична інформація не замінює консультацію лікаря.</span></footer>
    </div>
  );
}
