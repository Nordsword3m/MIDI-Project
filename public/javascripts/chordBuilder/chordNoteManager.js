const majorScale = [1, 3, 5, 6, 8, 10, 12];
const minorScale = [1, 3, 4, 6, 8, 9, 11];

//Chord feel consts
let sus2 = 1;
let sus4 = 2;
let dim = 3;
let aug = 4;

class ChordProgression {
  constructor(type, keyNum, roots, lengths, degrees, spreads, feels) {
    this.type = type;
    this.keyNum = keyNum;
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

function numToPitch(num, keyNum) {
  return (num - 1) + (keyNum - 1);
}

function getFromScale(scale, num) {
  let scaleNotes = scale === "major" ? majorScale : minorScale;
  num = num - 1;
  return ((Math.floor(num / 7) * 12) + scaleNotes[(num + 70) % 7]);
}

function progressionToSchedule(pro) {
  let pos = 0;
  let sched = new Array(256);

  for (let c = 0; c < progression.lengths.length; c++) {
    sched[Math.round(pos)] = c;
    pos += pro.lengths[c] * 256 * barLength;
  }

  return sched;
}
