import QrScanner from 'https://cdn.jsdelivr.net/npm/qr-scanner@1.4.2/qr-scanner.min.js';

let scanner = null;

export async function init() {
    console.log('Модуль создания рулона загружен');
    
    initScanner();
    initForm();
}

function initScanner() {
    const startBtn = document.getElementById('start-scanner');
    const stopBtn = document.getElementById('stop-scanner');
    const status = document.getElementById('scanner-status');
    const qrInput = document.getElementById('qr-code');
    
    startBtn.addEventListener('click', startScanner);
    stopBtn.addEventListener('click', stopScanner);
    
    async function startScanner() {
        try {
            scanner = new QrScanner(
                document.getElementById('qr-video'),
                result => {
                    qrInput.value = result.data;
                    status.textContent = '✅ QR-код распознан!';
                    playSuccessSound();
                    stopScanner();
                    app.showNotification('QR-код успешно отсканирован');
                },
                {
                    onDecodeError: error => {
                        if (!error.includes('No QR code found')) {
                            status.textContent = `❌ ${error}`;
                        }
                    },
                    highlightScanRegion: true,
                    highlightCodeOutline: true,
                }
            );
            
            await scanner.start();
            status.textContent = '🔍 Сканирование... Наведите на QR-код';
            
            startBtn.classList.add('hidden');
            stopBtn.classList.remove('hidden');
            
        } catch (error) {
            status.textContent = `❌ Ошибка: ${error.message}`;
        }
    }
    
    function stopScanner() {
        if (scanner) {
            scanner.stop();
            scanner = null;
            status.textContent = 'Сканер остановлен';
            startBtn.classList.remove('hidden');
            stopBtn.classList.add('hidden');
        }
    }
    
    // Кнопка генерации QR
    document.getElementById('generate-qr').addEventListener('click', () => {
        const qrCode = 'ROLL-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        qrInput.value = qrCode;
        app.showNotification('Сгенерирован новый QR-код');
    });
}

function initForm() {
    const form = document.getElementById('roll-form');
    const resultDiv = document.getElementById('roll-result');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const rollData = {
            article: document.getElementById('article').value,
            material: document.getElementById('material').value,
            width: document.getElementById('width').value,
            diameter: document.getElementById('diameter').value,
            weight: document.getElementById('weight').value,
            qrCode: document.getElementById('qr-code').value,
            createdAt: new Date().toISOString(),
            status: 'created'
        };
        
        try {
            // Сохраняем в localStorage (в реальном приложении - API запрос)
            saveRoll(rollData);
            
            resultDiv.innerHTML = `
                <div class="success-card">
                    <h3>✅ Рулон успешно создан!</h3>
                    <p><strong>Артикул:</strong> ${rollData.article}</p>
                    <p><strong>QR-код:</strong> ${rollData.qrCode}</p>
                    <p><strong>Материал:</strong> ${rollData.material}</p>
                    <p><strong>Статус:</strong> Создан</p>
                    <button class="btn btn-primary mt-20" onclick="printRoll('${rollData.qrCode}')">
                        🖨️ Печать этикетки
                    </button>
                </div>
            `;
            resultDiv.classList.remove('hidden');
            
            form.reset();
            app.showNotification('Рулон сохранен успешно');
            
        } catch (error) {
            app.showNotification('Ошибка сохранения рулона', 'error');
        }
    });
}

function saveRoll(rollData) {
    let rolls = JSON.parse(localStorage.getItem('rolls') || '[]');
    rolls.push(rollData);
    localStorage.setItem('rolls', JSON.stringify(rolls));
}

function playSuccessSound() {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
        oscillator.frequency.setValueAtTime(1200, audioContext.currentTime + 0.1);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
    } catch (e) {
        console.log('Аудио контекст не поддерживается');
    }
}

// Глобальная функция для печати
window.printRoll = function(qrCode) {
    const rolls = JSON.parse(localStorage.getItem('rolls') || '[]');
    const roll = rolls.find(r => r.qrCode === qrCode);
    
    if (roll) {
        const printContent = `
            <html>
                <head>
                    <title>Этикетка рулона</title>
                    <style>
                        body { font-family: Arial; padding: 20px; }
                        .label { border: 2px solid #000; padding: 15px; }
                        h2 { margin-top: 0; }
                    </style>
                </head>
                <body>
                    <div class="label">
                        <h2>Этикетка рулона</h2>
                        <p><strong>QR-код:</strong> ${roll.qrCode}</p>
                        <p><strong>Артикул:</strong> ${roll.article}</p>
                        <p><strong>Материал:</strong> ${roll.material}</p>
                        <p><strong>Размер:</strong> ${roll.width}мм × ${roll.diameter}мм</p>
                        <p><strong>Вес:</strong> ${roll.weight}кг</p>
                        <p><strong>Дата:</strong> ${new Date(roll.createdAt).toLocaleDateString()}</p>
                    </div>
                </body>
            </html>
        `;
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    }
};