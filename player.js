const mount = document.getElementById("playerMount");

const titleEl = document.getElementById("title");
const metaEl = document.getElementById("meta");
const descEl = document.getElementById("desc");
const qualityBadge = document.getElementById("qualityBadge");

const openEmbedBtn = document.getElementById("openEmbed");
const copyEmbedBtn = document.getElementById("copyEmbed");
const shareBtn = document.getElementById("shareBtn");

const srv1 = document.getElementById("srv1");
const srv2 = document.getElementById("srv2");
const srv3 = document.getElementById("srv3");

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

function getParam(name){
  const u = new URL(location.href);
  return u.searchParams.get(name) || "";
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

function pill(text){ return `<span class="pill">${esc(text)}</span>`; }

function isDirectVideo(url){
  const u = (url || "").toLowerCase();
  return u.endsWith(".mp4") || u.includes(".mp4?") || u.endsWith(".m3u8") || u.includes(".m3u8?");
}

/**
 * Smart render:
 * - mp4/m3u8 -> <video>
 * - everything else -> iframe
 * - if iframe blocked by host, user can still Open
 */
function renderPlayer(url){
  const u = String(url || "").trim();
  if (!u) {
    mount.innerHTML = `<div class="blockedBox"><h3>Embed kosong</h3><p class="hint">Isi field embed/server dulu.</p></div>`;
    return;
  }

  // direct video (legal host / direct)
  if (isDirectVideo(u)) {
    const type = u.toLowerCase().includes(".m3u8")
      ? "application/vnd.apple.mpegurl"
      : "video/mp4";

    mount.innerHTML = `
      <video controls playsinline preload="metadata" style="width:100%;height:100%;display:block;background:black">
        <source src="${esc(u)}" type="${type}">
      </video>
    `;
    return;
  }

  // iframe embed
  mount.innerHTML = `
    <iframe
      src="${esc(u)}"
      title="Player"
      allow="autoplay; encrypted-media; picture-in-picture"
      allowfullscreen
      referrerpolicy="no-referrer"
      style="width:100%;height:100%;border:0;display:block;background:black"
      scrolling="no"
    ></iframe>
  `;
}

function renderMeta(f){
  const items = [];
  const genres = normGenres(f.genre);

  if (f.year) items.push(String(f.year));
  if (f.duration) items.push(String(f.duration));
  if (f.quality) items.push(String(f.quality).toUpperCase());
  if (f.source) items.push(String(f.source));
  genres.slice(0, 6).forEach(g => items.push(g));

  metaEl.innerHTML = items.map(pill).join("");
}

function setActive(btn){
  [srv1,srv2,srv3].forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

function loadServer(url, btn){
  if(!url){
    // biar halus, gak alert kasar
    mount.innerHTML = `
      <div class="blockedBox">
        <h3>Server belum tersedia</h3>
        <p class="hint">Isi link server ini di admin panel.</p>
      </div>
    `;
    return;
  }
  setActive(btn);
  renderPlayer(url);

  // update Open/Copy ikut server yg aktif
  openEmbedBtn.onclick = () => window.open(url, "_blank", "noopener,noreferrer");
  copyEmbedBtn.onclick = async () => { try{ await navigator.clipboard.writeText(url); }catch{} };
}

const PLAY_SVG = `<svg viewBox="0 0 24 24" fill="none">
  <path d="M8 5v14l12-7-12-7Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
</svg>`;

function card(f) {
  const thumb = (f.thumb || "").trim();
  const year = f.year ? String(f.year) : "";
  const genres = normGenres(f.genre);
  const genreText = genres.length ? genres.slice(0,2).join(" • ") : "";
  const meta = [genreText, year].filter(Boolean).join(" • ");
  const quality = normQuality(f.quality);

  const poster = thumb
    ? `<img src="${esc(thumb)}" alt="${esc(f.title)}" loading="lazy">`
    : `<div class="posterFallback"><span>WK</span></div>`;

  return `
    <article class="card" data-id="${esc(f.id || "")}" data-title="${esc(f.title || "")}" data-embed="${esc(f.embed || "")}">
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

function toPlayerUrl(f) {
  const id = encodeURIComponent(f.id || "");
  const title = encodeURIComponent(f.title || "");
  const embed = encodeURIComponent(f.embed || "");
  return `./player.html?id=${id}&title=${title}&embed=${embed}`;
}

function pickRandom(list, count){
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

    // find current
    let current =
      (id && films.find(f => String(f.id || "") === String(id))) ||
      films.find(f => String(f.embed || "") === String(embedParam)) ||
      films.find(f => String(f.title || "") === String(titleParam));

    if (!current) current = { title: titleParam || "Untitled", embed: embedParam };

    // title/meta/desc
    titleEl.textContent = current.title || "Untitled";
    descEl.textContent = current.desc || "";
    qualityBadge.textContent = normQuality(current.quality);
    renderMeta(current);

    // Share
    shareBtn.onclick = async () => {
      try{
        const shareUrl = location.href;
        if (navigator.share) await navigator.share({ title: current.title || "Witokdetok", url: shareUrl });
        else await navigator.clipboard.writeText(shareUrl);
      }catch{}
    };

    // ✅ servers from KV fields
    const s1 = String(current.embed || "").trim();
    const s2 = String(current.embed2 || "").trim();
    const s3 = String(current.embed3 || "").trim();

    // enable/disable buttons
    srv1.disabled = !s1;
    srv2.disabled = !s2;
    srv3.disabled = !s3;

    // default load server 1 if exist, else first available
    if (s1) loadServer(s1, srv1);
    else if (s2) loadServer(s2, srv2);
    else if (s3) loadServer(s3, srv3);
    else loadServer("", srv1);

    srv1.onclick = () => loadServer(s1, srv1);
    srv2.onclick = () => loadServer(s2, srv2);
    srv3.onclick = () => loadServer(s3, srv3);

    // recommended
    const others = films.filter(f => String(f.id || "") !== String(current.id || ""));
    const picks = pickRandom(others, 9);

    gridEl.innerHTML = picks.map(card).join("");
    emptyEl.classList.toggle("hidden", picks.length !== 0);

    gridEl.querySelectorAll(".card").forEach(el => {
      el.addEventListener("click", () => {
        const f = picks.find(x => String(x.id||"") === String(el.dataset.id)) || {
          id: el.dataset.id, title: el.dataset.title, embed: el.dataset.embed
        };
        location.href = toPlayerUrl(f);
      });
    });

  } catch(e){
    console.error(e);
    errorMsgEl.textContent = `API failed: ${e.message}`;
    errorEl.classList.remove("hidden");
    gridEl.innerHTML = "";
    emptyEl.classList.add("hidden");
  }
}

retryEl.addEventListener("click", load);
load();
