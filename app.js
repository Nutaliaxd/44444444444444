const $ = (id) => document.getElementById(id);
const STORAGE_KEY = 'mail-launcher-state-v1';

// ---------- State persistence ----------
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    subject: $('subject').value,
    body: $('body').value,
    csv: $('csv').value,
  }));
}
function loadState() {
  try {
    const s = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (s.subject) $('subject').value = s.subject;
    if (s.body) $('body').value = s.body;
    if (s.csv) $('csv').value = s.csv;
  } catch {}
}
['subject', 'body', 'csv'].forEach((id) => $(id).addEventListener('input', saveState));

// ---------- CSV parser (basic, supports quoted fields) ----------
function parseCSV(text) {
  const rows = [];
  let row = [], field = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') { inQ = false; }
      else { field += c; }
    } else {
      if (c === '"') inQ = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; }
      else if (c === '\r') { /* skip */ }
      else { field += c; }
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  return rows.filter(r => r.some(v => v && v.trim() !== ''));
}

function csvToObjects(text) {
  const rows = parseCSV(text.trim());
  if (rows.length < 2) return { headers: [], data: [] };
  const headers = rows[0].map(h => h.trim());
  const data = rows.slice(1).map(r => {
    const o = {};
    headers.forEach((h, i) => (o[h] = (r[i] ?? '').trim()));
    return o;
  });
  return { headers, data };
}

// ---------- Template rendering ----------
function render(tpl, vars) {
  return (tpl || '').replace(/\{([\w-]+)\}/g, (_, k) => (vars[k] ?? ''));
}

function isValidEmail(e) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e || '');
}

function composeUrl(to, subject, body) {
  return 'https://mail.google.com/mail/?view=cm&fs=1' +
    '&to=' + encodeURIComponent(to) +
    '&su=' + encodeURIComponent(subject) +
    '&body=' + encodeURIComponent(body);
}

// ---------- Build list ----------
let currentList = [];

function build() {
  const { headers, data } = csvToObjects($('csv').value);
  const status = $('parseStatus');
  if (!headers.includes('email')) {
    status.textContent = 'Hata: CSV başlıklarında "email" sütunu yok.';
    $('resultCard').style.display = 'none';
    return;
  }
  const subject = $('subject').value;
  const body = $('body').value;

  currentList = data.map((row, idx) => {
    const to = row.email;
    return {
      idx: idx + 1,
      to,
      valid: isValidEmail(to),
      row,
      subject: render(subject, row),
      body: render(body, row),
    };
  });

  const tbody = $('tbl').querySelector('tbody');
  tbody.innerHTML = '';
  currentList.forEach((item) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${item.idx}</td>
      <td>
        <div><b>${item.to || '<em style="color:#d93025">(boş)</em>'}</b></div>
        <div class="small">${item.subject || '<em>(konu yok)</em>'}</div>
      </td>
      <td>
        <details><summary>önizle</summary>
          <div class="preview">${escapeHtml(item.body)}</div>
        </details>
      </td>
      <td>${item.valid ? '<span class="badge">hazır</span>' : '<span class="badge" style="background:#fde8e8;color:#d93025">geçersiz</span>'}</td>
      <td class="actions">
        <button data-i="${item.idx - 1}" class="openOne ${item.valid ? 'primary' : ''}" ${item.valid ? '' : 'disabled'}>Aç</button>
      </td>
    `;
    tbody.appendChild(tr);
  });

  const valid = currentList.filter(x => x.valid).length;
  status.innerHTML = `${data.length} satır bulundu · <b>${valid} geçerli alıcı</b>${valid < data.length ? ` · ${data.length - valid} geçersiz` : ''}`;
  $('resultCard').style.display = valid > 0 ? 'block' : 'none';

  tbody.querySelectorAll('button.openOne').forEach((b) => {
    b.addEventListener('click', () => {
      const item = currentList[parseInt(b.dataset.i, 10)];
      window.open(composeUrl(item.to, item.subject, item.body), '_blank');
      b.textContent = 'Tekrar Aç';
      b.classList.remove('primary');
      b.closest('tr').querySelector('.badge').className = 'badge opened';
      b.closest('tr').querySelector('.badge').textContent = 'açıldı';
    });
  });
}

function escapeHtml(s) {
  return (s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ---------- Actions ----------
$('parse').addEventListener('click', build);

$('openAll').addEventListener('click', () => {
  const valid = currentList.filter(x => x.valid);
  if (!valid.length) return;
  if (!confirm(`${valid.length} sekme açılacak. Devam?`)) return;

  valid.forEach((item, i) => {
    setTimeout(() => {
      const w = window.open(composeUrl(item.to, item.subject, item.body), '_blank');
      const badge = document.querySelector(`button.openOne[data-i="${item.idx - 1}"]`)
        ?.closest('tr')?.querySelector('.badge');
      if (badge) {
        if (w) { badge.className = 'badge opened'; badge.textContent = 'açıldı'; }
        else { badge.textContent = 'engellendi'; }
      }
    }, i * 300);
  });
});

$('copyList').addEventListener('click', async () => {
  const txt = currentList.filter(x => x.valid).map(x => x.to).join(', ');
  await navigator.clipboard.writeText(txt);
  alert('Kopyalandı.');
});

$('reset').addEventListener('click', () => {
  if (confirm('Her şey sıfırlansın mı?')) {
    localStorage.removeItem(STORAGE_KEY);
    $('subject').value = ''; $('body').value = ''; $('csv').value = '';
    $('resultCard').style.display = 'none';
    $('parseStatus').textContent = '';
  }
});

$('loadConfig').addEventListener('click', async () => {
  try {
    const res = await fetch('config.json', { cache: 'no-store' });
    if (!res.ok) throw new Error('config.json bulunamadı (' + res.status + ')');
    const cfg = await res.json();
    if (cfg.subject !== undefined) $('subject').value = cfg.subject;
    if (cfg.body !== undefined) $('body').value = cfg.body;
    if (Array.isArray(cfg.recipients)) {
      const headers = [...new Set(cfg.recipients.flatMap(r => Object.keys(r)))];
      const emailFirst = ['email', ...headers.filter(h => h !== 'email')];
      const lines = [emailFirst.join(',')];
      cfg.recipients.forEach(r => {
        lines.push(emailFirst.map(h => {
          const v = (r[h] ?? '').toString();
          return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
        }).join(','));
      });
      $('csv').value = lines.join('\n');
    }
    saveState();
    build();
  } catch (e) {
    alert(e.message);
  }
});

// ---------- Init ----------
loadState();
if ($('csv').value.trim()) build();
