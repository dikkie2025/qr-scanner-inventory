// Основной модуль приложения
class ProductionSystemApp {
    constructor() {
        this.currentModule = 'home';
        this.modules = {
            'home': 'modules/home.html',
            'create-roll': 'modules/create-roll.html',
            'warehouse': 'modules/warehouse.html',
            'coating': 'modules/coating.html',
            'shipping': 'modules/shipping.html'
        };
        
        this.init();
    }
    
    async init() {
        // Загружаем начальную страницу
        await this.loadModule('home');
        
        // Инициализируем навигацию
        this.initNavigation();
        
        // Инициализируем PWA
        this.initPWA();
        
        // Мониторинг онлайн-статуса
        this.initOnlineStatus();
        
        // Сохраняем последнюю открытую страницу
        this.restoreLastPage();
    }
    
    async loadModule(moduleName) {
        try {
            this.currentModule = moduleName;
            localStorage.setItem('lastPage', moduleName);
            
            const modulePath = this.modules[moduleName];
            if (!modulePath) {
                throw new Error(`Модуль ${moduleName} не найден`);
            }
            
            // Показываем индикатор загрузки
            this.showLoading();
            
            // Загружаем HTML модуля
            const response = await fetch(modulePath);
            if (!response.ok) throw new Error(`Ошибка загрузки: ${response.status}`);
            
            const html = await response.text();
            
            // Вставляем HTML в контейнер
            document.getElementById('app').innerHTML = html;
            
            // Обновляем активную ссылку в навигации
            this.updateActiveNavLink();
            
            // Загружаем соответствующий JS модуль
            await this.loadModuleScript(moduleName);
            
        } catch (error) {
            console.error('Ошибка загрузки модуля:', error);
            document.getElementById('app').innerHTML = `
                <div class="error-container">
                    <h2>Ошибка загрузки</h2>
                    <p>${error.message}</p>
                    <button onclick="app.loadModule('home')">Вернуться на главную</button>
                </div>
            `;
        } finally {
            this.hideLoading();
        }
    }
    
    async loadModuleScript(moduleName) {
        try {
            const scriptPath = `js/modules/${moduleName}.js`;
            const module = await import(scriptPath);
            
            if (typeof module.init === 'function') {
                await module.init();
            }
        } catch (error) {
            console.log(`JS модуль для ${moduleName} не найден или не требуется`);
        }
    }
    
    initNavigation() {
        // Навигация будет в каждом модуле отдельно
        // Здесь мы только обрабатываем клики по ссылкам
        document.addEventListener('click', (e) => {
            if (e.target.matches('[data-module]')) {
                e.preventDefault();
                const moduleName = e.target.getAttribute('data-module');
                this.loadModule(moduleName);
            }
        });
    }
    
    updateActiveNavLink() {
        // Обновляем активные ссылки в навигации
        document.querySelectorAll('[data-module]').forEach(link => {
            const moduleName = link.getAttribute('data-module');
            if (moduleName === this.currentModule) {
                link.classList.add('active');
            } else {
                link.classList.remove('active');
            }
        });
    }
    
    showLoading() {
        // Создаем индикатор загрузки
        const loader = document.createElement('div');
        loader.id = 'page-loader';
        loader.className = 'page-loader';
        loader.innerHTML = `
            <div class="loader-spinner"></div>
            <p>Загрузка...</p>
        `;
        document.getElementById('app').appendChild(loader);
    }
    
    hideLoading() {
        const loader = document.getElementById('page-loader');
        if (loader) {
            loader.remove();
        }
    }
    
    initPWA() {
        let deferredPrompt;
        
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            
            // Показываем кнопку установки через 5 секунд
            setTimeout(() => {
                if (deferredPrompt && !window.matchMedia('(display-mode: standalone)').matches) {
                    document.getElementById('pwa-install-prompt').classList.remove('hidden');
                }
            }, 5000);
        });
        
        document.getElementById('install-button').addEventListener('click', async () => {
            if (deferredPrompt) {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`Пользователь ${outcome} установку`);
                deferredPrompt = null;
                document.getElementById('pwa-install-prompt').classList.add('hidden');
            }
        });
        
        document.getElementById('cancel-install').addEventListener('click', () => {
            document.getElementById('pwa-install-prompt').classList.add('hidden');
        });
    }
    
    initOnlineStatus() {
        function updateOnlineStatus() {
            const offlineMessage = document.getElementById('offline-message');
            if (navigator.onLine) {
                offlineMessage.classList.add('hidden');
            } else {
                offlineMessage.classList.remove('hidden');
            }
        }
        
        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);
        updateOnlineStatus();
    }
    
    restoreLastPage() {
        const lastPage = localStorage.getItem('lastPage');
        if (lastPage && lastPage !== 'home') {
            setTimeout(() => this.loadModule(lastPage), 100);
        }
    }
    
    // Вспомогательные методы
    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#4CAF50' : '#f44336'};
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            z-index: 1000;
            animation: slideIn 0.3s ease;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideIn 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Создаем и экспортируем экземпляр приложения
window.app = new ProductionSystemApp();