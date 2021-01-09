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

let cachedPatterns = new Cache();
let cachedSeeds = new Map();

NoteManager.prototype.CacheBeatPatterns = function (id, beats, patternSizeRange) {
  //Analyse source beats
  for (let maxItt = patternSizeRange.min; maxItt <= patternSizeRange.max; maxItt++) {
    let max = Math.pow(2, maxItt);
    for (let minItt = patternSizeRange.min; minItt <= maxItt; minItt++) {
      let min = Math.pow(2, minItt);

      for (let beat = 0; beat < beats.length; beat++) {

        let emptySect = "0,".repeat(min - 1) + "0";
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
              patt +=
                (patt.length === 0 ? "" : ",") +
                beats[beat].slice(i, i + min).join();
              if (patt.endsWith(emptySect) === false) {
                let freq = beatPatts.get(div).get(patt);
                beatPatts.get(div).set(patt, freq === undefined ? 1 : freq + 1);
              }
            }
          }
        }
        cachedPatterns.set(id, min, max, beat, beatPatts);
      }
    }
  }
};

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
      ? Math.ceil(beats.length * (parseInt(seed.charAt(0)) * 0.2 + 0.1))
      : beats.length;

  const scanStart =
    seed.length > 1
      ? Math.ceil(parseInt(seed.charAt(1)) * 0.1 * beats.length)
      : 0;

  const scanSkip = seed.length > 2 ? parseInt(seed.charAt(2)) + 1 : 1;

  //Pattern variables
  let patterns = new Map();

  for (let i = 0; i < 256; i += minPatternSize) {
    patterns.set(i, new Map());
  }

  let endCap = 256 - minPatternSize;

  //Analyse source beats
  for (let beatPos = 0; beatPos < scanRange; beatPos++) {
    let beat = (beatPos * scanSkip + scanStart) % beats.length; //Complex beat picking for seeds
    let beatPatts = cachedPatterns.get(id, minPatternSize, maxPatternSize, beat);
    for (let div = 0; div <= endCap; div += minPatternSize) {
      let patts = [...beatPatts.get(div).entries()];

      for (let p = 0; p < patts.length; p++) {
        let freq = patterns.get(div).get(patts[p][0]);
        patterns.get(div).set(patts[p][0], freq === undefined ? patts[p][1] : freq + patts[p][1]);
      }
    }
  }

  let calcMaxFreq = scanRange * maxPatternRelFrequency;

//Fix values
  for (let i = 0; i <= endCap; i += minPatternSize) {
    patterns.set(
      i,
      [...patterns.get(i).entries()]
      .filter((a) => a[1] <= calcMaxFreq)
      .sort((a, b) => b[1] - a[1])
    );
  }
  return patterns;
};

NoteManager.prototype.CalculateNotes = function (patterns) {
  let noteArr = new Array(256).fill(0);

  for (let i = 0; i < 256; i++) {
    let divPatts = patterns.get(i);
    if (divPatts && divPatts[0]) {
      let patt = divPatts[0][0].split(",");
      for (let p = 0; p < patt.length; p++) {
        noteArr[i + p] = parseInt(patt[p]);
      }
      i += patt.length - 1;
    }
  }
  return noteArr;
};

NoteManager.prototype.CalculatePerc = function (optn1Bars, optn2Bars) {
  let noteArr = new Array(256).fill(0);
  for (let i = 0; i < 256; i++) {
    let notePos = i % (256 * barLength);
    let curBar = Math.floor(i / (256 * barLength));

    if (optn1Bars[curBar] && notePos === 4) {
      noteArr[i] = 60;
    }

    if (optn2Bars[curBar] && notePos === 28) {
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
