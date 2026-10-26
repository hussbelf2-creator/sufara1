import type { ReactNode } from 'react';

/* Headlines carry one or two *accent* words; lines are separated by \n.
   Each line is rendered inside its own clipped box for the title reveal. */
function renderLine(line: string, keyPrefix: string): ReactNode[] {
  return line.split(/(\*[^*]+\*)/g).filter(Boolean).map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em className="accent" key={key}>{part.slice(1, -1)}</em>;
    }
    return <span key={key}>{part}</span>;
  });
}

export default function Split({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, i) => (
        <span className="line" key={`line-${i}`}>
          <span className="line-in">{renderLine(line, `seg-${i}`)}</span>
        </span>
      ))}
    </>
  );
}