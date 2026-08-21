import Link from "next/link";
import { blogPostPath, getPublishedPostsByCategory, type PublicBlogPost } from "../lib/blog";
import { blogCategoryPath, getBlogCategory, type BlogCategorySlug } from "../lib/blog-categories";
import { getSeoContentPlanItem } from "../lib/seo-content-plan";
import { isSeoLandingIndexable } from "../lib/seo-compliance";
import { resolveSeoLanding } from "../lib/seo-page-resolver";
import { DEFAULT_OG_IMAGE, SITE_NAME, SITE_URL, jsonLd } from "../lib/seo";
import { PublicSiteFooter, PublicSiteHeader } from "./PublicSiteChrome";

type RelatedLink = { label: string; href: string };
type NormalizedSource = { label: string; href?: string };
type NormalizedFaq = { question: string; answer: string };

const RELATED_BY_CATEGORY: Record<BlogCategorySlug, RelatedLink[]> = {
  dermatology: [
    { label: "Дерматологія", href: "/dermatology/" },
    { label: "Консультація дерматолога", href: "/dermatology/dermatologist-lviv/" },
    { label: "Дерматоскопія", href: "/dermatology/dermoscopy/" },
  ],
  acne: [
    { label: "Що варто знати про акне", href: "/skin-problems/acne/" },
    { label: "Лікування акне", href: "/dermatology/acne-treatment/" },
    { label: "LED-терапія", href: "/cosmetology/hardware/led-therapy/" },
  ],
  rosacea: [
    { label: "Що варто знати про розацеа", href: "/skin-problems/rosacea/" },
    { label: "Лікування розацеа", href: "/dermatology/rosacea-treatment/" },
    { label: "IPL-терапія", href: "/cosmetology/hardware/ipl/" },
  ],
  pigmentation: [
    { label: "Що варто знати про пігментацію", href: "/skin-problems/pigmentation/" },
    { label: "Лікування пігментації", href: "/dermatology/pigmentation-treatment/" },
    { label: "IPL-терапія", href: "/cosmetology/hardware/ipl/" },
  ],
  cosmetology: [
    { label: "Косметологія", href: "/cosmetology/" },
    { label: "Ін’єкційна косметологія", href: "/cosmetology/injection/" },
    { label: "Апаратна косметологія", href: "/cosmetology/hardware/" },
  ],
  "skin-care": [
    { label: "Догляд за шкірою", href: "/skin-care/" },
    { label: "Діагностика шкіри", href: "/cosmetology/hardware/skin-diagnostics/" },
    { label: "Консультація дерматолога", href: "/dermatology/dermatologist-lviv/" },
  ],
  nutrition: [
    { label: "Нутриціологія", href: "/nutrition/" },
    { label: "Консультація нутриціолога", href: "/nutrition/nutritionist-lviv/" },
    { label: "Діагностика дефіцитів", href: "/nutrition/deficiency-diagnostics/" },
  ],
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function normalizeSources(input: unknown[]): NormalizedSource[] {
  return input.flatMap((item) => {
    if (typeof item === "string") {
      return [{ label: item, ...(item.startsWith("http") ? { href: item } : {}) }];
    }
    const record = asRecord(item);
    if (!record) return [];
    const href = typeof record.url === "string" ? record.url : typeof record.href === "string" ? record.href : undefined;
    const label =
      (typeof record.title === "string" && record.title) ||
      (typeof record.name === "string" && record.name) ||
      (typeof record.label === "string" && record.label) ||
      href;
    return label ? [{ label, ...(href ? { href } : {}) }] : [];
  });
}

function normalizeFaq(input: unknown[]): NormalizedFaq[] {
  return input.flatMap((item) => {
    const record = asRecord(item);
    if (!record) return [];
    const question =
      (typeof record.question === "string" && record.question) ||
      (typeof record.name === "string" && record.name);
    const answer =
      (typeof record.answer === "string" && record.answer) ||
      (typeof record.text === "string" && record.text);
    return question && answer ? [{ question, answer }] : [];
  });
}

function uniqueRelatedLinks(items: RelatedLink[]) {
  return Array.from(new Map(items.map((item) => [item.href, item])).values());
}

function canPromoteMedicalLink(item: RelatedLink) {
  const landing = resolveSeoLanding(item.href);
  return !landing || isSeoLandingIndexable(landing);
}

export function buildBlogArticleJsonLd(post: PublicBlogPost) {
  const category = getBlogCategory(post.category);
  const url = `${SITE_URL}${blogPostPath(post)}`;
  const sources = normalizeSources(post.sources || []);
  const articleType = post.schema_type === "Article" || post.schema_type === "BlogPosting"
    ? post.schema_type
    : "BlogPosting";
  const breadcrumbItems = [
    { "@type": "ListItem", position: 1, name: "Головна", item: `${SITE_URL}/` },
    { "@type": "ListItem", position: 2, name: "Блог", item: `${SITE_URL}/blog/` },
    ...(category
      ? [{ "@type": "ListItem", position: 3, name: category.name, item: `${SITE_URL}${blogCategoryPath(category.slug)}` }]
      : []),
    { "@type": "ListItem", position: category ? 4 : 3, name: post.title, item: url },
  ];

  const graph: Record<string, unknown>[] = [
    {
      "@type": articleType,
      "@id": `${url}#article`,
      url,
      mainEntityOfPage: url,
      headline: post.title,
      description: post.seo_description || post.excerpt || undefined,
      datePublished: post.published_at || undefined,
      dateModified: post.updated_at,
      inLanguage: "uk-UA",
      author: post.author_name ? { "@type": "Person", name: post.author_name } : { "@type": "Organization", name: SITE_NAME },
      reviewedBy: post.reviewer_name ? { "@type": "Person", name: post.reviewer_name, jobTitle: post.reviewer_title || undefined } : { "@id": `${SITE_URL}/#clinic` },
      publisher: { "@id": `${SITE_URL}/#clinic` },
      image: post.og_image || `${SITE_URL}${DEFAULT_OG_IMAGE}`,
      about: post.target_keyword || undefined,
      articleSection: category?.name,
      citation: sources.flatMap((source) => source.href ? [source.href] : []),
      breadcrumb: { "@id": `${url}#breadcrumb` },
    },
    {
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: breadcrumbItems,
    },
  ];

  return { "@context": "https://schema.org", "@graph": graph };
}

export default async function BlogArticlePage({ post }: { post: PublicBlogPost }) {
  const category = getBlogCategory(post.category);
  const planItem = getSeoContentPlanItem(post.slug);
  const schema = buildBlogArticleJsonLd(post);
  const paragraphs = post.body.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  const sources = normalizeSources(post.sources || []);
  const faq = normalizeFaq(post.faq || []);
  const relatedLinks = (planItem
    ? uniqueRelatedLinks([planItem.moneyPage, ...planItem.supportingPages])
    : category
      ? RELATED_BY_CATEGORY[category.slug]
      : []).filter(canPromoteMedicalLink);
  const relatedPosts = category
    ? (await getPublishedPostsByCategory(category.slug, 20))
        .filter((item) => item.id !== post.id && item.indexable)
        .slice(0, 3)
    : [];
  const heroImage = post.og_image || DEFAULT_OG_IMAGE;

  return (
    <div className="seo-site reset-blog-page reset-blog-article-page">
      <PublicSiteHeader />
      <main>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />

        <section className="reset-blog-article-hero">
          <div className="reset-blog-shell">
            <nav className="reset-blog-breadcrumbs" aria-label="Breadcrumb">
              <Link href="/blog/">Блог</Link>
              {category ? <><span>/</span><Link href={blogCategoryPath(category.slug)}>{category.name}</Link></> : null}
            </nav>
            <div className="reset-blog-article-hero-grid">
              <div className="reset-blog-article-hero-copy">
                <p className="reset-blog-eyebrow">{category?.name || "Редакція RESET Clinic"}</p>
                <h1>{post.title}</h1>
                {post.excerpt ? <p className="reset-blog-article-intro">{post.excerpt}</p> : null}
                <div className="reset-blog-article-meta-line">
                  <span>{post.author_name || SITE_NAME}</span>
                  {post.published_at ? <span>{new Date(post.published_at).toLocaleDateString("uk-UA")}</span> : null}
                  <span>Оновлено {new Date(post.updated_at).toLocaleDateString("uk-UA")}</span>
                </div>
              </div>
              <figure className="reset-blog-article-visual">
                <img src={heroImage} alt={post.title} decoding="async" />
                <figcaption><span>RESET Clinic · Editorial</span><strong>Медична інформація без зайвого шуму</strong></figcaption>
              </figure>
            </div>
          </div>
        </section>

        <section className="reset-blog-article-body">
          <div className="reset-blog-shell reset-blog-article-layout">
            <aside className="reset-blog-article-rail">
              <div className="reset-blog-rail-block">
                <p className="reset-blog-eyebrow">Автор</p>
                <strong>{post.author_name || SITE_NAME}</strong>
              </div>
              <div className="reset-blog-rail-block">
                <p className="reset-blog-eyebrow">Медична перевірка</p>
                <strong>{post.reviewer_name || "Редакція RESET Clinic"}</strong>
                {post.reviewer_title ? <span>{post.reviewer_title}</span> : null}
              </div>
              {category ? (
                <div className="reset-blog-rail-block reset-blog-rail-link">
                  <p className="reset-blog-eyebrow">Тема</p>
                  <Link href={blogCategoryPath(category.slug)}>{category.name} <span>↗</span></Link>
                </div>
              ) : null}
            </aside>

            <div className="reset-blog-article-content">
              <article className="reset-blog-copy">
                {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
              </article>

              {relatedLinks.length ? (
                <section className="reset-blog-supporting reset-blog-supporting-dark">
                  <p className="reset-blog-eyebrow">Профільні сторінки RESET</p>
                  <h2>Де продовжити</h2>
                  <div className="reset-blog-link-grid">
                    {relatedLinks.map((item) => <Link href={item.href} key={item.href}>{item.label}<span>↗</span></Link>)}
                  </div>
                </section>
              ) : null}

              <section className="reset-blog-supporting reset-blog-medical-note">
                <p className="reset-blog-eyebrow">Важливо</p>
                <h2>Стаття не замінює консультацію</h2>
                <p>Якщо симптоми зберігаються, прогресують, повторюються або викликають значний дискомфорт, варто звернутися до профільного спеціаліста. Діагноз і персональні призначення не формуються лише за інформацією зі статті.</p>
              </section>

              {sources.length ? (
                <section className="reset-blog-supporting">
                  <p className="reset-blog-eyebrow">Джерела</p>
                  <h2>Використані матеріали</h2>
                  <ul className="reset-blog-sources">
                    {sources.map((source, index) => <li key={`${source.label}-${index}`}>{source.href ? <a href={source.href} target="_blank" rel="noopener noreferrer">{source.label}</a> : source.label}</li>)}
                  </ul>
                </section>
              ) : null}

              {faq.length ? (
                <section className="reset-blog-supporting">
                  <p className="reset-blog-eyebrow">Запитання та відповіді</p>
                  <h2>Часті запитання</h2>
                  <div className="reset-blog-faq">
                    {faq.map((item) => <details key={item.question}><summary>{item.question}<span>+</span></summary><p>{item.answer}</p></details>)}
                  </div>
                </section>
              ) : null}

              {relatedPosts.length ? (
                <section className="reset-blog-supporting">
                  <p className="reset-blog-eyebrow">За темою</p>
                  <h2>Читайте також</h2>
                  <div className="reset-blog-link-grid">
                    {relatedPosts.map((item) => <Link href={blogPostPath(item)} key={item.id}>{item.title}<span>↗</span></Link>)}
                  </div>
                </section>
              ) : null}

              <section className="reset-blog-article-cta">
                <div><p className="reset-blog-eyebrow">RESET Clinic · Львів</p><h2>Потрібна персональна оцінка?</h2><p>Запишіться на консультацію, якщо потрібен діагноз, план лікування або підбір процедури.</p></div>
                <Link href="/booking/">Записатися <span>↗</span></Link>
              </section>
            </div>
          </div>
        </section>
      </main>
      <PublicSiteFooter />
    </div>
  );
}
