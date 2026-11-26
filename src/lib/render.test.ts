import { describe, expect, it } from "vitest";
import { addCaptionToSvg, captionText } from "./render";
import { defaults } from "./qr";
import { withDefaults } from "./storage";

const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 33 33" shape-rendering="crispEdges"><path fill="#ffffff" d="M0 0h33v33H0z"/><path stroke="#0b1220" d="M4 4.5h7"/></svg>\n';

describe("captionText", () => {
  it("is null when the caption is switched off", () => {
    expect(captionText({ ...defaults, showCaption: false, caption: "Hi" })).toBeNull();
  });

  it("is null when switched on but blank", () => {
    expect(captionText({ ...defaults, showCaption: true, caption: "   " })).toBeNull();
  });

  it("returns the trimmed text when switched on", () => {
    expect(captionText({ ...defaults, showCaption: true, caption: "  Scan for menu " })).toBe("Scan for menu");
  });
});

describe("addCaptionToSvg", () => {
  it("makes room below the code and adds the text", () => {
    const out = addCaptionToSvg(svg, "Scan me", "#0B1220", "#FFFFFF");
    const [, , w, h] = out.match(/viewBox="([^"]+)"/)![1].split(" ").map(Number);
    expect(w).toBe(33);
    expect(h).toBeGreaterThan(33);
    expect(out).toContain(">Scan me</text>");
    expect(out).toContain('fill="#0B1220"');
    expect(out).toMatch(/<rect[^>]*y="33"[^>]*fill="#FFFFFF"/);
    expect(out.trim().endsWith("</svg>")).toBe(true);
  });

  it("escapes special characters", () => {
    const out = addCaptionToSvg(svg, `Tom & Jerry's <menu> "now"`, "#000000", "#FFFFFF");
    expect(out).toContain("Tom &amp; Jerry&apos;s &lt;menu&gt; &quot;now&quot;");
  });

  it("shrinks long text so it fits the code width", () => {
    const short = addCaptionToSvg(svg, "Hi", "#000000", "#FFFFFF");
    const long = addCaptionToSvg(svg, "A much longer caption for the code", "#000000", "#FFFFFF");
    const size = (s: string) => Number(s.match(/font-size="([\d.]+)"/)![1]);
    expect(size(long)).toBeLessThan(size(short));
  });

  it("returns the input unchanged if there is no viewBox", () => {
    expect(addCaptionToSvg("<svg></svg>", "Hi", "#000000", "#FFFFFF")).toBe("<svg></svg>");
  });
});

describe("caption defaults", () => {
  it("older drafts without caption fields get it switched off", () => {
    const state = withDefaults({ name: "Old" });
    expect(state.showCaption).toBe(false);
    expect(state.caption).toBe(defaults.caption);
  });
});
