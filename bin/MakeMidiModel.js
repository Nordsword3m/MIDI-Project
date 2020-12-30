const mh = require("./MidiHandling");

module.exports = { GenerateModel };

class BeatModel {
  constructor(positional, ancestralProbability) {
    this.positional = positional;
    this.ancestralProbability = ancestralProbability;
  }
}

function GenerateModel(beats) {
  //Initialise working variables

  let positional = new Array(Math.round((mh.bars * 4) / mh.divs)).fill(0);
  let ancestralProbability = new Array(
    Math.round((mh.bars * 4) / mh.divs)
  ).fill([]);

  for (let div = 0; div < ancestralProbability.length; div++) {
    ancestralProbability[div] = new Array(div).fill(0);
  }

  //Analyse source beats
  for (let beat = 0; beat < beats.length; beat++) {
    //Each beat
    for (let div = 0; div < Math.round((mh.bars * 4) / mh.divs); div++) {
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
    positional[div] /= beats.length;

    for (let i = 0; i < div; i++) {
      ancestralProbability[div][i] /= beats.length;
    }
  }

  return new BeatModel(positional, ancestralProbability);
}
