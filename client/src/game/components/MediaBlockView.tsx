import { useEffect, useRef, useState } from 'react';
import type { MediaBlock } from 'shared';
import styles from './MediaBlockView.module.css';
import { mediaUrl } from '../../lib/packsApi';
import { registerActiveMediaToggle } from '../mediaHotkey';

interface MediaBlockViewProps {
  packId: string;
  block: MediaBlock;
}

function PlaybackButtons({ playing, onToggle, onReplay }: { playing: boolean; onToggle: () => void; onReplay: () => void }) {
  return (
    <div className={styles.controls}>
      <button type="button" className={styles.controlButton} onClick={onToggle} aria-label={playing ? 'Пауза' : 'Відтворити'}>
        {playing ? '⏸' : '▶'}
      </button>
      <button type="button" className={styles.controlButton} onClick={onReplay} aria-label="Повторити">
        ⟲
      </button>
    </div>
  );
}

function AudioBlockView({ src }: { src: string }) {
  const ref = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(
    () =>
      registerActiveMediaToggle(() => {
        const el = ref.current;
        if (!el) return;
        if (el.paused) void el.play();
        else el.pause();
      }),
    [],
  );

  return (
    <div className={styles.player}>
      <audio
        ref={ref}
        src={src}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
      <PlaybackButtons
        playing={playing}
        onToggle={() => (ref.current?.paused ? ref.current.play() : ref.current?.pause())}
        onReplay={() => {
          if (!ref.current) return;
          ref.current.currentTime = 0;
          void ref.current.play();
        }}
      />
    </div>
  );
}

function VideoBlockView({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  useEffect(
    () =>
      registerActiveMediaToggle(() => {
        const el = ref.current;
        if (!el) return;
        if (el.paused) void el.play();
        else el.pause();
      }),
    [],
  );

  return (
    <div className={styles.player}>
      <video
        ref={ref}
        className={styles.videoEl}
        src={src}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />
      <PlaybackButtons
        playing={playing}
        onToggle={() => (ref.current?.paused ? ref.current.play() : ref.current?.pause())}
        onReplay={() => {
          if (!ref.current) return;
          ref.current.currentTime = 0;
          void ref.current.play();
        }}
      />
    </div>
  );
}

export function MediaBlockView({ packId, block }: MediaBlockViewProps) {
  if (block.type === 'text') {
    return <p className={styles.text}>{block.text}</p>;
  }

  const src = mediaUrl(packId, block.file);

  if (block.type === 'image') {
    return (
      <div className={styles.imageWrap}>
        <img className={styles.image} src={src} alt={block.caption ?? ''} />
        {block.caption && <span className={styles.caption}>{block.caption}</span>}
      </div>
    );
  }

  return (
    <div className={styles.imageWrap}>
      {block.type === 'audio' ? <AudioBlockView src={src} /> : <VideoBlockView src={src} />}
      {block.caption && <span className={styles.caption}>{block.caption}</span>}
    </div>
  );
}
