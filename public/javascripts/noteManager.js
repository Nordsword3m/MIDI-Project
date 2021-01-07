function NoteManager() {}

// Step constants
const barLength = 1 / 8;
const noteLength = 1 / 32;
const stepLength = 1 / 256;

//const maxPatternSize = 256;
//const minPatternSize = 64;
//const maxPatternRelFrequency = 0.1;

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
  let patterns = new Map();

  for (let i = 0; i < 256; i += minPatternSize) {
    patterns.set(i, new Map());
  }

  //Analyse source beats
  for (let beatPos = 0; beatPos < scanRange; beatPos++) {
    let beat = (beatPos * scanSkip + scanStart) % beats.length; //Complex beat picking for seeds

    //Each beat
    for (let div = 0; div < 256; div++) {
      //Each div
      //Pattern search
      if (div % minPatternSize === 0 && beats[beat][div] > 0) {
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
              if (!patterns.get(div).get(patt)) {
                patterns.get(div).set(patt, 1);
              } else {
                patterns.get(div).set(patt, patterns.get(div).get(patt) + 1);
              }
            }
          }
        }
      }
    }
  }

  //Fix values
  for (let i = 0; i < 256; i += minPatternSize) {
    patterns.set(
      i,
      [...patterns.get(i).entries()]
        .filter((a) => a[1] <= scanRange * maxPatternRelFrequency)
        .sort((a, b) => b[1] - a[1])
    );
  }

  return patterns;
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

NoteManager.prototype.CalculateNotes = function (patterns) {
  let noteArr = new Array(256).fill(0);

  for (let i = 0; i < 256; i++) {
    if (patterns.get(i) && patterns.get(i)[0]) {
      let patt = patterns.get(i)[0][0].split(",");
      for (let p = 0; p < patt.length; p++) {
        noteArr[i + p] = parseInt(patt[p]);
      }
      i += patt.length - 1;
    }
  }
  return noteArr;
};

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
