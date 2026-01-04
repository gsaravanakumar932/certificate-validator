const { useEffect, useMemo, useRef, useState } = React;

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

function useLocalStorageNumber(key, defaultVal) {
  const [val, setVal] = useState(() => {
    const raw = localStorage.getItem(key);
    const num = Number(raw);
    return Number.isFinite(num) && num > 0 ? num : defaultVal;
  });
  useEffect(() => { localStorage.setItem(key, String(val)); }, [key, val]);
  return [val, setVal];
}

function TopBar({ onToggleSidebar, threshold, setThreshold, search, setSearch, onRefresh, onDownloadAll, onDownloadExpiring }) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between gap-3 p-3 bg-navy-900 border-b border-teal-700">
      <div className="flex items-center gap-3">
        <button className="md:hidden px-3 py-2 rounded bg-navy-800 border border-teal-700 hover:bg-navy-700" onClick={onToggleSidebar} aria-label="Toggle sidebar">☰</button>
        <h1 className="text-xl md:text-2xl font-semibold text-teal-400">CertIntel</h1>
      </div>
      <div className="flex flex-wrap gap-3 items-end">
        <label className="hidden sm:flex flex-col text-sm">
          <span>Search</span>
          <input className="px-3 py-2 rounded bg-navy-800 border border-teal-700 focus:outline-none focus:ring-1 focus:ring-teal-500" placeholder="common name, issuer, domain" value={search} onChange={(e) => setSearch(e.target.value)} />
        </label>
        <label className="hidden sm:flex flex-col text-sm">
          <span>Expiring threshold (days)</span>
          <input type="number" min={1} className="px-3 py-2 rounded bg-navy-800 border border-teal-700 focus:outline-none focus:ring-1 focus:ring-teal-500" value={threshold} onChange={(e) => setThreshold(Number(e.target.value || 10))} />
        </label>
        <button className="px-3 py-2 rounded bg-navy-800 border border-teal-700 hover:bg-navy-700" onClick={onRefresh}>Refresh</button>
        <AutoDiscoverButton onDone={onRefresh} />
        <button className="hidden sm:block px-3 py-2 rounded bg-navy-800 border border-teal-700 hover:bg-navy-700" onClick={onDownloadAll}>Download JSON (All)</button>
        <button className="hidden sm:block px-3 py-2 rounded bg-navy-800 border border-teal-700 hover:bg-navy-700" onClick={onDownloadExpiring}>Download JSON (Expiring)</button>
      </div>
    </header>
  );
}

function AutoDiscoverButton({ onDone }) {
  const [running, setRunning] = useState(false);
  const run = async () => {
    try {
      setRunning(true);
      const res = await fetch('/api/discovery/crawl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quick: true, includePrivateRanges: true })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || res.statusText);
      onDone?.();
    } catch (e) {
      alert('Auto discovery failed: ' + (e?.message || e));
    } finally {
      setRunning(false);
    }
  };
  return (
    <button className="px-3 py-2 rounded bg-teal-700 hover:bg-teal-600" disabled={running} onClick={run}>{running ? 'Auto Discovering...' : 'Auto Discover'}</button>
  );
}

function Sidebar({ current, setCurrent, open, onClose }) {
  const items = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'certificates', label: 'Certificates' },
    { key: 'analytics', label: 'Analytics' },
    { key: 'compliance', label: 'Compliance' },
    { key: 'reports', label: 'Reports' },
    { key: 'integrations', label: 'Integrations' },
    { key: 'settings', label: 'Settings' }
  ];
  const menu = (
    <nav className="flex flex-col p-3 gap-1">
      {items.map((it) => (
        <button
          key={it.key}
          className={`text-left px-3 py-2 rounded border ${current===it.key?'border-teal-700 bg-navy-800 text-teal-300':'border-navy-900 hover:border-teal-700 hover:bg-navy-800'}`}
          onClick={() => { setCurrent(it.key); onClose?.(); }}
        >{it.label}</button>
      ))}
    </nav>
  );
  return (
    <>
      {/* Mobile overlay sidebar */}
      {open && (
        <div className="md:hidden fixed inset-0 z-20 bg-black/40" onClick={onClose}>
          <aside className="absolute left-0 top-0 h-full w-64 bg-navy-900 border-r border-teal-700" onClick={(e)=>e.stopPropagation()}>
            {menu}
          </aside>
        </div>
      )}
      {/* Desktop sidebar */}
      <aside className="hidden md:block w-64 shrink-0 h-full overflow-y-auto bg-navy-900 border-r border-teal-700">
        {menu}
      </aside>
    </>
  );
}

function CertificateTable({ certificates }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-collapse">
        <thead>
          <tr className="border-b border-teal-700 text-teal-300">
            <th className="text-left p-2">Common Name</th>
            <th className="text-left p-2">Issuer</th>
            <th className="text-left p-2">Valid To</th>
            <th className="text-left p-2">Days Remaining</th>
            <th className="text-left p-2">Environment</th>
            <th className="text-left p-2">Location</th>
          </tr>
        </thead>
        <tbody>
          {certificates.map((c) => (
            <tr key={c.id} className="border-b border-teal-700">
              <td className="p-2">{c.commonName}</td>
              <td className="p-2">{c.issuer}</td>
              <td className="p-2">{c.validTo ? new Date(c.validTo).toLocaleString() : ''}</td>
              <td className="p-2">{Number.isFinite(daysRemaining(c.validTo)) ? daysRemaining(c.validTo) : ''}</td>
              <td className="p-2">{c.environment}</td>
              <td className="p-2">{c.location}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ExpiringCards({ certificates, threshold }) {
  const soon = useMemo(() => certificates.filter((c) => daysRemaining(c.validTo) <= threshold), [certificates, threshold]);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      {soon.map((c) => (
        <div key={c.id} className="rounded border border-teal-700 bg-navy-900 p-3">
          <h3 className="text-teal-400 text-lg font-medium">{c.commonName}</h3>
          <p><span className="text-slate-400">Issuer:</span> {c.issuer}</p>
          <p><span className="text-slate-400">Valid To:</span> {new Date(c.validTo).toLocaleString()}</p>
          <p><span className="text-slate-400">Days Remaining:</span> {daysRemaining(c.validTo)}</p>
          <p><span className="text-slate-400">Environment:</span> {c.environment} <span className="text-slate-400">| Location:</span> {c.location}</p>
        </div>
      ))}
      {soon.length === 0 && (
        <div className="text-slate-400">No certificates expiring within {threshold} days.</div>
      )}
    </div>
  );
}

function CreateCertificateDialog({ onCreated }) {
  const dialogRef = useRef(null);
  const [submitting, setSubmitting] = useState(false);

  const open = () => dialogRef.current?.showModal();
  const close = () => dialogRef.current?.close();

  const submit = async (e) => {
    e.preventDefault();
    const form = e.target;
    const data = Object.fromEntries(new FormData(form));
    if (data.validFrom) data.validFrom = new Date(data.validFrom).toISOString();
    if (data.validTo) data.validTo = new Date(data.validTo).toISOString();
    data.signatureAlgorithm = data.signatureAlgorithm || 'SHA-256';
    data.keyType = data.keyType || 'RSA';
    data.keySize = Number(data.keySize || 2048);
    data.port = Number(data.port || 443);
    data.source = 'manual';
    try {
      setSubmitting(true);
      await fetchJSON('/api/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      form.reset();
      close();
      onCreated?.();
    } catch (err) {
      alert('Create failed: ' + (err?.message || err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button className="px-3 py-2 rounded bg-teal-700 hover:bg-teal-600" onClick={open}>Create New Certificate</button>
      <dialog ref={dialogRef} className="bg-navy-900 text-slate-200 p-4 rounded w-[90vw] max-w-3xl border border-teal-700">
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">Common Name<input name="commonName" required className="px-3 py-2 rounded bg-navy-800 border border-teal-700 focus:outline-none focus:ring-1 focus:ring-teal-500" /></label>
          <label className="flex flex-col gap-1">Issuer<input name="issuer" defaultValue="Manual CA" className="px-3 py-2 rounded bg-navy-800 border border-teal-700 focus:outline-none focus:ring-1 focus:ring-teal-500" /></label>
          <label className="flex flex-col gap-1">Valid From<input name="validFrom" type="date" className="px-3 py-2 rounded bg-navy-800 border border-teal-700" /></label>
          <label className="flex flex-col gap-1">Valid To<input name="validTo" type="date" required className="px-3 py-2 rounded bg-navy-800 border border-teal-700" /></label>
          <label className="flex flex-col gap-1">Key Type<select name="keyType" className="px-3 py-2 rounded bg-navy-800 border border-teal-700"><option>RSA</option><option>ECDSA</option></select></label>
          <label className="flex flex-col gap-1">Key Size<input name="keySize" type="number" defaultValue="2048" className="px-3 py-2 rounded bg-navy-800 border border-teal-700" /></label>
          <label className="flex flex-col gap-1">Signature Algorithm<input name="signatureAlgorithm" defaultValue="SHA-256" className="px-3 py-2 rounded bg-navy-800 border border-teal-700" /></label>
          <label className="flex flex-col gap-1">Environment<select name="environment" className="px-3 py-2 rounded bg-navy-800 border border-teal-700"><option>cloud</option><option>windows</option><option>linux</option><option>ubuntu</option><option>macos</option></select></label>
          <label className="flex flex-col gap-1">Location<select name="location" className="px-3 py-2 rounded bg-navy-800 border border-teal-700"><option>external</option><option>internal</option></select></label>
          <label className="flex flex-col gap-1">Domain<input name="domain" className="px-3 py-2 rounded bg-navy-800 border border-teal-700" /></label>
          <label className="flex flex-col gap-1">Port<input name="port" type="number" defaultValue="443" className="px-3 py-2 rounded bg-navy-800 border border-teal-700" /></label>
          <div className="col-span-full flex gap-3 justify-end mt-2">
            <button type="button" className="px-3 py-2 rounded bg-navy-800 border border-teal-700 hover:bg-navy-700" onClick={close}>Cancel</button>
            <button type="submit" disabled={submitting} className="px-3 py-2 rounded bg-teal-700 hover:bg-teal-600">{submitting ? 'Creating...' : 'Create Certificate'}</button>
          </div>
        </form>
      </dialog>
    </>
  );
}

// Dialog to verify a domain/URL certificate expiry via /api/analytics/cert-check
function CertCheckDialog() {
  const dialogRef = useRef(null);
  const [input, setInput] = useState('https://example.com');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const open = () => dialogRef.current?.showModal();
  const close = () => dialogRef.current?.close();

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    try {
      setChecking(true);
      const data = await fetchJSON(`/api/analytics/cert-check?url=${encodeURIComponent(input)}`);
      setResult(data);
    } catch (err) {
      setError(err?.message || String(err));
    } finally {
      setChecking(false);
    }
  };

  return (
    <>
      <button className="px-3 py-2 rounded bg-teal-700 hover:bg-teal-600" onClick={open}>Verify Domain Certificate</button>
      <dialog ref={dialogRef} className="bg-navy-900 text-slate-200 p-4 rounded w-[90vw] max-w-2xl border border-teal-700">
        <form onSubmit={submit} className="space-y-3">
          <h3 className="text-lg font-medium text-teal-400">Verify Certificate Expiry</h3>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-slate-300">Domain or URL</span>
            <input value={input} onChange={(e)=>setInput(e.target.value)} placeholder="https://id.atlassian.com/ or example.com" className="px-3 py-2 rounded bg-navy-800 border border-teal-700 focus:outline-none focus:ring-1 focus:ring-teal-500" />
          </label>
          <div className="flex gap-3 justify-end">
            <button type="button" className="px-3 py-2 rounded bg-navy-800 border border-teal-700 hover:bg-navy-700" onClick={close}>Close</button>
            <button type="submit" disabled={checking} className="px-3 py-2 rounded bg-teal-700 hover:bg-teal-600">{checking ? 'Checking...' : 'Check'}</button>
          </div>
        </form>
        <div className="mt-3 space-y-2">
          {error && <div className="text-red-400">Error: {error}</div>}
          {result && (
            <div className="rounded border border-teal-700 p-3 bg-navy-800">
              <p><span className="text-slate-400">Target:</span> {result.target}</p>
              <p><span className="text-slate-400">Expired:</span> {String(result.expired)}</p>
              {'daysRemaining' in result && <p><span className="text-slate-400">Days Remaining:</span> {result.daysRemaining}</p>}
              {result.validFrom && <p><span className="text-slate-400">Valid From:</span> {new Date(result.validFrom).toLocaleString()}</p>}
              {result.validTo && <p><span className="text-slate-400">Valid To:</span> {new Date(result.validTo).toLocaleString()}</p>}
              {result.subject && (
                <p><span className="text-slate-400">Subject CN:</span> {result.subject.CN || result.subject.cn || ''}</p>
              )}
              {result.issuer && (
                <p><span className="text-slate-400">Issuer CN:</span> {result.issuer.CN || result.issuer.cn || ''}</p>
              )}
            </div>
          )}
        </div>
      </dialog>
    </>
  );
}

function App() {
  const [certs, setCerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [threshold, setThreshold] = useLocalStorageNumber('certintel_threshold_days', 10);
  const [search, setSearch] = useState('');
  const [current, setCurrent] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return certs;
    return certs.filter((c) =>
      String(c.commonName || '').toLowerCase().includes(q) ||
      String(c.issuer || '').toLowerCase().includes(q) ||
      String(c.domain || '').toLowerCase().includes(q)
    );
  }, [certs, search]);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const list = await fetchJSON('/api/certificates');
      setCerts(list);
    } catch (e) {
      setError(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const downloadJSON = async (filename, data) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  };

  const onDownloadAll = async () => downloadJSON('certificates.json', certs);
  const onDownloadExpiring = async () => {
    try {
      const expiring = await fetchJSON(`/api/analytics/expiry?withinDays=${threshold}`);
      downloadJSON(`expiring-within-${threshold}-days.json`, expiring);
    } catch (e) { alert('Download failed: ' + (e?.message || e)); }
  };

  return (
    <div className="flex flex-col h-screen">
      <TopBar onToggleSidebar={() => setSidebarOpen((o)=>!o)} threshold={threshold} setThreshold={setThreshold} search={search} setSearch={setSearch} onRefresh={load} onDownloadAll={onDownloadAll} onDownloadExpiring={onDownloadExpiring} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar current={current} setCurrent={setCurrent} open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-6">
          {error && <div className="text-red-400">Error: {error}</div>}
          {loading && <div className="text-slate-400">Loading...</div>}
          {!loading && (
            <>
              {(current==='dashboard' || current==='certificates') && (
                <section className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-medium text-teal-400">Certificates</h2>
                    <div className="flex gap-2">
                      <CreateCertificateDialog onCreated={load} />
                      <CertCheckDialog />
                    </div>
                  </div>
                  <CertificateTable certificates={filtered} />
                </section>
              )}

              {(current==='dashboard' || current==='analytics') && (
                <section className="space-y-2">
                  <h2 className="text-lg font-medium text-teal-400">Expiring Soon</h2>
                  <ExpiringCards certificates={filtered} threshold={threshold} />
                </section>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
