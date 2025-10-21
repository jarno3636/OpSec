// components/FarcasterMiniBridge.tsx
'use client';

import * as React from 'react';
import { openInMini } from '@/lib/miniapp';

type Props = {
  href?: string;
  children?: React.ReactNode;
  className?: string;
  title?: string;
  'aria-label'?: string;
  target?: string;
  rel?: string;
  [x: string]: any;
};

export default function FarcasterMiniBridge({
  href = '#',
  children,
  className = '',
  title,
  ...rest
}: Props) {
  const onClick = async (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    await openInMini(href);
  };

  return (
    <a
      href={href}
      onClick={onClick}
      className={className}
      title={title}
      rel={rest.rel ?? 'noopener noreferrer'}
      {...rest}
    >
      {children ?? href}
    </a>
  );
}
