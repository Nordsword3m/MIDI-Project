let bassLine;
let bassPlaySchedule;

let intensity;
let energyRamp;

function setEnergyRamp(en) {
  energyRamp = parseFloat(en);
  ShowBassLine();
}

function setIntensity(it) {
  intensity = parseFloat(it);
  ShowBassLine();
}

class BassNote {
  constructor(num, length) {
    this.num = num;
    this.length = length;
  }
}

function bassLineToSchedule(bLine) {
  let pos = 0;
  let sched = new Array(256);

  for (let n = 0; n < bLine.length; n++) {
    sched[pos * 256 * barLength] = bLine[n];
    pos += bLine[n].length;
  }
  return sched;
}

function repeat(num, range) {
  while (num < range.min) {
    num += range.getRange();
  }

  while (num > range.max) {
    num -= range.getRange();
  }
  return num;
}

function clamp(num, range) {
  return Math.min(range.max, Math.max(num, range.min));
}

function calculateBaseLine() {
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

    let trueIntensity = intensity;

    if (Math.trunc(reducePos + 1) % 4 === 0) {
      trueIntensity += energyRamp;
    }

    if (reducePos + 1 >= 7) {
      trueIntensity += energyRamp;
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

  return bLine;
}

function combineNotes(n1, n2) {
  return new BassNote(n1.num, n1.length + n2.length);
}

function ShowBassLine() {
  bassLine = calculateBaseLine();
  bassPlaySchedule = bassLineToSchedule(bassLine);

  bassNoteCon.textContent = "";
  dem.PlaceBassLine(bassLine);
}

async function loadBassBuilder() {
  await readyStates.waitFor("instDataLoad");

  intensity = parseFloat(getById("intensitySlider").value);
  energyRamp = parseFloat(getById("intensitySlider").value);

  ShowBassLine();
}