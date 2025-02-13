const q = (e, t) => e === t, M = {
  equals: q
};
let H = k;
const w = 1, S = 2, F = {
  owned: null,
  cleanups: null,
  context: null,
  owner: null
};
var p = null;
let $ = null, Z = null, c = null, a = null, g = null, v = 0;
function z(e, t) {
  const s = c, l = p, o = e.length === 0, n = t === void 0 ? l : t, r = o ? F : {
    owned: null,
    cleanups: null,
    context: n ? n.context : null,
    owner: n
  }, i = o ? e : () => e(() => G(() => y(r)));
  p = r, c = null;
  try {
    return x(i, !0);
  } finally {
    c = s, p = l;
  }
}
function Q(e, t) {
  t = t ? Object.assign({}, M, t) : M;
  const s = {
    value: e,
    observers: null,
    observerSlots: null,
    comparator: t.equals || void 0
  }, l = (o) => (typeof o == "function" && (o = o(s.value)), I(s, o));
  return [W.bind(s), l];
}
function T(e, t, s) {
  const l = Y(e, t, !1, w);
  U(l);
}
function G(e) {
  if (c === null) return e();
  const t = c;
  c = null;
  try {
    return e();
  } finally {
    c = t;
  }
}
function W() {
  if (this.sources && this.state)
    if (this.state === w) U(this);
    else {
      const e = a;
      a = null, x(() => A(this), !1), a = e;
    }
  if (c) {
    const e = this.observers ? this.observers.length : 0;
    c.sources ? (c.sources.push(this), c.sourceSlots.push(e)) : (c.sources = [this], c.sourceSlots = [e]), this.observers ? (this.observers.push(c), this.observerSlots.push(c.sources.length - 1)) : (this.observers = [c], this.observerSlots = [c.sources.length - 1]);
  }
  return this.value;
}
function I(e, t, s) {
  let l = e.value;
  return (!e.comparator || !e.comparator(l, t)) && (e.value = t, e.observers && e.observers.length && x(() => {
    for (let o = 0; o < e.observers.length; o += 1) {
      const n = e.observers[o], r = $ && $.running;
      r && $.disposed.has(n), (r ? !n.tState : !n.state) && (n.pure ? a.push(n) : g.push(n), n.observers && P(n)), r || (n.state = w);
    }
    if (a.length > 1e6)
      throw a = [], new Error();
  }, !1)), t;
}
function U(e) {
  if (!e.fn) return;
  y(e);
  const t = v;
  X(
    e,
    e.value,
    t
  );
}
function X(e, t, s) {
  let l;
  const o = p, n = c;
  c = p = e;
  try {
    l = e.fn(t);
  } catch (r) {
    return e.pure && (e.state = w, e.owned && e.owned.forEach(y), e.owned = null), e.updatedAt = s + 1, V(r);
  } finally {
    c = n, p = o;
  }
  (!e.updatedAt || e.updatedAt <= s) && (e.updatedAt != null && "observers" in e ? I(e, l) : e.value = l, e.updatedAt = s);
}
function Y(e, t, s, l = w, o) {
  const n = {
    fn: e,
    state: l,
    updatedAt: null,
    owned: null,
    sources: null,
    sourceSlots: null,
    cleanups: null,
    value: t,
    owner: p,
    context: p ? p.context : null,
    pure: s
  };
  return p === null || p !== F && (p.owned ? p.owned.push(n) : p.owned = [n]), n;
}
function D(e) {
  if (e.state === 0) return;
  if (e.state === S) return A(e);
  if (e.suspense && G(e.suspense.inFallback)) return e.suspense.effects.push(e);
  const t = [e];
  for (; (e = e.owner) && (!e.updatedAt || e.updatedAt < v); )
    e.state && t.push(e);
  for (let s = t.length - 1; s >= 0; s--)
    if (e = t[s], e.state === w)
      U(e);
    else if (e.state === S) {
      const l = a;
      a = null, x(() => A(e, t[0]), !1), a = l;
    }
}
function x(e, t) {
  if (a) return e();
  let s = !1;
  t || (a = []), g ? s = !0 : g = [], v++;
  try {
    const l = e();
    return J(s), l;
  } catch (l) {
    s || (g = null), a = null, V(l);
  }
}
function J(e) {
  if (a && (k(a), a = null), e) return;
  const t = g;
  g = null, t.length && x(() => H(t), !1);
}
function k(e) {
  for (let t = 0; t < e.length; t++) D(e[t]);
}
function A(e, t) {
  e.state = 0;
  for (let s = 0; s < e.sources.length; s += 1) {
    const l = e.sources[s];
    if (l.sources) {
      const o = l.state;
      o === w ? l !== t && (!l.updatedAt || l.updatedAt < v) && D(l) : o === S && A(l, t);
    }
  }
}
function P(e) {
  for (let t = 0; t < e.observers.length; t += 1) {
    const s = e.observers[t];
    s.state || (s.state = S, s.pure ? a.push(s) : g.push(s), s.observers && P(s));
  }
}
function y(e) {
  let t;
  if (e.sources)
    for (; e.sources.length; ) {
      const s = e.sources.pop(), l = e.sourceSlots.pop(), o = s.observers;
      if (o && o.length) {
        const n = o.pop(), r = s.observerSlots.pop();
        l < o.length && (n.sourceSlots[r] = l, o[l] = n, s.observerSlots[l] = r);
      }
    }
  if (e.tOwned) {
    for (t = e.tOwned.length - 1; t >= 0; t--) y(e.tOwned[t]);
    delete e.tOwned;
  }
  if (e.owned) {
    for (t = e.owned.length - 1; t >= 0; t--) y(e.owned[t]);
    e.owned = null;
  }
  if (e.cleanups) {
    for (t = e.cleanups.length - 1; t >= 0; t--) e.cleanups[t]();
    e.cleanups = null;
  }
  e.state = 0;
}
function K(e) {
  return e instanceof Error ? e : new Error(typeof e == "string" ? e : "Unknown error", {
    cause: e
  });
}
function V(e, t = p) {
  throw K(e);
}
function ee(e, t) {
  return G(() => e(t || {}));
}
function te(e, t, s) {
  let l = s.length, o = t.length, n = l, r = 0, i = 0, f = t[o - 1].nextSibling, u = null;
  for (; r < o || i < n; ) {
    if (t[r] === s[i]) {
      r++, i++;
      continue;
    }
    for (; t[o - 1] === s[n - 1]; )
      o--, n--;
    if (o === r) {
      const h = n < l ? i ? s[i - 1].nextSibling : s[n - i] : f;
      for (; i < n; ) e.insertBefore(s[i++], h);
    } else if (n === i)
      for (; r < o; )
        (!u || !u.has(t[r])) && t[r].remove(), r++;
    else if (t[r] === s[n - 1] && s[i] === t[o - 1]) {
      const h = t[--o].nextSibling;
      e.insertBefore(s[i++], t[r++].nextSibling), e.insertBefore(s[--n], h), t[o] = s[n];
    } else {
      if (!u) {
        u = /* @__PURE__ */ new Map();
        let d = i;
        for (; d < n; ) u.set(s[d], d++);
      }
      const h = u.get(t[r]);
      if (h != null)
        if (i < h && h < n) {
          let d = r, C = 1, L;
          for (; ++d < o && d < n && !((L = u.get(t[d])) == null || L !== h + C); )
            C++;
          if (C > h - i) {
            const R = t[r];
            for (; i < h; ) e.insertBefore(s[i++], R);
          } else e.replaceChild(s[i++], t[r++]);
        } else r++;
      else t[r++].remove();
    }
  }
}
const N = "_$DX_DELEGATE";
function se(e, t, s, l = {}) {
  let o;
  return z((n) => {
    o = n, t === document ? e() : j(t, e(), t.firstChild ? null : void 0, s);
  }, l.owner), () => {
    o(), t.textContent = "";
  };
}
function E(e, t, s) {
  let l;
  const o = () => {
    const r = document.createElement("template");
    return r.innerHTML = e, r.content.firstChild;
  }, n = () => (l || (l = o())).cloneNode(!0);
  return n.cloneNode = n, n;
}
function le(e, t = window.document) {
  const s = t[N] || (t[N] = /* @__PURE__ */ new Set());
  for (let l = 0, o = e.length; l < o; l++) {
    const n = e[l];
    s.has(n) || (s.add(n), t.addEventListener(n, oe));
  }
}
function O(e, t, s) {
  s == null ? e.removeAttribute(t) : e.setAttribute(t, s);
}
function j(e, t, s, l) {
  if (s !== void 0 && !l && (l = []), typeof t != "function") return m(e, t, l, s);
  T((o) => m(e, t(), o, s), l);
}
function oe(e) {
  let t = e.target;
  const s = `$$${e.type}`, l = e.target, o = e.currentTarget, n = (f) => Object.defineProperty(e, "target", {
    configurable: !0,
    value: f
  }), r = () => {
    const f = t[s];
    if (f && !t.disabled) {
      const u = t[`${s}Data`];
      if (u !== void 0 ? f.call(t, u, e) : f.call(t, e), e.cancelBubble) return;
    }
    return t.host && typeof t.host != "string" && !t.host._$host && t.contains(e.target) && n(t.host), !0;
  }, i = () => {
    for (; r() && (t = t._$host || t.parentNode || t.host); ) ;
  };
  if (Object.defineProperty(e, "currentTarget", {
    configurable: !0,
    get() {
      return t || document;
    }
  }), e.composedPath) {
    const f = e.composedPath();
    n(f[0]);
    for (let u = 0; u < f.length - 2 && (t = f[u], !!r()); u++) {
      if (t._$host) {
        t = t._$host, i();
        break;
      }
      if (t.parentNode === o)
        break;
    }
  } else i();
  n(l);
}
function m(e, t, s, l, o) {
  for (; typeof s == "function"; ) s = s();
  if (t === s) return s;
  const n = typeof t, r = l !== void 0;
  if (e = r && s[0] && s[0].parentNode || e, n === "string" || n === "number") {
    if (n === "number" && (t = t.toString(), t === s))
      return s;
    if (r) {
      let i = s[0];
      i && i.nodeType === 3 ? i.data !== t && (i.data = t) : i = document.createTextNode(t), s = b(e, s, l, i);
    } else
      s !== "" && typeof s == "string" ? s = e.firstChild.data = t : s = e.textContent = t;
  } else if (t == null || n === "boolean")
    s = b(e, s, l);
  else {
    if (n === "function")
      return T(() => {
        let i = t();
        for (; typeof i == "function"; ) i = i();
        s = m(e, i, s, l);
      }), () => s;
    if (Array.isArray(t)) {
      const i = [], f = s && Array.isArray(s);
      if (_(i, t, s, o))
        return T(() => s = m(e, i, s, l, !0)), () => s;
      if (i.length === 0) {
        if (s = b(e, s, l), r) return s;
      } else f ? s.length === 0 ? B(e, i, l) : te(e, s, i) : (s && b(e), B(e, i));
      s = i;
    } else if (t.nodeType) {
      if (Array.isArray(s)) {
        if (r) return s = b(e, s, l, t);
        b(e, s, null, t);
      } else s == null || s === "" || !e.firstChild ? e.appendChild(t) : e.replaceChild(t, e.firstChild);
      s = t;
    }
  }
  return s;
}
function _(e, t, s, l) {
  let o = !1;
  for (let n = 0, r = t.length; n < r; n++) {
    let i = t[n], f = s && s[e.length], u;
    if (!(i == null || i === !0 || i === !1)) if ((u = typeof i) == "object" && i.nodeType)
      e.push(i);
    else if (Array.isArray(i))
      o = _(e, i, f) || o;
    else if (u === "function")
      if (l) {
        for (; typeof i == "function"; ) i = i();
        o = _(
          e,
          Array.isArray(i) ? i : [i],
          Array.isArray(f) ? f : [f]
        ) || o;
      } else
        e.push(i), o = !0;
    else {
      const h = String(i);
      f && f.nodeType === 3 && f.data === h ? e.push(f) : e.push(document.createTextNode(h));
    }
  }
  return o;
}
function B(e, t, s = null) {
  for (let l = 0, o = t.length; l < o; l++) e.insertBefore(t[l], s);
}
function b(e, t, s, l) {
  if (s === void 0) return e.textContent = "";
  const o = l || document.createTextNode("");
  if (t.length) {
    let n = !1;
    for (let r = t.length - 1; r >= 0; r--) {
      const i = t[r];
      if (o !== i) {
        const f = i.parentNode === e;
        !n && !r ? f ? e.replaceChild(o, i) : e.insertBefore(o, s) : f && i.remove();
      } else n = !0;
    }
  } else e.insertBefore(o, s);
  return [o];
}
const ne = "data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='0%200%20166%20155.3'%3e%3cpath%20d='M163%2035S110-4%2069%205l-3%201c-6%202-11%205-14%209l-2%203-15%2026%2026%205c11%207%2025%2010%2038%207l46%209%2018-30z'%20fill='%2376b3e1'/%3e%3clinearGradient%20id='a'%20gradientUnits='userSpaceOnUse'%20x1='27.5'%20y1='3'%20x2='152'%20y2='63.5'%3e%3cstop%20offset='.1'%20stop-color='%2376b3e1'/%3e%3cstop%20offset='.3'%20stop-color='%23dcf2fd'/%3e%3cstop%20offset='1'%20stop-color='%2376b3e1'/%3e%3c/linearGradient%3e%3cpath%20d='M163%2035S110-4%2069%205l-3%201c-6%202-11%205-14%209l-2%203-15%2026%2026%205c11%207%2025%2010%2038%207l46%209%2018-30z'%20opacity='.3'%20fill='url(%23a)'/%3e%3cpath%20d='M52%2035l-4%201c-17%205-22%2021-13%2035%2010%2013%2031%2020%2048%2015l62-21S92%2026%2052%2035z'%20fill='%23518ac8'/%3e%3clinearGradient%20id='b'%20gradientUnits='userSpaceOnUse'%20x1='95.8'%20y1='32.6'%20x2='74'%20y2='105.2'%3e%3cstop%20offset='0'%20stop-color='%2376b3e1'/%3e%3cstop%20offset='.5'%20stop-color='%234377bb'/%3e%3cstop%20offset='1'%20stop-color='%231f3b77'/%3e%3c/linearGradient%3e%3cpath%20d='M52%2035l-4%201c-17%205-22%2021-13%2035%2010%2013%2031%2020%2048%2015l62-21S92%2026%2052%2035z'%20opacity='.3'%20fill='url(%23b)'/%3e%3clinearGradient%20id='c'%20gradientUnits='userSpaceOnUse'%20x1='18.4'%20y1='64.2'%20x2='144.3'%20y2='149.8'%3e%3cstop%20offset='0'%20stop-color='%23315aa9'/%3e%3cstop%20offset='.5'%20stop-color='%23518ac8'/%3e%3cstop%20offset='1'%20stop-color='%23315aa9'/%3e%3c/linearGradient%3e%3cpath%20d='M134%2080a45%2045%200%2000-48-15L24%2085%204%20120l112%2019%2020-36c4-7%203-15-2-23z'%20fill='url(%23c)'/%3e%3clinearGradient%20id='d'%20gradientUnits='userSpaceOnUse'%20x1='75.2'%20y1='74.5'%20x2='24.4'%20y2='260.8'%3e%3cstop%20offset='0'%20stop-color='%234377bb'/%3e%3cstop%20offset='.5'%20stop-color='%231a336b'/%3e%3cstop%20offset='1'%20stop-color='%231a336b'/%3e%3c/linearGradient%3e%3cpath%20d='M114%20115a45%2045%200%2000-48-15L4%20120s53%2040%2094%2030l3-1c17-5%2023-21%2013-34z'%20fill='url(%23d)'/%3e%3c/svg%3e", ie = "data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20xmlns:xlink='http://www.w3.org/1999/xlink'%20aria-hidden='true'%20role='img'%20class='iconify%20iconify--logos'%20width='31.88'%20height='32'%20preserveAspectRatio='xMidYMid%20meet'%20viewBox='0%200%20256%20257'%3e%3cdefs%3e%3clinearGradient%20id='IconifyId1813088fe1fbc01fb466'%20x1='-.828%25'%20x2='57.636%25'%20y1='7.652%25'%20y2='78.411%25'%3e%3cstop%20offset='0%25'%20stop-color='%2341D1FF'%3e%3c/stop%3e%3cstop%20offset='100%25'%20stop-color='%23BD34FE'%3e%3c/stop%3e%3c/linearGradient%3e%3clinearGradient%20id='IconifyId1813088fe1fbc01fb467'%20x1='43.376%25'%20x2='50.316%25'%20y1='2.242%25'%20y2='89.03%25'%3e%3cstop%20offset='0%25'%20stop-color='%23FFEA83'%3e%3c/stop%3e%3cstop%20offset='8.333%25'%20stop-color='%23FFDD35'%3e%3c/stop%3e%3cstop%20offset='100%25'%20stop-color='%23FFA800'%3e%3c/stop%3e%3c/linearGradient%3e%3c/defs%3e%3cpath%20fill='url(%23IconifyId1813088fe1fbc01fb466)'%20d='M255.153%2037.938L134.897%20252.976c-2.483%204.44-8.862%204.466-11.382.048L.875%2037.958c-2.746-4.814%201.371-10.646%206.827-9.67l120.385%2021.517a6.537%206.537%200%200%200%202.322-.004l117.867-21.483c5.438-.991%209.574%204.796%206.877%209.62Z'%3e%3c/path%3e%3cpath%20fill='url(%23IconifyId1813088fe1fbc01fb467)'%20d='M185.432.063L96.44%2017.501a3.268%203.268%200%200%200-2.634%203.014l-5.474%2092.456a3.268%203.268%200%200%200%203.997%203.378l24.777-5.718c2.318-.535%204.413%201.507%203.936%203.838l-7.361%2036.047c-.495%202.426%201.782%204.5%204.151%203.78l15.304-4.649c2.372-.72%204.652%201.36%204.15%203.788l-11.698%2056.621c-.732%203.542%203.979%205.473%205.943%202.437l1.313-2.028l72.516-144.72c1.215-2.423-.88-5.186-3.54-4.672l-25.505%204.922c-2.396.462-4.435-1.77-3.759-4.114l16.646-57.705c.677-2.35-1.37-4.583-3.769-4.113Z'%3e%3c/path%3e%3c/svg%3e";
var re = /* @__PURE__ */ E('<div><a href=https://vite.dev target=_blank><img class=logo alt="Vite logo"></a><a href=https://solidjs.com target=_blank><img class="logo solid"alt="Solid logo">'), fe = /* @__PURE__ */ E("<h1>Vite + Solid"), ce = /* @__PURE__ */ E("<div class=card><button>count is </button><p>Edit <code>src/App.tsx</code> and save to test HMR"), ue = /* @__PURE__ */ E("<p class=read-the-docs>Click on the Vite and Solid logos to learn more");
function ae() {
  const [e, t] = Q(0);
  return [(() => {
    var s = re(), l = s.firstChild, o = l.firstChild, n = l.nextSibling, r = n.firstChild;
    return O(o, "src", ie), O(r, "src", ne), s;
  })(), fe(), (() => {
    var s = ce(), l = s.firstChild;
    return l.firstChild, l.$$click = () => t((o) => o + 1), j(l, e, null), s;
  })(), ue()];
}
le(["click"]);
function pe(e) {
  const t = document.getElementById(e);
  if (t === null)
    throw new Error(`Element with id ${e} not found`);
  se(() => ee(ae, {}), t);
}
export {
  pe as renderApp
};
