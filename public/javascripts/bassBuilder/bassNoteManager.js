class BassNote {
  constructor(num, length) {
    this.num = num;
    this.length = length;
  }
}

function bassLineToSchedule(bLine) {
  let pos = 0;
  let sched = new Array(256);

  for (let n = 0; n < bLine.notes.length; n++) {
    sched[pos * 256 * barLength] = bLine.notes[n];
    pos += bLine.notes[n].length;
  }
  return sched;
}

class BassLine {
  constructor(type, intensity, energyRamp, jumpiness, flip) {
    this.type = type;
    this.intensity = intensity;
    this.energyRamp = energyRamp;
    this.jumpiness = jumpiness;
    this.flip = flip;
    this.notes = [];
  }

  generateNotes() {
    let roots = progression.chords.map((c) => c[0]);
    let aligned = [];
    let bassRanges = [];
    let bLine = [];

    // Align bass notes
    let alignPos = 0;
    let aligner = kickNoteArr;
    let noteStart = 0;
    let prevNoteRoot = roots[0];

    for (let n = 0; n < roots.length; n++) {
      for (let k = alignPos * 256 * barLength; k < (alignPos + roots[n].length) * 256 * barLength; k++) {
        if (aligner[k] > 0) {
          let dist = (k - noteStart) / (256 * barLength);
          if (dist > 0) {
            aligned.push(new BassNote(repeat(prevNoteRoot.num, new NumRange(-12, 0)), dist));
            noteStart = k;
            if (prevNoteRoot !== roots[n]) {
              bassRanges.push(new NumRange(bassRanges.length > 0 ? bassRanges[bassRanges.length - 1].max : 0, k));
            }
            prevNoteRoot = roots[n];
          }
        }
      }
      alignPos += roots[n].length;
    }
    aligned.push(new BassNote(repeat(prevNoteRoot.num, new NumRange(-12, 0)), (256 - noteStart) / (256 * barLength)));
    bassRanges.push(new NumRange(bassRanges.length > 0 ? bassRanges[bassRanges.length - 1].max : 0, 256));

    // Reduce based on intensity
    let curRange = 0;
    let reducePos = 0;

    let insertNote;
    for (let n = 0; n < aligned.length; n++) {
      if (reducePos >= bassRanges[curRange].max / (256 * barLength)) {
        curRange++;
        if (insertNote) {
          bLine.push(insertNote);
          insertNote = undefined;
        }
      }

      if (!insertNote) {
        insertNote = new BassNote(aligned[n].num, aligned[n].length);
      } else {
        insertNote = combineNotes(insertNote, aligned[n]);
      }

      let trueIntensity = this.intensity;

      if (Math.trunc(reducePos + 1) % 4 === 0) {
        trueIntensity += this.energyRamp;
      }

      if (reducePos + 1 >= 7) {
        trueIntensity += this.energyRamp;
      }

      if (insertNote.length >= clamp(1 - trueIntensity, new NumRange(0, 1)) * bassRanges[curRange].getRange() / (256 * barLength)) {
        bLine.push(insertNote);
        insertNote = undefined;
      }

      reducePos += aligned[n].length;
    }

    if (insertNote) {
      bLine.push(insertNote);
    }

    // Octave jumping
    let prevNoteChangeDir = 0;
    let bLineOrigin = JSON.parse(JSON.stringify(bLine));
    let jmpPos = 0;

    for (let n = 0; n < bLineOrigin.length; n++) {
      if (n > 0) {
        if (bLineOrigin[n].num !== bLineOrigin[n - 1].num) {
          prevNoteChangeDir = bLineOrigin[n].num - bLineOrigin[n - 1].num;
        }
      }

      let jumpDir = Math.sign(this.jumpiness);
      let trueJumpiness = Math.abs(this.jumpiness);

      if ((jmpPos % 4) / 4 >= 1 - trueJumpiness) {
        if (bLineOrigin[n].length < 1 / 4) {
          if (prevNoteChangeDir * jumpDir * (this.flip && jmpPos >= 4 ? -1 : 1) <= 0) {
            bLine[n].num += 7;
            if (bLine[n - 1].num === bLine[n].num
            ) {
              bLine[n - 1].num += 5;
            }
          } else {
            bLine[n].num -= 5;
            if (bLine[n - 1].num === bLine[n].num) {
              bLine[n - 1].num += 5 - prevNoteChangeDir;
            }
          }
        }
      }
      jmpPos += bLineOrigin[n].length;
    }

    this.notes = bLine;
  }
}

function combineNotes(n1, n2) {
  return new BassNote(n1.num, n1.length + n2.length);
}