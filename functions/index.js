const functions = require('firebase-functions');
const admin = require('firebase-admin');

const express = require('express');
const app = express();
const uuidv4 = require('uuid/v4');

const cors = require('cors');

const Stream = require('stream');

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
app.get('/v1/resources/:id', cors(), (req, res, next) => {
  let id = req.params.id;

  const ref =  admin
    .database()
    .ref(`/resource/${id}`);

  ref.once('value')
    .then( snapshot => {
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
          twitterId: value['twitterId'] || '',
          url: value['url'] || '',
          lineId: value['lineId'] || '',
          thumbnailUrl: value['thumbnailUrl'] || '',
          markerUrl: value['markerUrl'] || ''
        }
      };

      const lastAccess = {
        lastAccess: Date.now()
      };
      ref.update( lastAccess );
      res.json(response);

      return false;
    })
    .catch( error => {
      console.error('error occured on ref from database.');
      console.error(JSON.stringify(error));
      response = {
        header: {
          status: 'failure',
          errorCode: 102
        },
        body: {}
      };
      res.json(response);

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
app.post('/v1/resources/', cors(), (req, res, next) => {
  let generated_uuid = uuidv4();

  console.log('request body is %O', req.body);

  // DB に登録する
  let information = {
    name: req.body.name,
    facebookId: req.body.facebookId,
    instagramId: req.body.instagramId,
    twitterId: req.body.twitterId,
    lineId: req.body.lineId,
    url: req.body.url,
    thumbnailUrl: '',
    markerUrl: ''
  };
  let response = {};

  admin
    .database()
    .ref(`/resource/${generated_uuid}`)
    .set( information )
    .then( snapshot => {
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
      res.json(response);

      return false;
    })
    .catch( error => {
      console.error('error occured on push to database.');
      console.error(error);
      response = {
        header: {
          status: 'failure',
          errorCode: 101
        },
        body: {}
      };
      res.json(response);

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
app.post('/v1/resources/upload-images/:id', cors(), (req, res, next) => {
  const THUMBNAIL = 'thumbnail';
  const MARKER = 'marker';

  let id = req.params.id;

  console.log(`id: ${id}`);
  console.log('req.body %O' + Object.keys(req.body));
  console.log('req.body.thumbnailMimeType %s' + req.body.thumbnailMimeType);
  console.log('req.body.markerMimeType %s' + req.body.markerMimeType);

  const thumbnailBase64 = req.body.thumbnail;
  const thumbnailMimeType = req.body.thumbnailMimeType;
  const markerBase64 = req.body.marker;
  const markerMimeType = req.body.markerMimeType;

  if (!thumbnailBase64 || !thumbnailMimeType || !markerBase64 || !markerMimeType) {
    // 引数が足りない
    const response = {
      header: {
        status: 'failure',
        errorCode: 105
      },
      body: {}
    };
    res.json(response);
    return false;
  }

  // ファイルを作成する
  const thumbnailUploadPromise = uploadImageFromBase64(id, 'thumbnail', thumbnailBase64, thumbnailMimeType);
  const markerUploadPromise = uploadImageFromBase64(id, 'marker', markerBase64, markerMimeType);

  // ファイルを書き出す
  Promise.all([thumbnailUploadPromise, markerUploadPromise]).then(files => {
    console.log('file saved!!');
    console.log('file.metadata are %O', files[0]['metadata']);

    const imageInformation = {
      thumbnailUrl: files[0]['metadata']['mediaLink'],
      markerUrl: files[1]['metadata']['mediaLink']
    };

    console.log('file urls are %O', imageInformation);

    return admin
      .database()
      .ref(`/resource/${id}`)
      .update( imageInformation );
  })
  .then( snapshot => {
    console.log('succeed on push to database.');

    // 登録成功
    response = {
      header: {
        status: 'success',
        errorCode: 0
      },
      body: {
        id: id
      }
    };
    res.json(response);

    return false;
  })
  .catch(error => {
    console.error('error occured on push to storage.');
    console.error(error);
    let response = {
      header: {
        status: 'failure',
        errorCode: 103
      },
      body: {}
    };
    res.json(response);

    return false;
  });
});

const getExtension = mimeType => {
  switch (mimeType) {
    case 'image/jpeg':
      return '.jpg';
    case 'image/png':
      return '.png';
    case 'image/gif':
      return '.gif';
    default:
      throw new Error('mimeTypeが期待するものではありませんでした。^image/(jpeg|png|gif)$が許可されています。');
  }
}

const uploadImageFromBase64 = (id, target, base64Code, mimeType) => {
  return new Promise((resolve, reject) => {

    let ext;
    try {
      ext = getExtension(mimeType);
    } catch (error) {
      console.error(`id : ${id} | error occured on get extension`);
      console.error(error);
      reject(new Error({errorCode: 104, target: target}));
    }

    const bucket = admin.storage().bucket();

    const dest = bucket.file('/images/' + id + '/' + target + ext);

    console.log('code is [' + base64Code.substring(0,10) + '...' + base64Code.substring(base64Code.length - 10) + '] (' + base64Code.length + ')');

    const decodeFileBuffer = Buffer.from(base64Code, 'base64');

    const blobStream = dest.createWriteStream({
      metadata: {
        contentType: mimeType,
      },
      public: true
    });

    blobStream.end(decodeFileBuffer, () => {
      dest.makePublic().then(data=> {
        console.log('MakeFilePublicResponse is %O', data);
        resolve(dest);
        return false;
      }).catch(error => {
        console.error(`id : ${id} | error occured on make public the ${target} file`);
        console.error(error);
        reject(new Error({errorCode: 109, target: target}));
        return false;
      });
    });
  });
}

const main = () => {
  admin.initializeApp();
  const api = functions
    .region('asia-northeast1')
    .https.onRequest(app);
  module.exports = { api };
};

main();
