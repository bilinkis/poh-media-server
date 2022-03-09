const fetch         = require('node-fetch');
const randomstring  = require('randomstring');

function upload(fileName, buffer) {
  let options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fileName,
      buffer: Buffer.from(buffer)
    })
  };

  return fetch('https://ipfs.kleros.io/add', options).then(res => res.json()).then(({ data }) => `https://ipfs.kleros.io/ipfs/${data[1].hash}${data[0].path}`);
}

function rng() {
  return randomstring.generate({
    length: 46
  });
}

exports.upload = upload;
exports.rng = rng;
