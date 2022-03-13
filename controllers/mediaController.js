const fs = require('fs');
const path = require('path');
const exif = require('exifremove');
const Jimp = require('jimp');
const ffmpeg = require('fluent-ffmpeg');

const {upload, rng} = require('./utils');

const MAX_IMAGE_SIZE = 2 * 1000 * 1000 * 8;
const MAX_VIDEO_SIZE = 7 * 1000 * 1000 * 8;

async function getVideoMetadata(path) {
  return new Promise((resolve, reject) => {
    ffmpeg.ffprobe(path, (error, metadata) => {
      resolve(metadata);
    });
  });
}

function getFileType(type) {
  if (type == 'quicktime') {
    return 'mov';
  } else if (type == "x-matroska") {
    return "mkv"
  } else if (type == "x-msvideo") {
    return "avi"
  }

  return type;
}

async function videoSanitizer(req, res) {
    try {
      
      
      console.log('Request body=', req.body);
      let fileType = getFileType(req.body.type);

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

      let metadata = await getVideoMetadata(inputPath);
      let options = ['-map_metadata -1', '-vcodec libx264', '-acodec mp3']; // '-crf 24' removed

      // https://unix.stackexchange.com/questions/520597/how-do-i-reduze-the-size-of-a-video-to-a-target-size
      if (metadata.format.size > MAX_VIDEO_SIZE) {
        console.log('Video size exceeding maximum...');

        let target_size = MAX_VIDEO_SIZE;
        let length = metadata.format.duration;
        let length_round_up = Math.ceil(length);
        let total_bitrate = target_size / length_round_up;
        let audio_bitrate = metadata.streams[1].bit_rate; // streams[1] may break with multiple streams? TODO: Know and check only audio stream.
        let video_bitrate = total_bitrate - audio_bitrate;

        console.log('total_length=', length);
        console.log('audio_bitrate=', audio_bitrate);
        console.log('video_bitrate=', video_bitrate);

        options.push(
          `-b:v ${video_bitrate}`,
          `-maxrate:v ${video_bitrate}`,
          `-b:a $audio_bitrate`,
          // `-bufsize:v ${Math.floor(target_size / 20)}))`, // Not sure what this actually does nor it's needed
        );
      }

      ffmpeg(inputPath)
        .outputOptions(options)
        .format('mp4')
        .save(outputPath)
        .on('end', (stdout, stderr) => {
          let outputBuffer = fs.readFileSync(outputPath);
          console.log('outputBuffer=', outputBuffer);
          
          upload(outputFilename, outputBuffer).then((URI) => {
            console.log('fileURI=', URI);

            fs.unlink(inputPath, (e) => { console.log(`Unlinked ${inputPath} async`); });
            fs.unlink(outputPath, (e) => { console.log(`Unlinked ${outputPath} async`); });

            res.send({URI:URI});
          });
        })
        .on('error', (error, stdout, stderr) => {
          console.log(`Cannot process video: ${error.message}`);
        });
    } catch (error) {
      console.log(`Video handling error: ${error}`);
    }
}

async function photoSanitizer(req, res) {
  try {
    let buffer = Buffer.from(new Uint8Array(req.body.buffer.data));
    let image = await Jimp.read(buffer);
    let imageToJpg = await image.quality(95).getBufferAsync(Jimp.MIME_JPEG);
    let imageJpgWithoutExif = exif.remove(imageToJpg);

    let filename = rng();
    let fileURI = await upload(`${filename}.jpg`, imageJpgWithoutExif);

    console.log('buffer=', buffer);
    console.log('image=', image);
    console.log('imageToJpg=', imageToJpg);
    console.log('imageJpgWithoutExif=', imageJpgWithoutExif);
    console.log('filename=', filename);
    console.log('fileURI=', fileURI);

    res.send({URI:fileURI});
  } catch (error) {
    console.log(`Photo handling error: ${error}`);
  }
}

exports.videoSanitizer = videoSanitizer;
exports.photoSanitizer = photoSanitizer;
