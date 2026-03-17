import type { User, Availability } from '../../types';

interface AvatarProps {
  user: User;
  availability?: Availability;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isOddOneOut?: boolean;
  hasNotResponded?: boolean;
}

const sizePx: Record<string, number> = {
  xs: 24, sm: 32, md: 44, lg: 56, xl: 80,
};

const textSize: Record<string, string> = {
  xs: 'text-[0.625rem]',
  sm: 'text-[0.75rem]',
  md: 'text-[1rem]',
  lg: 'text-[1.25rem]',
  xl: 'text-[1.75rem]',
};

export function Avatar({ user, availability, size = 'md', isOddOneOut, hasNotResponded }: AvatarProps) {
  const px = sizePx[size];
  const initial = user.name.charAt(0).toUpperCase();

  // Ring colour
  const ringStyle =
    availability === 'yes'
      ? { boxShadow: '0 0 0 2.5px #FFFFFF, 0 0 0 5px #4CAF50' }
      : availability === 'maybe'
      ? { boxShadow: '0 0 0 2.5px #FFFFFF, 0 0 0 5px #FF9800', opacity: 0.85 }
      : availability === 'no'
      ? { filter: 'grayscale(1)', opacity: 0.55 }
      : hasNotResponded
      ? { filter: 'grayscale(0.6)', opacity: 0.5 }
      : {};

  return (
    <div className="relative inline-flex flex-col items-center">
      {isOddOneOut && (
        <span
          className="absolute -top-5 left-1/2 -translate-x-1/2 text-sm"
          aria-label="Couldn't make the confirmed date"
          title="Couldn't make it"
        >
          🌧️
        </span>
      )}
      <div
        className={`
          relative rounded-full flex items-center justify-center font-semibold text-white select-none
          transition-all duration-[200ms]
          ${textSize[size]}
        `}
        style={{
          width: px,
          height: px,
          backgroundColor: user.avatar_colour,
          minWidth: px,
          ...ringStyle,
        }}
        aria-label={`${user.name}${availability ? ` — ${availability}` : ''}`}
      >
        {initial}

        {/* Overlay icons */}
        {availability === 'no' && (
          <span
            className="absolute -bottom-0.5 -right-0.5 text-xs leading-none"
            aria-hidden="true"
          >
            😐
          </span>
        )}
        {hasNotResponded && !availability && (
          <span
            className="absolute -bottom-0.5 -right-0.5 text-xs leading-none"
            aria-hidden="true"
          >
            🕐
          </span>
        )}
      </div>
    </div>
  );
}
