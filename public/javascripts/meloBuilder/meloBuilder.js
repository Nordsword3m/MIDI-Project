let melody;
let melodyPlaySchedule;

let painting = false;
let paintStart = 0;
let paintNum;
let paintNote;

let ghosts = [];

class Melody {
  constructor() {
    this.notes = [];
  }

  getLength() {
    return this.notes.reduce((x, n) => x + n.length, 0);
  }
}

function melodyToSchedule(melo) {
  let pos = 0;
  let sched = new Array(256);

  for (let n = 0; n
  < melo.notes.length; n++) {
    sched[pos * 256 * barLength] = melo.notes[n];
    pos += melo.notes[n].length;
  }
  return sched;
}

function ShowGhosts(noteNums, pos) {
  let ghosts = [];

  for (let n = 0; n < noteNums.length; n++) {
    ghosts.push(dem.PlaceMelodyGhost(pos, noteNums[n]));
  }

  return ghosts;
}

function GhostNextNotes() {
  let possib = [1, 2, 3, 4, 5, 6, 7];

  possib = possib.map((n) => getFromScale(progression.type, n));

  possib = possib.map((n) => n + 24);

  ghosts = ShowGhosts(possib, melody.getLength());
}

function GetPaintLength(pageX) {
  let mousePos = pageX / $(document).width();
  return Math.round(Math.max(1 / 8, (mousePos * 8) - paintStart) * 16) / 16;
}

function StartNotePaint(num, e) {
  painting = true;
  ghosts.forEach((g) => g.remove());

  paintStart = melody.getLength();
  paintNum = num;

  paintNote = dem.CreateDragNote(paintStart, num, GetPaintLength(e.pageX));
}

function UpdatePaint(e) {
  if (painting) {
    paintNote.style.width = "calc(" + GetPaintLength(e.pageX) + " * 12.5%)";
  }
}

function StopNotePaint(e) {
  if (painting) {
    melody.notes.push(new Note(paintNum, GetPaintLength(e.pageX)));
    painting = false;
    paintNote = null;

    GhostNextNotes();
  }
}

async function loadMeloBuilder() {
  readyStates.declarePresence("melo");

  await readyStates.waitFor("instDataLoad");

  if (getById("display")) {
    getById("display").removeEventListener("click", playFromClick);
  }

  document.addEventListener("mouseup", StopNotePaint);

  document.addEventListener("mousemove", UpdatePaint);

  melody = new Melody();

  GhostNextNotes();

  readyStates.readyUp("melo");
}