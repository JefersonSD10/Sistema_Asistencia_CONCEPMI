// Main JavaScript file for Registro de Asistencia

// Global variables
let loadingModal = null;
let toastElement = null;

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    initializeComponents();
    setupGlobalEventListeners();
});

function initializeComponents() {
    // Initialize Bootstrap components
    loadingModal = new bootstrap.Modal(document.getElementById('loadingModal'), {
        backdrop: 'static',
        keyboard: false
    });
    
    toastElement = document.getElementById('liveToast');
    
    // Add fade-in animation to cards
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        setTimeout(() => {
            card.classList.add('fade-in');
        }, index * 100);
    });
}

function setupGlobalEventListeners() {
    // Handle network errors globally
    window.addEventListener('online', function() {
        showToast('Conexión', 'Conexión a internet restaurada', 'success');
    });
    
    window.addEventListener('offline', function() {
        showToast('Sin conexión', 'Se perdió la conexión a internet', 'warning');
    });
    
    // Handle form submissions with Enter key
    document.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
            const form = e.target.closest('form');
            if (form) {
                const submitBtn = form.querySelector('button[type="submit"], button[onclick]');
                if (submitBtn && !submitBtn.disabled) {
                    e.preventDefault();
                    submitBtn.click();
                }
            }
        }
    });
    
    // Auto-focus first input on page load
    const firstInput = document.querySelector('input[type="text"]:not([readonly])');
    if (firstInput) {
        setTimeout(() => firstInput.focus(), 100);
    }
}

// Loading management
function showLoading(show = true) {
    if (show) {
        loadingModal.show();
    } else {
        loadingModal.hide();
    }
}

// Toast notifications
function showToast(title, message, type = 'info') {
    const toast = new bootstrap.Toast(toastElement);
    const titleElement = document.getElementById('toast-title');
    const messageElement = document.getElementById('toast-message');
    const headerElement = toastElement.querySelector('.toast-header');
    
    // Set title and message
    titleElement.textContent = title;
    messageElement.textContent = message;
    
    // Set colors based on type
    headerElement.className = 'toast-header';
    switch(type) {
        case 'success':
            headerElement.classList.add('text-success');
            titleElement.innerHTML = '<i class="fas fa-check-circle me-2"></i>' + title;
            break;
        case 'error':
        case 'danger':
            headerElement.classList.add('text-danger');
            titleElement.innerHTML = '<i class="fas fa-exclamation-circle me-2"></i>' + title;
            break;
        case 'warning':
            headerElement.classList.add('text-warning');
            titleElement.innerHTML = '<i class="fas fa-exclamation-triangle me-2"></i>' + title;
            break;
        case 'info':
        default:
            headerElement.classList.add('text-info');
            titleElement.innerHTML = '<i class="fas fa-info-circle me-2"></i>' + title;
            break;
    }
    
    toast.show();
    
    // Auto-hide after longer duration for errors
    if (type === 'error' || type === 'danger') {
        setTimeout(() => toast.hide(), 8000);
    }
}

// API Helper functions
async function apiRequest(url, options = {}) {
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
    };
    
    const mergedOptions = {
        ...defaultOptions,
        ...options,
        headers: {
            ...defaultOptions.headers,
            ...options.headers,
        },
    };
    
    try {
        const response = await fetch(url, mergedOptions);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API Request Error:', error);
        throw error;
    }
}

// Form validation helpers
function validateDNI(dni) {
    const cleanDNI = dni.replace(/\D/g, '');
    return cleanDNI.length === 8 && /^\d{8}$/.test(cleanDNI);
}

function formatDNI(input) {
    let value = input.value.replace(/\D/g, '');
    if (value.length > 8) {
        value = value.substring(0, 8);
    }
    input.value = value;
    
    // Add visual feedback
    if (validateDNI(value)) {
        input.classList.remove('error-state');
        input.classList.add('success-state');
    } else {
        input.classList.remove('success-state');
        if (value.length > 0) {
            input.classList.add('error-state');
        } else {
            input.classList.remove('error-state');
        }
    }
    
    return value;
}

// Local storage helpers
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Error saving to localStorage:', error);
        return false;
    }
}

function loadFromLocalStorage(key, defaultValue = null) {
    try {
        const stored = localStorage.getItem(key);
        return stored ? JSON.parse(stored) : defaultValue;
    } catch (error) {
        console.error('Error loading from localStorage:', error);
        return defaultValue;
    }
}

// Date/Time helpers
function formatDateTime(date = new Date()) {
    return date.toLocaleString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

function formatDate(date = new Date()) {
    return date.toLocaleDateString('es-PE', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });
}

// UI Helper functions
function addPulseEffect(element, duration = 2000) {
    element.classList.add('pulse');
    setTimeout(() => {
        element.classList.remove('pulse');
    }, duration);
}

function showSuccessAnimation(element) {
    element.classList.add('success-state');
    addPulseEffect(element, 1000);
    setTimeout(() => {
        element.classList.remove('success-state');
    }, 3000);
}

function showErrorAnimation(element) {
    element.classList.add('error-state');
    element.style.animation = 'shake 0.5s ease-in-out';
    setTimeout(() => {
        element.classList.remove('error-state');
        element.style.animation = '';
    }, 3000);
}

// Network status helpers
function checkNetworkStatus() {
    return navigator.onLine;
}

function waitForNetwork() {
    return new Promise((resolve) => {
        if (navigator.onLine) {
            resolve(true);
        } else {
            const handler = () => {
                window.removeEventListener('online', handler);
                resolve(true);
            };
            window.addEventListener('online', handler);
        }
    });
}

// Device helpers
function isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function vibrate(pattern = 200) {
    if ('vibrate' in navigator) {
        navigator.vibrate(pattern);
    }
}

function playSuccessSound() {
    // Create a simple success sound using Web Audio API
    if ('AudioContext' in window || 'webkitAudioContext' in window) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const context = new AudioContext();
        
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        
        oscillator.frequency.setValueAtTime(800, context.currentTime);
        oscillator.frequency.setValueAtTime(600, context.currentTime + 0.1);
        oscillator.frequency.setValueAtTime(800, context.currentTime + 0.2);
        
        gainNode.gain.setValueAtTime(0, context.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.3, context.currentTime + 0.01);
        gainNode.gain.linearRampToValueAtTime(0, context.currentTime + 0.3);
        
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.3);
    }
}

// Error handling
function handleError(error, userMessage = 'Ha ocurrido un error inesperado') {
    console.error('Application Error:', error);
    
    let errorMessage = userMessage;
    
    if (error.name === 'NetworkError' || !navigator.onLine) {
        errorMessage = 'Error de conexión. Verifica tu conexión a internet.';
    } else if (error.status === 404) {
        errorMessage = 'Recurso no encontrado.';
    } else if (error.status === 500) {
        errorMessage = 'Error del servidor. Inténtalo más tarde.';
    } else if (error.message) {
        errorMessage = error.message;
    }
    
    showToast('Error', errorMessage, 'error');
}

// Performance helpers
function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            timeout = null;
            if (!immediate) func(...args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func(...args);
    };
}

function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// Initialization check
function initializationCheck() {
    const checks = {
        bootstrap: typeof bootstrap !== 'undefined',
        localStorage: typeof Storage !== 'undefined',
        fetch: typeof fetch !== 'undefined',
        promises: typeof Promise !== 'undefined'
    };
    
    const failed = Object.entries(checks)
        .filter(([key, value]) => !value)
        .map(([key]) => key);
    
    if (failed.length > 0) {
        console.warn('Missing browser features:', failed);
        showToast('Advertencia', 'Tu navegador no soporta todas las funcionalidades', 'warning');
    }
    
    return failed.length === 0;
}

// Export functions for use in other files
window.RegistroApp = {
    showLoading,
    showToast,
    apiRequest,
    validateDNI,
    formatDNI,
    saveToLocalStorage,
    loadFromLocalStorage,
    formatDateTime,
    formatDate,
    addPulseEffect,
    showSuccessAnimation,
    showErrorAnimation,
    checkNetworkStatus,
    waitForNetwork,
    isMobileDevice,
    vibrate,
    playSuccessSound,
    handleError,
    debounce,
    throttle
};

// Initialize the app
initializationCheck();
