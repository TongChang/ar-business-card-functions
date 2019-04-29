const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

const express = require('express');
const app = express();
const multer  = require('multer');
const upload = multer({ storage: multer.memoryStorage });
const uuidv4 = require('uuid/v4');

/**
 * # リソース情報の取得 ( ID )
 *
 * リソースの情報を返却します。
 *
 * ## レスポンス
 *
 * header: {
 *   status: success or failure,
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
app.get('/resources/:id', (req, res, next) => {
  let id = req.params.id;

  admin
    .database()
    .ref(`/resource/${id}`)
    .once('value')
    .then( (snapshot) => {
      let value = snapshot.val();
      console.log('succeed on ref from database.');
      console.log('get resource is %O', value);
      if (!value) {
        res.status(404).send('Not found');
      }
      let response = {
        header: {
          status: 'success',
          errorCode: 0
        },
        body: {
          id: id,
          facebookId: value['facebookId'] || '',
          instagramId: value['instagramId'] || '',
          twitterName: value['twitterName'] || '',
          url: value['url'] || '',
          lineId: value['lineId'] || ''
        }
      };

      res.send(response);

      return false;
    })
    .catch( (error) => {
      console.error('error occured on ref from database.');
      console.error(JSON.stringify(error));
      response = {
        header: {
          status: 'failure',
          errorCode: 102
        },
        body: {}
      };
      res.send(JSON.stringify(response));

      return false;
    });
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
 *   status: success or failure,
 *   errorCode: 0 ( 正常終了 )
 * },
 * body: {
 *   id ( 生成されたリソースの ID )
 * }
 *
 */
app.post('/resources/', (req, res, next) => {
  let generated_uuid = uuidv4();

  console.log('request is %O', req);

  // DB に登録する
  let information = {
    name: req.body.name,
    facebookId: req.body.facebookId,
    instagramId: req.body.instagramId,
    twitterId: req.body.twitterId,
    lineId: req.body.lineId,
    url: req.body.url
  };
  let response = {};

  admin
    .database()
    .ref(`/resource/${generated_uuid}`)
    .set( information )
    .then( (snapshot) => {
      console.log('succeed on push to database.');

      // 登録成功
      response = {
        header: {
          status: 'success',
          errorCode: 0
        },
        body: {
          id: generated_uuid
        }
      };
      res.send(JSON.stringify(response));

      return false;
    })
    .catch( (error) => {
      console.error('error occured on push to database.');
      console.error(error);
      response = {
        header: {
          status: 'failure',
          errorCode: 101
        },
        body: {}
      };
      res.send(JSON.stringify(response));

      return false;
    });


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
 *   status: success or failure,
 *   errorCode: 0 ( 正常終了 )
 * },
 * body: {}
 *
 */
app.post('/resources/upload-images/:id', upload.fields([ {name: 'thumbnail'}, {name: 'marker'} ]), (req, res, next) => {
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

const api = functions.https.onRequest(app);
module.exports = { api };

