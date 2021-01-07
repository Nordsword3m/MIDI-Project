function NoteManager() {}

// Step constants
const barLength = 1 / 8;
const noteLength = 1 / 32;
const stepLength = 1 / 256;

//const maxPatternSize = 256;
//const minPatternSize = 64;
const absoluteMaxPatternRelFrequency = 0.6;

class PatternData {
  constructor(pattern, frequency) {
    this.pattern = pattern;
    this.frequency = frequency;
  }
}

class PatternMap {
  constructor() {
    this.map = [];
    this.pattHash = new Map();
  }

  rehash() {
    this.pattHash = new Map();
    for (let i = 0; i < this.map.length; i++) {
      this.pattHash.set(this.map[i].pattern, i);
    }
  }

  filterFreq(max) {
    this.map.filter((a) => a.frequency <= max);
    this.rehash();
  }

  sortByFreq() {
    this.map.sort((a, b) => b.frequency - a.frequency);
    this.rehash();
  }

  new(patt) {
    let existing = this.pattHash.get(patt);
    if (!existing) {
      this.map.push(new PatternData(patt, 1));
      this.pattHash.set(patt, this.map.length - 1);
    } else {
      this.map[existing].frequency++;
    }
  }
}

NoteManager.prototype.GeneratePatterns = function (
  beats,
  seed,
  maxPatternSize,
  minPatternSize,
  maxPatternRelFrequency
) {
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
  let patterns = new Array(256);

  for (let i = 0; i < 256; i++) {
    patterns[i] = new PatternMap();
  }

  //Analyse source beats
  for (let beatPos = 0; beatPos < scanRange; beatPos++) {
    let beat = (beatPos * scanSkip + scanStart) % beats.length; //Complex beat picking for seeds

    //Each beat
    for (let div = 0; div < 256; div += minPatternSize) {
      //Each div
      //Pattern search
      if (beats[beat][div] > 0) {
        if (div + minPatternSize <= 256) {
          let patt = "";
          for (
            let i = div;
            i < Math.min(div + maxPatternSize, 256);
            i += minPatternSize
          ) {
            patt +=
              (patt.length === 0 ? "" : ",") +
              beats[beat].slice(i, i + minPatternSize).join();
            if (!patt.endsWith("0,".repeat(minPatternSize - 1) + "0")) {
              patterns[div].new(patt);
            }
          }
        }
      }
    }
  }

  //Fix values
  for (let i = 0; i < 256; i++) {
    if (i % minPatternSize === 0) {
      patterns[i].sortByFreq();
      patterns[i].filterFreq(
        scanRange * maxPatternRelFrequency * absoluteMaxPatternRelFrequency
      );
    }
  }

  console.log(patterns);

  return patterns;
};

NoteManager.prototype.CalculateNotes = function (patterns) {
  let noteArr = new Array(256).fill(0);

  for (let i = 0; i < 256; i++) {
    if (patterns[i] && patterns[i][0]) {
      let patt = patterns[i][0][0].split(",");
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
