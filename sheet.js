// Lightweight Google Sheets fetch helper (client-side)
// Exposes window.GoogleSheetHelper with methods to fetch as JSON objects.
(function () {
  function extractIdAndGid(url) {
    const idMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
    const id = idMatch ? idMatch[1] : null;
    const gidMatch = url.match(/[?&#]gid=(\d+)/);
    const gid = gidMatch ? gidMatch[1] : '0';
    return { id, gid };
  }

  function buildGvizUrl(url, gid, tq, headers) {
    const { id, gid: gidFromUrl } = extractIdAndGid(url);
    const g = gid || gidFromUrl || '0';
    let u = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?gid=${encodeURIComponent(g)}&tqx=out:json`;
    if (tq) u += `&tq=${encodeURIComponent(tq)}`;
    if (headers != null) u += `&headers=${encodeURIComponent(String(headers))}`;
    return u;
  }

  function buildCsvUrl(url, gid, range) {
    const { id, gid: gidFromUrl } = extractIdAndGid(url);
    const g = gid || gidFromUrl || '0';
    let u = `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${encodeURIComponent(g)}`;
    if (range) u += `&range=${encodeURIComponent(range)}`;
    return u;
  }

  async function fetchText(u) {
    const res = await fetch(u, { cache: 'no-store' });
    if (!res.ok) throw new Error(`fetch failed ${res.status}`);
    return await res.text();
  }

  function parseGvizJson(text) {
    // gviz returns JS function call; extract JSON inside (...)
    const start = text.indexOf('(');
    const end = text.lastIndexOf(')');
    if (start === -1 || end === -1) throw new Error('Invalid GViz response');
    const jsonStr = text.slice(start + 1, end);
    return JSON.parse(jsonStr);
  }

  function rowsFromGviz(resp) {
    const table = resp.table;
    const headers = (table.cols || []).map((c, i) => c && (c.label || c.id) || `col_${i}`);
    const rows = (table.rows || []).map(r => {
      const obj = {};
      headers.forEach((h, i) => {
        const cell = r.c ? r.c[i] : null;
        obj[h] = cell ? (cell.f ?? cell.v) : null;
      });
      return obj;
    });
    return { headers, rows };
  }

  function parseCsv(text) {
    // Minimal CSV parser supporting quoted fields
    const rows = [];
    let row = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') { cur += '"'; i++; } else { inQuotes = false; }
        } else { cur += ch; }
      } else {
        if (ch === '"') { inQuotes = true; }
        else if (ch === ',') { row.push(cur); cur = ''; }
        else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
        else if (ch === '\r') { /* skip */ }
        else { cur += ch; }
      }
    }
    // flush
    row.push(cur);
    rows.push(row);
    return rows;
  }

  function rowsFromCsv(csvText) {
    const matrix = parseCsv(csvText);
    if (matrix.length === 0) return { headers: [], rows: [] };
    const headers = matrix[0].map(h => String(h || '').trim() || '');
    const rows = matrix.slice(1).map(r => {
      const obj = {};
      headers.forEach((h, i) => { if (h) obj[h] = r[i] ?? ''; });
      return obj;
    });
    return { headers, rows };
  }

  async function fetchCsvMatrix({ url, gid, range } = {}) {
    const csvUrl = buildCsvUrl(url, gid, range);
    const text = await fetchText(csvUrl);
    // return 2D array of strings
    // reuse parser but return raw matrix for position-based access
    // Implement light parser again to avoid exposing internals
    const rows = [];
    let row = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (inQuotes) {
        if (ch === '"') {
          if (text[i + 1] === '"') { cur += '"'; i++; } else { inQuotes = false; }
        } else { cur += ch; }
      } else {
        if (ch === '"') { inQuotes = true; }
        else if (ch === ',') { row.push(cur); cur = ''; }
        else if (ch === '\n') { row.push(cur); rows.push(row); row = []; cur = ''; }
        else if (ch === '\r') { /* skip */ }
        else { cur += ch; }
      }
    }
    row.push(cur);
    rows.push(row);
    return rows;
  }

  async function fetchSheet({ url, gid, range, prefer = 'gviz' } = {}) {
    // Try GViz first (structured JSON), then CSV
    if (prefer === 'gviz' || prefer === 'auto') {
      try {
        const gvizUrl = buildGvizUrl(url, gid);
        const txt = await fetchText(gvizUrl);
        const json = parseGvizJson(txt);
        const { rows } = rowsFromGviz(json);
        return rows;
      } catch (e) {
        if (prefer === 'gviz') throw e;
        // fallthrough to CSV
      }
    }
    const csvUrl = buildCsvUrl(url, gid, range);
    const csvText = await fetchText(csvUrl);
    const { rows } = rowsFromCsv(csvText);
    return rows;
  }

  window.GoogleSheetHelper = {
    extractIdAndGid,
    buildGvizUrl,
    buildCsvUrl,
    fetchSheet,
    fetchCsvMatrix,
  };
})();
