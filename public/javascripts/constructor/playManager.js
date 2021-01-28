// Step constants
const barLength = 1 / 8;
const noteLength = 1 / 32;
const stepLength = 1 / 256;

const chunkSize = noteLength / 2;

function PlayManager() {
  this.playPos = 0;
  this.relPlayPos = 0;

  this.playing = false;
  this.prevPlayTime = 0;
  this.playTimerID = undefined;

  this.nextChunk = 0;
  this.relNextChunk = 0;
  this.chunkPreRender = 1 / 2;
}

PlayManager.prototype.NextChunk = function () {
  if (this.relPlayPos + chunkSize * this.chunkPreRender >= 1) {
    am.SetLoopStart(this.relPlayPos - 1);
  }

  scheduleMets();
  soundSchedule();

  this.setNextChunk(this.nextChunk + chunkSize);
};

PlayManager.prototype.setNextChunk = function (chunk) {
  this.nextChunk = chunk;
  this.relNextChunk = this.nextChunk % 1;
};

PlayManager.prototype.TogglePlaying = async function (pos, play) {
  if (play !== this.playing) {
    getById("playButton").classList.toggle("fa-pause");
    getById("playButton").classList.toggle("fa-play");
    this.playing = play;
  }

  if (play) {
    this.prevPlayTime = am.curTime();

    this.setNextChunk(Math.floor((1 / chunkSize) * pos) * chunkSize);
    this.setPlayPos(this.nextChunk);
    am.SetLoopStart(this.relPlayPos);

    this.NextChunk();

    clearInterval(this.playTimerID);

    this.playTimerID = setInterval(this.Playing.bind(this), 1);
  } else {
    clearInterval(this.playTimerID);
    this.setPlayPos(0);
    this.setNextChunk(0);
  }
};

PlayManager.prototype.Playing = function () {
  // Playing routine, run as frequently as possible
  let timeDelta = am.curTime() - this.prevPlayTime;
  this.prevPlayTime = am.curTime();
  let trackLength = (60.0 / tempo) * 32;
  this.setPlayPos(this.playPos + timeDelta / trackLength);

  if (this.playPos >= this.nextChunk - chunkSize * this.chunkPreRender) {
    this.NextChunk();
  }
};

PlayManager.prototype.SetHeadPos = function () {
  getById("playHead").style.left = this.relPlayPos * 100 + "%";
};

PlayManager.prototype.setPlayPos = function (pos) {
  let posDelta = pos - this.playPos;
  this.playPos = pos;
  this.relPlayPos += posDelta;

  if (this.relPlayPos >= 1) {
    while (this.relPlayPos >= 1) {
      this.relPlayPos--;
    }
    am.SetLoopStart(this.relPlayPos);
  } else if (this.relPlayPos < 0) {
    while (this.relPlayPos < 0) {
      this.relPlayPos++;
    }
  }

  this.SetHeadPos();
};