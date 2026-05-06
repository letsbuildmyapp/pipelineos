import { cn } from '../lib/cn';
import type { User } from '../types';

export function Avatar({ user, size = 24, className }: { user: User | undefined; size?: number; className?: string }) {
  if (!user) {
    return (
      <div
        className={cn('rounded-full bg-bg-subtle border border-line', className)}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={cn('inline-flex items-center justify-center rounded-full font-semibold text-[rgb(var(--accent-fg))] select-none', className)}
      style={{
        width: size,
        height: size,
        background: `oklch(60% 0.16 ${user.hue})`,
        fontSize: Math.max(9, size * 0.42),
      }}
      title={user.name}
    >
      {user.initials}
    </div>
  );
}
