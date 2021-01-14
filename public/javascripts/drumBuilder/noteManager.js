function NoteManager() {
}

// Step constants
const barLength = 1 / 8;
const noteLength = 1 / 32;
const stepLength = 1 / 256;


class NumRange {
  constructor(min, max) {
    this.min = min;
    this.max = max;
  }
}

class Cache {
  constructor() {
    this.patts = new Map();
  }

  setNewId(id, min, max, beat, data) {
    this.patts.set(id, new Map());
    this.setNewMin(id, min, max, beat, data);
  }

  setNewMin(id, min, max, beat, data) {
    this.patts.get(id).set(min, new Map());
    this.setNewMax(id, min, max, beat, data);
  }

  setNewMax(id, min, max, beat, data) {
    this.patts.get(id).get(min).set(max, new Map());
    this.patts.get(id).get(min).get(max).set(beat, data);
  }

  set(id, min, max, beat, data) {
    if (!this.patts.has(id)) {
      this.setNewId(id, min, max, beat, data);
    } else if (!this.patts.get(id).has(min)) {
      this.setNewMin(id, min, max, beat, data);
    } else if (!this.patts.get(id).get(min).has(max)) {
      this.setNewMax(id, min, max, beat, data);
    } else {
      this.patts.get(id).get(min).get(max).set(beat, data);
    }
  }

  get(id, min, max, beat) {
    return this.patts.get(id).get(min).get(max).get(beat);
  }
}

class PatternInfo {
  constructor(frequency, complexity) {
    this.frequency = frequency;
    this.complexity = complexity;
  }
}

let cachedPatterns = new Cache();

NoteManager.prototype.CacheBeatPatterns = function (id, beats, patternSizeRange) {
  //Analyse source beats
  for (let maxItt = patternSizeRange.min; maxItt <= patternSizeRange.max; maxItt++) {
    let max = Math.pow(2, maxItt);
    for (let minItt = patternSizeRange.min; minItt <= maxItt; minItt++) {
      let min = Math.pow(2, minItt);

      for (let beat = 0; beat < beats.length; beat++) {

        let emptySect = "0".repeat(min);
        let beatPatts = new Map();

        for (let i = 0; i < 256; i += min) {
          beatPatts.set(i, new Map());
        }

        //Each beat
        for (let div = 0; div <= 256 - min; div += min) {
          //Each div
          //Pattern search
          if (beats[beat][div] > 0) {
            let patt = "";
            for (
              let i = div, len = Math.min(div + max, 256);
              i < len;
              i += min
            ) {
              patt += beats[beat].slice(i, i + min).join('');
              if (patt.endsWith(emptySect) === false) {
                let pattInfo = beatPatts.get(div).get(patt);
                beatPatts.get(div).set(patt, new PatternInfo(1, (patt.match(/1/g) || []).length / patt.length));
              }
            }
          }
        }
        cachedPatterns.set(id, min, max, beat, beatPatts);
      }
    }
  }
};

class PatternContainer {
  constructor(minPatternSize) {
    this.divs = new Map();

    for (let i = 0; i < 256; i += minPatternSize) {
      this.divs.set(i, new Map());
    }
  }

  getDiv(d) {
    return this.divs.get(d);
  };

  setDiv(d, data) {
    return this.divs.set(d, data);
  };
}

NoteManager.prototype.GeneratePatterns = function (
  id,
  beats,
  seed,
  maxPatternSize,
  minPatternSize,
  maxPatternRelFrequency
) {
  minPatternSize = Math.pow(2, minPatternSize);
  maxPatternSize = Math.pow(2, maxPatternSize);
  //Seed variables
  const scanRange =
    seed.length > 0
      ? Math.ceil(beats.length * (parseInt(seed.charAt(0)) * 0.2 + 0.3))
      : beats.length;

  const scanStart =
    seed.length > 1
      ? Math.ceil(parseInt(seed.charAt(1)) * 0.1 * beats.length)
      : 0;

  const scanSkip = seed.length > 2 ? parseInt(seed.charAt(2)) + 1 : 1;

  //Pattern variables
  let patterns = new PatternContainer(minPatternSize);

  let endCap = 256 - minPatternSize;

  //Analyse source beats
  for (let beatPos = 0; beatPos < scanRange; beatPos++) {
    let beat = (beatPos * scanSkip + scanStart) % beats.length; //Complex beat picking for seeds
    let beatPatts = cachedPatterns.get(id, minPatternSize, maxPatternSize, beat);
    for (let div = 0; div <= endCap; div += minPatternSize) {
      let patts = [...beatPatts.get(div).entries()];
      for (let p = 0; p < patts.length; p++) {
        let pattInfo = patterns.getDiv(div).get(patts[p][0]);
        patterns.getDiv(div).set(patts[p][0], new PatternInfo(!pattInfo ? 1 : pattInfo.frequency + 1, patts[p][1].complexity));
      }
    }
  }

//Fix values
  for (let i = 0; i <= endCap; i += minPatternSize) {
    if (patterns.getDiv(i).size > 0) {
      let pArr = [...patterns.getDiv(i).entries()].sort((a, b) => a[1].frequency - b[1].frequency);
      let maxCalcFreq = maxPatternRelFrequency * Math.sqrt(pArr[pArr.length - 1][1].frequency);
      pArr = pArr.filter((a) => Math.sqrt(a[1].frequency) >= maxCalcFreq);
      let min = 1, max = 0;

      pArr.forEach((x) => {
        min = Math.min(x[1].complexity, min);
        max = Math.max(x[1].complexity, max);
      });

      patterns.setDiv(i, new PatternListInfo(pArr, new NumRange(min, max)));
    }
  }

  //console.log(patterns);
  return patterns;
};

class PatternListInfo {
  constructor(patterns, complexityRange) {
    this.patterns = patterns;
    this.complexityRange = complexityRange;
  }
}

NoteManager.prototype.CalculateNotes = function (patterns, relMaxComplexity) {
  let noteArr = new Array(256).fill(0);

  for (let i = 0; i < 256; i++) {
    let divPatts = patterns.getDiv(i);
    if (divPatts && divPatts.patterns) {
      let maxComplexity = lerp(divPatts.complexityRange.min, divPatts.complexityRange.max, relMaxComplexity);

      let patt = "";
      for (let p = 0; p < divPatts.patterns.length; p++) {
        patt = divPatts.patterns[p][0];

        if (divPatts.patterns[p][1].complexity <= maxComplexity) {
          for (let n = 0; n < patt.length; n++) {
            noteArr[i + n] = parseInt(patt.charAt(n));
          }
          break;
        }
      }
      i += patt.length - 1;
    }
  }
  return noteArr;
};

NoteManager.prototype.CalculatePerc = function (optn1Bars, optn1Pos, optn2Bars, optn2Pos) {
  let noteArr = new Array(256).fill(0);
  for (let i = 0; i < 256; i++) {
    let notePos = i % (256 * barLength);
    let curBar = Math.floor(i / (256 * barLength));

    if (optn1Bars[curBar] && notePos === optn1Pos) {
      noteArr[i] = 60;
    }

    if (optn2Bars[curBar] && notePos === optn2Pos) {
      noteArr[i] = 60;
    }
  }

  return noteArr;
};

function toRegion(pos) {
  return Math.floor(pos / (256 / 8));
}

NoteManager.prototype.CalculateSnare = function (pattern) {
  let noteArr = new Array(256).fill(0);

  for (let i = 0; i < 256; i++) {
    if ((i / (256 * noteLength)) % 1 === 0) {
      if ((i / (256 * barLength)) % 1 !== 0) {
        let notePos = i * barLength;

        if (pattern === "3" && notePos % 4 === 2) {
          noteArr[i] = 60;
        } else if (
          pattern === "2and4" &&
          (notePos % 4 === 1 || notePos % 4 === 3)
        ) {
          noteArr[i] = 60;
        }
      }
    }
  }
  return noteArr;
};
