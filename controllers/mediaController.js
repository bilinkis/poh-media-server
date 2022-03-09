let {upload} = require('./utils');

let exif = require("exifremove");
let imgConvert = require('image-convert');


function videoSanitizer(req, res, next) {
    console.log(req.body)

}
async function photoSanitizer(req, res, next) {
    try {
        console.log(buffer)
        var buffer = Buffer.from(new Uint8Array(req.body.buffer.data));
        let base64 = buffer.toString("base64")
        let jpeg = imgConvert.fromBuffer({
            buffer: base64,
            quality: 100,
            output_format: "jpg",
            size: "original"
        }, function (err, buffer, file) { // buffer=> base64 encode, file=> file object
            if (! err) {

                let photoWithoutExif = exif.remove(buffer);
                console.log(photoWithoutExif)
                upload("photo.jpg", photoWithoutExif).then(function (URI) {
                    console.log(URI)
                    res.send(URI);
                })
            }

        })
        


    } catch (err) {
        console.log(err)
    }


}
exports.videoSanitizer = videoSanitizer;
exports.photoSanitizer = photoSanitizer;
