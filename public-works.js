import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import { getFirestore, collection, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { webUrl, previewImage } from "./catalog-preview.js";

const db = getFirestore(getApps()[0] || initializeApp(window.STEADFAST_FIREBASE_CONFIG));
const grid = document.getElementById("steadfastWorksGrid");

function projectCard(project) {
  const title = project.title || "Untitled project";
  const preview = webUrl(project.previewUrl);
  const live = webUrl(project.visitUrl) || preview;
  const image = project.image || project.previewImages?.[0];
  const template = document.getElementById("workCardTemplate");
  const card = template.content.firstElementChild.cloneNode(true);
  card.querySelector("h3").textContent = title;
  card.querySelector(".catalog-category").textContent = project.category || "Website";
  const summary = card.querySelector(".catalog-summary");
  summary.textContent = project.description || project.objective || "";
  summary.hidden = !summary.textContent;
  const media = card.querySelector(".catalog-media");
  if (live) {
    const link = card.querySelector(".catalog-live");
    link.href = live;
    link.hidden = false;
  }
  const details = card.querySelector(".catalog-details");
  const detailsUrl = webUrl(project.detailsUrl, true);
  if (detailsUrl) {
    details.href = detailsUrl;
    details.hidden = false;
  }
  const screenshot = previewImage(image, preview || live, title);
  if (screenshot) media.prepend(screenshot);
  return card;
}

const featured = {
  title: "McKenzie Ramen House", category: "Restaurant website",
  objective: "Customer ordering, reviews, and an admin workspace.",
  visitUrl: "https://mckenzieramen.github.io/mckenzie-ramen-house/",
  detailsUrl: "project.html"
};
function renderProjects(projects) {
  const cards = projects.map(projectCard);
  cards[0]?.classList.add("catalog-featured");
  grid.replaceChildren(...cards);
}
renderProjects([featured]);
onSnapshot(query(collection(db, "portfolioProjects"), where("published", "==", true)), snapshot => {
  const projects = snapshot.docs.map(record => record.data())
    .sort((first, second) => (second.createdAt?.seconds || 0) - (first.createdAt?.seconds || 0));
  const featuredUrl = featured.visitUrl.replace(/\/$/, "");
  const alreadyPublished = projects.some(project =>
    (webUrl(project.visitUrl) || webUrl(project.previewUrl)).replace(/\/$/, "") === featuredUrl
  );
  renderProjects(alreadyPublished ? projects : [...projects, featured]);
  document.getElementById("worksStatus").textContent = "";
}, error => {
  console.warn("Works load error", error);
  document.getElementById("worksStatus").textContent = "More projects are temporarily unavailable.";
});
