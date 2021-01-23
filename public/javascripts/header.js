let curPage;

let dnm = new DrumNoteManager();
let dem;
let kickPatternCache, chPatternCache;

let drumData = getDrumData();
let chordData = getChordData();

function getById(id) {
  return document.getElementById(id);
};

function getByClass(classname) {
  return document.getElementsByClassName(classname);
};

function lerp(a, b, t) {
  return parseFloat(a) + (parseFloat(b) - parseFloat(a)) * parseFloat(t);
}

const post = function (url, data) {
  let xhr = new XMLHttpRequest();
  xhr.open("POST", url, true);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.send(JSON.stringify(data));
}

let keydownfuncs = [];

let readyStates = new Map();

let am = new AudioManager(["m1", "m2", "kick", "ch", "snr", "perc", "C3", "C4", "C5", "C6", "C7"]);
let pm = new PlayManager();

//Tap tempo variables
let tempo;
let curTap = 0;
let prevTaps = [];
let tapTimeoutTimer;
let tempoInput;

let metroActive = false;

let chNoteArr, kickNoteArr, snrNoteArr, percNoteArr;
let progression;
let chordPlaySchedule;

function loadChordData() {
  progression = new ChordProgression(chordData.type, chordData.keyNum, chordData.roots, chordData.lengths, chordData.degrees, chordData.spreads, chordData.feels);

  chordPlaySchedule = progressionToSchedule(progression);
  progression.generateChords();

  if (curPage === "constructor" || curPage === "chords") {
    dem.PlaceChordProgression(progression);
  }
}

//Mute/Solo variables
let mutes = {drums: false, chords: false, ch: false, kick: false, snare: false, perc: false};
let solos = {drums: false, chords: false, ch: false, kick: false, snare: false, perc: false};

function toggleMute(inst) {
  mutes[inst] = !mutes[inst];
  solos[inst] = false;

  let muteButtons = getByClass("muteButton");

  for (let i = 0; i < muteButtons.length; i++) {
    if (muteButtons[i].dataset.inst === inst) {
      muteButtons[i].classList.toggle("selected");
      muteButtons[i].parentElement.getElementsByClassName("soloButton")[0].classList.remove("selected");
    }
  }

  saveMuteSolos();
}

function toggleSolo(inst) {
  solos[inst] = !solos[inst];
  mutes[inst] = false;

  let soloButtons = getByClass("soloButton");

  for (let i = 0; i < soloButtons.length; i++) {
    if (soloButtons[i].dataset.inst === inst) {
      soloButtons[i].classList.toggle("selected");
      soloButtons[i].parentElement.getElementsByClassName("muteButton")[0].classList.remove("selected");
    }
  }

  saveMuteSolos();
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
            cache: dnm.CacheBeatPatterns(drumSource["kick"], new NumRange(4, 7))
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
            cache: dnm.CacheBeatPatterns(drumSource["ch"], new NumRange(3, 6))
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

function getChordData() {
  let data = JSON.parse(sessionStorage.getItem("chordData"));

  if (!data) {
    data = {
      "type": 6,
      "keyNum": 4,
      "roots": [1, 3, 4, 2, 5, 1, 3, 4, 2, 5],
      "lengths": [1, 1, 1, 0.5, 0.5, 1, 1, 1, 0.5, 0.5],
      "degrees": [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
      "spreads": [true, true, true, true, true, true, true, true, true, true],
      "feels": [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
    };
  }

  return data;
}

function getDrumData() {
  let data = JSON.parse(sessionStorage.getItem("drumData"));

  if (!data) {
    data = {
      "seed": "102",
      "kickCohesion": "5",
      "kickCohesionMin": "4",
      "kickSpontaneity": "0.28",
      "kickQuirk": "0.5",
      "kickComplexity": "0.5",
      "chCohesion": "3",
      "chCohesionMin": "3",
      "chSpontaneity": "1",
      "chQuirk": "0.61",
      "chComplexity": "0.9",
      "snarePattern": "3",
      "perc1Pos": "28",
      "perc1Bars": [true, true, true, true, true, true, true, true],
      "perc2Pos": "4",
      "perc2Bars": [false, true, false, true, false, true, false, true]
    };
  }

  return data;
}

function loadDrumData() {
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

  if (curPage === "constructor" || curPage === "durms") {
    dem.InitialiseDrumNotes();

    dem.Display("ch", chNoteArr);
    dem.Display("kick", kickNoteArr);
    dem.Display("snr", snrNoteArr);
    dem.Display("perc", percNoteArr);
  }
}

function startPlaying() {
  if (am.buffers && [...readyStates.values()].reduce((a, t) => a && t)) {
    pm.TogglePlaying(0, !pm.playing);
  }
}

function loadMuteSolos() {
  let muteStores = JSON.parse(sessionStorage.getItem("mutes"));
  let soloStores = JSON.parse(sessionStorage.getItem("solos"));

  if (muteStores) {
    let muteData = Object.entries(muteStores);
    let muteButts = getByClass("muteButton");

    for (let i = 0; i < muteData.length; i++) {
      if (muteData[i][1]) {
        toggleMute(muteData[i][0], muteButts[i]);
      }
    }
  }

  if (soloStores) {
    let soloData = Object.entries(soloStores);
    let soloButts = getByClass("soloButton");

    for (let i = 0; i < soloData.length; i++) {
      if (soloData[i][1]) {
        toggleSolo(soloData[i][0], soloButts[i]);
      }
    }
  }
}

function saveMuteSolos() {
  sessionStorage.setItem("mutes", JSON.stringify(mutes));
  sessionStorage.setItem("solos", JSON.stringify(solos));
}

function toggleLeaveInstrumentIcon() {
  getById("leaveInstrument").classList.toggle('fa-sign-out-alt');
}

function setTempo(tmp) {
  tmp = tmp.length === 0
    ? "001"
    : parseInt(tmp).toString().padStart(3, "0").slice(0, 3);

  tempo = parseInt(tmp);
  getById("tempoInput").value = tmp;
}

function tapTempoButton() {
  prevTaps.unshift(am.curTime());

  if (prevTaps.length >= 8) {
    setTempo(
      60 /
      ((prevTaps[0] - prevTaps[Math.min(32, prevTaps.length - 1)]) /
        Math.min(32, prevTaps.length - 1))
    );
  }

  let bpmSuff = getById("bpmSuffix");

  if (curTap % 4 === 0) {
    am.playNow("m1");
    bpmSuff.classList.add("barTap");
    setTimeout(() => bpmSuff.classList.remove("barTap"), 200);
  } else {
    am.playNow("m2");
    bpmSuff.classList.add("noteTap");
    setTimeout(() => bpmSuff.classList.remove("noteTap"), 200);
  }
  curTap++;

  if (!tapTimeoutTimer) {
    tapTimeoutTimer = setTimeout(() => {
      prevTaps = [];
      curTap = 0;
    }, 2500);
  } else {
    clearTimeout(tapTimeoutTimer);
    tapTimeoutTimer = setTimeout(() => {
      prevTaps = [];
      curTap = 0;
    }, 2500);
  }
}

document.onkeydown = function (e) {
  for (let i = 0; i < keydownfuncs.length; i++) {
    keydownfuncs[i](e);
  }
}

function playSound(name, pos) {
  am.play(name, pos);
}

function playNote(pitch, pos, length) {
  am.playNote(pitch, pos, length);
}

function scheduleMets() {
  if (metroActive) {
    for (let i = 0; i < chunkSize * 256; i++) {
      const step = pm.relNextChunk * 256 + i;

      if ((step / (256 * noteLength)) % 1 === 0) {
        if ((step / (256 * barLength)) % 1 === 0) {
          playSound("m1", step * stepLength);
        } else {
          playSound("m2", step * stepLength);
        }
      }
    }
  }
}

function toggleMetronome(elem) {
  elem.classList.toggle("metOn");
  metroActive = !metroActive;
}

document.addEventListener("DOMContentLoaded", async function () {
  dem = new DisplayElementManager();

  await setDrumCaches();
  loadMuteSolos();

  keydownfuncs.push((e) => {
    if (e.key === ".") {
      tapTempoButton(getById("tapButton"));
    } else if (e.key === " ") {
      if (document.activeElement instanceof HTMLElement) {
        document.activeElement.blur();
      }
      startPlaying();
    }
  });

  getById("playButton").addEventListener("click", startPlaying);

  tempo = getById("tempoInput").value;

  getById("bpmSuffix").addEventListener("mousedown", () => tapTempoButton());
  
  loadChordData();
  loadDrumData();
});

function soundSchedule() {
  for (let i = 0; i < chunkSize * 256; i++) {
    const step = pm.relNextChunk * 256 + i;
    if (!mutes.drums && (!soloPresent() || solos.drums || solos.kick || solos.ch || solos.perc || solos.snare)) {
      scheduleDrumNotes(step);
    }
    if (!mutes.chords && (!soloPresent() || solos.chords)) {
      scheduleChordNotes(step);
    }
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

function soloPresent() {
  return Object.values(solos).reduce((x, t) => x || t);
}

function scheduleDrumNotes(step) {
  if (chNoteArr[step] > 0) {
    if (!mutes.ch && (!soloPresent() || solos.ch)) {
      playSound("ch", step * stepLength);
    }
  }

  if (kickNoteArr[step] > 0) {
    if (!mutes.kick && (!soloPresent() || solos.kick)) {
      playSound("kick", step * stepLength);
    }
  }

  if (snrNoteArr[step] > 0) {
    if (!mutes.snare && (!soloPresent() || solos.snare)) {
      playSound("snr", step * stepLength);
    }
  }

  if (percNoteArr[step] > 0) {
    if (!mutes.perc && (!soloPresent() || solos.perc)) {
      playSound("perc", step * stepLength);
    }
  }

}