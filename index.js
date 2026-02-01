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
  if (!t) return "WK";
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

function card(f, idx) {
  const thumb = (f.thumb || "").trim();
  const year = f.year ? String(f.year) : "";
  const genres = normGenres(f.genre);
  const genreText = genres.length ? genres.slice(0,2).join(" • ") : "";

  const meta = [genreText, year].filter(Boolean).join(" • ");

  const posterHtml = thumb
    ? `<div class="poster"><img src="${esc(thumb)}" alt="${esc(f.title)}" loading="lazy"></div>`
    : `<div class="poster"><div class="posterFallback"><span>${esc(initials(f.title))}</span></div></div>`;

  return `
    <article class="card" data-idx="${idx}">
      ${posterHtml}
      <div class="body">
        <p class="title">${esc(f.title || "Untitled")}</p>
        ${meta ? `<div class="sub">${esc(meta)}</div>` : `<div class="sub">&nbsp;</div>`}
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

  hintEl.textContent =
    `${activeGenre !== "All" ? `Genre: ${activeGenre}` : ""}${q ? ` • Search: “${q}”` : ""}`.trim();

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
