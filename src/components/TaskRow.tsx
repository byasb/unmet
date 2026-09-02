import type { ReactNode } from "react";

interface TaskRowProps {
  box?: "on" | "half" | "off";
  title: string;
  sub?: string;
  col1?: ReactNode;
  col2?: ReactNode;
  action?: { label: string; variant?: "solid" | "ghost" | "dim" };
  onAction?: () => void;
  open?: boolean;
}

// The 5-column task grid from Morning.dc.html: checkbox | title+meta | col1 |
// col2 | action button.
export function TaskRow({ box = "off", title, sub, col1, col2, action, onAction, open }: TaskRowProps) {
  return (
    <div className={open ? "task open" : "task"}>
      <span className={box === "off" ? "box" : `box ${box}`} />
      <span className="t">
        {title} {sub && <span>· {sub}</span>}
      </span>
      <span className="m">{col1 ?? " "}</span>
      <span className="m">{col2 ?? " "}</span>
      {action ? (
        <button type="button" className={action.variant === "ghost" ? "btn ghost" : action.variant === "dim" ? "btn dim" : "btn"} onClick={onAction} style={{ height: 28, fontSize: 11.5 }}>
          {action.label}
        </button>
      ) : (
        <span />
      )}
    </div>
  );
}
