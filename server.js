const express = require('express');
const ProductAdvertisingAPIv1 = require('paapi5-nodejs-sdk');

const app = express();
const port = process.env.PORT || 3000; // Para Vercel

// Añade CORS (permite llamadas desde cualquier origen, como AppCreator24)
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Configura el cliente PA API con env vars
const defaultClient = ProductAdvertisingAPIv1.ApiClient.instance;
defaultClient.accessKey = process.env.ACCESS_KEY_ID;
defaultClient.secretKey = process.env.SECRET_ACCESS_KEY;
defaultClient.host = 'webservices.amazon.com';
defaultClient.region = 'us-east-1';

const api = new ProductAdvertisingAPIv1.DefaultApi();

// Endpoint para búsqueda
app.get('/api/search', async (req, res) => {
    const keyword = req.query.keyword || 'black friday deals';
    const searchItemsRequest = new ProductAdvertisingAPIv1.SearchItemsRequest();

    searchItemsRequest['PartnerTag'] = process.env.PARTNER_TAG;
    searchItemsRequest['PartnerType'] = 'Associates';
    searchItemsRequest['Keywords'] = keyword;
    searchItemsRequest['SearchIndex'] = 'All';
    searchItemsRequest['Resources'] = ['ItemInfo.Title', 'Offers.Listings.Price', 'Images.Primary.Medium'];

    try {
        const data = await new Promise((resolve, reject) => {
            api.searchItems(searchItemsRequest, (error, data, response) => {
                if (error) reject(error);
                else resolve(data);
            });
        });
        res.json(data);
    } catch (error) {
        console.error('Error en PA API:', error);
        res.status(500).json({ error: error.message || 'Error en el servidor' });
    }
});

// Ruta base para testing (opcional)
app.get('/', (req, res) => res.send('Backend corriendo!'));

app.listen(port, () => {
    console.log(`Servidor en puerto ${port}`);
});
