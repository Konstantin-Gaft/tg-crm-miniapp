// Чистые хелперы Guru для мини-апа (воронка топ-10, 26.10.2026).
// Файл подключается обычным <script> и из vitest: без export, всё лежит в globalThis.GuruLib.
(function () {
  const KIND_LABELS = {
    support_template: 'Шаблон саппорта',
    what_offer: 'Что за оффер',
    has_provider: 'Уже есть провайдер',
    price: 'Цена',
    email_given: 'Дал почту',
    refusal: 'Отказ',
    other: 'Другое',
  };
  const TEMPLATE_ORDER = ['monitor', 'who', 'fact'];

  /** Возраст ожидания: «<1 ч», «3 ч», «2 д». Часы приходят с бэкенда целыми. */
  function ageText(h) {
    if (h == null || !Number.isFinite(Number(h))) return '—';
    const n = Number(h);
    if (n < 1) return '<1 ч';
    if (n < 24) return `${Math.round(n)} ч`;
    return `${Math.floor(n / 24)} д`;
  }

  /** Бейдж типа входящего: {label, kind} или null, если типа нет. */
  function replyKindBadge(kind) {
    if (!kind) return null;
    return { kind, label: KIND_LABELS[kind] || String(kind) };
  }

  /** До трёх готовых фраз Кости из карточки (элементы — {id,text} или строки). */
  function quickPhrases(a, max = 3) {
    const out = [];
    for (const q of (a && a.quick_replies) || []) {
      const t = (typeof q === 'string' ? q : (q && q.text) || '').trim();
      if (t) out.push(t);
      if (out.length >= max) break;
    }
    return out;
  }

  /** «Черновик LLM» нужен, когда бэкенд оставил поле пустым (quick_only) или фраз и текста нет. */
  function needsLlmButton(a) {
    if (!a) return false;
    if (a.quick_only) return true;
    return quickPhrases(a).length === 0 && !(a.draft_text || '').trim();
  }

  /** Строка шапки: «Шаблоны 30 дн: monitor 23% · who 18% · fact —». */
  function templatesLine(rows) {
    if (!Array.isArray(rows)) return 'Шаблоны 30 дн: —';
    const by = new Map(rows.map(r => [r.template, r]));
    const parts = TEMPLATE_ORDER.map(t => {
      const r = by.get(t);
      return `${t} ${r && r.rate != null ? Math.round(r.rate * 100) + '%' : '—'}`;
    });
    return `Шаблоны 30 дн: ${parts.join(' · ')}`;
  }

  /** Строка шапки: «Уроки стиля: N, дд.мм». */
  function lessonsLine(l) {
    const n = l && Array.isArray(l.rules) ? l.rules.length : 0;
    if (!n) return 'Уроки стиля: —';
    const m = String((l && l.updated_at) || '').match(/^\d{4}-(\d\d)-(\d\d)/);
    return `Уроки стиля: ${n}${m ? `, ${m[2]}.${m[1]}` : ''}`;
  }

  /** Интервалы цепочки: от 1 до 4 неотрицательных целых, пустые и мусор отбрасываем, пусто → [3]. */
  function normalizeTouchDelays(values) {
    const out = [];
    for (const v of values || []) {
      const n = parseInt(v, 10);
      if (Number.isFinite(n) && n >= 0) out.push(n);
      if (out.length >= 4) break;
    }
    return out.length ? out : [3];
  }

  /** Язык по тексту: кириллица → ru, иначе en. */
  function guessLang(text) {
    return /[а-яё]/i.test(text || '') ? 'ru' : 'en';
  }

  /** Фраза типа kind на языке lang; нет языка → en → любая; нет типа → ''. */
  function pickQuickText(items, kind, lang) {
    const rows = (items || []).filter(r => r.kind === kind && (r.text || '').trim());
    const hit = rows.find(r => r.lang === lang) || rows.find(r => r.lang === 'en') || rows[0];
    return hit ? hit.text : '';
  }

  globalThis.GuruLib = { ageText, replyKindBadge, quickPhrases, needsLlmButton, templatesLine,
    lessonsLine, normalizeTouchDelays, guessLang, pickQuickText };
})();
