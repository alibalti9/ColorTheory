// ══ PREVIEW BUILDERS ══
// All buildX() functions called by buildSite() in script.js

console.log('preview-builders.js loaded');

// Attach functions to window for global access
window.buildDashboard = function(p) {
  console.log('buildDashboard called with palette:', p);
  const c1=p[0],c2=p[1]||p[0],c3=p[2]||p[0],c4=p[3]||p[0],t1=textOn(c1),t2=textOn(c2);
  const bars=[42,58,35,74,61,88,52,79,65,91,47,84];
  const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Dashboard</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',sans-serif;background:${c1};color:${t1};display:flex;min-height:100vh}
aside{width:220px;background:rgba(0,0,0,.25);border-right:1px solid rgba(255,255,255,.07);padding:20px 12px;display:flex;flex-direction:column;gap:2px;flex-shrink:0;transition:width .2s}
.sb-logo{font-size:15px;font-weight:800;padding:8px 10px 22px;letter-spacing:-.4px}
.sb-sec{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.4px;opacity:.3;padding:12px 10px 5px}
.sb-item{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:8px;cursor:pointer;font-size:13px;font-weight:500;opacity:.5;transition:all .15s;user-select:none}
.sb-item:hover{background:rgba(255,255,255,.07);opacity:.85}
.sb-item.active{background:${c2};color:${t2};opacity:1}
.sb-dot{width:7px;height:7px;border-radius:50%;flex-shrink:0;background:currentColor}
main{flex:1;padding:28px;overflow-y:auto;min-width:0}
.pg-hdr{display:flex;align-items:center;justify-content:space-between;margin-bottom:22px}
.pg-title{font-size:20px;font-weight:800;letter-spacing:-.5px}
.pg-sub{font-size:12px;opacity:.38;margin-top:2px}
.add-btn{padding:8px 16px;background:${c2};color:${t2};border:none;border-radius:7px;font-weight:700;font-size:12px;font-family:inherit;cursor:pointer;transition:opacity .15s}.add-btn:hover{opacity:.85}
.kpi-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin-bottom:20px}
.kpi{padding:18px;border-radius:11px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.07);cursor:default;transition:transform .15s}.kpi:hover{transform:translateY(-2px)}
.kpi-lbl{font-size:10px;opacity:.42;font-weight:600;text-transform:uppercase;letter-spacing:.8px;margin-bottom:7px}
.kpi-val{font-size:28px;font-weight:800;letter-spacing:-1px;margin-bottom:3px}
.kpi-ch{font-size:11px;font-weight:600}.up{color:#34d399}.dn{color:#f87171}
.ch-row{display:grid;grid-template-columns:2fr 1fr;gap:12px;margin-bottom:20px}
.ch-card{padding:18px;border-radius:11px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.07)}
.ch-title{font-size:12px;font-weight:700;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between}
.bar-chart{display:flex;align-items:flex-end;gap:5px;height:110px}
.bar{flex:1;border-radius:4px 4px 0 0;cursor:pointer;position:relative;transition:opacity .15s}.bar:hover{opacity:.8}
.bar-tip{display:none;position:absolute;bottom:calc(100%+6px);left:50%;transform:translateX(-50%);background:#111;color:#eee;font-size:10px;padding:3px 7px;border-radius:5px;white-space:nowrap;border:1px solid rgba(255,255,255,.12);pointer-events:none}
.bar:hover .bar-tip{display:block}
.bar-lbl{position:absolute;bottom:-16px;left:50%;transform:translateX(-50%);font-size:8px;opacity:.4;white-space:nowrap}
.pie-list{display:flex;flex-direction:column;gap:8px}
.pie-item{display:flex;align-items:center;gap:9px;font-size:12px}
.pie-dot{width:9px;height:9px;border-radius:2px;flex-shrink:0}
.pie-lbl{flex:1;opacity:.65}.pie-bar{height:4px;border-radius:2px;margin-top:3px;transition:width .6s}
.pie-pct{font-weight:700;font-size:11px;font-family:monospace}
.tbl-card{padding:18px;border-radius:11px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.07)}
.tbl-title{font-size:12px;font-weight:700;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between}
.tbl-search{padding:5px 10px;border-radius:6px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:${t1};font-size:11px;font-family:inherit;outline:none;width:130px;transition:border-color .15s}.tbl-search:focus{border-color:${c2}}
table{width:100%;border-collapse:collapse}
th{text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.8px;opacity:.35;padding:0 12px 10px 0;cursor:pointer;user-select:none}
th:hover{opacity:.7}
td{padding:10px 12px 10px 0;font-size:12px;border-top:1px solid rgba(255,255,255,.05)}
tr:hover td{background:rgba(255,255,255,.02)}
.bdg{padding:2px 8px;border-radius:100px;font-size:10px;font-weight:600;display:inline-block}
.bg{background:rgba(52,211,153,.15);color:#34d399}.by{background:rgba(251,191,36,.12);color:#fbbf24}.br{background:rgba(248,113,113,.12);color:#f87171}
.pages{display:none}
.page.active{display:block}
#toast-msg{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#111;color:#eee;padding:7px 16px;border-radius:7px;font-size:11px;font-weight:600;border:1px solid rgba(255,255,255,.12);opacity:0;transition:opacity .25s;pointer-events:none;z-index:9999}
#toast-msg.show{opacity:1}
@media(max-width:700px){aside{display:none}main{padding:16px}}
</style></head><body>
<aside>
  <div class="sb-logo">◈ Dashboard</div>
  <div class="sb-sec">Main</div>
  <div class="sb-item active" onclick="navTo(this,'page-overview')"><div class="sb-dot" style="background:${c2}"></div>Overview</div>
  <div class="sb-item" onclick="navTo(this,'page-analytics')"><div class="sb-dot" style="background:${c3}"></div>Analytics</div>
  <div class="sb-item" onclick="navTo(this,'page-projects')"><div class="sb-dot" style="background:${c4}"></div>Projects</div>
  <div class="sb-item" onclick="navTo(this,'page-team')"><div class="sb-dot"></div>Team</div>
  <div class="sb-sec">System</div>
  <div class="sb-item" onclick="showT('⚙ Settings coming soon')"><div class="sb-dot"></div>Settings</div>
  <div class="sb-item" onclick="showT('💬 Help center opening...')"><div class="sb-dot"></div>Help</div>
</aside>
<main>
  <div id="page-overview" class="page active">
    <div class="pg-hdr"><div><div class="pg-title">Overview</div><div class="pg-sub">Your palette in action</div></div><button class="add-btn" onclick="showT('+ New report created')">+ New Report</button></div>
    <div class="kpi-grid">
      <div class="kpi"><div class="kpi-lbl">Revenue</div><div class="kpi-val" style="color:${c2}">$48.2K</div><div class="kpi-ch up">↑ 12.4% vs last month</div></div>
      <div class="kpi"><div class="kpi-lbl">Active Users</div><div class="kpi-val">3,842</div><div class="kpi-ch up">↑ 8.1% this week</div></div>
      <div class="kpi"><div class="kpi-lbl">Churn Rate</div><div class="kpi-val">2.3%</div><div class="kpi-ch dn">↑ 0.4% vs last period</div></div>
      <div class="kpi"><div class="kpi-lbl">NPS Score</div><div class="kpi-val">74</div><div class="kpi-ch up">↑ 3 pts this quarter</div></div>
    </div>
    <div class="ch-row">
      <div class="ch-card">
        <div class="ch-title"><span>Monthly Revenue</span><select onchange="showT('Chart updated')" style="background:transparent;border:1px solid rgba(255,255,255,.1);color:${t1};padding:3px 6px;border-radius:5px;font-size:10px;font-family:inherit">${['2024','2025'].map(y=>`<option>${y}</option>`).join('')}</select></div>
        <div class="bar-chart">${bars.map((v,i)=>`<div class="bar" style="height:${v}%;background:${p[i%p.length]};opacity:${i===11?1:.65}"><div class="bar-tip">$${(v*0.58).toFixed(1)}K</div><div class="bar-lbl">${months[i]}</div></div>`).join('')}</div>
      </div>
      <div class="ch-card">
        <div class="ch-title">Traffic Sources</div>
        <div class="pie-list">${p.slice(0,5).map((c,i)=>{const lb=['Organic','Direct','Referral','Social','Email'];const pc=[38,25,18,12,7];return `<div class="pie-item"><div class="pie-dot" style="background:${c}"></div><div style="flex:1"><div style="display:flex;justify-content:space-between"><span class="pie-lbl">${lb[i]}</span><span class="pie-pct">${pc[i]}%</span></div><div class="pie-bar" style="width:${pc[i]*2.6}%;background:${c}"></div></div></div>`;}).join('')}</div>
      </div>
    </div>
    <div class="tbl-card">
      <div class="tbl-title"><span>Recent Transactions</span><input class="tbl-search" id="tbl-q" placeholder="Search..." oninput="filterTbl(this.value)"></div>
      <table><thead><tr><th onclick="showT('Sorted by name')">Client ↕</th><th onclick="showT('Sorted by amount')">Amount ↕</th><th>Date</th><th>Status</th><th></th></tr></thead>
      <tbody id="tbl-body">
        <tr><td>Acme Corp</td><td style="font-family:monospace">$4,200</td><td>Today, 09:41</td><td><span class="bdg bg">Paid</span></td><td><button onclick="showT('↓ Invoice downloaded')" style="background:transparent;border:none;color:inherit;opacity:.5;cursor:pointer;font-size:11px">↓</button></td></tr>
        <tr><td>Stark Industries</td><td style="font-family:monospace">$12,500</td><td>Yesterday</td><td><span class="bdg by">Pending</span></td><td><button onclick="showT('🔔 Reminder sent')" style="background:transparent;border:none;color:inherit;opacity:.5;cursor:pointer;font-size:11px">🔔</button></td></tr>
        <tr><td>Wayne Enterprises</td><td style="font-family:monospace">$8,750</td><td>Dec 18</td><td><span class="bdg bg">Paid</span></td><td><button onclick="showT('↓ Invoice downloaded')" style="background:transparent;border:none;color:inherit;opacity:.5;cursor:pointer;font-size:11px">↓</button></td></tr>
        <tr><td>Umbrella Co.</td><td style="font-family:monospace">$2,100</td><td>Dec 17</td><td><span class="bdg br">Failed</span></td><td><button onclick="showT('🔁 Retry initiated')" style="background:transparent;border:none;color:inherit;opacity:.5;cursor:pointer;font-size:11px">🔁</button></td></tr>
        <tr><td>Globex Corp</td><td style="font-family:monospace">$6,300</td><td>Dec 15</td><td><span class="bdg bg">Paid</span></td><td><button onclick="showT('↓ Invoice downloaded')" style="background:transparent;border:none;color:inherit;opacity:.5;cursor:pointer;font-size:11px">↓</button></td></tr>
      </tbody></table>
    </div>
  </div>
  <div id="page-analytics" class="page" style="display:none"><div class="pg-hdr"><div><div class="pg-title">Analytics</div><div class="pg-sub">Performance metrics</div></div></div><div class="kpi-grid"><div class="kpi"><div class="kpi-lbl">Page Views</div><div class="kpi-val" style="color:${c2}">182K</div><div class="kpi-ch up">↑ 22% this month</div></div><div class="kpi"><div class="kpi-lbl">Sessions</div><div class="kpi-val">41.2K</div><div class="kpi-ch up">↑ 15%</div></div><div class="kpi"><div class="kpi-lbl">Bounce Rate</div><div class="kpi-val">38%</div><div class="kpi-ch dn">↑ 2%</div></div></div></div>
  <div id="page-projects" class="page" style="display:none"><div class="pg-hdr"><div><div class="pg-title">Projects</div><div class="pg-sub">Active workstreams</div></div><button class="add-btn" onclick="showT('+ New project created')">+ New Project</button></div><div class="kpi-grid">${['Design System','Web App','Mobile SDK','API v3'].map((n,i)=>`<div class="kpi" style="cursor:pointer" onclick="showT('Opened: ${n}')"><div class="kpi-lbl">${n}</div><div style="height:4px;background:rgba(255,255,255,.1);border-radius:2px;margin:8px 0"><div style="height:4px;background:${p[i%p.length]};border-radius:2px;width:${[72,45,88,31][i]}%"></div></div><div class="kpi-ch" style="opacity:.5">${[72,45,88,31][i]}% complete</div></div>`).join('')}</div></div>
  <div id="page-team" class="page" style="display:none"><div class="pg-hdr"><div><div class="pg-title">Team</div><div class="pg-sub">Members & roles</div></div><button class="add-btn" onclick="showT('+ Invite sent')">+ Invite</button></div><div style="display:flex;flex-direction:column;gap:8px;margin-top:4px">${['Alex Kim','Sam Rivera','Jordan Lee','Taylor Chen'].map((n,i)=>`<div style="display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:10px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.07);cursor:pointer" onclick="showT('Viewing ${n}')"><div style="width:34px;height:34px;border-radius:50%;background:${p[i%p.length]};display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px">${n[0]}</div><div style="flex:1"><div style="font-weight:600;font-size:13px">${n}</div><div style="font-size:11px;opacity:.45">${['Designer','Engineer','Product','Engineer'][i]}</div></div><span class="bdg bg">Active</span></div>`).join('')}</div></div>
</main>
<div id="toast-msg"></div>
<script>
function showT(msg){const t=document.getElementById('toast-msg');t.textContent=msg;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2000)}
function navTo(el,pid){document.querySelectorAll('.sb-item').forEach(i=>i.classList.remove('active'));el.classList.add('active');document.querySelectorAll('.page').forEach(p=>p.style.display='none');const pg=document.getElementById(pid);if(pg)pg.style.display='block'}
function filterTbl(q){document.querySelectorAll('#tbl-body tr').forEach(r=>{r.style.display=r.textContent.toLowerCase().includes(q.toLowerCase())?'':'none'})}
</script></body></html>`;
}
console.log('buildDashboard function defined');

window.buildPortfolio = function(p) {
  console.log('buildPortfolio called with palette:', p);
  const c1=p[0],c2=p[1]||p[0],c3=p[2]||p[0],t1=textOn(c1),t2=textOn(c2);
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Portfolio</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',sans-serif;background:${c1};color:${t1}}
.nav{display:flex;align-items:center;justify-content:space-between;padding:20px 48px;position:sticky;top:0;z-index:10;backdrop-filter:blur(16px);background:${c1}cc;border-bottom:1px solid rgba(255,255,255,.05)}
.logo{font-weight:800;font-size:16px}
.links{display:flex;gap:22px}.links a{text-decoration:none;color:${t1};opacity:.5;font-size:13px;font-weight:500;transition:all .15s}.links a:hover{opacity:1}
.links a.active{opacity:1;color:${c2};border-bottom:2px solid ${c2};padding-bottom:2px}
.hero{padding:100px 48px 70px;max-width:940px}
.tag{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:2px;color:${c2};margin-bottom:16px}
h1{font-size:clamp(38px,6vw,70px);font-weight:800;line-height:1.06;letter-spacing:-2.5px;margin-bottom:20px}
h1 em{font-style:normal;background:linear-gradient(135deg,${c2},${c3});-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
.sub{font-size:16px;opacity:.52;line-height:1.75;max-width:480px;margin-bottom:34px}
.acts{display:flex;gap:12px;flex-wrap:wrap}
.btn-m{padding:12px 28px;background:${c2};color:${t2};border:none;border-radius:8px;font-weight:700;font-size:13px;font-family:inherit;cursor:pointer;transition:opacity .15s}.btn-m:hover{opacity:.85}
.btn-o{padding:12px 28px;background:transparent;color:${t1};border:1.5px solid rgba(255,255,255,.18);border-radius:8px;font-weight:600;font-size:13px;font-family:inherit;cursor:pointer;transition:background .15s}.btn-o:hover{background:rgba(255,255,255,.07)}
.section{padding:60px 48px;max-width:1100px;margin:0 auto}
.sec-lbl{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:2px;opacity:.3;margin-bottom:20px}
.w-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:14px}
.w-card{border-radius:13px;overflow:hidden;cursor:pointer;transition:transform .2s}.w-card:hover{transform:translateY(-5px)}
.w-img{height:190px;display:flex;align-items:center;justify-content:center;font-size:36px}
.w-meta{padding:14px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.07);border-top:none}
.w-meta h3{font-size:14px;font-weight:700;margin-bottom:3px}.w-meta p{font-size:11px;opacity:.45}
.skills-sec{padding:50px 48px;background:rgba(255,255,255,.025)}
.chips{display:flex;gap:9px;flex-wrap:wrap;max-width:1000px;margin:0 auto}
.chip{padding:7px 15px;border-radius:100px;font-size:12px;font-weight:600;border:1.5px solid;cursor:pointer;transition:all .15s}.chip:hover{transform:scale(1.05)}
.contact{padding:60px 48px;max-width:540px;margin:0 auto}
.form-row{margin-bottom:14px}
label{display:block;font-size:11px;font-weight:600;opacity:.5;text-transform:uppercase;letter-spacing:.8px;margin-bottom:6px}
.inp{width:100%;padding:10px 13px;border-radius:8px;border:1.5px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:${t1};font-size:13px;font-family:inherit;outline:none;transition:border-color .15s}.inp:focus{border-color:${c2}}
textarea.inp{height:90px;resize:vertical}
.send-btn{width:100%;padding:12px;background:${c2};color:${t2};border:none;border-radius:8px;font-weight:700;font-size:14px;font-family:inherit;cursor:pointer;transition:opacity .15s}.send-btn:hover{opacity:.85}
footer{padding:32px 48px;border-top:1px solid rgba(255,255,255,.06);display:flex;justify-content:space-between;opacity:.3;font-size:11px;flex-wrap:wrap;gap:8px}
.modal-bg{display:none;position:fixed;inset:0;background:rgba(0,0,0,.6);backdrop-filter:blur(4px);z-index:200;align-items:center;justify-content:center}
.modal-bg.open{display:flex}
.modal{background:#1a1a1a;border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:28px;max-width:420px;width:90%;position:relative}
.modal h3{font-size:17px;font-weight:800;margin-bottom:8px}.modal p{font-size:13px;opacity:.55;line-height:1.6;margin-bottom:20px}
.modal-close{position:absolute;top:12px;right:14px;background:transparent;border:none;color:inherit;opacity:.5;font-size:18px;cursor:pointer;line-height:1}.modal-close:hover{opacity:1}
.modal-btns{display:flex;gap:9px;justify-content:flex-end}
.mbtn{padding:9px 18px;border-radius:7px;font-weight:700;font-size:13px;font-family:inherit;cursor:pointer}
.mbtn-p{background:${c2};color:${t2};border:none}.mbtn-s{background:transparent;color:${t1};border:1.5px solid rgba(255,255,255,.15)}
#toast-msg{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#111;color:#eee;padding:7px 16px;border-radius:7px;font-size:11px;font-weight:600;border:1px solid rgba(255,255,255,.12);opacity:0;transition:opacity .25s;pointer-events:none;z-index:9999}
#toast-msg.show{opacity:1}
@media(max-width:600px){.nav{padding:14px 18px}.links{display:none}.hero,.section,.skills-sec,.contact{padding:50px 18px}footer{padding:22px 18px}}
</style></head><body>
<nav class="nav"><div class="logo">Alex Design</div><div class="links"><a href="#work" class="active" onclick="setActive(this)">Work</a><a href="#skills" onclick="setActive(this)">Skills</a><a href="#contact" onclick="setActive(this)">Contact</a></div></nav>
<div class="hero">
  <div class="tag">✦ Creative Developer</div>
  <h1>I craft <em>beautiful</em><br>digital experiences</h1>
  <p class="sub">Full-stack designer &amp; developer making interfaces that people love. Currently open to freelance projects.</p>
  <div class="acts">
    <button class="btn-m" onclick="document.getElementById('contact').scrollIntoView({behavior:'smooth'})">View My Work →</button>
    <button class="btn-o" onclick="openModal()">Download CV</button>
  </div>
</div>
<div id="work" class="section">
  <div class="sec-lbl">Selected Work</div>
  <div class="w-grid">${p.slice(0,4).map((c,i)=>{const pr=[['Brand Identity','Visual Design & Strategy'],['Mobile App','iOS & Android UI/UX'],['Web Platform','Full-stack Development'],['3D Motion','Creative Direction']];const em=['🎨','📱','🌐','🎬'];return `<div class="w-card" onclick="showT('Opening ${pr[i][0]}...')"><div class="w-img" style="background:linear-gradient(135deg,${c},${p[(i+1)%p.length]})">${em[i]}</div><div class="w-meta"><h3>${pr[i][0]}</h3><p>${pr[i][1]}</p></div></div>`;}).join('')}</div>
</div>
<div id="skills" class="skills-sec">
  <div style="max-width:1000px;margin:0 auto"><div class="sec-lbl">Skills &amp; Tools</div>
  <div class="chips">${['Figma','React','TypeScript','Tailwind CSS','Motion Design','Three.js','Node.js','Framer','Webflow','GSAP'].map((s,i)=>`<div class="chip" style="color:${p[i%p.length]};border-color:${p[i%p.length]}44;background:${p[i%p.length]}11" onclick="showT('${s} selected')">${s}</div>`).join('')}</div></div>
</div>
<div id="contact" class="contact">
  <div class="sec-lbl">Get In Touch</div>
  <h2 style="font-size:26px;font-weight:800;margin-bottom:8px;letter-spacing:-.5px">Let's work together</h2>
  <p style="font-size:13px;opacity:.5;margin-bottom:24px;line-height:1.6">Have a project in mind? Fill out the form and I'll get back to you within 24 hours.</p>
  <div class="form-row"><label>Name</label><input class="inp" id="f-name" placeholder="Your name"></div>
  <div class="form-row"><label>Email</label><input class="inp" id="f-email" type="email" placeholder="you@company.com"></div>
  <div class="form-row"><label>Message</label><textarea class="inp" id="f-msg" placeholder="Tell me about your project..."></textarea></div>
  <button class="send-btn" onclick="submitForm()">Send Message →</button>
</div>
<footer><span>© 2025 Alex Design</span><span>Made with ♥ &amp; ChromaStudio</span></footer>
<div class="modal-bg" id="modal" onclick="if(event.target===this)closeModal()">
  <div class="modal">
    <button class="modal-close" onclick="closeModal()">✕</button>
    <h3>Download CV</h3>
    <p>Get the latest version of my resume including projects, skills and work experience.</p>
    <div class="modal-btns">
      <button class="mbtn mbtn-s" onclick="closeModal()">Cancel</button>
      <button class="mbtn mbtn-p" onclick="closeModal();showT('✓ CV download started')">Download PDF</button>
    </div>
  </div>
</div>
<div id="toast-msg"></div>
<script>
function showT(msg){const t=document.getElementById('toast-msg');t.textContent=msg;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2200)}
function setActive(el){document.querySelectorAll('.links a').forEach(a=>a.classList.remove('active'));el.classList.add('active');const id=el.getAttribute('href').slice(1);document.getElementById(id)?.scrollIntoView({behavior:'smooth'})}
function openModal(){document.getElementById('modal').classList.add('open')}
function closeModal(){document.getElementById('modal').classList.remove('open')}
function submitForm(){const n=document.getElementById('f-name').value,e=document.getElementById('f-email').value,m=document.getElementById('f-msg').value;if(!n||!e||!m){showT('⚠ Please fill all fields');return}showT('✓ Message sent — I\\'ll reply within 24h!');document.getElementById('f-name').value='';document.getElementById('f-email').value='';document.getElementById('f-msg').value=''}
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()})
</script></body></html>`;
}
console.log('buildPortfolio function defined');

window.buildEcommerce = function(p) {
  console.log('buildEcommerce called with palette:', p);
  const c1=p[0],c2=p[1]||p[0],t1=textOn(c1),t2=textOn(c2);
  const products=[['Palette Tee','Apparel','$42','👕'],['Studio Mug','Home','$28','☕'],['Color Book','Design','$59','📚'],['Gradient Hat','Apparel','$36','🧢'],['Swatch Bag','Accessories','$74','👜'],['Hue Hoodie','Apparel','$89','🧥']];
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Store</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',sans-serif;background:#f5f5f3;color:#111}
.nav{display:flex;align-items:center;justify-content:space-between;padding:0 48px;height:62px;background:#fff;border-bottom:1px solid #eee;position:sticky;top:0;z-index:100}
.logo{font-weight:800;font-size:17px;color:${c1}}
.links{display:flex;gap:22px}.links a{text-decoration:none;color:#444;font-size:13px;font-weight:500;transition:color .15s}.links a:hover{color:${c2}}
.cart-btn{display:flex;align-items:center;gap:7px;padding:8px 16px;background:${c1};color:${t1};border:none;border-radius:7px;font-weight:700;font-size:12px;font-family:inherit;cursor:pointer;transition:opacity .15s}.cart-btn:hover{opacity:.85}
.cart-count{background:${c2};color:${t2};border-radius:50%;width:18px;height:18px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800}
.hero{background:${c1};color:${t1};padding:64px 48px;display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center}
.hero h1{font-size:clamp(30px,4vw,52px);font-weight:800;line-height:1.1;letter-spacing:-1.5px;margin-bottom:14px}
.hero p{opacity:.62;font-size:14px;line-height:1.65;margin-bottom:26px}
.shop-btn{padding:12px 28px;background:${c2};color:${t2};border:none;border-radius:8px;font-weight:700;font-size:13px;font-family:inherit;cursor:pointer;transition:transform .15s}.shop-btn:hover{transform:translateY(-2px)}
.hero-img{background:rgba(255,255,255,.1);border-radius:16px;height:240px;display:flex;align-items:center;justify-content:center;font-size:64px}
.filters{padding:24px 48px 0;display:flex;gap:8px;flex-wrap:wrap;max-width:1200px;margin:0 auto}
.flt{padding:6px 14px;border-radius:100px;border:1.5px solid #ddd;background:#fff;font-size:12px;font-weight:600;cursor:pointer;transition:all .15s}.flt:hover,.flt.active{background:${c1};color:${t1};border-color:${c1}}
.prods{padding:28px 48px 60px;max-width:1200px;margin:0 auto}
.p-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:16px}
.p-card{background:#fff;border-radius:12px;overflow:hidden;cursor:pointer;transition:box-shadow .2s,transform .15s}.p-card:hover{box-shadow:0 10px 36px rgba(0,0,0,.1);transform:translateY(-3px)}
.p-img{height:180px;display:flex;align-items:center;justify-content:center;font-size:46px;transition:transform .2s}.p-card:hover .p-img{transform:scale(1.06)}
.p-body{padding:13px}
.p-name{font-weight:700;font-size:13px;margin-bottom:3px}
.p-cat{font-size:10px;color:#aaa;margin-bottom:9px;font-weight:500;text-transform:uppercase;letter-spacing:.6px}
.p-foot{display:flex;align-items:center;justify-content:space-between}
.p-price{font-size:17px;font-weight:800;color:${c1}}
.add-btn{padding:6px 13px;background:${c2};color:${t2};border:none;border-radius:6px;font-weight:700;font-size:11px;font-family:inherit;cursor:pointer;transition:transform .1s}.add-btn:active{transform:scale(.94)}
.banner{background:${c2};color:${t2};padding:40px 48px;text-align:center;max-width:1100px;margin:0 48px 50px;border-radius:14px}
.banner h2{font-size:26px;font-weight:800;margin-bottom:8px;letter-spacing:-.4px}.banner p{opacity:.75;font-size:13px;margin-bottom:18px}
.cart-drawer{position:fixed;top:0;right:-340px;bottom:0;width:320px;background:#fff;box-shadow:-4px 0 24px rgba(0,0,0,.1);z-index:200;transition:right .28s;display:flex;flex-direction:column}
.cart-drawer.open{right:0}
.cart-hdr{display:flex;align-items:center;justify-content:space-between;padding:18px 20px;border-bottom:1px solid #eee}
.cart-hdr h3{font-weight:800;font-size:15px}
.cart-x{background:transparent;border:none;font-size:18px;cursor:pointer;opacity:.4;line-height:1}.cart-x:hover{opacity:1}
.cart-items{flex:1;overflow-y:auto;padding:16px 20px;display:flex;flex-direction:column;gap:12px}
.cart-item{display:flex;align-items:center;gap:12px;padding:12px;border:1px solid #eee;border-radius:10px}
.ci-img{width:40px;height:40px;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:22px}
.ci-info{flex:1;min-width:0}.ci-name{font-weight:700;font-size:12px}.ci-price{font-size:11px;color:#888;margin-top:2px}
.ci-rm{background:transparent;border:none;color:#ccc;cursor:pointer;font-size:14px;line-height:1}.ci-rm:hover{color:#f00}
.cart-empty{text-align:center;padding:40px 20px;opacity:.35;font-size:13px}
.cart-footer{padding:16px 20px;border-top:1px solid #eee}
.cart-total{display:flex;justify-content:space-between;font-weight:700;margin-bottom:12px;font-size:14px}
.checkout-btn{width:100%;padding:12px;background:${c1};color:${t1};border:none;border-radius:8px;font-weight:800;font-size:14px;font-family:inherit;cursor:pointer;transition:opacity .15s}.checkout-btn:hover{opacity:.85}
.overlay{display:none;position:fixed;inset:0;background:rgba(0,0,0,.3);z-index:199}.overlay.show{display:block}
footer{background:#111;color:#777;padding:28px 48px;display:flex;justify-content:space-between;font-size:11px;flex-wrap:wrap;gap:8px}
#toast-msg{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#111;color:#eee;padding:7px 16px;border-radius:7px;font-size:11px;font-weight:600;border:1px solid rgba(255,255,255,.12);opacity:0;transition:opacity .25s;pointer-events:none;z-index:9999}
#toast-msg.show{opacity:1}
@media(max-width:700px){.hero{grid-template-columns:1fr;padding:44px 18px}.hero-img{display:none}.prods,.filters{padding:20px 18px}.banner{margin:0 18px 36px;padding:28px 18px}nav{padding:0 16px}.links{display:none}footer{padding:20px 18px}}
</style></head><body>
<nav class="nav">
  <div class="logo">✦ Shop</div>
  <div class="links"><a href="#" onclick="filterBy('All')">All</a><a href="#" onclick="filterBy('Apparel')">Apparel</a><a href="#" onclick="filterBy('Home')">Home</a><a href="#" onclick="filterBy('Design')">Design</a></div>
  <button class="cart-btn" onclick="openCart()">🛒 Cart <span class="cart-count" id="cart-count">0</span></button>
</nav>
<div class="hero">
  <div>
    <h1>New Season,<br>New Colors</h1>
    <p>Discover our ChromaStudio-inspired collection, crafted for designers and creators.</p>
    <button class="shop-btn" onclick="document.getElementById('prods').scrollIntoView({behavior:'smooth'})">Shop Now →</button>
  </div>
  <div class="hero-img">🎁</div>
</div>
<div class="filters" id="filters">
  ${['All','Apparel','Home','Design','Accessories'].map((f,i)=>`<button class="flt${i===0?' active':''}" onclick="filterBy('${f}')">${f}</button>`).join('')}
</div>
<div id="prods" class="prods">
  <div class="p-grid" id="p-grid">
    ${products.map((it,i)=>`
    <div class="p-card" data-cat="${it[1]}">
      <div class="p-img" style="background:${p[i%p.length]}18">${it[3]}</div>
      <div class="p-body">
        <div class="p-name">${it[0]}</div>
        <div class="p-cat">${it[1]}</div>
        <div class="p-foot">
          <div class="p-price">${it[2]}</div>
          <button class="add-btn" onclick="addToCart('${it[0]}','${it[2]}','${it[3]}',event)">Add +</button>
        </div>
      </div>
    </div>`).join('')}
  </div>
</div>
<div class="banner"><h2>Summer Sale — 40% Off</h2><p>Limited time on all palette-inspired products. Use code CHROMA40.</p><button class="shop-btn" onclick="showT('✓ Code CHROMA40 copied!')">Copy Code</button></div>
<footer><span>© 2025 Shop · ChromaStudio</span><span>Returns · Privacy · Terms</span></footer>
<div class="overlay" id="overlay" onclick="closeCart()"></div>
<div class="cart-drawer" id="cart-drawer">
  <div class="cart-hdr"><h3>Your Cart</h3><button class="cart-x" onclick="closeCart()">✕</button></div>
  <div class="cart-items" id="cart-items"><div class="cart-empty">Your cart is empty</div></div>
  <div class="cart-footer" id="cart-footer" style="display:none">
    <div class="cart-total"><span>Total</span><span id="cart-total">$0</span></div>
    <button class="checkout-btn" onclick="showT('🎉 Order placed! Thanks for shopping.')">Checkout →</button>
  </div>
</div>
<div id="toast-msg"></div>
<script>
let cart=[];
function showT(msg){const t=document.getElementById('toast-msg');t.textContent=msg;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2200)}
function openCart(){document.getElementById('cart-drawer').classList.add('open');document.getElementById('overlay').classList.add('show')}
function closeCart(){document.getElementById('cart-drawer').classList.remove('open');document.getElementById('overlay').classList.remove('show')}
function addToCart(name,price,icon,e){
  e.stopPropagation();
  cart.push({name,price,icon});
  document.getElementById('cart-count').textContent=cart.length;
  renderCart();
  showT('✓ '+name+' added to cart');
}
function removeItem(i){cart.splice(i,1);document.getElementById('cart-count').textContent=cart.length;renderCart()}
function renderCart(){
  const el=document.getElementById('cart-items');
  const footer=document.getElementById('cart-footer');
  if(!cart.length){el.innerHTML='<div class="cart-empty">Your cart is empty</div>';footer.style.display='none';return}
  el.innerHTML=cart.map((it,i)=>'<div class="cart-item"><div class="ci-img">'+it.icon+'</div><div class="ci-info"><div class="ci-name">'+it.name+'</div><div class="ci-price">'+it.price+'</div></div><button class="ci-rm" onclick="removeItem('+i+')">✕</button></div>').join('');
  const total=cart.reduce((s,it)=>s+parseFloat(it.price.replace('$','')),0);
  document.getElementById('cart-total').textContent='$'+total.toFixed(2);
  footer.style.display='block';
}
function filterBy(cat){
  document.querySelectorAll('.flt').forEach(b=>b.classList.toggle('active',b.textContent===cat));
  document.querySelectorAll('.p-card').forEach(c=>{c.style.display=(cat==='All'||c.dataset.cat===cat)?'':'none'});
}
</script></body></html>`;
}
console.log('buildEcommerce function defined');

window.buildComponents = function(p) {
  console.log('buildComponents called with palette:', p);
  const c1=p[0],c2=p[1]||p[0],c3=p[2]||p[0],t1=textOn(c1),t2=textOn(c2);
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>UI Components</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Inter',sans-serif;background:#111;color:#e8e8e8;padding:0}
.nav{display:flex;align-items:center;justify-content:space-between;padding:0 40px;height:56px;background:#0d0d0d;border-bottom:1px solid rgba(255,255,255,.07);position:sticky;top:0;z-index:10}
.logo{font-weight:800;font-size:15px;letter-spacing:-.3px}
.mode-btn{padding:6px 14px;border-radius:100px;border:1px solid rgba(255,255,255,.12);background:transparent;color:#e8e8e8;font-size:11px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s}.mode-btn:hover{background:rgba(255,255,255,.07)}
.page{display:flex;min-height:calc(100vh - 56px)}
aside{width:200px;border-right:1px solid rgba(255,255,255,.07);padding:16px 10px;flex-shrink:0}
.aside-sec{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.4px;color:#555;padding:12px 8px 6px}
.aside-item{display:block;padding:7px 10px;border-radius:7px;font-size:12px;font-weight:500;color:#888;cursor:pointer;text-decoration:none;transition:all .15s;border:none;background:transparent;width:100%;text-align:left;font-family:inherit}
.aside-item:hover{background:rgba(255,255,255,.05);color:#ccc}
.aside-item.active{background:${c2}18;color:${c2}}
.content{flex:1;padding:32px 40px;overflow-y:auto}
.sec-hdr{font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:#444;margin-bottom:20px;display:flex;align-items:center;gap:8px}
.sec-hdr::after{content:'';flex:1;height:1px;background:rgba(255,255,255,.06)}
.comp-row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:28px}
.lbl{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.8px;color:#555;margin-bottom:10px}
/* Buttons */
.btn{padding:9px 20px;border-radius:8px;font-weight:700;font-size:13px;font-family:inherit;cursor:pointer;transition:all .15s;display:inline-flex;align-items:center;gap:6px}
.btn:active{transform:scale(.96)}
.btn-primary{background:${c2};color:${t2};border:none}.btn-primary:hover{opacity:.85}
.btn-secondary{background:rgba(255,255,255,.07);color:#e8e8e8;border:1px solid rgba(255,255,255,.1)}.btn-secondary:hover{background:rgba(255,255,255,.12)}
.btn-outline{background:transparent;color:${c2};border:1.5px solid ${c2}}.btn-outline:hover{background:${c2}18}
.btn-ghost{background:transparent;color:#888;border:none}.btn-ghost:hover{color:#e8e8e8;background:rgba(255,255,255,.05)}
.btn-danger{background:#ef4444;color:#fff;border:none}.btn-danger:hover{background:#dc2626}
.btn-sm{padding:5px 12px;font-size:11px;border-radius:6px}
.btn-lg{padding:12px 28px;font-size:15px;border-radius:10px}
.btn-icon{width:36px;height:36px;padding:0;justify-content:center;border-radius:8px}
.btn-loading{opacity:.6;pointer-events:none;position:relative}
/* Inputs */
.inp-group{margin-bottom:14px;width:240px}
.inp-lbl{display:block;font-size:11px;font-weight:600;color:#888;margin-bottom:5px}
.inp{width:100%;padding:9px 12px;border-radius:7px;border:1.5px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:#e8e8e8;font-size:13px;font-family:inherit;outline:none;transition:border-color .15s}
.inp:focus{border-color:${c2}}
.inp.err{border-color:#ef4444}
.inp-hint{font-size:10px;margin-top:4px;color:#666}
.inp-hint.err{color:#ef4444}
.inp-wrap{position:relative}.inp-wrap .inp{padding-left:32px}
.inp-ico{position:absolute;left:10px;top:50%;transform:translateY(-50%);font-size:13px;pointer-events:none}
/* Badges */
.badge{display:inline-flex;align-items:center;gap:4px;padding:3px 9px;border-radius:100px;font-size:10px;font-weight:700}
.bdg-default{background:rgba(255,255,255,.08);color:#aaa}
.bdg-primary{background:${c2}22;color:${c2};border:1px solid ${c2}44}
.bdg-success{background:rgba(52,211,153,.14);color:#34d399}
.bdg-warning{background:rgba(251,191,36,.12);color:#fbbf24}
.bdg-danger{background:rgba(248,113,113,.12);color:#f87171}
.bdg-dot::before{content:'';width:5px;height:5px;border-radius:50%;background:currentColor;display:inline-block}
/* Alerts */
.alert{padding:12px 16px;border-radius:9px;font-size:13px;display:flex;align-items:flex-start;gap:10px;margin-bottom:10px;border:1px solid}
.alert-icon{font-size:15px;flex-shrink:0;margin-top:1px}
.alert-info{background:${c2}10;border-color:${c2}30;color:${c2}}
.alert-success{background:rgba(52,211,153,.08);border-color:rgba(52,211,153,.25);color:#34d399}
.alert-warning{background:rgba(251,191,36,.08);border-color:rgba(251,191,36,.25);color:#fbbf24}
.alert-danger{background:rgba(248,113,113,.08);border-color:rgba(248,113,113,.25);color:#f87171}
.alert-close{margin-left:auto;background:transparent;border:none;color:inherit;opacity:.6;cursor:pointer;font-size:14px;line-height:1;flex-shrink:0}.alert-close:hover{opacity:1}
/* Toggles & Checkboxes */
.toggle{position:relative;display:inline-flex;align-items:center;gap:10px;cursor:pointer;user-select:none;font-size:13px}
.toggle input{opacity:0;width:0;height:0;position:absolute}
.tog-track{width:38px;height:22px;border-radius:11px;background:rgba(255,255,255,.1);transition:background .2s;position:relative;flex-shrink:0}
.tog-track::after{content:'';position:absolute;width:16px;height:16px;border-radius:50%;background:#fff;top:3px;left:3px;transition:transform .2s,background .2s}
.toggle input:checked+.tog-track{background:${c2}}
.toggle input:checked+.tog-track::after{transform:translateX(16px)}
.cb-wrap{display:inline-flex;align-items:center;gap:8px;cursor:pointer;user-select:none;font-size:13px}
.cb-wrap input{appearance:none;width:17px;height:17px;border:1.5px solid rgba(255,255,255,.2);border-radius:4px;background:transparent;cursor:pointer;flex-shrink:0;position:relative;transition:all .15s}
.cb-wrap input:checked{background:${c2};border-color:${c2}}
.cb-wrap input:checked::after{content:'✓';position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);color:${t2};font-size:11px;font-weight:800;line-height:1}
/* Cards */
.card{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:18px;transition:transform .15s,box-shadow .15s;cursor:default}
.card:hover{transform:translateY(-3px);box-shadow:0 10px 30px rgba(0,0,0,.3)}
.card-img{height:100px;border-radius:8px;margin-bottom:14px;display:flex;align-items:center;justify-content:center;font-size:32px}
.card h3{font-size:14px;font-weight:700;margin-bottom:5px}.card p{font-size:12px;opacity:.5;line-height:1.55}
/* Avatar */
.avatar{border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0}
.av-sm{width:28px;height:28px;font-size:11px}
.av-md{width:38px;height:38px;font-size:14px}
.av-lg{width:52px;height:52px;font-size:18px}
.av-group{display:flex}.av-group .avatar{border:2px solid #111;margin-left:-8px}.av-group .avatar:first-child{margin-left:0}
/* Progress */
.prog-wrap{margin-bottom:12px}
.prog-lbl{display:flex;justify-content:space-between;font-size:11px;margin-bottom:5px;opacity:.65}
.prog-track{height:7px;border-radius:4px;background:rgba(255,255,255,.08);overflow:hidden}
.prog-fill{height:100%;border-radius:4px;transition:width .6s}
/* Tabs */
.tabs{display:flex;border-bottom:1px solid rgba(255,255,255,.08);margin-bottom:20px;gap:4px}
.tab{padding:8px 16px;border:none;background:transparent;color:#888;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;border-bottom:2px solid transparent;margin-bottom:-1px;transition:all .15s}
.tab:hover{color:#ccc}
.tab.active{color:${c2};border-bottom-color:${c2}}
.tab-panel{display:none}.tab-panel.active{display:block}
/* Select */
.sel{padding:9px 12px;border-radius:7px;border:1.5px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:#e8e8e8;font-size:13px;font-family:inherit;outline:none;cursor:pointer;min-width:180px;transition:border-color .15s}
.sel:focus{border-color:${c2}}
/* Range */
.range{width:200px;accent-color:${c2};cursor:ew-resize}
/* Toast */
#toast-msg{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#111;color:#eee;padding:7px 16px;border-radius:7px;font-size:11px;font-weight:600;border:1px solid rgba(255,255,255,.12);opacity:0;transition:opacity .25s;pointer-events:none;z-index:9999}
#toast-msg.show{opacity:1}
/* Modal */
.modal-bg{display:none;position:fixed;inset:0;background:rgba(0,0,0,.7);backdrop-filter:blur(4px);z-index:200;align-items:center;justify-content:center}
.modal-bg.open{display:flex}
.modal{background:#1a1a1a;border:1px solid rgba(255,255,255,.1);border-radius:14px;padding:28px;max-width:400px;width:90%;position:relative}
.modal h3{font-size:17px;font-weight:800;margin-bottom:8px}.modal p{font-size:13px;opacity:.5;line-height:1.6;margin-bottom:20px}
.modal-close{position:absolute;top:12px;right:14px;background:transparent;border:none;color:inherit;opacity:.4;font-size:18px;cursor:pointer}.modal-close:hover{opacity:1}
.modal-btns{display:flex;gap:9px;justify-content:flex-end}
</style></head><body>
<nav class="nav"><div class="logo">◈ UI Components</div><button class="mode-btn" onclick="showT('🎨 Theme applied!')">Apply to Project</button></nav>
<div class="page">
  <aside>
    <div class="aside-sec">Components</div>
    ${['Buttons','Inputs','Badges','Alerts','Cards','Toggles','Progress','Tabs','Modals'].map((s,i)=>`<button class="aside-item${i===0?' active':''}" onclick="scrollTo('sec-${s.toLowerCase()}')">${s}</button>`).join('')}
  </aside>
  <div class="content">

    <div id="sec-buttons">
      <div class="sec-hdr">Buttons</div>
      <div class="lbl">Variants</div>
      <div class="comp-row">
        <button class="btn btn-primary" onclick="showT('Primary clicked!')">Primary</button>
        <button class="btn btn-secondary" onclick="showT('Secondary clicked!')">Secondary</button>
        <button class="btn btn-outline" onclick="showT('Outline clicked!')">Outline</button>
        <button class="btn btn-ghost" onclick="showT('Ghost clicked!')">Ghost</button>
        <button class="btn btn-danger" onclick="showT('⚠ Danger action!')">Danger</button>
      </div>
      <div class="lbl">Sizes</div>
      <div class="comp-row" style="align-items:flex-end">
        <button class="btn btn-primary btn-sm" onclick="showT('Small!')">Small</button>
        <button class="btn btn-primary" onclick="showT('Default!')">Default</button>
        <button class="btn btn-primary btn-lg" onclick="showT('Large!')">Large</button>
        <button class="btn btn-secondary btn-icon" onclick="showT('Icon button!')">+</button>
        <button class="btn btn-primary btn-loading" onclick="showT('Loading...')">⏳ Loading…</button>
      </div>
    </div>

    <div id="sec-inputs" style="margin-top:32px">
      <div class="sec-hdr">Inputs</div>
      <div style="display:flex;gap:20px;flex-wrap:wrap">
        <div class="inp-group"><div class="inp-lbl">Default</div><input class="inp" placeholder="Enter value..."></div>
        <div class="inp-group"><div class="inp-lbl">With icon</div><div class="inp-wrap"><span class="inp-ico">🔍</span><input class="inp" placeholder="Search..."></div></div>
        <div class="inp-group"><div class="inp-lbl">Error state</div><input class="inp err" value="invalid@"><div class="inp-hint err">Please enter a valid email address.</div></div>
        <div class="inp-group"><div class="inp-lbl">Select</div><select class="sel" onchange="showT('Selected: '+this.value)">${['Option 1','Option 2','Option 3'].map(o=>`<option>${o}</option>`).join('')}</select></div>
        <div class="inp-group"><div class="inp-lbl">Range <span id="range-val" style="color:${c2}">50</span></div><input class="range" type="range" min="0" max="100" value="50" oninput="document.getElementById('range-val').textContent=this.value"></div>
      </div>
    </div>

    <div id="sec-badges" style="margin-top:32px">
      <div class="sec-hdr">Badges</div>
      <div class="comp-row">
        <span class="badge bdg-default">Default</span>
        <span class="badge bdg-primary">Primary</span>
        <span class="badge bdg-success bdg-dot">Active</span>
        <span class="badge bdg-warning bdg-dot">Pending</span>
        <span class="badge bdg-danger bdg-dot">Failed</span>
        <span class="badge bdg-primary" style="background:${c3}22;color:${c3};border:1px solid ${c3}44">Accent</span>
      </div>
    </div>

    <div id="sec-alerts" style="margin-top:32px">
      <div class="sec-hdr">Alerts</div>
      <div style="max-width:560px">
        <div class="alert alert-info"><span class="alert-icon">ℹ</span><div><strong>Information</strong><br><span style="font-size:12px;opacity:.8">Your session will expire in 30 minutes. Save your work.</span></div><button class="alert-close" onclick="this.closest('.alert').remove()">✕</button></div>
        <div class="alert alert-success"><span class="alert-icon">✓</span><div><strong>Success</strong><br><span style="font-size:12px;opacity:.8">Your changes have been saved successfully.</span></div><button class="alert-close" onclick="this.closest('.alert').remove()">✕</button></div>
        <div class="alert alert-warning"><span class="alert-icon">⚠</span><div><strong>Warning</strong><br><span style="font-size:12px;opacity:.8">Disk space is running low. Clear some files.</span></div><button class="alert-close" onclick="this.closest('.alert').remove()">✕</button></div>
        <div class="alert alert-danger"><span class="alert-icon">✕</span><div><strong>Error</strong><br><span style="font-size:12px;opacity:.8">Failed to connect. Check your internet connection.</span></div><button class="alert-close" onclick="this.closest('.alert').remove()">✕</button></div>
      </div>
    </div>

    <div id="sec-cards" style="margin-top:32px">
      <div class="sec-hdr">Cards</div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;max-width:700px">
        ${p.slice(0,4).map((c,i)=>{const names=['Analytics','Revenue','Users','Growth'];const icons=['📊','💰','👥','📈'];return `<div class="card"><div class="card-img" style="background:${c}20">${icons[i]}</div><h3>${names[i]}</h3><p>Hover me! This card shows how your palette looks on interactive components.</p></div>`;}).join('')}
      </div>
    </div>

    <div id="sec-toggles" style="margin-top:32px">
      <div class="sec-hdr">Toggles & Checkboxes</div>
      <div style="display:flex;gap:24px;flex-wrap:wrap">
        <div style="display:flex;flex-direction:column;gap:12px">
          <label class="toggle"><input type="checkbox" checked onchange="showT('Toggle: '+this.checked)"><div class="tog-track"></div>Notifications</label>
          <label class="toggle"><input type="checkbox" onchange="showT('Toggle: '+this.checked)"><div class="tog-track"></div>Dark mode</label>
          <label class="toggle"><input type="checkbox" checked onchange="showT('Toggle: '+this.checked)"><div class="tog-track"></div>Auto-save</label>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px">
          <label class="cb-wrap"><input type="checkbox" checked onchange="showT('CB: '+this.checked)"> Remember me</label>
          <label class="cb-wrap"><input type="checkbox" onchange="showT('CB: '+this.checked)"> Subscribe to updates</label>
          <label class="cb-wrap"><input type="checkbox" checked onchange="showT('CB: '+this.checked)"> Accept terms</label>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          ${p.slice(0,5).map((c,i)=>`<div class="avatar av-md" style="background:${c};color:${textOn(c)}">${['A','B','C','D','E'][i]}</div>`).join('')}
          <div class="av-group">${p.slice(0,4).map((c,i)=>`<div class="avatar av-sm" style="background:${c};color:${textOn(c)}">${['X','Y','Z','W'][i]}</div>`).join('')}</div>
        </div>
      </div>
    </div>

    <div id="sec-progress" style="margin-top:32px">
      <div class="sec-hdr">Progress Bars</div>
      <div style="max-width:500px">
        ${p.slice(0,4).map((c,i)=>{const labels=['Storage Used','Bandwidth','CPU Usage','Memory'];const vals=[72,45,88,31];return `<div class="prog-wrap"><div class="prog-lbl"><span>${labels[i]}</span><span style="color:${c}">${vals[i]}%</span></div><div class="prog-track"><div class="prog-fill" style="width:${vals[i]}%;background:${c}"></div></div></div>`;}).join('')}
      </div>
    </div>

    <div id="sec-tabs" style="margin-top:32px">
      <div class="sec-hdr">Tabs</div>
      <div class="tabs">${['Overview','Details','Settings','Logs'].map((t,i)=>`<button class="tab${i===0?' active':''}" onclick="switchTab(this,'tp-${i}')">${t}</button>`).join('')}</div>
      ${['General overview and summary of your account.','Detailed information about usage and billing.','Configure your account preferences and API keys.','Recent activity and system logs from the last 30 days.'].map((txt,i)=>`<div class="tab-panel${i===0?' active':''}" id="tp-${i}"><p style="font-size:13px;opacity:.5;line-height:1.6">${txt}</p></div>`).join('')}
    </div>

    <div id="sec-modals" style="margin-top:32px;margin-bottom:60px">
      <div class="sec-hdr">Modals & Dialogs</div>
      <div class="comp-row">
        <button class="btn btn-primary" onclick="openModal('modal-confirm')">Confirm Dialog</button>
        <button class="btn btn-secondary" onclick="openModal('modal-form')">Form Modal</button>
        <button class="btn btn-outline" onclick="openModal('modal-alert')">Alert Modal</button>
      </div>
    </div>

  </div>
</div>

<!-- Modals -->
<div class="modal-bg" id="modal-confirm" onclick="if(event.target===this)closeModal('modal-confirm')">
  <div class="modal">
    <button class="modal-close" onclick="closeModal('modal-confirm')">✕</button>
    <h3>Delete Project?</h3>
    <p>This action cannot be undone. All files and data associated with this project will be permanently deleted.</p>
    <div class="modal-btns">
      <button class="btn btn-secondary" onclick="closeModal('modal-confirm')">Cancel</button>
      <button class="btn btn-danger" onclick="closeModal('modal-confirm');showT('🗑 Project deleted')">Delete</button>
    </div>
  </div>
</div>
<div class="modal-bg" id="modal-form" onclick="if(event.target===this)closeModal('modal-form')">
  <div class="modal">
    <button class="modal-close" onclick="closeModal('modal-form')">✕</button>
    <h3>Create New Project</h3>
    <p>Fill in the details below to create your project.</p>
    <div style="margin-bottom:12px"><div class="inp-lbl">Project name</div><input class="inp" id="proj-name" placeholder="My awesome project"></div>
    <div style="margin-bottom:20px"><div class="inp-lbl">Description</div><textarea class="inp" style="height:70px;resize:none" placeholder="Optional..."></textarea></div>
    <div class="modal-btns">
      <button class="btn btn-secondary" onclick="closeModal('modal-form')">Cancel</button>
      <button class="btn btn-primary" onclick="submitForm()">Create Project</button>
    </div>
  </div>
</div>
<div class="modal-bg" id="modal-alert" onclick="if(event.target===this)closeModal('modal-alert')">
  <div class="modal">
    <button class="modal-close" onclick="closeModal('modal-alert')">✕</button>
    <div style="text-align:center;padding:8px 0 16px">
      <div style="font-size:40px;margin-bottom:14px">🎉</div>
      <h3 style="margin-bottom:8px">Palette Applied!</h3>
      <p>Your ChromaStudio palette has been successfully applied to this component library.</p>
    </div>
    <div class="modal-btns" style="justify-content:center">
      <button class="btn btn-primary" onclick="closeModal('modal-alert');showT('✓ Great!')">Awesome</button>
    </div>
  </div>
</div>

<div id="toast-msg"></div>
<script>
function showT(msg){const t=document.getElementById('toast-msg');t.textContent=msg;t.classList.add('show');clearTimeout(t._t);t._t=setTimeout(()=>t.classList.remove('show'),2200)}
function openModal(id){document.getElementById(id).classList.add('open')}
function closeModal(id){document.getElementById(id).classList.remove('open')}
function switchTab(el,panelId){document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));el.classList.add('active');document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));document.getElementById(panelId).classList.add('active')}
function scrollTo(id){document.getElementById(id)?.scrollIntoView({behavior:'smooth'})}
function submitForm(){const n=document.getElementById('proj-name').value;if(!n){showT('⚠ Enter a project name');return}closeModal('modal-form');showT('✓ Project "'+n+'" created!')}
document.addEventListener('keydown',e=>{if(e.key==='Escape')document.querySelectorAll('.modal-bg.open').forEach(m=>m.classList.remove('open'))})
</script></body></html>`;
}
