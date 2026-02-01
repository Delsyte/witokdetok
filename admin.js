document.getElementById("save").onclick = async () => {
  const msg = document.getElementById("msg");
  msg.textContent = "Saving…";

  const title = document.getElementById("title").value.trim();
  const embed = document.getElementById("embed").value.trim();
  const token = document.getElementById("token").value.trim();

  if (!title || !embed) {
    msg.textContent = "Judul & embed wajib diisi.";
    return;
  }

  try {
    const res = await fetch(`${window.API_BASE}/api/films`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      body: JSON.stringify({ title, embed }),
    });

    const out = await res.json();
    if (!res.ok) throw new Error(out?.error || "Gagal");

    msg.textContent = "Berhasil ✅ Film masuk ke list.";
    document.getElementById("title").value = "";
    document.getElementById("embed").value = "";
  } catch (e) {
    msg.textContent = "Error: " + e.message;
  }
};
