const exif = require('exifremove');
const Jimp = require('jimp');


let FFmpeg = require('fluent-ffmpeg');
let fs = require('fs');


const path = require('path');

const {upload, rng} = require('./utils');

async function videoSanitizer(req, res, next) { // console.log(req.body)
    try {
        let type;
        if (req.body.type == 'quicktime') {
            type = 'mov';
        } else {
            type = req.body.type;
        }
        let input = rng();
        let output = rng();
        var buffer = Buffer.from(new Uint8Array(req.body.buffer.data));
        fs.writeFileSync(path.join(__dirname, '../tmp/') + input + '.' + type, buffer);

        FFmpeg(path.join(__dirname, '../tmp/') + input + '.' + type).outputOptions(['-map_metadata -1', '-vcodec libx264', '-crf 24']).format('mp4').save(path.join(__dirname, '../tmp/') + output + '.mp4').on('error', function (err, stdout, stderr) {
            console.log('Cannot process video: ' + err.message);
        }).on('end', function () {
            let finalBuffer = fs.readFileSync(path.join(__dirname, '../tmp/') + output + '.mp4')
            upload(output + '.mp4', finalBuffer).then(function (URI) {
                console.log(URI)
                fs.unlinkSync(path.join(__dirname, '../tmp/') + input + '.'+type);
                fs.unlinkSync(path.join(__dirname, '../tmp/') + output+ '.mp4');
                res.send(URI);
            })
        });
    } catch (err) {
        console.log(err)
    }


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
