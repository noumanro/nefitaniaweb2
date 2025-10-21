// top.js: Render Top Donadores from Google Sheets ranges
(async function () {
  const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1P4B6NA_-q9XMxfhmcas9I5xbGFGieyMPUFntimALbzo/edit?usp=sharing';
  const SHEET_GID = '1912695401'; // GID de "Respuestas de formulario 1"
  const donorsEl = document.getElementById('donors');
  if (!donorsEl || !window.GoogleSheetHelper) return;

  function normName(s) {
    return String(s || '').trim().toLowerCase();
  }

  function formatCurrency(s) {
    // Formato: $170,474.10 o similar
    const num = parseFloat(String(s || '').replace(/[^0-9.-]/g, ''));
    if (isNaN(num)) return s || '—';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
  }

  async function loadSkinsManifest() {
    // Reutilizar lógica de skins.js: intentar local o raw GitHub
    const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    const baseUrl = isLocal
      ? 'image/skin/skins.json'
      : 'https://raw.githubusercontent.com/noumanro/nefitaniaweb2/main/image/skin/skins.json';
    try {
      const res = await fetch(baseUrl, { cache: 'no-store' });
      if (!res.ok) return [];
      const arr = await res.json();
      return Array.isArray(arr) ? arr : [];
    } catch { return []; }
  }

  function pickHeadUrl(file) {
    const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
    const dir = isLocal
      ? 'image/skin'
      : 'https://raw.githubusercontent.com/noumanro/nefitaniaweb2/main/image/skin';
    return `${dir}/${encodeURIComponent(file)}`;
  }

  // Render helper: tiny head canvas from skin file (like skins.js)
  function renderHeadCanvas(skinUrl, size = 96) {
    const canvas = document.createElement('canvas');
    canvas.width = size; canvas.height = size;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      ctx.drawImage(img, 8, 8, 8, 8, 0, 0, size, size);
      ctx.drawImage(img, 40, 8, 8, 8, 0, 0, size, size);
    };
    img.src = skinUrl;
    return canvas;
  }

  function donorCard(title, pairs) {
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `<h3 style="margin-top:0">${title}</h3>`;
    const list = document.createElement('div');
    list.style.display = 'flex';
    list.style.flexDirection = 'column';
    list.style.gap = '12px';
    pairs.forEach(({ name, amount, skinFile }) => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.gap = '12px';

      if (skinFile) {
        const url = pickHeadUrl(skinFile);
        row.appendChild(renderHeadCanvas(url, 64));
      } else {
        const ph = document.createElement('div');
        ph.style.cssText = 'width:64px;height:64px;border-radius:8px;background:rgba(255,255,255,.08);display:flex;align-items:center;justify-content:center;font-weight:700;color:#888;';
        ph.textContent = '?';
        row.appendChild(ph);
      }

      const info = document.createElement('div');
      info.style.flex = '1';
      info.innerHTML = `<div style="font-weight:700">${name || '—'}</div><div style="color:var(--muted)">${formatCurrency(amount)}</div>`;
      row.appendChild(info);
      list.appendChild(row);
    });
    card.appendChild(list);
    return card;
  }

  try {
    // Fetch the minimal ranges directly as CSV matrices to avoid header parsing issues
    const F5F7 = await GoogleSheetHelper.fetchCsvMatrix({ url: SHEET_URL, gid: SHEET_GID, range: 'F5:F7' });
    const G5G7 = await GoogleSheetHelper.fetchCsvMatrix({ url: SHEET_URL, gid: SHEET_GID, range: 'G5:G7' });
    const H5H7 = await GoogleSheetHelper.fetchCsvMatrix({ url: SHEET_URL, gid: SHEET_GID, range: 'H5:H7' });
    const I5I7 = await GoogleSheetHelper.fetchCsvMatrix({ url: SHEET_URL, gid: SHEET_GID, range: 'I5:I7' });

    // Normalize arrays (flatten single-column matrices)
    const colToArray = (mat) => mat.map(r => String((r && r[0]) || '').trim()).filter(x => x !== '');
    const namesPrincipal = colToArray(F5F7);
    const amountsPrincipal = colToArray(G5G7);
    const namesSecundario = colToArray(H5H7);
    const amountsSecundario = colToArray(I5I7);

    // Pair them
    const pairsPrincipal = namesPrincipal.map((n, i) => ({ name: n, amount: amountsPrincipal[i] || '' }));
    const pairsSecundario = namesSecundario.map((n, i) => ({ name: n, amount: amountsSecundario[i] || '' }));

    // Load skins manifest and build name->file map (case-insensitive)
    const manifest = await loadSkinsManifest();
    const nameToFile = new Map();
    manifest.forEach(entry => {
      if (entry && entry.name && entry.file) {
        nameToFile.set(normName(entry.name), entry.file);
      }
    });

    // Attach skin files if present
    const attachSkin = (pair) => ({ ...pair, skinFile: nameToFile.get(normName(pair.name)) });
    const enrichedPrincipal = pairsPrincipal.map(attachSkin);
    const enrichedSecundario = pairsSecundario.map(attachSkin);

    donorsEl.innerHTML = '';
    donorsEl.appendChild(donorCard('Clan Principal', enrichedPrincipal));
    donorsEl.appendChild(donorCard('Clan Secundario', enrichedSecundario));
    
    // Actualizar mensaje de carga
    const loadingMsg = document.querySelector('section p');
    if (loadingMsg && loadingMsg.textContent.includes('Cargando')) {
      loadingMsg.textContent = 'Se actualiza automáticamente desde Google Sheets';
    }
  } catch (e) {
    console.warn('No se pudo cargar Top Donadores:', e);
    donorsEl.innerHTML = '<p style="color:var(--muted)">No se pudo cargar Top Donadores.</p>';
  }
})();
