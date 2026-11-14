export function webUrl(value, allowRelative = false) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = allowRelative ? new URL(value, document.baseURI) : new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

export function previewImage(image, liveUrl, title) {
  const source = webUrl(image, true);
  const live = webUrl(liveUrl);
  if (!source && !live) return null;
  const thumbnail = document.createElement("img");
  thumbnail.alt = `${title} preview`;
  thumbnail.loading = "lazy";
  thumbnail.decoding = "async";
  const screenshot = live ? `https://image.thum.io/get/width/800/crop/500/noanimate/${live}` : "";
  thumbnail.addEventListener("error", () => {
    if (screenshot && thumbnail.src !== screenshot) thumbnail.src = screenshot;
    else thumbnail.remove();
  });
  thumbnail.src = source || screenshot;
  return thumbnail;
}
