async function loadFilms() {
  const status = document.getElementById("status");
  const list = document.getElementById("list");

  try {
    const res = await fetch(`${window.API_BASE}/api/films`, { cache: "no-store" });
    const films = await res.json();

    list.innerHTML = "";
    if (!films.length) {
      status.textContent = "Belum ada film. Admin belum nambahin.";
      return;
    }

    status.textContent = `Ada ${films.length} film`;

    films.forEach(f => {
      const li = document.createElement("li");
      li.innerHTML = `
        <a href="player.html?title=${encodeURIComponent(f.title)}&embed=${encodeURIComponent(f.embed)}">
          ${f.title}
        </a>
      `;
      list.appendChild(li);
    });
  } catch (e) {
    console.error(e);
    status.textContent = "Gagal load. Cek API_BASE / Worker.";
  }
}

loadFilms();
setInterval(loadFilms, 10000); // biar otomatis update tiap 10 detik
