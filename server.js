const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

// Создаем папки если их нет
const folders = ['uploads', 'public'];
folders.forEach(folder => {
    if (!fs.existsSync(folder)) {
        fs.mkdirSync(folder, { recursive: true });
    }
});

// Файл с данными
const DATA_FILE = './data.json';

// Загружаем или создаем данные
function loadData() {
    try {
        if (fs.existsSync(DATA_FILE)) {
            const data = fs.readFileSync(DATA_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Ошибка загрузки данных:', error);
    }
    
    // Стартовые данные с твоими фото
    const initialData = [
        {
            id: 1,
            title: "Мое фото 1",
            description: "Описание первого фото",
            filename: "myphoto1.jpg", // 👈 Имя твоего файла в папке uploads
            category: "личное",
            tags: ["фото1", "личное"],
            likes: 0,
            isLiked: false,
            isFavorite: false,
            views: 0,
            comments: [],
            uploadDate: new Date().toISOString().split('T')[0]
        }
    ];
    
    saveData(initialData);
    return initialData;
}

// Сохраняем данные
function saveData(data) {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Ошибка сохранения данных:', error);
        return false;
    }
}

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Кастомный middleware для логирования
app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
});

// Настройка Multer для загрузки фото (если захочешь добавлять через сайт)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname);
        cb(null, uniqueName);
    }
});

const upload = multer({ 
    storage: storage,
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif|webp/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            cb(null, true);
        } else {
            cb(new Error('Только изображения!'));
        }
    }
});

// 📌 GET / - главная страница
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 📌 GET /api/images - все изображения
app.get('/api/images', (req, res) => {
    try {
        const images = loadData();
        res.json({
            success: true,
            count: images.length,
            data: images
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера'
        });
    }
});

// 📌 GET /api/images/:id - одно изображение
app.get('/api/images/:id', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const images = loadData();
        const image = images.find(img => img.id === id);
        
        if (image) {
            // Увеличиваем просмотры
            image.views += 1;
            saveData(images);
            
            res.json({
                success: true,
                data: image
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Изображение не найдено'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера'
        });
    }
});

// 📌 POST /api/images/:id/like - лайк
app.post('/api/images/:id/like', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const images = loadData();
        const imageIndex = images.findIndex(img => img.id === id);
        
        if (imageIndex !== -1) {
            const image = images[imageIndex];
            
            if (image.isLiked) {
                image.likes -= 1;
            } else {
                image.likes += 1;
            }
            image.isLiked = !image.isLiked;
            
            saveData(images);
            
            res.json({
                success: true,
                likes: image.likes,
                isLiked: image.isLiked
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Изображение не найдено'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера'
        });
    }
});

// 📌 POST /api/images/:id/favorite - избранное
app.post('/api/images/:id/favorite', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const images = loadData();
        const imageIndex = images.findIndex(img => img.id === id);
        
        if (imageIndex !== -1) {
            const image = images[imageIndex];
            image.isFavorite = !image.isFavorite;
            
            saveData(images);
            
            res.json({
                success: true,
                isFavorite: image.isFavorite
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Изображение не найдено'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера'
        });
    }
});

// 📌 POST /api/images/:id/comment - комментарий
app.post('/api/images/:id/comment', (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { user, text } = req.body;
        
        if (!user || !text) {
            return res.status(400).json({
                success: false,
                error: 'Заполните все поля'
            });
        }
        
        const images = loadData();
        const imageIndex = images.findIndex(img => img.id === id);
        
        if (imageIndex !== -1) {
            const image = images[imageIndex];
            const newComment = {
                id: image.comments.length + 1,
                user: user.trim(),
                text: text.trim(),
                date: new Date().toISOString().split('T')[0]
            };
            
            image.comments.push(newComment);
            saveData(images);
            
            res.json({
                success: true,
                comment: newComment,
                totalComments: image.comments.length
            });
        } else {
            res.status(404).json({
                success: false,
                error: 'Изображение не найдено'
            });
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера'
        });
    }
});

// 📌 POST /api/images/upload - загрузить новое фото
app.post('/api/images/upload', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: 'Файл не загружен'
            });
        }
        
        const { title, description, category } = req.body;
        
        if (!title) {
            return res.status(400).json({
                success: false,
                error: 'Введите название'
            });
        }
        
        const images = loadData();
        const newImage = {
            id: images.length > 0 ? Math.max(...images.map(img => img.id)) + 1 : 1,
            title: title.trim(),
            description: description ? description.trim() : '',
            filename: req.file.filename,
            category: category ? category.trim() : 'другое',
            tags: [],
            likes: 0,
            isLiked: false,
            isFavorite: false,
            views: 0,
            comments: [],
            uploadDate: new Date().toISOString().split('T')[0]
        };
        
        images.push(newImage);
        saveData(images);
        
        res.json({
            success: true,
            message: 'Фото загружено',
            data: newImage
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Ошибка загрузки'
        });
    }
});

// 📌 GET /api/categories - категории
app.get('/api/categories', (req, res) => {
    try {
        const images = loadData();
        const categories = [...new Set(images.map(img => img.category))];
        
        res.json({
            success: true,
            data: categories
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Ошибка сервера'
        });
    }
});

// Запуск сервера
app.listen(PORT, () => {
    console.log('=======================================');
    console.log(`🚀 Сервер запущен на порту ${PORT}`);
    console.log(`👉 Откройте: http://localhost:${PORT}`);
    console.log('=======================================');
    console.log('📁 Положите свои фото в папку uploads/');
    console.log('📝 Отредактируйте data.json для своих фото');
    console.log('=======================================');
});