/**
 * Netlify Serverless Function: RSS Proxy com Cache em Borda
 * Busca feeds RSS diretamente na fonte, converte XML para JSON padronizado
 * e armazena em cache na CDN da Netlify (Netlify-CDN-Cache-Control).
 */

exports.handler = async (event) => {
    const headers = {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Cache-Control': 'public, max-age=300, s-maxage=600',
        'Netlify-CDN-Cache-Control': 'public, max-age=600'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 204, headers };
    }

    const feedUrl = event.queryStringParameters?.url;
    if (!feedUrl) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ status: 'error', message: 'Parâmetro url é obrigatório' })
        };
    }

    // Validação estrita de protocolo para prevenir SSRF em redes locais
    try {
        const parsedUrl = new URL(feedUrl);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            return {
                statusCode: 400,
                headers,
                body: JSON.stringify({ status: 'error', message: 'Protocolo inválido' })
            };
        }
        // Bloqueio de endereços privados / loopback
        const hostname = parsedUrl.hostname.toLowerCase();
        if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.')) {
            return {
                statusCode: 403,
                headers,
                body: JSON.stringify({ status: 'error', message: 'Acesso a rede interna não permitido' })
            };
        }
    } catch (e) {
        return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ status: 'error', message: 'URL malformada' })
        };
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 7000);

        const response = await fetch(feedUrl, {
            signal: controller.signal,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) InfoNews/1.0',
                'Accept': 'application/rss+xml, application/xml, text/xml, */*'
            }
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
            return {
                statusCode: response.status,
                headers,
                body: JSON.stringify({ status: 'error', message: `Erro upstream HTTP ${response.status}` })
            };
        }

        const xmlText = await response.text();
        const items = parseRssXml(xmlText);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
                status: 'ok',
                source: feedUrl,
                items: items
            })
        };
    } catch (err) {
        return {
            statusCode: 502,
            headers,
            body: JSON.stringify({ status: 'error', message: `Falha ao buscar feed: ${err.message}` })
        };
    }
};

/**
 * Parser de XML/RSS leve e resiliente para Serverless Node.js
 */
function parseRssXml(xml) {
    const items = [];
    const itemRegex = /<item[\s\S]*?<\/item>/gi;
    let match;

    while ((match = itemRegex.exec(xml)) !== null && items.length < 30) {
        const itemBlock = match[0];

        const title = extractTag(itemBlock, 'title');
        const link = extractTag(itemBlock, 'link');
        const pubDate = extractTag(itemBlock, 'pubDate') || extractTag(itemBlock, 'dc:date');
        const description = extractTag(itemBlock, 'description') || extractTag(itemBlock, 'content:encoded');
        
        // Extrai imagem de tag enclosure ou media:content ou tag img no description
        let thumbnail = extractAttribute(itemBlock, 'enclosure', 'url') || 
                        extractAttribute(itemBlock, 'media:content', 'url') ||
                        extractAttribute(itemBlock, 'media:thumbnail', 'url');

        if (!thumbnail && description) {
            const imgMatch = description.match(/<img[^>]+src=["']([^"']+)["']/i);
            if (imgMatch) thumbnail = imgMatch[1];
        }

        if (title && link) {
            items.push({
                title: cleanCdata(title),
                link: cleanCdata(link).trim(),
                pubDate: cleanCdata(pubDate),
                description: cleanCdata(description),
                thumbnail: thumbnail ? cleanCdata(thumbnail).trim() : ''
            });
        }
    }

    return items;
}

function extractTag(xml, tag) {
    const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
    const match = xml.match(regex);
    return match ? match[1] : '';
}

function extractAttribute(xml, tag, attr) {
    const regex = new RegExp(`<${tag}[^>]*?${attr}=["']([^"']+)["'][^>]*>`, 'i');
    const match = xml.match(regex);
    return match ? match[1] : '';
}

function cleanCdata(str) {
    if (!str) return '';
    return str.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/gi, '$1').trim();
}
