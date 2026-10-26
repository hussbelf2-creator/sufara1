/* Chapter driver — the copy is choreographed by the film's own playhead. */

type Beat = {
  el: HTMLElement;
  from: number;
  to: number;
  parts: HTMLElement[];
  lines: HTMLElement[];
  chips: HTMLElement[];
};

type Chapter = {
  el: HTMLElement;
  stage: HTMLElement;
  beats: Beat[];
  src: string;
  dur: number;
  video: HTMLVideoElement | null;
  playing: boolean;
  held: boolean;
  wait: boolean;
  clock: number;
  armed: boolean;
  destroyed: boolean;
};

const FADE = 0.13;
const STAGGER = 0.06;
const NEAR = '200px';
const FAR = '260%';

type ListenerOpts = { once?: boolean; passive?: boolean; capture?: boolean };
type Handler = (e: Event) => void;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => 1 - Math.pow(1 - x, 3);

export function initFilm(): () => void {
  const cleanups: Array<() => void> = [];
  const on = (
    t: EventTarget,
    ev: string,
    fn: Handler,
    opts?: boolean | ListenerOpts,
  ) => {
    t.addEventListener(ev, fn, opts);
    cleanups.push(() => t.removeEventListener(ev, fn, opts));
  };

  const chapterEls = [...document.querySelectorAll<HTMLElement>('.chapter')];
  if (!chapterEls.length) return () => {};

  const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const FINE = matchMedia('(pointer: fine)').matches;

  if (REDUCED) {
    chapterEls.forEach((el) => el.classList.add('is-static'));
    return () => chapterEls.forEach((el) => el.classList.remove('is-static'));
  }

  const chapters: Chapter[] = chapterEls.map((el) => {
    const beats: Beat[] = [...el.querySelectorAll<HTMLElement>('.beat')].map((b) => ({
      el: b,
      from: parseFloat(b.dataset.from || '0') || 0,
      to: b.dataset.to ? parseFloat(b.dataset.to) : 1,
      parts: ([...b.children].filter(
        (c) => !c.classList.contains('chips'),
      ) as HTMLElement[]),
      lines: [...b.querySelectorAll<HTMLElement>('.line-in')],
      chips: [...b.querySelectorAll<HTMLElement>('.chips li')],
    }));
    return {
      el,
      stage: el.querySelector<HTMLElement>('.stage') as HTMLElement,
      beats,
      src: el.dataset.video || '',
      dur: parseFloat(el.dataset.duration || '') || beats.length * 5,
      video: null,
      playing: false,
      held: false,
      wait: !!el.dataset.video,
      clock: 0,
      armed: false,
      destroyed: false,
    };
  });

  // Start the film the moment its poster has landed — never on window load.
  const plateImg = document.querySelector<HTMLImageElement>('.chapter .plate');
  const afterLCP = new Promise<void>((res) => {
    if (!plateImg || plateImg.complete) {
      res();
      return;
    }
    let done = false;
    const fin = () => {
      if (done) return;
      done = true;
      res();
    };
    plateImg.addEventListener('load', fin, { once: true });
    plateImg.addEventListener('error', fin, { once: true });
    setTimeout(fin, 800);
  });

  function posterOf(c: Chapter): string {
    const plate = c.stage.querySelector<HTMLImageElement>('.plate');
    if (plate && plate.getAttribute('src')) return plate.getAttribute('src') as string;
    return c.el.dataset.poster || '';
  }

  function start(c: Chapter) {
    const v = c.video;
    if (!v || c.destroyed) return;
    const p = v.play();
    if (!p || !p.then) {
      c.playing = true;
      return;
    }
    p.then(() => {
      if (c.destroyed) return;
      c.playing = true;
      if (c.wait) {
        c.wait = false;
      } else if (
        isFinite(v.duration)
        && v.duration > 0
        && Math.abs(c.clock * v.duration - v.currentTime) > 1.5
      ) {
        v.currentTime = c.clock * v.duration;
      }
      if (c.held) v.pause();
    }).catch(() => {
      c.playing = false;
      c.wait = false;
      if (c.armed || c.destroyed) return;
      c.armed = true;
      const retry = () => start(c);
      on(window, 'pointerdown', retry, { once: true, passive: true });
      on(window, 'touchstart', retry, { once: true, passive: true });
    });
  }

  async function attach(c: Chapter | undefined) {
    if (!c || c.video || c.destroyed) return;
    await afterLCP;
    if (c.video || c.destroyed || !c.el.isConnected) return;
    const v = document.createElement('video');
    v.muted = true;
    v.playsInline = true;
    v.loop = true;
    v.preload = 'auto';
    v.disablePictureInPicture = true;
    v.tabIndex = -1;
    v.setAttribute('aria-hidden', 'true');
    const poster = posterOf(c);
    if (poster) v.poster = poster;
    /* The admin can swap the hero film at any time; read the element's data
       attribute again here so a freshly published video is the one attached. */
    const src = c.el.dataset.video || c.src;
    if (!src) return;
    c.src = src;
    v.src = src;
    const waitTimer = window.setTimeout(() => {
      c.wait = false;
    }, 5000);
    cleanups.push(() => clearTimeout(waitTimer));
    v.addEventListener('loadedmetadata', () => {
      if (isFinite(v.duration) && v.duration > 0) c.dur = v.duration;
    }, { once: true });
    v.addEventListener('loadeddata', () => c.stage.classList.add('is-live'), { once: true });
    c.stage.insertBefore(v, c.stage.querySelector('.veil'));
    c.video = v;
    start(c);
  }

  function detach(c: Chapter | undefined) {
    if (!c || !c.video) return;
    c.stage.classList.remove('is-live');
    c.playing = false;
    c.video.pause();
    c.video.removeAttribute('src');
    c.video.load();
    c.video.remove();
    c.video = null;
  }

  const find = (t: Element) => chapters.find((c) => c.el === t);
  const near = new IntersectionObserver(
    (es) => es.forEach((e) => {
      if (e.isIntersecting) attach(find(e.target));
    }),
    { rootMargin: NEAR },
  );
  const far = new IntersectionObserver(
    (es) => es.forEach((e) => {
      if (!e.isIntersecting) detach(find(e.target));
    }),
    { rootMargin: FAR },
  );
  chapters.forEach((c) => {
    near.observe(c.el);
    far.observe(c.el);
  });
  cleanups.push(() => {
    near.disconnect();
    far.disconnect();
  });

  function playhead(c: Chapter, dt: number) {
    const v = c.video;
    if (c.playing && v && isFinite(v.duration) && v.duration > 0) {
      c.clock = clamp01(v.currentTime / v.duration);
      return c.clock;
    }
    if (!c.held && !c.wait) c.clock = (c.clock + dt / Math.max(1, c.dur)) % 1;
    return c.clock;
  }

  function setState(el: HTMLElement, o: number, leaving: boolean) {
    el.style.setProperty('--o', o.toFixed(3));
    el.style.setProperty('--o-inv', (1 - o).toFixed(3));
    el.style.setProperty('--dir', leaving ? '1' : '-1');
  }

  function drive(el: HTMLElement, local: number, i: number, n: number) {
    const tIn = clamp01((local - i * STAGGER) / FADE);
    const tOut = clamp01((1 - local - (n - 1 - i) * STAGGER) / FADE);
    setState(el, ease(Math.min(tIn, tOut)), tOut < 1);
  }

  function applyBeats(c: Chapter, p: number) {
    c.beats.forEach((b) => {
      const span = b.to - b.from;
      const local = span > 0 ? (p - b.from) / span : 0;
      const inside = local >= 0 && local < 1;
      b.el.style.setProperty('--local', clamp01(local).toFixed(3));
      if (!inside) {
        [...b.parts, ...b.lines, ...b.chips].forEach((el) => setState(el, 0, local > 1));
      } else {
        b.parts.forEach((el, i) => drive(el, local, i, b.parts.length));
        b.lines.forEach((el, i) => drive(el, local, i * 0.8, b.lines.length * 0.8));
        b.chips.forEach((el, i) => drive(el, local, 2 + i, 2 + b.chips.length));
      }
      b.el.classList.toggle('is-on', inside);
      b.el.classList.toggle('is-leaving', inside && 1 - local < FADE + STAGGER * 4);
    });
  }

  function hold(c: Chapter, isOn: boolean) {
    if (c.held === isOn) return;
    c.held = isOn;
    const v = c.video;
    if (!v || !c.playing) return;
    if (isOn) v.pause();
    else v.play().catch(() => {});
  }

  if (FINE) {
    chapters.forEach((c) => {
      const over = (e: Event) => {
        if ((e.target as Element).closest?.('.beat')) hold(c, true);
      };
      const out = (e: Event) => {
        const rel = (e as PointerEvent).relatedTarget as Element | null;
        if (!rel || !rel.closest?.('.beat')) hold(c, false);
      };
      c.stage.addEventListener('pointerover', over);
      c.stage.addEventListener('pointerout', out);
      cleanups.push(() => {
        c.stage.removeEventListener('pointerover', over);
        c.stage.removeEventListener('pointerout', out);
      });
    });
  }

  function setExit(c: Chapter) {
    const top = c.el.getBoundingClientRect().top;
    c.el.style.setProperty('--exit', clamp01(-top / Math.max(1, window.innerHeight)).toFixed(3));
  }

  const root = document.documentElement;
  const cueOff = () => root.style.setProperty('--cue', '0');
  on(window, 'scroll', cueOff, { once: true, passive: true });

  let raf = 0;
  let prev = 0;
  const inView = new Set<Element>();
  const run = new IntersectionObserver((es) => {
    es.forEach((e) => {
      if (e.isIntersecting) inView.add(e.target);
      else {
        inView.delete(e.target);
        const c = find(e.target);
        if (c) setExit(c);
      }
    });
    if (inView.size && !raf) {
      prev = 0;
      raf = requestAnimationFrame(tick);
    }
    if (!inView.size && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  });
  chapters.forEach((c) => run.observe(c.el));
  cleanups.push(() => run.disconnect());

  function tick(now: number) {
    const dt = prev ? Math.min(0.1, (now - prev) / 1000) : 0;
    prev = now;
    for (const c of chapters) {
      if (c.destroyed) continue;
      /* The admin may publish a new hero film while the page is open — swap it
         in as soon as the element carries a different source. */
      const liveSrc = c.el.dataset.video;
      if (c.video && liveSrc && liveSrc !== c.src) {
        c.src = liveSrc;
        c.video.src = liveSrc;
        c.video.load();
        start(c);
      }
      setExit(c);
      applyBeats(c, playhead(c, dt));
    }
    raf = requestAnimationFrame(tick);
  }

  // Pointer parallax — the front planes follow the cursor. Mouse only.
  if (FINE) {
    const MLERP = 0.08;
    let tx = 0;
    let ty = 0;
    let mx = 0;
    let my = 0;
    let mraf = 0;
    const settle = () => {
      mx += (tx - mx) * MLERP;
      my += (ty - my) * MLERP;
      root.style.setProperty('--mx', mx.toFixed(3));
      root.style.setProperty('--my', my.toFixed(3));
      mraf = Math.abs(tx - mx) + Math.abs(ty - my) > 0.002 ? requestAnimationFrame(settle) : 0;
    };
    const aim = (x: number, y: number) => {
      tx = x;
      ty = y;
      if (!mraf) mraf = requestAnimationFrame(settle);
    };
    const move = (e: PointerEvent) => aim(
      (e.clientX / window.innerWidth) * 2 - 1,
      (e.clientY / window.innerHeight) * 2 - 1,
    );
    const leave = () => aim(0, 0);
    on(window, 'pointermove', move, { passive: true });
    on(document, 'mouseleave', leave);
    cleanups.push(() => {
      if (mraf) cancelAnimationFrame(mraf);
      root.style.removeProperty('--mx');
      root.style.removeProperty('--my');
    });
  }

  return () => {
    if (raf) cancelAnimationFrame(raf);
    chapters.forEach((c) => {
      c.destroyed = true;
      detach(c);
    });
    cleanups.forEach((fn) => fn());
  };
}