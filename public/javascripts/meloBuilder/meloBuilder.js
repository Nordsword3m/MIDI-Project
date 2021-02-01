let rhythms = [];

let melody;
let melodyPlaySchedule;

class Melody {
  constructor(repeat, complexity, uniformity, rhythm) {
    this.repeat = repeat;
    this.complexity = complexity;
    this.uniformity = uniformity;
    this.rhythm = rhythm;

    this.notes = [];
  }

  generateNotes() {
    let melo = [];

    let lengthRange = new NumRange(Math.max(1 / 16, 1 / this.complexity * this.uniformity), Math.min(1, 1 / this.complexity * (1 + (1 - this.uniformity))));

    lengthRange.min = Math.floor(lengthRange.min * 16) / 16;
    lengthRange.max = Math.ceil(lengthRange.max * 16) / 16;

    let validLengths = [];

    for (let l = 1 / 16; l <= lengthRange.max; l += 1 / 16) {
      if (l >= lengthRange.min) {
        validLengths.push(l);
      }
    }

    let lengthCombos = sums([], validLengths, this.complexity, 1);

    lengthCombos[0].forEach((l) => melo.push(new Note(0, l)));

    this.notes = melo;
  }
}

function setRepeat(rpt) {
  melody.repeat = Math.round(parseFloat(rpt));
  ShowMelody();
}

function setComplexity(comp) {
  melody.complexity = Math.round(parseFloat(comp));
  ShowMelody();
}

function setUniformity(uni) {
  melody.uniformity = parseFloat(uni);
  ShowMelody();
}

function setRhythm(rhy) {
  melody.rhythm = parseFloat(rhy);
  ShowMelody();
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

function ShowMelody() {
  melody.generateNotes();
  melodyPlaySchedule = melodyToSchedule(melody);

  dem.PlaceMelody(melody);
}

async function loadMeloBuilder() {
  readyStates.declarePresence("melo");

  await readyStates.waitFor("instDataLoad");

  melody = new Melody(1, 4, 0.6, 0.2);
  ShowMelody();

  readyStates.readyUp("melo");
}