readyStates.set("constructor", false);

let dnm = new DrumNoteManager();
let dem;
let kickPatternCache, chPatternCache;
let playHead;

let chNoteArr, kickNoteArr, snrNoteArr, percNoteArr;
let progression;
let chordPlaySchedule;

function soundSchedule() {
  for (let i = 0; i < chunkSize * 256; i++) {
    const step = pm.relNextChunk * 256 + i;
    scheduleDrumNotes(step);
    scheduleChordNotes(step);
  }
}

function scheduleChordNotes(step) {
  if (chordPlaySchedule[step] !== undefined) {
    let chord = progression.chords[chordPlaySchedule[step]];

    for (let n = 0; n < chord.length; n++) {
      playNote(numToPitch(chord[n].num, progression.keyNum), step * stepLength, chord[n].length);
    }
  }
}

function scheduleDrumNotes(step) {
  if (chNoteArr[step] > 0) {
    playSound("ch", step * stepLength);
  }

  if (kickNoteArr[step] > 0) {
    playSound("kick", step * stepLength);
  }

  if (snrNoteArr[step] > 0) {
    playSound("snr", step * stepLength);
  }

  if (percNoteArr[step] > 0) {
    playSound("perc", step * stepLength);
  }

}

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

function loadDrumData() {
  let drumData = JSON.parse(sessionStorage.getItem("drumData"));

  chNoteArr = dnm.CalculateNotes(dnm.RetreivePatterns(
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

  kickNoteArr = dnm.CalculateNotes(dnm.RetreivePatterns(
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

  snrNoteArr = dnm.CalculateSnare(drumData.snarePattern);

  percNoteArr = dnm.CalculatePerc(drumData.perc1Bars, parseInt(drumData.perc1Pos), drumData.perc2Bars, parseInt(drumData.perc2Pos));

  dem.InitialiseDrumNotes();

  dem.Display(ch, chNoteArr);
  dem.Display(kick, kickNoteArr);
  dem.Display(snr, snrNoteArr);
  dem.Display(perc, percNoteArr);
}

function loadChordData() {
  let data = JSON.parse(sessionStorage.getItem("chordData"));
  progression = new ChordProgression(data.type, data.keyNum, data.roots, data.lengths, data.degrees, data.spreads, data.feels);
  chordPlaySchedule = progressionToSchedule(progression);

  progression.generateChords();

  dem.PlaceChordProgression(progression);
}

document.addEventListener("DOMContentLoaded", async function () {
  await am.SetDefaultBuffers();
  dem = new DisplayElementManager();
  await setDrumCaches();

  let playHeadCon = getById("playHeadCon");

  playHeadCon.addEventListener("click", function (event) {
    if (pm.playing) {
      pm.TogglePlaying(
        (event.pageX - playHeadCon.offsetLeft) / playHeadCon.offsetWidth,
        true
      ).then();
    }
  });

  loadDrumData();
  loadChordData();

  playHead = getById("trackPlayhead");
  readyStates.set("constructor", true);
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
