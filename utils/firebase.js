const admin = require('firebase-admin');
const serviceAccount = require('./edustream-hub-firebase-adminsdk-rru81-b5c6445df6.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'gs://edustream-hub.appspot.com',
});

const bucket = admin.storage().bucket();