
const appState = {
    user: null,
    isPro: false,
    questsCompleted: 0,
    currentQuest: null,
    questHistory: [],
    badges: [],
    token: localStorage.getItem('questgo_token') || null
};

document.addEventListener('DOMContentLoaded', async () => {
    if (appState.token) {
        try {
            await loadUserProfile();
            showScreen('main-app');
            await loadQuestHistory();
            updateUI();
        } catch (error) {
            console.error('Ошибка загрузки профиля:', error);
            localStorage.removeItem('questgo_token');
            appState.token = null;
            showScreen('login-screen');
        }
    }
    
    initializeApp();
});

function initializeApp() {
    setupLoginHandlers();
    setupProfileFormHandlers();
    setupQuestHandlers();
    setupTabBarHandlers();
    setupSettingsHandlers();
    setupFriendsHandlers();
}

async function loadUserProfile() {
    try {
        const response = await API.getProfile();
        appState.user = response.user;
        appState.isPro = response.user.is_pro === 1;
        appState.questsCompleted = response.stats?.completed_quests || 0;
        appState.badges = response.achievements || [];
        
        updateGreeting();
        displayProfile();
        updateProStatus();
        updateProgress();
        updateBadgesDisplay();
    } catch (error) {
        throw error;
    }
}

async function loadQuestHistory() {
    try {
        const response = await API.getQuestHistory();
        appState.questHistory = response.history || [];
        updateQuestHistory();
    } catch (error) {
        console.error('Ошибка загрузки истории:', error);
    }
}

function setupLoginHandlers() {
    const phoneInput = document.getElementById('phone');
    const loginBtn = document.getElementById('login-btn');
    
    phoneInput.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        if (value.length > 0) {
            if (value[0] !== '7') value = '7' + value;
            let formatted = '+7';
            if (value.length > 1) {
                formatted += ' (' + value.substring(1, 4);
            }
            if (value.length >= 5) {
                formatted += ') ' + value.substring(4, 7);
            }
            if (value.length >= 8) {
                formatted += '-' + value.substring(7, 9);
            }
            if (value.length >= 10) {
                formatted += '-' + value.substring(9, 11);
            }
            e.target.value = formatted;
        }
    });
    
    loginBtn.addEventListener('click', async () => {
        const phone = phoneInput.value.replace(/\D/g, '');
        if (phone.length < 11) {
            alert('Пожалуйста, введите корректный номер телефона');
            return;
        }
        
        try {
            loginBtn.disabled = true;
            loginBtn.textContent = 'Вход...';
            
            const response = await API.login('+' + phone);
            
            if (response.success) {
                appState.token = response.token;
                appState.user = response.user;
                appState.isPro = response.user.is_pro === 1;
                localStorage.setItem('questgo_token', response.token);
                
                showScreen('main-app');
                await loadUserProfile();
                await loadQuestHistory();
                updateUI();
            }
        } catch (error) {
            document.getElementById('phone-readonly').value = phoneInput.value;
            showScreen('profile-setup-screen');
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Войти';
        }
    });
}

function setupProfileFormHandlers() {
    const form = document.getElementById('profile-form');
    const usernameInput = document.getElementById('username');
    const ageInput = document.getElementById('age');
    const cityInput = document.getElementById('city');
    const genderButtons = document.querySelectorAll('#profile-setup-screen .gender-btn');
    const interestButtons = document.querySelectorAll('#profile-setup-screen .interest-btn');
    const customInterestInput = document.getElementById('custom-interest');
    
    let selectedGender = '';
    let selectedInterests = [];
    
    usernameInput.addEventListener('input', (e) => {
        let value = e.target.value;
        if (value && !value.startsWith('@')) {
            value = '@' + value;
        }
        value = value.replace(/[^@a-zA-Z0-9_]/g, '');
        e.target.value = value;
        validateProfileForm();
    });
    
    ageInput.addEventListener('input', validateProfileForm);
    cityInput.addEventListener('input', validateProfileForm);
    
    genderButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            genderButtons.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            selectedGender = btn.dataset.gender;
            validateProfileForm();
        });
    });
    
    interestButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.interest === 'другое') {
                customInterestInput.style.display = 'block';
                btn.classList.add('selected');
            } else {
                btn.classList.toggle('selected');
            }
            updateInterests();
            validateProfileForm();
        });
    });
    
    customInterestInput.addEventListener('input', () => {
        updateInterests();
        validateProfileForm();
    });
    
    function updateInterests() {
        const selected = Array.from(document.querySelectorAll('#profile-setup-screen .interest-btn.selected'))
            .map(btn => btn.dataset.interest)
            .filter(i => i !== 'другое');
        const customValue = customInterestInput.value.trim();
        
        selectedInterests = [...selected];
        if (customValue) {
            selectedInterests.push(customValue);
        }
    }
    
    function validateProfileForm() {
        const username = usernameInput.value;
        const age = ageInput.value;
        const city = cityInput.value;
        const hasGender = selectedGender !== '';
        const hasInterests = selectedInterests.length > 0;
        
        const isValid = username.length > 1 && 
                       age > 0 && 
                       city.length > 0 && 
                       hasGender && 
                       hasInterests;
        
        document.getElementById('save-profile-btn').disabled = !isValid;
    }
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const phone = document.getElementById('phone-readonly').value.replace(/\D/g, '');
        const userData = {
            phone: '+' + phone,
            username: usernameInput.value,
            age: parseInt(ageInput.value),
            gender: selectedGender,
            city: cityInput.value,
            interests: selectedInterests
        };
        
        try {
            const saveBtn = document.getElementById('save-profile-btn');
            saveBtn.disabled = true;
            saveBtn.textContent = 'Сохранение...';
            
            const response = await API.register(userData);
            
            if (response.success) {
                appState.token = response.token;
                appState.user = response.user;
                localStorage.setItem('questgo_token', response.token);
                
                showScreen('main-app');
                await loadUserProfile();
                updateUI();
            }
        } catch (error) {
            alert('Ошибка регистрации: ' + error.message);
        }
    });
}

function setupQuestHandlers() {
    const generateBtn = document.getElementById('generate-quest-btn');
    const completeBtn = document.getElementById('complete-quest-btn');
    const skipBtn = document.getElementById('skip-quest-btn');
    const shareBtn = document.getElementById('share-quest-btn');
    const tryProBtn = document.getElementById('try-pro-btn');
    const friendsQuestBtn = document.getElementById('friends-quest-btn');
    
    generateBtn.addEventListener('click', generateQuest);
    completeBtn.addEventListener('click', completeQuest);
    skipBtn.addEventListener('click', skipQuest);
    shareBtn?.addEventListener('click', shareQuest);
    
    if (tryProBtn) {
        tryProBtn.addEventListener('click', () => showSubscriptionModal());
    }
    
    friendsQuestBtn.addEventListener('click', () => {
        if (!appState.isPro) {
            showSubscriptionModal();
        } else {
            alert('Создание совместного квеста! (демо)');
        }
    });
}

async function generateQuest() {
    const generateBtn = document.getElementById('generate-quest-btn');
    
    if (generateBtn.disabled) {
        console.log('Генерация квеста уже в процессе, игнорируем повторный вызов');
        return;
    }
    
    try {
        generateBtn.disabled = true;
        generateBtn.textContent = '🤖 Генерация...';
        
        const response = await API.generateQuest();
        
        if (response.success && response.quest) {
            appState.currentQuest = response.quest;
            displayQuest(response.quest);
        } else {
            throw new Error(response.error || 'Не удалось сгенерировать квест');
        }
    } catch (error) {
        console.error('Ошибка генерации квеста:', error);
        alert('Ошибка генерации квеста: ' + (error.message || 'Неизвестная ошибка'));
    } finally {
        generateBtn.disabled = false;
        generateBtn.innerHTML = '<img src="./backend/logo.png" alt="Quest" class="btn-logo">Сгенерировать квест';
    }
}

function displayQuest(quest) {
    const questCard = document.getElementById('current-quest-card');
    const questText = document.getElementById('quest-text');
    
    if (!questCard || !questText) {
        console.error('Не найдены элементы для отображения квеста');
        return;
    }
    
    let questDisplay = `<strong>${quest.title}</strong><br><br>`;
    questDisplay += `${quest.description}<br><br>`;
    questDisplay += `<strong>Задания:</strong><br>`;
    if (quest.tasks && Array.isArray(quest.tasks)) {
        quest.tasks.forEach((task, index) => {
            questDisplay += `${index + 1}. ${task}<br>`;
        });
    }
    questDisplay += `<br><strong>Награда:</strong> ${quest.reward}`;
    
    questText.innerHTML = questDisplay;
    questCard.style.display = 'block';
    
    const generateBtn = document.getElementById('generate-quest-btn');
    if (generateBtn) {
        generateBtn.style.display = 'none';
    }
    
    updateShareButton();
}

async function completeQuest() {
    if (!appState.currentQuest) return;
    
    try {
        const response = await API.completeQuest(appState.currentQuest.id);
        
        if (response.success) {
            appState.questsCompleted++;
            alert(`🎉 Квест выполнен! +${response.points_earned} баллов`);
            
            appState.currentQuest = null;
            document.getElementById('current-quest-card').style.display = 'none';
            
            const generateBtn = document.getElementById('generate-quest-btn');
            generateBtn.style.display = 'block';
            generateBtn.innerHTML = '<img src="./backend/logo.png" alt="Quest" class="btn-logo">Сгенерировать квест';
            generateBtn.disabled = false;
            
            await loadUserProfile();
            await loadQuestHistory();
            updateUI();
        }
    } catch (error) {
        alert('Ошибка: ' + error.message);
    }
}

async function skipQuest() {
    if (!appState.currentQuest) return;
    
    try {
        await API.skipQuest(appState.currentQuest.id);
        
        appState.currentQuest = null;
        document.getElementById('current-quest-card').style.display = 'none';
        
        const generateBtn = document.getElementById('generate-quest-btn');
        generateBtn.style.display = 'block';
        generateBtn.innerHTML = '<img src="./backend/logo.png" alt="Quest" class="btn-logo">Сгенерировать квест';
        generateBtn.disabled = false;
        
        await generateQuest();
    } catch (error) {
        console.error('Ошибка пропуска:', error);
        // Не генерируем новый квест при ошибке пропуска, просто восстанавливаем кнопку
        appState.currentQuest = null;
        document.getElementById('current-quest-card').style.display = 'none';
        
        const generateBtn = document.getElementById('generate-quest-btn');
        generateBtn.style.display = 'block';
        generateBtn.innerHTML = '<img src="./backend/logo.png" alt="Quest" class="btn-logo">Сгенерировать квест';
        generateBtn.disabled = false;
    }
}

function shareQuest() {
    const link = `${window.location.origin}/quest/${appState.currentQuest?.id || 'demo'}`;
    navigator.clipboard.writeText(link).then(() => {
        alert('✓ Ссылка скопирована! Отправьте её другу для совместного прохождения квеста.');
    });
}

function updateShareButton() {
    const shareBtn = document.getElementById('share-quest-btn');
    if (appState.isPro && shareBtn) {
        shareBtn.style.display = 'block';
    }
}

// === UI UPDATES ===
function updateUI() {
    updateGreeting();
    updateProgress();
    updateQuestHistory();
    updateBadgesDisplay();
    updateProStatus();
}

function updateGreeting() {
    if (appState.user) {
        const name = appState.user.username.replace('@', '');
        document.getElementById('greeting').textContent = `Привет, ${name}! Готов к квесту?`;
    }
}

function updateProgress() {
    const completed = appState.questsCompleted;
    document.getElementById('quests-completed').textContent = completed;
    
    const progressPercent = (completed % 5) * 20;
    document.getElementById('progress-fill').style.width = progressPercent + '%';
}

function updateQuestHistory() {
    const historyList = document.getElementById('quests-history-list');
    
    if (!appState.questHistory || appState.questHistory.length === 0) {
        historyList.innerHTML = '<p class="empty-state">Вы еще не выполнили ни одного квеста. Начните прямо сейчас! 🎯</p>';
    } else {
        historyList.innerHTML = appState.questHistory
            .filter(item => item.status === 'completed')
            .map(item => {
                const date = new Date(item.completed_at).toLocaleDateString('ru-RU');
                return `
                    <div class="history-item">
                        <div class="history-date">${date}</div>
                        <div class="history-quest"><strong>${item.title}</strong><br>${item.description}</div>
                    </div>
                `;
            }).join('');
    }
}

function updateBadgesDisplay() {
    const badgesGrid = document.getElementById('badges-grid');
    const badges = [
        { code: 'novice', icon: '🌟', name: 'Новичок', requirement: '5 квестов', unlockAt: 5 },
        { code: 'seeker', icon: '🔍', name: 'Искатель', requirement: '20 квестов', unlockAt: 20 },
        { code: 'master', icon: '🏆', name: 'Мастер приключений', requirement: '50 квестов', unlockAt: 50 },
        { code: 'team_player', icon: '👥', name: 'Командный игрок', requirement: 'PRO: 10 совместных', unlockAt: 999, isPro: true }
    ];
    
    badgesGrid.innerHTML = badges.map(badge => {
        const unlocked = appState.badges.some(b => b.code === badge.code);
        return `
            <div class="badge-card ${unlocked ? 'unlocked' : 'locked'} ${badge.isPro ? 'pro-badge-card' : ''}">
                <div class="badge-icon">${badge.icon}</div>
                <div class="badge-name">${badge.name}</div>
                <div class="badge-requirement">${badge.requirement}</div>
            </div>
        `;
    }).join('');
}

function updateProStatus() {
    const subscriptionStatus = document.getElementById('subscription-status');
    const friendsQuestBtn = document.getElementById('friends-quest-btn');
    const proNote = document.getElementById('pro-note');
    
    if (appState.isPro) {
        subscriptionStatus.querySelector('.subscription-tier').textContent = 'PRO подписка активна';
        subscriptionStatus.querySelector('p').textContent = 'Спасибо за поддержку! Вы получили доступ ко всем возможностям.';
        subscriptionStatus.classList.add('pro-active');
        document.getElementById('subscribe-btn').textContent = 'Управление подпиской';
        
        friendsQuestBtn.classList.remove('btn-disabled');
        friendsQuestBtn.classList.add('btn-primary');
        if (proNote) proNote.style.display = 'none';
    }
}

function displayProfile() {
    if (!appState.user) return;
    
    const profileDisplay = document.getElementById('profile-display');
    profileDisplay.innerHTML = `
        <div class="profile-field">
            <div class="profile-label">Имя пользователя</div>
            <div class="profile-value">${appState.user.username}</div>
        </div>
        <div class="profile-field">
            <div class="profile-label">Возраст</div>
            <div class="profile-value">${appState.user.age} лет</div>
        </div>
        <div class="profile-field">
            <div class="profile-label">Пол</div>
            <div class="profile-value">${appState.user.gender}</div>
        </div>
        <div class="profile-field">
            <div class="profile-label">Город</div>
            <div class="profile-value">${appState.user.city}</div>
        </div>
        <div class="profile-field">
            <div class="profile-label">Интересы</div>
            <div class="profile-value">${appState.user.interests.join(', ')}</div>
        </div>
        <div class="profile-field">
            <div class="profile-label">Телефон</div>
            <div class="profile-value">${appState.user.phone}</div>
        </div>
    `;
}

// === НАВИГАЦИЯ ===
function setupTabBarHandlers() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            showTab(targetTab);
            
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

function showTab(tabId) {
    const tabs = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => tab.classList.remove('active'));
    
    const targetTab = document.getElementById(tabId);
    if (targetTab) {
        targetTab.classList.add('active');
    }
}

function showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active'));
    
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }
}

// === НАСТРОЙКИ ===
function setupSettingsHandlers() {
    const subscribeBtn = document.getElementById('subscribe-btn');
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const friendsProBtn = document.getElementById('friends-pro-btn');
    
    subscribeBtn.addEventListener('click', () => showSubscriptionModal());
    editProfileBtn.addEventListener('click', () => showEditProfileModal());
    
    // Обработчики для модальных окон
    const subscriptionModalClose = document.getElementById('subscription-modal-close');
    const editProfileModalClose = document.getElementById('edit-profile-modal-close');
    const activateProBtn = document.getElementById('activate-pro-btn');
    
    if (subscriptionModalClose) {
        subscriptionModalClose.addEventListener('click', closeSubscriptionModal);
    }
    
    if (editProfileModalClose) {
        editProfileModalClose.addEventListener('click', closeEditProfileModal);
    }
    
    if (activateProBtn) {
        activateProBtn.addEventListener('click', activatePro);
    }
    
    if (friendsProBtn) {
        friendsProBtn.addEventListener('click', () => {
            showTab('settings-tab');
            showSubscriptionModal();
        });
    }
    
    // Обработчики для кнопок поддержки
    setupSupportHandlers();
    
    // Обработчик для кнопки копирования реферальной ссылки
    const copyReferralBtn = document.getElementById('copy-referral-btn');
    if (copyReferralBtn) {
        copyReferralBtn.addEventListener('click', copyReferralLink);
    }
    
    // Обработчик для клика по полю ввода реферальной ссылки
    const referralInput = document.getElementById('referral-link-input');
    if (referralInput) {
        referralInput.addEventListener('click', () => {
            referralInput.select();
            copyReferralLink();
        });
    }
}

function setupSupportHandlers() {
    const supportButtons = [
        { btn: 'support-email-btn', content: 'support-email-content' },
        { btn: 'support-faq-btn', content: 'support-faq-content' },
        { btn: 'support-about-btn', content: 'support-about-content' }
    ];
    
    supportButtons.forEach(({ btn, content }) => {
        const button = document.getElementById(btn);
        const contentDiv = document.getElementById(content);
        const item = button.closest('.support-item');
        
        if (button && contentDiv && item) {
            button.addEventListener('click', () => {
                const isActive = item.classList.contains('active');
                
                // Закрываем все другие элементы
                document.querySelectorAll('.support-item').forEach(otherItem => {
                    if (otherItem !== item) {
                        otherItem.classList.remove('active');
                        const otherContent = otherItem.querySelector('.support-content');
                        if (otherContent) {
                            otherContent.classList.remove('active');
                        }
                    }
                });
                
                // Переключаем текущий элемент
                if (isActive) {
                    item.classList.remove('active');
                    contentDiv.classList.remove('active');
                } else {
                    item.classList.add('active');
                    contentDiv.classList.add('active');
                }
            });
        }
    });
}

function setupFriendsHandlers() {
    // Обработчики для кнопок "Профиль" в списке друзей
    const profileButtons = document.querySelectorAll('#friends-list .btn');
    profileButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            alert('Просмотр профиля друга (демо-функция)');
        });
    });
    
    // Обработчик для поиска друзей
    const searchInput = document.getElementById('friend-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            const friendCards = document.querySelectorAll('.friend-card');
            
            friendCards.forEach(card => {
                const friendName = card.querySelector('.friend-name').textContent.toLowerCase();
                if (friendName.includes(searchTerm)) {
                    card.style.display = 'flex';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }
}

function showSubscriptionModal() {
    const modal = document.getElementById('subscription-modal');
    modal.classList.add('active');
    
    // Добавляем обработчик клика на фон для закрытия модального окна
    modal._clickHandler = (e) => {
        if (e.target === modal) {
            closeSubscriptionModal();
        }
    };
    modal.addEventListener('click', modal._clickHandler);
    
    // Добавляем дополнительный обработчик для кнопки закрытия
    const closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeSubscriptionModal);
    }
    
    // Добавляем обработчик клавиши Escape
    modal._escapeHandler = (e) => {
        if (e.key === 'Escape') {
            closeSubscriptionModal();
        }
    };
    document.addEventListener('keydown', modal._escapeHandler);
}

function closeSubscriptionModal() {
    const modal = document.getElementById('subscription-modal');
    if (modal) {
        modal.classList.remove('active');
        console.log('Модальное окно подписки закрыто');
        
        // Удаляем обработчики событий
        modal.removeEventListener('click', modal._clickHandler);
        if (modal._escapeHandler) {
            document.removeEventListener('keydown', modal._escapeHandler);
        }
    }
}

function activatePro() {
    appState.isPro = true;
    if (appState.user) {
        appState.user.is_pro = 1;
    }
    updateProStatus();
    closeSubscriptionModal();
    alert('🎉 Поздравляем! PRO-подписка активирована! (демо-режим)');
}

function showEditProfileModal() {
    const modal = document.getElementById('edit-profile-modal');
    
    if (!appState.user) return;
    
    // Заполнить форму текущими данными
    document.getElementById('edit-username').value = appState.user.username;
    document.getElementById('edit-age').value = appState.user.age;
    document.getElementById('edit-city').value = appState.user.city;
    
    // Установить выбранный пол
    const genderButtons = document.querySelectorAll('#edit-profile-modal .gender-btn');
    genderButtons.forEach(btn => {
        if (btn.dataset.gender === appState.user.gender) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
    
    // Установить выбранные интересы
    const interestButtons = document.querySelectorAll('#edit-profile-modal .interest-btn');
    const userInterests = appState.user.interests || [];
    const standardInterests = ['еда', 'спорт', 'искусство', 'путешествия'];
    const customInterestInput = document.getElementById('edit-custom-interest');
    
    let hasCustomInterest = false;
    const customInterests = [];
    
    interestButtons.forEach(btn => {
        if (userInterests.includes(btn.dataset.interest)) {
            btn.classList.add('selected');
        } else {
            btn.classList.remove('selected');
        }
    });
    
    // Проверить наличие кастомных интересов
    userInterests.forEach(interest => {
        if (!standardInterests.includes(interest)) {
            customInterests.push(interest);
            hasCustomInterest = true;
        }
    });
    
    // Если есть кастомные интересы, показать поле и заполнить его
    if (hasCustomInterest && customInterestInput) {
        customInterestInput.style.display = 'block';
        customInterestInput.value = customInterests.join(', ');
        // Активировать кнопку "Другое"
        const otherBtn = Array.from(interestButtons).find(btn => btn.dataset.interest === 'другое');
        if (otherBtn) {
            otherBtn.classList.add('selected');
        }
    } else if (customInterestInput) {
        customInterestInput.style.display = 'none';
        customInterestInput.value = '';
    }
    
    modal.classList.add('active');
    
    // Обработчики для формы редактирования
    setupEditProfileHandlers();
}

function closeEditProfileModal() {
    document.getElementById('edit-profile-modal').classList.remove('active');
}

function setupEditProfileHandlers() {
    const form = document.getElementById('edit-profile-form');
    const genderButtons = document.querySelectorAll('#edit-profile-modal .gender-btn');
    const interestButtons = document.querySelectorAll('#edit-profile-modal .interest-btn');
    
    // Удалить старые обработчики
    const newForm = form.cloneNode(true);
    form.parentNode.replaceChild(newForm, form);
    
    // Получить новые элементы после клонирования
    const editForm = document.getElementById('edit-profile-form');
    const newGenderButtons = document.querySelectorAll('#edit-profile-modal .gender-btn');
    const newInterestButtons = document.querySelectorAll('#edit-profile-modal .interest-btn');
    const customInterestInput = document.getElementById('edit-custom-interest');
    
    // Валидация username
    const usernameInput = document.getElementById('edit-username');
    usernameInput.addEventListener('input', (e) => {
        let value = e.target.value;
        if (value && !value.startsWith('@')) {
            value = '@' + value;
        }
        value = value.replace(/[^@a-zA-Z0-9_]/g, '');
        e.target.value = value;
    });
    
    // Выбор пола
    newGenderButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            newGenderButtons.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
        });
    });
    
    // Выбор интересов
    newInterestButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.dataset.interest === 'другое') {
                if (customInterestInput) {
                    customInterestInput.style.display = 'block';
                }
                btn.classList.add('selected');
            } else {
                btn.classList.toggle('selected');
            }
        });
    });
    
    // Сохранение
    editForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const username = document.getElementById('edit-username').value;
        const age = parseInt(document.getElementById('edit-age').value);
        const city = document.getElementById('edit-city').value;
        
        const selectedGender = document.querySelector('#edit-profile-modal .gender-btn.selected');
        const gender = selectedGender ? selectedGender.dataset.gender : appState.user.gender;
        
        const selectedInterests = Array.from(document.querySelectorAll('#edit-profile-modal .interest-btn.selected'))
            .map(btn => btn.dataset.interest)
            .filter(i => i !== 'другое');
        
        if (customInterestInput && customInterestInput.value.trim()) {
            selectedInterests.push(customInterestInput.value.trim());
        }
        
        // Валидация
        if (!username || username.length <= 1) {
            alert('Введите корректное имя пользователя');
            return;
        }
        
        if (!age || age < 1 || age > 120) {
            alert('Введите корректный возраст');
            return;
        }
        
        if (!city || city.trim().length === 0) {
            alert('Введите город');
            return;
        }
        
        if (!gender) {
            alert('Выберите пол');
            return;
        }
        
        if (selectedInterests.length === 0) {
            alert('Выберите хотя бы один интерес');
            return;
        }
        
        try {
            const submitBtn = editForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Сохранение...';
            
            const response = await API.updateProfile({
                username,
                age,
                gender,
                city,
                interests: selectedInterests
            });
            
            if (response.success) {
                // Обновить локальное состояние
                appState.user = response.user;
                
                // Обновить отображение профиля
                displayProfile();
                updateGreeting();
                
                closeEditProfileModal();
                alert('✓ Профиль успешно обновлен!');
            }
        } catch (error) {
            alert('Ошибка обновления профиля: ' + error.message);
        } finally {
            const submitBtn = editForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Сохранить изменения';
            }
        }
    });
}

function copyReferralLink() {
    const link = 'https://questgo.app/ref/demo123';
    
    // Современный способ через Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(link).then(() => {
            showCopySuccess();
        }).catch(() => {
            fallbackCopyTextToClipboard(link);
        });
    } else {
        // Fallback для старых браузеров
        fallbackCopyTextToClipboard(link);
    }
}

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Избегаем прокрутки к элементу
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showCopySuccess();
        } else {
            showCopyError();
        }
    } catch (err) {
        showCopyError();
    }
    
    document.body.removeChild(textArea);
}

function showCopySuccess() {
    // Создаем красивое уведомление вместо alert
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        font-weight: 500;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = '✓ Реферальная ссылка скопирована!';
    
    // Добавляем CSS анимацию
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    // Удаляем уведомление через 3 секунды
    setTimeout(() => {
        if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
        }
        if (style.parentNode) {
            style.parentNode.removeChild(style);
        }
    }, 3000);
}

function showCopyError() {
    alert('Не удалось скопировать ссылку. Попробуйте выделить текст вручную.');
}

// Глобальные функции для HTML
window.showSubscriptionModal = showSubscriptionModal;
window.closeSubscriptionModal = closeSubscriptionModal;
window.activatePro = activatePro;
window.showEditProfileModal = showEditProfileModal;
window.closeEditProfileModal = closeEditProfileModal;
window.copyReferralLink = copyReferralLink;
window.showTab = showTab;

