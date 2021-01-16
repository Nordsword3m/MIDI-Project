let dem;

let keyType = "minor";
let keyNum = 1;

function toggleKeyType() {
  if (keyType === "minor") {
    keyType = "major";
  } else {
    keyType = "minor";
  }

  let keyTypeOptns = getByClass("keyType");

  for (let i = 0; i < keyTypeOptns.length; i++) {
    keyTypeOptns[i].classList.toggle("selected");
  }
}

function changeKey() {
  keyNum = parseInt(getById("keyInput").innerText) + 1;
  keyNum = keyNum > 12 ? 1 : keyNum;
  getById("keyInput").innerText = keyNum.toString();
}

document.addEventListener("DOMContentLoaded", async function () {
  dem = new DisplayElementManager();

  await am.SetDefaultBuffers();

  dem.CreateDivisions();
});