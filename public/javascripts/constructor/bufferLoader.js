function BufferLoader(urlList, callback) {
  this.urlList = urlList;
  this.onload = callback;
  this.bufferList = [];
  this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function (name) {
  // Load buffer asynchronously
  let request = new XMLHttpRequest();
  let url = "../audio/" + name;

  return new Promise(function (resolve, reject) {
    request.open("GET", url, true);
    request.responseType = "arraybuffer";

    request.onload = function () {
      // Asynchronously decode the audio file data in request.response
      am.context.decodeAudioData(
        request.response,
        function (buffer) {
          if (!buffer) {
            alert("error decoding file data: " + url);
            reject();
          } else {
            resolve(buffer);
          }
        },
        function (error) {
          reject();
          console.error("decodeAudioData error", error);
        }
      );
    };

    request.onerror = function () {
      alert("BufferLoader: XHR error");
      reject();
    };

    request.send();
  });
};

BufferLoader.prototype.load = async function () {
  let loader = this;
  for (let i = 0; i < loader.urlList.length; ++i) {
    await loader.loadBuffer(loader.urlList[i]).then(function (buffer) {
      loader.bufferList[i] = buffer;
      if (++loader.loadCount === loader.urlList.length) {
        loader.onload(loader.bufferList);
      }
    });
  }
};
