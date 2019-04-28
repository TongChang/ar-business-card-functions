var express = require('express');
var router = express.Router();
var multer  = require('multer');
var upload = multer({ dest: 'uploads/' });

/* GET users listing. */
router.post('/', function(req, res, next) {
  console.log('request is %O', req);
  res.send('respond with a resource');
});

router.post('/upload/', upload.single('thumbnail'), (req, res, next) => {
  console.log('request is %O', req);
  res.send('upload done.');
});

module.exports = router;

