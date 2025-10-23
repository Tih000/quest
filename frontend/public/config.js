// API Configuration for Frontend
const API_CONFIG = {
    BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:3000/api'
        : window.location.origin + '/api',
    
    getAuthHeader() {
        const token = localStorage.getItem('questgo_token');
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    },
    
    async request(endpoint, options = {}) {
        const url = `${this.BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...this.getAuthHeader(),
            ...options.headers
        };
        
        try {
            const response = await fetch(url, {
                ...options,
                headers
            });
            
            if (!response.ok) {
                let errorMessage = 'Ошибка запроса';
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || errorData.message || errorMessage;
                } catch (parseError) {
                    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }
            
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('API Error:', error);
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('Ошибка сети. Проверьте подключение к интернету.');
            }
            throw error;
        }
    },
    
    // Auth endpoints
    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    },
    
    async login(phone) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ phone })
        });
    },
    
    // User endpoints
    async getProfile() {
        return this.request('/users/me');
    },
    
    async updateProfile(userData) {
        return this.request('/users/me', {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
    },
    
    async getStats() {
        return this.request('/users/stats');
    },
    
    // Quest endpoints
    async generateQuest() {
        return this.request('/quests/generate', {
            method: 'POST'
        });
    },
    
    async getQuestHistory() {
        return this.request('/quests/history');
    },
    
    async getQuest(questId) {
        return this.request(`/quests/${questId}`);
    },
    
    async completeQuest(questId) {
        return this.request(`/quests/${questId}/complete`, {
            method: 'POST'
        });
    },
    
    async skipQuest(questId) {
        return this.request(`/quests/${questId}/skip`, {
            method: 'POST'
        });
    }
};

// Make it globally available
window.API = API_CONFIG;

