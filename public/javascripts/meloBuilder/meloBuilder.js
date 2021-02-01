let rhythms = new Map();

rhythms.set("inc", function (list) {
  let res = true;
  for (let i = 1; i < list.length; i++) {
    res &= list[i - 1] <= list[i];
  }
  return res;
});

rhythms.set("dec", function (list) {
  let res = true;
  for (let i = 1; i < list.length; i++) {
    res &= list[i - 1] >= list[i];
  }
  return res;
});

rhythms.set("valley", function (list) {
  let res = true;
  let down = true;
  for (let i = 1; i < list.length; i++) {
    let diff = list[i] - list[i - 1];

    if (down) {
      if (diff <= 0) {
        res &= true;
      } else {
        res &= true;
        down = false;
      }
    } else {
      res &= diff >= 0;
    }
  }
  return res && !down || list.length < 3;
});

rhythms.set("peak", function (list) {
  let res = true;
  let up = true;
  for (let i = 1; i < list.length; i++) {
    let diff = list[i] - list[i - 1];

    if (up) {
      if (diff >= 0) {
        res &= true;
      } else {
        res &= true;
        up = false;
      }
    } else {
      res &= diff <= 0;
    }
  }
  return res && !up || list.length < 3;
});

rhythms.set("inc2", function (list) {
  let res = true;
  let again = false;
  for (let i = 1; i < list.length; i++) {
    let diff = list[i] - list[i - 1];

    if (!again) {
      if (diff >= 0) {
        res &= true;
      } else {
        res &= true;
        again = true;
      }
    } else {
      res &= diff >= 0;
    }
  }
  return res && again || list.length < 3;
});

rhythms.set("dec2", function (list) {
  let res = true;
  let again = false;
  for (let i = 1; i < list.length; i++) {
    let diff = list[i] - list[i - 1];

    if (!again) {
      if (diff <= 0) {
        res &= true;
      } else {
        res &= true;
        again = true;
      }
    } else {
      res &= diff <= 0;
    }
  }
  return res && again || list.length < 3;
});

rhythms.set("any", function () {
  return true;
});

let melody;
let melodyPlaySchedule;

class Melody {
  constructor(repeat, complexity, uniformity, rhythm, skew) {
    this.repeat = repeat;
    this.complexity = complexity;
    this.uniformity = uniformity;
    this.rhythm = rhythm;
    this.skew = skew;

    this.notes = [];
  }

  generateNotes() {
    let melo = [];

    let lengthRange = new NumRange(Math.max(1 / 8, 1 / this.complexity * this.uniformity), Math.min(1, 1 / this.complexity * (1 + (1 - this.uniformity))));

    lengthRange.min = Math.floor(lengthRange.min * 16) / 16;
    lengthRange.max = Math.ceil(lengthRange.max * 16) / 16;

    let validLengths = [];

    for (let l = 1 / 16; l <= lengthRange.max; l += 1 / 16) {
      if (l >= lengthRange.min) {
        validLengths.push(l);
      }
    }

    let lengthCombos = sums([], validLengths, this.complexity, 1);

    let curRhythm = [...rhythms.keys()][Math.round(lerp(0, rhythms.size - 1, this.rhythm))];

    lengthCombos = lengthCombos.filter((c) => rhythms.get(curRhythm)(c));

    lengthCombos[Math.floor((lengthCombos.length - 1) * this.skew)].forEach((l) => melo.push(new Note(0, l)));


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

function setSkew(skw) {
  melody.skew = parseFloat(skw);
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

  melody = new Melody(1, 4, 0.6, 0.2, 0.5);
  ShowMelody();

  readyStates.readyUp("melo");
}