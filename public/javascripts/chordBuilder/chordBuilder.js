readyStates.set("chords", false);

let dem;

let chordObjs;

let curChord = 0;
let chordAmt;

function saveData() {
  sessionStorage.setItem("chordData", JSON.stringify(progression));
}

function loadData() {
  let data = JSON.parse(sessionStorage.getItem("chordData"));

  if (data) {
    setKeyType(data.type);

    progression = new ChordProgression(data.type, data.keyNum, data.roots, data.lengths, data.degrees, data.spreads, data.feels);
    chordAmt = progression.roots.length;
  } else {
    let pRoots = [1, 3, 5, 4];
    let pLengths = [1, 1, 1, 1];
    let pDegrees = [4, 4, 4, 4];
    let pSpreads = [true, true, true, true];
    let pFeels = [0, 0, 0, 2];

    setKeyType("minor");

    progression = new ChordProgression("minor", 1, pRoots, pLengths, pDegrees, pSpreads, pFeels);
    chordAmt = progression.roots.length;
  }
}


function playCurChord() {
  if (pm.playing) {
    return;
  }

  let chord = progression.chords[curChord];

  for (let n = 0; n < chord.length; n++) {
    am.playNoteNow(numToPitch(chord[n].num, progression.keyNum), chord[n].length);
  }
}

function removeChord() {
  if (chordAmt <= 1) {
    return;
  }

  progression.roots.pop();
  progression.lengths.pop();
  progression.degrees.pop();
  progression.spreads.pop();
  progression.feels.pop();

  chordAmt--;
  setChord(curChord - 1, true);
  ShowChords();
}

function addNewChord() {
  let totLength = progression.lengths.reduce((a, t) => a + t);
  if (totLength >= 8) {
    return;
  }

  progression.roots.push(progression.roots[progression.roots.length - 1]);
  progression.lengths.push(Math.min(8 - totLength, progression.lengths[progression.lengths.length - 1]));
  progression.degrees.push(progression.degrees[progression.degrees.length - 1]);
  progression.spreads.push(progression.spreads[progression.spreads.length - 1]);
  progression.feels.push(progression.feels[progression.feels.length - 1]);

  chordAmt++;
  ShowChords();
  setChord(curChord + 1, true);
}

function setChord(chord, play = false) {
  if (chord < 0 || chord >= chordAmt) {
    return;
  }

  let allNotes = getByClass("chordNote");

  for (let i = 0; i < allNotes.length; i++) {
    allNotes[i].classList.remove("ghost");
  }

  curChord = chord;

  for (let i = 0; i < chordObjs[chord].length; i++) {
    chordObjs[chord][i].classList.add("ghost");
  }

  if (curChord > 0) {
    getById("leftChordArrow").classList.remove("disabled");
  } else {
    getById("leftChordArrow").classList.add("disabled");
  }

  if (curChord < chordAmt - 1) {
    getById("rightChordArrow").classList.remove("disabled");
    getById("chordNumButtons").style.display = "none";
  } else {
    getById("rightChordArrow").classList.add("disabled");
    getById("chordNumButtons").style.display = "initial";
  }

  getById("chordPos").innerText = "Chord " + (chord + 1);
  getById("rootSlider").value = progression.roots[chord];
  getById("fullnessSlider").value = progression.degrees[chord];
  getById("spreadCheck").checked = progression.spreads[chord];
  if (progression.spreads[chord]) {
    getById("spreadCheck").getElementsByClassName("checkIcon")[0].classList.add("checked");
  } else {
    getById("spreadCheck").getElementsByClassName("checkIcon")[0].classList.remove("checked");
  }
  getById("feelSlider").value = progression.feels[chord];
  getById("lengthSlider").value = progression.lengths[chord];

  if (play) {
    playCurChord();
  }
}

function setKeyType(type) {
  let keyTypeOptns = getByClass("keyType");

  if (type === "major") {
    keyTypeOptns[0].classList.add("selected");
    keyTypeOptns[1].classList.remove("selected");
  } else if (type === "minor") {
    keyTypeOptns[0].classList.remove("selected");
    keyTypeOptns[1].classList.add("selected");
  }
}

function toggleKeyType() {
  if (progression.type === "minor") {
    setKeyType("major");
    progression.type = "major";
  } else {
    setKeyType("minor");
    progression.type = "minor";
  }


  ShowChords();
}

function changeKey() {
  progression.keyNum = parseInt(getById("keyInput").innerText) + 1;
  progression.keyNum = progression.keyNum > 12 ? 1 : progression.keyNum;
  getById("keyInput").innerText = progression.keyNum.toString();
  saveData();
}

function toggleSpread() {
  progression.spreads[curChord] = !progression.spreads[curChord];
  getById("spreadCheck").getElementsByClassName("checkIcon")[0].classList.toggle("checked");
  ShowChords();
  playCurChord();
}

function setLength(length) {
  if (progression.lengths[curChord] !== length) {
    let totLength = progression.lengths.reduce((a, t) => a + t);
    if ((totLength - progression.lengths[curChord]) + length <= 8) {
      progression.lengths[curChord] = length;
      ShowChords();
    } else {
      getById("lengthSlider").value = progression.lengths[curChord];
    }
  }
}

function setFeel(feel) {
  if (progression.feels[curChord] !== feel) {
    progression.feels[curChord] = feel;
    ShowChords();
    playCurChord();
  }
}

function setRoot(root) {
  if (progression.roots[curChord] !== root) {
    progression.roots[curChord] = root;
    ShowChords();
    playCurChord();
  }
}

function setFullness(degree) {
  if (progression.degrees[curChord] !== degree) {
    progression.degrees[curChord] = degree;
    ShowChords();
    playCurChord();
  }
}

function ShowChords() {
  progression.generateChords();
  playSchedule = progressionToSchedule(progression);

  chordNoteCon.textContent = "";
  chordObjs = dem.PlaceChordProgression(progression);
  setChord(curChord);
  saveData();
}

function soundSchedule() {
  for (let i = 0; i < chunkSize * 256; i++) {
    const step = pm.relNextChunk * 256 + i;
    if (playSchedule[step] !== undefined) {
      let chord = progression.chords[playSchedule[step]];

      for (let n = 0; n < chord.length; n++) {
        playNote(numToPitch(chord[n].num, progression.keyNum), step * stepLength, chord[n].length);
      }
    }
  }
}

let progression;
let playSchedule;

document.addEventListener("DOMContentLoaded", async function () {
    dem = new DisplayElementManager();
    dem.CreateDivisions();
    await am.SetDefaultBuffers();

    display.addEventListener("click", function (event) {
      pm.TogglePlaying(
        (event.pageX - display.offsetLeft) / display.offsetWidth,
        true
      ).then();
    });

    loadData();

    ShowChords();
    readyStates.set("chords", true);
  }
);