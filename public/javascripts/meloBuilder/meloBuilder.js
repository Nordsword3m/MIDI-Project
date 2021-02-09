let melody;
let melodyPlaySchedule;

let noteRefs = new Map();

let painting = false;
let paintStart = 0;
let paintNum;
let paintNote;

let dragging = false;
let dragStart;
let dragNoteStart;

let ghosts = [];

class Melody {
  constructor() {
    this.schedule = new Array(256);

    for (let i = 0; i < 256; i++) {
      this.schedule[i] = [];
    }
  }

  addNote(note, pos) {
    this.schedule[(pos / 8) * 256].push(note);
  }

  moveNote(note, pos) {
    for (let i = 0; i < this.schedule.length; i++) {
      if (this.schedule[i].includes(note)) {
        this.schedule[i].splice(this.schedule[i].indexOf(note), 1);
        break;
      }
    }

    this.schedule[pos].push(note);
  }
}

function ShowGhosts(noteNums, pos) {
  let ghosts = [];

  for (let n = 0; n < noteNums.length; n++) {
    ghosts.push(dem.PlaceMelodyGhost(pos, noteNums[n]));
  }

  return ghosts;
}

function SetupScaleNotes() {
  let possib = [];
  let noteRange = new NumRange(13, 48);

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

  ghosts = ShowGhosts(possib, 0);
}

function GetPaintLength(pageX) {
  let mousePos = pageX / $(document).width();
  return Math.round(Math.max(1 / 8, (mousePos * 8) - paintStart) * 8) / 8;
}

function StartNotePaint(e, num) {
  paintNum = num;
  painting = true;
  paintStart = Math.floor(Math.max((e.pageX / $(document).width()) * 8, 0) * 8) / 8;

  paintNote = dem.CreateDragNote(paintStart, num, 1 / 8);
}

function UpdatePaintLength(e) {
  if (painting) {
    paintNote.style.transition = "all 0ms";
    paintNote.style.width = "calc(" + GetPaintLength(e.pageX) + " * 12.5%)";
  }
}

function StopNotePaint(e) {
  if (painting) {
    paintNote.classList.remove("drawing");

    let newNote = new Note(paintNum, GetPaintLength(e.pageX));

    melody.addNote(newNote, paintStart);
    noteRefs.set(paintNote.id, newNote);
    painting = false;
    paintNote = null;
  }
}

function PreviewGhostNote(num) {
  if (!painting && !pm.playing) {
    am.playNoteNow(numToPitch(num, progression.keyNum), "piano");
  }
}

function noteHover(e) {
  if (!painting) {
    let pos = e.clientX - e.target.getBoundingClientRect().left;

    if (e.target.offsetWidth - pos <= window.innerWidth / 100) {
      e.target.classList.add("endSelect");
    } else {
      e.target.classList.remove("endSelect");
    }
  }
}

function mouseMove(e) {
  if (painting) {
    UpdatePaintLength(e);
  } else if (dragging) {
    moveNote(e);
  }
}

function moveNote(e) {
  let dragDelta = 100 * (Math.floor(((e.clientX / $(document).width()) - dragStart / 100) * 64) / 64);

  if (e.target.style.left !== "calc(" + (parseFloat(dragNoteStart) + dragDelta) + "%)") {
    let newSchedPos = 256 * (parseFloat(dragNoteStart) + dragDelta) / 100;

    melody.moveNote(noteRefs.get(e.target.id), newSchedPos);
  }

  e.target.style.left = "calc(" + dragNoteStart + "% + " + dragDelta + "%)";
}

function noteRelease(e) {
  if (dragging) {
    dragging = false;
  }
}

function notePress(e) {
  if (!painting) {
    dragging = true;
    dragStart = 100 * e.clientX / $(document).width();
    dragNoteStart = e.target.style.left.substring(5, e.target.style.left.length - 2);
  }
}

function noteMouseLeave(e) {
  e.target.classList.remove("endSelect");
  dragging = false;
}

async function loadMeloBuilder() {
  readyStates.declarePresence("melo");

  await readyStates.waitFor("instDataLoad");

  if (getById("display")) {
    getById("display").removeEventListener("click", playFromClick);
  }

  document.addEventListener("mousemove", mouseMove);
  document.addEventListener("mouseup", StopNotePaint);

  melody = new Melody();

  SetupScaleNotes();

  readyStates.readyUp("melo");
}