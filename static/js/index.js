import Constructor from "./views/Constructor.js";
import DrumBuilder from "./views/DrumBuilder.js";
import ChordBuilder from "./views/ChordBuilder.js";
import BassBuilder from "./views/BassBuilder.js";
import MeloBuilder from "./views/MeloBuilder.js";

const navigateTo = url => {
  history.pushState(null, null, url);
  router();
};

const router = async () => {
  const routes = [
    {path: "/", view: Constructor},
    {path: "/drums", view: DrumBuilder},
    {path: "/chords", view: ChordBuilder},
    {path: "/bass", view: BassBuilder},
    {path: "/melo", view: MeloBuilder}
  ];

  const potentialMatches = routes.map(route => {
    return {route: route, isMatch: location.pathname === route.path};
  });

  let match = potentialMatches.find(potentialMatch => potentialMatch.isMatch);

  if (!match) {
    match = {
      route: routes[0],
      isMatch: true
    };
  }

  const view = new match.route.view();

  $("#app").load(view.viewPath, {});
};

window.addEventListener("popstate", router);

document.addEventListener("DOMContentLoaded", () => {
  document.body.addEventListener("click", e => {
    let elem = e.target.parentElement && e.target.parentElement.matches("[data-link]") ? e.target.parentElement : e.target;
    if (elem.matches("[data-link]")) {
      e.preventDefault();
      navigateTo(elem.href);
    }
  });

  router();
});