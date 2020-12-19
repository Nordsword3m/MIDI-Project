function NoteManager() {}

// Step constants
const barLength = 1 / 8;
const noteLength = 1 / 32;
const stepLength = 1 / 256;

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

NoteManager.prototype.CalculateCh = function (complexity, ancestral) {
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

    trueValue += (ancestralValue - chModel.positional[i]) * ancestral;

    if (trueValue >= 1 - complexity) {
      noteArr[i] = 60;
    } else {
      noteArr[i] = 0;
    }
  }
  return noteArr;
};

NoteManager.prototype.CalculateKick = function (complexity, ancestral) {
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

    trueValue += (ancestralValue - kickModel.positional[i]) * ancestral;

    if (trueValue >= 1 - complexity) {
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
