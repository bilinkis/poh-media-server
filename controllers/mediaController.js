const exif        = require('exifremove');
const Jimp        = require('jimp');

const { upload, rng }  = require('./utils');

function videoSanitizer(req, res, next) {
  console.log(req.body);
}

async function photoSanitizer(req, res, next) {
  try {
    let buffer = Buffer.from(new Uint8Array(req.body.buffer.data));
    let image = await Jimp.read(buffer);
    let imageToJpg = await image.quality(100).getBufferAsync(Jimp.MIME_JPEG);
    let imageJpgWithoutExif = exif.remove(imageToJpg);

    let filename = rng();
    let fileURI = await upload(`${filename}.jpg`, imageJpgWithoutExif);

    console.log('buffer=', buffer);
    console.log('image=', image);
    console.log('imageToJpg=', imageToJpg);
    console.log('imageJpgWithoutExif=', imageJpgWithoutExif);
    console.log('filename', filename);
    console.log('fileURI=', fileURI);

    res.send(fileURI);
  } catch (error) {
      console.log(`Photo handling error: ${error}`);
  }
}
exports.videoSanitizer = videoSanitizer;
exports.photoSanitizer = photoSanitizer;
