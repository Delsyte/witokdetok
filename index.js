const qEl = document.getElementById("q");
const clearEl = document.getElementById("clear");
const gridEl = document.getElementById("grid");
const emptyEl = document.getElementById("empty");
const errorEl = document.getElementById("error");
const errorMsgEl = document.getElementById("errorMsg");
const retryEl = document.getElementById("retry");
const countEl = document.getElementById("count");
const hintEl = document.getElementById("hint");
const statusPill = document.getElementById("statusPill");
const genresEl = document.getElementById("genres");

const featuredTitleEl = document.getElementById("featuredTitle");
const featuredMetaEl = document.getElementById("featuredMeta");
const playFeaturedBtn = document.getElementById("playFeatured");

document.getElementById("year").textContent = new Date().getFullYear();

let all = [];
let activeGenre = "All";

function esc(s){
  return String(s ?? "")
    .replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function initials(title) {
  const t = (title || "").trim();
  if (!t) return "FH";
  return t.split(/\s+/).slice(0, 2).map(x => x[0]?.toUpperCase() || "").join("");
}

function normGenres(g){
  if (!g) return [];
  if (Array.isArray(g)) return g.filter(Boolean);
  return String(g).split(",").map(x=>x.trim()).filter(Boolean);
}

function toPlayerUrl(f) {
  // kita kirim id juga biar nanti gampang upgrade (kalau mau player fetch by id)
  const title = encodeURIComponent(f.title || "Untitled");
  const embed = encodeURIComponent(f.embed || "");
  const id = encodeURIComponent(f.id || "");
  return `./player.html?id=${id}&title=${title}&embed=${embed}`;
}

function card(f, idx) {
  const genres = normGenres(f.genre);
  const genreText = genres.length ? genres.join(" • ") : "—";
  const metaBits = [];
  if (f.year) metaBits.push(esc(f.year));
  if (f.duration) metaBits.push(esc(f.duration));
  const metaLine = metaBits.length ? metaBits.join(" • ") : "";

  const thumb = (f.thumb || "").trim();
  const thumbHtml = thumb
    ? `<img class="thumb" src="${esc(thumb)}" alt="${esc(f.title)}" loading="lazy" />`
    : `<div class="fallback"><div class="fallbackText">${initials(f.title)}</div></div>`;

  return `
    <article class="card" data-idx="${idx}">
      ${thumbHtml}
      <div class="body">
        <div class="title">${esc(f.title || "Untitled")}</div>
        <div class="meta">
          <span class="badge">🎭 ${esc(genreText)}</span>
          ${f.source ? `<span class="badge">⚡ ${esc(f.source)}</span>` : ""}
          ${metaLine ? `<span class="badge">⏱ ${esc(metaLine)}</span>` : ""}
          <span class="badge">▶ Play</span>
        </div>
        ${f.desc ? `<div class="meta" style="margin-top:8px">${esc(f.desc)}</div>` : ""}
      </div>
    </article>
  `;
}

function renderGenreChips() {
  const set = new Set();
  all.forEach(f => normGenres(f.genre).forEach(g => set.add(g)));
  const genres = ["All", ...Array.from(set).sort((a,b)=>a.localeCompare(b))];

  genresEl.innerHTML = genres.map(g => `
    <button class="chip ${g===activeGenre ? "active":""}" data-g="${esc(g)}">${esc(g)}</button>
  `).join("");

  genresEl.querySelectorAll(".chip").forEach(btn => {
    btn.addEventListener("click", () => {
      activeGenre = btn.dataset.g || "All";
      renderGenreChips();
      applyFilter();
    });
  });
}

function applyFilter() {
  const q = qEl.value.trim().toLowerCase();

  const filtered = all.filter(f => {
    const inGenre = (activeGenre === "All")
      ? true
      : normGenres(f.genre).some(g => g.toLowerCase() === activeGenre.toLowerCase());

    if (!inGenre) return false;

    if (!q) return true;
    const gtxt = normGenres(f.genre).join(" ").toLowerCase();
    return (f.title || "").toLowerCase().includes(q) || gtxt.includes(q);
  });

  hintEl.textContent = `${activeGenre !== "All" ? `Genre: ${activeGenre}` : ""}${q ? ` • Cari: “${q}”` : ""}`.trim();
  gridEl.innerHTML = filtered.map((f, i) => card(f, i)).join("");

  emptyEl.classList.toggle("hidden", filtered.length !== 0);
  countEl.textContent = String(filtered.length);

  gridEl.querySelectorAll(".card").forEach(el => {
    el.addEventListener("click", () => {
      const idx = Number(el.dataset.idx);
      const f = filtered[idx];
      location.href = toPlayerUrl(f);
    });
  });

  // featured
  const featured = filtered[0] || all[0];
  if (featured) {
    featuredTitleEl.textContent = featured.title || "Featured";
    const bits = [];
    const genres = normGenres(featured.genre);
    if (genres.length) bits.push(genres.join(" • "));
    if (featured.year) bits.push(featured.year);
    if (featured.duration) bits.push(featured.duration);
    featuredMetaEl.textContent = bits.length ? bits.join(" • ") : "—";
    playFeaturedBtn.disabled = false;
    playFeaturedBtn.onclick = () => location.href = toPlayerUrl(featured);
  } else {
    featuredTitleEl.textContent = "Featured";
    featuredMetaEl.textContent = "—";
    playFeaturedBtn.disabled = true;
  }
}

async function load() {
  errorEl.classList.add("hidden");
  statusPill.textContent = "Loading…";

  try {
    const res = await fetch(window.API_FILMS, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    all = Array.isArray(data) ? data : [];

    statusPill.textContent = "Online";
    renderGenreChips();
    applyFilter();
  } catch (e) {
    console.error(e);
    statusPill.textContent = "Error";
    errorMsgEl.textContent = `API gagal: ${e.message}`;
    errorEl.classList.remove("hidden");
    gridEl.innerHTML = "";
    emptyEl.classList.add("hidden");
    countEl.textContent = "0";
  }
}

qEl.addEventListener("input", applyFilter);
clearEl.addEventListener("click", () => { qEl.value = ""; applyFilter(); qEl.focus(); });
retryEl.addEventListener("click", load);

load();
