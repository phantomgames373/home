let gamesData = [];
let currentCategory = 'home';

// DOM Elements
const gameGrid = document.getElementById('game-grid');
const trendingSection = document.getElementById('trending-section');
const trendingGrid = document.getElementById('trending-grid');
const searchBar = document.getElementById('search-bar');
const gameModal = document.getElementById('game-modal');
const iframeContainer = document.getElementById('iframe-container');
const closeBtn = document.getElementById('close-btn');
const modalTitle = document.getElementById('modal-title');
const gameCount = document.getElementById('game-count');
const gridTitle = document.getElementById('grid-title');
const categoryNavItems = document.querySelectorAll('.category-nav li');

const TRENDING_TITLES = ["Slope", "Run 3", "1v1.LOL", "Retro Bowl", "BitLife"];

// Basic static categorizer to map games
function getGameCategory(title) {
    const t = title.toLowerCase();
    
    if (t.includes('bowl') || t.includes('soccer') || t.includes('basketball') || t.includes('tennis') || t.includes('volley') || t.includes('sport') || t.includes('sports')) {
        return 'sports';
    }
    if (t.includes('mario') || t.includes('duck life') || t.includes('adventure') || t.includes('run') || t.includes('fnaf') || t.includes('surfers')) {
        return 'adventure';
    }
    if (t.includes('1v1') || t.includes('fight') || t.includes('smash') || t.includes('battle') || t.includes('box') || t.includes('wrestle')) {
        return 'fighting';
    }
    if (t.includes('bloons') || t.includes('defend') || t.includes('strategy') || t.includes('war') || t.includes('territory') || t.includes('clash')) {
        return 'strategy';
    }
    if (t.includes('2048') || t.includes('puzzle') || t.includes('mahjong') || t.includes('wordle') || t.includes('chess') || t.includes('minesweeper')) {
        return 'puzzle';
    }
    
    return 'other'; // default
}

function getCategoryIcon(category) {
    switch (category) {
        case 'sports': return '⚽';
        case 'adventure': return '🗺️';
        case 'fighting': return '⚔️';
        case 'strategy': return '🧠';
        case 'puzzle': return '🧩';
        default: return '🎲';
    }
}

// Generate premium gradients for cards
function generateGradient(title) {
    let hash = 0;
    for (let i = 0; i < title.length; i++) {
        hash = title.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue1 = Math.abs(hash) % 360;
    // We want a dark & blue / black & blue phantom vibe.
    // Let's bias the colors heavily towards deep blues, cyans, and purples.
    const phantomHue = 180 + (hue1 % 100); // 180-280 range (Cyans to Deep Purples)
    const color1 = `hsl(${phantomHue}, 80%, 30%)`;
    const color2 = `hsl(${(phantomHue + 40) % 360}, 60%, 15%)`;
    return `linear-gradient(135deg, ${color1}, ${color2})`;
}

fetch('games.json')
    .then(r => r.json())
    .then(data => {
        // Deduplicate
        const seen = new Set();
        gamesData = data.filter(g => {
            if (seen.has(g.iframe_url)) return false;
            seen.add(g.iframe_url);
            return true;
        });
        
        // Append Category Data
        gamesData.forEach(game => {
            game.category = getGameCategory(game.title);
        });

        updateCount(gamesData.length);
        renderHome();
    })
    .catch(err => {
        console.error("Failed to load games:", err);
        gameGrid.innerHTML = '<p class="no-results">Could not load games.json.</p>';
    });

function updateCount(n) {
    if (gameCount) gameCount.textContent = n + ' games loaded';
}

function createGameCard(game) {
    const card = document.createElement('div');
    card.className = 'game-card';
    
    const bg = document.createElement('div');
    bg.className = 'card-bg';
    
    const gradientLayer = document.createElement('div');
    gradientLayer.className = 'card-bg-gradient';
    gradientLayer.style.background = generateGradient(game.title);
    bg.appendChild(gradientLayer);

    const icon = document.createElement('div');
    icon.className = 'card-icon';
    icon.textContent = getCategoryIcon(game.category);
    bg.appendChild(icon);

    const titleEl = document.createElement('div');
    titleEl.className = 'card-title';
    titleEl.textContent = game.title;
    bg.appendChild(titleEl);

    card.appendChild(bg);

    // Hover overlay with play button
    const hoverOverlay = document.createElement('div');
    hoverOverlay.className = 'hover-overlay';
    const playBtn = document.createElement('div');
    playBtn.className = 'play-btn';
    playBtn.textContent = 'PLAY NOW';
    hoverOverlay.appendChild(playBtn);
    card.appendChild(hoverOverlay);

    card.addEventListener('click', () => openGame(game));
    return card;
}

function renderHome() {
    trendingSection.style.display = 'block';
    // User requested the "other" category on the homepage to be loaded as featured games
    gridTitle.textContent = "Featured Games";

    const trendingGames = gamesData.filter(g => TRENDING_TITLES.includes(g.title)).slice(0, 5);
    // If not exactly 5, pad
    if (trendingGames.length < 5) {
        const remaining = gamesData.filter(g => !TRENDING_TITLES.includes(g.title));
        trendingGames.push(...remaining.slice(0, 5 - trendingGames.length));
    }

    trendingGrid.innerHTML = '';
    trendingGames.forEach(game => {
        trendingGrid.appendChild(createGameCard(game));
    });

    // Populate the featured games on the homepage with games mapped to the 'other' category and not in trending
    let otherGames = gamesData.filter(g => g.category === 'other' && !trendingGames.includes(g));
    
    // Fallback if 'other' category has fewer than 35 games
    if(otherGames.length < 35) {
        const moreGames = gamesData.filter(g => g.category !== 'other' && !trendingGames.includes(g));
        otherGames.push(...moreGames.slice(0, 35 - otherGames.length));
    } else {
        otherGames = otherGames.slice(0, 35);
    }
    
    renderGrid(otherGames);
}

function renderGrid(games) {
    gameGrid.innerHTML = '';
    
    if (games.length === 0) {
        gameGrid.innerHTML = '<p class="no-results">No games found.</p>';
        return;
    }

    games.forEach(game => {
        gameGrid.appendChild(createGameCard(game));
    });
}

function setCategory(cat) {
    currentCategory = cat;
    searchBar.value = ''; // clear search
    
    // Update active nav
    categoryNavItems.forEach(item => {
        if (item.dataset.category === cat) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    if (cat === 'home') {
        renderHome();
    } else if (cat === 'trending') {
        trendingSection.style.display = 'none';
        gridTitle.textContent = "Trending Games";
        const trendingGames = gamesData.filter(g => TRENDING_TITLES.includes(g.title));
        renderGrid(trendingGames);
    } else {
        trendingSection.style.display = 'none';
        // Capitalize category name
        gridTitle.textContent = cat.charAt(0).toUpperCase() + cat.slice(1) + " Games";
        const filtered = gamesData.filter(g => g.category === cat);
        renderGrid(filtered);
    }
}

// Event Listeners
categoryNavItems.forEach(item => {
    item.addEventListener('click', () => {
        setCategory(item.dataset.category);
    });
});

searchBar.addEventListener('input', e => {
    const term = e.target.value.toLowerCase().trim();
    
    if (!term) {
        setCategory(currentCategory); // Restore current view
        return;
    }

    // When searching, hide trending section and show all matching games
    trendingSection.style.display = 'none';
    gridTitle.textContent = `Search Results: "${term}"`;
    
    // Deactivate nav highlights visually since we're in search mode
    categoryNavItems.forEach(item => item.classList.remove('active'));

    const filtered = gamesData.filter(g => g.title.toLowerCase().includes(term));
    renderGrid(filtered);
});

// Modal Logic
function openGame(game) {
    modalTitle.textContent = game.title;
    iframeContainer.innerHTML = `
        <iframe
            id="game-frame"
            src="${game.iframe_url}"
            allowfullscreen="true"
            scrolling="no"
            allow="autoplay; fullscreen; keyboard-map">
        </iframe>`;
    gameModal.classList.remove('hidden');
    setTimeout(() => {
        const f = document.getElementById('game-frame');
        if (f) f.focus();
    }, 400);
}

const fullscreenBtn = document.getElementById('fullscreen-btn');

fullscreenBtn.addEventListener('click', () => {
    const iframe = document.getElementById('game-frame');
    if (iframe) {
        if (iframe.requestFullscreen) {
            iframe.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        }
    }
});

closeBtn.addEventListener('click', () => {
    gameModal.classList.add('hidden');
    iframeContainer.innerHTML = '';
});

document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !gameModal.classList.contains('hidden')) {
        gameModal.classList.add('hidden');
        iframeContainer.innerHTML = '';
    }
});
