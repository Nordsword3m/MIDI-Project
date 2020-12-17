function AudioManager(audioList) {
  this.audioList = audioList;
  this.context = undefined;
}

AudioManager.prototype.ClearContext = function () {
  if (this.context) {
    this.context.close().then();
    this.context = undefined;
  }
};

AudioManager.prototype.NewContext = async function () {
  this.context = new AudioContext();
  let audio = this.audioList.map((x) => x + ".wav");

  let bl = new BufferLoader(
    this.context,
    audio,
    (bufferList) => (this.buffers = bufferList)
  );

  await bl.load();
};

AudioManager.prototype.play = function (name, pos, relPlayPos, tempo) {
  let source = this.context.createBufferSource();
  source.buffer = this.buffers[this.audioList.indexOf(name)];
  source.connect(this.context.destination);

  let trackLength = (60.0 / tempo) * 32;
  let loopStart = this.context.currentTime - relPlayPos * trackLength;

  source.start(loopStart + pos * trackLength);
};
