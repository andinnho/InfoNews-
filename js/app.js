/**
 * InfoNews - Core Application Logic
 * Gerenciamento de Estado, Consumo de APIs (RSS, Open-Meteo, AwesomeAPI)
 * Controle de Tema Claro/Escuro, Filtros, Acessibilidade e Segurança (AppSec)
 */

// Helper seguro para leitura de coordenadas evitando crash fatal em JSON corrompido
function getStoredCoords() {
    try {
        const val = localStorage.getItem('infonews_coords');
        return val ? JSON.parse(val) : { lat: -23.5475, lon: -46.6361 };
    } catch (e) {
        return { lat: -23.5475, lon: -46.6361 };
    }
}

// Estado Global da Aplicação
const state = {
    categoriaAtual: 'tecnologia',
    portalTechAtual: 'todos',
    provider: localStorage.getItem('infonews_provider') || 'rss',
    apiKey: localStorage.getItem('infonews_apikey') || '',
    cidadeClima: localStorage.getItem('infonews_cidade') || 'São Paulo',
    climaCoords: getStoredCoords(),
    noticias: [],
    todasNoticias: [],
    tema: localStorage.getItem('infonews_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'),
    isCarregando: false
};

// Portais Especializados em Tecnologia e Feeds Oficiais
const TECH_PORTAIS = {
    canaltech: {
        nome: 'Canaltech',
        url: 'https://canaltech.com.br/rss/',
        badgeColor: 'bg-blue-500/10 text-blue-600 dark:bg-blue-600/20 dark:text-blue-400 border-blue-500/30'
    },
    tecnoblog: {
        nome: 'Tecnoblog',
        url: 'https://tecnoblog.net/feed/',
        badgeColor: 'bg-sky-500/10 text-sky-600 dark:bg-sky-600/20 dark:text-sky-400 border-sky-500/30'
    },
    techtudo: {
        nome: 'TechTudo',
        url: 'https://g1.globo.com/rss/g1/tecnologia/',
        badgeColor: 'bg-red-500/10 text-redbrand-600 dark:bg-redbrand-600/20 dark:text-redbrand-400 border-redbrand-500/30'
    },
    olhardigital: {
        nome: 'Olhar Digital',
        url: 'https://olhardigital.com.br/feed/',
        badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-600/20 dark:text-emerald-400 border-emerald-500/30'
    },
    tecmundo: {
        nome: 'TecMundo',
        url: 'https://rss.tecmundo.com.br/feed',
        badgeColor: 'bg-orange-500/10 text-orange-600 dark:bg-orange-600/20 dark:text-orange-400 border-orange-500/30'
    },
    gizmodo: {
        nome: 'Gizmodo Brasil',
        url: 'https://gizmodo.uol.com.br/feed/',
        badgeColor: 'bg-amber-500/10 text-amber-600 dark:bg-amber-600/20 dark:text-amber-400 border-amber-500/30'
    },
    mundoconectado: {
        nome: 'Mundo Conectado',
        url: 'https://mundoconectado.com.br/feed/',
        badgeColor: 'bg-cyan-500/10 text-cyan-600 dark:bg-cyan-600/20 dark:text-cyan-400 border-cyan-500/30'
    },
    oficinadanet: {
        nome: 'Oficina da Net',
        url: 'https://www.oficinadanet.com.br/rss',
        badgeColor: 'bg-yellow-500/10 text-yellow-600 dark:bg-yellow-600/20 dark:text-yellow-400 border-yellow-500/30'
    },
    ztop: {
        nome: 'ZTop',
        url: 'https://ztop.com.br/feed/',
        badgeColor: 'bg-purple-500/10 text-purple-600 dark:bg-purple-600/20 dark:text-purple-400 border-purple-500/30'
    },
    mobizoo: {
        nome: 'Mobizoo',
        url: 'https://mobizoo.com.br/feed/',
        badgeColor: 'bg-rose-500/10 text-rose-600 dark:bg-rose-600/20 dark:text-rose-400 border-rose-500/30'
    }
};

// Feeds Gerais de Informação
const GENERAL_FEEDS = {
    politica: {
        nome: 'G1 Política & Brasil',
        url: 'https://g1.globo.com/rss/g1/politica/'
    },
    brasil: {
        nome: 'G1 Brasil Geral',
        url: 'https://g1.globo.com/rss/g1/brasil/'
    },
    mundo: {
        nome: 'G1 Mundo / Internacional',
        url: 'https://g1.globo.com/rss/g1/mundo/'
    },
    economia: {
        nome: 'G1 Economia & Negócios',
        url: 'https://g1.globo.com/rss/g1/economia/'
    }
};

// Notícias de Contingência (modo offline/reserva)
const CONTINGENCY_NEWS = [
    {
        titulo: "Inteligência Artificial Generativa e Chips Neurais transformam o mercado tech em 2026",
        link: "https://g1.globo.com/tecnologia/",
        resumo: "Avanços em novos semicondutores e modelos de linguagem aceleram a automação industrial e o desenvolvimento de software no Brasil e no mundo.",
        data: "Hoje, 14:30",
        dataRaw: new Date(),
        fonte: "Tech Radar",
        badgeColor: "bg-red-500/10 text-redbrand-600 dark:bg-redbrand-600/20 dark:text-redbrand-400 border-redbrand-500/30",
        imagem: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80"
    },
    {
        titulo: "Mercados globais reagem à nova política de taxas e câmbio internacional",
        link: "https://g1.globo.com/economia/",
        resumo: "Investidores analisam projeções de inflação e liquidez após anúncio das principais autoridades monetárias mundiais.",
        data: "Hoje, 12:15",
        dataRaw: new Date(Date.now() - 3600000),
        fonte: "Radar Econômico",
        badgeColor: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-600/20 dark:text-emerald-400 border-emerald-500/30",
        imagem: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80"
    },
    {
        titulo: "Transição energética e conectividade 5G avançam nas capitais brasileiras",
        link: "https://g1.globo.com/brasil/",
        resumo: "Projetos de infraestrutura inteligente e redes sustentáveis de telecomunicações ampliam a cobertura para áreas metropolitanas.",
        data: "Hoje, 10:00",
        dataRaw: new Date(Date.now() - 7200000),
        fonte: "Brasil Inovação",
        badgeColor: "bg-blue-500/10 text-blue-600 dark:bg-blue-600/20 dark:text-blue-400 border-blue-500/30",
        imagem: "https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?auto=format&fit=crop&w=800&q=80"
    }
];

/* ==========================================================================
   Utilitários de Segurança (AppSec & Sanitização)
   ========================================================================== */

/**
 * Escapa caracteres HTML para prevenir Cross-Site Scripting (XSS).
 */
function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Valida e sanitiza URLs externas, permitindo estritamente protocolos http:// e https://.
 * Bloqueia injeções perigosas como javascript:, data:text/html, vbscript:, file:, etc.
 */
function sanitizeUrl(url) {
    if (!url || typeof url !== 'string') return '#';
    const trimmed = url.trim();
    try {
        const parsed = new URL(trimmed, window.location.href);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            return parsed.href;
        }
    } catch (e) {
        // Formato de URL inválido
    }
    return '#';
}

/**
 * Valida URLs de imagem, garantindo protocolo seguro ou fallback local.
 */
function sanitizeImageUrl(url, fallbackUrl) {
    if (!url || typeof url !== 'string') return fallbackUrl;
    const trimmed = url.trim();
    try {
        const parsed = new URL(trimmed, window.location.href);
        if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
            // Evita avisos de conteúdo misto em HTTPS forçando upgrade de http para https
            return parsed.href.replace(/^http:\/\//i, 'https://');
        }
    } catch (e) {}
    return fallbackUrl;
}

/**
 * Requisição fetch com timeout para prevenir conexões pendentes e exaustão de recursos.
 */
async function fetchWithTimeout(resource, options = {}, timeoutMs = 8000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
        const response = await fetch(resource, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}

/* ==========================================================================
   Inicialização e Ciclo de Vida
   ========================================================================== */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Inicializar tema visual
    aplicarTema(state.tema);

    // 2. Restaurar preferências nos formulários
    const selectProvider = document.getElementById('select-provider');
    const inputApiKey = document.getElementById('input-apikey');
    if (selectProvider) selectProvider.value = state.provider;
    if (inputApiKey) inputApiKey.value = state.apiKey;
    atualizarOpcoesProvider();

    // 3. Atualizar dados iniciais
    atualizarDataTopo();
    carregarNoticias();
    carregarClima();
    carregarCambio();

    // 4. Configurar eventos de acessibilidade e modais
    configurarEventosTeclado();
    configurarFechamentoBackdrop();

    // 5. Polling periódico em segundo plano
    setInterval(carregarCambio, 300000); // 5 minutos
    setInterval(carregarClima, 600000);  // 10 minutos
    setInterval(atualizarDataTopo, 60000); // 1 minuto
});

/* ==========================================================================
   Gerenciamento do Modo Claro / Escuro
   ========================================================================== */
function toggleTheme() {
    const novoTema = state.tema === 'dark' ? 'light' : 'dark';
    state.tema = novoTema;
    localStorage.setItem('infonews_theme', novoTema);
    aplicarTema(novoTema);
}

function aplicarTema(t) {
    const html = document.documentElement;
    const btnTheme = document.getElementById('btn-theme');
    const icon = btnTheme ? btnTheme.querySelector('i') : null;

    if (t === 'light') {
        html.classList.remove('dark');
        html.setAttribute('data-theme', 'light');
        if (icon) {
            icon.className = 'fa-solid fa-moon text-base text-amber-500 dark:text-amber-400';
        }
        if (btnTheme) {
            btnTheme.setAttribute('title', 'Alternar para Modo Escuro');
            btnTheme.setAttribute('aria-label', 'Alternar para Modo Escuro');
        }
    } else {
        html.classList.add('dark');
        html.setAttribute('data-theme', 'dark');
        if (icon) {
            icon.className = 'fa-solid fa-sun text-base text-amber-400';
        }
        if (btnTheme) {
            btnTheme.setAttribute('title', 'Alternar para Modo Claro');
            btnTheme.setAttribute('aria-label', 'Alternar para Modo Claro');
        }
    }

    atualizarClassesBotoesFiltro();
}

/* ==========================================================================
   Cotações e Câmbio (AwesomeAPI)
   ========================================================================== */
async function carregarCambio() {
    try {
        const res = await fetchWithTimeout('https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,BTC-BRL', {}, 7000);
        if (!res.ok) return;
        const data = await res.json();

        // Dólar Comercial
        if (data.USDBRL) {
            const valorDolar = parseFloat(data.USDBRL.bid).toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
            const variacaoDolar = parseFloat(data.USDBRL.pctChange);
            const elVal = document.getElementById('cambio-dolar-val');
            const elArrow = document.getElementById('cambio-dolar-arrow');
            const elDesc = document.getElementById('cambio-dolar-desc');

            if (elVal) elVal.innerText = valorDolar;
            if (elArrow) {
                if (variacaoDolar >= 0) {
                    elArrow.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
                    elArrow.className = 'text-emerald-500 dark:text-emerald-400 text-[11px]';
                    if (elVal) elVal.className = 'text-emerald-600 dark:text-emerald-400 font-mono';
                    if (elDesc) elDesc.innerText = 'em alta';
                } else {
                    elArrow.innerHTML = '<i class="fa-solid fa-arrow-down"></i>';
                    elArrow.className = 'text-red-500 dark:text-red-400 text-[11px]';
                    if (elVal) elVal.className = 'text-red-600 dark:text-red-400 font-mono';
                    if (elDesc) elDesc.innerText = 'em queda';
                }
            }
        }

        // Euro
        if (data.EURBRL) {
            const valorEuro = parseFloat(data.EURBRL.bid).toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
            const variacaoEuro = parseFloat(data.EURBRL.pctChange);
            const elVal = document.getElementById('cambio-euro-val');
            const elArrow = document.getElementById('cambio-euro-arrow');
            const elDesc = document.getElementById('cambio-euro-desc');

            if (elVal) elVal.innerText = valorEuro;
            if (elArrow) {
                if (variacaoEuro >= 0) {
                    elArrow.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
                    elArrow.className = 'text-emerald-500 dark:text-emerald-400 text-[11px]';
                    if (elVal) elVal.className = 'text-emerald-600 dark:text-emerald-400 font-mono';
                    if (elDesc) elDesc.innerText = 'em alta';
                } else {
                    elArrow.innerHTML = '<i class="fa-solid fa-arrow-down"></i>';
                    elArrow.className = 'text-red-500 dark:text-red-400 text-[11px]';
                    if (elVal) elVal.className = 'text-red-600 dark:text-red-400 font-mono';
                    if (elDesc) elDesc.innerText = 'em queda';
                }
            }
        }

        // Bitcoin
        if (data.BTCBRL) {
            const btcK = (parseFloat(data.BTCBRL.bid) / 1000).toFixed(1);
            const elBtc = document.getElementById('cambio-btc-val');
            if (elBtc) elBtc.innerText = `R$ ${btcK}k`;
        }
    } catch (err) {
        console.warn('Falha ao carregar cotações:', err);
    }
}

/* ==========================================================================
   Previsão do Tempo Completa (Open-Meteo)
   ========================================================================== */
async function carregarClima() {
    const elCidade = document.getElementById('clima-cidade');
    const elAtualTemp = document.getElementById('clima-atual-temp');
    const elMax = document.getElementById('clima-max');
    const elMin = document.getElementById('clima-min');
    const elIcone = document.getElementById('clima-icone');
    const elUmidade = document.getElementById('clima-umidade');
    const elChuva = document.getElementById('clima-chuva');

    if (elCidade) elCidade.innerText = state.cidadeClima;

    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${state.climaCoords.lat}&longitude=${state.climaCoords.lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,apparent_temperature_min,sunrise,sunset,precipitation_probability_max,uv_index_max&hourly=temperature_2m,precipitation_probability,weather_code&timezone=auto&forecast_days=7`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();

        // 1. Condições Atuais
        if (data.current) {
            const tempAtual = Math.round(data.current.temperature_2m);
            const wmo = getWMODetalhado(data.current.weather_code);
            const umidade = data.current.relative_humidity_2m;
            const sensacao = Math.round(data.current.apparent_temperature);
            const vento = Math.round(data.current.wind_speed_10m);
            const ventoDir = getDirecaoVento(data.current.wind_direction_10m);
            const precipVol = (data.current.precipitation || 0).toFixed(1);

            if (elAtualTemp) elAtualTemp.innerText = `${tempAtual}°C`;
            if (elIcone) elIcone.innerHTML = `<i class="fa-solid ${wmo.icone} ${wmo.cor}"></i>`;
            if (elUmidade) elUmidade.innerText = `${umidade}%`;

            const elMeteoCidade = document.getElementById('meteo-atual-cidade');
            const elMeteoCond = document.getElementById('meteo-atual-condicao');
            const elMeteoTemp = document.getElementById('meteo-atual-temp');
            const elMeteoSens = document.getElementById('meteo-atual-sensacao');
            const elMeteoIconeG = document.getElementById('meteo-atual-icone-grande');
            const elMeteoHorario = document.getElementById('meteo-atual-horario');

            if (elMeteoCidade) elMeteoCidade.innerText = state.cidadeClima;
            if (elMeteoCond) elMeteoCond.innerText = wmo.descricao;
            if (elMeteoTemp) elMeteoTemp.innerText = tempAtual;
            if (elMeteoSens) elMeteoSens.innerText = `${sensacao}°C`;
            if (elMeteoIconeG) elMeteoIconeG.innerHTML = `<i class="fa-solid ${wmo.icone} ${wmo.cor}"></i>`;
            if (elMeteoHorario) {
                const agora = new Date();
                elMeteoHorario.innerText = `Atualizado às ${agora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
            }

            const cardSensacao = document.getElementById('meteo-card-sensacao');
            const cardUmidade = document.getElementById('meteo-card-umidade');
            const cardUmidadeDesc = document.getElementById('meteo-card-umidade-desc');
            const cardVento = document.getElementById('meteo-card-vento');
            const cardVentoDir = document.getElementById('meteo-card-vento-dir');
            const cardPrecipVol = document.getElementById('meteo-card-precip-vol');

            if (cardSensacao) cardSensacao.innerText = `${sensacao}°C`;
            if (cardUmidade) cardUmidade.innerText = `${umidade}%`;
            if (cardUmidadeDesc) cardUmidadeDesc.innerText = getNivelUmidade(umidade);
            if (cardVento) cardVento.innerText = `${vento} km/h`;
            if (cardVentoDir) cardVentoDir.innerText = `${ventoDir} (${data.current.wind_direction_10m}°)`;
            if (cardPrecipVol) cardPrecipVol.innerText = `${precipVol} mm acumulados`;
        }

        // 2. Dados Diários (7 dias)
        if (data.daily && data.daily.time && data.daily.time.length > 0) {
            const maxTemp = Math.round(data.daily.temperature_2m_max[0]);
            const minTemp = Math.round(data.daily.temperature_2m_min[0]);
            const chuvaMax = data.daily.precipitation_probability_max ? data.daily.precipitation_probability_max[0] : 0;
            const uvMax = data.daily.uv_index_max ? Math.round(data.daily.uv_index_max[0]) : 0;
            const nascer = formatarHoraISO(data.daily.sunrise ? data.daily.sunrise[0] : '');
            const por = formatarHoraISO(data.daily.sunset ? data.daily.sunset[0] : '');

            if (elMax) elMax.innerText = `${maxTemp}°`;
            if (elMin) elMin.innerText = `${minTemp}°`;
            if (elChuva) elChuva.innerText = `${chuvaMax}%`;

            const heroMax = document.getElementById('meteo-hero-max');
            const heroMin = document.getElementById('meteo-hero-min');
            if (heroMax) heroMax.innerText = `Máx ${maxTemp}°C`;
            if (heroMin) heroMin.innerText = `Mín ${minTemp}°C`;

            const cardChuva = document.getElementById('meteo-card-chuva');
            const cardUV = document.getElementById('meteo-card-uv');
            const cardUVDesc = document.getElementById('meteo-card-uv-desc');
            const cardNascer = document.getElementById('meteo-card-nascer');
            const cardPor = document.getElementById('meteo-card-por');

            if (cardChuva) cardChuva.innerText = `${chuvaMax}%`;
            if (cardUV) cardUV.innerText = `${uvMax}`;
            if (cardUVDesc) cardUVDesc.innerText = getNivelUV(uvMax);
            if (cardNascer) cardNascer.innerText = nascer;
            if (cardPor) cardPor.innerText = por;

            renderizarPrevisao7Dias(data.daily);
        }

        // 3. Previsão Hora a Hora (24h)
        if (data.hourly && data.hourly.time) {
            renderizarHoraAHora(data.hourly);
        }

    } catch (err) {
        console.warn('Falha ao obter clima expandido:', err);
    }
}

function renderizarPrevisao7Dias(daily) {
    const container = document.getElementById('meteo-previsao-7dias');
    if (!container) return;
    container.innerHTML = '';
    const nomesDias = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    for (let i = 0; i < daily.time.length; i++) {
        const dataObj = new Date(daily.time[i] + 'T00:00:00');
        const diaSemana = i === 0 ? 'Hoje' : (i === 1 ? 'Amanhã' : nomesDias[dataObj.getDay()]);
        const dataFormatada = `${String(dataObj.getDate()).padStart(2, '0')}/${String(dataObj.getMonth() + 1).padStart(2, '0')}`;
        const wmo = getWMODetalhado(daily.weather_code[i]);
        const max = Math.round(daily.temperature_2m_max[i]);
        const min = Math.round(daily.temperature_2m_min[i]);
        const probChuva = daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : 0;

        const row = document.createElement('div');
        row.className = 'bg-slate-50 dark:bg-slate-800/80 rounded-xl p-3 border border-slate-200 dark:border-slate-750 flex items-center justify-between gap-3 text-xs';
        row.innerHTML = `
            <div class="w-24 sm:w-28">
                <span class="font-bold text-slate-900 dark:text-white">${diaSemana}</span>
                <span class="text-[11px] text-slate-400 block">${dataFormatada}</span>
            </div>
            <div class="flex items-center gap-2 flex-grow">
                <span class="text-base text-sky-500 w-6 text-center">
                    <i class="fa-solid ${wmo.icone} ${wmo.cor}"></i>
                </span>
                <span class="text-[11px] text-slate-600 dark:text-slate-300 font-medium hidden sm:inline truncate max-w-[160px]">
                    ${wmo.descricao}
                </span>
            </div>
            <div class="w-16 text-center">
                ${probChuva > 0 ? `
                    <span class="inline-flex items-center gap-1 text-[11px] font-semibold text-sky-500 bg-sky-500/10 dark:bg-sky-500/20 px-2 py-0.5 rounded-md">
                        <i class="fa-solid fa-droplet text-[9px]"></i> ${probChuva}%
                    </span>
                ` : `<span class="text-[11px] text-slate-400">0%</span>`}
            </div>
            <div class="flex items-center gap-2 w-28 sm:w-36 justify-end font-mono">
                <span class="text-sky-500 dark:text-sky-400 font-bold">${min}°</span>
                <div class="w-12 sm:w-16 temp-bar-bg hidden sm:block"></div>
                <span class="text-red-500 font-bold">${max}°</span>
            </div>
        `;
        container.appendChild(row);
    }
}

function renderizarHoraAHora(hourly) {
    const container = document.getElementById('meteo-hora-a-hora');
    if (!container) return;
    container.innerHTML = '';
    const agora = new Date();
    const horaAtual = agora.getHours();

    let indiceInicio = 0;
    for (let i = 0; i < hourly.time.length; i++) {
        const hDate = new Date(hourly.time[i]);
        if (hDate >= agora || (hDate.getDate() === agora.getDate() && hDate.getHours() === horaAtual)) {
            indiceInicio = i;
            break;
        }
    }

    const limite = Math.min(indiceInicio + 24, hourly.time.length);
    for (let i = indiceInicio; i < limite; i++) {
        const dataHora = new Date(hourly.time[i]);
        const horaStr = dataHora.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
        const temp = Math.round(hourly.temperature_2m[i]);
        const code = hourly.weather_code[i];
        const wmo = getWMODetalhado(code);
        const probChuva = hourly.precipitation_probability ? hourly.precipitation_probability[i] : 0;
        const eAgora = i === indiceInicio;

        const card = document.createElement('div');
        card.className = `flex-shrink-0 w-20 rounded-xl p-2.5 flex flex-col items-center justify-between text-center border transition ${eAgora ? 'bg-sky-500/15 border-sky-500/50 shadow-sm' : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-750'}`;
        card.innerHTML = `
            <span class="text-[11px] font-bold ${eAgora ? 'text-sky-600 dark:text-sky-300' : 'text-slate-500 dark:text-slate-400'}">
                ${eAgora ? 'Agora' : horaStr}
            </span>
            <span class="text-xl my-1.5"><i class="fa-solid ${wmo.icone} ${wmo.cor}"></i></span>
            <span class="text-sm font-extrabold text-slate-900 dark:text-white font-mono">${temp}°</span>
            <span class="text-[10px] text-sky-500 font-semibold mt-1 flex items-center gap-0.5">
                <i class="fa-solid fa-droplet text-[8px]"></i> ${probChuva}%
            </span>
        `;
        container.appendChild(card);
    }
}

function getWMODetalhado(code) {
    const mapa = {
        0: { descricao: 'Céu Limpo Ensolarado', icone: 'fa-sun', cor: 'text-amber-500 dark:text-amber-400' },
        1: { descricao: 'Predominantemente Limpo', icone: 'fa-cloud-sun', cor: 'text-amber-500 dark:text-amber-300' },
        2: { descricao: 'Sol Entre Nuvens', icone: 'fa-cloud-sun', cor: 'text-amber-500 dark:text-amber-300' },
        3: { descricao: 'Nublado / Encoberto', icone: 'fa-cloud', cor: 'text-slate-400 dark:text-slate-300' },
        45: { descricao: 'Nevoeiro / Neblina', icone: 'fa-smog', cor: 'text-slate-400' },
        48: { descricao: 'Nevoeiro Denso', icone: 'fa-smog', cor: 'text-slate-400' },
        51: { descricao: 'Chuvisco Fraco', icone: 'fa-cloud-rain', cor: 'text-sky-400' },
        53: { descricao: 'Chuvisco Moderado', icone: 'fa-cloud-rain', cor: 'text-sky-500' },
        55: { descricao: 'Garoa Contínua', icone: 'fa-cloud-rain', cor: 'text-sky-500' },
        61: { descricao: 'Chuva Leve', icone: 'fa-cloud-rain', cor: 'text-sky-500' },
        63: { descricao: 'Chuva Moderada', icone: 'fa-cloud-showers-heavy', cor: 'text-sky-500' },
        65: { descricao: 'Chuva Forte e Constante', icone: 'fa-cloud-showers-heavy', cor: 'text-blue-500' },
        80: { descricao: 'Pancadas de Chuva Rápidas', icone: 'fa-cloud-sun-rain', cor: 'text-sky-500' },
        81: { descricao: 'Pancadas de Chuva Moderadas', icone: 'fa-cloud-sun-rain', cor: 'text-sky-500' },
        82: { descricao: 'Tempestade de Chuva Intensa', icone: 'fa-cloud-showers-water', cor: 'text-indigo-500' },
        95: { descricao: 'Tempestade com Trovões', icone: 'fa-cloud-bolt', cor: 'text-yellow-500' },
        96: { descricao: 'Tempestade com Granizo Leve', icone: 'fa-cloud-bolt', cor: 'text-yellow-500' },
        99: { descricao: 'Tempestade Severa com Granizo', icone: 'fa-cloud-bolt', cor: 'text-yellow-500' }
    };
    return mapa[code] || { descricao: 'Tempo Instável', icone: 'fa-cloud-sun', cor: 'text-sky-400' };
}

function getDirecaoVento(graus) {
    if (graus >= 337.5 || graus < 22.5) return 'Norte';
    if (graus >= 22.5 && graus < 67.5) return 'Nordeste';
    if (graus >= 67.5 && graus < 112.5) return 'Leste';
    if (graus >= 112.5 && graus < 157.5) return 'Sudeste';
    if (graus >= 157.5 && graus < 202.5) return 'Sul';
    if (graus >= 202.5 && graus < 247.5) return 'Sudoeste';
    if (graus >= 247.5 && graus < 292.5) return 'Oeste';
    if (graus >= 292.5 && graus < 337.5) return 'Noroeste';
    return 'Variável';
}

function getNivelUmidade(u) {
    if (u < 30) return 'Ar muito seco (Atenção)';
    if (u <= 60) return 'Umidade ideal e saudável';
    if (u <= 80) return 'Umidade elevada';
    return 'Ar saturado / Chuva iminente';
}

function getNivelUV(uv) {
    if (uv <= 2) return 'Baixo (Sem risco)';
    if (uv <= 5) return 'Moderado (Use protetor)';
    if (uv <= 7) return 'Alto (Evite sol ao meio-dia)';
    if (uv <= 10) return 'Muito Alto (Proteção extra)';
    return 'Extremo (Perigo de radiação)';
}

function formatarHoraISO(iso) {
    if (!iso) return '--:--';
    const partes = iso.split('T');
    return partes.length > 1 ? partes.substring(0, 5) : iso;
}

// Gerenciamento de Acessibilidade (A11y / WAI-ARIA)
let elementoDisparadorModal = null;

function anunciarParaLeitor(mensagem) {
    const el = document.getElementById('aria-anunciador');
    if (el) {
        el.textContent = '';
        setTimeout(() => {
            el.textContent = mensagem;
        }, 60);
    }
}

function abrirModalMeteorologia(trigger = null) {
    elementoDisparadorModal = trigger || document.activeElement;
    const modal = document.getElementById('modal-meteorologia');
    const input = document.getElementById('input-busca-cidade-meteo');
    if (input) input.value = state.cidadeClima;
    if (modal) {
        modal.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
        if (input) setTimeout(() => input.focus(), 100);
        anunciarParaLeitor('Central Meteorológica aberta. Pressione Escape para fechar.');
    }
}

function fecharModalMeteorologia() {
    const modal = document.getElementById('modal-meteorologia');
    if (modal) {
        modal.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
        if (elementoDisparadorModal && typeof elementoDisparadorModal.focus === 'function') {
            elementoDisparadorModal.focus();
        }
        anunciarParaLeitor('Central Meteorológica fechada.');
    }
}

function abrirModalCidade(trigger = null) {
    abrirModalMeteorologia(trigger);
}

function fecharModalCidade() {
    fecharModalMeteorologia();
}

async function salvarCidadeMeteo(e) {
    e.preventDefault();
    const input = document.getElementById('input-busca-cidade-meteo');
    const nomeCidade = input ? input.value.trim() : '';
    if (!nomeCidade) return;

    try {
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(nomeCidade)}&count=1&language=pt&format=json`;
        const res = await fetch(geoUrl);
        const geoData = await res.json();

        if (geoData.results && geoData.results.length > 0) {
            const local = geoData.results[0];
            state.cidadeClima = `${local.name}${local.admin1 ? ' - ' + local.admin1 : ''}`;
            state.climaCoords = { lat: local.latitude, lon: local.longitude };

            localStorage.setItem('infonews_cidade', state.cidadeClima);
            localStorage.setItem('infonews_coords', JSON.stringify(state.climaCoords));

            await carregarClima();
            mostrarToast(`Previsão atualizada para ${state.cidadeClima}!`);
        } else {
            alert('Cidade não encontrada. Verifique o nome digitado e tente novamente.');
        }
    } catch (err) {
        alert('Erro ao buscar localização da cidade.');
    }
}

async function selecionarCidadeRapida(nome, lat, lon) {
    state.cidadeClima = nome;
    state.climaCoords = { lat, lon };

    localStorage.setItem('infonews_cidade', state.cidadeClima);
    localStorage.setItem('infonews_coords', JSON.stringify(state.climaCoords));

    await carregarClima();
    mostrarToast(`Localização alterada para ${nome}!`);
}

function detectarLocalizacaoGPS() {
    if (!navigator.geolocation) {
        alert('Geolocalização não é suportada pelo seu navegador.');
        return;
    }

    mostrarToast('Consultando seu GPS...');

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;

            state.cidadeClima = 'Localização Atual (GPS)';
            state.climaCoords = { lat, lon };

            localStorage.setItem('infonews_cidade', state.cidadeClima);
            localStorage.setItem('infonews_coords', JSON.stringify(state.climaCoords));

            await carregarClima();
            mostrarToast('Previsão atualizada com base no seu GPS!');
        },
        (error) => {
            alert('Não foi possível obter sua localização. Verifique se a permissão foi concedida.');
        },
        { timeout: 10000 }
    );
}

/* ==========================================================================
   Data Atual Formatada
   ========================================================================== */
function atualizarDataTopo() {
    const opt = { weekday: 'long', day: 'numeric', month: 'long' };
    const agora = new Date().toLocaleDateString('pt-BR', opt);
    const el = document.getElementById('data-topo');
    if (el) el.innerText = agora.charAt(0).toUpperCase() + agora.slice(1);
}

/* ==========================================================================
   Seleção de Nichos e Portais de Tecnologia
   ========================================================================== */
function selecionarCategoria(cat) {
    if (!['tecnologia', 'politica', 'brasil', 'mundo', 'economia'].includes(cat)) {
        cat = 'tecnologia';
    }
    state.categoriaAtual = cat;
    atualizarClassesBotoesFiltro();

    const barraTech = document.getElementById('barra-tech-portais');
    if (barraTech) {
        if (cat === 'tecnologia') {
            barraTech.classList.remove('hidden');
        } else {
            barraTech.classList.add('hidden');
        }
    }

    anunciarParaLeitor(`Nicho alterado para ${cat}. Carregando notícias...`);
    carregarNoticias();
}

function selecionarPortalTech(portalKey) {
    state.portalTechAtual = portalKey;
    atualizarClassesBotoesFiltro();
    const nomePortal = portalKey === 'todos' ? 'Todos os portais agregados' : (TECH_PORTAIS[portalKey]?.nome || portalKey);
    anunciarParaLeitor(`Filtrando notícias pelo portal: ${nomePortal}.`);
    carregarNoticias();
}

function atualizarClassesBotoesFiltro() {
    document.querySelectorAll('.cat-btn').forEach(btn => {
        const cat = btn.dataset.cat;
        if (cat === state.categoriaAtual) {
            btn.className = 'cat-btn px-3 py-1 rounded-full text-xs font-semibold bg-redbrand-600 text-white shadow-sm shadow-redbrand-600/30 flex items-center gap-1.5 whitespace-nowrap transition-colors';
            btn.setAttribute('aria-pressed', 'true');
        } else {
            btn.className = 'cat-btn px-3 py-1 rounded-full text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-750 transition flex items-center gap-1.5 whitespace-nowrap';
            btn.setAttribute('aria-pressed', 'false');
        }
    });

    document.querySelectorAll('.portal-btn').forEach(btn => {
        const portal = btn.dataset.portal;
        if (portal === state.portalTechAtual) {
            btn.className = 'portal-btn px-2.5 py-0.5 rounded-lg text-xs font-semibold bg-redbrand-500/15 text-redbrand-700 dark:bg-redbrand-600/30 dark:text-redbrand-300 border border-redbrand-500/50 whitespace-nowrap transition-colors';
            btn.setAttribute('aria-pressed', 'true');
        } else {
            btn.className = 'portal-btn px-2.5 py-0.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 whitespace-nowrap transition-colors';
            btn.setAttribute('aria-pressed', 'false');
        }
    });
}

/* ==========================================================================
   Carregamento de Notícias (Com Guard contra Spam & DoS)
   ========================================================================== */
async function carregarNoticias() {
    if (state.isCarregando) return; // Previne múltiplas requisições simultâneas concorrentes
    state.isCarregando = true;

    const grid = document.getElementById('grid-noticias');
    const loading = document.getElementById('loading');
    const empty = document.getElementById('estado-vazio');
    const iconRefresh = document.getElementById('icon-refresh');

    if (grid) grid.innerHTML = '';
    if (empty) empty.classList.add('hidden');
    if (loading) loading.classList.remove('hidden');
    if (iconRefresh) iconRefresh.classList.add('fa-spin');

    try {
        let items = [];
        if (state.provider === 'gnews') {
            items = await fetchFromGNews();
        } else if (state.provider === 'newsdata') {
            items = await fetchFromNewsData();
        } else {
            items = await fetchFromRSS();
        }

        if (!items || items.length === 0) {
            items = CONTINGENCY_NEWS;
        }

        state.todasNoticias = items;
        renderizarNoticias(items);
        anunciarParaLeitor(`${items.length} notícias carregadas.`);
    } catch (err) {
        console.error('Erro na requisição de notícias:', err);
        if (CONTINGENCY_NEWS.length > 0) {
            state.todasNoticias = CONTINGENCY_NEWS;
            renderizarNoticias(CONTINGENCY_NEWS);
            mostrarToast('Carregando notícias em cache (modo reserva)');
            anunciarParaLeitor('Carregando notícias em cache de reserva.');
        } else {
            if (empty) {
                empty.classList.remove('hidden');
                const msg = document.getElementById('msg-estado-vazio');
                if (msg) msg.innerText = `Não foi possível carregar os portais no momento. Tente recarregar em instantes.`;
                anunciarParaLeitor('Nenhuma notícia encontrada.');
            }
        }
    } finally {
        state.isCarregando = false;
        if (loading) loading.classList.add('hidden');
        if (iconRefresh) iconRefresh.classList.remove('fa-spin');
    }
}

async function fetchSingleRssFeed(feedObj) {
    // 1. Tenta primeiro a Serverless Function Netlify com cache na borda (elimina rate limits e adulteração)
    const netlifyProxyUrl = `/.netlify/functions/rss-proxy?url=${encodeURIComponent(feedObj.url)}`;
    const publicProxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedObj.url)}`;

    let data;
    try {
        const netlifyRes = await fetchWithTimeout(netlifyProxyUrl, {}, 6000);
        if (netlifyRes.ok) {
            const netlifyData = await netlifyRes.json();
            if (netlifyData && netlifyData.status === 'ok' && Array.isArray(netlifyData.items)) {
                data = netlifyData;
            }
        }
    } catch (e) {
        // Ambiente local sem Netlify Functions ativo: fallback automático para proxy público
    }

    if (!data) {
        const res = await fetchWithTimeout(publicProxyUrl, {}, 8000);
        if (!res.ok) throw new Error(`Falha HTTP ao acessar ${feedObj.nome}`);
        data = await res.json();
    }

    if (data.status !== 'ok' || !data.items) return [];

    const parser = new DOMParser();

    return data.items.map(item => {
        let imagem = item.thumbnail || item.enclosure?.link;
        if (!imagem && item.description) {
            const match = item.description.match(/<img[^>]+src="([^">]+)"/);
            if (match) imagem = match[1];
        }

        // Sanitização segura de texto sem injeção direta no DOM
        let cleanDesc = '';
        if (item.description) {
            const parsedDoc = parser.parseFromString(item.description, 'text/html');
            cleanDesc = (parsedDoc.body.textContent || '').trim();
        }

        return {
            titulo: item.title ? String(item.title).trim() : 'Sem título',
            link: sanitizeUrl(item.link),
            resumo: cleanDesc || 'Clique no link para conferir a reportagem completa.',
            dataRaw: item.pubDate ? new Date(item.pubDate) : new Date(),
            data: item.pubDate ? new Date(item.pubDate).toLocaleString('pt-BR') : 'Recente',
            fonte: feedObj.nome,
            badgeColor: feedObj.badgeColor || 'bg-red-500/10 text-redbrand-600 dark:bg-redbrand-600/20 dark:text-redbrand-400 border-redbrand-500/30',
            imagem: sanitizeImageUrl(imagem, getImagemFallback(state.categoriaAtual))
        };
    });
}

async function fetchFromRSS() {
    const elFonteAtiva = document.getElementById('txt-fonte-ativa');

    if (state.categoriaAtual === 'tecnologia') {
        if (state.portalTechAtual === 'todos') {
            if (elFonteAtiva) elFonteAtiva.innerText = 'Agregador Tech (10 Portais Especializados)';

            const portaisParaBuscar = ['canaltech', 'tecnoblog', 'techtudo', 'olhardigital', 'tecmundo', 'oficinadanet'];
            const promises = portaisParaBuscar.map(key => fetchSingleRssFeed(TECH_PORTAIS[key]));
            const resultados = await Promise.allSettled(promises);

            let consolidado = [];
            resultados.forEach(r => {
                if (r.status === 'fulfilled' && Array.isArray(r.value)) {
                    consolidado = consolidado.concat(r.value);
                }
            });

            if (consolidado.length === 0) {
                return CONTINGENCY_NEWS;
            }

            consolidado.sort((a, b) => b.dataRaw - a.dataRaw);
            return consolidado;
        } else {
            const portalObj = TECH_PORTAIS[state.portalTechAtual];
            if (!portalObj) throw new Error('Portal não configurado');
            if (elFonteAtiva) elFonteAtiva.innerText = `${portalObj.nome} (Feed Oficial)`;
            return await fetchSingleRssFeed(portalObj);
        }
    }

    const feedGeral = GENERAL_FEEDS[state.categoriaAtual] || GENERAL_FEEDS.brasil;
    if (elFonteAtiva) elFonteAtiva.innerText = `${feedGeral.nome} (RSS)`;
    return await fetchSingleRssFeed({
        nome: feedGeral.nome,
        url: feedGeral.url,
        badgeColor: 'bg-red-500/10 text-redbrand-600 dark:bg-redbrand-600/20 dark:text-redbrand-400 border-redbrand-500/30'
    });
}

async function fetchFromGNews() {
    if (!state.apiKey) throw new Error('Insira sua API Key do GNews no menu de configurações');
    const elFonteAtiva = document.getElementById('txt-fonte-ativa');
    if (elFonteAtiva) elFonteAtiva.innerText = 'GNews API';

    let gnewsCat = 'technology';
    if (state.categoriaAtual === 'politica') gnewsCat = 'nation';
    else if (state.categoriaAtual === 'brasil') gnewsCat = 'general';
    else if (state.categoriaAtual === 'mundo') gnewsCat = 'world';
    else if (state.categoriaAtual === 'economia') gnewsCat = 'business';

    const url = `https://gnews.io/api/v4/top-headlines?category=${encodeURIComponent(gnewsCat)}&lang=pt&country=br&apikey=${encodeURIComponent(state.apiKey)}`;
    const res = await fetchWithTimeout(url, {}, 8000);
    const data = await res.json();

    if (data.errors) throw new Error(data.errors[0]);

    return (data.articles || []).map(art => ({
        titulo: art.title ? String(art.title).trim() : 'Sem título',
        link: sanitizeUrl(art.url),
        resumo: art.description ? String(art.description).trim() : 'Sem descrição.',
        data: new Date(art.publishedAt).toLocaleString('pt-BR'),
        dataRaw: new Date(art.publishedAt),
        fonte: art.source?.name ? String(art.source.name).trim() : 'GNews',
        badgeColor: 'bg-red-500/10 text-redbrand-600 dark:bg-redbrand-600/20 dark:text-redbrand-400 border-redbrand-500/30',
        imagem: sanitizeImageUrl(art.image, getImagemFallback(state.categoriaAtual))
    }));
}

async function fetchFromNewsData() {
    if (!state.apiKey) throw new Error('Insira sua API Key do NewsData no menu de configurações');
    const elFonteAtiva = document.getElementById('txt-fonte-ativa');
    if (elFonteAtiva) elFonteAtiva.innerText = 'NewsData.io API';

    let cat = 'technology';
    if (state.categoriaAtual === 'politica') cat = 'politics';
    else if (state.categoriaAtual === 'brasil') cat = 'top';
    else if (state.categoriaAtual === 'mundo') cat = 'world';
    else if (state.categoriaAtual === 'economia') cat = 'business';

    const url = `https://newsdata.io/api/1/news?apikey=${encodeURIComponent(state.apiKey)}&country=br&category=${encodeURIComponent(cat)}`;
    const res = await fetchWithTimeout(url, {}, 8000);
    const data = await res.json();

    if (data.status === 'error') throw new Error(data.results?.message || 'Erro NewsData');

    return (data.results || []).map(item => ({
        titulo: item.title ? String(item.title).trim() : 'Sem título',
        link: sanitizeUrl(item.link),
        resumo: item.description ? String(item.description).trim() : 'Sem descrição.',
        data: item.pubDate ? new Date(item.pubDate).toLocaleString('pt-BR') : 'Recente',
        dataRaw: item.pubDate ? new Date(item.pubDate) : new Date(),
        fonte: item.source_id ? String(item.source_id).trim() : 'NewsData',
        badgeColor: 'bg-red-500/10 text-redbrand-600 dark:bg-redbrand-600/20 dark:text-redbrand-400 border-redbrand-500/30',
        imagem: sanitizeImageUrl(item.image_url, getImagemFallback(state.categoriaAtual))
    }));
}

/* ==========================================================================
   Renderização Segura dos Cards (Proteção contra XSS e Injeção de Atributos)
   ========================================================================== */
function renderizarNoticias(lista) {
    const grid = document.getElementById('grid-noticias');
    const empty = document.getElementById('estado-vazio');
    const contador = document.getElementById('contador-noticias');

    if (!grid) return;
    grid.innerHTML = '';
    if (contador) contador.innerText = `${lista.length} notícias`;

    if (lista.length === 0) {
        if (empty) empty.classList.remove('hidden');
        return;
    }
    if (empty) empty.classList.add('hidden');

    const fallbackUrl = getImagemFallback(state.categoriaAtual);

    lista.forEach(n => {
        const card = document.createElement('article');
        card.className = 'news-card bg-white dark:bg-slate-800/95 rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-700/80 hover:border-redbrand-500/50 shadow-sm hover:shadow-xl dark:shadow-slate-950/40 hover:shadow-redbrand-600/10 transition-all duration-300 flex flex-col group';

        const safeTitulo = escapeHTML(n.titulo);
        const safeResumo = escapeHTML(n.resumo);
        const safeFonte = escapeHTML(n.fonte);
        const safeLink = sanitizeUrl(n.link);
        const safeImage = sanitizeImageUrl(n.imagem, fallbackUrl);
        const safeDate = escapeHTML(n.data);
        const safeIsoDate = n.dataRaw ? escapeHTML(new Date(n.dataRaw).toISOString()) : '';

        card.innerHTML = `
            <div class="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
                <img 
                    src="${safeImage}" 
                    alt="${safeTitulo}" 
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                >
                <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>
                <span class="absolute top-3 left-3 bg-white/95 dark:bg-slate-900/90 backdrop-blur text-[11px] font-bold px-2.5 py-1 rounded-full border ${n.badgeColor || 'text-redbrand-600 dark:text-redbrand-400 border-redbrand-500/30'} shadow-sm">
                    ${safeFonte}
                </span>
            </div>

            <div class="p-5 flex flex-col flex-grow justify-between">
                <div>
                    <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                        <i class="fa-regular fa-clock text-redbrand-500"></i>
                        <time datetime="${safeIsoDate}">${safeDate}</time>
                    </div>
                    <h2 class="text-base font-bold text-slate-900 dark:text-white group-hover:text-redbrand-600 dark:group-hover:text-redbrand-400 transition-colors line-clamp-2 mb-2 leading-snug">
                        <a href="${safeLink}" target="_blank" rel="noopener noreferrer" class="focus:outline-none focus-visible:underline">
                            ${safeTitulo} <span class="sr-only">(abre em nova aba)</span>
                        </a>
                    </h2>
                    <p class="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 mb-4 leading-relaxed">
                        ${safeResumo}
                    </p>
                </div>

                <div class="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                    <a 
                        href="${safeLink}" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        class="inline-flex items-center gap-1.5 text-xs font-bold text-redbrand-600 dark:text-redbrand-500 hover:text-redbrand-700 dark:hover:text-redbrand-400 transition focus:outline-none focus-visible:underline"
                        aria-label="Ler notícia completa no ${safeFonte} (abre em nova aba)"
                    >
                        Ler no ${safeFonte} <i class="fa-solid fa-arrow-up-right-from-square text-[10px]" aria-hidden="true"></i>
                    </a>
                    <button 
                        type="button"
                        class="btn-share text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-redbrand-500" 
                        title="Compartilhar notícia"
                        aria-label="Compartilhar notícia: ${safeTitulo}"
                    >
                        <i class="fa-solid fa-share-nodes text-xs" aria-hidden="true"></i>
                    </button>
                </div>
            </div>
        `;

        // Event listener seguro para imagens com fallback
        const imgEl = card.querySelector('img');
        if (imgEl) {
            imgEl.addEventListener('error', () => {
                imgEl.src = fallbackUrl;
            }, { once: true });
        }

        // Event listener seguro para compartilhamento (sem concatenação frágil em inline onclick)
        const btnShare = card.querySelector('.btn-share');
        if (btnShare) {
            btnShare.addEventListener('click', () => {
                compartilhar(n.titulo, n.link);
            });
        }

        grid.appendChild(card);
    });
}

/* ==========================================================================
   Filtragem por Texto
   ========================================================================== */
function filtrarPorTexto() {
    const input = document.getElementById('input-busca');
    const q = input ? input.value.toLowerCase().trim().substring(0, 100) : '';
    if (!q) {
        renderizarNoticias(state.todasNoticias);
        anunciarParaLeitor(`Exibindo todas as ${state.todasNoticias.length} notícias.`);
        return;
    }
    const filtradas = state.todasNoticias.filter(n =>
        (n.titulo && n.titulo.toLowerCase().includes(q)) ||
        (n.resumo && n.resumo.toLowerCase().includes(q)) ||
        (n.fonte && n.fonte.toLowerCase().includes(q))
    );
    renderizarNoticias(filtradas);
    anunciarParaLeitor(`${filtradas.length} notícias encontradas para a busca.`);
}

/* ==========================================================================
   Modais: Configurações & Acessibilidade
   ========================================================================== */
function toggleSettingsModal(trigger = null) {
    const modal = document.getElementById('modal-settings');
    if (!modal) return;
    const isFechando = !modal.classList.contains('hidden');

    if (isFechando) {
        modal.classList.add('hidden');
        document.body.classList.remove('overflow-hidden');
        if (elementoDisparadorModal && typeof elementoDisparadorModal.focus === 'function') {
            elementoDisparadorModal.focus();
        }
        anunciarParaLeitor('Configurações fechadas.');
    } else {
        elementoDisparadorModal = trigger || document.activeElement;
        modal.classList.remove('hidden');
        document.body.classList.add('overflow-hidden');
        const select = document.getElementById('select-provider');
        if (select) setTimeout(() => select.focus(), 100);
        anunciarParaLeitor('Janela de configurações aberta. Pressione Escape para fechar.');
    }
}

function atualizarOpcoesProvider() {
    const select = document.getElementById('select-provider');
    const prov = select ? select.value : 'rss';
    const grpApiKey = document.getElementById('grupo-apikey');
    const dica = document.getElementById('dica-apikey');

    if (grpApiKey) {
        if (prov === 'rss') {
            grpApiKey.classList.add('hidden');
        } else {
            grpApiKey.classList.remove('hidden');
            if (dica) {
                if (prov === 'gnews') {
                    dica.innerHTML = 'Obtenha sua chave gratuita em <a href="https://gnews.io" target="_blank" rel="noopener noreferrer" class="text-redbrand-500 hover:underline focus:outline-none focus-visible:underline">gnews.io</a> (100 req/dia).';
                } else if (prov === 'newsdata') {
                    dica.innerHTML = 'Obtenha sua chave gratuita em <a href="https://newsdata.io" target="_blank" rel="noopener noreferrer" class="text-redbrand-500 hover:underline focus:outline-none focus-visible:underline">newsdata.io</a> (200 créditos/dia).';
                }
            }
        }
    }
}

function salvarConfiguracoes() {
    const select = document.getElementById('select-provider');
    const input = document.getElementById('input-apikey');

    state.provider = select ? select.value : 'rss';
    state.apiKey = input ? input.value.trim().substring(0, 200) : '';

    localStorage.setItem('infonews_provider', state.provider);
    localStorage.setItem('infonews_apikey', state.apiKey);

    toggleSettingsModal();
    carregarNoticias();
    mostrarToast('Configurações salvas com sucesso!');
}

function configurarEventosTeclado() {
    document.addEventListener('keydown', (e) => {
        const modalMeteo = document.getElementById('modal-meteorologia');
        const modalSettings = document.getElementById('modal-settings');
        const modalMeteoAberto = modalMeteo && !modalMeteo.classList.contains('hidden');
        const modalSettingsAberto = modalSettings && !modalSettings.classList.contains('hidden');
        const modalAtivo = modalMeteoAberto ? modalMeteo : (modalSettingsAberto ? modalSettings : null);

        if (e.key === 'Escape') {
            if (modalMeteoAberto) {
                fecharModalMeteorologia();
            }
            if (modalSettingsAberto) {
                toggleSettingsModal();
            }
            return;
        }

        // Focus Trap dentro do modal ativo (Critério WCAG 2.1.2 - No Keyboard Trap)
        if (e.key === 'Tab' && modalAtivo) {
            const focusables = modalAtivo.querySelectorAll(
                'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
            );
            if (!focusables || focusables.length === 0) return;

            const firstElement = focusables[0];
            const lastElement = focusables[focusables.length - 1];

            if (e.shiftKey) {
                if (document.activeElement === firstElement) {
                    e.preventDefault();
                    lastElement.focus();
                }
            } else {
                if (document.activeElement === lastElement) {
                    e.preventDefault();
                    firstElement.focus();
                }
            }
        }
    });
}

function configurarFechamentoBackdrop() {
    ['modal-meteorologia', 'modal-settings'].forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    if (modalId === 'modal-meteorologia') {
                        fecharModalMeteorologia();
                    } else {
                        toggleSettingsModal();
                    }
                }
            });
        }
    });
}

/* ==========================================================================
   Compartilhamento e Notificações (Toast)
   ========================================================================== */
function compartilhar(titulo, url) {
    const tituloLimpo = String(titulo || 'InfoNews').trim();
    const urlLimpa = sanitizeUrl(url);

    if (navigator.share) {
        navigator.share({ title: tituloLimpo, url: urlLimpa }).catch(() => {});
    } else {
        navigator.clipboard.writeText(`${tituloLimpo} - ${urlLimpa}`).then(() => {
            mostrarToast('Link copiado para a área de transferência!');
        }).catch(() => {
            mostrarToast('Não foi possível copiar o link.');
        });
    }
}

function mostrarToast(mensagem) {
    let toast = document.getElementById('toast-feedback');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-feedback';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        toast.setAttribute('aria-atomic', 'true');
        toast.className = 'fixed bottom-5 right-5 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 border border-slate-700 dark:border-slate-200 transition-all duration-300 transform translate-y-10 opacity-0 pointer-events-none';
        document.body.appendChild(toast);
    }
    const safeMsg = escapeHTML(mensagem);
    toast.innerHTML = `<i class="fa-solid fa-circle-check text-redbrand-500" aria-hidden="true"></i> <span>${safeMsg}</span>`;
    toast.classList.remove('translate-y-10', 'opacity-0', 'pointer-events-none');
    anunciarParaLeitor(mensagem);
    setTimeout(() => {
        toast.classList.add('translate-y-10', 'opacity-0', 'pointer-events-none');
    }, 3000);
}

/* ==========================================================================
   Imagens de Fallback por Categoria
   ========================================================================== */
function getImagemFallback(cat) {
    const placeholders = {
        tecnologia: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
        politica: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?auto=format&fit=crop&w=800&q=80',
        brasil: 'https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?auto=format&fit=crop&w=800&q=80',
        mundo: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=800&q=80',
        economia: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=800&q=80'
    };
    return placeholders[cat] || placeholders.tecnologia;
}
