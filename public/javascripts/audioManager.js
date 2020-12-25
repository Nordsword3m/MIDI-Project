function AudioManager(audioList) {
  this.audioList = audioList;
  this.context = undefined;
  this.timeContext = new AudioContext();
  this.contextCreated = 0;
}

AudioManager.prototype.ReplaceBuffer = async function (name, file) {
  await this.timeContext.decodeAudioData(
    await file.arrayBuffer(),
    (buffer) => (this.buffers[this.audioList.indexOf(name)] = buffer),
    () => console.log("failed")
  );
};

AudioManager.prototype.curTime = function () {
  return this.timeContext.currentTime;
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
    this.timeContext,
    audio,
    (bufferList) => (this.buffers = bufferList)
  );

  await bl.load();
};

AudioManager.prototype.NewContext = async function () {
  this.context = new AudioContext();
  this.contextCreated = this.timeContext.currentTime;
};

AudioManager.prototype.play = function (name, pos, relPlayPos, tempo) {
  let source = this.context.createBufferSource();
  source.buffer = this.buffers[this.audioList.indexOf(name)];
  source.connect(this.context.destination);

  let trackLength = (60.0 / tempo) * (256 * barLength);

  source.start(loopStart + pos * trackLength - this.contextCreated);
};
