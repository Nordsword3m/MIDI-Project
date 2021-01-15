let dnm = new DrumNoteManager();
let dem;
let kickPatternCache, chPatternCache;

function setDrumCaches() {
  return new Promise((resolve, reject) => {
    let db, tx, store;
    let request = indexedDB.open("cacheDB", 1);

    request.onupgradeneeded = function (e) {
      db = e.target.result;
      store = db.createObjectStore("cacheStore", {keyPath: "cacheId"});

    }

    request.onerror = function (e) {
      console.log("Database failed to open" + e.target.errorCode);
    };

    request.onsuccess = async function (e) {
      await loadDrumSource();
      db = e.target.result;
      tx = db.transaction("cacheStore", "readwrite");
      store = tx.objectStore("cacheStore");

      db.onerror = function (e) {
        console.error("Database error: " + e.target.errorCode);
      };

      let results = 0;

      kickPatternCache = store.get("kickPatternCache");
      kickPatternCache.onsuccess = () => {
        if (kickPatternCache.result) {
          kickPatternCache = kickPatternCache.result.cache;
        } else {
          store.put({
            cacheId: "kickPatternCache",
            cache: dnm.CacheBeatPatterns(drumSource[kick], new NumRange(4, 7))
          });
        }

        results++;
        if (results === 2) {
          resolve();
        }
      }

      chPatternCache = store.get("chPatternCache");
      chPatternCache.onsuccess = () => {
        if (chPatternCache.result) {
          chPatternCache = chPatternCache.result.cache;
        } else {
          store.put({
            cacheId: "chPatternCache",
            cache: dnm.CacheBeatPatterns(drumSource[ch], new NumRange(3, 6))
          });
        }

        results++;
        if (results === 2) {
          resolve();
        }
      }

      tx.oncomplete = () => db.close();
    };
  });
}

document.addEventListener("DOMContentLoaded", async function () {
  keydownfuncs.push((e) => {
      if (e.key === " ") {
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }
        TogglePlaying(0, !playing).then();
      }
    }
  );

  dem = new DisplayElementManager();
  let drumData = JSON.parse(sessionStorage.getItem("drumData"));
  await setDrumCaches();

  let chNoteArr = dnm.CalculateNotes(dnm.RetreivePatterns(
    chPatternCache,
    drumData.seed,
    drumData.chCohesion,
    Math.round(
      lerp(
        drumData.chCohesionMin,
        drumData.chCohesion,
        1 - drumData.chSpontaneity
      )
    ),
    1 - drumData.chQuirk
  ), drumData.chComplexity);

  let kickNoteArr = dnm.CalculateNotes(dnm.RetreivePatterns(
    kickPatternCache,
    drumData.seed,
    drumData.kickCohesion,
    Math.round(
      lerp(
        drumData.kickCohesionMin,
        drumData.kickCohesion,
        1 - drumData.kickSpontaneity
      )
    ),
    1 - drumData.kickQuirk
  ), drumData.kickComplexity);

  let snrNoteArr = dnm.CalculateSnare(drumData.snarePattern);

  let percNoteArr = dnm.CalculatePerc(drumData.perc1Bars, parseInt(drumData.perc1Pos), drumData.perc2Bars, parseInt(drumData.perc2Pos));

  dem.InitialiseDrumNotes();

  dem.Display(ch, chNoteArr);
  dem.Display(kick, kickNoteArr);
  dem.Display(snr, snrNoteArr);
  dem.Display(perc, percNoteArr);
});

function loadDrumSource() {
  // Load buffer asynchronously
  let request = new XMLHttpRequest();

  return new Promise(function (resolve, reject) {
    request.open("GET", "../drumSourceData.txt", true);
    request.responseType = "json";

    request.onload = function () {
      drumSource = request.response;
      resolve();
    };

    request.onerror = function () {
      alert("Source: XHR error");
      reject();
    };

    request.send();
  });
}
