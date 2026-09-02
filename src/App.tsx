import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AuthLoading, Authenticated, Unauthenticated } from "convex/react";
import { Landing } from "./screens/Landing";
import { SignIn } from "./screens/SignIn";
import { BuildPreflight } from "./screens/BuildPreflight";
import { PulsePreflight } from "./screens/PulsePreflight";
import { Reading } from "./screens/Reading";
import { BuildBoard } from "./screens/BuildBoard";
import { PulseBoard } from "./screens/PulseBoard";
import { PulseHome } from "./screens/PulseHome";
import { StreetMap } from "./screens/StreetMap";
import { AIAnswer } from "./screens/AIAnswer";
import { ActionDetail } from "./screens/ActionDetail";
import { ReplyDesk } from "./screens/ReplyDesk";
import { Experiments } from "./screens/Experiments";
import { Brief } from "./screens/Brief";
import { Guide } from "./components/Guide";
import { DemoPilot } from "./components/DemoPilot";

// Route table from BUILD-PLAN.md §Screens. Unauthenticated visitors land on
// /signin for everything except the landing page itself; AuthLoading shows a
// bare shell rather than flashing the sign-in screen while Convex Auth
// resolves the session.
export default function App() {
  return (
    <BrowserRouter>
      <AuthLoading>
        <div className="root" />
      </AuthLoading>
      <Unauthenticated>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="*" element={<SignIn />} />
        </Routes>
      </Unauthenticated>
      <Authenticated>
        <DemoPilot />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/build" element={<BuildPreflight />} />
          <Route path="/pulse" element={<PulsePreflight />} />
          <Route path="/run/:kind/:runId" element={<Reading />} />
          <Route path="/build/:runId/brief" element={<Brief />} />
          <Route path="/build/:runId" element={<BuildBoard />} />
          <Route path="/pulse/home" element={<PulseHome />} />
          <Route path="/pulse/street" element={<StreetMap />} />
          <Route path="/pulse/ai" element={<AIAnswer />} />
          <Route path="/pulse/gap/:theme" element={<ActionDetail />} />
          <Route path="/pulse/replies" element={<ReplyDesk />} />
          <Route path="/pulse/experiments" element={<Experiments />} />
          <Route path="/pulse/:runId" element={<PulseBoard />} />
        </Routes>
      </Authenticated>
      <Guide />
    </BrowserRouter>
  );
}
