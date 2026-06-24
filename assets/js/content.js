/* [Company] Security — content.js
   Pulls admin-managed content from /api/content and renders it into the
   public pages. If a section has no saved content, the page keeps its
   built-in (hardcoded) content as a fallback, so the site never looks empty. */
(function () {
  'use strict';
  var API = (window.SITE_CONFIG && window.SITE_CONFIG.apiBase || '/api');
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function nl2br(s) { return esc(s).replace(/\n/g, '<br>'); }
  function normUrl(u) {
    u = String(u == null ? '' : u).trim().replace(/^#+/, ''); // strip stray leading '#'
    if (!u) return '';
    if (/^(https?:\/\/|mailto:|tel:)/i.test(u)) return u;     // already absolute
    if (/^\//.test(u)) return u;                              // site-relative path
    if (/^[\w.-]+\.[a-z]{2,}(\/|$|\?)/i.test(u)) return 'https://' + u; // bare domain
    return u;
  }
  function nonEmpty(v) { return Array.isArray(v) ? v.length : (v && Object.keys(v).length); }

  var ICON = {
    office: '<svg viewBox="0 0 24 24" width="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>',
    email: '<svg viewBox="0 0 24 24" width="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16v16H4z"/><path d="m4 6 8 6 8-6"/></svg>',
    phone: '<svg viewBox="0 0 24 24" width="22" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    hours: '<svg viewBox="0 0 24 24" width="22" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>'
  };
  function initials(name) {
    return String(name || '').trim().split(/\s+/).map(function (w) { return w[0] || ''; }).join('').slice(0, 2).toUpperCase() || '–';
  }

  var R = {
    team: function (el, list) {
      el.innerHTML = list.map(function (p) {
        return '<div class="card glass hover" data-reveal style="text-align:center">' +
          '<span class="avatar" style="width:72px;height:72px;margin:0 auto 14px;font-size:1.3rem">' + esc(p.initials || initials(p.name)) + '</span>' +
          '<h3>' + esc(p.name) + '</h3>' +
          '<p style="color:var(--blue-2);font-weight:600;margin:0">' + esc(p.role) + '</p>' +
          '<p style="font-size:.92rem">' + esc(p.bio) + '</p></div>';
      }).join('');
    },
    insights: function (el, list) {
      el.innerHTML = list.map(function (a) {
        var raw = normUrl(a.url); var href = raw ? esc(raw) : '#';
        var ext = /^https?:\/\//i.test(raw) ? ' target="_blank" rel="noopener noreferrer"' : '';
        return '<article class="card glass hover" data-reveal>' +
          '<span class="tag blue">' + esc(a.tag || 'Insight') + '</span>' +
          '<h3 style="margin-top:10px">' + esc(a.title) + '</h3>' +
          '<p>' + esc(a.summary) + '</p>' +
          '<a class="card-link" href="' + href + '"' + ext + '>Read article →</a></article>';
      }).join('');
    },
    careers: function (el, list) {
      el.innerHTML = list.map(function (j) {
        return '<div class="feature glass hover" data-reveal><div style="flex:1">' +
          '<div style="display:flex;justify-content:space-between;gap:10px"><h3>' + esc(j.title) + '</h3>' +
          '<span class="tag blue">' + esc(j.type || 'Open') + '</span></div>' +
          '<p>' + esc(j.desc) + '</p>' +
          '<a class="card-link" href="#apply">Apply →</a></div></div>';
      }).join('');
    },
    logos: function (el, list) {
      el.innerHTML = list.map(function (name) { return '<span class="logo-pill" data-reveal>' + esc(name) + '</span>'; }).join('');
    },
    services: function (el, list) {
      function col(h, txt){ var items=String(txt||'').split('\n').map(function(x){return x.trim();}).filter(Boolean);
        return '<div><h3>'+esc(h||'')+'</h3><ul class="check-list">'+items.map(function(it){return '<li>'+esc(it)+'</li>';}).join('')+'</ul></div>'; }
      el.innerHTML = list.map(function (s, i) {
        var benefits = s.benefits ? '<div style="margin-top:18px"><strong>Benefits:</strong> <span style="color:var(--ink-3)">'+esc(s.benefits)+'</span></div>' : '';
        return '<section style="padding:0 0 '+(i===list.length-1?'0':'28px')+'"><div class="container"><div class="glass svc-block" data-reveal>'+
          (s.tag?'<span class="tag blue">'+esc(s.tag)+'</span>':'')+
          '<h2 style="margin-top:12px">'+esc(s.title)+'</h2>'+
          (s.intro?'<p class="lede">'+esc(s.intro)+'</p>':'')+
          '<div class="svc-grid">'+col(s.col1_title,s.col1)+col(s.col2_title,s.col2)+col(s.col3_title,s.col3)+'</div>'+
          benefits+
          '<a class="btn btn-glass" href="enquiry.html" style="margin-top:16px">Request this service →</a>'+
          '</div></div></section>';
      }).join('');
    },
    contact: function (el, c) {
      var rows = [
        ['Office', ICON.office, nl2br(c.address || '')],
        ['Email', ICON.email, [c.email1, c.email2].filter(Boolean).map(function (e) { return '<a href="mailto:' + esc(e) + '">' + esc(e) + '</a>'; }).join('<br>')],
        ['Phone', ICON.phone, '<a href="tel:' + esc(String(c.phone || '').replace(/[^+\d]/g, '')) + '">' + esc(c.phone || '') + '</a>' + (c.phone_note ? '<br>' + esc(c.phone_note) : '')],
        ['Business Hours', ICON.hours, nl2br(c.hours || '')]
      ];
      var html = rows.map(function (r) {
        return '<div class="feature glass"><span class="feature-ic">' + r[1] + '</span><div><h3>' + r[0] + '</h3><p>' + r[2] + '</p></div></div>';
      }).join('');
      // keep the existing map placeholder if present
      var map = el.querySelector('.pulse-ring');
      html += '<div class="glass" style="padding:0;overflow:hidden;border-radius:var(--r20)"><div style="height:200px;display:grid;place-items:center;background:linear-gradient(135deg,rgba(10,132,255,.18),rgba(191,90,242,.16));position:relative"><div class="pulse-ring" style="width:18px;height:18px;border-radius:50%;background:var(--blue)"></div><span style="position:absolute;bottom:12px;left:14px;font-size:.82rem;color:var(--ink-3)">Interactive map placeholder.</span></div></div>';
      el.innerHTML = html;
    }
  };

  function apply(content) {
    document.querySelectorAll('[data-cms]').forEach(function (el) {
      var key = el.getAttribute('data-cms');
      try {
        if (key === 'team' && nonEmpty(content.about_team)) R.team(el, content.about_team);
        else if (key === 'insights' && nonEmpty(content.insights)) R.insights(el, content.insights);
        else if (key === 'careers' && content.careers && nonEmpty(content.careers.positions)) R.careers(el, content.careers.positions);
        else if (key === 'partners-strategic' && content.partners && nonEmpty(content.partners.strategic)) R.logos(el, content.partners.strategic);
        else if (key === 'partners-technology' && content.partners && nonEmpty(content.partners.technology)) R.logos(el, content.partners.technology);
        else if (key === 'services' && nonEmpty(content.services)) R.services(el, content.services);
        else if (key === 'contact' && nonEmpty(content.contact)) R.contact(el, content.contact);
        else return;
        // re-trigger reveal animation on injected nodes
        el.querySelectorAll('[data-reveal]').forEach(function (n) { n.classList.add('in'); });
      } catch (e) { /* keep fallback content on any error */ }
    });
  }

  function applyHome(content) {
    var hp = content && content.homepage;
    if (!hp) return;
    document.querySelectorAll('[data-cms-home]').forEach(function (elx) {
      var f = elx.getAttribute('data-cms-home');
      if (hp[f] != null && String(hp[f]).trim() !== '') elx.textContent = hp[f];
    });
  }

  if (!document.querySelector('[data-cms],[data-cms-home]')) return;
  fetch(API + '/content')
    .then(function (r) { return r.json(); })
    .then(function (d) { if (d && d.success && d.content) { apply(d.content); applyHome(d.content); } })
    .catch(function () { /* offline / no backend → keep fallback content */ });
})();
