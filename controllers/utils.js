let fetch = require('node-fetch');
function upload(fileName, buffer) {
    return fetch("https://ipfs.kleros.io/add", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(
            {fileName, buffer: Buffer.from(buffer)}
        )
    }).then((res) => res.json()).then(({data}) => new URL(`https://ipfs.kleros.io/ipfs/${
        data[1].hash
    }${
        data[0].path
    }`));
}

exports.upload = upload;
