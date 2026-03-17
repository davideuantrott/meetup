import type { User } from '../../types';
import type { Availability } from '../../types';

interface AvatarProps {
  user: User;
  availability?: Availability | 'none';
  size?: 'sm' | 'md' | 'lg';
  isOddOneOut?: boolean;
  hasNotResponded?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-14 h-14 text-xl',
};

export function Avatar({ user, availability, size = 'md', isOddOneOut, hasNotResponded }: AvatarProps) {
  const initial = user.name.charAt(0).toUpperCase();

  const ringClass =
    availability === 'yes'
      ? 'ring-2 ring-green-500 ring-offset-1'
      : availability === 'maybe'
      ? 'ring-2 ring-amber-400 ring-offset-1 opacity-80'
      : availability === 'no'
      ? 'grayscale opacity-60'
      : hasNotResponded
      ? 'grayscale opacity-50'
      : '';

  return (
    <div className="relative inline-flex flex-col items-center gap-0.5">
      {isOddOneOut && (
        <span
          className="absolute -top-4 left-1/2 -translate-x-1/2 text-xs"
          aria-label="Couldn't make it"
          title="Couldn't make the confirmed date"
        >
          🌧️
        </span>
      )}
      <div
        className={`
          ${sizeClasses[size]}
          ${ringClass}
          rounded-full flex items-center justify-center font-semibold text-white
          transition-all duration-200 relative
        `}
        style={{ backgroundColor: user.avatar_colour }}
        aria-label={`${user.name}${availability ? ` — ${availability}` : ''}`}
      >
        {initial}
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
