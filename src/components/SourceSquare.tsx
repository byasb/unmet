import type { SourceCode } from "../data/types";

// The G/Y/T/O platform badge. `variant="sq"` is the solid bordered square used
// next to a single review (Action/Replies/AIAnswer); `variant="src4"` is the
// dim/lit coverage square used in the "seen on N of 4 platforms" strip.
export function SourceSquare({
  code,
  variant = "sq",
  on = true,
}: {
  code: SourceCode;
  variant?: "sq" | "src4";
  on?: boolean;
}) {
  if (variant === "src4") {
    return <span className={on ? "src4 on" : "src4"}>{code}</span>;
  }
  return <span className="sq">{code}</span>;
}
