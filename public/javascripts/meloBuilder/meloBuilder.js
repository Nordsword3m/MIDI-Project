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
  constructor(repeat, complexity, uniformity, rhythm, skew, variation, simplify, polarity) {
    this.repeat = repeat;
    this.complexity = complexity;
    this.uniformity = uniformity;
    this.rhythm = rhythm;
    this.skew = skew;
    this.variation = variation;
    this.simplify = simplify;
    this.polarity = polarity;

    this.notes = [];
  }

  generateNotes() {
    let melo = [];

    let lengthRange = new NumRange(
      lerp(1 / 8, 1 / this.complexity, this.uniformity),
      lerp(1, 1 / this.complexity, this.uniformity)
    );

    lengthRange.min = Math.floor(lengthRange.min * 16) / 16;
    lengthRange.max = Math.ceil(lengthRange.max * 16) / 16;

    let validLengths = [];

    for (let l = 1 / 16; l <= lengthRange.max; l += 1 / 16) {
      if (l >= lengthRange.min) {
        validLengths.push(l);
      }
    }

    let curBar = [];

    let lengthCombos = sums([], validLengths, this.complexity, 1);

    let curRhythm = [...rhythms.keys()][Math.round(lerp(0, rhythms.size - 1, this.rhythm))];

    lengthCombos = lengthCombos.filter((c) => rhythms.get(curRhythm)(c));
    lengthCombos[Math.floor((lengthCombos.length - 1) * this.skew)].forEach((l) => curBar.push(new Note(0, l)));

    function generateDecompPatterns(curList, length) {
      let results = [];

      if (curList.length === length) {
        results.push(curList);
      } else if (curList.length < length) {
        generateDecompPatterns(curList.concat(-1), length).forEach((x) => results.push(x));
        generateDecompPatterns(curList.concat(0), length).forEach((x) => results.push(x));
        generateDecompPatterns(curList.concat(1), length).forEach((x) => results.push(x));
      }

      return results;
    }

    let patternLength = Math.pow(2, 3 - this.repeat);

    let decompPatterns = generateDecompPatterns([0], patternLength).filter((p) => !isRepeat(p));

    let minVariation = getVariation(decompPatterns[0]);
    let maxVariation = getVariation(decompPatterns[0]);

    decompPatterns.forEach((p) => {
      let v = getVariation(p);
      if (v < minVariation) {
        minVariation = v;
      } else if (v > maxVariation) {
        maxVariation = v;
      }
    });

    let chosenVariation = Math.round(lerp(minVariation, maxVariation, this.variation));

    decompPatterns = decompPatterns.filter((p) => getVariation(p) === chosenVariation);

    decompPatterns = decompPatterns.filter((p) => {
      let varitot = p.reduce((x, c) => x + c);

      return varitot > -this.complexity && varitot < 8 - this.complexity;
    });


    let variationTotals = [...new Set(decompPatterns.map((p) => p.reduce((x, c) => x + c)))];
    let chosenVariationTotal = variationTotals[Math.round(lerp(variationTotals.length - 1, 0, this.simplify))];

    decompPatterns = decompPatterns.filter((p) => p.reduce((x, c) => x + c) === chosenVariationTotal);
    let decompPattern = decompPatterns[Math.floor(lerp(0, decompPatterns.length - 1, this.polarity))];

    for (let b = 0; b < patternLength; b++) {
      curBar = decomposeBar(curBar, decompPattern[b]);
      curBar.forEach((n) => melo.push(new Note(0, n.length, false, n.isRest)));
    }

    for (let i = 0; i < this.repeat; i++) {
      melo = melo.concat(melo);
    }

    this.notes = melo;
  }
}

function getVariation(pattern) {
  let totvar = 0;
  pattern.forEach((x) => totvar += x !== 0 ? 1 : 0);
  return totvar;
}

function isRepeat(pattern) {
  let repeat = true;

  for (let i = 0; i < pattern.length / 2; i++) {
    repeat &&= pattern[i + pattern.length / 2] === pattern[i];
  }

  return repeat;
}

function decomposeBar(bar, degree) {
  let result = [];
  if (degree === 0) {
    result = bar;
  } else if (degree < 0) {
    let validJoins = [];
    for (let i = 0; i < bar.length - 1; i++) {
      validJoins.push(i);
    }

    validJoins = validJoins.sort((a, b) => {
      let aDiff = Math.pow(bar[a].length - bar[a + 1].length, 2);
      let bDiff = Math.pow(bar[b].length - bar[b + 1].length, 2);

      return (aDiff * (bar[a].length + bar[a + 1].length) / 2) - (bDiff * (bar[b].length + bar[b + 1].length) / 2);
    });

    for (let i = 0; i < bar.length; i++) {
      if (i === validJoins[0]) {
        result.push(combineNotes(bar[i], bar[i + 1]));
        i++;
      } else {
        result.push(bar[i]);
      }
    }
  } else {
    let validSplits = [];
    for (let i = 0; i < bar.length - 1; i++) {
      if (bar[i].length >= 0.25) {
        validSplits.push(i);
      }
    }

    validSplits = validSplits.sort((a, b) => bar[b].length - bar[a].length);

    for (let i = 0; i < bar.length; i++) {
      if (i === validSplits[0]) {
        let newNotes = splitNote(bar[i]);
        result.push(newNotes[0]);
        result.push(newNotes[1]);
      } else {
        result.push(bar[i]);
      }
    }
  }

  return result;
}

function splitNote(n) {
  return [new Note(n.num, n.length / 2), new Note(n.num, n.length / 2)];
}

function combineNotes(n1, n2) {
  return new Note(n1.num, n1.length + n2.length);
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

function setVariation(vri) {
  melody.variation = parseFloat(vri);
  ShowMelody();
}

function setSimplify(smp) {
  melody.simplify = parseFloat(smp);
  ShowMelody();
}

function setPolarity(pol) {
  melody.polarity = parseFloat(pol);
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

  melody = new Melody(1, 4, 0.6, 0.2, 0.5, 0.5, 0.5, 0.5);
  ShowMelody();

  readyStates.readyUp("melo");
}