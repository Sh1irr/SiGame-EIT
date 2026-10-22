type MascotMood = 'neutral' | 'question';

interface MascotProps {
  mood?: MascotMood;
  className?: string;
  'aria-hidden'?: boolean;
}

const MOOD_SRC: Record<MascotMood, string> = {
  neutral: '/brand/cat.png',
  // Cat holding a "?" block — shown while a question is open, not yet answered.
  question: '/brand/cat-happy.png',
};

export function Mascot({ mood = 'neutral', className, ...rest }: MascotProps) {
  return <img src={MOOD_SRC[mood]} alt="" draggable={false} className={className} {...rest} />;
}
