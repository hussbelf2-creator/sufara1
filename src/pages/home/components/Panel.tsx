import type { ReactNode } from 'react';
import Split from './Split';

type PanelProps = {
  id?: string;
  side: 'left' | 'right' | 'bottom';
  image: string;
  alt: string;
  stamp: string;
  title: string;
  sub: string;
  points?: string[];
  children?: ReactNode;
};

/* A full-screen picture panel: the photograph slides slower than the page while
   the copy rides over it slightly ahead of the scroll. */
export default function Panel({
  id, side, image, alt, stamp, title, sub, points, children,
}: PanelProps) {
  return (
    <section className="panel" data-side={side} id={id}>
      <img className="panel-bg" src={image} alt={alt} data-parallax="0.32" />
      <div className="panel-veil" />
      <div className="panel-copy" data-parallax="-0.08">
        <p className="stamp" data-reveal>{stamp}</p>
        <h2 data-reveal><Split text={title} /></h2>
        <p className="sub" data-reveal>{sub}</p>
        {points && points.length > 0 && (
          <ul className="points">
            {points.map((p, i) => (
              <li key={i} data-reveal>{p}</li>
            ))}
          </ul>
        )}
        {children}
      </div>
    </section>
  );
}