/* 文言自学 · 字词练习引擎（主站“字词”标签页和 vocab-demos 里的 demo 共用）
 * 题库完全由现有数据自动生成：
 *   - 原文里的 [[词|拼音|注释]]  → 词义题、字卡、配对
 *   - glossary.shici 里带“（意动用法）”等标记的词 → 用法辨析
 *   - glossary.xuci → 虚词辨析；glossary.jushi → 特殊句式辨认
 * 学习记录单独存在 localStorage 的 caiwen.vocab.v1，不碰网站原有的 caiwen.v1。
 */
(function () {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const sample = (a, n) => shuffle(a).slice(0, n);
  const NUM = "一二三四五六七八九十";
  const BOOKS = [
    { id: "jiangxin", name: "匠心", units: window.JIANGXIN_UNITS || [] },
    { id: "caiwen", name: "采文", units: window.CAIWEN_UNITS || [] }
  ].filter(b => b.units.length);

  // ---------- 存储 ----------
  const KEY = "caiwen.vocab.v1";
  let store = {};
  try { store = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch (e) { store = {}; }
  store.cards = store.cards || {}; store.wrong = store.wrong || {}; store.best = store.best || {};
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { } };

  // ---------- 解析原文标注 ----------
  const RE = /\[\[([^|\]]+)\|([^|\]]*)\|([^\]]+)\]\]/g;
  function tokenize(p) {
    const out = []; let i = 0, m; RE.lastIndex = 0;
    while ((m = RE.exec(p))) {
      for (const c of p.slice(i, m.index)) out.push(c);
      out.push({ w: m[1], py: m[2], note: m[3] });
      i = RE.lastIndex;
    }
    for (const c of p.slice(i)) out.push(c);
    return out;
  }
  function splitBy(a, delims) {
    const out = []; let cur = [];
    for (let i = 0; i < a.length; i++) {
      const x = a[i]; cur.push(x);
      if (typeof x === "string" && delims.includes(x)) {
        while (i + 1 < a.length && typeof a[i + 1] === "string" && "”’」』".includes(a[i + 1])) cur.push(a[++i]);
        out.push(cur); cur = [];
      }
    }
    if (cur.length) out.push(cur);
    return out;
  }
  const plen = a => a.reduce((n, x) => n + (typeof x === "string" ? 1 : x.w.length), 0);
  const ctxHTML = (ctx, target) => ctx.map(x => typeof x === "string" ? esc(x) : (x === target ? `<span class="tg">${esc(x.w)}</span>` : esc(x.w))).join("");
  const coreOf = note => note.split(/[。；]/)[0].replace(/（[^）]*）/g, "").trim();

  const items = [];
  BOOKS.forEach(b => b.units.forEach((u, ui) => {
    u.texts.forEach(t => {
      let n = 0;
      t.paragraphs.forEach(p => {
        const sents = splitBy(tokenize(p), "。！？；");
        sents.forEach(s => {
          const clauses = splitBy(s, "，：");
          clauses.forEach((cl, k) => {
            cl.forEach(tok => {
              if (typeof tok === "string") return;
              let lo = k, hi = k, cur = clauses[k];
              while (plen(cur) < 10 && (hi + 1 < clauses.length || lo > 0)) {
                if (hi + 1 < clauses.length) hi++; else lo--;
                cur = clauses.slice(lo, hi + 1).flat();
              }
              const core = coreOf(tok.note);
              items.push({
                id: `${u.id}.${t.id}.${n++}`, w: tok.w, py: tok.py, note: tok.note, core,
                long: !core || core.length > 16, ctx: cur, target: tok,
                book: b.id, unit: u.id, text: `${u.id}.${t.id}`, src: t.title
              });
            });
          });
        });
      });
    });
  }));
  const byId = {}; items.forEach(x => { byId[x.id] = x; });
  const html = x => ctxHTML(x.ctx, x.target);

  // ---------- 范围选择 ----------
  function scopeOptions() {
    let h = `<option value="all">全部</option>`;
    BOOKS.forEach(b => {
      h += `<optgroup label="《${b.name}》"><option value="b:${b.id}">整本《${b.name}》</option>`;
      b.units.forEach((u, ui) => {
        h += `<option value="u:${u.id}">第${NUM[ui] || ""}单元 ${esc(u.title)}</option>`;
        u.texts.forEach(t => { h += `<option value="t:${u.id}.${t.id}">　└ ${esc(t.title)}</option>`; });
      });
      h += `</optgroup>`;
    });
    return h;
  }
  function inScope(x, sc) {
    if (!sc || sc === "all") return true;
    const [k, v] = sc.split(":");
    return k === "b" ? x.book === v : k === "u" ? x.unit === v : x.text === v;
  }
  function scopeBox(el, onChange) {
    el.innerHTML = scopeOptions();
    el.value = store.scope && [...el.options].some(o => o.value === store.scope) ? store.scope : "all";
    el.onchange = () => { store.scope = el.value; save(); onChange && onChange(el.value); };
    return () => el.value;
  }

  // ---------- 词义选择题 ----------
  function meaningQuestion(x, pool) {
    const same = pool.filter(y => y !== x && y.w === x.w && y.core !== x.core);
    const taken = new Set([x.core]);
    const opts = [];
    const add = y => { if (y && !taken.has(y.core) && y.core.indexOf(x.core) < 0 && x.core.indexOf(y.core) < 0) { taken.add(y.core); opts.push(y); } };
    add(shuffle(same)[0]);                                           // 同字异义：最有迷惑性
    const near = pool.filter(y => y.unit === x.unit && y.id !== x.id && Math.abs(y.core.length - x.core.length) <= 4);
    shuffle(near).forEach(y => { if (opts.length < 3) add(y); });
    shuffle(pool).forEach(y => { if (opts.length < 3 && y.id !== x.id) add(y); });
    if (opts.length < 3) return null;
    const options = shuffle([{ t: x.core, ok: true }, ...opts.slice(0, 3).map(y => ({ t: y.core, ok: false }))]);
    return {
      id: x.id, src: `《${x.src}》`, ctx: html(x),
      ask: `句中加点的“<b>${esc(x.w)}</b>”，意思是：`,
      options, reveal: `<b>${esc(x.w)}</b>${x.py ? `<span class="py">${esc(x.py)}</span>` : ""}${esc(x.note)}`
    };
  }

  // ---------- 用法辨析：活用 / 虚词 / 句式 ----------
  const USE_CATS = ["名词作动词", "名词作状语", "意动用法", "使动用法", "通假字", "古今异义"];
  const useCat = s => /名词作动词|名词用作动词/.test(s) ? "名词作动词" : /名词作状语|名词用作状语/.test(s) ? "名词作状语" :
    /意动/.test(s) ? "意动用法" : /使动/.test(s) ? "使动用法" : /通[“"「]|通假/.test(s) ? "通假字" : /古今异义/.test(s) ? "古今异义" : null;
  const XU_CATS = ["代词", "结构助词", "语气词", "连词", "介词", "副词", "兼词"];
  const xuCat = s => /兼词|合音/.test(s) ? "兼词" : /语气词|句末|语气/.test(s) ? "语气词" : /代词/.test(s) ? "代词" :
    /助词|标志|取消独立/.test(s) ? "结构助词" : /连词/.test(s) ? "连词" : /介词/.test(s) ? "介词" : /副词/.test(s) ? "副词" : null;
  // 句式：把杂乱的小标题归成十来种常见类型；复合类型（如“判断句＋定语后置”）不出题，免得选项互相包含
  const JU_RULES = [[/宾语前置/, "宾语前置"], [/定语后置/, "定语后置"], [/状语后置/, "状语后置"], [/数量词后置|数词后置/, "数量词后置"],
    [/判断句/, "判断句"], [/被动/, "被动句"], [/省略/, "省略句"], [/反问/, "反问句"], [/假设/, "假设句"], [/递进/, "递进句"], [/选择/, "选择句"], [/比较/, "比较句"]];
  const juCat = s => { if (/[＋和]/.test(s)) return null; const r = JU_RULES.find(x => x[0].test(s)); return r ? r[1] : null; };

  // 在句子里定位字词：出现不止一次就不出，避免指错。返回 {html, raw, start, len}
  function markIn(sentence, word) {
    const i = sentence.indexOf(word);
    if (i < 0 || sentence.indexOf(word, i + 1) >= 0) return null;
    return { html: esc(sentence.slice(0, i)) + `<span class="tg">${esc(word)}</span>` + esc(sentence.slice(i + word.length)), raw: sentence, start: i, len: word.length };
  }
  const usage = { use: [], xu: [], ju: [] };
  (function () {
    const seen = new Set();
    items.forEach(x => {
      const c = useCat(x.note);
      if (c && !seen.has(x.id)) {
        seen.add(x.id);
        let start = 0; for (const t of x.ctx) { if (t === x.target) break; start += typeof t === "string" ? 1 : t.w.length; }
        const raw = x.ctx.map(t => typeof t === "string" ? t : t.w).join("");
        usage.use.push({ id: "U" + x.id, cat: c, ctx: html(x), raw, start, len: x.w.length, w: x.w, py: x.py, full: x.note, src: x.src, book: x.book, unit: x.unit, text: x.text });
      }
    });
    const seenKey = new Set(usage.use.map(x => x.w + "|" + x.cat));
    BOOKS.forEach(b => b.units.forEach(u => u.texts.forEach(t => {
      const text = `${u.id}.${t.id}`;
      t.glossary.shici.forEach((g, i) => {
        const c = useCat(g[2]); const m = c && markIn(g[0], g[1]);
        if (m && !seenKey.has(g[1] + "|" + c)) { seenKey.add(g[1] + "|" + c); usage.use.push({ id: `S${text}.${i}`, cat: c, ctx: m.html, raw: m.raw, start: m.start, len: m.len, w: g[1], py: "", full: g[2], src: t.title, book: b.id, unit: u.id, text }); }
      });
      t.glossary.xuci.forEach((g, i) => {
        const c = xuCat(g[2]); const m = c && markIn(g[0], g[1]);
        if (m) usage.xu.push({ id: `X${text}.${i}`, cat: c, ctx: m.html, raw: m.raw, start: m.start, len: m.len, w: g[1], py: "", full: g[2], src: t.title, book: b.id, unit: u.id, text });
      });
      t.glossary.jushi.forEach((g, i) => {
        const type = juCat(g[1].split(/[：:]/)[0].trim());
        if (/[：:]/.test(g[1]) && type) usage.ju.push({ id: `J${text}.${i}`, cat: type, ctx: esc(g[0]), w: "", py: "", full: g[1], src: t.title, book: b.id, unit: u.id, text });
      });
    })));
  })();
  const juTypes = [...new Set(usage.ju.map(x => x.cat))];
  const usageSets = { use: [USE_CATS, "加点的“{w}”属于哪种用法？"], xu: [XU_CATS, "句中的“{w}”是什么词？"], ju: [juTypes, "这个句子属于哪种句式？"] };
  function usageQuestion(mode, x) {
    const [cats, ask] = usageSets[mode];
    const others = sample(cats.filter(c => c !== x.cat), 3);
    if (others.length < 3) return null;
    return {
      id: x.id, src: `《${x.src}》`, ctx: x.ctx, ask: ask.replace("{w}", esc(x.w)),
      options: shuffle([{ t: x.cat, ok: true }, ...others.map(c => ({ t: c, ok: false }))]),
      reveal: `${x.w ? `<b>${esc(x.w)}</b>` : ""}${esc(x.full)}`
    };
  }
  const usagePool = (mode, sc) => usage[mode].filter(x => inScope(x, sc));
  // 按类别轮流抽题，避免“代词”这类大类把别的类别淹没
  function balanced(pool, n) {
    const g = {}; shuffle(pool).forEach(x => (g[x.cat] = g[x.cat] || []).push(x));
    const lists = shuffle(Object.values(g)), out = [];
    while (out.length < n && lists.some(l => l.length)) lists.forEach(l => { if (l.length && out.length < n) out.push(l.pop()); });
    return shuffle(out);
  }

  // ---------- 答题引擎 ----------
  let kb = null;
  document.addEventListener("keydown", e => { if (kb && !e.metaKey && !e.ctrlKey && !e.altKey && !/INPUT|SELECT|TEXTAREA/.test(e.target.tagName)) kb(e); });
  function runQuiz(el, qs, opts) {
    opts = opts || {};
    let i = 0, score = 0, answered = false; const wrong = [];
    function show() {
      const q = qs[i]; answered = false;
      el.innerHTML = `
        <div class="qcard">
          <div class="qmeta"><span>第 ${i + 1} / ${qs.length} 题</span><span>${esc(q.src || "")}</span></div>
          <div class="vbar"><i style="width:${Math.round(100 * i / qs.length)}%"></i></div>
          <div class="qctx">${q.ctx}</div>
          <div class="qask">${q.ask}</div>
          <div class="opts qopts">${q.options.map((o, k) => `<button data-k="${k}"><kbd>${k + 1}</kbd>${esc(o.t)}</button>`).join("")}</div>
          <div class="qrev" hidden></div>
          <div class="row"><button class="next primary" hidden>${i + 1 < qs.length ? "下一题 →" : "看结果"}</button><span class="hint">按 1–4 选择，Enter 下一题</span></div>
        </div>`;
      const btns = [...el.querySelectorAll(".qopts button")];
      const pick = k => {
        if (answered || !q.options[k]) return; answered = true;
        const ok = q.options[k].ok; if (ok) score++; else wrong.push(q);
        btns.forEach((b, j) => { b.disabled = true; if (q.options[j].ok) b.classList.add("ok"); else if (j === k) b.classList.add("bad"); });
        const rv = el.querySelector(".qrev"); rv.innerHTML = `<span class="verdict ${ok ? "yes" : "no"}">${ok ? "✓ 答对了" : "✗ 再记一下"}</span>${q.reveal}`; rv.hidden = false;
        const nx = el.querySelector(".next"); nx.hidden = false; nx.focus({ preventScroll: true });
        opts.onAnswer && opts.onAnswer(q, ok);
      };
      btns.forEach((b, k) => b.onclick = () => pick(k));
      const next = () => { if (!answered) return; i++; i < qs.length ? show() : finish(); };
      el.querySelector(".next").onclick = next;
      kb = e => {
        if (/^[1-9]$/.test(e.key)) pick(+e.key - 1);
        else if (e.key === "Enter" || e.key === "ArrowRight") { if (answered) { e.preventDefault(); next(); } }
      };
    }
    function finish() {
      kb = null;
      const pct = Math.round(100 * score / qs.length);
      el.innerHTML = `
        <div class="qcard">
          <div class="score"><span class="big">${score} / ${qs.length}</span><span>${pct >= 90 ? "很稳，换个范围再来。" : pct >= 60 ? "不错，错的几个再看一遍。" : "别急，先把下面的错题看一遍再来一轮。"}</span></div>
          ${wrong.length ? `<h3 class="wh">这轮答错的</h3>${wrong.map(q => `<div class="wq"><div class="qctx sm">${q.ctx}</div><div class="qrev">${q.reveal}</div></div>`).join("")}` : `<p class="sub">全对！</p>`}
          <div class="row">${(opts.actions || []).map((a, k) => `<button class="${k === 0 ? "primary" : ""}" data-a="${k}">${esc(a.label)}</button>`).join("")}</div>
        </div>`;
      el.querySelectorAll("[data-a]").forEach(b => b.onclick = () => opts.actions[+b.dataset.a].fn());
      opts.onFinish && opts.onFinish(score, qs.length);
      window.scrollTo(0, 0);
    }
    if (!qs.length) { el.innerHTML = `<div class="card">这个范围里没有可出的题，换一个范围试试。</div>`; return; }
    show();
  }

  // ---------- 页面外框 ----------
  const PAGES = [["index.html", "总览"], ["mc.html", "语境选义"], ["cards.html", "字卡"], ["match.html", "配对"], ["usage.html", "用法辨析"],
    ["sort.html", "归类"], ["find.html", "点字"], ["daily.html", "每日一练"], ["print.html", "打印小测"]];
  function chrome(active) {
    const top = document.createElement("header");
    top.className = "vtop";
    top.innerHTML = `<a class="seal" href="index.html" aria-label="字词练习 总览">字词<br>练习</a>
      <nav>${PAGES.map(p => `<a href="${p[0]}" class="${p[0] === active ? "on" : ""}">${p[1]}</a>`).join("")}</nav>
      <a class="site" href="../index.html">← 回到网站</a><button class="icon" id="themeBtn" title="切换深浅色">◐</button>`;
    document.body.prepend(top);
    const setTheme = t => document.documentElement.setAttribute("data-theme", t);
    try { const t = localStorage.getItem("caiwen.theme"); if (t) setTheme(t); } catch (e) { }
    top.querySelector("#themeBtn").onclick = () => {
      const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      setTheme(next); try { localStorage.setItem("caiwen.theme", next); } catch (e) { }
    };
  }

  // 带种子的随机：同一个种子永远抽出同一套题（每日一练用，全班同一天题目一样）
  function seeded(seed, fn) {
    let h = 1779033703 ^ seed.length;
    for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
    let a = h >>> 0;
    const real = Math.random;
    Math.random = () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    try { return fn(); } finally { Math.random = real; }
  }
  const dayKey = d => { d = d || new Date(); const p = n => String(n).padStart(2, "0"); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; };

  // ================= 可嵌入任意页面的练习（主站“字词”标签页用） =================
  const today = () => Math.floor(Date.now() / 864e5);
  const INT = [0, 1, 3, 7, 14];                       // 字卡各“盒子”的复习间隔（天）
  store.prog = store.prog || {};
  const bankAll = items.filter(x => !x.long);
  const inSc = sc => items.filter(x => inScope(x, sc));
  function mark(sc, step, data) { (store.prog[sc] = store.prog[sc] || {})[step] = Object.assign({ at: dayKey() }, data); save(); }

  // 某个范围（一篇文章）的进度汇总
  function progress(sc) {
    const its = inSc(sc), pr = store.prog[sc] || {};
    const useN = usage.use.concat(usage.xu, usage.ju).filter(x => inScope(x, sc)).length;
    const wrong = its.filter(x => store.wrong[x.id]).length;
    return { total: its.length, quiz: its.filter(x => !x.long).length, learned: its.filter(x => store.cards[x.id]).length, useN, wrong, steps: pr };
  }
  function resetScope(sc) {
    inSc(sc).forEach(x => { delete store.cards[x.id]; delete store.wrong[x.id]; });
    delete store.prog[sc]; save();
  }

  // 字卡：间隔重复
  function runCards(el, sc, opts) {
    opts = opts || {};
    const its = inSc(sc), t = today();
    const due = its.filter(x => store.cards[x.id] && store.cards[x.id].due <= t);
    const fresh = sample(its.filter(x => !store.cards[x.id]), opts.n || 10);
    const queue = shuffle(due.concat(fresh)).map(x => x.id);
    let idx = 0, flipped = false, rev = false; const tally = { yes: 0, mid: 0, no: 0 };
    const q = s => el.querySelector(s);
    function draw() {
      if (idx >= queue.length) {
        kb = null;
        const left = its.filter(x => !store.cards[x.id]).length;
        el.innerHTML = queue.length
          ? `<div class="qcard"><div class="score"><span class="big">${queue.length}</span><span>张卡练完了：记得 ${tally.yes} · 模糊 ${tally.mid} · 不记得 ${tally.no}。<br>不记得的明天还会再出现。${left ? `本篇还有 ${left} 个没学过的字词。` : "本篇的字词都学过一遍了。"}</span></div>
              <div class="row">${left ? `<button class="primary" id="more">再学一组</button>` : ""}<button id="exit">返回</button></div></div>`
          : `<div class="card">今天没有要复习的卡，也没有新字词了。明天再来。<div class="row"><button id="exit">返回</button></div></div>`;
        const m = q("#more"); if (m) m.onclick = () => runCards(el, sc, opts);
        q("#exit").onclick = () => opts.onExit && opts.onExit();
        opts.onDone && opts.onDone(); return;
      }
      const x = byId[queue[idx]];
      const front = rev
        ? `<div class="mean" style="font-size:1.8em">${esc(x.core || x.note)}</div><div class="note">这是哪个字词？</div>`
        : `<div class="big">${esc(x.w)}</div><div class="sent">${html(x)}</div>`;
      const back = rev
        ? `<div class="big sm">${esc(x.w)}</div><div class="py">${esc(x.py)}</div><div class="sent">${html(x)}</div><div class="note">${esc(x.note)}</div>`
        : `<div class="big sm">${esc(x.w)}</div><div class="py">${esc(x.py)}</div><div class="mean"><b>${esc(x.core || x.note)}</b></div>${x.note !== x.core ? `<div class="note">${esc(x.note)}</div>` : ""}`;
      el.innerHTML = `
        <div class="qmeta"><span>第 ${idx + 1} / ${queue.length} 张</span><span>空格翻面 · 1 不记得 · 2 模糊 · 3 记得</span></div>
        <div class="flip ${flipped ? "on" : ""}" id="flip"><div class="in"><div class="face front">${front}<span class="tap">点一下翻面</span></div><div class="face back">${back}</div></div></div>
        <div class="grade" style="visibility:${flipped ? "visible" : "hidden"}">
          <button class="g-no" data-g="no">不记得<small>当天再来</small></button><button class="g-mid" data-g="mid">模糊<small>明天再来</small></button><button class="g-yes" data-g="yes">记得<small>隔更久再来</small></button></div>
        <div class="row"><button id="exit">返回</button><button id="rv">${rev ? "正面改回“字＋例句”" : "正面改成“释义”（反向回忆）"}</button></div>`;
      q("#flip").onclick = flip;
      el.querySelectorAll("[data-g]").forEach(b => b.onclick = () => grade(b.dataset.g));
      q("#exit").onclick = () => { kb = null; opts.onExit && opts.onExit(); };
      q("#rv").onclick = () => { rev = !rev; flipped = false; draw(); };
      kb = e => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); flip(); } else if (e.key === "1") grade("no"); else if (e.key === "2") grade("mid"); else if (e.key === "3") grade("yes"); };
    }
    function flip() { const f = q("#flip"); if (!f) return; flipped = !flipped; f.classList.toggle("on", flipped); q(".grade").style.visibility = flipped ? "visible" : "hidden"; }
    function grade(g) {
      if (!flipped || idx >= queue.length) return;
      const id = queue[idx], tt = today(), c = store.cards[id] || { box: 0, due: tt };
      if (g === "yes") { c.box = Math.min(c.box + 1, 4); c.due = tt + INT[c.box]; }
      else if (g === "mid") { c.box = Math.max(c.box, 1); c.due = tt + 1; }
      else { c.box = 0; c.due = tt; if (queue.filter(z => z === id).length < 3) queue.push(id); }
      store.cards[id] = c; save(); tally[g]++; idx++; flipped = false; draw();
    }
    if (!its.length) { el.innerHTML = `<div class="card">这一篇没有可做字卡的字词。</div>`; return; }
    draw();
  }

  // 配对：左边字词、右边意思
  function runMatch(el, sc, opts) {
    opts = opts || {};
    const n = opts.n || 6, e = esc;
    const pool = shuffle(inSc(sc).filter(x => !x.long && x.core.length <= 10));
    const w = new Set(), m = new Set(), pairs = [];
    for (const x of pool) { if (pairs.length >= n) break; if (w.has(x.w) || m.has(x.core)) continue; w.add(x.w); m.add(x.core); pairs.push(x); }
    if (pairs.length < 3) { el.innerHTML = `<div class="card">这一篇可配对的字词太少。<div class="row"><button id="exit">返回</button></div></div>`; el.querySelector("#exit").onclick = () => opts.onExit && opts.onExit(); return; }
    const key = "match" + pairs.length, best = store.best[sc + "." + key];
    el.innerHTML = `
      <div class="mhead"><span>用时 <b class="tm">0</b> 秒</span><span>失误 <b class="er">0</b></span><span>已配 <b class="dn">0</b> / ${pairs.length}</span>${best ? `<span>本篇最快 ${best} 秒</span>` : ""}</div>
      <div class="mgrid"><div class="mcol L">${shuffle(pairs).map(x => `<button class="mcell wd" data-id="${x.id}">${e(x.w)}${x.py ? `<small>${e(x.py)}</small>` : ""}</button>`).join("")}</div>
      <div class="mcol R">${shuffle(pairs).map(x => `<button class="mcell" data-id="${x.id}">${e(x.core)}</button>`).join("")}</div></div>
      <div class="mctx">先点左边的字词。选中后这里会显示它在原文里的句子。</div><div class="res"></div>
      <div class="row"><button class="exit">返回</button></div>`;
    const q = s => el.querySelector(s);
    let selL = null, selR = null, done = 0, err = 0, t0 = 0, timer = null;
    q(".exit").onclick = () => { clearInterval(timer); opts.onExit && opts.onExit(); };
    function choose(side, b) {
      if (b.classList.contains("done")) return;
      if (!t0) { t0 = Date.now(); timer = setInterval(() => { if (!el.isConnected) { clearInterval(timer); return; } q(".tm").textContent = Math.floor((Date.now() - t0) / 1000); }, 500); }
      el.querySelectorAll(side === "L" ? ".L .sel" : ".R .sel").forEach(x => x.classList.remove("sel"));
      b.classList.add("sel");
      if (side === "L") { selL = b; const x = byId[b.dataset.id]; q(".mctx").innerHTML = html(x) + `　<small>《${e(x.src)}》</small>`; } else selR = b;
      if (!selL || !selR) return;
      const A = selL, B = selR; selL = selR = null;
      if (A.dataset.id === B.dataset.id) {
        [A, B].forEach(x => { x.classList.remove("sel"); x.classList.add("done"); }); done++; q(".dn").textContent = done;
        const x = byId[A.dataset.id]; q(".mctx").innerHTML = html(x) + `　<small>${e(x.note)}</small>`;
        if (done === pairs.length) {
          clearInterval(timer); const s = Math.max(1, Math.round((Date.now() - t0) / 1000));
          const nb = !store.best[sc + "." + key] || s < store.best[sc + "." + key]; if (nb) { store.best[sc + "." + key] = s; }
          mark(sc, "match", { best: store.best[sc + "." + key], err }); opts.onDone && opts.onDone();
          q(".res").innerHTML = `<div class="qcard"><div class="score"><span class="big">${s} 秒</span><span>失误 ${err} 次${nb ? "，刷新了本篇纪录！" : ""}</span></div><div class="row"><button class="primary again">再来一组</button></div></div>`;
          q(".again").onclick = () => runMatch(el, sc, opts);
        }
      } else {
        err++; q(".er").textContent = err;
        [A, B].forEach(x => { x.classList.remove("sel"); x.classList.add("shake"); setTimeout(() => x.classList.remove("shake"), 350); });
      }
    }
    el.querySelectorAll(".L button").forEach(b => b.onclick = () => choose("L", b));
    el.querySelectorAll(".R button").forEach(b => b.onclick = () => choose("R", b));
  }

  // 语境选义（范围内出题，选项从整个题库挑）
  function runMeaning(el, sc, opts) {
    opts = opts || {};
    let pool = bankAll.filter(x => inScope(x, sc));
    if (opts.wrongOnly) pool = pool.filter(x => store.wrong[x.id]);
    const qs = sample(pool, opts.n || 10).map(x => meaningQuestion(x, bankAll)).filter(Boolean);
    runQuiz(el, qs, {
      onAnswer: (q, ok) => { if (!ok) store.wrong[q.id] = (store.wrong[q.id] || 0) + 1; else if (opts.wrongOnly) delete store.wrong[q.id]; save(); },
      onFinish: (score, n) => { if (!opts.wrongOnly) mark(sc, "mc", { score, n }); opts.onDone && opts.onDone(); },
      actions: [{ label: "再来一轮", fn: () => runMeaning(el, sc, opts) }]
        .concat(!opts.wrongOnly && bankAll.some(x => inScope(x, sc) && store.wrong[x.id]) ? [{ label: "只练错题本", fn: () => runMeaning(el, sc, Object.assign({}, opts, { wrongOnly: true })) }] : [])
        .concat(opts.onExit ? [{ label: "返回", fn: () => opts.onExit() }] : [])
    });
  }

  // 用法：活用·通假 / 虚词 / 句式混合
  function runUsage(el, sc, opts) {
    opts = opts || {};
    const mode = opts.mode || "mix";                       // mix = 三类混合；也可只出 use / xu / ju
    let stage = el;
    if (opts.pills) {                                      // 全站“练习”页：顶部可切换类别
      el.innerHTML = `<div class="pillrow">${[["mix", "综合"], ["use", "活用 · 通假"], ["xu", "虚词"], ["ju", "特殊句式"]].map(p => `<button data-m="${p[0]}" class="${p[0] === mode ? "on" : ""}">${p[1]}</button>`).join("")}</div><div class="ustage"></div>`;
      el.querySelectorAll(".pillrow button").forEach(b => b.onclick = () => runUsage(el, sc, Object.assign({}, opts, { mode: b.dataset.m })));
      stage = el.querySelector(".ustage");
    }
    const modes = (mode === "mix" ? ["use", "xu", "ju"] : [mode]).map(m => [m, shuffle(usagePool(m, sc))]).filter(x => x[1].length);
    const picks = []; let k = 0;
    while (picks.length < (opts.n || 8) && modes.some(x => x[1].length)) { const x = modes[k++ % modes.length]; if (x[1].length) picks.push([x[0], x[1].pop()]); }
    const qs = shuffle(picks).map(p => usageQuestion(p[0], p[1])).filter(Boolean);
    runQuiz(stage, qs, {
      onFinish: (score, n) => { mark(sc, "use", { score, n }); opts.onDone && opts.onDone(); },
      actions: [{ label: "再来一轮", fn: () => runUsage(el, sc, opts) }].concat(opts.onExit ? [{ label: "返回", fn: () => opts.onExit() }] : [])
    });
  }

  // ---------- 范围的名字、各类题的可用数量 ----------
  function scopeLabel(sc) {
    if (!sc || sc === "all") return "全部";
    const [k, v] = sc.split(":");
    for (const b of BOOKS) {
      if (k === "b" && b.id === v) return `《${b.name}》`;
      for (let i = 0; i < b.units.length; i++) {
        const u = b.units[i];
        if (k === "u" && u.id === v) return `《${b.name}》第${NUM[i] || ""}单元 ${u.title}`;
        for (const t of u.texts) if (k === "t" && `${u.id}.${t.id}` === v) return `《${t.title}》`;
      }
    }
    return "全部";
  }
  function avail(sc) {
    const its = inSc(sc);
    const use = usagePool("use", sc), xu = usagePool("xu", sc), ju = usagePool("ju", sc);
    return { items: its.length, quiz: its.filter(x => !x.long).length, use: use.length, xu: xu.length, ju: ju.length,
      zhi: xu.filter(x => x.w === "之" && (x.cat === "代词" || x.cat === "结构助词")).length,
      find: use.concat(xu).filter(x => x.len <= 3).length };
  }
  function streak() {
    const d = store.daily || {}; let n = 0, c = new Date();
    if (!d[dayKey(c)]) c.setDate(c.getDate() - 1);
    while (d[dayKey(c)]) { n++; c.setDate(c.getDate() - 1); }
    return n;
  }

  // ---------- 归类：把句子卡放进篮子 ----------
  function runSort(el, sc, opts) {
    opts = opts || {};
    const BK = {
      zhi: [["代词", "指代人或事物，能换成“他/她/它”"], ["结构助词", "放在两个词之间，能换成“的”"]],
      mix: [["代词", "之、其、吾、汝……"], ["结构助词", "的、定语标志"], ["语气词", "句末或句中的语气"], ["连词", "而、虽、况、苟……"], ["介词", "以、为……"]]
    };
    const TIPS = {
      zhi: "小技巧：把“之”换成“他／它”读一遍，读得通就是代词（动词后面的“之”多是这样）；夹在两个名词之间、能换成“的”，就是结构助词。",
      mix: "这一组把几种虚词混在一起，先想“这个字在句子里起什么作用”：指代、连接、表示语气，还是引出对象。"
    };
    let mode = opts.mode || "zhi";
    function start() {
      const names = BK[mode].map(b => b[0]);
      const pool = usagePool("xu", sc).filter(x => names.includes(x.cat) && (mode === "mix" || x.w === "之"));
      const cards = balanced(pool, mode === "zhi" ? 8 : 10); let sel = null, err = 0;
      el.innerHTML = `
        <div class="pillrow"><button data-m="zhi" class="${mode === "zhi" ? "on" : ""}">“之”：代词还是助词</button><button data-m="mix" class="${mode === "mix" ? "on" : ""}">各种虚词混合</button></div>
        <div class="tip">${TIPS[mode]}</div>
        ${cards.length < 2 ? `<div class="card">这个范围里可用的句子太少（${pool.length} 张），换个范围，或切到另一种看看。</div>` : `
        <div class="tray">${cards.map(x => `<button class="scard" data-id="${x.id}">${x.ctx}</button>`).join("")}</div>
        <div class="sortgrid" style="grid-template-columns:repeat(${BK[mode].length},minmax(0,1fr))">${BK[mode].map(b => `<div class="bucket" data-c="${esc(b[0])}"><button class="bhd">${esc(b[0])}<small>${esc(b[1])}</small></button><div class="blist"></div></div>`).join("")}</div>`}
        <div class="res"></div>`;
      el.querySelectorAll(".pillrow button").forEach(b => b.onclick = () => { mode = b.dataset.m; start(); });
      const tray = el.querySelector(".tray"), tip = el.querySelector(".tip");
      if (!tray) return;
      tray.querySelectorAll(".scard").forEach(b => b.onclick = () => { tray.querySelectorAll(".sel").forEach(x => x.classList.remove("sel")); b.classList.add("sel"); sel = b; });
      el.querySelectorAll(".bucket").forEach(bk => bk.querySelector(".bhd").onclick = () => {
        if (!sel) { tip.textContent = "先点上面的一张句子卡，再点篮子。"; return; }
        const x = cards.find(c => c.id === sel.dataset.id), b = sel;
        if (x.cat === bk.dataset.c) {
          const d = document.createElement("div"); d.className = "placed"; d.innerHTML = `${x.ctx}<small>${esc(x.full)}</small>`;
          bk.querySelector(".blist").appendChild(d); b.remove(); sel = null;
          if (!tray.children.length) {
            tip.textContent = TIPS[mode];
            el.querySelector(".res").innerHTML = `<div class="qcard"><div class="score"><span class="big">${err ? "错 " + err + " 次" : "一次全对"}</span><span>${cards.length} 张句子都归好了。看看同一个篮子里的句子，有什么共同点？</span></div><div class="row"><button class="primary again">再来一组</button></div></div>`;
            el.querySelector(".again").onclick = start; opts.onDone && opts.onDone();
          }
        } else { err++; b.classList.add("shake"); setTimeout(() => b.classList.remove("shake"), 350); tip.textContent = "再想想：这个字在句子里是什么作用？"; }
      });
    }
    start();
  }

  // ---------- 点字：自己把活用词／虚词点出来 ----------
  function runFind(el, sc, opts) {
    opts = opts || {};
    const PUNC = /[，。！？；：、“”‘’（）《》\s]/;
    let mode = opts.mode || "use";
    function start() {
      const pool = usagePool(mode, sc).filter(x => x.len <= 3);
      const qs = balanced(pool, 8); let i = 0, score = 0; const miss = [];
      const head = `<div class="pillrow"><button data-m="use" class="${mode === "use" ? "on" : ""}">活用 · 通假</button><button data-m="xu" class="${mode === "xu" ? "on" : ""}">虚词</button></div>`;
      const bindPills = () => el.querySelectorAll(".pillrow button").forEach(b => b.onclick = () => { mode = b.dataset.m; start(); });
      function show() {
        if (!qs.length) { el.innerHTML = head + `<div class="card">这个范围里可出的句子太少（${pool.length} 句），换个范围或换一种看看。</div>`; bindPills(); return; }
        if (i >= qs.length) {
          el.innerHTML = head + `<div class="qcard"><div class="score"><span class="big">${score} / ${qs.length}</span><span>${miss.length ? "没找到的几句，再看一遍：" : "全部找对！"}</span></div>
            ${miss.map(q => `<div class="wq"><div class="qctx sm">${q.ctx}</div><div class="qrev"><b>${esc(q.w)}</b>${esc(q.full)}</div></div>`).join("")}
            <div class="row"><button class="primary again">再来一轮</button></div></div>`;
          bindPills(); el.querySelector(".again").onclick = start; opts.onDone && opts.onDone(); return;
        }
        const q = qs[i], ask = mode === "use" ? `这句里有一个“<b>${esc(q.cat)}</b>”的字，把它点出来：` : `点出句中的“<b>${esc(q.cat)}</b>”：`;
        el.innerHTML = head + `<div class="qcard"><div class="qmeta"><span>第 ${i + 1} / ${qs.length} 题</span><span>《${esc(q.src)}》</span></div><div class="vbar"><i style="width:${Math.round(100 * i / qs.length)}%"></i></div>
          <div class="qask">${ask}</div><div class="chs">${[...q.raw].map((c, k) => PUNC.test(c) ? `<span class="punc">${esc(c)}</span>` : `<button class="ch" data-k="${k}">${esc(c)}</button>`).join("")}</div>
          <div class="qrev" hidden></div><div class="row"><button class="next primary" hidden>${i + 1 < qs.length ? "下一题 →" : "看结果"}</button></div>
          <p class="hint">一句里可能不止一处符合，这里只认词语表里标的那一处。</p></div>`;
        bindPills();
        const btns = [...el.querySelectorAll(".ch")]; let done = false;
        btns.forEach(b => b.onclick = () => {
          if (done) return; done = true;
          const k = +b.dataset.k, hit = k >= q.start && k < q.start + q.len;
          btns.forEach(x => { const kk = +x.dataset.k; x.disabled = true; if (kk >= q.start && kk < q.start + q.len) x.classList.add(hit ? "ok" : "tgt"); });
          if (!hit) b.classList.add("bad");
          hit ? score++ : miss.push(q);
          const rv = el.querySelector(".qrev"); rv.innerHTML = `<span class="verdict ${hit ? "yes" : "no"}">${hit ? "✓ 找对了" : "✗ 答案是黄色的字"}</span><b>${esc(q.w)}</b>${esc(q.full)}`; rv.hidden = false;
          const nx = el.querySelector(".next"); nx.hidden = false; nx.focus({ preventScroll: true }); nx.onclick = () => { i++; show(); };
        });
      }
      show();
    }
    start();
  }

  // ---------- 每日一练：由日期决定的 10 题，全班同一天同一套 ----------
  function runDaily(el, opts) {
    opts = opts || {};
    store.daily = store.daily || {};
    const key = dayKey();
    function compose() {
      return seeded("caiwen-daily-" + key, () => {
        const qs = [];
        sample(bankAll, 5).forEach(x => { const q = meaningQuestion(x, bankAll); if (q) qs.push(q); });
        sample(usage.use, 2).forEach(x => { const q = usageQuestion("use", x); if (q) qs.push(q); });
        balanced(usage.xu, 2).forEach(x => { const q = usageQuestion("xu", x); if (q) qs.push(q); });
        sample(usage.ju, 1).forEach(x => { const q = usageQuestion("ju", x); if (q) qs.push(q); });
        return shuffle(qs);
      });
    }
    function head() {
      let days = "";
      for (let k = 13; k >= 0; k--) { const d = new Date(); d.setDate(d.getDate() - k); const kk = dayKey(d), r = store.daily[kk]; days += `<i class="${r ? "on" : ""}${k === 0 ? " today" : ""}" title="${kk}${r ? "：" + r.best + "/" + r.n : ""}"></i>`; }
      const t = store.daily[key];
      return `<div class="card"><div class="streak"><div><span class="big">${streak()}</span> 天<div class="hint">连续打卡</div></div>
        <div><div class="days">${days}</div><div class="hint">${t ? `今天已完成，最好成绩 ${t.best} / ${t.n}。再做一遍不影响连胜。` : "最近 14 天（红色 = 当天做完了）"}</div></div></div></div>`;
    }
    function start() {
      el.innerHTML = `<div class="dh">${head()}</div><div class="ds"></div>`;
      runQuiz(el.querySelector(".ds"), compose(), {
        onAnswer: (q, ok) => { if (!ok && byId[q.id]) { store.wrong[q.id] = (store.wrong[q.id] || 0) + 1; save(); } },
        onFinish: (score, n) => { const r = store.daily[key]; store.daily[key] = { best: Math.max(score, r ? r.best : 0), n }; save(); el.querySelector(".dh").innerHTML = head(); opts.onDone && opts.onDone(); },
        actions: [{ label: "再做一遍", fn: start }]
      });
    }
    start();
  }

  // ---------- 打印小测 ----------
  function runPrint(el, sc, label) {
    const e = esc, L = "ABCDEF", num = ["一", "二", "三"]; label = label || scopeLabel(sc);
    el.innerHTML = `
      <div class="ctl np">
        <label>选择题 <select class="n1"><option>0</option><option>5</option><option>8</option><option selected>10</option><option>15</option></select></label>
        <label>解释加点字 <select class="n2"><option>0</option><option>3</option><option selected>5</option><option>8</option><option>10</option></select></label>
        <label>配对 <select class="n3"><option>0</option><option>4</option><option selected>6</option></select> 对</label>
        <label><input type="checkbox" class="ak" checked> 含答案页</label><span class="sp"></span>
        <button class="primary go">生成一套</button><button class="pr">打印</button>
      </div>
      <p class="hint np">每次生成的题都不一样。答案另起一页，只发学生页时只打印第 1 页即可。</p><div class="paper"></div>`;
    const q = s => el.querySelector(s), bank = bankAll.filter(x => inScope(x, sc));
    function pickMatch(n, avoid) {
      const w = new Set(), m = new Set(), out = [];
      for (const x of shuffle(bank.filter(x => !avoid.has(x.id) && x.core.length <= 10))) { if (out.length >= n) break; if (w.has(x.w) || m.has(x.core)) continue; w.add(x.w); m.add(x.core); out.push(x); }
      return out;
    }
    function make() {
      const n1 = +q(".n1").value, n2 = +q(".n2").value, n3 = +q(".n3").value;
      const pool = shuffle(bank);
      const mc = pool.slice(0, n1).map(x => meaningQuestion(x, bankAll)).filter(Boolean), ex = pool.slice(n1, n1 + n2);
      const used = new Set(mc.map(z => z.id).concat(ex.map(x => x.id))), mt = pickMatch(n3, used), right = shuffle(mt);
      const total = mc.length + ex.length + mt.length;
      let h = `<div class="ptitle">文言字词小测</div><div class="pmeta"><span>范围：${e(label)}</span><span>姓名：________　班级：______　得分：____ / ${total}</span></div>`;
      let sec = 0;
      if (mc.length) h += `<h2>${num[sec++]}、选择：选出加点字词在句中的意思（每题 1 分）</h2>` + mc.map((z, i) => `<div class="pq"><div>${i + 1}. ${z.ctx}　（加点字：“${e(byId[z.id].w)}”）</div><div class="po">${z.options.map((o, k) => `<span>${L[k]}. ${e(o.t)}</span>`).join("")}</div></div>`).join("");
      if (ex.length) h += `<h2>${num[sec++]}、解释加点字词在句中的意思（每题 1 分）</h2>` + ex.map((x, i) => `<div class="pq">${i + 1}. ${html(x)}　“${e(x.w)}”：<span class="line"></span></div>`).join("");
      if (mt.length) h += `<h2>${num[sec++]}、配对：把左边的字词和右边的意思连起来，在括号里填字母（每对 1 分）</h2><div class="pm"><div>${mt.map((x, i) => `<div>${i + 1}. ${e(x.w)}（　　）</div>`).join("")}</div><div>${right.map((x, i) => `<div>${L[i]}. ${e(x.core)}</div>`).join("")}</div></div>`;
      if (!total) h += `<p>这个范围里没有可出的题，换个范围，或把题数调大。</p>`;
      if (q(".ak").checked && total) {
        sec = 0;
        h += `<div class="pb"></div><div class="ptitle">参考答案</div><div class="pmeta"><span>范围：${e(label)}</span><span>共 ${total} 分</span></div><div class="ak">`;
        if (mc.length) h += `<h2>${num[sec++]}、选择</h2><div>${mc.map((z, i) => (i + 1) + ". " + L[z.options.findIndex(o => o.ok)]).join("　")}</div>` + mc.map((z, i) => `<div>${i + 1}. ${z.reveal.replace(/<[^>]+>/g, " ")}</div>`).join("");
        if (ex.length) h += `<h2>${num[sec++]}、解释加点字词</h2>` + ex.map((x, i) => `<div>${i + 1}. ${e(x.w)}：${e(x.note)}</div>`).join("");
        if (mt.length) h += `<h2>${num[sec++]}、配对</h2><div>${mt.map((x, i) => (i + 1) + "—" + L[right.indexOf(x)]).join("　")}</div>`;
        h += `</div>`;
      }
      q(".paper").innerHTML = h;
    }
    ["n1", "n2", "n3", "ak"].forEach(c => q("." + c).onchange = make);
    q(".go").onclick = make; q(".pr").onclick = () => window.print();
    make();
  }

  window.V = {
    seeded, dayKey, progress, resetScope, runCards, runMatch, runMeaning, runUsage,
    runSort, runFind, runDaily, runPrint, scopeLabel, avail, streak, scopeOptions,
    esc, shuffle, sample, items, byId, html, store, save, BOOKS, scopeBox, inScope,
    meaningQuestion, usageQuestion, usagePool, balanced, usage, runQuiz, chrome,
    today: () => Math.floor(Date.now() / 864e5)
  };
})();
