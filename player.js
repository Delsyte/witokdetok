// player.js (UPDATED: dynamic Server 1–5 buttons)
const mount = document.getElementById("playerMount");

const titleEl = document.getElementById("title");
const metaEl = document.getElementById("meta");
const descEl = document.getElementById("desc");
const qualityBadge = document.getElementById("qualityBadge");

const openEmbedBtn = document.getElementById("openEmbed");
const copyEmbedBtn = document.getElementById("copyEmbed");
const shareBtn = document.getElementById("shareBtn");

const gridEl = document.getElementById("grid");
const emptyEl = document.getElementById("empty");

const errorEl = document.getElementById("error");
const errorMsgEl = document.getElementById("errorMsg");
const retryEl = document.getElementById("retry");

document.getElementById("year").textContent = new Date().getFullYear();

const API = window.API_FILMS;

function esc(s){
  return String(s ?? "")
    .replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;")
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

function renderPlayer(url){
  const u = String(url || "").trim();
  if (!u) {
    mount.innerHTML = `
      <div class="blockedBox">
        <h3>Server belum tersedia</h3>
        <p class="hint">Isi link server di admin panel.</p>
      </div>
    `;
    return;
  }

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

  if (metaEl) metaEl.innerHTML = items.map(pill).join("");
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
    <article class="card" data-id="${esc(f.id || "")}">
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

/* =========================
   Dynamic Server Buttons 1–5
   ========================= */
function getServerRow(){
  // support: <div class="serverRow"> or id="serverRow"
  return document.getElementById("serverRow") || document.querySelector(".serverRow");
}

function buildServers(film){
  // server 1 = embed, server 2..5 = embed2..embed5
  const servers = [];
  const s1 = String(film.embed || "").trim();
  const s2 = String(film.embed2 || "").trim();
  const s3 = String(film.embed3 || "").trim();
  const s4 = String(film.embed4 || "").trim();
  const s5 = String(film.embed5 || "").trim();

  if (s1) servers.push({ label: "Server 1", url: s1 });
  if (s2) servers.push({ label: "Server 2", url: s2 });
  if (s3) servers.push({ label: "Server 3", url: s3 });
  if (s4) servers.push({ label: "Server 4", url: s4 });
  if (s5) servers.push({ label: "Server 5", url: s5 });

  // fallback: kalau kosong semua, tetap kasih 1 button disabled
  if (!servers.length) servers.push({ label: "Server 1", url: "" });

  return servers;
}

function setActiveButton(btn){
  const row = getServerRow();
  if (!row) return;
  row.querySelectorAll(".srvBtn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

function applyServer(url){
  renderPlayer(url);
  if (openEmbedBtn) openEmbedBtn.onclick = () => url && window.open(url, "_blank", "noopener,noreferrer");
  if (copyEmbedBtn) copyEmbedBtn.onclick = async () => {
    if (!url) return;
    try { await navigator.clipboard.writeText(url); } catch {}
  };
}

function renderServerButtons(film){
  const row = getServerRow();
  if (!row) return;

  const servers = buildServers(film);
  row.innerHTML = ""; // hapus tombol lama (srv1/srv2/srv3) kalau ada

  servers.forEach((s, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "srvBtn" + (idx === 0 ? " active" : "");
    btn.textContent = s.label;
    btn.disabled = !s.url;

    btn.addEventListener("click", () => {
      if (!s.url) return;
      setActiveButton(btn);
      applyServer(s.url);
    });

    row.appendChild(btn);
  });

  // load default server pertama yang available
  const first = servers.find(x => x.url) || servers[0];
  applyServer(first.url);
}

/* =========================
   Main load
   ========================= */
async function load(){
  if (errorEl) errorEl.classList.add("hidden");

  try{
    const id = getParam("id");
    const embedParam = decodeURIComponent(getParam("embed") || "");
    const titleParam = decodeURIComponent(getParam("title") || "");

    const res = await fetch(API, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const films = await res.json();
    if (!Array.isArray(films)) throw new Error("Bad data");

    // cari film
    let current =
      (id && films.find(f => String(f.id || "") === String(id))) ||
      films.find(f => String(f.embed || "") === String(embedParam)) ||
      films.find(f => String(f.title || "") === String(titleParam));

    if (!current) {
      current = {
        id: id || "",
        title: titleParam || "Untitled",
        embed: embedParam,
        quality: "HD",
        genre: [],
        desc: "",
        source: "Stream",
      };
    }

    // info
    if (titleEl) titleEl.textContent = current.title || "Untitled";
    if (descEl) descEl.textContent = current.desc || "";
    if (qualityBadge) qualityBadge.textContent = normQuality(current.quality);
    renderMeta(current);

    // share
    if (shareBtn) {
      shareBtn.onclick = async () => {
        try{
          const shareUrl = location.href;
          if (navigator.share) await navigator.share({ title: current.title || "Witokdetok", url: shareUrl });
          else await navigator.clipboard.writeText(shareUrl);
        } catch {}
      };
    }

    // ✅ server buttons (1–5) + load default
    renderServerButtons(current);

    // random lainnya
    const others = films.filter(f => String(f.id || "") !== String(current.id || ""));
    const picks = pickRandom(others, 9);

    if (gridEl) gridEl.innerHTML = picks.map(card).join("");
    if (emptyEl) emptyEl.classList.toggle("hidden", picks.length !== 0);

    if (gridEl) {
      gridEl.querySelectorAll(".card").forEach(el => {
        el.addEventListener("click", () => {
          const fid = el.getAttribute("data-id") || "";
          const f = picks.find(x => String(x.id || "") === String(fid));
          if (!f) return;
          location.href = toPlayerUrl(f);
        });
      });
    }

  } catch(e){
    console.error(e);
    if (errorMsgEl) errorMsgEl.textContent = `API failed: ${e.message}`;
    if (errorEl) errorEl.classList.remove("hidden");
    if (gridEl) gridEl.innerHTML = "";
    if (emptyEl) emptyEl.classList.add("hidden");
  }
}

if (retryEl) retryEl.addEventListener("click", load);
load();
