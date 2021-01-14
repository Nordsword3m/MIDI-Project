function AudioManager(audioList) {
  this.audioList = audioList;
  this.context = undefined;
  this.mainContext = new AudioContext();
  this.contextCreated = 0;

  this.loopStart = 0;
}

AudioManager.prototype.SetLoopStart = function (relPos) {
  let trackLength = (60.0 / tempo) * (256 * barLength);
  this.loopStart = am.curTime() - relPos * trackLength;
}

AudioManager.prototype.ReplaceBuffer = async function (name, file) {
  await this.mainContext.decodeAudioData(
    await file.arrayBuffer(),
    (buffer) => (this.buffers[this.audioList.indexOf(name)] = buffer),
    () => console.log("failed")
  );
};

AudioManager.prototype.curTime = function () {
  return this.mainContext.currentTime;
};

AudioManager.prototype.ClearContext = function () {
  if (this.context) {
    this.context.close().then();
    this.context = undefined;
  }
};

AudioManager.prototype.SetDefaultBuffers = async function () {
  let audio = this.audioList.map((x) => x + ".wav");

  let bl = new BufferLoader(
    this.mainContext,
    audio,
    (bufferList) => (this.buffers = bufferList)
  );

  await bl.load();
};

AudioManager.prototype.NewContext = async function () {
  this.context = new AudioContext();
  this.contextCreated = this.mainContext.currentTime;
};

AudioManager.prototype.playNow = function (name) {
  let source = this.mainContext.createBufferSource();
  source.buffer = this.buffers[this.audioList.indexOf(name)];
  source.connect(this.mainContext.destination);

  source.start(0);
};

AudioManager.prototype.play = function (name, pos, tempo) {
  let source = this.context.createBufferSource();
  source.buffer = this.buffers[this.audioList.indexOf(name)];
  source.connect(this.context.destination);

  let trackLength = (60.0 / tempo) * (256 * barLength);

  source.start(this.loopStart + pos * trackLength - this.contextCreated);
};
