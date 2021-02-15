let arrangement;

class Arrangement {
  constructor() {

    this.arr = {
      chords: [],
      melo: [],
      bass: [],
      kick: [],
      snare: [],
      ch: [],
      perc: []
    };

    this.setArrangement();
  }

  getLength() {
    return Object.values(this.arr).map(x => x.length).reduce((x, p) => Math.max(p, x));
  }

  setArrangement() {
    let intro = [["chords"], ["chords", "ch"]];

    let chorus = [["chords", "melo", "bass", "kick", "snare", "ch", "perc"],
      ["chords", "melo", "bass", "kick", "snare", "ch", "perc"]];

    let v1 = [["chords", "bass", "kick", "snare", "ch"],
      ["chords", "bass", "kick", "snare", "ch", "perc"]];

    let v2 = [["chords", "melo", "bass", "kick"],
      ["chords", "melo", "bass", "kick", "ch"]];

    let outro = [["chords", "bass", "kick", "ch"],
      ["chords", "ch"]];

    let sectionOrder = [intro, chorus, v1, chorus, v2, chorus, chorus, outro];

    let pattPos = 0;

    for (let s = 0; s < sectionOrder.length; s++) {
      for (let p = 0; p < sectionOrder[s].length; p++) {
        for (let inst = 0; inst < sectionOrder[s][p].length; inst++) {
          this.arr[sectionOrder[s][p][inst]][pattPos] = true;
        }

        pattPos++;
      }
    }
  }
}

function playArrangementFromClick(e) {
  pm.curPatt = Math.floor((e.layerX / e.target.offsetWidth) / (1 / arrangement.getLength()));
  
  pm.TogglePlaying(
    (((e.layerX / e.target.offsetWidth) % (1 / arrangement.getLength())) / (1 / arrangement.getLength())),
    true
  ).then();
}

async function loadArranger() {
  arrangement = new Arrangement();

  await readyStates.waitFor("demLoad");

  getById("arrangerPlayHeadCon").addEventListener("click", playArrangementFromClick);


  dem.PlaceArrangement(arrangement);
}