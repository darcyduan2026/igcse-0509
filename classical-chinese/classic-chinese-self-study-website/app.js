/* 文言自学 · 单页应用（无依赖） */
(function () {
  // 两套教材：《匠心》（课堂教材）与《采文》（自学拓展）
  const BOOKS = [
    { id: "jiangxin", name: "匠心", cls: "jx", tag: "课堂教材", units: window.JIANGXIN_UNITS || [],
      blurb: "教材《匠心》五个单元里的文言文：记李歌、节庵方公墓表、蜀贾、湖心亭看雪、《天工开物》序。每篇都有原文点读、译文、练习和词语卡片。" },
    { id: "caiwen", name: "采文", cls: "cw", tag: "自学拓展", units: window.CAIWEN_UNITS || [],
      blurb: "《采文》全书五个单元，每个单元一篇精讲、三篇自测。适合课外自学、拓展阅读和考前练手。" }
  ].filter(b => b.units.length);
  BOOKS.forEach(b => b.units.forEach(u => { u.book = b; }));
  const UNITS = BOOKS.flatMap(b => b.units);
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
      `<a href="#/words" class="${a === "words" ? "on" : ""}">全部词语</a>` +
      `<a href="#/method" class="${a === "method" ? "on" : ""}">三遍读法</a>`;
    bar.innerHTML = cur ? `<div class="bookbar ${cur.cls}"><a class="bk" href="#/b/${cur.id}">${bookTitle(cur)}</a>` +
      cur.units.map(x => `<a href="#/${x.id}" class="${u === x ? "on" : ""}">第${unitNo(x)}单元 ${esc(x.title)}</a>`).join("") + `</div>` : "";
    if (!UNITS.length) { app.innerHTML = "<p>没有内容。</p>"; return; }
    if (a === "method") return pageMethod();
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

  function pageHome() {
    const last = S("last");
    const lu = last && UNITS.find(x => x.id === last.u), lt = lu && lu.texts.find(x => x.id === last.t);
    app.innerHTML = `
      <section class="hero">
        <h1>文言自学</h1>
        <p>IGCSE 0509 中文第一语言 · 文言文阅读。先选一本书，再选单元和文章。原文里带虚线的词可以点开看注释。</p>
      </section>
      <div class="books">
        ${BOOKS.map(b => {
          const st = bookStat(b);
          return `
        <a class="book ${b.cls}" href="#/b/${b.id}">
          <span class="tag">${esc(b.tag)}</span>
          <span class="bname">${esc(b.name)}</span>
          <span class="bsub">${b.units.length} 个单元 · ${st.texts} 篇</span>
          <span class="bdesc">${esc(b.blurb)}</span>
          <span class="blist">${b.units.map(u => `<i>第${unitNo(u)}单元 ${esc(u.title)}</i>`).join("")}</span>
          <span class="bprog"><span class="bar"><i style="width:${st.texts ? Math.round(100 * st.started / st.texts) : 0}%"></i></span><span>${st.started ? `已开始 ${st.started}/${st.texts} 篇` : "还没开始"}</span></span>
          <span class="go">进入《${esc(b.name)}》 →</span>
        </a>`; }).join("")}
      </div>
      ${lt ? `<a class="resume" href="#/${lu.id}/${lt.id}/${last.tab || "read"}"><span>继续上次</span><b>${esc(lt.title)}</b><small>《${esc(lu.book.name)}》第${unitNo(lu)}单元</small></a>` : ""}
      <h2>学习工具</h2>
      <div class="grid">
        <a class="tile" href="#/words"><div class="k">复习</div><h3>全部词语卡片</h3><div class="a">两本书的实词 · 虚词 · 特殊句式</div></a>
        <a class="tile" href="#/method"><div class="k">方法</div><h3>三遍读法</h3><div class="a">读没有注释的文言文，按三遍走</div></a>
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
        </a>`; }).join("")}
        <a class="tile" href="#/${u.id}/words"><div class="k">本单元小结</div><h3>词语卡片</h3><div class="a">实词 · 虚词 · 特殊句式</div></a>
      </div>
      <div class="card soft">
        <b>怎么用这个网站</b>
        <ol class="steps">
          <li>先读<b>原文</b>：不要急着看译文，点带虚线的词可以看注释。</li>
          <li>按<b>三遍读法</b>读完，再打开译文核对自己的理解。</li>
          <li>做<b>练习</b>：选择题会自动判分；简答题写完后对照答案要点，自己打分。</li>
          <li>用<b>词语卡片</b>复习本单元的实词、虚词和句式。</li>
        </ol>
      </div>`;
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
        <button data-tab="quiz" class="${tab === "quiz" ? "on" : ""}">练习${s.done ? ` · ${s.got}/${s.total}` : ""}</button>
        <button data-tab="about" class="${tab === "about" ? "on" : ""}">主旨与作者</button>
      </div>
      <div id="panel"></div>`;
    app.querySelectorAll(".tabs button").forEach(b => b.onclick = () => { location.hash = `#/${u.id}/${t.id}/${b.dataset.tab}`; });
    ({ read: tabRead, quiz: tabQuiz, about: tabAbout }[tab] || tabRead)(u, t, $("#panel"));
  }

  function tabRead(u, t, el) {
    const pref = S("pref") || {};
    el.innerHTML = `
      <div class="card gold">${esc(t.lead)}</div>
      <div class="tools">
        <button id="bPy" class="${pref.py ? "on" : ""}">拼音</button>
        <button id="bTr" class="${pref.tr ? "on" : ""}">译文</button>
        <button id="bNo" class="${pref.nonote ? "on" : ""}">隐藏注释线</button>
        <span class="sp"></span>
        <button id="bSm">A−</button><button id="bLg">A+</button>
      </div>
      <div class="text ${pref.py ? "py" : ""}" id="txt" style="--fs:${pref.fs || 1.25}em">
        ${t.paragraphs.map((p, i) => `<p>${renderPara(p)}</p>${pref.tr ? `<div class="tr">${esc(t.translation[i] || "")}</div>` : ""}`).join("")}
      </div>
      <p class="hint">点带虚线的词查看注释。先自己读两遍，再打开译文。</p>`;
    const txt = $("#txt", el);
    const setPref = (k, v) => { pref[k] = v; S("pref", pref); };
    $("#bPy", el).onclick = () => { setPref("py", !pref.py); tabRead(u, t, el); };
    $("#bTr", el).onclick = () => { setPref("tr", !pref.tr); tabRead(u, t, el); };
    $("#bNo", el).onclick = () => { setPref("nonote", !pref.nonote); tabRead(u, t, el); };
    $("#bSm", el).onclick = () => { setPref("fs", Math.max(1, (pref.fs || 1.25) - 0.1)); txt.style.setProperty("--fs", pref.fs + "em"); };
    $("#bLg", el).onclick = () => { setPref("fs", Math.min(1.8, (pref.fs || 1.25) + 0.1)); txt.style.setProperty("--fs", pref.fs + "em"); };
    if (pref.nonote) txt.querySelectorAll(".w").forEach(w => w.classList.add("ro"));
  }

  function tabAbout(u, t, el) {
    el.innerHTML = `
      <h2>文章主旨</h2><div class="card">${esc(t.gist)}</div>
      <h2>作者</h2><div class="card">${esc(t.author_note)}</div>
      <h2>这篇的词语</h2>${glossaryHTML(t, true)}`;
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
