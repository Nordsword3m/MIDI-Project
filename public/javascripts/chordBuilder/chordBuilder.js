let dem;

let chordObjs;

let keyType = "minor";
let keyNum = 1;

const majorScale = [1, 3, 5, 6, 8, 10, 12];
const minorScale = [1, 3, 4, 6, 8, 9, 11];

let curChord = 0;
let chordAmt = 8;

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
  constructor(type, roots, lengths, degrees) {
    this.type = type;
    this.roots = roots;
    this.lengths = lengths;
    this.degrees = degrees;
    this.chords = [];
  }

  generateChords() {
    let pos = 0;
    this.chords = [];

    for (let c = 0; c < this.roots.length; c++) {
      let inversion = 0;

      if (c > 0) {
        for (let n = this.degrees[c] - 1; n >= 0; n--) {
          let curNote = getFromScale(this.type, this.roots[c] + 2 * n);
          let topDist = curNote - this.chords[c - 1].sort((a, b) => b.num - a.num)[0].num;
          let botDist = curNote - this.chords[c - 1].sort((a, b) => a.num - b.num)[1].num;
          
          if (botDist > 12) {
            inversion--;
          } else if (topDist < -12) {
            inversion++;
          }
        }
      }
      this.chords.push(this.drawChord(this.type, this.roots[c], pos, this.lengths[c], this.degrees[c], inversion));
      pos += this.lengths[c];
    }
  }

  drawChord(type, root, start, length, degree, inversion) {
    let chord = [];
    let rootNum = root;

    for (let n = 0; n < degree; n++) {
      let invert = 0;

      if (inversion > 0) {
        if (n < inversion) {
          invert = 12;
        }
      } else if (inversion < 0) {
        if (n >= degree + inversion) {
          invert = -12;
        }
      }

      if (n === 0) {
        rootNum = getFromScale(type, root) + invert;
      }

      chord.push(new Note(getFromScale(type, root + 2 * n) + invert, length, n === 0));
    }

    chord.push(new Note(rootNum - 12, length, true));

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

    progression = new ChordProgression(keyType, [1, 5, 6, 4, 1, 5, 6, 4], [1, 1, 1, 1, 1, 1, 1, 1], [4, 4, 4, 4, 4, 4, 4, 4]);
    ShowChords();
  }
);