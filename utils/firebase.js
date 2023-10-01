const admin = require('firebase-admin');
const serviceAccount = require('./firstproject-b9354-firebase-adminsdk-a6zup-71213c5f71.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'gs://firstproject-b9354.appspot.com',
});

const bucket = admin.storage().bucket();