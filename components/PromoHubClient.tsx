"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import styles from "./PromoHub.module.css";

export type PromoHubCard = {
  slug: "botulinotherapy" | "lips" | "biopatid" | "nutrition" | "facial-cleaning" | "ipl-face";
  index: string;
  family: string;
  service: string;
  title: string;
  text: string;
  image: string;
  imageAlt: string;
  tags: string[];
  group: "face" | "skin" | "weight";
};

type Group = "all" | PromoHubCard["group"];
type FinderGroup = Exclude<Group, "all">;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    fbq?: (...args: unknown[]) => void;
  }
}

const TRACKING_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "gclid", "fbclid", "ttclid"] as const;

const FILTERS: Array<{ id: Group; label: string }> = [
  { id: "all", label: "Усі напрямки" },
  { id: "face", label: "Обличчя та риси" },
  { id: "skin", label: "Якість шкіри" },
  { id: "weight", label: "Вага та харчування" },
];

const FINDER_GROUPS: Array<{ id: FinderGroup; number: string; title: string; text: string }> = [
  { id: "face", number: "01", title: "Обличчя та риси", text: "Міміка, зморшки, форма або об’єм губ" },
  { id: "skin", number: "02", title: "Якість шкіри", text: "Почервоніння, пігментація, пори або тьмяність" },
  { id: "weight", number: "03", title: "Вага та харчування", text: "Голод, контроль ваги, режим або зриви" },
];

const FINDER_CONCERNS: Record<FinderGroup, Array<{ label: string; description: string; slug: PromoHubCard["slug"] }>> = {
  face: [
    { label: "Зморшки або надто активна міміка", description: "Лоб, міжбрів’я, зона навколо очей", slug: "botulinotherapy" },
    { label: "Форма, симетрія або об’єм губ", description: "Хочеться гармонійної корекції без перебільшення", slug: "lips" },
  ],
  skin: [
    { label: "Почервоніння, судини або пігментація", description: "Хочеться більш рівного тону шкіри", slug: "ipl-face" },
    { label: "Забиті пори, комедони або тьмяність", description: "Потрібне правильно підібране очищення", slug: "facial-cleaning" },
  ],
  weight: [
    { label: "Постійний голод або складно контролювати вагу", description: "Хочу дізнатися, чи є показання до медичної програми", slug: "biopatid" },
    { label: "Хаотичне харчування, зриви або постійні дієти", description: "Хочу побудувати систему харчування під своє життя", slug: "nutrition" },
  ],
};

function trackHub(event: string, payload: Record<string, unknown> = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...payload });
  if (typeof window.fbq === "function") window.fbq("trackCustom", event, payload);
}

export default function PromoHubClient({ cards }: { cards: PromoHubCard[] }) {
  const [filter, setFilter] = useState<Group>("all");
  const [trackingQuery, setTrackingQuery] = useState("");
  const [finderOpen, setFinderOpen] = useState(false);
  const [finderGroup, setFinderGroup] = useState<FinderGroup | null>(null);
  const [recommendedSlug, setRecommendedSlug] = useState<PromoHubCard["slug"] | null>(null);

  const visibleCards = useMemo(() => filter === "all" ? cards : cards.filter((card) => card.group === filter), [cards, filter]);
  const recommended = useMemo(() => cards.find((card) => card.slug === recommendedSlug) ?? null, [cards, recommendedSlug]);

  useEffect(() => {
    const current = new URLSearchParams(window.location.search);
    const preserved = new URLSearchParams();
    TRACKING_KEYS.forEach((key) => {
      const incoming = current.get(key);
      if (incoming) {
        preserved.set(key, incoming);
        sessionStorage.setItem(`reset_${key}`, incoming);
      } else {
        const stored = sessionStorage.getItem(`reset_${key}`);
        if (stored) preserved.set(key, stored);
      }
    });
    setTrackingQuery(preserved.toString());
    trackHub("promo_hub_view", { promo_surface: "promo_hub" });
  }, []);

  useEffect(() => {
    if (!finderOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeFinder();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [finderOpen]);

  function withTracking(path: string, extra?: Record<string, string>) {
    const params = new URLSearchParams(trackingQuery);
    Object.entries(extra ?? {}).forEach(([key, value]) => params.set(key, value));
    const query = params.toString();
    return query ? `${path}?${query}` : path;
  }

  function selectFilter(next: Group) {
    setFilter(next);
    trackHub("promo_hub_filter", { filter: next });
  }

  function openFinder() {
    setFinderOpen(true);
    setFinderGroup(null);
    setRecommendedSlug(null);
    trackHub("promo_hub_finder_open");
  }

  function closeFinder() {
    setFinderOpen(false);
    setFinderGroup(null);
    setRecommendedSlug(null);
  }

  function chooseFinderGroup(group: FinderGroup) {
    setFinderGroup(group);
    setRecommendedSlug(null);
    trackHub("promo_hub_finder_group", { group });
  }

  function chooseConcern(slug: PromoHubCard["slug"]) {
    setRecommendedSlug(slug);
    trackHub("promo_hub_recommendation", { promo_service: slug, group: finderGroup });
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="RESÉT clinic — головна">
          <Image src="/assets/logo-main.png" alt="RESÉT clinic" width={154} height={47} priority />
        </Link>
        <div className={styles.headerMeta}>
          <span>RESÉT clinic · Львів</span>
          <a href="tel:+380932828888">+380 93 282 88 88</a>
        </div>
        <button type="button" className={styles.headerFinder} onClick={openFinder}>Допоможіть обрати <span>→</span></button>
      </header>

      <section className={styles.hero}>
        <div className={styles.heroGhost} aria-hidden="true">SELECT</div>
        <div className={styles.heroInner}>
          <p className={styles.kicker}>RESÉT · PROCEDURE FINDER · LVIV</p>
          <h1>Що ви хотіли б <em>змінити?</em></h1>
          <p className={styles.heroLead}>Почніть не з назви процедури, а зі свого запиту. Оберіть напрямок — ми покажемо сторінку з результатами, лікарями, цінами та коротким квізом.</p>
          <div className={styles.heroActions}>
            <a href="#promo-directions" className={styles.primary}>Переглянути напрямки <span>↓</span></a>
            <button type="button" className={styles.secondary} onClick={openFinder}>Не знаю, що обрати <span>→</span></button>
          </div>
          <div className={styles.heroSignals}>
            <span>6 напрямків</span><span>Реальні кейси</span><span>Короткі квізи</span><span>Лікарський підхід</span>
          </div>
        </div>
        <div className={styles.heroRail} aria-hidden="true">
          {cards.slice(0, 4).map((card) => (
            <div className={styles.heroThumb} key={card.slug}>
              <Image src={card.image} alt="" fill sizes="180px" style={{ objectFit: "cover" }} />
              <span>{card.index}</span>
            </div>
          ))}
        </div>
      </section>

      <section className={styles.selector} id="promo-directions">
        <div className={styles.selectorIntro}>
          <div>
            <p className={styles.kicker}>ОБЕРІТЬ ЗАПИТ</p>
            <h2>Не каталог процедур.<br />Шість різних сценаріїв результату.</h2>
          </div>
          <p>Фільтр допомагає швидко звузити вибір. Якщо не впевнені — procedure finder поставить два прості запитання й запропонує стартову сторінку.</p>
        </div>

        <div className={styles.filters} aria-label="Фільтр напрямків">
          {FILTERS.map((item) => (
            <button key={item.id} type="button" className={filter === item.id ? styles.filterActive : ""} onClick={() => selectFilter(item.id)}>
              {item.label}
            </button>
          ))}
          <button type="button" className={styles.finderChip} onClick={openFinder}>Не знаю, що обрати <span>↗</span></button>
        </div>

        <div className={styles.cardsGrid}>
          {visibleCards.map((card, position) => (
            <article className={`${styles.card} ${position % 4 === 0 || position % 4 === 3 ? styles.cardWide : styles.cardNarrow}`} key={card.slug}>
              <Link
                href={withTracking(`/promo/${card.slug}/`)}
                className={styles.cardImage}
                onClick={() => trackHub("promo_hub_service_click", { promo_service: card.slug, destination: "landing" })}
                aria-label={`${card.service}: перейти на сторінку`}
              >
                <Image src={card.image} alt={card.imageAlt} fill sizes="(max-width: 760px) 100vw, 55vw" style={{ objectFit: "cover" }} />
                <span className={styles.cardShade} />
                <span className={styles.cardNumber}>{card.index}</span>
                <span className={styles.cardFamily}>{card.family}</span>
                <span className={styles.cardView}>VIEW <b>↗</b></span>
              </Link>
              <div className={styles.cardBody}>
                <div className={styles.cardTags}>{card.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                <p className={styles.cardService}>{card.service}</p>
                <h3>{card.title}</h3>
                <p className={styles.cardText}>{card.text}</p>
                <div className={styles.cardActions}>
                  <Link href={withTracking(`/promo/${card.slug}/`)} onClick={() => trackHub("promo_hub_service_click", { promo_service: card.slug, destination: "landing" })}>Дивитися напрямок <span>→</span></Link>
                  <Link href={withTracking(`/promo/${card.slug}/quiz/`, { source: "promo_hub" })} onClick={() => trackHub("promo_hub_service_click", { promo_service: card.slug, destination: "quiz" })}>3 питання</Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.finderBanner}>
        <div className={styles.finderBannerGhost} aria-hidden="true">?</div>
        <div>
          <p className={styles.kicker}>НЕ ПОТРІБНО ВГАДУВАТИ ПРОЦЕДУРУ</p>
          <h2>Опишіть, що хочете змінити.<br />Ми покажемо, з чого почати.</h2>
        </div>
        <button type="button" onClick={openFinder}>Підібрати напрямок <span>→</span></button>
      </section>

      <footer className={styles.footer}>
        <Link href="/" className={styles.footerBrand}><Image src="/assets/logo-main.png" alt="RESÉT clinic" width={154} height={47} /></Link>
        <div><span>Львів, вул. Кульпарківська, 93/2</span><a href="tel:+380932828888">+380 93 282 88 88</a></div>
        <nav><Link href="/">Головна</Link><Link href="/price/">Ціни</Link><Link href="/doctors/">Лікарі</Link><Link href="/contacts/">Контакти</Link></nav>
      </footer>

      {finderOpen ? (
        <div className={styles.modalRoot} role="dialog" aria-modal="true" aria-labelledby="promo-hub-finder-title">
          <button className={styles.modalBackdrop} type="button" aria-label="Закрити" onClick={closeFinder} />
          <section className={styles.modalPanel}>
            <header className={styles.modalHeader}>
              <div><span>RESÉT PROCEDURE FINDER</span><b>{recommended ? "02 / 02" : finderGroup ? "02 / 02" : "01 / 02"}</b></div>
              <button type="button" onClick={closeFinder} aria-label="Закрити finder">×</button>
            </header>

            {!finderGroup ? (
              <div className={styles.modalStage}>
                <p className={styles.kicker}>ПИТАННЯ 01</p>
                <h2 id="promo-hub-finder-title">Що хочете змінити найбільше?</h2>
                <p className={styles.modalLead}>Оберіть найближчий напрямок. Медичне рішення все одно приймає спеціаліст після оцінки.</p>
                <div className={styles.finderOptions}>
                  {FINDER_GROUPS.map((group) => (
                    <button type="button" key={group.id} onClick={() => chooseFinderGroup(group.id)}>
                      <span>{group.number}</span><div><strong>{group.title}</strong><small>{group.text}</small></div><b>→</b>
                    </button>
                  ))}
                </div>
              </div>
            ) : recommended ? (
              <div className={styles.resultStage}>
                <div className={styles.resultImage}>
                  <Image src={recommended.image} alt={recommended.imageAlt} fill sizes="(max-width: 760px) 100vw, 42vw" style={{ objectFit: "cover" }} />
                  <span>{recommended.index}</span>
                </div>
                <div className={styles.resultCopy}>
                  <p className={styles.kicker}>З ЧОГО ВАРТО ПОЧАТИ</p>
                  <span className={styles.resultService}>{recommended.service}</span>
                  <h2>{recommended.title}</h2>
                  <p>{recommended.text}</p>
                  <div className={styles.resultActions}>
                    <Link href={withTracking(`/promo/${recommended.slug}/`)} onClick={() => trackHub("promo_hub_finder_click", { promo_service: recommended.slug, destination: "landing" })}>Відкрити сторінку <span>→</span></Link>
                    <Link href={withTracking(`/promo/${recommended.slug}/quiz/`, { source: "promo_hub_finder" })} onClick={() => trackHub("promo_hub_finder_click", { promo_service: recommended.slug, destination: "quiz" })}>Одразу пройти 3 питання</Link>
                  </div>
                  <button type="button" className={styles.restart} onClick={() => { setFinderGroup(null); setRecommendedSlug(null); }}>← Обрати інший запит</button>
                </div>
              </div>
            ) : (
              <div className={styles.modalStage}>
                <button type="button" className={styles.modalBack} onClick={() => setFinderGroup(null)}>← Назад</button>
                <p className={styles.kicker}>ПИТАННЯ 02</p>
                <h2 id="promo-hub-finder-title">Що описує ваш запит точніше?</h2>
                <p className={styles.modalLead}>Не потрібно ставити собі діагноз — просто оберіть найближчий варіант.</p>
                <div className={styles.finderOptions}>
                  {FINDER_CONCERNS[finderGroup].map((concern, index) => (
                    <button type="button" key={concern.slug} onClick={() => chooseConcern(concern.slug)}>
                      <span>{String(index + 1).padStart(2, "0")}</span><div><strong>{concern.label}</strong><small>{concern.description}</small></div><b>→</b>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      ) : null}
    </main>
  );
}
