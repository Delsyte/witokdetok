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

const ICON = {
  tag: `<svg viewBox="0 0 24 24" fill="none"><path d="M20 13l-7 7-11-11V2h7l11 11Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M7 7h.01" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`,
  bolt: `<svg viewBox="0 0 24 24" fill="none"><path d="M13 2 3 14h8l-1 8 11-14h-8l1-6Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`,
  clock: `<svg viewBox="0 0 24 24" fill="none"><path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z" stroke="currentColor" stroke-width="2"/><path d="M12 6v6l4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>`,
  play: `<svg viewBox="0 0 24 24" fill="none"><path d="M8 5v14l12-7-12-7Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>`
};

function esc(s){
  return String(s ?? "")
    .replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function initials(title) {
  const t = (title || "").trim();
  if (!t) return "W";
  return t.split(/\s+/).slice(0, 2).map(x => x[0]?.toUpperCase() || "").join("");
}

function normGenres(g){
  if (!g) return [];
  if (Array.isArray(g)) return g.filter(Boolean);
  return String(g).split(",").map(x=>x.trim()).filter(Boolean);
}

function toPlayerUrl(f) {
  const title = encodeURIComponent(f.title || "Untitled");
  const embed = encodeURIComponent(f.embed || "");
  const id = encodeURIComponent(f.id || "");
  return `./player.html?id=${id}&title=${title}&embed=${embed}`;
}

function badge(iconSvg, text) {
  return `<span class="badge">${iconSvg}${esc(text)}</span>`;
}

function card(f, idx) {
  const genres = normGenres(f.genre);
  const genreText = genres.length ? genres.join(" • ") : "—";

  const metaBits = [];
  if (f.year) metaBits.push(String(f.year));
  if (f.duration) metaBits.push(String(f.duration));
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
          ${badge(ICON.tag, genreText)}
          ${f.source ? badge(ICON.bolt, f.source) : ""}
          ${metaLine ? badge(ICON.clock, metaLine) : ""}
          ${badge(ICON.play, "Play")}
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

  hintEl.textContent = `${activeGenre !== "All" ? `Genre: ${activeGenre}` : ""}${q ? ` • Search: “${q}”` : ""}`.trim();

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
  statusPill.textContent = "Loading";

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
    errorMsgEl.textContent = `API failed: ${e.message}`;
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
