import type { ReactNode } from "react";

interface StatusItem {
  content: ReactNode;
  push?: boolean;
}

export function StatusBar({ items }: { items: StatusItem[] }) {
  return (
    <div className="status">
      {items.map((it, i) => (
        <span key={i} className={it.push ? "push" : undefined}>
          {it.content}
        </span>
      ))}
    </div>
  );
}
