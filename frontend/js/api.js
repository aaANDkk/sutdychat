// API基础URL
const API_BASE_URL = 'http://localhost:8000';

// API类
class StudyChatAPI {
    constructor() {
        this.token = localStorage.getItem('token');
        this.currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    }

    // 通用请求方法
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const config = {
            ...options,
            headers
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || '请求失败');
            }

            return data;
        } catch (error) {
            console.error('API请求错误:', error);
            throw error;
        }
    }

    // 用户注册
    async register(userData) {
        return this.request('/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    // 用户登录
    async login(credentials) {
        const formData = new FormData();
        formData.append('username', credentials.username);
        formData.append('password', credentials.password);

        const response = await fetch(`${API_BASE_URL}/token`, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || '登录失败');
        }

        const data = await response.json();
        this.token = data.access_token;
        localStorage.setItem('token', this.token);

        // 获取用户信息
        const user = await this.getCurrentUser();
        this.currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));

        return data;
    }

    // 获取当前用户信息
    async getCurrentUser() {
        return this.request('/users/me');
    }

    // 根据用户名获取用户信息
    async getUserByUsername(username) {
        return this.request(`/users/username/${username}`);
    }

    // 获取好友列表
    async getFriends() {
        return this.request('/friends');
    }

    // 添加好友
    async addFriend(friendData) {
        return this.request('/friends', {
            method: 'POST',
            body: JSON.stringify(friendData)
        });
    }

    // 删除好友
    async deleteFriend(friendId) {
        return this.request(`/friends/${friendId}`, {
            method: 'DELETE'
        });
    }

    // 发送消息
    async sendMessage(messageData) {
        return this.request('/messages', {
            method: 'POST',
            body: JSON.stringify(messageData)
        });
    }

    // 获取聊天记录
    async getMessages(friendId) {
        return this.request(`/messages/${friendId}`);
    }

    // 获取硬币数量
    async getCoins() {
        return this.request('/coins');
    }

    // 获取硬币记录
    async getCoinRecords() {
        return this.request('/coin-records');
    }

    // 获取奖品列表
    async getPrizes() {
        return this.request('/prizes');
    }

    // 兑换奖品
    async redeemPrize(prizeId) {
        return this.request(`/prizes/${prizeId}/redeem`, {
            method: 'POST'
        });
    }

    // 退出登录
    logout() {
        this.token = null;
        this.currentUser = null;
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
    }
}

// 创建API实例
const api = new StudyChatAPI();

// 将API实例暴露到全局作用域
window.api = api;