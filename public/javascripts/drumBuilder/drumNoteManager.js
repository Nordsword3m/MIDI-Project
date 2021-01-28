function DrumNoteManager() {
}

class Cache {
  constructor(data) {
    this.patts = data ? data : {};
  }

  setNewMin(min, max, beat, data) {
    this.patts[min] = {};
    this.setNewMax(min, max, beat, data);
  }

  setNewMax(min, max, beat, data) {
    this.patts[min][max] = {};
    this.patts[min][max][beat] = data;
  }

  setData(min, max, beat, data) {
    if (!this.patts.hasOwnProperty(min)) {
      this.setNewMin(min, max, beat, data);
    } else if (!this.patts[min].hasOwnProperty(max)) {
      this.setNewMax(min, max, beat, data);
    } else {
      this.patts[min][max][beat] = data;
    }
  }

  getData(min, max, beat) {
    return this.patts[min][max][beat];
  }

  getBeatAmount() {
    let min = Object.keys(this.patts)[0];
    let max = Object.keys(this.patts[min])[0];
    return min && max ? Object.keys(this.patts[min][max]).length : 0;
  }
}


class PatternInfo {
  constructor(frequency, complexity) {
    this.frequency = frequency;
    this.complexity = complexity;
  }
}


DrumNoteManager.prototype.CacheBeatPatterns = function (beats, patternSizeRange) {
  let cachedPatterns = new Cache();
  //Analyse source beats
  for (let maxItt = patternSizeRange.min; maxItt <= patternSizeRange.max; maxItt++) {
    let max = Math.pow(2, maxItt);
    for (let minItt = patternSizeRange.min; minItt <= maxItt; minItt++) {
      let min = Math.pow(2, minItt);

      for (let beat = 0; beat < beats.length; beat++) {

        let emptySect = "0".repeat(min);
        let beatPatts = {};

        for (let i = 0; i < 256; i += min) {
          beatPatts[i] = {};
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
                beatPatts[div][patt] = new PatternInfo(1, (patt.match(/1/g) || []).length / patt.length);
              }
            }
          }
        }
        cachedPatterns.setData(min, max, beat, beatPatts);
      }
    }
  }
  return cachedPatterns.patts;
};

class PatternContainer {
  constructor(minPatternSize) {
    this.divs = {};

    for (let i = 0; i < 256; i += minPatternSize) {
      this.divs[i] = {};
    }
  }

  getDiv(d) {
    return this.divs[d];
  };

  setDiv(d, data) {
    return this.divs[d] = data;
  };
}

function getEntries(obj) {
  return Object.keys(obj).map((key) => [key, obj[key]]);
}

DrumNoteManager.prototype.RetreivePatterns = function (
  cachedPatterns,
  seed,
  maxPatternSize,
  minPatternSize,
  maxPatternRelFrequency
) {
  minPatternSize = Math.pow(2, minPatternSize);
  maxPatternSize = Math.pow(2, maxPatternSize);

  cachedPatterns = new Cache(cachedPatterns);

  const beatAmount = cachedPatterns.getBeatAmount();

  //Seed variables
  const scanRange =
    seed.length > 0
      ? Math.ceil(beatAmount * (parseInt(seed.charAt(0)) * 0.2 + 0.3))
      : beatAmount;

  const scanStart =
    seed.length > 1
      ? Math.ceil(parseInt(seed.charAt(1)) * 0.1 * beatAmount)
      : 0;

  const scanSkip = seed.length > 2 ? parseInt(seed.charAt(2)) + 1 : 1;

  //Pattern variables
  let patterns = new PatternContainer(minPatternSize);

  let endCap = 256 - minPatternSize;

  //Analyse source beats
  for (let beatPos = 0; beatPos < scanRange; beatPos++) {
    let beat = (beatPos * scanSkip + scanStart) % beatAmount; //Complex beat picking for seeds
    let beatPatts = cachedPatterns.getData(minPatternSize, maxPatternSize, beat);
    for (let div = 0; div <= endCap; div += minPatternSize) {
      let patts = getEntries(beatPatts[div]);
      for (let p = 0; p < patts.length; p++) {
        let pattInfo = patterns.getDiv(div)[patts[p][0]];
        patterns.getDiv(div)[patts[p][0]] = new PatternInfo(!pattInfo ? 1 : pattInfo.frequency + 1, patts[p][1].complexity);
      }
    }
  }

//Fix values
  for (let i = 0; i <= endCap; i += minPatternSize) {
    if (Object.keys(patterns.getDiv(i)).length > 0) {
      let pArr = getEntries(patterns.getDiv(i)).sort((a, b) => a[1].frequency - b[1].frequency);
      let maxCalcFreq = maxPatternRelFrequency * Math.sqrt(pArr[pArr.length - 1][1].frequency);
      pArr = pArr.filter((a) => Math.sqrt(a[1].frequency) >= maxCalcFreq);
      let min = 1, max = 0;

      pArr.forEach((x) => {
        min = Math.min(x[1].complexity, min);
        max = Math.max(x[1].complexity, max);
      });

      let info = new PatternListInfo(pArr, new NumRange(min, max));
      patterns.setDiv(i, info);
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

DrumNoteManager.prototype.CalculateNotes = function (patterns, relMaxComplexity, clone) {
  let noteArr = new Array(clone ? 128 : 256).fill(0);


  for (let i = 0; i < noteArr.length; i++) {
    let divPatts = patterns.getDiv(i);
    //console.log(divPatts);
    if (divPatts && Object.keys(divPatts).length > 0) {
      let maxComplexity = lerp(divPatts.complexityRange.min, divPatts.complexityRange.max, relMaxComplexity);

      let patt = "";
      for (let p = 0; p < divPatts.patterns.length; p++) {
        patt = divPatts.patterns[p][0];

        if (divPatts.patterns[p][1].complexity <= maxComplexity) {
          for (let n = 0; n < patt.length; n++) {
            if (i + n === noteArr.length) {
              break;
            }
            noteArr[i + n] = parseInt(patt.charAt(n));
          }
          break;
        }
      }
      i += patt.length - 1;
    }
  }

  if (clone) {
    noteArr = noteArr.concat(noteArr);
  }

  return noteArr;
};

DrumNoteManager.prototype.CalculatePerc = function (optn1Bars, optn1Pos, optn2Bars, optn2Pos) {
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

DrumNoteManager.prototype.CalculateSnare = function (pattern) {
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
