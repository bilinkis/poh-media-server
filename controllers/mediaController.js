const fs = require('fs');
const path = require('path');
const exif = require('exifremove');
const Jimp = require('jimp');
const FFmpeg = require('fluent-ffmpeg');

const {upload, rng} = require('./utils');

async function videoSanitizer(req, res) {
    try {
      let fileType;
        if (req.body.type == 'quicktime') {
          fileType = 'mov';
        } else if (req.body.type == "x-matroska") {
          
            fileType = "mkv"
          }else if (req.body.type == "x-msvideo"){
            
              fileType = "avi"
            }else{
              fileType = req.body.type;
        }
      
    

      let inputName = rng();
      let outputName = rng();

      let buffer = Buffer.from(new Uint8Array(req.body.buffer.data));
      let tmpPath = path.join(__dirname, '../tmp/');

      let inputPath = `${tmpPath}${inputName}.${fileType}`;

      let outputFilename = `${outputName}.mp4`;
      let outputPath = `${tmpPath}${outputFilename}`;

      console.log('inputPath=', inputPath);
      console.log('outputPath=', outputPath);
      
      fs.writeFileSync(inputPath, buffer);

      FFmpeg(inputPath)
        .outputOptions(['-map_metadata -1', '-vcodec libx264', '-crf 24'])
        .format('mp4')
        .save(outputPath)
        .on('error', (error, stdout, stderr) => {
          console.log(`Cannot process video: ${error.message}`);
        })
        .on('end', (stdout, stderr) => {
          let outputBuffer = fs.readFileSync(outputPath);

          console.log('outputBuffer=', outputBuffer);
          
          upload(outputFilename, outputBuffer).then((URI) => {
            console.log('fileURI=', URI);

            fs.unlinkSync(inputPath);
            fs.unlinkSync(outputPath);

            res.send(URI);
          })
        });
    } catch (error) {
      console.log(`Video handling error: ${error}`);
    }
}

async function photoSanitizer(req, res) {
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
    console.log('filename=', filename);
    console.log('fileURI=', fileURI);

    res.send(fileURI);
  } catch (error) {
    console.log(`Photo handling error: ${error}`);
  }
}
exports.videoSanitizer = videoSanitizer;
exports.photoSanitizer = photoSanitizer;
