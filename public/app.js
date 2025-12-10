// ИСПРАВЛЕНО: Убираем localhost, используем относительные пути
const API_URL = '/api'; // Только относительный путь!
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
        // ИСПРАВЛЕНО: Используем относительный путь
        const response = await fetch(`${API_URL}/images`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        if (data.success) {
            images = data.data;
            displayedImages = [...images];
            displayImages(displayedImages);
            updateStats();
        }
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        showError('Сервер не отвечает. Проверьте подключение или попробуйте позже.');
    }
}

// Отображение изображений
function displayImages(imagesToShow) {
    const gallery = document.getElementById('gallery');
    
    if (!gallery) return;
    
    if (imagesToShow.length === 0) {
        gallery.innerHTML = '<p class="empty">Нет фотографий. Загрузите первую!</p>';
        return;
    }
    
    gallery.innerHTML = imagesToShow.map(image => `
        <div class="image-card" onclick="showImageDetail(${image.id})">
            <img src="/uploads/${image.filename}" alt="${image.title}" 
                 onerror="this.src='https://via.placeholder.com/400x300?text=Фото+не+найдно'">
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
        // ИСПРАВЛЕНО: Относительный путь
        const response = await fetch(`${API_URL}/images/${id}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        
        if (data.success) {
            const image = data.data;
            const modalBody = document.getElementById('modalBody');
            
            if (!modalBody) return;
            
            modalBody.innerHTML = `
                <img src="/uploads/${image.filename}" class="modal-image" alt="${image.title}"
                     onerror="this.src='https://via.placeholder.com/600x400?text=Фото+не+загружено'">
                <div class="modal-details">
                    <h2>${image.title}</h2>
                    <p>${image.description}</p>
                    <div class="modal-stats">
                        <div>
                            <span>${image.likes}</span> лайков
                        </div>
                        <div>
                            <span>${image.comments ? image.comments.length : 0}</span> комментариев
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
                        <h3>Комментарии (${image.comments ? image.comments.length : 0})</h3>
                        ${image.comments ? image.comments.map(comment => `
                            <div class="comment">
                                <strong>${comment.user || 'Аноним'}</strong>: ${comment.text}
                            </div>
                        `).join('') : '<p>Нет комментариев</p>'}
                        <div class="add-comment">
                            <input type="text" id="commentUser" placeholder="Ваше имя">
                            <textarea id="commentText" placeholder="Ваш комментарий"></textarea>
                            <button onclick="addComment(${image.id})">Отправить</button>
                        </div>
                    </div>
                </div>
            `;
            
            const modal = document.getElementById('imageModal');
            if (modal) {
                modal.style.display = 'block';
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки деталей:', error);
        alert('Не удалось загрузить детали фото');
    }
}

// Лайк
async function likeImage(event, id) {
    if (event) event.stopPropagation();
    
    try {
        // ИСПРАВЛЕНО: Относительный путь
        const response = await fetch(`${API_URL}/images/${id}/like`, {
            method: 'POST'
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        
        if (data.success) {
            await loadImages(); // Перезагружаем данные
        }
    } catch (error) {
        console.error('Ошибка лайка:', error);
        alert('Не удалось поставить лайк');
    }
}

// Избранное
async function toggleFavorite(event, id) {
    if (event) event.stopPropagation();
    
    try {
        // ИСПРАВЛЕНО: Относительный путь
        const response = await fetch(`${API_URL}/images/${id}/favorite`, {
            method: 'POST'
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        
        if (data.success) {
            await loadImages();
        }
    } catch (error) {
        console.error('Ошибка избранного:', error);
        alert('Не удалось добавить в избранное');
    }
}

// Комментарий
async function addComment(id) {
    const user = document.getElementById('commentUser')?.value || 'Аноним';
    const text = document.getElementById('commentText')?.value;
    
    if (!text || text.trim() === '') {
        alert('Введите комментарий');
        return;
    }
    
    try {
        // ИСПРАВЛЕНО: Относительный путь
        const response = await fetch(`${API_URL}/images/${id}/comment`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ user, text: text.trim() })
        });
        
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();
        
        if (data.success) {
            // Очищаем поля
            if (document.getElementById('commentUser')) document.getElementById('commentUser').value = '';
            if (document.getElementById('commentText')) document.getElementById('commentText').value = '';
            
            showImageDetail(id); // Обновляем модальное окно
        }
    } catch (error) {
        console.error('Ошибка комментария:', error);
        alert('Не удалось отправить комментарий');
    }
}

// Загрузка категорий
async function loadCategories() {
    try {
        // ИСПРАВЛЕНО: Относительный путь
        const response = await fetch(`${API_URL}/categories`);
        
        if (!response.ok) return; // Если нет категорий - пропускаем
        
        const data = await response.json();
        
        if (data.success) {
            const select = document.getElementById('categoryFilter');
            if (select) {
                data.data.forEach(category => {
                    const option = document.createElement('option');
                    option.value = category;
                    option.textContent = category;
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error('Ошибка категорий:', error);
        // Игнорируем ошибку категорий, они не критичны
    }
}

// Поиск
function searchImages() {
    const searchInput = document.getElementById('searchInput');
    const categorySelect = document.getElementById('categoryFilter');
    
    if (!searchInput || !categorySelect) return;
    
    const search = searchInput.value.toLowerCase();
    const category = categorySelect.value;
    
    let filtered = images;
    
    if (category !== 'all') {
        filtered = filtered.filter(img => img.category === category);
    }
    
    if (search) {
        filtered = filtered.filter(img => 
            (img.title && img.title.toLowerCase().includes(search)) || 
            (img.description && img.description.toLowerCase().includes(search))
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
    const totalLikes = images.reduce((sum, img) => sum + (img.likes || 0), 0);
    const favoritesCount = images.filter(img => img.isFavorite).length;
    
    const totalImagesEl = document.getElementById('totalImages');
    const totalLikesEl = document.getElementById('totalLikes');
    const favoritesCountEl = document.getElementById('favoritesCount');
    
    if (totalImagesEl) totalImagesEl.textContent = images.length;
    if (totalLikesEl) totalLikesEl.textContent = totalLikes;
    if (favoritesCountEl) favoritesCountEl.textContent = favoritesCount;
}

// Закрыть модальное окно
function closeModal() {
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.style.display = 'none';
        loadImages(); // Обновляем данные
    }
}

// Ошибка
function showError(message) {
    const gallery = document.getElementById('gallery');
    if (!gallery) return;
    
    gallery.innerHTML = `
        <div class="error">
            <p>${message}</p>
            <div class="error-steps">
                <p>Если запускаете локально:</p>
                <p>1. Установи Node.js</p>
                <p>2. В папке проекта выполни: npm install</p>
                <p>3. Запусти: node server.js</p>
            </div>
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

// Экспортируем функции в глобальную область видимости
window.loadImages = loadImages;
window.showImageDetail = showImageDetail;
window.likeImage = likeImage;
window.toggleFavorite = toggleFavorite;
window.addComment = addComment;
window.searchImages = searchImages;
window.showFavorites = showFavorites;
window.closeModal = closeModal;