async function fetchJSON(url, options) {
  const res = await fetch(url, options);
  if (!res.ok) throw new Error(`${res.status}: ${res.statusText}`);
  return res.json();
}

function daysRemaining(validTo) {
  const now = Date.now();
  const target = new Date(validTo).getTime();
  return Math.ceil((target - now) / (24 * 3600 * 1000));
}

function renderList(container, certs) {
  container.innerHTML = '';
  const table = document.createElement('table');
  table.className = 'table';
  table.innerHTML = `
    <thead>
      <tr>
        <th>Common Name</th>
        <th>Issuer</th>
        <th>Valid To</th>
        <th>Days Remaining</th>
        <th>Environment</th>
        <th>Location</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector('tbody');
  certs.forEach(c => {
    const tr = document.createElement('tr');
    const rem = daysRemaining(c.validTo);
    tr.innerHTML = `
      <td>${c.commonName || ''}</td>
      <td>${c.issuer || ''}</td>
      <td>${c.validTo ? new Date(c.validTo).toLocaleString() : ''}</td>
      <td>${Number.isFinite(rem) ? rem : ''}</td>
      <td>${c.environment || ''}</td>
      <td>${c.location || ''}</td>
    `;
    tbody.appendChild(tr);
  });
  container.appendChild(table);
}

function renderExpiringCards(container, certs, threshold) {
  container.innerHTML = '';
  const soon = certs.filter(c => daysRemaining(c.validTo) <= threshold);
  soon.forEach(c => {
    const rem = daysRemaining(c.validTo);
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <h3>${c.commonName}</h3>
      <p><strong>Issuer:</strong> ${c.issuer}</p>
      <p><strong>Valid To:</strong> ${new Date(c.validTo).toLocaleString()}</p>
      <p><strong>Days Remaining:</strong> ${rem}</p>
      <p><strong>Environment:</strong> ${c.environment} | <strong>Location:</strong> ${c.location}</p>
    `;
    container.appendChild(card);
  });
}

async function loadAndRender() {
  const listEl = document.getElementById('cert-list');
  const cardsEl = document.getElementById('expiring-cards');
  const threshold = Number(document.getElementById('threshold').value || 10);
  const search = document.getElementById('search') ? (document.getElementById('search').value || '') : '';
  try {
    const certs = await fetchJSON('/api/certificates');
    const filtered = filterBySearch(certs, search);
    renderList(listEl, filtered);
    renderExpiringCards(cardsEl, filtered, threshold);
  } catch (e) {
    listEl.innerHTML = `<div class="status">Failed to load certificates: ${e.message}</div>`;
  }
}

async function handleCreate(e) {
  e.preventDefault();
  const statusEl = document.getElementById('create-status');
  const form = e.target;
  const data = Object.fromEntries(new FormData(form));
  // Normalize date inputs to ISO
  if (data.validFrom) data.validFrom = new Date(data.validFrom).toISOString();
  if (data.validTo) data.validTo = new Date(data.validTo).toISOString();
  // Basic defaults
  data.signatureAlgorithm = data.signatureAlgorithm || 'SHA-256';
  data.keyType = data.keyType || 'RSA';
  data.keySize = Number(data.keySize || 2048);
  data.port = Number(data.port || 443);
  data.source = 'manual';

  try {
    const created = await fetchJSON('/api/certificates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    statusEl.textContent = `Created: ${created.commonName}`;
    form.reset();
    await loadAndRender();
  } catch (e) {
    statusEl.textContent = `Create failed: ${e.message}`;
  }
}

document.getElementById('refresh').addEventListener('click', loadAndRender);
// Persist threshold in localStorage
const thresholdEl = document.getElementById('threshold');
const savedThreshold = Number(localStorage.getItem('certintel_threshold_days') || '');
if (Number.isFinite(savedThreshold) && savedThreshold > 0) {
  thresholdEl.value = savedThreshold;
}
thresholdEl.addEventListener('change', () => {
  const val = Number(thresholdEl.value || 10);
  if (Number.isFinite(val) && val > 0) {
    localStorage.setItem('certintel_threshold_days', String(val));
  }
  loadAndRender();
});
document.getElementById('create-form').addEventListener('submit', handleCreate);

// initial load
loadAndRender();

function filterBySearch(certs, query) {
  const q = (query || '').toLowerCase();
  if (!q) return certs;
  return certs.filter(c =>
    String(c.commonName || '').toLowerCase().includes(q) ||
    String(c.issuer || '').toLowerCase().includes(q) ||
    String(c.domain || '').toLowerCase().includes(q)
  );
}

// Search reactive updates
if (document.getElementById('search')) {
  document.getElementById('search').addEventListener('input', () => {
    loadAndRender();
  });
}

// Download helpers
async function downloadJSON(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

if (document.getElementById('download-all')) {
  document.getElementById('download-all').addEventListener('click', async () => {
    try {
      const certs = await fetchJSON('/api/certificates');
      await downloadJSON('certificates.json', certs);
    } catch (e) {
      alert('Download failed: ' + e.message);
    }
  });
}

if (document.getElementById('download-expiring')) {
  document.getElementById('download-expiring').addEventListener('click', async () => {
    try {
      const within = Number(document.getElementById('threshold').value || 10);
      const expiring = await fetchJSON(`/api/analytics/expiry?withinDays=${within}`);
      await downloadJSON(`expiring-within-${within}-days.json`, expiring);
    } catch (e) {
      alert('Download failed: ' + e.message);
    }
  });
}
