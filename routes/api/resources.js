const express = require('express');
const router = express.Router();
const multer  = require('multer');
const upload = multer({ dest: 'uploads/' });
const uuidv4 = require('uuid/v4');

/**
 * # リソース情報の取得 ( ID )
 *
 * リソースの情報を返却します。
 *
 * ## レスポンス
 *
 * header: {
 *   status: success or failed,
 *   errorCode: 0 ( 正常終了 )
 * },
 * body: {
 *   id,
 *   facebookId,
 *   instagramId,
 *   twitterName,
 *   url,
 *   lineId
 * }
 *
 */
router.get('/:id', (req, res, next) => {
  let id = req.params.id;

  let resource = {
    id: id,
    facebookId: 'facebookId',
    instagramId: 'instagramId',
    twitterName: 'twitterName',
    url: 'url',
    lineId: 'lineId'
  };

  let response = {
    header: {
      status: 'success',
      errorCode: 0
    },
    body: {
      resource
    }
  };

  res.send(response);

});

/**
 * # リソースの登録
 *
 * リソースの初期情報として、もろもろのパーソナルデータを登録しつつ
 * リソース ID を生成して返します。
 *
 * ## レスポンス
 *
 * header: {
 *   status: success or failed,
 *   errorCode: 0 ( 正常終了 )
 * },
 * body: {
 *   id ( 生成されたリソースの ID )
 * }
 *
 */
router.post('/', (req, res, next) => {
  let generated_uuid = uuidv4();

  console.log('request is %O', req);

  // DB に登録して
  let resource = req.body;

  let response = {
    header: {
      status: 'success',
      errorCode: 0
    },
    body: {
      id: generated_uuid
    }
  };

  res.send(JSON.stringify(response));
});

/**
 * # ファイルアップロード
 *
 * リソースのファイルをアップロードします。
 *
 * リソース ID をパスに持ち、その ID に紐づくフォルダに格納します。
 *
 * ## レスポンス
 *
 * header: {
 *   status: success or failed,
 *   errorCode: 0 ( 正常終了 )
 * },
 * body: {}
 *
 */
router.post('/upload-images/:id', upload.fields([ {name: 'thumbnail'}, {name: 'marker'} ]), (req, res, next) => {
  console.log('req.params is %O', req.params);
  console.log('req.files is %O', req.files);

  let id = req.params.id;

  let tmpThumbnail = req.files.thumbnail;
  let tmpMarker = req.files.marker;

  // フォルダ作って
  // ファイル置いて

  let response = {
    header: {
      status: 'success',
      errorCode: 0
    },
    body: {}
  };
  res.send(JSON.stringify(response));
});

module.exports = router;

