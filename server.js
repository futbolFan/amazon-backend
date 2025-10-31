const express = require('express');
const AWS = require('aws-sdk');
const path = require('path'); // Para servir HTML
const app = express();
const port = 3000;

// Tus claves de Amazon AQUÍ (seguras, solo en este archivo)
const accessKeyId = process.env.ACCESS_KEY_ID;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;
const partnerTag = process.env.PARTNER_TAG;
const region = 'us-east-1';

// Configura el cliente de PA API (usa SDK para simplicidad)
AWS.config.update({
    accessKeyId: accessKeyId,
    secretAccessKey: secretAccessKey,
    region: region
});
const paapi = new AWS.PAAPI({ endpoint: new AWS.Endpoint('webservices.amazon.com') });

// Sirve archivos estáticos (como tu HTML)
app.use(express.static(path.join(__dirname, '/')));

// Endpoint para búsqueda de ofertas
app.get('/api/search', async (req, res) => {
    const keyword = req.query.keyword || 'black friday deals';
    try {
        const params = {
            Keywords: keyword,
            SearchIndex: 'All',
            Resources: ['ItemInfo.Title', 'Offers.Listings.Price', 'Images.Primary.Medium'],
            PartnerTag: partnerTag,
            PartnerType: 'Associates'
        };
        const data = await paapi.searchItems(params).promise();
        res.json(data);
    } catch (error) {
        console.error('Error en API:', error);
        res.status(500).json({ error: error.message });
    }
});

// Inicia el servidor
app.listen(port, () => {
    console.log(`Servidor corriendo en http://localhost:${port}`);
});
