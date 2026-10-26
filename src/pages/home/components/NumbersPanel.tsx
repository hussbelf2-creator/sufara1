import { useTranslation } from 'react-i18next';
import Split from './Split';
import { numbersPanel } from '@/mocks/home';
import { useCms } from '@/hooks/useCms';

interface Stat { count: number; suffix: string; label: string; }

/* The numbers continue the argument the film opened: real volume per order,
   and the share the platform keeps. */
export default function NumbersPanel() {
  const { t } = useTranslation();
  const cms = useCms();
  const stats = t('home.stats', { returnObjects: true }) as unknown as Stat[];

  return (
    <section className="panel" data-side="right" id={numbersPanel.id}>
      <img className="panel-bg" src={numbersPanel.image} alt={t('home.panels.numbers.alt')} data-parallax="0.32" />
      <div className="panel-veil" />
      <div className="panel-copy" data-parallax="-0.08">
        <p className="stamp" data-reveal>{cms.get('home.panels.numbers.stamp', t('home.panels.numbers.stamp'))}</p>
        <h2 data-reveal><Split text={cms.get('home.panels.numbers.title', t('home.panels.numbers.title'))} /></h2>
        <p className="sub" data-reveal>{cms.get('home.panels.numbers.sub', t('home.panels.numbers.sub'))}</p>
        <div className="stats">
          {stats.map((s, i) => (
            <div className="stat card" key={i} data-reveal>
              <div className="num" data-count={s.count} data-suffix={s.suffix}>0</div>
              <div className="lbl">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}