import { mkdir, writeFile } from "node:fs/promises";

// Exact files selected from Wikimedia Commons; preserve originals in the project.
const titles = [
  "Ngọ Môn.png",
  "Hoi An Ancient Town.jpg",
  "My Son Sanctuary, Vietnam, 2017 (52416000869).jpg",
  "Doan Mon Gate 2.jpg",
  "Tay Do castle South gate.JPG",
  "Trang An, Ninh Binh.jpg",
  "PhongNhaCave.jpg",
  "Ha Long Bay - Bahía de Ha Long.JPG",
  "Ho Chi Minh House 3012017573 19ef7d0d3c.jpg",
  "Cu Chi Tunnel.jpg",
];
const api = new URL("https://commons.wikimedia.org/w/api.php");
api.search = new URLSearchParams({
  action: "query",
  format: "json",
  titles: titles.map((t) => "File:" + t).join("|"),
  prop: "imageinfo",
  iiprop: "url|extmetadata",
  iiurlwidth: "1280",
}).toString();
const headers = {
  "User-Agent": "BookStreetHeritageDemo/1.0 (local educational prototype)",
};
const response = await fetch(api, { headers });
if (!response.ok) throw new Error(`Commons metadata ${response.status}`);
const data = await response.json();
const pages = Object.values(data.query.pages);
await mkdir("public/assets/heritage/verified", { recursive: true });
const credits = {};
for (let index = 0; index < titles.length; index++) {
  const title = titles[index];
  const info = pages.find((p) => p.title === "File:" + title)?.imageinfo?.[0];
  if (!info) throw new Error("Missing metadata: " + title);
  const id = "ds-" + String(index + 1).padStart(2, "0");
  const url = info.thumburl || info.url;
  const ext = url.toLowerCase().includes(".png") ? "png" : "jpg";
  const image = await fetch(url, { headers });
  if (!image.ok) throw new Error(`${id}: ${image.status} ${url}`);
  await writeFile(
    `public/assets/heritage/verified/${id}.${ext}`,
    Buffer.from(await image.arrayBuffer()),
  );
  const clean = (s) => (s || "").replace(/<[^>]*>/g, "").trim();
  credits[id] = {
    url: `/assets/heritage/verified/${id}.${ext}`,
    title,
    source: info.descriptionurl,
    author: clean(info.extmetadata.Artist?.value),
    license: clean(info.extmetadata.LicenseShortName?.value),
    licenseUrl: info.extmetadata.LicenseUrl?.value || "",
    description: clean(info.extmetadata.ImageDescription?.value),
  };
  console.log(id, credits[id].author, credits[id].license);
}
await writeFile(
  "src/data/heritageImages.json",
  JSON.stringify(credits, null, 2) + "\n",
);
