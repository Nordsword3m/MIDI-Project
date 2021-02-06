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
  let possib = [];
  let meloRange;
  let noteRange;

  if (melody.getLength() === 0) {
    meloRange = new NumRange(13, 48);
  } else {
    meloRange = new NumRange(melody.notes.reduce((x, n) => Math.min(x, n.num), 50), melody.notes.reduce((x, n) => Math.max(x, n.num), 0));
  }

  noteRange = new NumRange(Math.min(meloRange.max - 12, meloRange.min), Math.max(meloRange.min + 12, meloRange.max));

  let start;
  for (start = 0; start < 30; start++) {
    if (getFromScale(progression.type, start) === noteRange.min) {
      break;
    }
  }

  let curNote = start;

  while (getFromScale(progression.type, curNote) <= noteRange.max) {
    possib.push(getFromScale(progression.type, curNote));
    curNote++;
  }

  ghosts = ShowGhosts(possib, melody.getLength());
}

function GetPaintLength(pageX) {
  let mousePos = pageX / $(document).width();
  return Math.round(Math.max(1 / 8, (mousePos * 8) - paintStart) * 8) / 8;
}

function StartNotePaint(e, num) {
  for (let i = ghosts.length - 1; i >= 0; i--) {
    ghosts[i].parentNode.removeChild(ghosts[i]);
  }

  paintNum = num;
  painting = true;
  paintStart = Math.floor(Math.max((e.pageX / $(document).width()) * 8, 0, melody.getLength()) * 8) / 8;

  paintNote = dem.CreateDragNote(paintStart, num, 1 / 8);
}

function UpdateGhostStart(e, ghost) {
  let start = Math.floor(Math.max((e.pageX / $(document).width()) * 8, melody.getLength()) * 8) / 8;

  ghost.style.transition = "all 0ms";
  ghost.style.left = (((start - melody.getLength()) / 8) * 100) + "%";
  ghost.style.width = "calc(" + (8 - start) + " * 12.5%)";
}

function UpdatePaintLength(e) {
  if (painting) {
    paintNote.style.transition = "all 0ms";
    paintNote.style.width = "calc(" + GetPaintLength(e.pageX) + " * 12.5%)";
  }
}

function ResetGhost(ghost) {
  ghost.style.transition = "all 300ms";
  ghost.style.left = "0";
  ghost.style.width = "calc(" + (8 - melody.getLength()) + " * 12.5%)";
}

function StopNotePaint(e) {
  if (painting) {
    if (melody.getLength() < paintStart) {
      melody.notes.push(new Note(paintNum, paintStart - melody.getLength(), false, true));
    }

    paintNote.classList.remove("drawing");

    melody.notes.push(new Note(paintNum, GetPaintLength(e.pageX)));
    painting = false;
    paintNote = null;

    GhostNextNotes();
    melodyPlaySchedule = melodyToSchedule(melody);
  }
}

function PreviewGhostNote(num) {
  if (!painting && !pm.playing) {
    am.playNoteNow(numToPitch(num, progression.keyNum), "piano");
  }
}

async function loadMeloBuilder() {
  readyStates.declarePresence("melo");

  await readyStates.waitFor("instDataLoad");

  if (getById("display")) {
    getById("display").removeEventListener("click", playFromClick);
  }

  document.addEventListener("mousemove", (e) => UpdatePaintLength(e));
  document.addEventListener("mouseup", (e) => StopNotePaint(e));

  melody = new Melody();
  melodyPlaySchedule = melodyToSchedule(melody);

  GhostNextNotes();

  readyStates.readyUp("melo");
}