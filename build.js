#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

const data = JSON.parse(fs.readFileSync('content.json', 'utf8'));
const iconSvg = fs.readFileSync('snake_dark.svg', 'utf8').trim();

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function tag(name, attrs, content) {
  const a = Object.entries(attrs || {}).map(([k, v]) => ` ${k}="${esc(v)}"`).join('');
  return `<${name}${a}>${content}</${name}>`;
}

function renderStat(s) {
  let valueHtml;
  if (s.accentChar) {
    valueHtml = esc(s.value).replace(
      esc(s.accentChar),
      `<span style="color:var(--accent);">${esc(s.accentChar)}</span>`
    );
  } else {
    const m = String(s.value).match(/^(\d+(?:\.\d+)?)(.*)/);
    if (m && m[2]) {
      valueHtml = esc(m[1]) + `<span style="color:var(--accent);">${esc(m[2])}</span>`;
    } else {
      valueHtml = esc(s.value);
    }
  }
  return `
      <div style="padding:26px;border:1px solid var(--border);border-radius:16px;background:var(--surface);">
        <div style="font-size:34px;font-weight:700;letter-spacing:-0.02em;">${valueHtml}</div>
        <div style="font-size:14px;color:var(--muted);margin-top:6px;">${esc(s.label)}</div>
      </div>`;
}

function renderExperienceItem(e) {
  const titleSuffix = e.titleSuffix
    ? ` <span style="font-weight:400;color:var(--faint);font-size:16px;">${esc(e.titleSuffix)}</span>`
    : '';
  const bullets = e.bullets
    .map(b => `<li>${esc(b)}</li>`)
    .join('\n            ');
  return `
      <div data-reveal="" data-tilt="" class="r-work" style="transition:opacity .7s cubic-bezier(.16,.84,.44,1),transform .7s cubic-bezier(.16,.84,.44,1),border-color .3s,background .3s;border:1px solid var(--border);border-radius:18px;background:var(--surface);padding:30px 32px;display:grid;grid-template-columns:200px 1fr;gap:34px;">
        <div>
          <div style="font-family:'JetBrains Mono',monospace;font-size:12.5px;color:var(--accent);">${esc(e.period)}</div>
          <div style="font-size:13px;color:var(--faint);margin-top:6px;">${esc(e.location)}</div>
        </div>
        <div>
          <div style="font-size:21px;font-weight:600;letter-spacing:-0.01em;">${esc(e.title)}${titleSuffix}</div>
          <div style="font-size:15px;color:var(--muted);margin-top:3px;">${esc(e.company)}</div>
          <ul style="margin:16px 0 0;padding-left:18px;color:var(--muted);font-size:15px;line-height:1.65;">
            ${bullets}
          </ul>
        </div>
      </div>`;
}

function renderMetric(m) {
  const displayVal = m.decimals
    ? m.count.toFixed(m.decimals) + (m.suffix || '')
    : (m.count >= 1000
        ? m.count.toLocaleString('en-US') + (m.suffix || '')
        : m.count + (m.suffix || ''));
  const countAttrs = `data-count="${m.count}"${m.decimals ? ` data-decimals="${m.decimals}"` : ''}${m.suffix ? ` data-suffix="${esc(m.suffix)}"` : ''}`;
  return `
          <div style="background:var(--bg2);padding:24px;">
            <div ${countAttrs} style="font-size:38px;font-weight:700;letter-spacing:-0.02em;color:var(--accent);">${esc(displayVal)}</div>
            <div style="font-size:13px;color:var(--muted);margin-top:5px;">${esc(m.label)}</div>
          </div>`;
}

function renderSkillGroup(g) {
  const items = g.items
    .map(i => `<span style="font-size:14px;font-weight:500;padding:8px 14px;border-radius:10px;background:var(--surfaceHi);border:1px solid var(--border);">${esc(i)}</span>`)
    .join('\n          ');
  return `
      <div style="border:1px solid var(--border);border-radius:16px;background:var(--surface);padding:26px;">
        <div style="font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;color:var(--faint);margin-bottom:18px;">${esc(g.category)}</div>
        <div style="display:flex;flex-wrap:wrap;gap:9px;">
          ${items}
        </div>
      </div>`;
}

function renderEducationDegree(e) {
  return `
      <div style="border:1px solid var(--border);border-radius:16px;background:var(--surface);padding:30px;">
        <div style="font-family:'JetBrains Mono',monospace;font-size:12.5px;color:var(--accent);">${esc(e.period)}</div>
        <div style="font-size:20px;font-weight:600;letter-spacing:-0.01em;margin-top:12px;">${esc(e.degree)}</div>
        <div style="font-size:15px;color:var(--muted);margin-top:4px;">${esc(e.school)}</div>
      </div>`;
}

function renderHonor(h) {
  return `
      <div style="border:1px solid var(--border);border-radius:16px;background:var(--surface);padding:24px;display:flex;align-items:center;gap:16px;">
        <div style="font-size:26px;font-weight:700;color:var(--accent);letter-spacing:-0.02em;">${esc(h.rank)}</div>
        <div style="font-size:14px;color:var(--muted);line-height:1.5;">${esc(h.description)}<br>${esc(h.detail)}</div>
      </div>`;
}

const d = data;

function renderProjectFeatured(p) {
  return `
    <div data-reveal="" style="border:1px solid var(--border);border-radius:22px;background:var(--surface);overflow:hidden;">
      <div class="r-proj" style="padding:40px 40px 34px;display:grid;grid-template-columns:1fr 0.9fr;gap:48px;align-items:start;">
        <div>
          <div style="display:inline-flex;align-items:center;gap:8px;font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--muted);padding:5px 11px;border:1px solid var(--border);border-radius:8px;">${esc(p.badge)}</div>
          <h3 style="font-size:32px;font-weight:700;letter-spacing:-0.02em;margin:18px 0 0;">${esc(p.title)} <span style="font-weight:400;color:var(--faint);font-size:20px;">${esc(p.titleSuffix)}</span></h3>
          <p style="font-size:16px;line-height:1.65;color:var(--muted);margin:16px 0 0;max-width:460px;">${esc(p.description)}</p>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:24px;">
            ${p.tags.map(t => `<span style="font-family:'JetBrains Mono',monospace;font-size:12px;padding:6px 12px;border-radius:8px;background:var(--surfaceHi);border:1px solid var(--border);color:var(--muted);">${esc(t)}</span>`).join('\n            ')}
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:1px;background:var(--border);border:1px solid var(--border);border-radius:16px;overflow:hidden;">
          ${p.metrics.map(renderMetric).join('')}
        </div>
      </div>
      <div style="border-top:1px solid var(--border);padding:20px 40px;display:flex;align-items:center;gap:14px;flex-wrap:wrap;">
        <span style="font-size:13.5px;color:var(--faint);">Also led:</span>
        ${p.alsoLed.map((n, i) => `${i > 0 ? '<span style="width:4px;height:4px;border-radius:50%;background:var(--faint);"></span>' : ''}<span style="font-size:14px;font-weight:500;">${esc(n)}</span>`).join('\n        ')}
      </div>
    </div>`;
}

function renderProjectSimple(p) {
  const titleHtml = p.url
    ? `<a href="${esc(p.url)}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:6px;color:inherit;">${esc(p.title)}<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg></a>`
    : esc(p.title);
  return `
    <div data-reveal="" data-tilt="" style="transition:border-color .3s,background .3s;border:1px solid var(--border);border-radius:22px;background:var(--surface);padding:40px;">
      <div style="display:inline-flex;align-items:center;gap:8px;font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--muted);padding:5px 11px;border:1px solid var(--border);border-radius:8px;">${esc(p.badge)}</div>
      <h3 style="font-size:26px;font-weight:700;letter-spacing:-0.02em;margin:18px 0 0;">${titleHtml}</h3>
      <p style="font-size:16px;line-height:1.65;color:var(--muted);margin:16px 0 0;max-width:640px;">${esc(p.description)}</p>
      <ul style="margin:20px 0 0;padding-left:18px;color:var(--muted);font-size:15px;line-height:1.7;">
        ${p.highlights.map(h => `<li>${esc(h)}</li>`).join('\n        ')}
      </ul>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:24px;">
        ${p.tags.map(t => `<span style="font-family:'JetBrains Mono',monospace;font-size:12px;padding:6px 12px;border-radius:8px;background:var(--surfaceHi);border:1px solid var(--border);color:var(--muted);">${esc(t)}</span>`).join('\n        ')}
      </div>
    </div>`;
}

const html = `<!DOCTYPE html>
<!--
  hey, you view-source too.

  built with:  Node.js  ·  zero dependencies
  designed by: Mohamad Reza Jafarzade
  source:      github.com/mhmdreza/mhmdreza.github.io

  if you're hiring or just want to talk systems:
  → mrezajafarzade98@gmail.com
-->
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(d.meta.title)}</title>
<meta name="description" content="${esc(d.bio)}">
<link rel="icon" type="image/svg+xml" href="favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; }
  html { scroll-behavior: smooth; }
  body { margin: 0; font-family: 'Space Grotesk', sans-serif; background: var(--bg, #08100c); color: var(--fg, #e9f3ec); -webkit-font-smoothing: antialiased; }
  :root {
    --bg: #08100c; --bg2: #0c1611; --surface: #101c16; --surfaceHi: #16251d;
    --border: rgba(255,255,255,0.08); --fg: #e9f3ec; --muted: #93a89c;
    --faint: #566a5e; --accent: #34d27e; --accent2: #2bb3a6;
    --navbg: rgba(8,16,12,0.72); --glow: rgba(52,210,126,0.16);
  }
  @media (prefers-color-scheme: light) {
    :root {
      --bg: #f3f6f3; --bg2: #ffffff; --surface: #ffffff; --surfaceHi: #f6faf6;
      --border: rgba(16,40,28,0.10); --fg: #11201a; --muted: #51635a;
      --faint: #93a89c; --accent: #0f9d63; --accent2: #0e8a7c;
      --navbg: rgba(243,246,243,0.82); --glow: rgba(15,157,99,0.10);
    }
  }
  ::selection { background: var(--accent); color: #06070a; }
  a { color: inherit; text-decoration: none; }
  @keyframes mrjFloatA { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(40px,-30px) scale(1.08); } }
  @keyframes mrjFloatB { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-50px,40px) scale(1.12); } }
  @keyframes mrjPulse { 0%,100% { opacity: 1; transform: scale(1); } 50% { opacity: .35; transform: scale(.7); } }
  @keyframes mrjBlink { 0%,100% { opacity: 1; } 50% { opacity: .25; } }
  @media (max-width: 880px) {
    .r-hero { grid-template-columns: 1fr !important; padding-top: 128px !important; gap: 44px !important; }
    .r-proj { grid-template-columns: 1fr !important; gap: 32px !important; padding: 30px 26px 26px !important; }
    #mrj-navlinks { display: none !important; }
  }
  @media (max-width: 680px) {
    .r-grid4 { grid-template-columns: 1fr 1fr !important; }
    .r-grid3 { grid-template-columns: 1fr !important; }
    .r-edu2  { grid-template-columns: 1fr !important; }
    .r-edu3  { grid-template-columns: 1fr !important; }
    .r-work  { grid-template-columns: 1fr !important; gap: 14px !important; padding: 26px 22px !important; }
    main section, nav > div, footer > div { padding-left: 20px !important; padding-right: 20px !important; }
    .r-contact { padding: 44px 24px !important; }
    .r-grid4 > div { padding: 20px !important; }
  }
  @media (max-width: 420px) {
    .r-grid4 { grid-template-columns: 1fr !important; }
  }
</style>
</head>
<body>

<div id="mrj-glow" style="position:fixed;top:-200px;left:-200px;width:680px;height:680px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,var(--glow),transparent 62%);transform:translate(-50%,-50%);z-index:0;will-change:transform;opacity:0;transition:opacity .6s ease;"></div>

<div style="position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:0;">
  <div style="position:absolute;top:-160px;right:-120px;width:520px;height:520px;border-radius:50%;background:radial-gradient(circle,var(--accent),transparent 68%);filter:blur(60px);opacity:.16;animation:mrjFloatA 18s ease-in-out infinite;"></div>
  <div style="position:absolute;bottom:-180px;left:-140px;width:560px;height:560px;border-radius:50%;background:radial-gradient(circle,var(--accent2),transparent 68%);filter:blur(70px);opacity:.14;animation:mrjFloatB 22s ease-in-out infinite;"></div>
  <div style="position:absolute;inset:0;background-image:radial-gradient(var(--border) 1px,transparent 1px);background-size:46px 46px;opacity:.5;mask-image:radial-gradient(ellipse 80% 60% at 50% 0%,#000,transparent 75%);-webkit-mask-image:radial-gradient(ellipse 80% 60% at 50% 0%,#000,transparent 75%);"></div>
</div>

<nav id="mrj-nav" style="position:fixed;top:0;left:0;right:0;z-index:50;backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);background:var(--navbg);border-bottom:1px solid var(--border);">
  <div style="max-width:1180px;margin:0 auto;padding:14px 32px;display:flex;align-items:center;justify-content:space-between;gap:24px;">
    <a href="#top" style="display:flex;align-items:center;gap:11px;">
      <span style="display:inline-block;width:36px;height:36px;flex-shrink:0;">${iconSvg.replace('viewBox', 'width="36" height="36" viewBox').replace(/<rect[^>]*fill="#1E2A38"[^>]*\/>/,'')}</span>
      <span style="font-weight:700;font-size:16px;letter-spacing:-0.02em;">${esc(d.name.first)} ${esc(d.name.last)}</span>
    </a>
    <div id="mrj-navlinks" style="display:flex;align-items:center;gap:30px;font-size:14px;font-weight:500;">
      <a href="#work"      data-nav="work"      style="color:var(--muted);transition:color .2s;">Work</a>
      <a href="#projects"  data-nav="projects"  style="color:var(--muted);transition:color .2s;">Projects</a>
      <a href="#skills"    data-nav="skills"    style="color:var(--muted);transition:color .2s;">Skills</a>
      <a href="#education" data-nav="education" style="color:var(--muted);transition:color .2s;">Education</a>
    </div>
    <div style="display:flex;align-items:center;gap:18px;">
      <a href="mailto:${esc(d.email)}" style="display:inline-flex;align-items:center;gap:8px;padding:9px 16px;border-radius:10px;background:var(--fg);color:var(--bg);font-weight:600;font-size:14px;transition:transform .2s,box-shadow .2s;">Get in touch</a>
    </div>
  </div>
</nav>

<main id="top" style="position:relative;z-index:1;">

  <!-- HERO -->
  <section class="r-hero" style="max-width:1180px;margin:0 auto;padding:170px 32px 96px;display:grid;grid-template-columns:1.15fr 0.85fr;gap:64px;align-items:center;">
    <div>
      <div data-reveal="" style="display:inline-flex;align-items:center;gap:9px;padding:7px 14px;border:1px solid var(--border);border-radius:100px;background:var(--surface);font-size:13px;font-weight:500;color:var(--muted);">
        <span style="width:8px;height:8px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 4px color-mix(in srgb,var(--accent) 22%,transparent);animation:mrjPulse 2.4s ease-in-out infinite;"></span>
        ${esc(d.availability)}
      </div>
      <div data-reveal="" style="font-family:'JetBrains Mono',monospace;font-size:14px;letter-spacing:0.12em;text-transform:uppercase;color:var(--accent);margin:26px 0 14px;">${esc(d.tagline)}</div>
      <h1 data-reveal="" style="font-size:clamp(38px,6.4vw,84px);font-weight:700;line-height:1.04;letter-spacing:-0.035em;margin:0;"><span style="white-space:nowrap;">${esc(d.name.first)}</span><br>${esc(d.name.last)}</h1>
      <p data-reveal="" style="font-size:clamp(17px,1.6vw,20px);line-height:1.6;color:var(--muted);max-width:540px;margin:26px 0 0;">${esc(d.bio)}</p>
      <div data-reveal="" style="display:flex;flex-wrap:wrap;gap:14px;margin-top:34px;">
        <a href="mailto:${esc(d.email)}" style="display:inline-flex;align-items:center;gap:9px;padding:13px 22px;border-radius:12px;background:var(--accent);color:#06070a;font-weight:600;font-size:15px;transition:transform .2s,box-shadow .2s;">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/></svg>
          Email me
        </a>
        <a href="${esc(d.links.linkedin)}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:9px;padding:13px 22px;border-radius:12px;border:1px solid var(--border);background:var(--surface);color:var(--fg);font-weight:600;font-size:15px;transition:transform .2s,border-color .2s;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8.34 18.34V10.6H5.79v7.74zM7.07 9.47a1.48 1.48 0 1 0 0-2.96 1.48 1.48 0 0 0 0 2.96zm11.27 8.87v-4.24c0-2.27-1.21-3.33-2.83-3.33a2.44 2.44 0 0 0-2.21 1.22h-.03V10.6h-2.45v7.74h2.55v-3.83c0-1.01.19-1.99 1.44-1.99s1.25 1.15 1.25 2.05v3.77z"/></svg>
          LinkedIn
        </a>
        <a href="${esc(d.links.github)}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:9px;padding:13px 22px;border-radius:12px;border:1px solid var(--border);background:var(--surface);color:var(--fg);font-weight:600;font-size:15px;transition:transform .2s,border-color .2s;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.46-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.57 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.72 0 0 .84-.27 2.75 1.05a9.3 9.3 0 0 1 5 0c1.91-1.32 2.75-1.05 2.75-1.05.55 1.42.2 2.46.1 2.72.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.81 0 .27.18.6.69.49A10.02 10.02 0 0 0 22 12.25C22 6.58 17.52 2 12 2z"/></svg>
          GitHub
        </a>
        <a href="${esc(d.links.telegram)}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:9px;padding:13px 22px;border-radius:12px;border:1px solid var(--border);background:var(--surface);color:var(--fg);font-weight:600;font-size:15px;transition:transform .2s,border-color .2s;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21.94 4.66 18.9 19.04c-.23 1.01-.83 1.26-1.68.78l-4.64-3.42-2.24 2.16c-.25.25-.46.46-.94.46l.33-4.73 8.62-7.79c.37-.33-.08-.52-.58-.19L7.43 13.2 2.84 11.76c-1-.31-1.02-1 .21-1.48l17.6-6.79c.83-.31 1.56.19 1.29 1.17z"/></svg>
          Telegram
        </a>
      </div>
      <div data-reveal="" style="display:flex;align-items:center;gap:22px;margin-top:34px;font-size:13.5px;color:var(--faint);font-family:'JetBrains Mono',monospace;">
        <span>📍 ${esc(d.location)}</span>
        <span style="width:4px;height:4px;border-radius:50%;background:var(--faint);"></span>
        ${d.openToRemote ? '<span>Open to remote</span>' : ''}
      </div>
    </div>

    <div data-reveal="" style="transition:opacity .8s ease .3s,transform .8s cubic-bezier(.16,.84,.44,1) .3s;">
      <div style="border:1px solid var(--border);border-radius:20px;background:var(--surface);overflow:hidden;box-shadow:0 30px 80px -40px rgba(0,0,0,0.6);">
        <div style="display:flex;align-items:center;gap:8px;padding:14px 18px;border-bottom:1px solid var(--border);">
          <span style="width:11px;height:11px;border-radius:50%;background:var(--accent2);opacity:.6;"></span>
          <span style="width:11px;height:11px;border-radius:50%;background:var(--accent);opacity:.6;"></span>
          <span style="width:11px;height:11px;border-radius:50%;background:var(--faint);opacity:.6;"></span>
          <span style="margin-left:auto;font-family:'JetBrains Mono',monospace;font-size:12px;color:var(--faint);">currently.go</span>
        </div>
        <div style="padding:24px;">
          <div style="display:flex;align-items:center;gap:8px;font-family:'JetBrains Mono',monospace;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;color:var(--muted);margin-bottom:18px;">
            <span style="width:7px;height:7px;border-radius:50%;background:var(--accent);animation:mrjBlink 1.6s ease-in-out infinite;"></span>
            Currently building
          </div>
          <div style="font-size:21px;font-weight:600;letter-spacing:-0.01em;">${esc(d.currentRole.title)}</div>
          <a href="${esc(d.currentRole.companyUrl)}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:5px;font-size:15px;font-weight:500;color:var(--accent);margin-top:5px;">${esc(d.currentRole.company)}
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M7 17 17 7M9 7h8v8"/></svg>
          </a>
          <p style="font-size:14.5px;line-height:1.6;color:var(--muted);margin:16px 0 0;">${esc(d.currentRole.description)}</p>
          <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:20px;">
            ${d.currentRole.tags.map(t => `<span style="font-family:'JetBrains Mono',monospace;font-size:12px;padding:5px 11px;border-radius:8px;background:var(--surfaceHi);border:1px solid var(--border);color:var(--muted);">${esc(t)}</span>`).join('\n            ')}
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- STATS -->
  <section style="max-width:1180px;margin:0 auto;padding:40px 32px 90px;">
    <div data-reveal="" class="r-grid4" style="display:grid;grid-template-columns:repeat(4,1fr);gap:18px;">
      ${d.stats.map(renderStat).join('')}
    </div>
  </section>

  <!-- EXPERIENCE -->
  <section id="work" style="max-width:1180px;margin:0 auto;padding:70px 32px;scroll-margin-top:90px;">
    <div data-reveal="" style="margin-bottom:54px;">
      <div style="font-family:'JetBrains Mono',monospace;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;color:var(--accent);margin-bottom:14px;">01 — Experience</div>
      <h2 style="font-size:clamp(32px,4.4vw,52px);font-weight:700;letter-spacing:-0.03em;margin:0;">Where I've worked</h2>
    </div>
    <div style="display:flex;flex-direction:column;gap:18px;">
      ${d.experience.map(renderExperienceItem).join('')}
    </div>
  </section>

  <!-- PROJECTS -->
  <section id="projects" style="max-width:1180px;margin:0 auto;padding:70px 32px;scroll-margin-top:90px;">
    <div data-reveal="" style="margin-bottom:54px;">
      <div style="font-family:'JetBrains Mono',monospace;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;color:var(--accent);margin-bottom:14px;">02 — Selected work</div>
      <h2 style="font-size:clamp(32px,4.4vw,52px);font-weight:700;letter-spacing:-0.03em;margin:0;">Projects that scaled</h2>
    </div>
    <div style="display:flex;flex-direction:column;gap:24px;">
      ${d.projects.map(p => p.metrics ? renderProjectFeatured(p) : renderProjectSimple(p)).join('')}
    </div>
  </section>

  <!-- SKILLS -->
  <section id="skills" style="max-width:1180px;margin:0 auto;padding:70px 32px;scroll-margin-top:90px;">
    <div data-reveal="" style="margin-bottom:54px;">
      <div style="font-family:'JetBrains Mono',monospace;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;color:var(--accent);margin-bottom:14px;">03 — Toolkit</div>
      <h2 style="font-size:clamp(32px,4.4vw,52px);font-weight:700;letter-spacing:-0.03em;margin:0;">Skills &amp; technologies</h2>
    </div>
    <div data-reveal="" class="r-grid3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px;">
      ${d.skills.map(renderSkillGroup).join('')}
    </div>
  </section>

  <!-- EDUCATION -->
  <section id="education" style="max-width:1180px;margin:0 auto;padding:70px 32px;scroll-margin-top:90px;">
    <div data-reveal="" style="margin-bottom:54px;">
      <div style="font-family:'JetBrains Mono',monospace;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;color:var(--accent);margin-bottom:14px;">04 — Background</div>
      <h2 style="font-size:clamp(32px,4.4vw,52px);font-weight:700;letter-spacing:-0.03em;margin:0;">Education &amp; honors</h2>
    </div>
    <div data-reveal="" class="r-edu2" style="display:grid;grid-template-columns:1fr 1fr;gap:18px;">
      ${d.education.map(renderEducationDegree).join('')}
    </div>
    <div data-reveal="" class="r-edu3" style="display:grid;grid-template-columns:repeat(3,1fr);gap:18px;margin-top:18px;">
      ${d.honors.map(renderHonor).join('')}
    </div>
  </section>

  <!-- CONTACT -->
  <section id="contact" style="max-width:1180px;margin:0 auto;padding:90px 32px 110px;scroll-margin-top:90px;">
    <div data-reveal="" class="r-contact" style="border:1px solid var(--border);border-radius:24px;background:var(--surface);padding:64px 48px;text-align:center;position:relative;overflow:hidden;">
      <div style="position:absolute;top:-120px;left:50%;transform:translateX(-50%);width:480px;height:280px;background:radial-gradient(circle,var(--accent),transparent 65%);filter:blur(60px);opacity:.14;pointer-events:none;"></div>
      <div style="font-family:'JetBrains Mono',monospace;font-size:13px;letter-spacing:0.14em;text-transform:uppercase;color:var(--accent);margin-bottom:18px;position:relative;">05 — Let's talk</div>
      <h2 style="font-size:clamp(34px,5vw,60px);font-weight:700;letter-spacing:-0.03em;margin:0;line-height:1.05;position:relative;">Let's build something<br>that scales.</h2>
      <p style="font-size:17px;line-height:1.6;color:var(--muted);max-width:480px;margin:22px auto 0;position:relative;">${esc(d.contact.subtext)}</p>
      <div style="display:flex;flex-wrap:wrap;gap:14px;justify-content:center;margin-top:36px;position:relative;">
        <a href="mailto:${esc(d.email)}" style="display:inline-flex;align-items:center;gap:9px;padding:14px 26px;border-radius:12px;background:var(--accent);color:#06070a;font-weight:600;font-size:15px;transition:transform .2s;">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/></svg>
          Email
        </a>
        <a href="${esc(d.links.linkedin)}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:9px;padding:14px 24px;border-radius:12px;border:1px solid var(--border);background:var(--surfaceHi);color:var(--fg);font-weight:600;font-size:15px;transition:transform .2s,border-color .2s;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2zM8.34 18.34V10.6H5.79v7.74zM7.07 9.47a1.48 1.48 0 1 0 0-2.96 1.48 1.48 0 0 0 0 2.96zm11.27 8.87v-4.24c0-2.27-1.21-3.33-2.83-3.33a2.44 2.44 0 0 0-2.21 1.22h-.03V10.6h-2.45v7.74h2.55v-3.83c0-1.01.19-1.99 1.44-1.99s1.25 1.15 1.25 2.05v3.77z"/></svg>
          LinkedIn
        </a>
        <a href="${esc(d.links.github)}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:9px;padding:14px 24px;border-radius:12px;border:1px solid var(--border);background:var(--surfaceHi);color:var(--fg);font-weight:600;font-size:15px;transition:transform .2s,border-color .2s;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.46-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.57 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.72 0 0 .84-.27 2.75 1.05a9.3 9.3 0 0 1 5 0c1.91-1.32 2.75-1.05 2.75-1.05.55 1.42.2 2.46.1 2.72.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.81 0 .27.18.6.69.49A10.02 10.02 0 0 0 22 12.25C22 6.58 17.52 2 12 2z"/></svg>
          GitHub
        </a>
        <a href="${esc(d.links.telegram)}" target="_blank" rel="noopener" style="display:inline-flex;align-items:center;gap:9px;padding:14px 24px;border-radius:12px;border:1px solid var(--border);background:var(--surfaceHi);color:var(--fg);font-weight:600;font-size:15px;transition:transform .2s,border-color .2s;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M21.94 4.66 18.9 19.04c-.23 1.01-.83 1.26-1.68.78l-4.64-3.42-2.24 2.16c-.25.25-.46.46-.94.46l.33-4.73 8.62-7.79c.37-.33-.08-.52-.58-.19L7.43 13.2 2.84 11.76c-1-.31-1.02-1 .21-1.48l17.6-6.79c.83-.31 1.56.19 1.29 1.17z"/></svg>
          Telegram
        </a>
      </div>
    </div>
  </section>

</main>

<footer style="position:relative;z-index:1;border-top:1px solid var(--border);">
  <div style="max-width:1180px;margin:0 auto;padding:30px 32px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px;font-size:13.5px;color:var(--faint);">
    <div>© ${esc(d.meta.year)} ${esc(d.name.first)} ${esc(d.name.last)}</div>
    <div style="font-family:'JetBrains Mono',monospace;">${esc(d.footer.built)}</div>
  </div>
</footer>

<script>
(function() {
  // Count-up animation for data-count elements
  function animateCount(el) {
    var target = parseFloat(el.dataset.count);
    var dec = parseInt(el.dataset.decimals || '0', 10);
    var suf = el.dataset.suffix || '';
    var dur = 1600, start = performance.now();
    var fmt = function(n) { return n.toFixed(dec).replace(/\\B(?=(\\d{3})+(?!\\d))/g, ','); };
    var tick = function(now) {
      var p = Math.min((now - start) / dur, 1);
      p = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * p) + suf;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  // Scroll reveal
  var items = Array.prototype.slice.call(document.querySelectorAll('[data-reveal]'));
  items.forEach(function(el) { el.style.opacity = '0'; el.style.transform = 'translateY(28px)'; });

  function reveal(el, delay) {
    if (el.__revealed) return;
    el.__revealed = true;
    var dur = 680, fromY = 28, start = performance.now() + (delay || 0);
    var step = function(now) {
      var p = (now - start) / dur;
      if (p < 0) { requestAnimationFrame(step); return; }
      p = Math.min(p, 1);
      var e = 1 - Math.pow(1 - p, 3);
      el.style.opacity = String(e);
      el.style.transform = 'translateY(' + ((1 - e) * fromY).toFixed(2) + 'px)';
      if (p < 1) requestAnimationFrame(step);
      else el.style.transform = 'none';
    };
    requestAnimationFrame(step);
    el.querySelectorAll('[data-count]').forEach(animateCount);
  }

  var firstPass = true;
  function check() {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var stagger = 0;
    items.forEach(function(el) {
      if (el.__revealed) return;
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > -40) {
        reveal(el, firstPass ? stagger * 70 : 0);
        stagger++;
      }
    });
    firstPass = false;
  }
  requestAnimationFrame(check);
  window.addEventListener('scroll', check, { passive: true });
  window.addEventListener('resize', check, { passive: true });
  setTimeout(function() {
    items.forEach(function(el) {
      if (el.__revealed) return;
      el.__revealed = true;
      el.style.opacity = '1';
      el.style.transform = 'none';
      el.querySelectorAll('[data-count]').forEach(animateCount);
    });
  }, 3000);

  // Cursor glow
  var glow = document.getElementById('mrj-glow');
  if (glow && window.matchMedia('(pointer:fine)').matches) {
    window.addEventListener('pointermove', function(e) {
      glow.style.opacity = '1';
      glow.style.left = e.clientX + 'px';
      glow.style.top = e.clientY + 'px';
    }, { passive: true });
  }

  // Card hover
  document.querySelectorAll('[data-tilt]').forEach(function(el) {
    el.addEventListener('mouseenter', function() { el.style.borderColor = 'var(--accent)'; el.style.background = 'var(--surfaceHi)'; });
    el.addEventListener('mouseleave', function() { el.style.borderColor = 'var(--border)'; el.style.background = 'var(--surface)'; });
  });

  // Active nav highlight
  var navMap = {};
  document.querySelectorAll('#mrj-navlinks [data-nav]').forEach(function(a) { navMap[a.dataset.nav] = a; });
  var navIo = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      var a = navMap[e.target.id];
      if (!a) return;
      if (e.isIntersecting) {
        Object.values(navMap).forEach(function(x) { x.style.color = 'var(--muted)'; });
        a.style.color = 'var(--fg)';
      }
    });
  }, { rootMargin: '-45% 0px -50% 0px' });
  ['work', 'projects', 'skills', 'education'].forEach(function(id) {
    var s = document.getElementById(id);
    if (s) navIo.observe(s);
  });
})();

// ─── Konami Code ──────────────────────────────────────────────────────────────
(function() {
  var SEQ = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','KeyB','KeyA'];
  var pos = 0;
  document.addEventListener('keydown', function(e) {
    if (e.code === SEQ[pos]) { pos++; } else { pos = e.code === SEQ[0] ? 1 : 0; }
    if (pos < SEQ.length) return;
    pos = 0;
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(8,16,12,0.88);backdrop-filter:blur(8px);animation:mrjFadeIn .25s ease;';
    overlay.innerHTML = '<div style="font-family:\\'JetBrains Mono\\',monospace;text-align:center;padding:48px 56px;border:1px solid var(--accent);border-radius:20px;background:var(--surface);box-shadow:0 0 80px -20px var(--accent);">' +
      '<div style="font-size:13px;letter-spacing:0.14em;text-transform:uppercase;color:var(--accent);margin-bottom:20px;">cheat code activated</div>' +
      '<div style="font-size:42px;font-weight:700;letter-spacing:-0.03em;margin-bottom:12px;">+30 <span style="color:var(--accent);">respect</span></div>' +
      '<div style="font-size:15px;color:var(--muted);margin-bottom:8px;">you know the old ways.</div>' +
      '<div style="font-size:13px;color:var(--faint);margin-top:24px;">↑↑↓↓←→←→BA &nbsp;·&nbsp; press Esc to close</div>' +
      '</div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', function() { overlay.remove(); });
    document.addEventListener('keydown', function esc(e) { if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', esc); } });
  });
})();

// ─── Console ──────────────────────────────────────────────────────────────────
console.log(
  '%c[mrj]%c 2026/06/19 main.go:1  %chey, you open devtools too.%c\\n\\n' +
  '  role      \\u2192  AI Software Engineer \\u00b7 Go & Backend\\n' +
  '  stack     \\u2192  Go, Python, Django, LLMs, Event Streaming\\n' +
  '  location  \\u2192  Tehran, Iran  \\u00b7  open to remote\\n' +
  '  github    \\u2192  github.com/mhmdreza\\n' +
  '  email     \\u2192  mrezajafarzade98@gmail.com\\n\\n' +
  '  if you\\'re hiring: let\\'s talk.',
  'background:#08100c;color:#34d27e;font-family:monospace;font-weight:700;padding:2px 6px;border-radius:4px;',
  'color:#566a5e;font-family:monospace;',
  'color:#e9f3ec;font-family:monospace;font-size:15px;font-weight:600;',
  'color:#93a89c;font-family:monospace;line-height:1.9;'
);
</script>

</body>
</html>`;

function render404() {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>404 — Page Not Found</title>
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; font-family: 'Space Grotesk', sans-serif; background: var(--bg, #08100c); color: var(--fg, #e9f3ec); -webkit-font-smoothing: antialiased; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; }
  :root {
    --bg: #08100c; --bg2: #0c1611; --surface: #101c16; --surfaceHi: #16251d;
    --border: rgba(255,255,255,0.08); --fg: #e9f3ec; --muted: #93a89c;
    --faint: #566a5e; --accent: #34d27e; --accent2: #2bb3a6;
    --glow: rgba(52,210,126,0.16);
  }
  @media (prefers-color-scheme: light) {
    :root {
      --bg: #f3f6f3; --bg2: #ffffff; --surface: #ffffff; --surfaceHi: #f6faf6;
      --border: rgba(16,40,28,0.10); --fg: #11201a; --muted: #51635a;
      --faint: #93a89c; --accent: #0f9d63; --accent2: #0e8a7c;
      --glow: rgba(15,157,99,0.10);
    }
  }
  ::selection { background: var(--accent); color: #06070a; }
  a { color: inherit; text-decoration: none; }
  @keyframes mrjFloatA { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(40px,-30px) scale(1.08); } }
  @keyframes mrjFloatB { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-50px,40px) scale(1.12); } }
  @keyframes mrjBlink { 0%,100% { opacity: 1; } 50% { opacity: .25; } }
  @keyframes mrjFadeUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: none; } }
  @keyframes mrjGlitch {
    0%,100% { clip-path: inset(0 0 100% 0); transform: translate(0); }
    5%       { clip-path: inset(20% 0 60% 0); transform: translate(-4px, 2px); }
    10%      { clip-path: inset(50% 0 30% 0); transform: translate(4px, -2px); }
    15%      { clip-path: inset(80% 0 5%  0); transform: translate(-2px, 1px); }
    20%,80%  { clip-path: inset(0 0 100% 0); transform: translate(0); }
  }
  .f404-num {
    font-size: clamp(96px, 22vw, 180px);
    font-weight: 700;
    letter-spacing: -0.06em;
    line-height: 1;
    color: var(--accent);
    margin: 0;
    position: relative;
    display: inline-block;
  }
  .f404-num::before, .f404-num::after {
    content: '404';
    position: absolute;
    inset: 0;
    color: var(--accent2);
    opacity: 0.5;
    animation: mrjGlitch 5s ease-in-out infinite;
  }
  .f404-num::after { animation-delay: 0.3s; color: var(--fg); opacity: 0.12; }
  .f404-terminal {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 14px 20px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 13px;
    color: var(--muted);
    margin: 28px 0 20px;
    text-align: left;
    animation: mrjFadeUp .7s cubic-bezier(.16,.84,.44,1) .15s both;
  }
  .f404-terminal .prompt { color: var(--accent); font-weight: 500; }
  .f404-terminal .cursor {
    display: inline-block;
    width: 8px;
    height: 14px;
    background: var(--accent);
    border-radius: 2px;
    margin-left: 4px;
    vertical-align: middle;
    animation: mrjBlink 1.2s ease-in-out infinite;
  }
  .f404-btn {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    padding: 13px 24px;
    border-radius: 12px;
    background: var(--accent);
    color: #06070a;
    font-weight: 600;
    font-size: 15px;
    font-family: 'Space Grotesk', sans-serif;
    transition: transform .2s, box-shadow .2s;
    animation: mrjFadeUp .7s cubic-bezier(.16,.84,.44,1) .45s both;
  }
  .f404-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 28px -8px var(--glow); }
</style>
</head>
<body>

<div style="position:fixed;inset:0;overflow:hidden;pointer-events:none;z-index:0;">
  <div style="position:absolute;top:-160px;right:-120px;width:520px;height:520px;border-radius:50%;background:radial-gradient(circle,var(--accent),transparent 68%);filter:blur(60px);opacity:.16;animation:mrjFloatA 18s ease-in-out infinite;"></div>
  <div style="position:absolute;bottom:-180px;left:-140px;width:560px;height:560px;border-radius:50%;background:radial-gradient(circle,var(--accent2),transparent 68%);filter:blur(70px);opacity:.14;animation:mrjFloatB 22s ease-in-out infinite;"></div>
  <div style="position:absolute;inset:0;background-image:radial-gradient(var(--border) 1px,transparent 1px);background-size:46px 46px;opacity:.5;mask-image:radial-gradient(ellipse 80% 60% at 50% 50%,#000,transparent 75%);-webkit-mask-image:radial-gradient(ellipse 80% 60% at 50% 50%,#000,transparent 75%);"></div>
</div>

<div style="position:relative;z-index:1;text-align:center;padding:32px 24px;max-width:540px;width:100%;">
  <div style="animation:mrjFadeUp .6s cubic-bezier(.16,.84,.44,1) both;">
    <span class="f404-num">404</span>
  </div>

  <div class="f404-terminal">
    <span class="prompt">[mrj]</span>
    <span>404 not_found.go:1&nbsp;&nbsp;this page got lost.</span>
    <span class="cursor"></span>
  </div>

  <p style="font-size:16px;color:var(--faint);margin:0 0 36px;animation:mrjFadeUp .7s cubic-bezier(.16,.84,.44,1) .3s both;">this route doesn't exist.</p>

  <a href="/" class="f404-btn">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12L12 3l9 9"/><path d="M9 21V12h6v9"/></svg>
    Go home
  </a>
</div>

</body>
</html>`;
}

const outDir = 'dist';
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir);
fs.writeFileSync(path.join(outDir, 'index.html'), html, 'utf8');
fs.copyFileSync('snake_dark.svg', path.join(outDir, 'favicon.svg'));
console.log('Built dist/index.html (' + Math.round(Buffer.byteLength(html) / 1024) + ' KB)');

const html404 = render404();
fs.writeFileSync(path.join(outDir, '404.html'), html404, 'utf8');
console.log('Built dist/404.html (' + Math.round(Buffer.byteLength(html404) / 1024) + ' KB)');
