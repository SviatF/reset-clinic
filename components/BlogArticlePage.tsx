import Link from "next/link";
import { blogPostPath, getPublishedPostsByCategory, type PublicBlogPost } from "../lib/blog";
import { blogCategoryPath, getBlogCategory, type BlogCategorySlug } from "../lib/blog-categories";
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
    { label: "Акне: problem page", href: "/skin-problems/acne/" },
    { label: "Лікування акне", href: "/dermatology/acne-treatment/" },
    { label: "LED-терапія", href: "/cosmetology/hardware/led-therapy/" },
  ],
  rosacea: [
    { label: "Розацеа: problem page", href: "/skin-problems/rosacea/" },
    { label: "Лікування розацеа", href: "/dermatology/rosacea-treatment/" },
    { label: "IPL-терапія", href: "/cosmetology/hardware/ipl/" },
  ],
  pigmentation: [
    { label: "Пігментація: problem page", href: "/skin-problems/pigmentation/" },
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

export function buildBlogArticleJsonLd(post: PublicBlogPost) {
  const category = getBlogCategory(post.category);
  const url = `${SITE_URL}${blogPostPath(post)}`;
  const sources = normalizeSources(post.sources || []);
  const faq = normalizeFaq(post.faq || []);
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

  if (faq.length) {
    graph.push({
      "@type": "FAQPage",
      "@id": `${url}#faq`,
      mainEntity: faq.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: { "@type": "Answer", text: item.answer },
      })),
    });
  }

  return { "@context": "https://schema.org", "@graph": graph };
}

export default async function BlogArticlePage({ post }: { post: PublicBlogPost }) {
  const category = getBlogCategory(post.category);
  const schema = buildBlogArticleJsonLd(post);
  const paragraphs = post.body.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  const sources = normalizeSources(post.sources || []);
  const faq = normalizeFaq(post.faq || []);
  const relatedLinks = category ? RELATED_BY_CATEGORY[category.slug] : [];
  const relatedPosts = category
    ? (await getPublishedPostsByCategory(category.slug, 20))
        .filter((item) => item.id !== post.id && item.indexable)
        .slice(0, 3)
    : [];

  return (
    <div className="seo-site">
      <PublicSiteHeader />
      <main className="reset-blog-article">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd(schema) }} />
        <nav className="reset-blog-eyebrow" aria-label="Breadcrumb">
          <Link href="/blog/">Блог</Link>
          {category ? <><span> · </span><Link href={blogCategoryPath(category.slug)}>{category.name}</Link></> : null}
        </nav>
        <h1>{post.title}</h1>
        {post.excerpt ? <p className="intro">{post.excerpt}</p> : null}

        <div className="reset-blog-author">
          <strong>{post.author_name || SITE_NAME}</strong>
          {post.reviewer_name ? <><br /><span>Медичний рецензент: {post.reviewer_name}{post.reviewer_title ? ` · ${post.reviewer_title}` : ""}</span></> : <><br /><span>Медична редакція: RESET Clinic</span></>}
          {post.published_at ? <><br /><span className="reset-blog-meta">Опубліковано: {new Date(post.published_at).toLocaleDateString("uk-UA")}</span></> : null}
          <br /><span className="reset-blog-meta">Оновлено: {new Date(post.updated_at).toLocaleDateString("uk-UA")}</span>
        </div>

        <article className="reset-blog-copy">
          {paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)}
        </article>

        {relatedLinks.length ? (
          <section className="reset-blog-supporting">
            <p className="reset-blog-eyebrow">Пов’язані медичні сторінки</p>
            <h2>Куди перейти далі</h2>
            <div className="reset-blog-link-grid">
              {relatedLinks.map((item) => <Link href={item.href} key={item.href}>{item.label}<span>↗</span></Link>)}
            </div>
          </section>
        ) : null}

        <section className="reset-blog-supporting">
          <p className="reset-blog-eyebrow">Коли звернутися</p>
          <h2>Стаття не замінює консультацію</h2>
          <p>Якщо симптоми зберігаються, прогресують, повторюються або викликають значний дискомфорт, варто звернутися до профільного спеціаліста. Діагноз і персональні призначення не формуються лише за інформацією зі статті.</p>
        </section>

        {sources.length ? (
          <section className="reset-blog-supporting">
            <p className="reset-blog-eyebrow">Джерела</p>
            <h2>References</h2>
            <ul className="reset-blog-sources">
              {sources.map((source, index) => <li key={`${source.label}-${index}`}>{source.href ? <a href={source.href} target="_blank" rel="noreferrer">{source.label}</a> : source.label}</li>)}
            </ul>
          </section>
        ) : null}

        {faq.length ? (
          <section className="reset-blog-supporting">
            <p className="reset-blog-eyebrow">FAQ</p>
            <h2>Часті запитання</h2>
            <div className="reset-blog-faq">
              {faq.map((item) => <details key={item.question}><summary>{item.question}</summary><p>{item.answer}</p></details>)}
            </div>
          </section>
        ) : null}

        {relatedPosts.length ? (
          <section className="reset-blog-supporting">
            <p className="reset-blog-eyebrow">Related articles</p>
            <h2>Читайте також</h2>
            <div className="reset-blog-link-grid">
              {relatedPosts.map((item) => <Link href={blogPostPath(item)} key={item.id}>{item.title}<span>↗</span></Link>)}
            </div>
          </section>
        ) : null}

        <section className="reset-blog-article-cta">
          <div><p className="reset-blog-eyebrow">RESET Clinic · Львів</p><h2>Потрібна персональна оцінка?</h2><p>Запишіться на консультацію, якщо потрібен діагноз, план лікування або підбір процедури.</p></div>
          <Link href="/booking/">Записатися →</Link>
        </section>
      </main>
      <PublicSiteFooter />
    </div>
  );
}
