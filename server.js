const express = require('express');
const crypto = require('crypto');
const app = express();
const port = process.env.PORT || 3000;

// CORS para permitir llamadas desde AppCreator24
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

// Endpoint para búsqueda
app.get('/api/search', async (req, res) => {
  const keyword = req.query.keyword || 'black friday deals';
  const endpoint = 'webservices.amazon.com';
  const path = '/paapi5/searchitems';
  const region = 'us-east-1';
  const service = 'ProductAdvertisingAPI';
  const accessKeyId = process.env.ACCESS_KEY_ID;
  const secretAccessKey = process.env.SECRET_ACCESS_KEY;
  const partnerTag = process.env.PARTNER_TAG;

  const payload = JSON.stringify({
    Keywords: keyword,
    SearchIndex: 'All',
    Resources: ['ItemInfo.Title', 'Offers.Listings.Price', 'Images.Primary.Medium'],
    PartnerTag: partnerTag,
    PartnerType: 'Associates'
  });

  try {
    // SHA256 hash
    const sha256 = (message) => crypto.createHash('sha256').update(message).digest('hex');

    // HMAC-SHA256
    const hmacSHA256 = (key, message) => crypto.createHmac('sha256', key).update(message).digest();

    // Signing key
    const getSigningKey = (secret, date, reg, serv) => {
      let k = hmacSHA256('AWS4' + secret, date);
      k = hmacSHA256(k, reg);
      k = hmacSHA256(k, serv);
      return hmacSHA256(k, 'aws4_request');
    };

    const now = new Date().toISOString().replace(/[:-]|\.\d{3}/g, '').replace('T', 'T');
    const date = now.slice(0, 8);
    const payloadHash = sha256(payload);

    const headers = {
      'host': endpoint,
      'content-type': 'application/json; charset=utf-8',
      'x-amz-target': 'com.amazon.paapi5.v1.ProductAdvertisingAPIv1.SearchItems',
      'content-encoding': 'amz-1.0'
    };

    const canonicalHeaders = Object.entries(headers).map(([k, v]) => `${k.toLowerCase()}:${v}\n`).sort().join('');
    const signedHeaders = Object.keys(headers).map(k => k.toLowerCase()).sort().join(';');

    const canonicalRequest = `POST\n${path}\n\n${canonicalHeaders}\n${signedHeaders}\n${payloadHash}`;
    const requestHash = sha256(canonicalRequest);

    const credentialScope = `${date}/${region}/${service}/aws4_request`;
    const stringToSign = `AWS4-HMAC-SHA256\n${now}\n${credentialScope}\n${requestHash}`;

    const signingKey = getSigningKey(secretAccessKey, date, region, service);
    const signature = hmacSHA256(signingKey, stringToSign).toString('hex');

    headers['x-amz-date'] = now;
    headers['Authorization'] = `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${credentialScope},SignedHeaders=${signedHeaders},Signature=${signature}`;

    const response = await fetch(`https://${endpoint}${path}`, {
      method: 'POST',
      headers,
      body: payload
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData));
    }

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Ruta base
app.get('/', (req, res) => res.send('Backend corriendo!'));

app.listen(port, () => console.log(`Servidor en puerto ${port}`));
