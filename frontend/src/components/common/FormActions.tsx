import type { ReactNode } from 'react';
import React from 'react';

interface Props {
  readonly children: ReactNode;
}

/** Two-button footer: each button takes 50% width */
export default function FormActions({ children }: Props) {
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 24 }}>
      {Array.isArray(children)
        ? React.Children.map(children, (child) => (
            <div style={{ flex: 1 }}>{child}</div>
          ))
        : <div style={{ flex: 1 }}>{children}</div>}
    </div>
  );
}
