/* Everything after the chapter: reveal, parallax, manifesto lighting, counters. */

type ListenerOpts = { once?: boolean; passive?: boolean; capture?: boolean };
type Handler = (e: Event) => void;

export function initPanels(): () => void {
  const cleanups: Array<() => void> = [];
  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const on = (
    t: EventTarget,
    ev: string,
    fn: Handler,
    opts?: boolean | ListenerOpts,
  ) => {
    t.addEventListener(ev, fn, opts);
    cleanups.push(() => t.removeEventListener(ev, fn, opts));
  };

  /* --------------------------------------------------- reading progress rail */
  const clamp = (x: number) => Math.min(1, Math.max(0, x));
  const progress = document.createElement('div');
  progress.className = 'scroll-progress';
  progress.setAttribute('aria-hidden', 'true');
  document.body.appendChild(progress);
  const setProgress = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.setProperty('--sp', (max > 0 ? clamp(window.scrollY / max) : 0).toFixed(4));
  };
  cleanups.push(() => progress.remove());

  /* ---------------------------------------------------------- nav state */
  const nav = document.querySelector<HTMLElement>('.site-nav');
  const chapter = document.querySelector<HTMLElement>('.chapter');
  const setNav = () => {
    if (!nav) return;
    const past = window.scrollY > (chapter ? chapter.clientHeight * 0.7 : 200);
    nav.classList.toggle('is-solid', past);
  };

  /* ------------------------------------------------------------- reveal */
  const revealEls = [...document.querySelectorAll<HTMLElement>('[data-reveal]')];
  let revealIo: IntersectionObserver | null = null;
  if (!REDUCED && revealEls.length) {
    revealEls.forEach((el) => {
      const sibs = el.parentElement
        ? ([...el.parentElement.children].filter((c) => c.hasAttribute('data-reveal')) as HTMLElement[])
        : [el];
      el.style.setProperty('--i', String(sibs.indexOf(el)));
    });
    revealIo = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        countUp(e.target as HTMLElement);
        revealIo?.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -12% 0px' });
    revealEls.forEach((el) => revealIo?.observe(el));
    cleanups.push(() => revealIo?.disconnect());
  }

  /* ------------------------------------------------ store header reveal */
  /* Section headers (.st-head) and internal page heroes (.st-hero) reveal
     line by line: the eyebrow, the clipped headline, the copy and the link
     rise in sequence once the block scrolls into view. A MutationObserver
     also catches blocks that mount later (e.g. search results). */
  let headIo: IntersectionObserver | null = null;
  let headMo: MutationObserver | null = null;
  const revealHead = (el: HTMLElement) => {
    if (el.dataset.revealBound === '1') return;
    el.dataset.revealBound = '1';
    headIo?.observe(el);
  };
  const scanHeads = (root: Document | Element) => {
    root.querySelectorAll<HTMLElement>('.st-head, .st-hero').forEach(revealHead);
  };
  if (typeof IntersectionObserver !== 'undefined') {
    headIo = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        (e.target as HTMLElement).classList.add('is-in');
        headIo?.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    scanHeads(document);
    headMo = new MutationObserver((muts) => {
      muts.forEach((m) => {
        m.addedNodes.forEach((n) => {
          if (n.nodeType !== 1) return;
          const el = n as HTMLElement;
          if (el.matches?.('.st-head, .st-hero')) revealHead(el);
          scanHeads(el);
        });
      });
    });
    headMo.observe(document.body, { childList: true, subtree: true });
    cleanups.push(() => {
      headMo?.disconnect();
      headIo?.disconnect();
    });
  }

  /* ------------------------------------------------------------ counters */
  function countUp(scope: HTMLElement) {
    const nodes = scope.hasAttribute('data-count')
      ? [scope]
      : [...scope.querySelectorAll<HTMLElement>('[data-count]')];
    nodes.forEach((n) => {
      const target = parseFloat(n.dataset.count || '0');
      if (!isFinite(target) || n.dataset.done === '1') return;
      n.dataset.done = '1';
      if (REDUCED) {
        n.textContent = `${target}${n.dataset.suffix || ''}`;
        return;
      }
      const dur = 1100;
      const t0 = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = target * eased;
        n.textContent = `${target % 1 === 0 ? Math.round(val) : val.toFixed(1)}${n.dataset.suffix || ''}`;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  /* ------------------------------------------------------------ parallax */
  const layers = [...document.querySelectorAll<HTMLElement>('[data-parallax]')];
  let praf = 0;
  const paint = () => {
    praf = 0;
    const h = window.innerHeight;
    for (const el of layers) {
      const r = el.getBoundingClientRect();
      if (r.bottom < -h || r.top > 2 * h) continue;
      const centre = (r.top + r.height / 2 - h / 2) / h;
      let speed = parseFloat(el.dataset.parallax || '.32');
      if (el.classList.contains('panel-bg') && window.innerWidth < 780) {
        speed = Math.min(speed, 0.22);
      }
      el.style.setProperty('--py', `${(centre * -speed * h).toFixed(1)}px`);
    }
  };

  /* ----------------------------------------------------- resample soften */
  const SOFT = '.stage video, .plate, .panel-bg';
  const soften = (el: HTMLImageElement | HTMLVideoElement) => {
    const nw = (el as HTMLImageElement).naturalWidth || (el as HTMLVideoElement).videoWidth;
    const nh = (el as HTMLImageElement).naturalHeight || (el as HTMLVideoElement).videoHeight;
    if (!nw || !nh) return;
    const r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const factor = Math.max(r.width / nw, r.height / nh);
    const px = factor <= 1.15 ? 0 : Math.min(1.6, Math.max(0.4, (factor - 1) * 1.2));
    el.style.setProperty('--soften', `${px.toFixed(2)}px`);
  };
  const softenAll = () => document.querySelectorAll<HTMLImageElement | HTMLVideoElement>(SOFT)
    .forEach(soften);
  const onLoadCapture = (e: Event) => {
    const t = e.target as HTMLElement;
    if (t.matches && t.matches(SOFT)) soften(t as HTMLImageElement);
  };
  on(document, 'load', onLoadCapture, true);
  on(document, 'loadedmetadata', onLoadCapture, true);
  on(window, 'resize', softenAll);

  /* ----------------------------------------------------------- manifesto */
  const manifestos = [...document.querySelectorAll<HTMLElement>('[data-words]')].map((el) => ({
    section: el.closest('section') || el,
    words: [...el.querySelectorAll<HTMLElement>('.w')],
  }));
  const light = () => {
    if (REDUCED) return;
    const h = window.innerHeight;
    for (const m of manifestos) {
      const r = m.section.getBoundingClientRect();
      if (r.bottom < 0 || r.top > h) continue;
      const p = Math.min(1, Math.max(0, (h * 0.8 - r.top) / (r.height + h * 0.45)));
      const n = m.words.length;
      m.words.forEach((w, i) => {
        w.style.setProperty('--lit', p * (n + 1) > i + 1 ? '1' : '0');
      });
    }
  };

  const frame = () => {
    praf = 0;
    paint();
    light();
  };
  const onScroll = () => {
    setNav();
    setProgress();
    if (!praf) praf = requestAnimationFrame(frame);
  };
  on(window, 'scroll', onScroll, { passive: true });
  on(window, 'resize', () => {
    setNav();
    setProgress();
    if (!praf) praf = requestAnimationFrame(frame);
  });

  setNav();
  setProgress();
  softenAll();
  paint();
  light();
  revealEls.forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.9 && r.bottom > 0) {
      el.classList.add('is-in');
      countUp(el);
    }
  });

  return () => {
    if (praf) cancelAnimationFrame(praf);
    cleanups.forEach((fn) => fn());
  };
}