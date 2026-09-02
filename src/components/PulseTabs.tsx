import { Link } from "react-router-dom";
import { useBusiness, useLatestPulseRun } from "../data/api";

// BOARD / STREET / AI ANSWER switcher shared by PulseBoard, StreetMap and
// AIAnswer's topbars. BOARD needs the latest run id, which only PulseBoard's
// own URL carries -- look it up so the tab works from the other two screens.
export function PulseTabs({ active }: { active: "board" | "street" | "ai" }) {
  const business = useBusiness();
  const latest = useLatestPulseRun(business?._id);
  const boardTo = latest ? `/pulse/${latest._id}` : "/pulse/home";

  return (
    <div className="tabs">
      <Link to={boardTo} className={active === "board" ? "tag warm" : "tag"}>
        BOARD
      </Link>
      <Link to="/pulse/street" className={active === "street" ? "tag warm" : "tag"}>
        STREET
      </Link>
      <Link to="/pulse/ai" className={active === "ai" ? "tag warm" : "tag"}>
        AI ANSWER
      </Link>
    </div>
  );
}
