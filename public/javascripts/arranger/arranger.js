let arrangement;
let grabbing;
let origSect;
let floatSect;

let grabStartX;

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

function grabSection(e) {
  grabbing = true;
  origSect = e.target;
  grabStartX = e.clientX - origSect.offsetLeft;

  origSect.classList.remove("songSection");
  origSect.classList.add("hiddenSect");

  floatSect = document.createElement("div");
  floatSect.className = "floatSect";
  floatSect.style.left = "calc(" + (e.clientX - grabStartX) + "px)";
  floatSect.innerText = origSect.innerText;


  getById("timeLine").appendChild(floatSect);
}

function releaseSection(e) {
  if (grabbing) {
    grabbing = false;

    origSect.classList.add("songSection");
    origSect.classList.remove("hiddenSect");

    floatSect.remove();
  }
}

function dragSection(e) {
  if (grabbing) {
    floatSect.style.left = "calc(" + Math.min(getById("timeLine").offsetWidth - floatSect.offsetWidth, Math.max(0, (e.clientX - grabStartX))) + "px)";
  }
}

async function loadArranger() {
  arrangement = new Arrangement();

  await readyStates.waitFor("demLoad");

  getById("arrangerPlayHeadCon").addEventListener("click", playArrangementFromClick);

  let sectObjs = getByClass("songSection");

  for (let i = 0; i < sectObjs.length; i++) {
    sectObjs[i].addEventListener("mousedown", grabSection);
  }

  window.addEventListener("mousemove", dragSection);
  window.addEventListener("mouseup", releaseSection);


  dem.PlaceArrangement(arrangement);
}