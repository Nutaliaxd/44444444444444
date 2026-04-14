const $ = (id) => document.getElementById(id);

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

const items = (CAMPAIGN.recipients || [])
  .filter(r => isValidEmail(r.email))
  .map((r, i) => ({
    idx: i,
    to: r.email,
    row: r,
    subject: render(CAMPAIGN.subject, r),
    body: render(CAMPAIGN.body, r),
    opened: false,
  }));

// Header
$('title').textContent = CAMPAIGN.title || 'Mail Gönderimi';
$('desc').textContent = CAMPAIGN.description || '';
document.title = CAMPAIGN.title || document.title;
$('count').textContent = items.length;

// List
const list = $('list');
items.forEach((it) => {
  const row = document.createElement('div');
  row.className = 'row';
  row.dataset.i = it.idx;
  row.innerHTML = `
    <div class="who">
      <div>${it.row.isim ? escapeHtml(it.row.isim) : escapeHtml(it.to)}</div>
      <small>${escapeHtml(it.to)}</small>
    </div>
    <button data-i="${it.idx}">Aç</button>
  `;
  list.appendChild(row);
});
list.querySelectorAll('button').forEach(b => {
  b.addEventListener('click', () => openOne(parseInt(b.dataset.i, 10)));
});

function escapeHtml(s) {
  return (s || '').toString().replace(/[&<>"']/g, c =>
    ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));
}

function markOpened(idx, ok) {
  const row = list.querySelector(`.row[data-i="${idx}"]`);
  if (!row) return;
  row.classList.add('done');
  row.querySelector('button').textContent = ok ? '✓ açıldı' : 'engellendi';
}

function openOne(idx) {
  const it = items[idx];
  if (!it) return;
  const w = window.open(composeUrl(it.to, it.subject, it.body), '_blank');
  markOpened(idx, !!w);
}

$('openAll').addEventListener('click', () => {
  if (!items.length) return;
  $('status').textContent = 'Açılıyor...';
  items.forEach((it, i) => {
    setTimeout(() => {
      const w = window.open(composeUrl(it.to, it.subject, it.body), '_blank');
      markOpened(it.idx, !!w);
      if (i === items.length - 1) {
        $('status').textContent = 'Tüm sekmeler açıldı. Her birinde "Gönder"e basmayı unutma.';
      }
    }, i * 250);
  });
});

if (!items.length) {
  $('openAll').disabled = true;
  $('status').textContent = 'Listede geçerli alıcı yok. data.js dosyasını kontrol et.';
}
