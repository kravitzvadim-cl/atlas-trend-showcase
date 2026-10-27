"use client";

import { useState } from "react";
import { contrast } from "@/lib/color";
import { modeFor, projectKit, shadcnCss, shadcnVars, designRules, type Facts, type Mode } from "@/lib/projectKit";
import { zip } from "@/lib/zip";
import { systemCss, systemHtml, systemJson, systemTailwind, type System } from "@/lib/designSystem";
import { fontStack } from "@/lib/tokens";

type Props = {
  keyword: string;
  system: System | null; // null until the board is turned into a design system
  draft: System | null; // the same system before it's made, so one click can make it and download the kit
  facts: Facts | null;
  ground: string;
  onMake: () => void;
  onDownload: (name: string, text: string) => void;
  onAsk: (request: string) => void;
};

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function downloadZip(name: string, files: Record<string, string>) {
  const url = URL.createObjectURL(new Blob([zip(files) as BlobPart], { type: "application/zip" }));
  Object.assign(document.createElement("a"), { href: url, download: name }).click();
  URL.revokeObjectURL(url);
}

export function DesignSystem({ keyword, system: s, draft, facts, ground, onMake, onDownload, onAsk }: Props) {
  const [mode, setMode] = useState<Mode | null>(null); // null = follow the board
  const m = mode ?? modeFor(ground);
  const name = slug(keyword) || "trend";
  const kitZip = (sys: System) => facts && downloadZip(`${name}-kit.zip`, projectKit(sys, facts, m));
  if (!s)
    return (
      <div className="ds-cta">
        <div>
          <b>Make it a design system</b>
          <span className="muted">Turns this board's colours, fonts, corners and motion into a small system you can build with. Free and instant.</span>
        </div>
        <div className="ds-cta-act">
          <button className="btn" onClick={onMake}>Make it a design system</button>
          {draft && facts && <button className="btn-outline" onClick={() => { onMake(); kitZip(draft); }}>Make it + download project kit</button>}
        </div>
      </div>
    );

  const fd = fontStack(s.fonts.display), fb = fontStack(s.fonts.body);
  const theme = shadcnVars(s, m);
  const v = theme.vars;
  return (
    <div className="ds">
      <div className="ds-block">
        <div className="ds-bh"><h3>Colour roles</h3><span className="muted small">Each role gets 10 shades; the outlined one is the board's own colour</span></div>
        {s.roles.map((r) => (
          <div className="ds-role" key={r.name}>
            <div><b>{r.name}</b><small className="mono">{r.hex} · {r.use}</small></div>
            <div className="ds-ramp">
              {r.ramp.map((x) => (
                <i key={x.step} className={x.base ? "base" : ""} style={{ background: x.hex, color: contrast(x.hex, "#FFFFFF") >= 4.5 ? "#fff" : "#111" }} title={`${r.name} ${x.step} · ${x.hex}`}>
                  <span>{x.step}</span>
                </i>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="ds-grid">
        <div className="ds-block">
          <div className="ds-bh"><h3>Type</h3><span className="muted small">Scale ratio {s.ratio}, base 16px</span></div>
          <div className="ds-pair">
            <div><span className="muted small">Display · headings</span><div className="ds-aa" style={{ fontFamily: fd }}>Aa</div><b>{s.fonts.display}</b></div>
            <div><span className="muted small">Body · text</span><div className="ds-aa" style={{ fontFamily: fb, fontWeight: 400 }}>Aa</div><b>{s.fonts.body}</b></div>
          </div>
          {s.type.map((t) => (
            <div className="ds-trow" key={t.name}>
              <span className="muted small">{t.name}</span>
              <div style={{ font: `${t.weight} ${t.px}px/${t.lh} ${t.font === "display" ? fd : fb}`, ...(t.name === "Label" ? { letterSpacing: "0.06em", textTransform: "uppercase" } : {}) }}>{t.sample}</div>
              <span className="mono muted small">{t.px} / {t.lh} / {t.weight}</span>
            </div>
          ))}
        </div>
        <div className="ds-stack">
          <div className="ds-block">
            <div className="ds-bh"><h3>Spacing</h3><span className="muted small">{s.spacingBase}px base</span></div>
            {s.spacing.map((x) => (
              <div className="ds-sp" key={x.name}><span className="mono small">{x.name} · {x.px}</span><i style={{ width: x.px, background: s.roles[0].hex }} /></div>
            ))}
          </div>
          <div className="ds-block">
            <div className="ds-bh"><h3>Corners</h3><span className="muted small">Board radius: {s.radius[2].px}px</span></div>
            <div className="ds-radii">
              {s.radius.map((x) => (
                <div key={x.name}><i className={x.name === "md" ? "base" : ""} style={{ borderRadius: x.px }} /><span className="small muted">{x.name}{x.name === "full" ? "" : ` · ${x.px}`}</span></div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="ds-grid">
        <div className="ds-block">
          <div className="ds-bh"><h3>Shadows</h3><span className="muted small">{s.shadowStyle}</span></div>
          <div className="ds-shadows">{s.shadows.map((x, i) => <div key={i} style={{ boxShadow: x }}>Level {i + 1}</div>)}</div>
        </div>
        <div className="ds-block">
          <div className="ds-bh"><h3>Motion</h3><span className="muted small">fast {s.motion.fast} · base {s.motion.base} · slow {s.motion.slow}ms</span></div>
          <div className="ds-track"><i style={{ background: s.roles[0].hex, animationDuration: `${s.motion.slow * 4}ms`, animationTimingFunction: s.motion.curve }} /></div>
        </div>
      </div>

      <section className="use" aria-label="Use in my project">
        <div className="use-top">
          <div>
            <h3>Use in my project</h3>
            <p className="muted">Everything to build in this style: rules your AI coding tool follows, a ready shadcn theme, and the design-system files. One ZIP, with a README that says where each file goes.</p>
          </div>
          <div className="use-act" data-noexport>
            <button className="btn" onClick={() => kitZip(s)} disabled={!facts}>⬇ Download ZIP</button>
            <span className="mono muted small">{name}-kit.zip · free</span>
          </div>
        </div>
        <div className="use-cols">
          <div className="use-card">
            <h4>What's inside</h4>
            <ul className="tree mono">
              <li>{name}-kit/</li>
              <li className="i1">README.md <em>start here</em></li>
              <li className="i1 d">ai-tools/</li>
              <li className="i2">CLAUDE.md <em>Claude Code</em></li>
              <li className="i2">.cursor/rules/design.mdc <em>Cursor</em></li>
              <li className="i2">AGENTS.md <em>Codex and others</em></li>
              <li className="i2">v0-lovable-prompt.md <em>v0, Lovable, Bolt</em></li>
              <li className="i1 d">shadcn/</li>
              <li className="i2">globals.css <em>Tailwind v4 theme</em></li>
              <li className="i1 d">design-system/</li>
              <li className="i2">design-system.css · preset.js · tokens.json · guide.html</li>
            </ul>
          </div>
          <div className="use-card">
            <h4>shadcn theme</h4>
            <div className="use-mode">
              <div className="seg" role="group" aria-label="Theme mode" data-noexport>
                {(["light", "dark"] as const).map((x) => (
                  <button key={x} aria-pressed={m === x} className={m === x ? "on" : ""} onClick={() => setMode(x)}>{x === "light" ? "Light" : "Dark"}</button>
                ))}
              </div>
              <span className="muted small">{mode ? "Your choice." : `${m === "light" ? "Light" : "Dark"}, because this board's background is ${m}.`} Switch if it reads wrong.</span>
            </div>
            <div className="use-pv" style={{ background: v.background, color: v.foreground, borderColor: v.border, borderRadius: s.radius[2].px, boxShadow: s.shadows[1], fontFamily: fb }}>
              <b style={{ fontFamily: fd }}>Preview with the theme</b>
              <div className="crow">
                <span style={{ background: v.primary, color: v["primary-foreground"], borderRadius: s.radius[2].px }}>Primary</span>
                <span style={{ background: v.secondary, color: v["secondary-foreground"], borderRadius: s.radius[2].px }}>Secondary</span>
                <span style={{ border: `1.5px solid ${v.border}`, borderRadius: s.radius[2].px }}>Outline</span>
              </div>
              <small style={{ background: v.muted, color: v["muted-foreground"] }}>Muted text, borders and focus rings come from the same roles.</small>
            </div>
            <div className="chips">
              <span className={`okpill${theme.passing === theme.pairs.length ? "" : " bad"}`}>{theme.passing === theme.pairs.length ? "✓" : "!"} {theme.passing} of {theme.pairs.length} text pairs pass AA</span>
              <span className="okpill">✓ Tailwind v4 format</span>
            </div>
          </div>
        </div>
        <div className="dl singles" data-noexport>
          <span className="muted small">Just one file:</span>
          <button className="ghost" onClick={() => onDownload(`${name}-design-system.css`, systemCss(s))}>design-system.css</button>
          <button className="ghost" onClick={() => onDownload(`${name}-preset.js`, systemTailwind(s))}>Tailwind preset</button>
          <button className="ghost" onClick={() => onDownload(`${name}-tokens.json`, systemJson(s))}>tokens.json (W3C)</button>
          <button className="ghost" onClick={() => onDownload(`${name}-design-system.html`, systemHtml(s))}>Design system page</button>
          {facts && <button className="ghost" onClick={() => onDownload("CLAUDE.md", designRules(s, facts, m))}>CLAUDE.md</button>}
          <button className="ghost" onClick={() => onDownload("globals.css", shadcnCss(s, m))}>shadcn theme</button>
        </div>
        <div className="chips ds-tweaks" data-noexport>
          <span className="muted small">Tweak with Ask Scout:</span>
          {["a bigger type scale", "8px spacing", "rounder corners", "sharper corners"].map((t) => (
            <button key={t} className="chip" onClick={() => onAsk(`design system: ${t}`)}>+ {t}</button>
          ))}
        </div>
      </section>
    </div>
  );
}
