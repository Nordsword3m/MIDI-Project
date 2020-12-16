function BufferLoader(context, urlList, callback) {
  this.context = context;
  this.urlList = urlList;
  this.onload = callback;
  this.bufferList = [];
  this.loadCount = 0;
}

BufferLoader.prototype.loadBuffer = function (url) {
  // Load buffer asynchronously
  let request = new XMLHttpRequest();
  let ctx = this.context;

  return new Promise(function (resolve, reject) {
    request.open("GET", url, true);
    request.responseType = "arraybuffer";

    request.onload = function () {
      // Asynchronously decode the audio file data in request.response
      ctx.decodeAudioData(
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
