const characterGrid = document.getElementById('characterGrid');
const searchInput = document.getElementById('searchInput');
const favoriteFilterButton = document.getElementById('favoriteFilter');
const speciesFilter = document.getElementById('speciesFilter');
const statusFilter = document.getElementById('statusFilter');

let currentPage = 1;   
let isLoading = false;  
let favorites = JSON.parse(localStorage.getItem('favorites')) || []; 
let showFavoritesOnly = false;
let allCharacters = []; // Armazena todos os personagens
let renderedCharacterIds = new Set(); // Para rastrear IDs já renderizados

function saveFavorites() {
    localStorage.setItem('favorites', JSON.stringify(favorites));
}

function toggleFavorite(id) {
    const index = favorites.indexOf(id); 
    if (index > -1) {
        favorites.splice(index, 1); 
    } else {
        favorites.push(id); 
    }
    saveFavorites(); 
    renderCharacters(); 
}

function translateSpecies(species) {
    const speciesTranslation = {
        "Human": "Humano",
        "Alien": "Alienígena",
    };
    return speciesTranslation[species] || species; // Retorna a tradução ou a espécie original
}

function translateStatus(status) {
    const statusTranslation = {
        "Alive": "Vivo",
        "Dead": "Morto",
        "unknown": "Desconhecido"
    };
    return statusTranslation[status] || status; // Retorna a tradução ou o status original
}

function createCharacterCard(character) {
    const characterCard = document.createElement('div'); 
    characterCard.classList.add('character-card'); 

    const favoriteClass = favorites.includes(character.id) ? 'favorited' : '';

    characterCard.innerHTML = `
        <img src="${character.image}" alt="${character.name}">
        <h3>${character.name}</h3>
        <span class="favorite ${favoriteClass}" data-id="${character.id}">★</span>
        <div class="character-details">
            <p>Status: ${translateStatus(character.status)}</p>
            <p>Espécie: ${translateSpecies(character.species)}</p>
        </div>
    `;

    characterCard.querySelector('.favorite').onclick = () => toggleFavorite(character.id);
    
    characterGrid.appendChild(characterCard); 
}

function fetchCharacterById(id) {
    return fetch(`https://rickandmortyapi.com/api/character/${id}`)
        .then(response => response.json())
        .catch(error => {
            console.log('Erro ao buscar personagem:', error);
        });
}

function fetchCharacters(page) {
    if (isLoading) return; 
    isLoading = true; 

    fetch(`https://rickandmortyapi.com/api/character/?page=${page}`)
        .then(response => response.json())
        .then(data => {
            allCharacters = [...allCharacters, ...data.results]; // Armazena os personagens
            renderFilteredCharacters(allCharacters); // Renderiza com os filtros aplicados
            isLoading = false;  
        })
        .catch(error => {
            console.log(error); 
            isLoading = false; 
        });
}

function fetchSearchedCharacters(query) {
    fetch(`https://rickandmortyapi.com/api/character/?name=${query}`)
        .then(response => response.json())
        .then(data => {
            characterGrid.innerHTML = ''; 
            data.results.forEach(createCharacterCard); 
        })
        .catch(error => {
            console.log('Nenhum personagem encontrado', error); 
            characterGrid.innerHTML = '<p>Nenhum personagem encontrado</p>';
        });
}

function filterCharacters(characters) {
    const species = speciesFilter.value; // Obtém a espécie selecionada
    const status = statusFilter.value; // Obtém o status selecionado

    return characters.filter(character => {
        const speciesMatch = species ? character.species === species : true;
        const statusMatch = status ? character.status === status : true;
        return speciesMatch && statusMatch;
    });
}

function renderFilteredCharacters(characters) {
    const filteredCharacters = filterCharacters(characters);
    filteredCharacters.forEach(character => {
        // Verifica se o ID já foi renderizado
        if (!renderedCharacterIds.has(character.id)) {
            createCharacterCard(character);
            renderedCharacterIds.add(character.id); // Adiciona o ID ao conjunto
        }
    });
}

function renderCharacters() {
    characterGrid.innerHTML = ''; 
    renderedCharacterIds.clear(); // Limpa o conjunto quando renderizando novamente
    if (showFavoritesOnly) {
        const filteredFavorites = favorites.map(fetchCharacterById); // Renderiza apenas favoritos
        Promise.all(filteredFavorites).then(renderFilteredCharacters);
    } else {
        fetchCharacters(currentPage); // Renderiza todos os personagens
    }
}

// Pesquisa
searchInput.addEventListener('input', (e) => {
    const query = e.target.value.trim(); 
    characterGrid.innerHTML = ''; 
    query.length ? fetchSearchedCharacters(query) : renderCharacters(); 
});

// Botão de filtro de favoritos
favoriteFilterButton.addEventListener('click', () => {
    showFavoritesOnly = !showFavoritesOnly; // Alterna entre mostrar favoritos e todos
    favoriteFilterButton.textContent = showFavoritesOnly ? 'Mostrar Todos' : 'Mostrar Favoritos';
    renderCharacters();
});

// Filtros de espécies e status
speciesFilter.addEventListener('change', () => {
    renderCharacters(); // Chama renderCharacters que irá filtrar os personagens
});

statusFilter.addEventListener('change', () => {
    renderCharacters(); // Chama renderCharacters que irá filtrar os personagens
});

// Rolagem infinita
window.addEventListener('scroll', () => {
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 100 && !isLoading) {
        currentPage++; 
        fetchCharacters(currentPage); 
    }
});

// Inicializa a exibição de personagens
renderCharacters();
