var express = require('express');
var router = express.Router();
let {videoSanitizer, photoSanitizer} = require('../controllers/mediaController')

/* GET home page. */
router.get('/',function(req,res){
    res.send("Hello")
})
router.post('/video', videoSanitizer);
router.post('/photo', photoSanitizer);

module.exports = router;
