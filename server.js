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

        // Отправляем сообщение на внешний API Groq
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + process.env.API_KEY_1
            },
            body: JSON.stringify({
                messages: [{ role: 'user', content: data.message }],
                model: 'compound-beta-mini',
                temperature: 1,
                max_completion_tokens: 1024,
                top_p: 1,
                stream: false,
                stop: null
            })
        });

        const groqData = await groqResponse.json();

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(groqData));
    } catch (err) {
        console.error('Error processing request:', err);
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
}).listen(3000, () => console.log('Server running on http://localhost:3000'));
