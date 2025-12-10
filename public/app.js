const API_URL = 'http://localhost:3000/api';
let images = [];
let displayedImages = [];

// Загрузка при старте
document.addEventListener('DOMContentLoaded', async () => {
    await loadImages();
    await loadCategories();
});

// Загрузка изображений
async function loadImages() {
    try {
        const response = await fetch(`${API_URL}/images`);
        const data = await response.json();
        
        if (data.success) {
            images = data.data;
            displayedImages = [...images];
            displayImages(displayedImages);
            updateStats();
        }
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        showError('Сервер не отвечает. Запусти server.js');
    }
}

// Отображение изображений
function displayImages(imagesToShow) {
    const gallery = document.getElementById('gallery');
    
    if (imagesToShow.length === 0) {
        gallery.innerHTML = '<p class="empty">Нет фотографий</p>';
        return;
    }
    
    gallery.innerHTML = imagesToShow.map(image => `
        <div class="image-card" onclick="showImageDetail(${image.id})">
            <img src="/uploads/${image.filename}" alt="${image.title}" 
                 onerror="this.src='https://via.placeholder.com/400x300?text=Фото+не+найдено'">
            <div class="image-info">
                <h3>${image.title}</h3>
                <p>${image.description}</p>
                <div class="image-stats">
                    <button class="like-btn ${image.isLiked ? 'liked' : ''}" onclick="likeImage(event, ${image.id})">
                        <i class="${image.isLiked ? 'fas' : 'far'} fa-heart"></i>
                        ${image.likes}
                    </button>
                    <button class="fav-btn ${image.isFavorite ? 'favorited' : ''}" onclick="toggleFavorite(event, ${image.id})">
                        <i class="${image.isFavorite ? 'fas' : 'far'} fa-star"></i>
                    </button>
                    <span>👁️ ${image.views}</span>
                </div>
            </div>
        </div>
    `).join('');
}

// Показать детали
async function showImageDetail(id) {
    try {
        const response = await fetch(`${API_URL}/images/${id}`);
        const data = await response.json();
        
        if (data.success) {
            const image = data.data;
            const modalBody = document.getElementById('modalBody');
            
            modalBody.innerHTML = `
                <img src="/uploads/${image.filename}" class="modal-image" alt="${image.title}">
                <div class="modal-details">
                    <h2>${image.title}</h2>
                    <p>${image.description}</p>
                    <div class="modal-stats">
                        <div>
                            <span>${image.likes}</span> лайков
                        </div>
                        <div>
                            <span>${image.comments.length}</span> комментариев
                        </div>
                        <div>
                            <span>${image.views}</span> просмотров
                        </div>
                    </div>
                    <div class="modal-actions">
                        <button onclick="likeImage(null, ${image.id})">
                            ${image.isLiked ? 'Убрать лайк' : 'Лайк'}
                        </button>
                        <button onclick="toggleFavorite(null, ${image.id})">
                            ${image.isFavorite ? 'Убрать из избранного' : 'В избранное'}
                        </button>
                    </div>
                    <div class="comments">
                        <h3>Комментарии (${image.comments.length})</h3>
                        ${image.comments.map(comment => `
                            <div class="comment">
                                <strong>${comment.user}</strong>: ${comment.text}
                            </div>
                        `).join('')}
                        <div class="add-comment">
                            <input type="text" id="commentUser" placeholder="Ваше имя">
                            <textarea id="commentText" placeholder="Ваш комментарий"></textarea>
                            <button onclick="addComment(${image.id})">Отправить</button>
                        </div>
                    </div>
                </div>
            `;
            
            document.getElementById('imageModal').style.display = 'block';
        }
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

// Лайк
async function likeImage(event, id) {
    if (event) event.stopPropagation();
    
    try {
        const response = await fetch(`${API_URL}/images/${id}/like`, {
            method: 'POST'
        });
        const data = await response.json();
        
        if (data.success) {
            await loadImages(); // Перезагружаем данные
        }
    } catch (error) {
        console.error('Ошибка лайка:', error);
    }
}

// Избранное
async function toggleFavorite(event, id) {
    if (event) event.stopPropagation();
    
    try {
        const response = await fetch(`${API_URL}/images/${id}/favorite`, {
            method: 'POST'
        });
        const data = await response.json();
        
        if (data.success) {
            await loadImages();
        }
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

// Комментарий
async function addComment(id) {
    const user = document.getElementById('commentUser').value;
    const text = document.getElementById('commentText').value;
    
    if (!user || !text) return;
    
    try {
        const response = await fetch(`${API_URL}/images/${id}/comment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user, text })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showImageDetail(id); // Обновляем модальное окно
        }
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

// Загрузка категорий
async function loadCategories() {
    try {
        const response = await fetch(`${API_URL}/categories`);
        const data = await response.json();
        
        if (data.success) {
            const select = document.getElementById('categoryFilter');
            data.data.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Ошибка категорий:', error);
    }
}

// Поиск
function searchImages() {
    const search = document.getElementById('searchInput').value.toLowerCase();
    const category = document.getElementById('categoryFilter').value;
    
    let filtered = images;
    
    if (category !== 'all') {
        filtered = filtered.filter(img => img.category === category);
    }
    
    if (search) {
        filtered = filtered.filter(img => 
            img.title.toLowerCase().includes(search) || 
            img.description.toLowerCase().includes(search)
        );
    }
    
    displayedImages = filtered;
    displayImages(displayedImages);
}

// Избранное
function showFavorites() {
    const favorites = images.filter(img => img.isFavorite);
    displayImages(favorites);
}

// Обновление статистики
function updateStats() {
    const totalLikes = images.reduce((sum, img) => sum + img.likes, 0);
    const favoritesCount = images.filter(img => img.isFavorite).length;
    
    document.getElementById('totalImages').textContent = images.length;
    document.getElementById('totalLikes').textContent = totalLikes;
    document.getElementById('favoritesCount').textContent = favoritesCount;
}

// Закрыть модальное окно
function closeModal() {
    document.getElementById('imageModal').style.display = 'none';
    loadImages(); // Обновляем данные
}

// Ошибка
function showError(message) {
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = `
        <div class="error">
            <p>${message}</p>
            <p>1. Установи Node.js</p>
            <p>2. В папке проекта выполни: npm install</p>
            <p>3. Запусти: node server.js</p>
        </div>
    `;
}

// Закрытие по клику вне модального окна
window.onclick = function(event) {
    const modal = document.getElementById('imageModal');
    if (event.target === modal) {
        closeModal();
    }
}