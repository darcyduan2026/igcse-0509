/* 文言自学 · 单页应用（无依赖） */
(function () {
  // 两套教材：《匠心》（课堂教材）与《采文》（自学拓展）
  const BOOKS = [
    { id: "jiangxin", name: "匠心", cls: "jx", tag: "课堂教材", units: window.JIANGXIN_UNITS || [],
      blurb: "教材《匠心》五个单元里的文言文：记李歌、节庵方公墓表、蜀贾、湖心亭看雪、《天工开物》序。每篇都有原文点读、译文、IGCSE模拟题、词语卡片和字词自测。" },
    { id: "caiwen", name: "采文", cls: "cw", tag: "自学拓展", units: window.CAIWEN_UNITS || [],
      blurb: "《采文》全书五个单元，每个单元一篇精讲、三篇自测。适合课外自学、拓展阅读和考前练手。" }
  ].filter(b => b.units.length);
  BOOKS.forEach(b => b.units.forEach(u => { u.book = b; }));
  const UNITS = BOOKS.flatMap(b => b.units);
  // “字词学习与自测”标签页（四关练习）。PRACTICE_ALL = true 时全部文章都有；想只开放个别文章，改成 false 并在 PRACTICE_TEXTS 里列出 "单元id.文章id"。
  const PRACTICE_ALL = true, PRACTICE_TEXTS = new Set(["u1.maigan"]);
  const hasPractice = (u, t) => !!window.V && (PRACTICE_ALL || PRACTICE_TEXTS.has(u.id + "." + t.id));
  const $ = (s, el = document) => el.querySelector(s);
  const app = $("#app"), nav = $("#topnav"), bar = $("#bookbar"), pop = $("#pop");
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  // ---------- storage ----------
  const KEY = "caiwen.v1";
  let store = {};
  try { store = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { store = {}; }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { } };
  const S = (path, v) => {            // get/set nested
    const ks = path.split(".");
    let o = store;
    if (v === undefined) { for (const k of ks) { if (!o) return undefined; o = o[k]; } return o; }
    for (const k of ks.slice(0, -1)) o = o[k] = o[k] || {};
    o[ks[ks.length - 1]] = v; save();
  };

  // ---------- theme ----------
  $("#themeBtn").onclick = () => {
    const cur = document.documentElement.getAttribute("data-theme");
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("caiwen.theme", next); } catch (e) { }
  };
  try { const t = localStorage.getItem("caiwen.theme"); if (t) document.documentElement.setAttribute("data-theme", t); } catch (e) { }

  // ---------- text markup ----------
  // [[词|pinyin|note]] -> <span class="w" data-py data-note>
  function renderPara(p) {
    let out = "", i = 0;
    const re = /\[\[([^|\]]+)\|([^|\]]*)\|([^\]]+)\]\]/g;
    let m;
    while ((m = re.exec(p))) {
      out += esc(p.slice(i, m.index));
      out += `<span class="w" data-py="${esc(m[2])}" data-note="${esc(m[3])}"><span class="py" aria-hidden="true">${esc(m[2])}</span><span class="t">${esc(m[1])}</span></span>`;
      i = re.lastIndex;
    }
    return out + esc(p.slice(i));
  }
  const plain = p => p.replace(/\[\[([^|\]]+)\|[^|\]]*\|[^\]]+\]\]/g, "$1");

  // popover
  document.addEventListener("click", e => {
    const w = e.target.closest(".w");
    document.querySelectorAll(".w.hit").forEach(x => x.classList.remove("hit"));
    if (!w || w.classList.contains("ro")) { pop.hidden = true; return; }
    w.classList.add("hit");
    pop.innerHTML = `<b>${esc(w.querySelector(".t").textContent)}</b>${w.dataset.py ? `<span class="py">${esc(w.dataset.py)}</span>` : ""}${esc(w.dataset.note)}`;
    pop.hidden = false;
    const r = w.getBoundingClientRect();
    let left = r.left + window.scrollX, top = r.bottom + window.scrollY + 6;
    pop.style.left = "0px"; pop.style.top = "0px";
    const pw = pop.offsetWidth;
    if (left + pw > window.scrollX + document.documentElement.clientWidth - 8) left = window.scrollX + document.documentElement.clientWidth - pw - 8;
    pop.style.left = left + "px"; pop.style.top = top + "px";
    e.stopPropagation();
  });
  window.addEventListener("scroll", () => { pop.hidden = true; }, { passive: true });

  // ---------- helpers ----------
  const totalMarks = t => t.questions.reduce((a, q) => a + q.marks, 0);
  function scoreOf(u, t) {
    const r = S(`${u.id}.${t.id}.q`) || {};
    let got = 0, done = 0;
    for (const q of t.questions) {
      const v = r[q.id];
      if (!v) continue;
      if (q.type === "mc") { if (v.pick !== undefined) { done++; if (v.pick === q.answer) got += q.marks; } }
      else if (q.items) { const marks = v.marks || {}; const ks = Object.keys(marks); if (ks.length) { done++; got += ks.filter(k => marks[k]).length; } }
      else if (v.self !== undefined) { done++; if (v.self) got += q.marks; }
    }
    return { got, done, total: totalMarks(t), n: t.questions.length };
  }

  // ---------- routing ----------
  const NUM = "一二三四五六七八九十";
  const unitNo = u => NUM[u.book.units.indexOf(u)] || "";
  const bookTitle = b => `《${b.name}》`;
  const bookStat = b => {
    const all = b.units.flatMap(u => u.texts.map(t => scoreOf(u, t)));
    return { texts: all.length, started: all.filter(s => s.done).length };
  };

  function route() {
    pop.hidden = true;
    const h = location.hash.replace(/^#\/?/, "");
    const [a, b, c] = h.split("/");
    const bk = a === "b" ? BOOKS.find(x => x.id === b) : null;
    const u = UNITS.find(x => x.id === a);
    const cur = bk || (u && u.book);
    nav.innerHTML = `<a href="#/" class="${!h ? "on" : ""}">首页</a>` +
      BOOKS.map(x => `<a href="#/b/${x.id}" class="${cur === x ? "on" : ""}">${bookTitle(x)}</a>`).join("") +
      (window.V ? `<a href="#/p" class="${a === "p" ? "on" : ""}">练习</a>` : "") +
      `<a href="#/words" class="${a === "words" ? "on" : ""}">全部词语</a>` +
      `<a href="#/method" class="${a === "method" ? "on" : ""}">三遍读法</a>`;
    bar.innerHTML = cur ? `<div class="bookbar ${cur.cls}"><a class="bk" href="#/b/${cur.id}">${bookTitle(cur)}</a>` +
      cur.units.map(x => `<a href="#/${x.id}" class="${u === x ? "on" : ""}">第${unitNo(x)}单元 ${esc(x.title)}</a>`).join("") + `</div>` : "";
    if (!UNITS.length) { app.innerHTML = "<p>没有内容。</p>"; return; }
    if (a === "method") return pageMethod();
    if (a === "p" && window.V) { pagePractice(b, c); window.scrollTo(0, 0); return; }
    if (a === "words") return pageWords(UNITS, "#/", "首页", "全部词语卡片");
    if (a === "b") {
      if (!bk) { pageHome(); window.scrollTo(0, 0); return; }
      if (c === "words") return pageWords(bk.units, `#/b/${bk.id}`, bookTitle(bk), `${bookTitle(bk)}词语卡片`);
      pageBook(bk); window.scrollTo(0, 0); return;
    }
    if (!u) { pageHome(); window.scrollTo(0, 0); return; }
    if (b === "words") return pageWords([u], `#/${u.id}`, u.title, "词语卡片");
    const t = u.texts.find(x => x.id === b);
    if (t) return pageText(u, t, c || "read");
    pageUnit(u);
    window.scrollTo(0, 0);
  }
  window.addEventListener("hashchange", route);

  // ---------- pages ----------
  const chipsHTML = u => u.texts.map(t => { const s = scoreOf(u, t); return `
    <a class="chip" href="#/${u.id}/${t.id}"><b>${esc(t.title)}</b><span>${esc(t.author)} · ${esc(t.kind)}${s.done ? ` · ${s.got}/${s.total}` : ""}</span></a>`; }).join("");

  // ---------- 首页：线装书封面 ----------
  const cnum = n => { const N = "一二三四五六七八九十"; return n <= 10 ? N[n - 1] : n < 20 ? "十" + N[n - 11] : N[Math.floor(n / 10) - 1] + "十" + (n % 10 ? N[n % 10 - 1] : ""); };
  const STITCH_Y = [62, 198, 330, 466];
  const stitchSVG = `<svg class="stitch" viewBox="0 0 44 528" preserveAspectRatio="none" aria-hidden="true"><g fill="none" stroke-linecap="round">
      <g stroke="rgba(0,0,0,.38)" stroke-width="5" transform="translate(1.2 1.6)"><path d="M17 62V466M17 62H41M17 198H41M17 330H41M17 466H41"/></g>
      <g stroke="#efe3bb" stroke-width="3.2"><path d="M17 62V466M17 62H41M17 198H41M17 330H41M17 466H41"/></g>
      <path d="M17 62V466" stroke="rgba(255,255,255,.55)" stroke-width="1" stroke-dasharray="1 4"/></g>
    <g>${STITCH_Y.map(y => `<circle cx="17" cy="${y}" r="5.2" fill="#0a0f17" opacity=".7"/><circle cx="17" cy="${y}" r="2.4" fill="#efe3bb"/>`).join("")}</g></svg>`;
  function coverHTML(b) {
    const n = b.units.reduce((s, u) => s + u.texts.length, 0), st = bookStat(b);
    return `<div class="cell"><article class="book ${b.cls}">
      <a class="cover" href="#/b/${b.id}" aria-label="进入《${esc(b.name)}》">${stitchSVG}<span class="corner t"></span><span class="corner b"></span>
        <span class="slip"><b>${esc(b.name)}</b><i>${esc(b.tag)}</i></span><span class="open">翻开此书</span><span class="volx">共${cnum(b.units.length)}册　${cnum(n)}篇</span></a>
      <ol class="vols">${b.units.map(u => `<li><a href="#/${u.id}" title="${esc(u.texts.map(t => t.title.replace(/（.*?）/g, "")).join("、"))}"><em>${unitNo(u)}</em>${esc(u.title)}<small>${cnum(u.texts.length)}篇</small></a></li>`).join("")}</ol>
      <p class="cap"><a href="#/b/${b.id}">翻开《${esc(b.name)}》全书</a><span>${st.started ? `已开始 ${st.started} / ${st.texts} 篇` : "还没开始"}</span></p>
    </article></div>`;
  }

  function pageHome() {
    const last = S("last");
    const lu = last && UNITS.find(x => x.id === last.u), lt = lu && lu.texts.find(x => x.id === last.t);
    const jx = BOOKS.find(b => b.id === "jiangxin");
    const dflt = jx && jx.units.find(u => u.id === "j4");
    const eu = lt ? lu : (dflt || UNITS[0]), et = lt || eu.texts[0];
    const href = `#/${eu.id}/${et.id}/${lt && last.tab ? last.tab : "read"}`;
    const shortTitle = t => t.title.replace(/（.*?）/g, "");
    const tabName = lt ? ({ read: "读原文", about: "主旨与作者", quiz: "IGCSE模拟题", words: "字词学习与自测" }[last.tab] || "读原文") : "读原文";
    const streak = window.V ? window.V.streak() : 0;
    const guide = `
      <aside class="guide">
        <h2>怎么用这个网站</h2>
        <ol>
          <li>先读<b>原文</b>：不要急着看译文，点带红点的字词可以看注释。</li>
          <li>按<a href="#/method"><b>三遍读法</b></a>读完，再打开译文核对自己的理解。</li>
          <li>看<b>主旨与作者</b>，弄清这篇写了什么、谁写的。</li>
          <li>做<b>IGCSE模拟题</b>：选择题会自动判分；简答题写完后对照答案要点，自己打分。</li>
          <li>到<b>字词学习与自测</b>：先看这篇的词语卡片，再用字卡、配对、选义、用法四关自测。</li>
          ${window.V ? `<li>想多练一点，去<a href="#/p"><b>练习</b></a>：归类、点字、每日一练、打印小测，可以按全书、单元或单篇选范围。</li>` : ""}
        </ol>
      </aside>`;
    app.innerHTML = `
      <div class="home2">
        <header class="hhead">
          <p>IGCSE 0509 中文第一语言 · 文言文阅读自学。先读原文，遇到带红点的字词点一下看注释，再对照译文，最后自测。</p>
          <div class="acts">
            <a class="go" href="${href}">${lt ? "继续上次" : "从这里开始读"} →<small>${esc(shortTitle(et))} · ${tabName}</small></a>
            ${window.V ? `<a class="daily" href="#/p/daily">每日一练${streak ? ` · 已连续 ${streak} 天` : ""} →</a>` : ""}
          </div>
        </header>
        <section class="desk">${BOOKS[0] ? coverHTML(BOOKS[0]) : ""}${guide}${BOOKS[1] ? coverHTML(BOOKS[1]) : ""}</section>
        <nav class="tools2">${window.V ? `<a href="#/p"><b>练习</b>　字卡 · 配对 · 归类 · 打印小测</a>` : ""}<a href="#/words"><b>全部词语卡片</b>　实词 · 虚词 · 特殊句式</a><a href="#/method"><b>三遍读法</b>　没有注释时怎么读</a></nav>
      </div>`;
    window.scrollTo(0, 0);
  }

  function pageBook(b) {
    const st = bookStat(b);
    app.innerHTML = `
      <a class="back" href="#/">← 首页</a>
      <div class="bhead ${b.cls}"><span class="tag">${esc(b.tag)}</span><h1>《${esc(b.name)}》</h1></div>
      <p class="sub">${b.units.length} 个单元 · ${st.texts} 篇 · 已开始 ${st.started} 篇。${esc(b.blurb)}</p>
      <p><a class="pill" href="#/b/${b.id}/words">本书词语卡片</a></p>
      ${b.units.map(u => `
        <section class="card">
          <div class="uh"><a href="#/${u.id}"><h2>第${unitNo(u)}单元　${esc(u.title)}</h2></a><a class="more" href="#/${u.id}/words">词语卡片</a></div>
          ${u.term ? `<div class="term">${esc(u.term)}</div>` : ""}
          <p class="sub">${esc(u.intro)}</p>
          <div class="chips">${chipsHTML(u)}</div>
        </section>`).join("")}`;
  }

  // ---------- 练习：全站 / 单元范围 ----------
  const ACTS = [
    { k: "daily", name: "每日一练", kind: "打卡", desc: "每天固定 10 题混合题型，由日期决定，全班同一天同一套。记连续打卡天数。", noScope: true },
    { k: "mc", name: "语境选义", kind: "选择题", desc: "看原文句子，选加点字词的意思；选项里混着同字异义。答错进错题本。" },
    { k: "cards", name: "字卡", kind: "间隔重复", desc: "翻面后自评记得／模糊／不记得，按间隔安排复习。" },
    { k: "match", name: "配对", kind: "小游戏", desc: "把字词和意思连起来，计时，记失误。" },
    { k: "usage", name: "用法辨析", kind: "选择题", desc: "不问意思，问是哪种用法：活用、通假、虚词、句式。" },
    { k: "sort", name: "归类", kind: "归类", desc: "把句子卡放进篮子：“之”是代词还是助词？也可混合各种虚词。" },
    { k: "find", name: "点字", kind: "无选项", desc: "只告诉你类别，自己把活用词或虚词点出来，更接近真题。" },
    { k: "print", name: "打印小测", kind: "课堂用", desc: "选范围和题型，生成一页纸小测（选择、解释加点字、配对），附答案页。" }
  ];
  const actOk = (k, a) => k === "daily" || ({ mc: a.quiz >= 4, cards: a.items >= 1, match: a.quiz >= 6, usage: a.use + a.xu + a.ju >= 3, sort: a.xu >= 4, find: a.find >= 3, print: a.quiz >= 6 })[k];
  const actCount = (k, a) => ({ daily: "每天 10 题", mc: `${a.quiz} 题可出`, cards: `${a.items} 张`, match: `${a.quiz} 个字词`, usage: `${a.use + a.xu + a.ju} 题`, sort: `${a.xu} 句虚词`, find: `${a.find} 句`, print: `${a.quiz} 个字词可出` })[k];
  const backOf = sc => { const [k, v] = (sc || "all").split(":"); return k === "u" ? `#/${v}` : k === "t" ? `#/${v.split(".")[0]}/${v.split(".")[1]}/words` : "#/p"; };

  function pagePractice(act, scRaw) {
    const P = window.V, info = ACTS.find(x => x.k === act);
    let sc = scRaw || "all";
    const selHTML = `<label>范围 <select id="pscope">${P.scopeOptions()}</select></label>`;
    const bindSel = onChange => { const s = $("#pscope"); if ([...s.options].some(o => o.value === sc)) s.value = sc; else sc = "all"; s.onchange = () => onChange(s.value); };
    if (!info) {                                       // 练习总览
      const hub = () => {
        const a = P.avail(sc);
        app.innerHTML = `
          <h1>练习</h1>
          <p class="sub">按范围练字词。想练某一篇，去那篇文章的“字词学习与自测”标签；想练一个单元，去单元页的“本单元综合练习”；也可以在这里选范围。</p>
          <div class="ctl">${selHTML}<span class="sp"></span><span class="hint">${esc(P.scopeLabel(sc))}</span></div>
          <div class="grid">${ACTS.map(x => {
            const ok = actOk(x.k, a), inner = `<div class="k">${x.kind}</div><h3>${x.name}</h3><div class="a">${esc(x.desc)}</div><div class="ps">${ok ? esc(actCount(x.k, a)) : "这个范围里题太少，换个范围"}</div>`;
            return ok ? `<a class="tile" href="#/p/${x.k}/${x.noScope ? "all" : sc}">${inner}</a>` : `<div class="tile off">${inner}</div>`;
          }).join("")}</div>`;
        bindSel(v => { sc = v; hub(); });
      };
      return hub();
    }
    const back = backOf(sc);
    app.innerHTML = `
      <a class="back np" href="${back}">← ${back === "#/p" ? "练习" : "返回"}</a>
      <h1 class="np">${info.name}${info.noScope ? "" : `<small class="sc"> · ${esc(P.scopeLabel(sc))}</small>`}</h1>
      <p class="sub np">${esc(info.desc)}</p>
      ${info.noScope ? "" : `<div class="ctl np">${selHTML}</div>`}
      <div id="stage"></div>`;
    if (!info.noScope) bindSel(v => { location.hash = `#/p/${act}/${v}`; });
    const st = $("#stage"), exit = () => { location.hash = back; };
    ({
      daily: () => P.runDaily(st), mc: () => P.runMeaning(st, sc, { n: 10 }), cards: () => P.runCards(st, sc, { n: 10, onExit: exit }),
      match: () => P.runMatch(st, sc, { n: 6, onExit: exit }), usage: () => P.runUsage(st, sc, { n: 10, pills: true }),
      sort: () => P.runSort(st, sc), find: () => P.runFind(st, sc), print: () => P.runPrint(st, sc)
    })[act]();
  }

  // 单元页：把本单元几篇合在一起练
  function unitPractice(u) {
    const P = window.V; if (!P) return "";
    const sc = `u:${u.id}`, a = P.avail(sc);
    return `
      <h2>本单元综合练习</h2>
      <p class="sub">把本单元几篇文章的字词合在一起练。想只练某一篇，进那篇文章的“字词学习与自测”标签。</p>
      <div class="chips">${ACTS.filter(x => !x.noScope).map(x => actOk(x.k, a)
        ? `<a class="chip strong" href="#/p/${x.k}/${sc}"><b>${x.name}</b><span>${esc(actCount(x.k, a))}</span></a>`
        : `<div class="chip strong off"><b>${x.name}</b><span>本单元题太少</span></div>`).join("")}</div>`;
  }

  function pageUnit(u) {
    app.innerHTML = `
      <a class="back" href="#/b/${u.book.id}">← 《${esc(u.book.name)}》</a>
      <h1>第${unitNo(u)}单元　${esc(u.title)}</h1>
      ${u.term ? `<div class="term">${esc(u.term)}</div>` : ""}
      <p class="sub">${esc(u.intro)}</p>
      <div class="grid">
        ${u.texts.map(t => { const s = scoreOf(u, t); return `
        <a class="tile" href="#/${u.id}/${t.id}">
          <div class="k">${esc(t.kind)}</div>
          <h3>${esc(t.title)}</h3>
          <div class="a">${esc(t.author)}</div>
          <div class="p"><i style="width:${s.n ? Math.round(100 * s.done / s.n) : 0}%"></i></div>
          <div class="ps">${s.done ? `已做 ${s.done}/${s.n} 题 · 得 ${s.got}/${s.total} 分` : "还没开始"}</div>
          ${hasPractice(u, t) ? (() => { const g = window.V.progress(`t:${u.id}.${t.id}`); return `<div class="ps">字词 已学 ${g.learned}/${g.total}</div>`; })() : ""}
        </a>`; }).join("")}
        <a class="tile" href="#/${u.id}/words"><div class="k">本单元小结</div><h3>词语卡片</h3><div class="a">实词 · 虚词 · 特殊句式</div></a>
      </div>
      ${unitPractice(u)}`;
  }

  function pageText(u, t, tab) {
    S("last", { u: u.id, t: t.id, tab: tab || "read" });
    const s = scoreOf(u, t);
    app.innerHTML = `
      <a class="back" href="#/${u.id}">← 第${unitNo(u)}单元　${esc(u.title)}</a>
      <h1>${esc(t.title)}</h1>
      <p class="sub">${esc(t.author)} · ${esc(t.kind)}</p>
      <div class="tabs">
        <button data-tab="read" class="${tab === "read" ? "on" : ""}">读原文</button>
        <button data-tab="about" class="${tab === "about" ? "on" : ""}">主旨与作者</button>
        <button data-tab="quiz" class="${tab === "quiz" ? "on" : ""}">IGCSE模拟题${s.done ? ` · ${s.got}/${s.total}` : ""}</button>
        ${hasPractice(u, t) ? `<button data-tab="words" class="${tab === "words" ? "on" : ""}">字词学习与自测</button>` : ""}
      </div>
      <div id="panel"></div>`;
    app.querySelectorAll(".tabs button").forEach(b => b.onclick = () => { location.hash = `#/${u.id}/${t.id}/${b.dataset.tab}`; });
    ({ read: tabRead, quiz: tabQuiz, about: tabAbout, words: hasPractice(u, t) ? tabWords : tabRead }[tab] || tabRead)(u, t, $("#panel"));
  }

  function tabRead(u, t, el) {
    const pref = S("pref") || {};
    el.innerHTML = `
      <div class="card gold">${esc(t.lead)}</div>
      <div class="tools">
        <button id="bPy" class="${pref.py ? "on" : ""}">拼音</button>
        <button id="bTr" class="${pref.tr ? "on" : ""}">译文</button>
        <button id="bNo" class="${pref.nonote ? "on" : ""}">隐藏红点</button>
        <button id="bV" class="${pref.v ? "on" : ""}" title="竖排时不显示拼音和译文">竖排</button>
        <span class="sp"></span>
        <button id="bSm">A−</button><button id="bLg">A+</button>
      </div>
      <div class="text ${pref.v ? "v" : pref.py ? "py" : ""}" id="txt" style="--fs:${pref.fs || 1.25}em">
        ${t.paragraphs.map((p, i) => `<p>${renderPara(p)}</p>${pref.tr && !pref.v ? `<div class="tr">${esc(t.translation[i] || "")}</div>` : ""}`).join("")}
      </div>
      <p class="hint">点带红点的字词查看注释。先自己读两遍，再打开译文。竖排适合通读，横排适合配拼音和译文。</p>
      ${hasPractice(u, t) ? `<div class="cta"><span>读完了？把这篇的字词学一遍、测一测。</span><a href="#/${u.id}/${t.id}/words">字词学习与自测 →</a></div>` : ""}`;
    const txt = $("#txt", el);
    const setPref = (k, v) => { pref[k] = v; S("pref", pref); };
    $("#bPy", el).onclick = () => { setPref("py", !pref.py); tabRead(u, t, el); };
    $("#bV", el).onclick = () => { setPref("v", !pref.v); tabRead(u, t, el); };
    $("#bTr", el).onclick = () => { setPref("tr", !pref.tr); tabRead(u, t, el); };
    $("#bNo", el).onclick = () => { setPref("nonote", !pref.nonote); tabRead(u, t, el); };
    $("#bSm", el).onclick = () => { setPref("fs", Math.max(1, (pref.fs || 1.25) - 0.1)); txt.style.setProperty("--fs", pref.fs + "em"); };
    $("#bLg", el).onclick = () => { setPref("fs", Math.min(1.8, (pref.fs || 1.25) + 0.1)); txt.style.setProperty("--fs", pref.fs + "em"); };
    if (pref.nonote) txt.querySelectorAll(".w").forEach(w => w.classList.add("ro"));
  }

  // ---------- “字词”标签页：认识 → 辨认 → 运用，三关 ----------
  function tabWords(u, t, el) {
    const P = window.V, sc = `t:${u.id}.${t.id}`, pg = P.progress(sc), st = pg.steps;
    const steps = [
      { k: "cards", name: "字卡", desc: "先把这篇的字词过一遍：看字和例句，想意思，翻面核对。", stat: `已学 ${pg.learned} / ${pg.total}`, done: pg.total > 0 && pg.learned >= pg.total, ok: pg.total > 0, btn: pg.learned ? "继续" : "开始" },
      { k: "match", name: "配对", desc: "把字词和意思连起来，计时，看能不能刷新本篇纪录。", stat: st.match ? `最快 ${st.match.best} 秒` : "还没做", done: !!st.match, ok: pg.quiz >= 6, btn: st.match ? "再来" : "开始" },
      { k: "mc", name: "选义", desc: `在原文句子里选加点字词的意思，${Math.min(10, pg.quiz)} 题。选项里混着同一个字在别处的意思。`, stat: st.mc ? `上次 ${st.mc.score} / ${st.mc.n}` : "还没做", done: !!st.mc, ok: pg.quiz >= 4, btn: st.mc ? "再来" : "开始" },
      { k: "use", name: "用法", desc: "不问意思，问是哪种用法：活用、通假、虚词、句式。", stat: st.use ? `上次 ${st.use.score} / ${st.use.n}` : `本篇可出 ${pg.useN} 题`, done: !!st.use, ok: pg.useN >= 3, btn: st.use ? "再来" : "开始" }
    ].filter(s => s.k !== "use" || s.ok);                 // 用法题太少的篇不显示这一关
    const nDone = steps.filter(s => s.done).length;
    const home = () => tabWords(u, t, el);
    const au = P.avail(`u:${u.id}`), at = P.avail(sc);
    const moreChips = ACTS.filter(x => ["sort", "find", "print"].includes(x.k)).map(x =>
      actOk(x.k, at) ? `<a class="chip strong" href="#/p/${x.k}/${sc}"><b>${x.name}</b><span>${esc(actCount(x.k, at))}（本篇）</span></a>`
        : actOk(x.k, au) ? `<a class="chip strong" href="#/p/${x.k}/u:${u.id}"><b>${x.name}</b><span>本篇题少，改练本单元 →</span></a>`
          : `<div class="chip strong off"><b>${x.name}</b><span>题太少</span></div>`).join("")
      + `<a class="chip strong" href="#/p/daily"><b>每日一练</b><span>全站每天 10 题 →</span></a>`;
    el.innerHTML = `
      <h2 class="first">这篇的词语</h2>
      <p class="sub">先看一遍：点卡片显示或隐藏解释，先自己说出意思再翻开核对。</p>
      ${glossaryHTML(t, true)}
      <h2>字词自测</h2>
      <div class="whead"><b>本篇字词 ${pg.total} 个</b><span class="wprog">${steps.map(s => `<i class="${s.done ? "on" : ""}"></i>`).join("")} 已完成 ${nDone} / ${steps.length} 关</span></div>
      <p class="sub">读完原文再来。先认识，再辨认，最后在句子里运用。</p>
      <div class="wsteps">${steps.map((s, i) => `
        <div class="wstep ${s.done ? "done" : ""} ${s.ok ? "" : "off"}">
          <span class="no">${i + 1}</span><h3>${s.name}</h3><p>${esc(s.desc)}</p><span class="st">${s.done ? "✓ " : ""}${esc(s.stat)}</span>
          <button class="primary" data-k="${s.k}" ${s.ok ? "" : "disabled"}>${s.ok ? s.btn : "字词太少"}</button>
        </div>`).join("")}</div>
      <h2>更多练习</h2>
      <p class="sub">这几种在本篇里能出的题不多，所以放在这里。本篇题少的，会改成练本单元。</p>
      <div class="chips">${moreChips}</div>
      <div class="wlinks">
        <a href="#/${u.id}">本单元全部综合练习 →</a>
        ${pg.wrong ? `<button id="wrongOnly">只练本篇错题（${pg.wrong}）</button>` : ""}
        <button id="wReset">清除本篇字词记录</button>
      </div>`;
    const run = k => {
      el.innerHTML = `<a class="back" href="#/${u.id}/${t.id}/words" id="bk">← 回到本篇字词</a><div id="act"></div>`;
      $("#bk", el).onclick = ev => { ev.preventDefault(); home(); };
      const act = $("#act", el), o = { onExit: home };
      if (k === "cards") P.runCards(act, sc, Object.assign(o, { n: Math.min(10, pg.total) }));
      else if (k === "match") P.runMatch(act, sc, Object.assign(o, { n: pg.quiz >= 12 ? 6 : 4 }));
      else if (k === "mc") P.runMeaning(act, sc, Object.assign(o, { n: Math.min(10, pg.quiz) }));
      else if (k === "wrong") P.runMeaning(act, sc, Object.assign(o, { n: 10, wrongOnly: true }));
      else P.runUsage(act, sc, Object.assign(o, { n: Math.min(8, pg.useN) }));
    };
    el.querySelectorAll("[data-k]").forEach(b => b.onclick = () => run(b.dataset.k));
    bindCards(el);
    const w = $("#wrongOnly", el); if (w) w.onclick = () => run("wrong");
    $("#wReset", el).onclick = () => { if (confirm("清除这篇的字卡进度、错题和三关记录？")) { P.resetScope(sc); home(); } };
  }

  function tabAbout(u, t, el) {
    el.innerHTML = `
      <h2>文章主旨</h2><div class="card">${esc(t.gist)}</div>
      <h2>作者</h2><div class="card">${esc(t.author_note)}</div>
      ${hasPractice(u, t) ? "" : `<h2>这篇的词语</h2>${glossaryHTML(t, true)}`}`;   // 有“字词学习与自测”的篇，词语卡片放到那一页最上面
    bindCards(el);
  }

  function tabQuiz(u, t, el) {
    const base = `${u.id}.${t.id}.q`;
    const rec = S(base) || {};
    const get = q => rec[q.id] || (rec[q.id] = {});
    const put = () => S(base, rec);
    let letter = 0;
    el.innerHTML = `
      <div class="card" id="scoreBox"></div>
      <div class="card">
        ${t.questions.map(q => {
          const L = String.fromCharCode(97 + letter++);
          const r = get(q);
          let body = "";
          if (q.type === "mc") {
            body = `<div class="opts" data-q="${q.id}">${q.options.map((o, i) => {
              let cls = "";
              if (r.pick !== undefined) { if (i === q.answer) cls = "ok"; else if (i === r.pick) cls = "bad"; }
              return `<button data-i="${i}" class="${cls}">(${"ⅰⅱⅲⅳ"[i]}) ${esc(o)}</button>`; }).join("")}</div>
              ${r.pick !== undefined ? `<div class="why">${esc(q.why)}</div>` : ""}`;
          } else if (q.items) {
            const marks = r.marks || {};
            body = q.items.map((it, i) => `
              <div class="st">(${"ⅰⅱⅲⅳⅴⅵ"[i]}) ${it.s}</div>
              <div class="ans">
                <textarea data-q="${q.id}" data-i="${i}" placeholder="写在这里…">${esc((r.text || {})[i] || "")}</textarea>
                <div class="row">
                  <button class="show" data-q="${q.id}" data-i="${i}">看答案要点</button>
                  <span class="hint">自评：</span>
                  <button class="mk ${marks[i] === true ? "on" : ""}" data-q="${q.id}" data-i="${i}" data-v="1">✓ 对</button>
                  <button class="mk bad ${marks[i] === false ? "on" : ""}" data-q="${q.id}" data-i="${i}" data-v="0">✗ 错</button>
                </div>
                <div class="key" data-key="${q.id}-${i}" ${r.shown && r.shown[i] ? "" : "hidden"}><b>要点</b>${esc(it.key)}${q.hint && i === q.items.length - 1 ? `<div class="hint">${esc(q.hint)}</div>` : ""}</div>
              </div>`).join("");
          } else {
            body = `<div class="ans">
                <textarea data-q="${q.id}" placeholder="写在这里…">${esc(r.text || "")}</textarea>
                <div class="row">
                  <button class="show" data-q="${q.id}">看答案要点</button>
                  <span class="hint">自评：</span>
                  <button class="mk ${r.self === true ? "on" : ""}" data-q="${q.id}" data-v="1">✓ 对</button>
                  <button class="mk bad ${r.self === false ? "on" : ""}" data-q="${q.id}" data-v="0">✗ 错</button>
                </div>
                <div class="key" data-key="${q.id}" ${r.shown ? "" : "hidden"}><b>要点</b>${esc(q.key)}${q.hint ? `<div class="hint">${esc(q.hint)}</div>` : ""}</div>
              </div>`;
          }
          return `<div class="q"><div class="qh"><b>(${L})</b><span>${esc(q.q)}</span><span class="m">[${q.marks}]</span></div>${body}</div>`;
        }).join("")}
      </div>
      <div class="row"><button id="reset">清除这篇的作答</button></div>`;

    const drawScore = () => {
      const s = scoreOf(u, t);
      $("#scoreBox", el).innerHTML = `<div class="score"><span class="big">${s.got} / ${s.total}</span><span>已做 ${s.done} / ${s.n} 题。选择题自动判分；简答题请对照要点自评。</span></div>`;
    };
    drawScore();

    el.querySelectorAll(".opts button").forEach(b => b.onclick = () => {
      const q = t.questions.find(x => x.id === b.parentElement.dataset.q);
      get(q).pick = +b.dataset.i; put(); tabQuiz(u, t, el);
    });
    el.querySelectorAll("textarea").forEach(ta => ta.oninput = () => {
      const q = t.questions.find(x => x.id === ta.dataset.q), r = get(q);
      if (ta.dataset.i !== undefined) { r.text = r.text || {}; r.text[ta.dataset.i] = ta.value; } else r.text = ta.value;
      put();
    });
    el.querySelectorAll(".show").forEach(b => b.onclick = () => {
      const q = t.questions.find(x => x.id === b.dataset.q), r = get(q);
      if (b.dataset.i !== undefined) { r.shown = r.shown || {}; r.shown[b.dataset.i] = true; }
      else r.shown = true;
      put();
      el.querySelector(`[data-key="${q.id}${b.dataset.i !== undefined ? "-" + b.dataset.i : ""}"]`).hidden = false;
    });
    el.querySelectorAll(".mk").forEach(b => b.onclick = () => {
      const q = t.questions.find(x => x.id === b.dataset.q), r = get(q);
      const v = b.dataset.v === "1";
      if (b.dataset.i !== undefined) { r.marks = r.marks || {}; r.marks[b.dataset.i] = v; } else r.self = v;
      put(); tabQuiz(u, t, el);
    });
    $("#reset", el).onclick = () => { if (confirm("清除这篇的作答记录？")) { S(base, {}); tabQuiz(u, t, el); } };
  }

  function glossaryHTML(t, withTitles) {
    const g = t.glossary;
    const mark = (s, w) => esc(s).replace(esc(w), `<em>${esc(w)}</em>`);
    const card = (s, w, d) => `<div class="fc"><div class="s">${w ? mark(s, w) : esc(s)}</div><div class="d hide">${esc(d)}</div><div class="src">${esc(t.title)}</div></div>`;
    return `
      ${withTitles ? "<h2>实词</h2>" : ""}<div class="gl">${g.shici.map(x => card(x[0], x[1], x[2])).join("")}</div>
      ${withTitles ? "<h2>虚词</h2>" : ""}<div class="gl">${g.xuci.map(x => card(x[0], x[1], x[2])).join("")}</div>
      ${withTitles ? "<h2>特殊句式</h2>" : ""}<div class="gl">${g.jushi.map(x => card(x[0], "", x[1])).join("")}</div>`;
  }
  function bindCards(el) {
    el.querySelectorAll(".fc").forEach(c => c.onclick = () => c.querySelector(".d").classList.toggle("hide"));
  }

  function pageWords(units, backHref, backLabel, heading) {
    const which = S("wordsTab") || "shici";
    const all = { shici: [], xuci: [], jushi: [] };
    units.forEach(u => u.texts.forEach(t => { t.glossary.shici.forEach(x => all.shici.push([t, ...x])); t.glossary.xuci.forEach(x => all.xuci.push([t, ...x])); t.glossary.jushi.forEach(x => all.jushi.push([t, x[0], "", x[1]])); }));
    const mark = (s, w) => esc(s).replace(esc(w), `<em>${esc(w)}</em>`);
    const list = all[which];
    app.innerHTML = `
      <a class="back" href="${backHref}">← ${esc(backLabel)}</a>
      <h1>${esc(heading)}</h1>
      <p class="sub">点卡片显示或隐藏解释。先自己说出意思，再翻开核对。</p>
      <div class="tabs">
        <button data-w="shici" class="${which === "shici" ? "on" : ""}">实词 ${all.shici.length}</button>
        <button data-w="xuci" class="${which === "xuci" ? "on" : ""}">虚词 ${all.xuci.length}</button>
        <button data-w="jushi" class="${which === "jushi" ? "on" : ""}">特殊句式 ${all.jushi.length}</button>
        <span class="sp"></span>
        <button id="shuffle">打乱</button><button id="showAll">全部翻开</button>
      </div>
      <div class="gl" id="gl">${list.map(x => `<div class="fc"><div class="s">${x[2] ? mark(x[1], x[2]) : esc(x[1])}</div><div class="d hide">${esc(x[3])}</div><div class="src">${esc(x[0].title)}</div></div>`).join("")}</div>`;
    app.querySelectorAll(".tabs [data-w]").forEach(b => b.onclick = () => { S("wordsTab", b.dataset.w); pageWords(units, backHref, backLabel, heading); });
    bindCards(app);
    $("#shuffle").onclick = () => { const gl = $("#gl"); [...gl.children].sort(() => Math.random() - .5).forEach(c => gl.appendChild(c)); };
    $("#showAll").onclick = () => app.querySelectorAll(".fc .d").forEach(d => d.classList.remove("hide"));
  }

  function pageMethod() {
    app.innerHTML = `
      <h1>三遍读法</h1>
      <p class="sub">读一篇没有注释的文言文，不要逐字查，按下面三遍走。</p>
      <div class="card">
        <ol class="steps">
          <li><b>第一遍：只找“人、事、变化”。</b>圈出人名或代词，框出动作，画出“遂、乃、然、而、则、故”等承接和转折词。不要因为一个名物词停住。</li>
          <li><b>第二遍：处理关键句。</b>优先解决影响人物关系的词：否定、反问、人物态度、因果、位置、时间。遇到不确定的词，用“我猜它是……，因为前后写了……”来作证。</li>
          <li><b>第三遍：答题。</b>每一题先确定题干问的是词义、翻译、概括、人物、态度还是表达效果；再回到原文找证据。两三分的题至少写一项具体证据和一层解释。</li>
        </ol>
      </div>
      <h2>做题时常见的失分点</h2>
      <div class="card">
        <ul class="steps">
          <li><b>把“柑”当成答案。</b>问“真正指的是谁”，要答作者讽刺的对象，不是故事里的东西。</li>
          <li><b>解释词语只写现代义。</b>“业”“市”“甘”这类词要写出它在句中的用法（名词作动词、意动用法等）。</li>
          <li><b>“之”“其”不看位置。</b>动词后面的“之”多是代词；两个名词之间的“之”多是助词“的”。先把它换成“它／他”读一遍，读得通才是代词。</li>
          <li><b>主旨题答成概括题。</b>“写作目的”要答作者借故事想说什么，不是复述故事。</li>
        </ul>
      </div>`;
  }

  route();
})();
