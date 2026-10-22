import { useLayoutEffect, useRef, useState } from 'react';
import type { Pack } from 'shared';
import { mediaUrl } from '../../lib/packsApi';
import { useTheme } from '../../hooks/useTheme';
import { GameScreen } from '../components/GameScreen';
import styles from './PackIntroScreen.module.css';

interface PackIntroScreenProps {
  pack: Pack;
  onStart: () => void;
}

const ARC_WIDTH = 1000;
const ARC_PAD = 4;

// Font size shrinks for longer titles so they still fit along the arc.
function arcFontSize(title: string): number {
  return Math.max(24, Math.min(46, 900 / Math.max(title.length, 1)));
}

export function PackIntroScreen({ pack, onStart }: PackIntroScreenProps) {
  const { theme } = useTheme();
  const fontSize = arcFontSize(pack.title);
  // The light theme's background is pale, so the yellow wordmark loses
  // contrast there — fall back to the dark-text version instead.
  const defaultLogo = theme === 'light' ? '/brand/logo-black.png' : '/brand/logo.png';

  const textRef = useRef<SVGTextElement>(null);
  const [viewBox, setViewBox] = useState(`0 0 ${ARC_WIDTH} 156`);

  // Crop the viewBox vertically to the rendered text so the arc doesn't
  // carry empty space above/below it. Width stays fixed to keep the scale.
  useLayoutEffect(() => {
    let cancelled = false;
    const fit = () => {
      const el = textRef.current;
      if (!el || cancelled) return;
      const box = el.getBBox();
      setViewBox(`0 ${box.y - ARC_PAD} ${ARC_WIDTH} ${box.height + ARC_PAD * 2}`);
    };
    fit();
    // Re-measure once the web font is loaded — glyph metrics change.
    document.fonts?.ready.then(fit);
    return () => {
      cancelled = true;
    };
  }, [pack.title, fontSize]);

  return (
      <GameScreen>
        <div className={styles.titleGroup}>
          <div className={styles.arcWrap}>
            <svg className={styles.arcSvg} viewBox={viewBox}>
              <path id="title-arc" d="M 200 140 A 300 80 0 0 1 800 140" fill="none" />
              <text ref={textRef} fontSize={fontSize} textAnchor="middle">
                <textPath href="#title-arc" startOffset="50%">
                  {pack.title}
                </textPath>
              </text>
            </svg>
          </div>

          <p className={styles.subtitle}>{pack.subtitle}</p>

          <img className={styles.logo} src={pack.logo ? mediaUrl(pack.id, pack.logo) : defaultLogo} alt="" />
        </div>

        <button type="button" className={styles.startButton} onClick={onStart}>
          Почати
        </button>
      </GameScreen>
  );
}