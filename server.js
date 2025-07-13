var http = require('http');
var fs = require('fs').promises;
var path = require('path');

process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
});

async function apiAIMessageNew(req, res) {
    if (req.url !== '/apiAIMessageNew') return;
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

        // Send message to external Groq API
        const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + process.env.API_KEY_1
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: 'system',
                        content: 'Ты - менеджер по продажам платформы КонтактСкрипт (https://kscript.ru/), виджета для бизнес-коммуникаций, объединяющего онлайн-чат, социальные функции, профили, ленту без алгоритмов, публикации, комментарии, поиск и администрирование. Используй навыки продаж, маркетинга и НЛП, чтобы лаконично (максимум 3 коротких предложения) продвигать продукт, предлагая установить виджет с помощью кода: <script async src="https://kscript.ru/widget.js"></script>. Для бесплатного 14-дневного доступа или ознакомления с тарифами укажи кнопку с идентификатором "btn_tariffs". Для техподдержки укажи кнопку с идентификатором "btn_support". Код подключения виджета на сайт: <script async src="https://kscript.ru/widget.js"></script>. Когда пользователь доходит до шага «Подключить виджет», запусти сценарий, в котором: 1. Покажи пользователю уникальный код виджета для установки на сайт. 2. Объясни, куда и как вставить этот код на разные типы сайтов: ◦ обычный HTML-сайт, ◦ CMS (WordPress, Joomla и др.), ◦ платформы-конструкторы (Tilda, Wix, Shopify и т.д.), ◦ фреймворки (React, Vue, Angular). 3. Предоставляй понятные инструкции по установке, ориентируясь на систему, которую использует пользователь. Цель: помочь пользователю установить виджет ContactScript на сайт как можно быстрее и без ошибок. Отвечай только на темы, связанные с КонтактСкрипт и его установкой на сайт клиента, игнорируя сторонние вопросы. Старайся отвечать максимально коротко, лаконичными фразами, и не давай дополнительных объяснений и не отвечай на вопросы, которые не задавали. Формат ответа должен быть JSON: {"message": "твой ответ", "buttons": []}. Если ответ связан с тарифами или техподдержкой, добавь в массив buttons соответствующие идентификаторы: "btn_tariffs" для тарифов, "btn_support" для техподдержки, например, {"message": "Ознакомьтесь с тарифами.", "buttons": ["btn_tariffs", "btn_support"]}. Если кнопки не нужны, оставь массив buttons пустым: []. Не используй URL-адреса в buttons, только идентификаторы "btn_tariffs" или "btn_support".'
                    },
                    {
                        role: 'user',
                        content: data.message
                    }
                ],
                model: 'compound-beta-mini',
                temperature: 0.8,
                max_completion_tokens: 100,
                top_p: 0.9,
                stream: false,
                stop: null
            })
        });

        const groqData = await groqResponse.json();
        let responseData;

        // Try to parse the AI response as JSON
        try {
            responseData = JSON.parse(groqData.choices?.[0]?.messageഗ

System: message?.content || '{}');
        } catch (e) {
            // Fallback if AI doesn't return valid JSON
            responseData = {
                message: groqData.choices?.[0]?.message?.content || 'No response from API',
                buttons: []
            };
        }

        // Ensure responseData has the expected structure
        if (!responseData.message || !Array.isArray(responseData.buttons)) {
            responseData = {
                message: responseData.message || 'No response from API',
                buttons: []
            };
        }

        // Map button types to predefined button identifiers
        const buttonMap = {
            btn_tariffs: { id: 'btn_tariffs', text: 'Тарифы' },
            btn_support: { id: 'btn_support', text: 'Техподдержка' }
        };

        const buttons = responseData.buttons
            .filter(type => buttonMap[type]) // Only include valid button types
            .map(type => buttonMap[type]);

        // Prepare response payload
        const responsePayload = {
            message: responseData.message,
            buttons: buttons
        };

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(responsePayload));
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
        await apiAIMessageNew(req, res);
        await api404(req, res);
    } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
    }
}).listen(3000, (err) => {
    if (err) {
        console.error('Failed to start server:', err);
        return;
    }
    console.log('Server running on http://localhost:3000');
});
