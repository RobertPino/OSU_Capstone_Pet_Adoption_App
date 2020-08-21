// {
//     "GCLOUD_PROJECT": "tgp-pet-cs467",
//     "DATA_BACKEND": "datastore"
// }

module.exports = {
    projectId: 'tgp-pet-cs467',
    keyFilename: './tgp-pet-cs467-b67278d4356e.json',
    bucketName: 'tgp-pet-cs467',
    // cookieSecret: '[cookie signing key]',
    oauth2: {
      clientId: '118389723583815481466',
    //   clientSecret: '[Client Secret for web application credentials]',
      redirectUrl: process.env.REDIRECT_URL || 'http://localhost:8080/oauth2callback'
    }
  };