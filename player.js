const q = new URLSearchParams(location.search);
const title = q.get("title") || "Untitled";
const embed = q.get("embed") || "";

document.getElementById("t").textContent = title;
document.getElementById("p").src = embed;

// kalau nanti mau lebih “pro”, player bisa fetch by id dari API juga.
// sekarang minimal: tampil title + iframe dari query param.
document.getElementById("meta").innerHTML = `
  <span class="badge">▶ Play</span>
  ${embed ? `<span class="badge">Source: embed</span>` : `<span class="badge">No embed</span>`}
`;
document.getElementById("desc").textContent =
  "Kalau film ga ke-load, cek embed URL (YouTube harus https://www.youtube.com/embed/ID).";
