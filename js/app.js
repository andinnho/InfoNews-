/**
 * InfoNews - Core Application Logic
 * Gerenciamento de Estado, Consumo de APIs (RSS, Open-Meteo, AwesomeAPI)
 * Controle de Tema Claro/Escuro, Filtros e Acessibilidade
 */

// Estado Global da Aplicação
const state = {
    categoriaAtual: 'tecnologia',
    portalTechAtual: 'todos',
    provider: localStorage.getItem('infonews_provider') || 'rss',
    apiKey: localStorage.getItem('infonews_apikey') || '',
    cidadeClima: localStorage.getItem('infonews_cidade') || 'São Paulo',
    climaCoords: JSON.parse(localStorage.getItem('infonews_coords')) || { lat: -23.5475, lon: -46.6361 },
    noticias: [],
    todasNoticias: [],
    tema: localStorage.getItem('infonews_theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
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

// Notícias de Contingência para caso todas as fontes externas ou limites de rate-limit falhem
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

    // Reaplicar estilos de botões para manter consistência das classes ativas/inativas
    atualizarClassesBotoesFiltro();
}

/* ==========================================================================
   Cotações e Câmbio (AwesomeAPI)
   ========================================================================== */
async function carregarCambio() {
    try {
        const res = await fetch('https://economia.awesomeapi.com.br/json/last/USD-BRL,EUR-BRL,BTC-BRL');
        if (!res.ok) return;
        const data = await res.json();

        // Dólar Comercial
        if (data.USDBRL) {
            const valorDolar = parseFloat(data.USDBRL.bid).toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
            const variacaoDolar = parseFloat(data.USDBRL.pctChange);
            const elVal = document.getElementById('cambio-dolar-val');
            const elArrow = document.getElementById('cambio-dolar-arrow');

            if (elVal) elVal.innerText = valorDolar;
            if (elArrow) {
                if (variacaoDolar >= 0) {
                    elArrow.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
                    elArrow.className = 'text-emerald-500 dark:text-emerald-400 text-[11px]';
                    if (elVal) elVal.className = 'text-emerald-600 dark:text-emerald-400 font-mono';
                } else {
                    elArrow.innerHTML = '<i class="fa-solid fa-arrow-down"></i>';
                    elArrow.className = 'text-red-500 dark:text-red-400 text-[11px]';
                    if (elVal) elVal.className = 'text-red-600 dark:text-red-400 font-mono';
                }
            }
        }

        // Euro
        if (data.EURBRL) {
            const valorEuro = parseFloat(data.EURBRL.bid).toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });
            const variacaoEuro = parseFloat(data.EURBRL.pctChange);
            const elVal = document.getElementById('cambio-euro-val');
            const elArrow = document.getElementById('cambio-euro-arrow');

            if (elVal) elVal.innerText = valorEuro;
            if (elArrow) {
                if (variacaoEuro >= 0) {
                    elArrow.innerHTML = '<i class="fa-solid fa-arrow-up"></i>';
                    elArrow.className = 'text-emerald-500 dark:text-emerald-400 text-[11px]';
                    if (elVal) elVal.className = 'text-emerald-600 dark:text-emerald-400 font-mono';
                } else {
                    elArrow.innerHTML = '<i class="fa-solid fa-arrow-down"></i>';
                    elArrow.className = 'text-red-500 dark:text-red-400 text-[11px]';
                    if (elVal) elVal.className = 'text-red-600 dark:text-red-400 font-mono';
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
   Previsão do Tempo (Open-Meteo)
   ========================================================================== */
async function carregarClima() {
    const elCidade = document.getElementById('clima-cidade');
    const elMax = document.getElementById('clima-max');
    const elMin = document.getElementById('clima-min');
    const elIcone = document.getElementById('clima-icone');

    if (elCidade) elCidade.innerText = state.cidadeClima;

    try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${state.climaCoords.lat}&longitude=${state.climaCoords.lon}&daily=temperature_2m_max,temperature_2m_min,weather_code&timezone=auto&forecast_days=1`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();

        if (data.daily) {
            const maxTemp = Math.round(data.daily.temperature_2m_max[0]);
            const minTemp = Math.round(data.daily.temperature_2m_min[0]);
            const code = data.daily.weather_code[0];

            if (elMax) elMax.innerText = `${maxTemp}°C`;
            if (elMin) elMin.innerText = `${minTemp}°C`;
            if (elIcone) elIcone.innerHTML = getIconeClima(code);
        }
    } catch (err) {
        console.warn('Falha ao obter clima:', err);
    }
}

function getIconeClima(code) {
    if (code === 0) return '<i class="fa-solid fa-sun text-amber-500 dark:text-amber-400"></i>';
    if (code >= 1 && code <= 2) return '<i class="fa-solid fa-cloud-sun text-amber-500 dark:text-amber-300"></i>';
    if (code === 3) return '<i class="fa-solid fa-cloud text-slate-400 dark:text-slate-300"></i>';
    if (code === 45 || code === 48) return '<i class="fa-solid fa-smog text-slate-400"></i>';
    if (code >= 51 && code <= 57) return '<i class="fa-solid fa-cloud-rain text-sky-500 dark:text-sky-400"></i>';
    if (code >= 61 && code <= 67) return '<i class="fa-solid fa-cloud-showers-heavy text-sky-500 dark:text-sky-400"></i>';
    if (code >= 71 && code <= 77) return '<i class="fa-solid fa-snowflake text-sky-400 dark:text-sky-200"></i>';
    if (code >= 80 && code <= 82) return '<i class="fa-solid fa-cloud-sun-rain text-sky-500 dark:text-sky-400"></i>';
    if (code >= 95) return '<i class="fa-solid fa-cloud-bolt text-yellow-500 dark:text-yellow-400"></i>';
    return '<i class="fa-solid fa-cloud-sun text-sky-500 dark:text-sky-400"></i>';
}

function abrirModalCidade() {
    const modal = document.getElementById('modal-cidade');
    const input = document.getElementById('input-cidade-clima');
    if (input) input.value = state.cidadeClima;
    if (modal) {
        modal.classList.remove('hidden');
        if (input) setTimeout(() => input.focus(), 100);
    }
}

function fecharModalCidade() {
    const modal = document.getElementById('modal-cidade');
    if (modal) modal.classList.add('hidden');
}

async function salvarCidade(e) {
    e.preventDefault();
    const input = document.getElementById('input-cidade-clima');
    const nomeCidade = input ? input.value.trim() : '';
    if (!nomeCidade) return;

    try {
        const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(nomeCidade)}&count=1&language=pt&format=json`;
        const res = await fetch(geoUrl);
        const geoData = await res.json();

        if (geoData.results && geoData.results.length > 0) {
            const local = geoData.results[0];
            state.cidadeClima = local.name;
            state.climaCoords = { lat: local.latitude, lon: local.longitude };

            localStorage.setItem('infonews_cidade', state.cidadeClima);
            localStorage.setItem('infonews_coords', JSON.stringify(state.climaCoords));

            fecharModalCidade();
            carregarClima();
            mostrarToast(`Previsão atualizada para ${local.name}!`);
        } else {
            alert('Cidade não encontrada. Tente incluir estado ou país (ex: Uberlândia, Brasil).');
        }
    } catch (err) {
        alert('Erro ao buscar localização da cidade.');
    }
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

    carregarNoticias();
}

function selecionarPortalTech(portalKey) {
    state.portalTechAtual = portalKey;
    atualizarClassesBotoesFiltro();
    carregarNoticias();
}

function atualizarClassesBotoesFiltro() {
    // Atualiza botões de categoria principal
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

    // Atualiza botões de portais de tecnologia
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
   Carregamento de Notícias e Agregação
   ========================================================================== */
async function carregarNoticias() {
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

        // Se por ventura retornar vazio, aplicar fallback seguro
        if (!items || items.length === 0) {
            items = CONTINGENCY_NEWS;
        }

        state.todasNoticias = items;
        renderizarNoticias(items);
    } catch (err) {
        console.error('Erro na requisição de notícias:', err);
        // Fallback resiliente
        if (CONTINGENCY_NEWS.length > 0) {
            state.todasNoticias = CONTINGENCY_NEWS;
            renderizarNoticias(CONTINGENCY_NEWS);
            mostrarToast('Carregando notícias em cache (modo offline/reserva)');
        } else {
            if (empty) {
                empty.classList.remove('hidden');
                const msg = document.getElementById('msg-estado-vazio');
                if (msg) msg.innerText = `Erro: ${err.message}. Tente recarregar ou selecionar outro portal na barra de opções.`;
            }
        }
    } finally {
        if (loading) loading.classList.add('hidden');
        if (iconRefresh) iconRefresh.classList.remove('fa-spin');
    }
}

async function fetchSingleRssFeed(feedObj) {
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedObj.url)}`;
    const res = await fetch(apiUrl);
    if (!res.ok) throw new Error(`Falha HTTP ao acessar ${feedObj.nome}`);
    const data = await res.json();
    if (data.status !== 'ok' || !data.items) return [];

    return data.items.map(item => {
        let imagem = item.thumbnail || item.enclosure?.link;
        if (!imagem && item.description) {
            const match = item.description.match(/<img[^>]+src="([^">]+)"/);
            if (match) imagem = match[1];
        }

        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = item.description || '';
        const cleanDesc = (tempDiv.textContent || tempDiv.innerText || '').trim();

        return {
            titulo: item.title,
            link: item.link,
            resumo: cleanDesc || 'Clique no link para conferir a reportagem completa.',
            dataRaw: item.pubDate ? new Date(item.pubDate) : new Date(),
            data: item.pubDate ? new Date(item.pubDate).toLocaleString('pt-BR') : 'Recente',
            fonte: feedObj.nome,
            badgeColor: feedObj.badgeColor || 'bg-red-500/10 text-redbrand-600 dark:bg-redbrand-600/20 dark:text-redbrand-400 border-redbrand-500/30',
            imagem: imagem || getImagemFallback(state.categoriaAtual)
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

    const url = `https://gnews.io/api/v4/top-headlines?category=${gnewsCat}&lang=pt&country=br&apikey=${state.apiKey}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.errors) throw new Error(data.errors[0]);

    return (data.articles || []).map(art => ({
        titulo: art.title,
        link: art.url,
        resumo: art.description || 'Sem descrição.',
        data: new Date(art.publishedAt).toLocaleString('pt-BR'),
        dataRaw: new Date(art.publishedAt),
        fonte: art.source?.name || 'GNews',
        badgeColor: 'bg-red-500/10 text-redbrand-600 dark:bg-redbrand-600/20 dark:text-redbrand-400 border-redbrand-500/30',
        imagem: art.image || getImagemFallback(state.categoriaAtual)
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

    const url = `https://newsdata.io/api/1/news?apikey=${state.apiKey}&country=br&category=${cat}`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status === 'error') throw new Error(data.results?.message || 'Erro NewsData');

    return (data.results || []).map(item => ({
        titulo: item.title,
        link: item.link,
        resumo: item.description || 'Sem descrição.',
        data: item.pubDate ? new Date(item.pubDate).toLocaleString('pt-BR') : 'Recente',
        dataRaw: item.pubDate ? new Date(item.pubDate) : new Date(),
        fonte: item.source_id || 'NewsData',
        badgeColor: 'bg-red-500/10 text-redbrand-600 dark:bg-redbrand-600/20 dark:text-redbrand-400 border-redbrand-500/30',
        imagem: item.image_url || getImagemFallback(state.categoriaAtual)
    }));
}

/* ==========================================================================
   Renderização dos Cards de Notícias (HTML5 Semântico + Light/Dark)
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

    lista.forEach(n => {
        const card = document.createElement('article');
        // Suporte a tema claro e escuro de primeira classe
        card.className = 'news-card bg-white dark:bg-slate-800/95 rounded-2xl overflow-hidden border border-slate-200/90 dark:border-slate-700/80 hover:border-redbrand-500/50 shadow-sm hover:shadow-xl dark:shadow-slate-950/40 hover:shadow-redbrand-600/10 transition-all duration-300 flex flex-col group';

        const fallbackUrl = getImagemFallback(state.categoriaAtual);

        card.innerHTML = `
            <div class="relative h-48 w-full overflow-hidden bg-slate-100 dark:bg-slate-900">
                <img 
                    src="${n.imagem}" 
                    alt="${n.titulo}" 
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                    onerror="this.onerror=null; this.src='${fallbackUrl}'"
                >
                <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"></div>
                <span class="absolute top-3 left-3 bg-white/95 dark:bg-slate-900/90 backdrop-blur text-[11px] font-bold px-2.5 py-1 rounded-full border ${n.badgeColor || 'text-redbrand-600 dark:text-redbrand-400 border-redbrand-500/30'} shadow-sm">
                    ${n.fonte}
                </span>
            </div>

            <div class="p-5 flex flex-col flex-grow justify-between">
                <div>
                    <div class="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2">
                        <i class="fa-regular fa-clock text-redbrand-500"></i>
                        <time datetime="${n.dataRaw ? new Date(n.dataRaw).toISOString() : ''}">${n.data}</time>
                    </div>
                    <h2 class="text-base font-bold text-slate-900 dark:text-white group-hover:text-redbrand-600 dark:group-hover:text-redbrand-400 transition-colors line-clamp-2 mb-2 leading-snug">
                        <a href="${n.link}" target="_blank" rel="noopener noreferrer">${n.titulo}</a>
                    </h2>
                    <p class="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 mb-4 leading-relaxed">
                        ${n.resumo}
                    </p>
                </div>

                <div class="pt-3 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                    <a 
                        href="${n.link}" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        class="inline-flex items-center gap-1.5 text-xs font-bold text-redbrand-600 dark:text-redbrand-500 hover:text-redbrand-700 dark:hover:text-redbrand-400 transition"
                    >
                        Ler no ${n.fonte} <i class="fa-solid fa-arrow-up-right-from-square text-[10px]"></i>
                    </a>
                    <button 
                        type="button"
                        onclick="compartilhar('${encodeURIComponent(n.titulo)}', '${encodeURIComponent(n.link)}')" 
                        class="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition" 
                        title="Compartilhar notícia"
                        aria-label="Compartilhar notícia: ${n.titulo}"
                    >
                        <i class="fa-solid fa-share-nodes text-xs"></i>
                    </button>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

/* ==========================================================================
   Filtragem por Texto
   ========================================================================== */
function filtrarPorTexto() {
    const input = document.getElementById('input-busca');
    const q = input ? input.value.toLowerCase().trim() : '';
    if (!q) {
        renderizarNoticias(state.todasNoticias);
        return;
    }
    const filtradas = state.todasNoticias.filter(n =>
        n.titulo.toLowerCase().includes(q) ||
        n.resumo.toLowerCase().includes(q) ||
        n.fonte.toLowerCase().includes(q)
    );
    renderizarNoticias(filtradas);
}

/* ==========================================================================
   Modais: Configurações & Acessibilidade
   ========================================================================== */
function toggleSettingsModal() {
    const modal = document.getElementById('modal-settings');
    if (modal) {
        modal.classList.toggle('hidden');
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
                    dica.innerHTML = 'Obtenha sua chave gratuita em <a href="https://gnews.io" target="_blank" rel="noopener" class="text-redbrand-500 hover:underline">gnews.io</a> (100 req/dia).';
                } else if (prov === 'newsdata') {
                    dica.innerHTML = 'Obtenha sua chave gratuita em <a href="https://newsdata.io" target="_blank" rel="noopener" class="text-redbrand-500 hover:underline">newsdata.io</a> (200 créditos/dia).';
                }
            }
        }
    }
}

function salvarConfiguracoes() {
    const select = document.getElementById('select-provider');
    const input = document.getElementById('input-apikey');

    state.provider = select ? select.value : 'rss';
    state.apiKey = input ? input.value.trim() : '';

    localStorage.setItem('infonews_provider', state.provider);
    localStorage.setItem('infonews_apikey', state.apiKey);

    toggleSettingsModal();
    carregarNoticias();
    mostrarToast('Configurações salvas com sucesso!');
}

function configurarEventosTeclado() {
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            fecharModalCidade();
            const modalSettings = document.getElementById('modal-settings');
            if (modalSettings && !modalSettings.classList.contains('hidden')) {
                modalSettings.classList.add('hidden');
            }
        }
    });
}

function configurarFechamentoBackdrop() {
    ['modal-cidade', 'modal-settings'].forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.add('hidden');
                }
            });
        }
    });
}

/* ==========================================================================
   Compartilhamento e Notificações (Toast)
   ========================================================================== */
function compartilhar(titulo, url) {
    const decTitulo = decodeURIComponent(titulo);
    const decUrl = decodeURIComponent(url);

    if (navigator.share) {
        navigator.share({ title: decTitulo, url: decUrl }).catch(() => {});
    } else {
        navigator.clipboard.writeText(`${decTitulo} - ${decUrl}`).then(() => {
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
        toast.className = 'fixed bottom-5 right-5 z-50 bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 border border-slate-700 dark:border-slate-200 transition-all duration-300 transform translate-y-10 opacity-0 pointer-events-none';
        document.body.appendChild(toast);
    }
    toast.innerHTML = `<i class="fa-solid fa-circle-check text-redbrand-500"></i> <span>${mensagem}</span>`;
    toast.classList.remove('translate-y-10', 'opacity-0', 'pointer-events-none');
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
