/* breaks.js — where lines break, for easier reading.

   1. A sentence that fits on one line is kept on one line: if it does not
      fit in what is left of the current line, the whole sentence moves to
      the next line instead of being cut in two.
   2. A sentence longer than a line breaks at its punctuation:
      after 、 。 and ） or before （ in Japanese; after , ; : and before
      ( in English. A single clause longer than a line breaks where the
      browser would normally break it.

   Only on a PC (1024px and wider); phones are left as they were.
   The text itself is not changed; it is only grouped into spans that
   stay together. Without JavaScript the page reads exactly as before. */
(function () {
  'use strict';
  var JA = (document.documentElement.lang || '').slice(0, 2) === 'ja';
  var TARGETS = '.prose p, .prose li, .prose dd, .prose td, .prose th, .prose figcaption, ' +
                '.prose .note, .prose h2, .prose h3, .lede, .card span, h1';
  var SKIP = { CODE: 1, PRE: 1, SCRIPT: 1, STYLE: 1, BUTTON: 1, SVG: 1 };

  /* sentences: Japanese ends at 。！？ (plus any closing bracket after it);
     English ends at . ! ? followed by a space */
  function sentences(t) {
    var out = [], re = JA ? /[^。！？]*[。！？]+[」』）)]*|[^。！？]+$/g
                          : /[\s\S]*?[.!?]["”’)]*(?=\s+|$)|[\s\S]+$/g, m;
    while ((m = re.exec(t)) !== null) {
      if (m[0] === '') { re.lastIndex++; continue; }
      out.push(m[0]);
    }
    return out;
  }
  /* clauses inside a sentence */
  function clauses(s) {
    return JA ? s.split(/(?<=[、，）])|(?=（)/)
              : s.split(/(?<=[,;:)]\s)|(?<=\s—\s)|(?=\s\()/);
  }

  function span(cls, text) {
    var e = document.createElement('span');
    e.className = cls;
    e.textContent = text;
    return e;
  }

  function wrapText(node) {
    var t = node.nodeValue;
    if (!t || !t.trim()) return;
    var frag = document.createDocumentFragment();
    sentences(t).forEach(function (s) {
      /* keep the spaces between sentences outside the groups, so the
         line can break there */
      var lead = s.match(/^\s*/)[0], tail = s.match(/\s*$/)[0];
      var core = s.slice(lead.length, s.length - tail.length);
      if (lead) frag.appendChild(document.createTextNode(lead));
      if (core) {
        var parts = clauses(core);
        var sb = document.createElement('span');
        sb.className = 'lb-s';
        if (parts.length < 2) sb.textContent = core;
        else parts.forEach(function (c) {
          var cl = c.match(/^\s*/)[0], ct = c.match(/\s*$/)[0];
          var cc = c.slice(cl.length, c.length - ct.length);
          if (cl) sb.appendChild(document.createTextNode(cl));
          if (cc) sb.appendChild(span('lb-c', cc));
          if (ct) sb.appendChild(document.createTextNode(ct));
        });
        frag.appendChild(sb);
      }
      if (tail) frag.appendChild(document.createTextNode(tail));
    });
    node.parentNode.replaceChild(frag, node);
  }

  function walk(el) {
    var kids = Array.prototype.slice.call(el.childNodes);
    kids.forEach(function (k) {
      if (k.nodeType === 3) wrapText(k);
      else if (k.nodeType === 1 && !SKIP[k.nodeName.toUpperCase()] &&
               !k.classList.contains('lb-s') && !k.matches(TARGETS)) walk(k);
    });
  }

  function run() {
    var els = document.querySelectorAll(TARGETS);
    for (var i = 0; i < els.length; i++) walk(els[i]);
    document.documentElement.classList.add('lb-on');
  }
  /* PC only (1024px and wider). Phones and tablets are left exactly as
     they were. If a window is widened past 1024px later, it runs then. */
  var mq = window.matchMedia ? window.matchMedia('(min-width:1024px)') : null;
  var done = false;
  function maybe() { if (!done && mq && mq.matches) { done = true; run(); } }
  if (mq && mq.addEventListener) mq.addEventListener('change', maybe);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', maybe);
  else maybe();
})();
