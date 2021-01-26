let bassLine;
let bassPlaySchedule;

let intensity;

function setIntensity(it) {
  intensity = it;
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

function calculateBaseLine() {
  let roots = progression.chords.map((c) => c[0]);
  let kickLine = [];
  let bassRanges = [];
  let bLine = [];

  // Align kick to bass notes
  let kickAlignPos = 0;
  let noteStart = 0;
  let prevNoteRoot = roots[0];

  for (let n = 0; n < roots.length; n++) {
    for (let k = kickAlignPos * 256 * barLength; k < (kickAlignPos + roots[n].length) * 256 * barLength; k++) {
      if (kickNoteArr[k] > 0) {
        let dist = (k - noteStart) / (256 * barLength);
        if (dist > 0) {
          kickLine.push(new BassNote(prevNoteRoot.num, dist));
          noteStart = k;
          if (prevNoteRoot !== roots[n]) {
            bassRanges.push(new NumRange(bassRanges.length > 0 ? bassRanges[bassRanges.length - 1].max : 0, k));
          }
          prevNoteRoot = roots[n];
        }
      }
    }
    kickAlignPos += roots[n].length;
  }
  kickLine.push(new BassNote(prevNoteRoot.num, (256 - noteStart) / (256 * barLength)));
  bassRanges.push(new NumRange(bassRanges.length > 0 ? bassRanges[bassRanges.length - 1].max : 0, 256));

  // Reduce based on intensity
  let curRange = 0;
  let reducePos = 0;

  let insertNote;
  for (let n = 0; n < kickLine.length; n++) {
    if (reducePos >= bassRanges[curRange].max / (256 * barLength)) {
      curRange++;
      if (insertNote) {
        bLine.push(insertNote);
        insertNote = undefined;
      }
    }

    if (!insertNote) {
      insertNote = new BassNote(kickLine[n].num, kickLine[n].length);
    } else {
      insertNote = combineNotes(insertNote, kickLine[n]);
    }

    if (insertNote.length >= intensity * bassRanges[curRange].getRange() / (256 * barLength)) {
      bLine.push(insertNote);
      insertNote = undefined;
    }

    reducePos += kickLine[n].length;
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

  intensity = getById("intensitySlider").value;

  ShowBassLine();
}