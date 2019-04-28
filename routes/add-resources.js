const express = require('express');
const router = express.Router();
const multer  = require('multer');
const upload = multer({ dest: 'uploads/' });
const uuidv4 = require('uuid/v4');

/* GET users listing. */
router.post('/', function(req, res, next) {
  let generated_uuid = uuidv4();

  console.log('request is %O', req);
  console.log('uuid is [' + generated_uuid + ']' );

  res.send('request is ' + JSON.stringify(req.body) + ', uuid is ' + generated_uuid);
});

router.post('/upload-thumbnail/', upload.single('thumbnail'), (req, res, next) => {
  console.log('request is %O', req);
  res.send('upload done.');
});

module.exports = router;

