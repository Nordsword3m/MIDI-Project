const print = console.log;
const mh = require("./MidiHandling")

module.exports = {GenerateModel}

class BeatModel {
    constructor(positional, articulation, ancestralProbability) {
        this.positional = positional;
        this.articulation = articulation;
        this.ancestralProbability = ancestralProbability;
    }
}

function GenerateModel(beats){
    //Initialise working variables

    let positional = new Array(Math.round(mh.bars * 4 / mh.divs)).fill(0);
    let articulation = new Array(Math.round(mh.bars * 4 / mh.divs)).fill([]);
    let ancestralProbability = new Array(Math.round(mh.bars * 4 / mh.divs)).fill([]);

    for (let div = 0; div < ancestralProbability.length; div++){
        ancestralProbability[div] = new Array(div).fill(0);
    }

    //Analyse source beats
    for(let beat = 0; beat < beats.length; beat++){ //Each beat
        for(let div = 0; div < Math.round(mh.bars * 4 / mh.divs); div++){ //Each div
            //Ancestral
            for(let i = 0; i < div; i++){
                if(beats[beat][i] > 0){
                    if(beats[beat][div] > 0){
                        ancestralProbability[div][i]++;
                    } else {
                        ancestralProbability[div][i]--;
                    }
                }
            }

            if(beats[beat][div] > 0){
                positional[div]++;

                //Articulation
                let found = false;
                for(let n = 0; n < articulation[div]; n++){
                    if(articulation[n][0] == beats[beat][div]){
                        articulation[n][1]++;
                        found=true;
                        break;
                    }
                }
                if(!found){
                    articulation[div]=([beats[beat][div], 1]);
                }
            }
        }
    }

    //Fix values
    for(let div = 0; div < positional.length; div++){
        positional[div] /= beats.length;

        for(let i = 0; i < div; i++){
            ancestralProbability[div][i] /= beats.length;
        }

        articulation[div].sort(function (a,b){
            return a[1] - b[1];
        });
    }

    return new BeatModel(positional,articulation,ancestralProbability);
}


