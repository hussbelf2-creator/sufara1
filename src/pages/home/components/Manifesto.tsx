import { useTranslation } from 'react-i18next';

interface Word { t: string; accent: boolean; }

/* The belief panel — no picture, no bullets. Each word lights from --muted to
   --text in reading order as the section scrolls through, and dims again on the
   way back up. */
export default function Manifesto() {
  const { t } = useTranslation();
  const manifestoWords = t('home.manifesto', { returnObjects: true }) as unknown as Word[];

  return (
    <section className="panel manifesto" id="belief">
      <span
        className="panel-accent"
        aria-hidden="true"
        data-parallax="0.55"
        style={{ top: '10%', right: '6%', fontSize: 'clamp(110px, 17vw, 240px)', lineHeight: 1 }}
      >
        Safeer
      </span>
      <p className="manifesto-text" data-words>
        {manifestoWords.map((w, i) => (
          w.accent ? (
            <em className="accent" key={i}>
              <span className="w">{w.t}{' '}</span>
            </em>
          ) : (
            <span className="w" key={i}>{w.t}{' '}</span>
          )
        ))}
      </p>
    </section>
  );
}