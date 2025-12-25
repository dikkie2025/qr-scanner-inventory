// Модуль главной страницы
export function init() {
    console.log('Главная страница загружена');
    
    // Добавляем обработчики для карточек
    document.querySelectorAll('.card[data-module]').forEach(card => {
        card.addEventListener('click', function() {
            const moduleName = this.getAttribute('data-module');
            app.loadModule(moduleName);
        });
    });
}