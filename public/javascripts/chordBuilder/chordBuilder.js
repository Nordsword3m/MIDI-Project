let dem;

let chordObjs;

let keyType = "minor";
let keyNum = 1;

const majorScale = [1, 3, 5, 6, 8, 10, 12];
const minorScale = [1, 3, 4, 6, 8, 9, 11];

let curChord = 0;
let chordAmt = 8;

//Chord feel consts
let sus2 = 1;
let sus4 = 2;
let dim = 3;
let aug = 4;

function playCurChord() {
  if (pm.playing) {
    return;
  }

  let chord = progression.chords[curChord];

  for (let n = 0; n < chord.length; n++) {
    am.playNoteNow(numToPitch(chord[n].num), chord[n].length);
  }
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
  } else {
    getById("rightChordArrow").classList.add("disabled");
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

  if (play) {
    playCurChord();
  }
}

function toggleKeyType() {
  if (keyType === "minor") {
    keyType = "major";
  } else {
    keyType = "minor";
  }

  progression.type = keyType;

  ShowChords();

  let keyTypeOptns = getByClass("keyType");

  for (let i = 0; i < keyTypeOptns.length; i++) {
    keyTypeOptns[i].classList.toggle("selected");
  }
}

function changeKey() {
  keyNum = parseInt(getById("keyInput").innerText) + 1;
  keyNum = keyNum > 12 ? 1 : keyNum;
  getById("keyInput").innerText = keyNum.toString();
}

function progressionToSchedule(pro) {
  let pos = 0;
  let sched = new Array(256);

  for (let c = 0; c < progression.lengths.length; c++) {
    sched[pos] = c;
    pos += pro.lengths[c] * 256 * barLength;
  }

  return sched;
}

function toggleSpread() {
  progression.spreads[curChord] = !progression.spreads[curChord];
  getById("spreadCheck").getElementsByClassName("checkIcon")[0].classList.toggle("checked");
  ShowChords();
  playCurChord();
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
}

function numToPitch(num) {
  return (num - 1) + (keyNum - 1);
}

function soundSchedule() {
  for (let i = 0; i < chunkSize * 256; i++) {
    const step = pm.relNextChunk * 256 + i;
    if (playSchedule[step] !== undefined) {
      let chord = progression.chords[playSchedule[step]];

      for (let n = 0; n < chord.length; n++) {
        playNote(numToPitch(chord[n].num), step * stepLength, chord[n].length);
      }
    }
  }
}

function getFromScale(scale, num) {
  let scaleNotes = scale === "major" ? majorScale : minorScale;
  num = num - 1;
  return ((Math.floor(num / 7) * 12) + scaleNotes[(num + 70) % 7]);
}

class ChordProgression {
  constructor(type, roots, lengths, degrees, spreads, feels) {
    this.type = type;
    this.roots = roots;
    this.lengths = lengths;
    this.degrees = degrees;
    this.spreads = spreads;
    this.feels = feels;
    this.chords = [];
  }

  generateChords() {
    let pos = 0;
    this.chords = [];

    for (let c = 0; c < this.roots.length; c++) {
      this.chords.push(this.drawChord(this.type, this.roots[c], pos, this.lengths[c], this.degrees[c], this.feels[c]));
      pos += this.lengths[c];

      if (c > 0) {
        let prevTop = this.chords[0][this.chords[0].length - 1].num;
        let prevBot = this.chords[0][0].num;
        for (let n = 0; n < this.degrees[c]; n++) {

          let curNormSpread = Math.abs(this.chords[c][n].num - prevTop) + Math.abs(this.chords[c][n].num - prevBot);
          let newNormSpreadDown = Math.abs(this.chords[c][n].num - 12 - prevTop) + Math.abs(this.chords[c][n].num - 12 - prevBot);
          let newNormSpreadUp = Math.abs(this.chords[c][n].num + 12 - prevTop) + Math.abs(this.chords[c][n].num + 12 - prevBot);

          if (newNormSpreadDown < newNormSpreadUp) {
            if (newNormSpreadDown < curNormSpread) {
              this.chords[c][n].num -= 12;
            }
          } else {
            if (newNormSpreadUp < curNormSpread) {
              this.chords[c][n].num += 12;
            }
          }
        }
      }

      this.chords[c] = this.chords[c].sort((a, b) => a.num - b.num);

      if (this.spreads[c] && this.degrees[c] >= 3) {
        if (c > 0) {
          let prevTop = this.chords[c - 1][this.chords[c - 1].length - 1].num;
          let prevBot = this.chords[c - 1][0].num;

          let topSpreadNote = Math.floor(this.degrees[c] / 2);
          let botSpreadNote = this.degrees[c] - 1 - Math.floor(this.degrees[c] / 2);

          if (Math.abs(this.chords[c][botSpreadNote].num + 12 - prevTop) < Math.abs(this.chords[c][topSpreadNote].num - 12 - prevBot)) {
            this.chords[c][botSpreadNote].num += 12;
          } else {
            this.chords[c][topSpreadNote].num -= 12;
          }
        } else {
          this.chords[c][this.degrees[c] - 1 - Math.floor(this.degrees[c] / 2)].num += 12;
        }
      }

      this.chords[c] = this.chords[c].sort((a, b) => a.num - b.num);
    }

    for (let c = 0; c < this.chords.length; c++) {
      let rootNum = this.roots[c];

      this.chords[c].forEach((n) => {
        if (n.root) {
          rootNum = n.num - 12;
        }
      });

      this.chords[c].forEach((n) => {
        if (Math.abs(n.num - rootNum) <= 4) {
          rootNum -= 12;
        }
      });

      this.chords[c].push(new Note(rootNum, this.lengths[c], true));
      this.chords[c] = this.chords[c].sort((a, b) => a.num - b.num);
    }
  }

  drawChord(type, root, start, length, degree, feel) {
    let chord = [];

    for (let n = 0; n < degree; n++) {
      let noteNum = getFromScale(type, root + 2 * n);

      if (n === 1) {
        if (feel === sus2) {
          noteNum = getFromScale(type, (root + 2 * n) - 1);
        } else if (feel === sus4) {
          noteNum = getFromScale(type, (root + 2 * n) + 1);
        }
      } else if (n === 2) {
        if (feel === dim) {
          noteNum = getFromScale(type, (root + 2 * n)) - 1;
        } else if (feel === aug) {
          noteNum = getFromScale(type, (root + 2 * n)) + 1;
        }
      }

      chord.push(new Note(noteNum, length, n === 0));
    }

    return chord;
  }
}

class Note {
  constructor(num, length, root) {
    this.num = num;
    this.length = length;
    this.root = root;
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

    let pRoots = [1, 3, 4, 2, 5, 1, 3, 4, 2, 5];
    let pLengths = [1, 1, 1, 0.5, 0.5, 1, 1, 1, 0.5, 0.5];
    let pDegrees = [4, 4, 4, 4, 4, 4, 4, 4, 4, 4];
    let pSpreads = [true, true, true, true, true, true, true, true, true, true]
    let pFeels = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]

    progression = new ChordProgression(keyType, pRoots, pLengths, pDegrees, pSpreads, pFeels);
    ShowChords();
  }
);