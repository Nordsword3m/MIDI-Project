function NoteManager() {}

// Step constants
const barLength = 1 / 8;
const noteLength = 1 / 32;
const stepLength = 1 / 256;

class BeatModel {
  constructor(positional, ancestralProbability) {
    this.positional = positional;
    this.ancestralProbability = ancestralProbability;
  }
}

NoteManager.prototype.GenerateModel = function (beats, seed) {
  //Seed variables
  const scanRange =
    seed.length > 0
      ? Math.ceil(beats.length * (parseInt(seed.charAt(0)) * 0.2 + 0.1))
      : beats.length;

  const scanStart =
    seed.length > 0
      ? Math.ceil(parseInt(seed.charAt(1)) * 0.1 * beats.length)
      : 0;

  const scanSkip = seed.length > 2 ? parseInt(seed.charAt(2)) + 1 : 1;

  //Initialise working variables
  let positional = new Array(256).fill(0);
  let ancestralProbability = new Array(256).fill([]);

  for (let div = 0; div < ancestralProbability.length; div++) {
    ancestralProbability[div] = new Array(div).fill(0);
  }

  //Analyse source beats
  for (let beatPos = 0; beatPos < scanRange; beatPos++) {
    let beat = (beatPos * scanSkip + scanStart) % beats.length;

    //Each beat
    for (let div = 0; div < 256; div++) {
      //Each div
      //Ancestral
      for (let i = 0; i < div; i++) {
        if (beats[beat][i] > 0) {
          if (beats[beat][div] > 0) {
            ancestralProbability[div][i]++;
          } else {
            ancestralProbability[div][i] = Math.max(
              0,
              ancestralProbability[div][i] - 1
            );
          }
        }
      }

      if (beats[beat][div] > 0) {
        positional[div]++;
      }
    }
  }

  //Fix values
  for (let div = 0; div < positional.length; div++) {
    positional[div] /= scanRange;

    for (let i = 0; i < div; i++) {
      ancestralProbability[div][i] /= scanRange;
    }
  }

  return new BeatModel(positional, ancestralProbability);
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

NoteManager.prototype.CalculateCh = function (regions) {
  let noteArr = new Array(256).fill(0);

  for (let i = 0; i < 256; i++) {
    let trueValue = chModel.positional[i];

    let ancestralValue = 0;
    let validAncestors = 0;

    for (let div = 0; div < chModel.ancestralProbability[i].length; div++) {
      if (noteArr[div] > 0) {
        ancestralValue += chModel.ancestralProbability[i][div];
        validAncestors += 1;
      }
    }

    if (validAncestors > 0) {
      ancestralValue /= validAncestors;
    }

    if (i === 0) {
      ancestralValue = chModel.positional[i];
    }

    trueValue +=
      (ancestralValue - chModel.positional[i]) * regions[toRegion(i)].ancestral;

    if (trueValue >= 1 - regions[toRegion(i)].complexity) {
      noteArr[i] = 60;
    } else {
      noteArr[i] = 0;
    }
  }
  return noteArr;
};

NoteManager.prototype.CalculateKick = function (regions) {
  let noteArr = new Array(256).fill(0);

  for (let i = 0; i < 256; i++) {
    let trueValue = kickModel.positional[i];

    let ancestralValue = 0;
    let validAncestors = 0;

    for (let div = 0; div < kickModel.ancestralProbability[i].length; div++) {
      if (noteArr[div] > 0) {
        ancestralValue += kickModel.ancestralProbability[i][div];
        validAncestors += 1;
      }
    }

    if (validAncestors > 0) {
      ancestralValue /= validAncestors;
    }

    if (i === 0) {
      ancestralValue = kickModel.positional[i];
    }

    trueValue +=
      (ancestralValue - kickModel.positional[i]) *
      regions[toRegion(i)].ancestral;

    if (trueValue >= 1 - regions[toRegion(i)].complexity) {
      noteArr[i] = 60;
    } else {
      noteArr[i] = 0;
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
