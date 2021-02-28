function getCOM(arr) {
  let mass = arr.filter(x => x).length;

  let acc = 0;

  if (mass === 0) {
    return arr.length / 2;
  } else if ((mass / 2) % 1 === 0) {
    let lower = undefined;
    let higher = undefined;

    for (let i = 0; i < arr.length; i++) {
      acc += arr[i] ? 1 : 0;

      if (lower === undefined && acc === mass / 2) {
        lower = i;
      } else if (higher === undefined && acc === (mass / 2) + 1) {
        higher = i;
      }
    }

    return (lower + higher) / 2;
  } else {
    for (let i = 0; i < arr.length; i++) {
      acc += arr[i] ? 1 : 0;

      if (acc > mass / 2) {
        return i;
      }
    }
  }
}

function getElementStrengths(arr) {
  return arr.map((v, i, a) => {
    let dist = 0;

    if (i === 0) {
      while (a[i + dist + 1] === v) {
        dist++;
      }
    } else if (i === a.length - 1) {
      while (a[i - (dist + 1)] === v) {
        dist++;
      }
    } else {
      let lDist = 0;
      let rDist = 0;

      while (a[i + rDist + 1] === v) {
        rDist++;
      }

      while (a[i - (lDist + 1)] === v) {
        lDist++;
      }

      dist = lDist + rDist > 0 ? Math.min(lDist, rDist) + 1 : 0;
    }
    return [i, dist];
  });
}

function lerpBinary(start, end, t) {
  let alignCompareStart = [];
  let alignCompareEnd = [];

  for (let i = 0; i < start.length; i++) {
    if (start[i] !== end[i]) {
      alignCompareStart.push(start[i]);
      alignCompareEnd.push(end[i]);
    }
  }

  let newCOM = Math.round(2 * lerp(getCOM(alignCompareStart), getCOM(alignCompareEnd), t)) / 2;

  let indexStrengths = getElementStrengths(alignCompareStart);

  let indexStrengthLeft = indexStrengths.slice(0, Math.floor(newCOM)).sort((a, b) => a[1] - b[1]);
  let indexStrengthRight = indexStrengths.slice(Math.ceil(newCOM), indexStrengths.length).sort((a, b) => a[1] - b[1]);

  let numOfFlips = Math.round(Math.min(indexStrengthLeft.length, indexStrengthRight.length) * t);

  let newLerp = alignCompareStart.map(x => x);

  if (newCOM % 1 === 0) {
    newLerp[newCOM] = true;
  }

  for (let i = 0; i < numOfFlips; i++) {
    newLerp[indexStrengthLeft[i][0]] = !alignCompareStart[indexStrengthLeft[i][0]];
    newLerp[indexStrengthRight[i][0]] = !alignCompareStart[indexStrengthRight[i][0]];
  }

  let result = [];

  let lerpAcc = 0;
  for (let i = 0; i < start.length; i++) {
    if (start[i] !== end[i]) {
      result[i] = newLerp[lerpAcc];
      lerpAcc++;
    } else {
      result[i] = start[i];
    }
  }

  return result;
}

class BassLine {
  constructor(type, intensity, energyRamp, jumpiness, eraticity, flip) {
    this.type = type;
    this.intensity = intensity;
    this.energyRamp = energyRamp;
    this.jumpiness = jumpiness;
    this.eraticity = eraticity;
    this.flip = flip;
    this.notes = [];
  }

  generateNotes() {
    let roots = progression.chords.map((c) => c[0]);
    let aligned = [];
    let bassRanges = [];

    // Align bass notes
    let kickAligner = kickNoteArr.map(x => x > 0);
    let regAligner = new Array(256).fill(false).map((v, i) => i % 8 === 0);

    let rootAcc = 0;
    for (let i = 0; i < roots.length; i++) {
      let aligner = lerpBinary(regAligner.slice(rootAcc, rootAcc + roots[i].length * 32)
        , kickAligner.slice(rootAcc, rootAcc + roots[i].length * 32)
        , this.eraticity);

      for (let a = 0; a < aligner.length; a++) {
        if (aligner[a]) {
          aligned[rootAcc + a] = new Note(roots[i].num + 12, 0.125);
        }
      }

      bassRanges.push(rootAcc, rootAcc + roots[i].length * 32);
      rootAcc += roots[i].length * 32;
    }

    this.notes = aligned;

    let lastNotePos = 0;
    for (let i = 1; i < 256; i++) {
      let trueIntensity = this.intensity * 0.875;
      trueIntensity += (i < 128 && i >= 96) || i >= 192 ? this.energyRamp : 0;
      trueIntensity += i >= 224 ? this.energyRamp : 0;


      if (this.notes[i]) {
        if (this.notes[i].num === this.notes[lastNotePos].num) {
          if ((i - lastNotePos) / 32 < (1 - Math.min(trueIntensity, 0.875))) {
            this.notes[i] = undefined;
          } else {
            lastNotePos = i;
          }
        } else {
          lastNotePos = i;
        }
      }
    }

    let nextNote = 255;
    for (let i = 255; i >= 0; i--) {
      if (this.notes[i]) {
        this.notes[i].length = (nextNote - i) / 32;
        nextNote = i;
      }
    }

    /*
        // Octave jumping
        let prevNoteChangeDir = 0;
        let bLineOrigin = JSON.parse(JSON.stringify(bLine));
        let jmpPos = 0;

        for (let n = 0; n < bLineOrigin.length; n++) {
          if (n > 0) {
            if (bLineOrigin[n].num !== bLineOrigin[n - 1].num) {
              prevNoteChangeDir = bLineOrigin[n].num - bLineOrigin[n - 1].num;
            }
          }

          let jumpDir = Math.sign(this.jumpiness);
          let trueJumpiness = Math.abs(this.jumpiness);

          if ((jmpPos % 4) / 4 >= 1 - trueJumpiness) {
            if (bLineOrigin[n].length < 1 / 4) {
              if (prevNoteChangeDir * jumpDir * (this.flip && jmpPos >= 4 ? -1 : 1) <= 0) {
                bLine[n].num += 7;
                if (bLine[n - 1].num === bLine[n].num
                ) {
                  bLine[n - 1].num += 5;
                }
              } else {
                bLine[n].num -= 5;
                if (bLine[n - 1].num === bLine[n].num) {
                  bLine[n - 1].num += 5 - prevNoteChangeDir;
                }
              }
            }
          }
          jmpPos += bLineOrigin[n].length;
        }

        this.notes = bLine;*/
  }
}

function combineNotes(n1, n2) {
  return new Note(n1.num, n1.length + n2.length);
}