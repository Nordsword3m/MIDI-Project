let playHead;

async function loadConstructor() {
  readyStates.declarePresence("constructor");

  let playHeadCon = getById("playHeadCon");

  playHeadCon.addEventListener("click", function (event) {
    if (pm.playing) {
      pm.TogglePlaying(
        (event.pageX - playHeadCon.offsetLeft) / playHeadCon.offsetWidth,
        true
      ).then();
    }
  });

  readyStates.readyUp("constructor");
}
