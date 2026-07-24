import { extractSemanticColors } from './palette-utils.js';

const PREVIEW_SHELL = `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>ChromaStudio Preview</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Inter',sans-serif;background:var(--background);color:var(--foreground);min-height:100vh}
nav{display:flex;align-items:center;justify-content:space-between;padding:18px 40px;background:color-mix(in srgb,var(--background) 88%,transparent);backdrop-filter:blur(12px);border-bottom:1px solid color-mix(in srgb,var(--foreground) 8%,transparent);position:sticky;top:0;z-index:10}
.logo{font-weight:800;font-size:17px}
.links{display:flex;gap:22px}.links a{color:var(--foreground);opacity:.6;text-decoration:none;font-size:13px;font-weight:500}
.btn{padding:10px 20px;border-radius:8px;border:none;font-weight:700;cursor:pointer;font-family:inherit;font-size:13px}
.btn-primary{background:var(--primary);color:var(--primary-text)}
.btn-secondary{background:transparent;color:var(--foreground);border:1.5px solid color-mix(in srgb,var(--foreground) 20%,transparent)}
.hero{padding:100px 40px 80px;text-align:center;max-width:760px;margin:0 auto}
.hero h1{font-size:clamp(36px,5vw,62px);font-weight:800;line-height:1.08;letter-spacing:-2px;margin-bottom:18px}
.hero h1 span{color:var(--primary)}
.hero p{opacity:.62;line-height:1.7;margin-bottom:32px;font-size:16px}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;padding:40px;max-width:1100px;margin:0 auto}
.card{padding:24px;border-radius:12px;background:var(--card);color:var(--card-text);border:1px solid color-mix(in srgb,var(--foreground) 8%,transparent)}
.card h3{font-size:16px;margin-bottom:8px}
.card p{font-size:13px;opacity:.65;line-height:1.6}
.kpi-row{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;padding:0 40px 40px;max-width:1100px;margin:0 auto}
.kpi{padding:18px;border-radius:10px;background:var(--card);border:1px solid color-mix(in srgb,var(--foreground) 8%,transparent)}
.kpi-val{font-size:28px;font-weight:800;color:var(--primary)}
.kpi-lbl{font-size:11px;opacity:.45;text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px}
.badge{display:inline-block;padding:3px 10px;border-radius:100px;font-size:10px;font-weight:700;background:var(--accent);color:var(--accent-text)}
.input-demo{width:100%;padding:9px 12px;border-radius:8px;border:1px solid color-mix(in srgb,var(--foreground) 15%,transparent);background:var(--background);color:var(--foreground);font-family:inherit;font-size:13px;margin-top:8px}
.alert{padding:10px 14px;border-radius:8px;background:color-mix(in srgb,var(--destructive) 15%,transparent);color:var(--destructive);font-size:12px;font-weight:600;margin-top:10px}
.layout-dashboard{display:flex;min-height:100vh}
aside{width:200px;background:color-mix(in srgb,var(--background) 80%,#000);padding:20px 12px;border-right:1px solid color-mix(in srgb,var(--foreground) 8%,transparent)}
aside .item{padding:9px 10px;border-radius:8px;font-size:13px;opacity:.55;margin-bottom:3px}
aside .item.active{background:var(--primary);color:var(--primary-text);opacity:1}
main{flex:1;padding:28px}
.product-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:16px;padding:40px;max-width:1100px;margin:0 auto}
.product{background:var(--card);border-radius:12px;overflow:hidden;border:1px solid color-mix(in srgb,var(--foreground) 8%,transparent)}
.product-img{height:140px;background:color-mix(in srgb,var(--primary) 20%,var(--card))}
.product-body{padding:14px}
.price{color:var(--primary);font-weight:800;font-size:17px;margin-top:6px}
footer{padding:28px 40px;text-align:center;opacity:.35;font-size:12px;border-top:1px solid color-mix(in srgb,var(--foreground) 8%,transparent)}
@media(max-width:700px){.links{display:none}aside{display:none}}
</style></head><body>`;

const TEMPLATES = {
  landing: `
<nav><div class="logo">★ Brand</div><div class="links"><a href="#">Product</a><a href="#">Pricing</a><a href="#">Docs</a></div><button class="btn btn-primary">Get Started</button></nav>
<section class="hero"><h1>Design with <span>Color</span><br>Build with Confidence</h1><p>Professional color studio powered by OKLCH design tokens and perceptual harmony.</p><div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap"><button class="btn btn-primary">Start Free →</button><button class="btn btn-secondary">Watch Demo</button></div></section>
<div class="grid"><div class="card"><h3>Smart Palettes</h3><p>Generate harmonious palettes using OKLCH perceptual color space.</p></div><div class="card"><h3>Instant Export</h3><p>Export to shadcn, Figma, Tailwind, and OKLCH CSS variables.</p></div><div class="card"><h3>Accessible</h3><p>WCAG 2.1 and APCA contrast checking built in.</p></div></div>
<footer>© 2025 ChromaStudio · Built with your palette</footer>`,

  dashboard: `
<div class="layout-dashboard"><aside><div class="logo" style="padding:8px 10px 20px">◈ Dashboard</div><div class="item active">Overview</div><div class="item">Analytics</div><div class="item">Projects</div><div class="item">Settings</div></aside>
<main><h1 style="font-size:22px;font-weight:800;margin-bottom:4px">Overview</h1><p style="opacity:.4;font-size:13px;margin-bottom:22px">Your palette in action</p>
<div class="kpi-row"><div class="kpi"><div class="kpi-lbl">Revenue</div><div class="kpi-val">$48.2K</div></div><div class="kpi"><div class="kpi-lbl">Users</div><div class="kpi-val">3,842</div></div><div class="kpi"><div class="kpi-lbl">NPS</div><div class="kpi-val">74</div></div></div>
<div class="grid" style="padding-top:0"><div class="card"><h3>Monthly Revenue</h3><div style="display:flex;align-items:flex-end;gap:5px;height:80px;margin-top:14px" id="bars"></div></div><div class="card"><h3>Status</h3><p>All systems operational</p><span class="badge" style="margin-top:10px;display:inline-block">Healthy</span></div></div></main></div>`,

  portfolio: `
<nav><div class="logo">Alex Design</div><div class="links"><a href="#">Work</a><a href="#">About</a><a href="#">Contact</a></div></nav>
<section class="hero" style="text-align:left;max-width:900px"><h1>I craft <span>beautiful</span> digital experiences</h1><p>Creative developer open to freelance — palette-driven design system.</p><button class="btn btn-primary">View My Work →</button></section>
<div class="grid"><div class="card"><h3>Brand Identity</h3><p>Visual design & strategy</p></div><div class="card"><h3>Mobile App</h3><p>UI/UX design</p></div><div class="card"><h3>Web Platform</h3><p>Full-stack development</p></div></div>
<footer>© 2025 Alex Design · ChromaStudio</footer>`,

  ecommerce: `
<nav><div class="logo">✦ Shop</div><div class="links"><a href="#">Men</a><a href="#">Women</a><a href="#">Sale</a></div><button class="btn btn-primary">🛒 Cart</button></nav>
<section class="hero"><h1>New Season,<br>New Colors</h1><p>Discover our latest collection inspired by your ChromaStudio palette.</p><button class="btn btn-primary">Shop Now →</button></section>
<div class="product-grid"><div class="product"><div class="product-img"></div><div class="product-body"><strong>Palette Tee</strong><div class="price">$42</div></div></div><div class="product"><div class="product-img"></div><div class="product-body"><strong>Studio Mug</strong><div class="price">$28</div></div></div><div class="product"><div class="product-img"></div><div class="product-body"><strong>Color Book</strong><div class="price">$59</div></div></div></div>
<footer>© 2025 Shop · ChromaStudio Demo</footer>`,
};

function cssVariablesFromPalette(palette) {
  const semantic = extractSemanticColors(palette);
  return {
    '--background': semantic.background,
    '--foreground': semantic.foreground,
    '--primary': semantic.primary,
    '--primary-text': semantic.primaryText,
    '--secondary': semantic.secondary,
    '--secondary-text': semantic.secondaryText,
    '--accent': semantic.accent,
    '--accent-text': semantic.accentText,
    '--muted': semantic.muted,
    '--muted-text': semantic.mutedText,
    '--card': semantic.card,
    '--card-text': semantic.cardText,
    '--destructive': semantic.destructive,
  };
}

/** Apply theme tokens directly to an already-loaded preview document. */
export function injectPreviewVariables(previewDocument, palette) {
  if (!previewDocument?.documentElement) return;
  const style = previewDocument.documentElement.style;
  Object.entries(cssVariablesFromPalette(palette)).forEach(([name, value]) => {
    style.setProperty(name, value);
  });
}

export function openPreview(type, palette) {
  const template = TEMPLATES[type];
  if (!template) return;

  const previewWindow = window.open('', '_blank');
  if (previewWindow) {
    // The host stays lightweight; the structural layout loads once in an iframe
    // and palette changes are raw CSS custom-property mutations, not HTML rebuilds.
    previewWindow.document.write(`<!doctype html><html><head><title>ChromaStudio Preview</title><style>html,body,iframe{width:100%;height:100%;margin:0;border:0;background:#111}</style></head><body><iframe id="preview-frame" title="${type} preview"></iframe></body></html>`);
    previewWindow.document.close();
    const frame = previewWindow.document.getElementById('preview-frame');
    frame.srcdoc = `${PREVIEW_SHELL}${template}</body></html>`;
    const applyTheme = () => {
      injectPreviewVariables(frame.contentDocument, palette);
      if (type === 'dashboard') {
        const bars = frame.contentDocument?.getElementById('bars');
        if (bars) {
          bars.innerHTML = [42, 58, 35, 74, 61, 88, 52, 79]
            .map((height, index) => `<div style="flex:1;height:${height}%;background:${palette[index % palette.length]};border-radius:4px 4px 0 0;opacity:.75"></div>`)
            .join('');
        }
      }
    };
    frame.addEventListener('load', applyTheme, { once: true });
    previewWindow.chromaStudioApplyPalette = (nextPalette) => injectPreviewVariables(frame.contentDocument, nextPalette);
  }
  return previewWindow;
}

export const PREVIEW_CARDS = [
  { type: 'landing', emoji: '🚀', title: 'Landing Page', desc: 'Hero, features & CTA — CSS variable injection' },
  { type: 'dashboard', emoji: '📊', title: 'Admin Dashboard', desc: 'KPIs, charts & sidebar layout' },
  { type: 'portfolio', emoji: '🎨', title: 'Portfolio Site', desc: 'Creative portfolio with semantic tokens' },
  { type: 'ecommerce', emoji: '🛍️', title: 'E-Commerce Store', desc: 'Product grid & checkout UI' },
];
