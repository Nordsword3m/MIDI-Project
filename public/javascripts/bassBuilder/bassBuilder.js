let bassLine;

function toggleBassType() {
  bassLine.type = bassLine.type === "bass" ? "808" : "bass";
  setBassType();
  ShowBassLine();
}

function setBassType() {
  let bassOpts = getByClass("toggleOption");

  if (bassLine.type === "bass") {
    bassOpts[0].classList.add("selected");
    bassOpts[1].classList.remove("selected");
  } else if (bassLine.type === "808") {
    bassOpts[0].classList.remove("selected");
    bassOpts[1].classList.add("selected");
  }
}

function toggleFlip() {
  bassLine.flip = !bassLine.flip;
  getById("flipCheck").getElementsByClassName("checkIcon")[0].classList.toggle("checked");
  ShowBassLine();
}

function setEnergyRamp(en) {
  bassLine.energyRamp = parseFloat(en);
  ShowBassLine();
}

function setIntensity(it) {
  bassLine.intensity = parseFloat(it);
  ShowBassLine();
}

function setJumpiness(jmp) {
  bassLine.jumpiness = parseFloat(jmp);
  ShowBassLine();
}

function setEraticity(ert) {
  bassLine.eraticity = parseFloat(ert);
  ShowBassLine();
}

function generateBassNotes() {
  bassLine.generateNotes();
}

function ShowBassLine() {
  generateBassNotes();

  dem.PlaceBassLine(bassLine.notes);

  saveBassDataValues();
}

function saveBassDataValues() {
  sessionStorage.setItem("bassData", JSON.stringify(bassLine));
}

function loadBassDataValues() {
  getById("intensitySlider").value = bassLine.intensity;
  getById("energyRampSlider").value = bassLine.energyRamp;
  getById("jumpinessSlider").value = bassLine.jumpiness;
  getById("eraticitySlider").value = bassLine.eraticity;

  if (bassLine.flip) {
    getById("flipCheck").getElementsByClassName("checkIcon")[0].classList.add("checked");
  } else {
    getById("flipCheck").getElementsByClassName("checkIcon")[0].classList.remove("checked");
  }

  setBassType();
}

async function loadBassBuilder() {
  readyStates.declarePresence("bass");

  await readyStates.waitFor("instDataLoad");

  loadBassDataValues();

  ShowBassLine();
  readyStates.readyUp("bass");
}