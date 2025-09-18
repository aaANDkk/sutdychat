// 应用主类
class StudyChatApp {
    constructor() {
        this.api = window.api;
        this.currentPage = 'friends';
        this.currentChatFriend = null;
        this.init();
    }

    // 初始化应用
    init() {
        this.setupEventListeners();
        this.checkAuthStatus();
    }

    // 设置事件监听器
    setupEventListeners() {
        // 认证相关事件
        document.getElementById('login-tab').addEventListener('click', () => this.showLoginForm());
        document.getElementById('register-tab').addEventListener('click', () => this.showRegisterForm());
        document.getElementById('login-btn').addEventListener('click', () => this.handleLogin());
        document.getElementById('register-btn').addEventListener('click', () => this.handleRegister());
        document.getElementById('logout-btn').addEventListener('click', () => this.handleLogout());

        // 导航相关事件
        document.getElementById('friends-nav').addEventListener('click', () => this.showPage('friends'));
        document.getElementById('profile-nav').addEventListener('click', () => this.showPage('profile'));
        document.getElementById('prizes-nav').addEventListener('click', () => this.showPage('prizes'));

        // 好友相关事件
        document.getElementById('add-friend-btn').addEventListener('click', () => this.showAddFriendModal());
        document.getElementById('close-add-friend').addEventListener('click', () => this.hideAddFriendModal());
        document.getElementById('confirm-add-friend').addEventListener('click', () => this.handleAddFriend());

        // 聊天相关事件
        document.getElementById('back-to-friends').addEventListener('click', () => this.showPage('friends'));
        document.getElementById('send-message-btn').addEventListener('click', () => this.handleSendMessage());
        document.getElementById('message-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSendMessage();
            }
        });

        // 模态框点击外部关闭
        document.getElementById('add-friend-modal').addEventListener('click', (e) => {
            if (e.target.id === 'add-friend-modal') {
                this.hideAddFriendModal();
            }
        });
    }

    // 检查认证状态
    checkAuthStatus() {
        if (this.api.token && this.api.currentUser) {
            this.showMainApp();
            this.updateUserInfo();
            this.loadFriends();
        } else {
            this.showAuthForm();
        }
    }

    // 显示认证表单
    showAuthForm() {
        document.getElementById('auth-container').style.display = 'block';
        document.getElementById('main-app').style.display = 'none';
    }

    // 显示主应用界面
    showMainApp() {
        document.getElementById('auth-container').style.display = 'none';
        document.getElementById('main-app').style.display = 'block';
    }

    // 显示登录表单
    showLoginForm() {
        document.getElementById('login-tab').classList.add('active');
        document.getElementById('register-tab').classList.remove('active');
        document.getElementById('login-form').style.display = 'block';
        document.getElementById('register-form').style.display = 'none';
        this.clearMessage();
    }

    // 显示注册表单
    showRegisterForm() {
        document.getElementById('login-tab').classList.remove('active');
        document.getElementById('register-tab').classList.add('active');
        document.getElementById('login-form').style.display = 'none';
        document.getElementById('register-form').style.display = 'block';
        this.clearMessage();
    }

    // 处理登录
    async handleLogin() {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();

        if (!username || !password) {
            this.showMessage('请输入用户名和密码', 'error');
            return;
        }

        try {
            await this.api.login({ username, password });
            this.showMessage('登录成功', 'success');
            this.showMainApp();
            this.updateUserInfo();
            this.loadFriends();
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    // 处理注册
    async handleRegister() {
        const username = document.getElementById('register-username').value.trim();
        const email = document.getElementById('register-email').value.trim();
        const password = document.getElementById('register-password').value.trim();

        if (!username || !email || !password) {
            this.showMessage('请填写所有字段', 'error');
            return;
        }

        try {
            await this.api.register({ username, email, password });
            this.showMessage('注册成功，请登录', 'success');
            this.showLoginForm();
            document.getElementById('login-username').value = username;
            document.getElementById('login-password').value = '';
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    // 处理退出登录
    handleLogout() {
        this.api.logout();
        this.showAuthForm();
        this.showLoginForm();
        document.getElementById('login-username').value = '';
        document.getElementById('login-password').value = '';
        document.getElementById('register-username').value = '';
        document.getElementById('register-email').value = '';
        document.getElementById('register-password').value = '';
    }

    // 更新用户信息
    async updateUserInfo() {
        try {
            const user = await this.api.getCurrentUser();
            this.api.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            document.getElementById('user-coins').textContent = `硬币: ${user.coins}`;
        } catch (error) {
            console.error('获取用户信息失败:', error);
        }
    }

    // 显示页面
    showPage(pageName) {
        // 隐藏所有页面
        document.querySelectorAll('.page').forEach(page => {
            page.style.display = 'none';
        });

        // 移除所有导航按钮的active类
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // 显示选中的页面
        document.getElementById(`${pageName}-page`).style.display = 'block';
        if (document.getElementById(`${pageName}-nav`)) {
            document.getElementById(`${pageName}-nav`).classList.add('active');
        }

        this.currentPage = pageName;

        // 根据页面加载相应数据
        switch (pageName) {
            case 'friends':
                this.loadFriends();
                break;
            case 'profile':
                this.loadProfile();
                break;
            case 'prizes':
                this.loadPrizes();
                break;
            case 'chat':
                // 聊天页面的数据加载在openChat函数中处理
                if (this.currentChatFriend) {
                    this.loadMessages(this.currentChatFriend.id);
                }
                break;
        }
    }

    // 加载好友列表
    async loadFriends() {
        try {
            const friends = await this.api.getFriends();
            const friendsList = document.getElementById('friends-list');
            friendsList.innerHTML = '';

            if (friends.length === 0) {
                friendsList.innerHTML = '<p>暂无好友，点击"添加好友"按钮添加</p>';
                return;
            }

            friends.forEach(friend => {
                const friendCard = document.createElement('div');
                friendCard.className = 'friend-card';
                friendCard.innerHTML = `
                    <h3>${friend.username}</h3>
                    <p>邮箱: ${friend.email}</p>
                    <div class="friend-actions">
                        <button class="btn-primary chat-btn" data-friend-id="${friend.id}" data-friend-name="${friend.username}">聊天</button>
                        <button class="btn-secondary delete-friend-btn" data-friend-id="${friend.id}">删除</button>
                    </div>
                `;
                friendsList.appendChild(friendCard);
            });

            // 添加聊天按钮事件
            document.querySelectorAll('.chat-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const friendId = parseInt(e.target.dataset.friendId);
                    const friendName = e.target.dataset.friendName;
                    this.openChat(friendId, friendName);
                });
            });

            // 添加删除好友按钮事件
            document.querySelectorAll('.delete-friend-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const friendId = parseInt(e.target.dataset.friendId);
                    if (confirm('确定要删除这个好友吗？')) {
                        await this.deleteFriend(friendId);
                    }
                });
            });
        } catch (error) {
            console.error('加载好友列表失败:', error);
        }
    }

    // 打开聊天页面
    async openChat(friendId, friendName) {
        this.currentChatFriend = { id: friendId, name: friendName };
        document.getElementById('chat-friend-name').textContent = friendName;
        
        // 显示加载提示
        const chatMessages = document.getElementById('chat-messages');
        chatMessages.innerHTML = '<div class="loading-message">正在加载聊天记录...</div>';
        
        this.showPage('chat');
        
        // 立即加载聊天记录
        await this.loadMessages(friendId);
    }

    // 加载聊天记录
    async loadMessages(friendId) {
        try {
            const messages = await this.api.getMessages(friendId);
            const chatMessages = document.getElementById('chat-messages');
            chatMessages.innerHTML = '';

            if (messages.length === 0) {
                // 显示空状态提示
                chatMessages.innerHTML = `
                    <div class="empty-chat-message">
                        <p>还没有聊天记录</p>
                        <p>发送第一条消息开始对话吧！</p>
                    </div>
                `;
            } else {
                messages.forEach(message => {
                    const messageBubble = document.createElement('div');
                    messageBubble.className = `message-bubble ${message.sender_id === this.api.currentUser.id ? 'sent' : 'received'}`;
                    messageBubble.innerHTML = `
                        <div class="message-content">${message.content}</div>
                        <div class="message-time">${new Date(message.created_at).toLocaleTimeString()}</div>
                    `;
                    chatMessages.appendChild(messageBubble);
                });

                // 滚动到底部
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
        } catch (error) {
            console.error('加载聊天记录失败:', error);
            const chatMessages = document.getElementById('chat-messages');
            chatMessages.innerHTML = '<div class="error-message">加载聊天记录失败，请稍后重试</div>';
        }
    }

    // 处理发送消息
    async handleSendMessage() {
        const messageInput = document.getElementById('message-input');
        const content = messageInput.value.trim();

        if (!content) {
            return;
        }

        try {
            await this.api.sendMessage({
                sender_id: this.api.currentUser.id,
                receiver_id: this.currentChatFriend.id,
                content: content
            });

            messageInput.value = '';
            this.loadMessages(this.currentChatFriend.id);
            this.updateUserInfo(); // 更新硬币数量
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    // 显示添加好友模态框
    showAddFriendModal() {
        document.getElementById('add-friend-modal').style.display = 'flex';
        document.getElementById('friend-username').value = '';
        document.getElementById('friend-username').focus();
    }

    // 隐藏添加好友模态框
    hideAddFriendModal() {
        document.getElementById('add-friend-modal').style.display = 'none';
    }

    // 处理添加好友
    async handleAddFriend() {
        const friendUsername = document.getElementById('friend-username').value.trim();

        if (!friendUsername) {
            this.showMessage('请输入好友用户名', 'error');
            return;
        }

        try {
            // 根据用户名获取用户信息
            const friend = await this.api.getUserByUsername(friendUsername);
            
            if (!friend) {
                this.showMessage('用户不存在', 'error');
                return;
            }

            // 不能添加自己为好友
            if (friend.id === this.api.currentUser.id) {
                this.showMessage('不能添加自己为好友', 'error');
                return;
            }

            await this.api.addFriend({
                user_id: this.api.currentUser.id,
                friend_id: friend.id
            });

            this.hideAddFriendModal();
            this.showMessage('添加好友成功', 'success');
            this.loadFriends();
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    // 删除好友
    async deleteFriend(friendId) {
        try {
            await this.api.deleteFriend(friendId);
            this.showMessage('删除好友成功', 'success');
            this.loadFriends();
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    // 加载个人资料
    async loadProfile() {
        try {
            const user = this.api.currentUser;
            document.getElementById('profile-username').textContent = user.username;
            document.getElementById('profile-email').textContent = user.email;
            document.getElementById('profile-coins').textContent = user.coins;

            const coinRecords = await this.api.getCoinRecords();
            const coinRecordsContainer = document.getElementById('coin-records');
            coinRecordsContainer.innerHTML = '';

            if (coinRecords.length === 0) {
                coinRecordsContainer.innerHTML = '<p>暂无硬币记录</p>';
                return;
            }

            coinRecords.forEach(record => {
                const recordElement = document.createElement('div');
                recordElement.className = 'coin-record';
                recordElement.innerHTML = `
                    <span>${record.reason}</span>
                    <span class="coin-amount ${record.amount > 0 ? 'positive' : 'negative'}">
                        ${record.amount > 0 ? '+' : ''}${record.amount}
                    </span>
                `;
                coinRecordsContainer.appendChild(recordElement);
            });
        } catch (error) {
            console.error('加载个人资料失败:', error);
        }
    }

    // 加载奖品列表
    async loadPrizes() {
        try {
            const prizes = await this.api.getPrizes();
            const prizesList = document.getElementById('prizes-list');
            prizesList.innerHTML = '';

            prizes.forEach(prize => {
                const prizeCard = document.createElement('div');
                prizeCard.className = 'prize-card';
                prizeCard.innerHTML = `
                    <img src="${prize.image_url || 'https://via.placeholder.com/300x200?text=Prize'}" alt="${prize.name}" class="prize-image">
                    <div class="prize-info">
                        <h3>${prize.name}</h3>
                        <p>${prize.description || '暂无描述'}</p>
                        <div class="prize-cost">
                            <span class="cost">${prize.cost} 硬币</span>
                        </div>
                        <button class="btn-primary redeem-btn" data-prize-id="${prize.id}" ${this.api.currentUser.coins < prize.cost ? 'disabled' : ''}>
                            ${this.api.currentUser.coins < prize.cost ? '硬币不足' : '兑换'}
                        </button>
                    </div>
                `;
                prizesList.appendChild(prizeCard);
            });

            // 添加兑换按钮事件
            document.querySelectorAll('.redeem-btn').forEach(btn => {
                if (!btn.disabled) {
                    btn.addEventListener('click', async (e) => {
                        const prizeId = parseInt(e.target.dataset.prizeId);
                        await this.redeemPrize(prizeId);
                    });
                }
            });
        } catch (error) {
            console.error('加载奖品列表失败:', error);
        }
    }

    // 兑换奖品
    async redeemPrize(prizeId) {
        try {
            await this.api.redeemPrize(prizeId);
            this.showMessage('兑换成功', 'success');
            this.updateUserInfo();
            this.loadPrizes();
        } catch (error) {
            this.showMessage(error.message, 'error');
        }
    }

    // 显示消息
    showMessage(message, type) {
        const messageElement = document.getElementById('auth-message');
        messageElement.textContent = message;
        messageElement.className = `message ${type}`;
        messageElement.style.display = 'block';

        // 3秒后自动隐藏消息
        setTimeout(() => {
            this.clearMessage();
        }, 3000);
    }

    // 清除消息
    clearMessage() {
        const messageElement = document.getElementById('auth-message');
        messageElement.textContent = '';
        messageElement.className = 'message';
        messageElement.style.display = 'none';
    }
}

// 初始化应用
document.addEventListener('DOMContentLoaded', () => {
    // 确保API实例已加载
    if (typeof api !== 'undefined') {
        window.api = api;
        window.app = new StudyChatApp();
    } else {
        console.error('API实例未加载');
    }
});