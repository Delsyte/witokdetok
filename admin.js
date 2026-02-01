const tokenEl = document.getElementById("token");
const saveTokenEl = document.getElementById("saveToken");
const refreshEl = document.getElementById("refresh");

const formTitle = document.getElementById("formTitle");
const msgEl = document.getElementById("msg");

const idEl = document.getElementById("id");
const titleEl = document.getElementById("title");
const embedEl = document.getElementById("embed");
const thumbEl = document.getElementById("thumb");
const yearEl = document.getElementById("year");
const durationEl = document.getElementById("duration");
const qualityEl = document.getElementById("quality");
const sourceEl = document.getElementById("source");
const genreEl = document.getElementById("genre");
const descEl = document.getElementById("desc");

const submitEl = document.getElementById("submit");
const resetEl = document.getElementById("reset");

const listEl = document.getElementById("list");
const API = window.API_FILMS;

let editingId = null;

function esc(s){
  return String(s ?? "")
    .replaceAll("&","&amp;").replaceAll("<","&lt;")
    .replaceAll(">","&gt;").replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function getToken(){
  return localStorage.getItem("wk_admin_token") || "";
}
function setToken(v){
  localStorage.setItem("wk_admin_token", v);
}

function setMsg(text){
  msgEl.textContent = text || "";
}

function resetForm(){
  editingId = null;
  formTitle.textContent = "Tambah Film";
  idEl.value = "";
  titleEl.value = "";
  embedEl.value = "";
  thumbEl.value = "";
  yearEl.value = "";
  durationEl.value = "";
  qualityEl.value = "HD";
  sourceEl.value = "";
  genreEl.value = "";
  descEl.value = "";
  setMsg("");
}

function readForm(){
  return {
    id: idEl.value.trim() || undefined,
    title: titleEl.value.trim(),
    embed: embedEl.value.trim(),
    thumb: thumbEl.value.trim(),
    year: yearEl.value ? Number(yearEl.value) : undefined,
    duration: durationEl.value.trim(),
    quality: qualityEl.value.trim() || "HD",
    source: sourceEl.value.trim(),
    genre: genreEl.value.split(",").map(x=>x.trim()).filter(Boolean),
    desc: descEl.value.trim(),
  };
}

async function apiFetch(path, options = {}){
  const token = getToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };
  if (token) headers["X-Admin-Token"] = token;

  const res = await fetch(`${API}${path}`, { ...options, headers });
  const isJson = (res.headers.get("content-type") || "").includes("application/json");
  const data = isJson ? await res.json().catch(()=>null) : await res.text().catch(()=>null);
  if (!res.ok) {
    const msg = (data && data.error) ? data.error : `HTTP ${res.status}`;
    throw new Error(msg);
  }
  return data;
}

function renderList(films){
  if (!films.length) {
    listEl.innerHTML = `<div class="hint">Kosong.</div>`;
    return;
  }

  listEl.innerHTML = films.map(f => {
    const g = Array.isArray(f.genre) ? f.genre.join(", ") : "";
    const meta = [
      f.year ? String(f.year) : "",
      f.quality ? String(f.quality) : "",
      g ? g : "",
    ].filter(Boolean).join(" • ");

    return `
      <div class="item">
        <div class="itemTop">
          <div>
            <div class="itemTitle">${esc(f.title || "Untitled")}</div>
            <div class="itemMeta">${esc(meta)}</div>
            <div class="itemMeta">id: ${esc(f.id || "")}</div>
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
      const f = films.find(x => x.id === id);
      if (!f) return;

      editingId = id;
      formTitle.textContent = "Edit Film";

      idEl.value = f.id || "";
      titleEl.value = f.title || "";
      embedEl.value = f.embed || "";
      thumbEl.value = f.thumb || "";
      yearEl.value = f.year || "";
      durationEl.value = f.duration || "";
      qualityEl.value = f.quality || "HD";
      sourceEl.value = f.source || "";
      genreEl.value = Array.isArray(f.genre) ? f.genre.join(", ") : "";
      descEl.value = f.desc || "";

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
  const films = await fetch(API, { cache: "no-store" }).then(r => r.json()).catch(() => []);
  setMsg("");
  renderList(Array.isArray(films) ? films : []);
}

saveTokenEl.addEventListener("click", () => {
  setToken(tokenEl.value.trim());
  setMsg("Token saved.");
});

refreshEl.addEventListener("click", () => load());

resetEl.addEventListener("click", () => resetForm());

submitEl.addEventListener("click", async () => {
  try {
    const payload = readForm();

    if (!payload.title || !payload.embed) {
      setMsg("title dan embed wajib.");
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
