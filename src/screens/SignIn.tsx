import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Topbar } from "../components/Topbar";
import { StatusBar } from "../components/StatusBar";
import { useSignIn } from "../data/api";

// New screen — same shell as the rest of the cockpit, email + password only
// (Convex Auth Password provider, no OAuth). Judge hint per BUILD-PLAN.
export function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const signIn = useSignIn();
  const navigate = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="root">
      <Topbar>
        <span className="lab">Review intelligence · built on SerpApi</span>
      </Topbar>

      <div className="stage" style={{ alignItems: "center", justifyContent: "center" }}>
        <form onSubmit={onSubmit} style={{ width: 400, display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, textAlign: "center" }}>
            <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: "-0.015em" }}>Sign in</h1>
            <p style={{ margin: 0, fontSize: 14, color: "var(--mute2)" }}>Email and password. No accounts, no OAuth.</p>
          </div>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span className="lab">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={inputStyle}
              autoComplete="email"
            />
          </label>

          <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <span className="lab">Password</span>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              autoComplete="current-password"
            />
          </label>

          <button type="submit" className="btn" disabled={busy} style={{ width: "100%" }}>
            {busy ? "Signing in…" : "SIGN IN"}
          </button>

          {error && (
            <p className="mono" style={{ margin: 0, fontSize: 12, color: "var(--orange)", textAlign: "center" }}>
              {error}
            </p>
          )}

          <p className="mono" style={{ margin: 0, fontSize: 11.5, color: "var(--mute)", textAlign: "center" }}>
            Judges: credentials are in the Devpost testing notes.
          </p>
        </form>
      </div>

      <StatusBar items={[{ content: <>AUTH <b>email + password</b></> }, { content: <>ROLES <b>admin · judge · viewer</b></>, push: true }]} />
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  height: 44,
  padding: "0 14px",
  background: "var(--panel)",
  border: "1px solid var(--hairline3)",
  color: "var(--ink)",
  fontSize: 14,
  fontFamily: "inherit",
};
