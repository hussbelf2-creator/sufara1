import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Nav from './components/Nav';
import Chapter from './components/Chapter';
import StoreSections from './components/StoreSections';
import Manifesto from './components/Manifesto';
import Panel from './components/Panel';
import NumbersPanel from './components/NumbersPanel';
import JoinPanel from './components/JoinPanel';
import Faq from './components/Faq';
import Footer from './components/Footer';
import { initFilm } from './lib/film';
import { initPanels } from './lib/panels';
import { useCms } from '@/hooks/useCms';
import {
  ambassadorsPanel, logisticsPanel, storyPanel,
} from '@/mocks/home';
import './film.css';

export default function Home() {
  const { t } = useTranslation();
  const cms = useCms();

  useEffect(() => {
    const stopFilm = initFilm();
    const stopPanels = initPanels();
    return () => {
      stopFilm();
      stopPanels();
    };
  }, []);

  return (
    <div id="top">
      <Nav />
      <main>
        <Chapter />
        <StoreSections />
        <Manifesto />
        <Panel
          id={storyPanel.id}
          side="left"
          image={storyPanel.image}
          alt={t('home.panels.story.alt')}
          stamp={cms.get('home.panels.story.stamp', t('home.panels.story.stamp'))}
          title={cms.get('home.panels.story.title', t('home.panels.story.title'))}
          sub={cms.get('home.panels.story.sub', t('home.panels.story.sub'))}
          points={t('home.panels.story.points', { returnObjects: true }) as unknown as string[]}
        />
        <Panel
          id={ambassadorsPanel.id}
          side="right"
          image={ambassadorsPanel.image}
          alt={t('home.panels.ambassadors.alt')}
          stamp={cms.get('home.panels.ambassadors.stamp', t('home.panels.ambassadors.stamp'))}
          title={cms.get('home.panels.ambassadors.title', t('home.panels.ambassadors.title'))}
          sub={cms.get('home.panels.ambassadors.sub', t('home.panels.ambassadors.sub'))}
          points={t('home.panels.ambassadors.points', { returnObjects: true }) as unknown as string[]}
        />
        <Panel
          id={logisticsPanel.id}
          side="left"
          image={logisticsPanel.image}
          alt={t('home.panels.logistics.alt')}
          stamp={cms.get('home.panels.logistics.stamp', t('home.panels.logistics.stamp'))}
          title={cms.get('home.panels.logistics.title', t('home.panels.logistics.title'))}
          sub={cms.get('home.panels.logistics.sub', t('home.panels.logistics.sub'))}
          points={t('home.panels.logistics.points', { returnObjects: true }) as unknown as string[]}
        />
        <NumbersPanel />
        <JoinPanel />
        <Faq />
      </main>
      <Footer />
    </div>
  );
}