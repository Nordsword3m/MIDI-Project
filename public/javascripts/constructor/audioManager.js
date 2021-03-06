function AudioManager(audioList) {
  this.audioList = audioList;
  this.context = new AudioContext();

  this.loopStart = 0;
}

AudioManager.prototype.SetLoopStart = function (relPos) {
  let trackLength = (60.0 / tempo) * (256 * barLength);
  this.loopStart = am.curTime() - relPos * trackLength;
};

AudioManager.prototype.ReplaceBuffer = async function (name, file) {
  await this.context.decodeAudioData(
    await file.arrayBuffer(),
    (buffer) => (this.buffers[this.audioList.indexOf(name)] = buffer),
    () => console.log("failed")
  );
};

AudioManager.prototype.curTime = function () {
  return this.context.currentTime;
};

AudioManager.prototype.SetDefaultBuffers = async function () {
  let audio = this.audioList.map((x) => x + ".wav");

  let bl = new BufferLoader(
    audio,
    (bufferList) => (this.buffers = bufferList)
  );

  await bl.load();
};

AudioManager.prototype.playNow = function (name) {
  let source = this.context.createBufferSource();
  source.buffer = this.buffers[this.audioList.indexOf(name)];
  source.connect(this.context.destination);

  source.start(0);
};

AudioManager.prototype.play = function (name, pos) {
  let source = this.context.createBufferSource();
  source.buffer = this.buffers[this.audioList.indexOf(name)];
  source.connect(this.context.destination);

  let trackLength = (60.0 / tempo) * (256 * barLength);
  source.start(Math.max(this.context.currentTime, this.loopStart + pos * trackLength));
};

AudioManager.prototype.pitchToSource = function (pitch, startTime, endTime, sound) {
  let source = this.context.createBufferSource();

  let octave = "C5";
  let relFreq = 1;

  if (pitch >= 18) {
    octave = "C7";
    relFreq = Math.pow(2, (pitch - 24) / 12);
  } else if (pitch >= 6) {
    octave = "C6";
    relFreq = Math.pow(2, (pitch - 12) / 12);
  } else if (pitch >= -6) {
    octave = "C5";
    relFreq = Math.pow(2, (pitch) / 12);
  } else if (pitch >= -18) {
    octave = "C4";
    relFreq = Math.pow(2, (pitch + 12) / 12);
  } else if (pitch >= -30) {
    octave = "C3";
    relFreq = Math.pow(2, (pitch + 24) / 12);
  }

  source.buffer = this.buffers[this.audioList.indexOf(sound + octave)];
  source.playbackRate.value = relFreq;

  let env = this.context.createGain();
  env.gain.setTargetAtTime(0, endTime, 0.015);

  source.connect(env).connect(this.context.destination);
  source.start(startTime);
  source.stop(endTime + 1);

  return source;
};

AudioManager.prototype.playNote = function (pitch, pos, length, sound) {
  let trackLength = (60.0 / tempo) * (256 * barLength);
  let startTime = this.loopStart + pos * trackLength;
  let endTime = this.loopStart + ((pos + (length / 8)) * trackLength);

  this.pitchToSource(pitch, Math.max(this.context.currentTime, startTime), endTime, sound);
};

AudioManager.prototype.playNoteNow = function (pitch, sound) {
  let endTime = 0.5 + this.context.currentTime;

  this.pitchToSource(pitch, 0, endTime, sound);
};
