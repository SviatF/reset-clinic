import type { SeoLanding } from "./seo-pages";

const PRIORITY_DOCTORS: Partial<Record<string, string[]>> = {
  "/cosmetology/injection/botulinum-therapy/": ["tetiana-hrytsuta", "adriana-sokhan", "khrystyna-milkovych"],
  "/cosmetology/injection/lip-contouring/": ["tetiana-hrytsuta"],
  "/nutrition/medical-weight-loss/": ["tetiana-hrytsuta"],
  "/nutrition/nutritionist-lviv/": ["olha-hrytsuta"],
  "/cosmetology/hardware/aquapure/": ["adriana-sokhan", "khrystyna-milkovych"],
  "/cosmetology/hardware/ipl/": ["tetiana-hrytsuta", "adriana-sokhan", "khrystyna-milkovych"],
};

function appendFaq(landing: SeoLanding, question: string, answer: string): SeoLanding["faq"] {
  if (landing.faq.some((item) => item.question === question)) return landing.faq;
  return [...landing.faq, { question, answer }];
}

function appendRelated(
  landing: SeoLanding,
  title: string,
  items: { label: string; href: string }[],
): SeoLanding["related"] {
  const existingHrefs = new Set(landing.related.flatMap((group) => group.items.map((item) => item.href)));
  const unique = items.filter((item) => !existingHrefs.has(item.href) && item.href !== landing.path);
  return unique.length ? [...landing.related, { title, items: unique }] : landing.related;
}

function normalizeRelatedTitles(landing: SeoLanding): SeoLanding["related"] {
  return landing.related.map((group) => ({
    ...group,
    title: group.title === "Related services" ? "Пов’язані послуги" : group.title,
  }));
}

export function seoDoctorSlugsForLanding(path: string): string[] | null {
  return PRIORITY_DOCTORS[path] ?? null;
}

export function applyPrioritySeoEnhancements(landing: SeoLanding): SeoLanding {
  if (landing.path === "/cosmetology/injection/botulinum-therapy/") {
    return {
      ...landing,
      title: "Ботулінотерапія у Львові — ботокс обличчя | RESET Clinic",
      description: "Ботулінотерапія та ботокс обличчя у Львові в RESET Clinic: лоб, міжбрів’я, зона навколо очей та інші зони за показаннями. Індивідуальні точки й дозування після оцінки лікаря.",
      h1: "Ботулінотерапія (ботокс) у Львові",
      related: appendRelated(landing, "Пов’язані запити", [
        { label: "Зморшки обличчя: причини та методи корекції", href: "/skin-problems/wrinkles/" },
        { label: "Контурна пластика губ", href: "/cosmetology/injection/lip-contouring/" },
      ]),
    };
  }

  if (landing.path === "/cosmetology/injection/lip-contouring/") {
    const next = {
      ...landing,
      title: "Контурна пластика та збільшення губ у Львові | RESET Clinic",
      description: "Збільшення та контурна пластика губ у Львові в RESET Clinic: корекція форми, контуру, симетрії та делікатного об’єму. Індивідуальний план після оцінки лікаря.",
      h1: "Збільшення та контурна пластика губ у Львові",
    };
    return {
      ...next,
      faq: appendFaq(next, "Який об’єм потрібен для збільшення губ?", "Універсального об’єму немає. Лікар оцінює вихідну форму, тканини, попередні корекції та бажаний ступінь змін і лише після цього рекомендує доцільний обсяг."),
      related: appendRelated(next, "Ін’єкційна косметологія", [
        { label: "Ботулінотерапія у Львові", href: "/cosmetology/injection/botulinum-therapy/" },
        { label: "Контурна пластика обличчя", href: "/cosmetology/injection/face-contouring/" },
      ]),
    };
  }

  if (landing.path === "/nutrition/medical-weight-loss/") {
    const next: SeoLanding = {
      ...landing,
      title: "Медичне схуднення та БІОПАТИД у Львові | RESET Clinic",
      description: "Медичне схуднення та програма БІОПАТИД у Львові в RESET Clinic: консультація лікаря, оцінка показань і протипоказань, персональний план та супровід контролю ваги.",
      h1: "Медичне схуднення та програма БІОПАТИД у Львові",
      intro: "Програма БІОПАТИД у RESET Clinic — це медичний маршрут контролю ваги, який починається з консультації лікаря. Спеціаліст оцінює анамнез, динаміку ваги, попередні спроби схуднення, харчову поведінку, показання й протипоказання та лише після цього визначає доцільний формат супроводу.",
      sections: [
        ...landing.sections,
        {
          title: "Коли варто почати з консультації лікаря",
          bullets: [
            "вага повертається після повторних спроб схуднення",
            "складно контролювати голод або розмір порцій",
            "є епізоди переїдання або різкі коливання режиму",
            "потрібен безпечний персональний план замість самостійних схем",
          ],
        },
        {
          title: "Що означає медичний супровід програми БІОПАТИД",
          text: ["Супровід передбачає оцінку доцільності програми, контроль динаміки та переносимості, корекцію рекомендацій щодо харчування й способу життя та визначення наступних кроків спеціалістом. Конкретна тактика залежить від стану здоров’я і не призначається за результатом онлайн-квізу."],
        },
      ],
    };
    return {
      ...next,
      faq: appendFaq(next, "Чи підходить програма БІОПАТИД усім, хто хоче схуднути?", "Ні. Доцільність медичної програми визначає лікар після оцінки стану здоров’я, анамнезу, показань і можливих протипоказань. Для частини людей оптимальним буде інший маршрут контролю ваги."),
      related: appendRelated(next, "Харчування та контроль ваги", [
        { label: "Консультація нутриціолога у Львові", href: "/nutrition/nutritionist-lviv/" },
        { label: "Діагностика дефіцитів", href: "/nutrition/deficiency-diagnostics/" },
      ]),
    };
  }

  if (landing.path === "/nutrition/nutritionist-lviv/") {
    const next = {
      ...landing,
      title: "Нутриціолог у Львові — консультація та план харчування | RESET Clinic",
      description: "Нутриціолог у Львові в RESET Clinic: консультація для харчування, контролю ваги та формування реалістичного раціону без універсальних дієт. Персональні рекомендації й супровід за потреби.",
      h1: "Нутриціолог у Львові: консультація та план харчування",
    };
    return {
      ...next,
      faq: appendFaq(next, "Чи можна звернутися до нутриціолога для схуднення?", "Так, контроль ваги є одним із поширених запитів. Спеціаліст оцінює реальний раціон, режим, харчові звички, активність і медичний контекст та формує персональні рекомендації без універсальної жорсткої дієти."),
      related: appendRelated(next, "Контроль ваги", [
        { label: "Медичне схуднення під контролем лікаря", href: "/nutrition/medical-weight-loss/" },
      ]),
    };
  }

  if (landing.path === "/cosmetology/hardware/aquapure/") {
    const next: SeoLanding = {
      ...landing,
      title: "Чистка обличчя у Львові — AquaPure та комбінована чистка | RESET Clinic",
      description: "Чистка обличчя у Львові в RESET Clinic: AquaPure та комбіноване очищення при комедонах, чорних цятках і забитих порах. Формат процедури підбирають після оцінки шкіри.",
      h1: "Чистка обличчя у Львові: AquaPure та комбінована чистка",
      intro: "Чистка обличчя в RESET Clinic підбирається за станом шкіри, а не лише за назвою процедури. AquaPure може бути доречним для делікатного апаратного очищення й догляду, тоді як комбінована чистка розглядається, коли є комедони та ділянки, що потребують іншого формату очищення. При активному запаленні спочатку може бути потрібна консультація дерматолога.",
      sections: [
        {
          title: "Коли звертаються на чистку обличчя",
          bullets: ["забиті пори та комедони", "чорні цятки", "відчуття забрудненості шкіри", "тьмяність і нерівна поверхня", "потреба у професійно підібраному очищенні"],
        },
        {
          title: "AquaPure чи комбінована чистка — що обрати",
          text: ["AquaPure робить акцент на делікатному апаратному очищенні, ексфоліації та догляді. Комбінований протокол може включати інші етапи очищення там, де це потрібно за станом шкіри. Остаточний формат визначає спеціаліст після огляду."],
        },
        {
          title: "Коли чистка не є першим кроком",
          text: ["Активне акне, виражене подразнення або інший дерматологічний стан не варто маскувати процедурним очищенням. У таких ситуаціях важливо спочатку визначити причину й лікувальну тактику, а доглядові процедури підключати за показаннями."],
        },
      ],
    };
    return {
      ...next,
      faq: appendFaq(next, "Чим AquaPure відрізняється від комбінованої чистки обличчя?", "AquaPure — апаратний формат очищення та догляду. Комбінована чистка може включати додаткові етапи для окремих комедонів і зон. Який протокол доцільний, визначає спеціаліст після оцінки шкіри."),
      related: appendRelated(next, "Пов’язані проблеми та процедури", [
        { label: "Комедони та чорні цятки", href: "/skin-problems/comedones-blackheads/" },
        { label: "Розширені пори", href: "/skin-problems/enlarged-pores/" },
        { label: "IPL обличчя", href: "/cosmetology/hardware/ipl/" },
      ]),
    };
  }

  if (landing.path === "/cosmetology/hardware/ipl/") {
    const next = {
      ...landing,
      title: "IPL обличчя у Львові — пігментація та почервоніння | RESET Clinic",
      description: "IPL обличчя у Львові в RESET Clinic: фототерапія для окремих проявів пігментації, почервоніння, поверхневих судин і нерівного тону після оцінки показань.",
      h1: "IPL обличчя у Львові: пігментація та почервоніння",
      related: normalizeRelatedTitles(landing),
    };
    return {
      ...next,
      faq: appendFaq(next, "Чи підходить IPL при почервонінні та видимих судинах?", "IPL може розглядатися для окремих поверхневих судинних проявів і дифузного почервоніння. Спочатку важливо визначити причину змін, фототип, наявність засмаги та інші фактори, що впливають на показання і безпеку."),
      related: appendRelated(next, "Апаратна косметологія", [
        { label: "Чистка обличчя та AquaPure", href: "/cosmetology/hardware/aquapure/" },
        { label: "Діагностика шкіри", href: "/cosmetology/hardware/skin-diagnostics/" },
      ]),
    };
  }

  return landing;
}
