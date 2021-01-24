readyStates.declarePresence("constructor");

let playHead;

document.addEventListener("DOMContentLoaded", async function () {
  let playHeadCon = getById("playHeadCon");

  playHeadCon.addEventListener("click", function (event) {
    if (pm.playing) {
      pm.TogglePlaying(
        (event.pageX - playHeadCon.offsetLeft) / playHeadCon.offsetWidth,
        true
      ).then();
    }
  });

  playHead = getById("trackPlayhead");
  readyStates.readyUp("constructor");
});
