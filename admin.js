// admin.js
const API = window.API_FILMS;

const tokenEl = document.getElementById("token");
const saveTokenEl = document.getElementById("saveToken");
const refreshEl = document.getElementById("refresh");
const searchEl = document.getElementById("search");

const formTitle = document.getElementById("formTitle");
const msgEl = document.getElementById("msg");

const idEl = document.getElementById("id");
const titleEl = document.getElementById("titleInput");
const thumbEl = document.getElementById("thumb");
const yearEl = document.getElementById("year");
const durationEl = document.getElementById("duration");
const qualityEl = document.getElementById("quality");
const sourceEl = document.getElementById("source");
const genreEl = document.getElementById("genre");
const descEl = document.getElementById("desc");

const embedEl = document.getElementById("embed");
const embed2El = document.getElementById("embed2");
const embed3El = document.getElementById("embed3");
const embed4El = document.getElementById("embed4");
const embed5El = document.getElementById("embed5");

const submitEl = document.getElementById("submit");
const resetEl = document.getElementById("reset");
const listEl = document.getElementById("list");

let allFilms = [];
let editingId = null;

function esc(s){
  return String(s ?? "")
    .replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function setMsg(t){ msgEl.textContent = t || ""; }

function getToken(){
  return localStorage.getItem("wk_admin_token") || "";
}
function setToken(v){
  localStorage.setItem("wk_admin_token", v);
}

function normalizeGenreInput(raw){
  // input "Horror, Trending" -> ["Horror","Trending"]
  return String(raw || "")
    .split(",")
    .map(x => x.trim())
    .filter(Boolean);
}

function serverCount(f){
  return ["embed","embed2","embed3","embed4","embed5"]
    .reduce((n,k)=> n + (String(f?.[k] || "").trim() ? 1 : 0), 0);
}

function resetForm(){
  editingId = null;
  formTitle.textContent = "Tambah Film";
  idEl.value = "";
  titleEl.value = "";
  thumbEl.value = "";
  yearEl.value = "";
  durationEl.value = "";
  qualityEl.value = "HD";
  sourceEl.value = "Stream";
  genreEl.value = "";
  descEl.value = "";

  embedEl.value = "";
  embed2El.value = "";
  embed3El.value = "";
  embed4El.value = "";
  embed5El.value = "";

  setMsg("");
}

function readForm(){
  return {
    id: idEl.value.trim() || undefined,
    title: titleEl.value.trim(),
    thumb: thumbEl.value.trim(),
    year: yearEl.value ? Number(yearEl.value) : undefined,
    duration: durationEl.value.trim(),
    quality: qualityEl.value.trim() || "HD",
    source: sourceEl.value.trim() || "Stream",
    genre: normalizeGenreInput(genreEl.value),
    desc: descEl.value.trim(),

    embed: embedEl.value.trim(),
    embed2: embed2El.value.trim(),
    embed3: embed3El.value.trim(),
    embed4: embed4El.value.trim(),
    embed5: embed5El.value.trim(),
  };
}

async function apiFetch(path = "", options = {}){
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // sesuai Worker lo: requireAdmin() baca X-Admin-Token
  if (token) headers["X-Admin-Token"] = token;

  const res = await fetch(`${API}${path}`, { ...options, headers });
  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  const data = isJson ? await res.json().catch(()=>null) : await res.text().catch(()=>null);

  if (!res.ok) {
    const msg = data?.error ? data.error : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

function filteredFilms(){
  const q = (searchEl.value || "").trim().toLowerCase();
  if (!q) return allFilms;

  return allFilms.filter(f => {
    const title = String(f.title || "").toLowerCase();
    const genres = Array.isArray(f.genre) ? f.genre.join(" ") : String(f.genre || "");
    return title.includes(q) || genres.toLowerCase().includes(q);
  });
}

function renderList(){
  const films = filteredFilms();

  if (!films.length) {
    listEl.innerHTML = `<div class="hint">Kosong / nggak ada hasil search.</div>`;
    return;
  }

  listEl.innerHTML = films.map(f => {
    const g = Array.isArray(f.genre) ? f.genre.join(", ") : "";
    const meta = [
      f.year ? String(f.year) : "",
      (f.quality ? String(f.quality).toUpperCase() : ""),
      g ? g : "",
    ].filter(Boolean).join(" • ");

    const sc = serverCount(f);

    return `
      <div class="item">
        <div class="itemTop">
          <div>
            <div class="itemTitle">${esc(f.title || "Untitled")}</div>
            <div class="itemMeta">${esc(meta)}</div>
            <div class="itemMeta">id: ${esc(f.id || "")}</div>
            <div class="pill">Servers: ${sc}</div>
          </div>
        </div>

        <div class="itemBtns">
          <button class="small" data-edit="${esc(f.id)}">Edit</button>
          <button class="small danger" data-del="${esc(f.id)}">Delete</button>
        </div>
      </div>
    `;
  }).join("");

  listEl.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-edit");
      const f = allFilms.find(x => x.id === id);
      if (!f) return;

      editingId = id;
      formTitle.textContent = "Edit Film";

      idEl.value = f.id || "";
      titleEl.value = f.title || "";
      thumbEl.value = f.thumb || "";
      yearEl.value = f.year || "";
      durationEl.value = f.duration || "";
      qualityEl.value = f.quality || "HD";
      sourceEl.value = f.source || "Stream";
      genreEl.value = Array.isArray(f.genre) ? f.genre.join(", ") : (f.genre || "");
      descEl.value = f.desc || "";

      embedEl.value = f.embed || "";
      embed2El.value = f.embed2 || "";
      embed3El.value = f.embed3 || "";
      embed4El.value = f.embed4 || "";
      embed5El.value = f.embed5 || "";

      setMsg("Mode edit: klik Save untuk update.");
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  listEl.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const id = btn.getAttribute("data-del");
      if (!confirm("Hapus film ini?")) return;

      try {
        setMsg("Deleting...");
        await apiFetch(`/${encodeURIComponent(id)}`, { method: "DELETE" });
        setMsg("Deleted.");
        await load();
      } catch (e) {
        setMsg(`Error: ${e.message}`);
      }
    });
  });
}

async function load(){
  setMsg("Loading...");
  const films = await fetch(API, { cache: "no-store" })
    .then(r => r.json())
    .catch(() => []);

  allFilms = Array.isArray(films) ? films : [];
  setMsg("");
  renderList();
}

saveTokenEl.addEventListener("click", () => {
  setToken(tokenEl.value.trim());
  setMsg("Token saved.");
});

refreshEl.addEventListener("click", () => load());
searchEl.addEventListener("input", () => renderList());

resetEl.addEventListener("click", () => resetForm());

submitEl.addEventListener("click", async () => {
  try {
    const payload = readForm();

    // minimal wajib: title + minimal 1 server (embed)
    if (!payload.title) {
      setMsg("title wajib.");
      return;
    }
    if (!payload.embed) {
      setMsg("Server 1 (embed) wajib minimal 1 link.");
      return;
    }

    setMsg("Saving...");

    if (editingId) {
      await apiFetch(`/${encodeURIComponent(editingId)}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setMsg("Updated.");
    } else {
      await apiFetch("", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setMsg("Created.");
    }

    resetForm();
    await load();
  } catch (e) {
    setMsg(`Error: ${e.message}`);
  }
});

// init
tokenEl.value = getToken();
resetForm();
load();
