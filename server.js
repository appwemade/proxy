var http = require('http');
var fs = require('fs').promises;
var path = require('path');

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

var http = require('http');
var fs = require('fs').promises;
var path = require('path');

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});



async function apiMessageNew(req, res) {
    if (req.url !== '/apiMessageNew') return;
    if (res.finished) return;

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(204).end();
        return true;
    }

    if (req.method !== 'POST') {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Only POST allowed' }));
        return;
    }

    try {
        let body = '';
        for await (const chunk of req) {
            body += chunk;
        }

        const data = JSON.parse(body);
        if (!data.message) {
            throw new Error('Message field is required');
        }

        const responseMessage = `Hello ${data.message}`;
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: responseMessage }));
    } catch (err) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
    }
}





async function api404(req, res) {
    if (res.finished) return;
    res.writeHead(404);
    res.end('404 Not Found');
}


http.createServer(async (req, res) => {
    try {
        await apiMessageNew(req, res);
        await api404(req, res);
    } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
    }
}).listen(80, () => console.log('Server running on http://localhost:80'));














