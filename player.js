const frame = document.getElementById("frame");
const titleEl = document.getElementById("title");
const metaEl = document.getElementById("meta");
const descEl = document.getElementById("desc");
const qualityBadge = document.getElementById("qualityBadge");
const openEmbedBtn = document.getElementById("openEmbed");
const shareBtn = document.getElementById("shareBtn");

const gridEl = document.getElementById("grid");
const emptyEl = document.getElementById("empty");

const errorEl = document.getElementById("error");
const errorMsgEl = document.getElementById("errorMsg");
const retryEl = document.getElementById("retry");

document.getElementById("year").textContent = new Date().getFullYear();

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

function getParam(name){
  const u = new URL(location.href);
  return u.searchParams.get(name) || "";
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
          <div class="qBadge2">${esc(quality)}</div>
          <div class="playBtn">${PLAY_SVG}<span>Play</span></div>
          <div></div>
        </div>
      </div>
      <div class="body">
        <p class="t2">${esc(f.title || "Untitled")}</p>
        <div class="sub">${esc(meta || " ")}</div>
      </div>
    </article>
  `;
}

function pill(text){
  return `<span class="pill">${esc(text)}</span>`;
}

function renderMeta(f){
  const items = [];
  const genres = normGenres(f.genre);

  if (f.year) items.push(String(f.year));
  if (f.duration) items.push(String(f.duration));
  if (f.quality) items.push(String(f.quality).toUpperCase());
  if (f.source) items.push(String(f.source));
  genres.slice(0, 4).forEach(g => items.push(g));

  metaEl.innerHTML = items.map(pill).join("");
}

function pickRandom(list, count){
  // Fisher–Yates shuffle copy
  const a = list.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, count);
}

async function load(){
  errorEl.classList.add("hidden");
  try{
    const id = getParam("id");
    const embedParam = decodeURIComponent(getParam("embed") || "");
    const titleParam = decodeURIComponent(getParam("title") || "");

    const res = await fetch(window.API_FILMS, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const films = await res.json();
    if (!Array.isArray(films)) throw new Error("Bad data");

    // cari film sekarang: prioritas id, fallback title+embed
    let current =
      (id && films.find(f => String(f.id || "") === String(id))) ||
      films.find(f => String(f.embed || "") === String(embedParam)) ||
      films.find(f => String(f.title || "") === String(titleParam));

    // fallback: pakai query param
    if (!current) {
      current = {
        id: id || "",
        title: titleParam || "Untitled",
        embed: embedParam,
        quality: "HD",
        genre: [],
        desc: "",
      };
    }

    // set player
    const embed = String(current.embed || embedParam || "").trim();
    if (!embed) throw new Error("Embed kosong");

    frame.src = embed;
    titleEl.textContent = current.title || "Untitled";
    descEl.textContent = current.desc || "";
    const q = normQuality(current.quality);
    qualityBadge.textContent = q;

    openEmbedBtn.onclick = () => window.open(embed, "_blank", "noopener,noreferrer");

    renderMeta(current);

    // share
    shareBtn.onclick = async () => {
      try{
        const shareUrl = location.href;
        if (navigator.share) {
          await navigator.share({ title: current.title || "Witokdetok", url: shareUrl });
        } else {
          await navigator.clipboard.writeText(shareUrl);
          shareBtn.blur();
        }
      } catch {}
    };

    // random section
    const others = films.filter(f => String(f.id || "") !== String(current.id || ""))
                        .filter(f => String(f.embed || "") !== String(embed));
    const picks = pickRandom(others, 9);

    gridEl.innerHTML = picks.map((f,i)=>card(f,i)).join("");
    emptyEl.classList.toggle("hidden", picks.length !== 0);

    gridEl.querySelectorAll(".card").forEach(el => {
      el.addEventListener("click", () => {
        const idx = Number(el.dataset.idx);
        const f = picks[idx];
        location.href = toPlayerUrl(f);
      });
    });

  }catch(e){
    console.error(e);
    errorMsgEl.textContent = `API failed: ${e.message}`;
    errorEl.classList.remove("hidden");
    gridEl.innerHTML = "";
    emptyEl.classList.add("hidden");
  }
}

retryEl.addEventListener("click", load);
load();
