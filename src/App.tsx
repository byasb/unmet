import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Landing } from "./screens/Landing";
import { SignIn } from "./screens/SignIn";
import { BuildPreflight } from "./screens/BuildPreflight";
import { PulsePreflight } from "./screens/PulsePreflight";
import { Reading } from "./screens/Reading";
import { BuildBoard } from "./screens/BuildBoard";
import { PulseBoard } from "./screens/PulseBoard";
import { PulseHome } from "./screens/PulseHome";
import { AIAnswer } from "./screens/AIAnswer";
import { ActionDetail } from "./screens/ActionDetail";
import { ReplyDesk } from "./screens/ReplyDesk";
import { Experiments } from "./screens/Experiments";
import { Brief } from "./screens/Brief";

// Route table from BUILD-PLAN.md §Screens.
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/build" element={<BuildPreflight />} />
        <Route path="/pulse" element={<PulsePreflight />} />
        <Route path="/run/:kind" element={<Reading />} />
        <Route path="/build/:runId/brief" element={<Brief />} />
        <Route path="/build/:runId" element={<BuildBoard />} />
        <Route path="/pulse/home" element={<PulseHome />} />
        <Route path="/pulse/ai" element={<AIAnswer />} />
        <Route path="/pulse/gap/:theme" element={<ActionDetail />} />
        <Route path="/pulse/replies" element={<ReplyDesk />} />
        <Route path="/pulse/experiments" element={<Experiments />} />
        <Route path="/pulse/:runId" element={<PulseBoard />} />
      </Routes>
    </BrowserRouter>
  );
}
