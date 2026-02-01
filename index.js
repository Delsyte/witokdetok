const searchBtn = document.getElementById("searchBtn");
const searchBar = document.getElementById("searchBar");
const qEl = document.getElementById("q");
const clearEl = document.getElementById("clear");
const closeSearch = document.getElementById("closeSearch");

const gridEl = document.getElementById("grid");
const genresEl = document.getElementById("genres");

const emptyEl = document.getElementById("empty");
const errorEl = document.getElementById("error");
const errorMsgEl = document.getElementById("errorMsg");
const retryEl = document.getElementById("retry");

const prevBtn = document.getElementById("prev");
const nextBtn = document.getElementById("next");
const pageNowEl = document.getElementById("pageNow");
const pageTotalEl = document.getElementById("pageTotal");
const pagerEl = document.getElementById("pager");

document.getElementById("year").textContent = new Date().getFullYear();

let all = [];
let activeGenre = "All";
let page = 1;
const PAGE_SIZE = 12;

function esc(s){
  return String(s ?? "")
    .replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
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
function normQuality(q){
  const v = String(q || "").trim().toUpperCase();
  return v || "HD";
}
function toPlayerUrl(f) {
  const title = encodeURIComponent(f.title || "Untitled");
  const embed = encodeURIComponent(f.embed || "");
  const id = encodeURIComponent(f.id || "");
  return `./player.html?id=${id}&title=${title}&embed=${embed}`;
}

const PLAY_SVG = `<svg viewBox="0 0 24 24" fill="none">
  <path d="M8 5v14l12-7-12-7Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
</svg>`;

function card(f, idx) {
  const thumb = (f.thumb || "").trim();
  const year = f.year ? String(f.year) : "";
  const genres = normGenres(f.genre);
  const genreText = genres.length ? genres.slice(0,2).join(" • ") : "";
  const meta = [genreText, year].filter(Boolean).join(" • ");
  const quality = normQuality(f.quality);

  const poster = thumb
    ? `<img src="${esc(thumb)}" alt="${esc(f.title)}" loading="lazy">`
    : `<div class="posterFallback"><span>${esc(initials(f.title))}</span></div>`;

  return `
    <article class="card" data-idx="${idx}">
      <div class="poster">
        ${poster}
        <div class="overlay" aria-hidden="true">
          <div class="qBadge">${esc(quality)}</div>
          <div class="playBtn">${PLAY_SVG}<span>Play</span></div>
          <div></div>
        </div>
      </div>
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
      page = 1;
      renderGenreChips();
      render();
    });
  });
}

function filteredList() {
  const q = (qEl?.value || "").trim().toLowerCase();

  return all.filter(f => {
    const inGenre = (activeGenre === "All")
      ? true
      : normGenres(f.genre).some(g => g.toLowerCase() === activeGenre.toLowerCase());
    if (!inGenre) return false;

    if (!q) return true;
    const gtxt = normGenres(f.genre).join(" ").toLowerCase();
    return (f.title || "").toLowerCase().includes(q) || gtxt.includes(q);
  });
}

function render() {
  const list = filteredList();

  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  if (page > totalPages) page = totalPages;

  const start = (page - 1) * PAGE_SIZE;
  const pageItems = list.slice(start, start + PAGE_SIZE);

  gridEl.innerHTML = pageItems.map((f, i) => card(f, i)).join("");

  gridEl.querySelectorAll(".card").forEach(el => {
    el.addEventListener("click", () => {
      const idx = Number(el.dataset.idx);
      const f = pageItems[idx];
      location.href = toPlayerUrl(f);
    });
  });

  emptyEl.classList.toggle("hidden", list.length !== 0);

  pagerEl.classList.toggle("hidden", list.length <= PAGE_SIZE);
  pageNowEl.textContent = String(page);
  pageTotalEl.textContent = String(totalPages);
  prevBtn.disabled = page <= 1;
  nextBtn.disabled = page >= totalPages;
}

async function load() {
  errorEl.classList.add("hidden");
  try {
    const res = await fetch(window.API_FILMS, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    all = Array.isArray(data) ? data : [];
    page = 1;

    renderGenreChips();
    render();
  } catch (e) {
    console.error(e);
    errorMsgEl.textContent = `API failed: ${e.message}`;
    errorEl.classList.remove("hidden");
    gridEl.innerHTML = "";
    emptyEl.classList.add("hidden");
    pagerEl.classList.add("hidden");
  }
}

/* Search toggle */
function openSearch(){
  searchBar.classList.remove("hidden");
  setTimeout(() => qEl?.focus(), 0);
}
function closeSearchBar(){
  searchBar.classList.add("hidden");
  if (qEl) qEl.value = "";
  page = 1;
  render();
}

searchBtn.addEventListener("click", () => {
  const isHidden = searchBar.classList.contains("hidden");
  if (isHidden) openSearch();
  else closeSearchBar();
});
closeSearch.addEventListener("click", closeSearchBar);

clearEl.addEventListener("click", () => {
  if (qEl) qEl.value = "";
  page = 1;
  render();
  qEl?.focus();
});
qEl.addEventListener("input", () => { page = 1; render(); });

retryEl.addEventListener("click", load);

prevBtn.addEventListener("click", () => { page = Math.max(1, page - 1); render(); });
nextBtn.addEventListener("click", () => { page = page + 1; render(); });

load();
