const divs = 1 / 8;
const bars = 8;

const kick = 0;
const ch = 1;
const snare = 2;
const oh = 3;

module.exports = {
  ParseMidiBytes,
  ParseBatch,
  divs,
  bars,
  kick,
  snare,
  ch,
  oh,
};

function ParseMidiBytes(bytes = [], id) {
  const header = bytes.splice(0, 8 + bytes[7]);
  const ticksPerNote =
    256 * header[header.length - 2] + header[header.length - 1];

  let trackData = new Array((bars * 4) / divs).fill(0);

  let cumTicks = 0;

  let metaTrack = false;
  let msgStart = 0;

  let far = 0;

  while (msgStart < bytes.length) {
    if (
      bytes[msgStart] === 77 &&
      bytes[msgStart + 1] === 84 &&
      bytes[msgStart + 2] === 114 &&
      bytes[msgStart + 3] === 107
    ) {
      //Track header start
      metaTrack = true;
      msgStart += 8;
    } else if (bytes[msgStart + 1] === 255) {
      //If meta message
      if (bytes[msgStart + 2] === 47) {
        //If track end
        if (!metaTrack) {
          break;
        }
      }
      cumTicks += bytes[msgStart];
      msgStart += bytes[msgStart + 3] + 4;
    } else if (bytes[msgStart + 1] === 144 && bytes[msgStart + 3] > 0) {
      //Note on and velocity greater than zero
      metaTrack = false;
      cumTicks += bytes[msgStart];
      far = cumTicks / ticksPerNote / divs;
      trackData[cumTicks / ticksPerNote / divs] = /*bytes[msgStart + 2]*/ 1;
      msgStart += 4;
    } else if (bytes[msgStart + 1] === 128) {
      //Note off
      metaTrack = false;
      cumTicks += bytes[msgStart];
      msgStart += 4;
    } else if (bytes[msgStart + 2] === 144 && bytes[msgStart + 3] > 0) {
      //Note on and velocity greater than zero vlv
      metaTrack = false;
      cumTicks += 128 * (bytes[msgStart] - 128) + bytes[msgStart + 1];
      trackData[cumTicks / ticksPerNote / divs] = /*bytes[msgStart + 3]*/ 1;
      msgStart += 5;
    } else if (bytes[msgStart + 2] === 128) {
      //Note off vlv
      metaTrack = false;
      cumTicks += 128 * (bytes[msgStart] - 128) + bytes[msgStart + 1];
      msgStart += 5;
    }
  }
  //console.log(far);
  //if (far < 200) console.log(id);
  return trackData.slice(0, 256);
}

function ParseBatch(files) {
  let kikArr = [];
  let chArr = [];

  for (let f = 0; f < files.length; f++) {
    let notes = ParseMidiBytes(files[f][1], files[f][2]);

    if (files[f][0] === kick) {
      kikArr.push(notes);
    } else if (files[f][0] === ch) {
      chArr.push(notes);
    }
  }

  return {kick: kikArr, ch: chArr};
}
