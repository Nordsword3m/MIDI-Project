let bassNotes;

async function loadBassBuilder() {
  await readyStates.waitFor("instDataLoad");

  console.log(progression.chords.map((c) => c[0]));
}