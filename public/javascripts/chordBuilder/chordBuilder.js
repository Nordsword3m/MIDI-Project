let dem;

let keyType = "minor";
let keyNum = 1;

const majorScale = [1, 3, 5, 6, 8, 10, 12];
const minorScale = [1, 3, 4, 6, 8, 9, 11];

let spreadSlider;

function toggleKeyType() {
  if (keyType === "minor") {
    keyType = "major";
  } else {
    keyType = "minor";
  }

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

function ShowChords() {
  progression = new ChordProgression(keyType, spreadSlider.value, [1, 5, 6, 4, 1, 5, 6, 4], [1, 1, 1, 1, 1, 1, 1, 1], [4, 4, 4, 4, 4, 4, 4, 4]);
  //progression = new ChordProgression(keyType, spreadSlider.value, [1], [1], [4]);

  playSchedule = progressionToSchedule(progression);

  chordNoteCon.textContent = "";
  dem.PlaceChordProgression(progression);
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

  return (Math.floor(num / 7) * 12) + scaleNotes[num % 7];
}

class ChordProgression {
  constructor(type, maxSpread, roots, lengths, degrees) {
    this.type = type;
    this.roots = roots;
    this.lengths = lengths;
    this.degrees = degrees;
    this.chords = [];

    this.generateChords(maxSpread);
  }

  generateChords(maxSpread) {
    let pos = 0;
    this.chords = [];

    for (let c = 0; c < this.roots.length; c++) {
      let inversion = 0;

      if (c > 0) {

        for (let n = this.degrees[c] - 1; n >= 0; n--) {
          let curNote = getFromScale(this.type, this.roots[c] + 2 * n);
          let topDist = Math.abs(curNote - getFromScale(this.type, this.roots[0] + 2 * (this.degrees[c] - 1)));
          let botDist = Math.abs(curNote - getFromScale(this.type, this.roots[0]));

          if (botDist - 12 > 12 * maxSpread) {
            inversion--;
          } else if (topDist - 12 > 12 * maxSpread) {
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

      chord.push(new Note(getFromScale(type, root + 2 * n) + invert, length, n === 0));
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

    await am.SetDefaultBuffers();

    dem.CreateDivisions();

    spreadSlider = getById("spreadSlider");

    ShowChords();
  }
);