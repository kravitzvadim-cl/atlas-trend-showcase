"use client";

import { useState } from "react";
import type { ComponentId } from "@/lib/ask";

// Every Ask Scout component is drawn here from the board's own tokens (CSS vars set on the .stage).
// No model-written markup is ever rendered.
export function KitPart({ id }: { id: ComponentId }) {
  const [on, setOn] = useState([true, false]);
  const [tab, setTab] = useState(0);
  const [value, setValue] = useState(64);

  switch (id) {
    case "buttons":
      return (
        <div className="crow center">
          <button className="tbtn primary">Get started</button>
          <button className="tbtn secondary">Learn more</button>
          <button className="tbtn plain">Skip</button>
        </div>
      );
    case "input":
      return (
        <label className="kp-field">
          <span>Email address</span>
          <span className="surface tinput"><input type="email" placeholder="you@studio.com" /></span>
          <small>We'll only use it for your boards.</small>
        </label>
      );
    case "search":
      return (
        <label className="surface tinput kp-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden><circle cx="10.5" cy="10.5" r="6.5" /><path d="m20 20-4.6-4.6" /></svg>
          <span className="sr-only">Sample search</span>
          <input placeholder="Search projects…" />
          <kbd>⌘K</kbd>
        </label>
      );
    case "card":
      return (
        <div className="surface card kp-w">
          <h3>Weekend in Lisbon</h3>
          <p>3 nights · 2 guests · from €420</p>
          <div className="crow"><button className="tbtn primary">Book now</button></div>
        </div>
      );
    case "pricing":
      return (
        <div className="surface card kp-price">
          <small>Pro</small>
          <b>$12<span>/mo</span></b>
          <ul><li>Unlimited boards</li><li>Token export</li><li>Team sharing</li></ul>
          <button className="tbtn primary">Choose Pro</button>
        </div>
      );
    case "toggle":
      return (
        <div className="surface card kp-w kp-list">
          {["Price alerts", "Weekly digest"].map((t, i) => (
            <div className="crow between" key={t}>
              <span>{t}</span>
              <button className={`ttoggle${on[i] ? " on" : ""}`} role="switch" aria-checked={on[i]} aria-label={t} onClick={() => setOn((o) => o.map((v, j) => (j === i ? !v : v)))} />
            </div>
          ))}
        </div>
      );
    case "checkbox":
      return (
        <div className="surface card kp-w kp-list">
          {["Mood board", "Colour tokens", "Type scale"].map((t, i) => (
            <label className="kp-check" key={t}><input type="checkbox" defaultChecked={i < 2} /> {t}</label>
          ))}
        </div>
      );
    case "tabs":
      return (
        <div className="surface tnav" role="group" aria-label="Sample tabs" style={{ "--nav": tab } as React.CSSProperties}>
          <span className="tnav-ind" aria-hidden />
          {["Overview", "Activity", "Files", "Settings"].map((t, i) => (
            <button key={t} aria-pressed={tab === i} onClick={() => setTab(i)}>{t}</button>
          ))}
        </div>
      );
    case "badge":
      return (
        <div className="crow center">
          <span className="kp-badge solid">New</span>
          <span className="kp-badge soft">In review</span>
          <span className="kp-badge outline">Draft</span>
          <span className="kp-badge soft"><i aria-hidden /> Live</span>
        </div>
      );
    case "alert":
      return (
        <div className="surface kp-alert" role="note">
          <i aria-hidden>i</i>
          <span><b>Board saved</b>You can reopen it from your recent boards.</span>
        </div>
      );
    case "modal":
      return (
        <div className="surface card kp-modal" role="dialog" aria-label="Sample dialog">
          <h3>Delete this board?</h3>
          <p>Its images and tokens will be removed from this browser.</p>
          <div className="crow end"><button className="tbtn secondary">Cancel</button><button className="tbtn primary">Delete</button></div>
        </div>
      );
    case "avatar":
      return (
        <div className="kp-avatars">
          {["AK", "MJ", "SR"].map((t) => <span key={t}>{t}</span>)}
          <span className="more">+4</span>
        </div>
      );
    case "progress":
      return (
        <div className="surface card kp-w">
          <div className="crow between"><span>Uploading</span><span className="mono">64%</span></div>
          <div className="kp-bar" role="progressbar" aria-valuenow={64} aria-valuemin={0} aria-valuemax={100} aria-label="Upload"><i /></div>
        </div>
      );
    case "slider":
      return (
        <label className="surface card kp-w">
          <span className="crow between"><span>Blur</span><span className="mono">{value}px</span></span>
          <input className="kp-range" type="range" min={0} max={100} value={value} onChange={(e) => setValue(+e.target.value)} />
        </label>
      );
    case "toast":
      return (
        <div className="surface kp-toast" role="status">
          <i aria-hidden>✓</i> Tokens copied <button className="tbtn plain">Undo</button>
        </div>
      );
  }
}
