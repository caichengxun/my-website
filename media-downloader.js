// 全局变量
let currentPlatform = null;

// API配置
const API_CONFIG = {
    baseUrl: 'https://api.wxshares.com/api/qsy/as',
    key: 'puM4bNPd7nBIFcRXBUgvfutGzE' // 你的API密钥
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    showApiKeyPrompt();
});

// 显示API密钥设置提示
function showApiKeyPrompt() {
    const savedKey = localStorage.getItem('api_key');
    if (savedKey) {
        API_CONFIG.key = savedKey;
    }
    // 密钥已在代码中配置
    console.log('✅ API密钥已配置，可以正常使用！');
}

function setupEventListeners() {
    const urlInput = document.getElementById('urlInput');
    const clearBtn = document.getElementById('clearBtn');
    const parseBtn = document.getElementById('parseBtn');
    const closeResult = document.getElementById('closeResult');
    const exampleLinks = document.querySelectorAll('.example-link');
    const settingsBtn = document.getElementById('settingsBtn');
    const settingsModal = document.getElementById('settingsModal');
    const closeModal = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const saveKeyBtn = document.getElementById('saveKeyBtn');
    const apiKeyInput = document.getElementById('apiKeyInput');

    // 输入框事件
    urlInput.addEventListener('input', (e) => {
        const value = e.target.value.trim();
        clearBtn.style.display = value ? 'flex' : 'none';
        
        // 自动检测平台
        detectPlatform(value);
    });

    urlInput.addEventListener('paste', (e) => {
        setTimeout(() => {
            const value = urlInput.value.trim();
            detectPlatform(value);
        }, 100);
    });

    // 清除按钮
    clearBtn.addEventListener('click', () => {
        urlInput.value = '';
        clearBtn.style.display = 'none';
        currentPlatform = null;
    });

    // 解析按钮
    parseBtn.addEventListener('click', handleParse);

    // 回车键解析
    urlInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleParse();
        }
    });

    // 关闭结果
    closeResult.addEventListener('click', () => {
        document.getElementById('resultSection').style.display = 'none';
    });

    // 示例链接
    exampleLinks.forEach(link => {
        link.addEventListener('click', () => {
            const platform = link.dataset.platform;
            if (platform === 'xhs') {
                urlInput.value = 'http://xhslink.com/a/example123';
            } else if (platform === 'douyin') {
                urlInput.value = 'https://v.douyin.com/example456/';
            }
            clearBtn.style.display = 'flex';
            detectPlatform(urlInput.value);
        });
    });

    // 设置按钮
    settingsBtn.addEventListener('click', () => {
        openSettingsModal();
    });

    // 关闭模态框
    closeModal.addEventListener('click', () => {
        closeSettingsModal();
    });

    cancelBtn.addEventListener('click', () => {
        closeSettingsModal();
    });

    // 点击背景关闭
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            closeSettingsModal();
        }
    });

    // 保存密钥
    saveKeyBtn.addEventListener('click', () => {
        const key = apiKeyInput.value.trim();
        if (key) {
            if (setApiKey(key)) {
                closeSettingsModal();
            }
        } else {
            showToast('请输入API密钥', 'warning');
        }
    });

    // 回车保存
    apiKeyInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            saveKeyBtn.click();
        }
    });
}

// 打开设置模态框
function openSettingsModal() {
    const modal = document.getElementById('settingsModal');
    const apiKeyInput = document.getElementById('apiKeyInput');
    const keyStatus = document.getElementById('keyStatus');
    
    // 显示当前密钥状态
    const currentKey = getApiKey();
    if (currentKey && currentKey !== '35kj5jnlj53453kl5j43nj5') {
        apiKeyInput.value = currentKey;
        keyStatus.innerHTML = '当前状态: <span class="status-value" style="color: #51cf66;">已设置</span>';
    } else {
        apiKeyInput.value = '';
        keyStatus.innerHTML = '当前状态: <span class="status-value" style="color: #ffd93d;">未设置</span>';
    }
    
    modal.style.display = 'flex';
    setTimeout(() => apiKeyInput.focus(), 100);
}

// 关闭设置模态框
function closeSettingsModal() {
    const modal = document.getElementById('settingsModal');
    modal.style.display = 'none';
}

// 检测平台
function detectPlatform(url) {
    if (!url) {
        currentPlatform = null;
        return;
    }

    if (url.includes('xiaohongshu.com') || url.includes('xhslink.com') || url.includes('xhs.cn')) {
        currentPlatform = 'xiaohongshu';
        showPlatformHint('小红书');
    } else if (url.includes('douyin.com') || url.includes('iesdouyin.com')) {
        currentPlatform = 'douyin';
        showPlatformHint('抖音');
    } else {
        currentPlatform = null;
    }
}

function showPlatformHint(platform) {
    // 可以添加平台提示效果
    console.log(`检测到${platform}链接`);
}

// 处理解析
async function handleParse() {
    const urlInput = document.getElementById('urlInput');
    const url = urlInput.value.trim();

    if (!url) {
        showToast('请输入链接', 'warning');
        return;
    }

    showLoading();

    try {
        // 调用真实API
        const result = await parseMediaUrl(url);
        
        if (result) {
            displayResult(result);
        } else {
            showToast('解析失败，请检查链接是否正确', 'error');
        }
        
        hideLoading();
    } catch (error) {
        console.error('解析失败:', error);
        showToast(error.message || '解析失败，请稍后重试', 'error');
        hideLoading();
    }
}

// 调用API解析链接
async function parseMediaUrl(url) {
    const loadingText = document.getElementById('loadingText');
    
    try {
        loadingText.textContent = '正在连接服务器...';
        
        // 构建请求参数
        const formData = new URLSearchParams();
        formData.append('key', API_CONFIG.key);
        formData.append('url', url);

        // 发送请求
        const response = await fetch(API_CONFIG.baseUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
            },
            body: formData.toString()
        });

        loadingText.textContent = '正在解析内容...';

        if (!response.ok) {
            throw new Error(`HTTP错误: ${response.status}`);
        }

        const data = await response.json();
        
        loadingText.textContent = '处理返回数据...';

        // 检查返回状态
        if (data.code !== 200) {
            throw new Error(data.msg || '解析失败');
        }

        // 转换API返回数据为统一格式
        return convertApiResult(data.data, url);

    } catch (error) {
        console.error('API调用失败:', error);
        throw error;
    }
}

// 转换API返回结果为统一格式
function convertApiResult(apiData, originalUrl) {
    if (!apiData) {
        return null;
    }

    // 判断是视频还是图片
    const hasVideo = apiData.url && apiData.url.trim() !== '';
    const hasImages = apiData.pics && Array.isArray(apiData.pics) && apiData.pics.length > 0;

    // 检测平台
    let platform = 'unknown';
    if (originalUrl.includes('xiaohongshu') || originalUrl.includes('xhslink') || originalUrl.includes('xhs.cn')) {
        platform = 'xiaohongshu';
    } else if (originalUrl.includes('douyin') || originalUrl.includes('iesdouyin')) {
        platform = 'douyin';
    }

    if (hasVideo) {
        // 视频内容
        return {
            type: 'video',
            platform: platform,
            title: apiData.title || '无标题',
            author: apiData.author || '未知作者',
            cover: apiData.photo || apiData.cover || '',
            videoUrl: apiData.url,
            duration: apiData.duration || '--:--',
            likes: apiData.like_count || apiData.digg_count || '0'
        };
    } else if (hasImages) {
        // 图片内容
        return {
            type: 'images',
            platform: platform,
            title: apiData.title || '无标题',
            author: apiData.author || '未知作者',
            images: apiData.pics,
            likes: apiData.like_count || apiData.digg_count || '0'
        };
    } else {
        throw new Error('未找到可下载的内容');
    }
}

// 模拟解析过程
async function simulateParsing() {
    const loadingText = document.getElementById('loadingText');
    const steps = [
        '正在获取内容信息...',
        '正在解析媒体资源...',
        '正在处理无水印版本...',
        '解析完成！'
    ];

    for (const step of steps) {
        loadingText.textContent = step;
        await new Promise(resolve => setTimeout(resolve, 600));
    }
}

// 生成小红书结果
function generateXHSResult() {
    const isVideo = Math.random() > 0.5;
    
    if (isVideo) {
        return {
            type: 'video',
            platform: 'xiaohongshu',
            title: '这是一个小红书视频标题示例 - 分享生活的美好瞬间',
            author: '示例用户',
            cover: 'https://via.placeholder.com/400x400/ff2442/ffffff?text=XHS+Video',
            videoUrl: '#',
            duration: '00:15',
            likes: '1.2w'
        };
    } else {
        return {
            type: 'images',
            platform: 'xiaohongshu',
            title: '这是一个小红书图文笔记示例 - 今日穿搭分享',
            author: '示例用户',
            images: [
                'https://via.placeholder.com/400x400/ff2442/ffffff?text=Image+1',
                'https://via.placeholder.com/400x400/ff6b9d/ffffff?text=Image+2',
                'https://via.placeholder.com/400x400/c44569/ffffff?text=Image+3',
                'https://via.placeholder.com/400x400/ff8fab/ffffff?text=Image+4'
            ],
            likes: '3.5w'
        };
    }
}

// 生成抖音结果
function generateDouyinResult() {
    return {
        type: 'video',
        platform: 'douyin',
        title: '这是一个抖音视频标题示例 - 记录美好生活',
        author: '示例用户',
        cover: 'https://via.placeholder.com/400x400/000000/ffffff?text=Douyin+Video',
        videoUrl: '#',
        duration: '00:30',
        likes: '10.5w'
    };
}

// 显示结果
function displayResult(result) {
    const resultSection = document.getElementById('resultSection');
    const resultContent = document.getElementById('resultContent');

    let html = '';

    if (result.type === 'video') {
        html = `
            <div class="media-item">
                <div class="media-preview">
                    <img src="${result.cover}" alt="视频封面">
                </div>
                <div class="media-info">
                    <div>
                        <div class="media-title">${result.title}</div>
                        <div class="media-meta">
                            <span>👤 ${result.author}</span>
                            <span>⏱️ ${result.duration}</span>
                            <span>❤️ ${result.likes}</span>
                        </div>
                    </div>
                    <button class="btn-download" onclick="downloadVideo('${result.videoUrl}')">
                        <svg width="16" height="16" viewBox="0 0 16 16">
                            <path d="M8 2 L8 12 M4 8 L8 12 L12 8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                            <rect x="2" y="13" width="12" height="1" rx="0.5" fill="currentColor"/>
                        </svg>
                        下载视频（无水印）
                    </button>
                </div>
            </div>
        `;
    } else if (result.type === 'images') {
        const imagesHtml = result.images.map((img, index) => `
            <div class="image-item" onclick="downloadImage('${img}', ${index})">
                <img src="${img}" alt="图片 ${index + 1}">
                <div class="image-overlay">
                    <button class="btn-download-img">下载图片 ${index + 1}</button>
                </div>
            </div>
        `).join('');

        html = `
            <div class="media-item" style="flex-direction: column;">
                <div style="width: 100%;">
                    <div class="media-title">${result.title}</div>
                    <div class="media-meta">
                        <span>👤 ${result.author}</span>
                        <span>🖼️ ${result.images.length} 张图片</span>
                        <span>❤️ ${result.likes}</span>
                    </div>
                </div>
                <div class="images-grid">
                    ${imagesHtml}
                </div>
                <button class="btn-download" onclick="downloadAllImages()">
                    <svg width="16" height="16" viewBox="0 0 16 16">
                        <path d="M8 2 L8 12 M4 8 L8 12 L12 8" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                        <rect x="2" y="13" width="12" height="1" rx="0.5" fill="currentColor"/>
                    </svg>
                    下载全部图片
                </button>
            </div>
        `;
    }

    resultContent.innerHTML = html;
    resultSection.style.display = 'block';

    // 滚动到结果区域
    setTimeout(() => {
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 100);
}

// 下载视频
function downloadVideo(url) {
    if (!url || url === '#') {
        showToast('视频链接无效', 'error');
        return;
    }

    try {
        // 创建下载链接
        const a = document.createElement('a');
        a.href = url;
        a.download = `video_${Date.now()}.mp4`;
        a.target = '_blank';
        
        // 触发下载
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        showToast('开始下载视频...', 'success');
    } catch (error) {
        console.error('下载失败:', error);
        // 如果直接下载失败，在新窗口打开
        window.open(url, '_blank');
        showToast('已在新窗口打开，请右键保存', 'info');
    }
}

// 下载图片
async function downloadImage(url, index) {
    if (!url) {
        showToast('图片链接无效', 'error');
        return;
    }

    try {
        showToast(`正在下载图片 ${index + 1}...`, 'info');
        
        // 使用fetch下载图片
        const response = await fetch(url);
        const blob = await response.blob();
        
        // 创建下载链接
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = `image_${Date.now()}_${index + 1}.jpg`;
        
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // 释放URL对象
        setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
        
        showToast(`图片 ${index + 1} 下载成功`, 'success');
    } catch (error) {
        console.error('下载失败:', error);
        // 如果fetch失败，尝试直接打开
        window.open(url, '_blank');
        showToast('已在新窗口打开，请右键保存', 'info');
    }
}

// 下载全部图片
async function downloadAllImages() {
    const images = document.querySelectorAll('.image-item img');
    
    if (images.length === 0) {
        showToast('没有可下载的图片', 'warning');
        return;
    }

    showToast(`开始下载 ${images.length} 张图片...`, 'info');

    for (let i = 0; i < images.length; i++) {
        const img = images[i];
        await downloadImage(img.src, i);
        // 延迟避免请求过快
        await new Promise(resolve => setTimeout(resolve, 500));
    }

    showToast('全部图片下载完成！', 'success');
}

// 显示加载
function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

// 隐藏加载
function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

// 提示消息
function showToast(message, type = 'info') {
    // 创建提示元素
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = message;
    
    // 添加样式
    Object.assign(toast.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '16px 24px',
        background: type === 'error' ? '#ff6b6b' : type === 'warning' ? '#ffd93d' : type === 'success' ? '#51cf66' : '#4ecdc4',
        color: type === 'warning' ? '#000' : '#fff',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        zIndex: '10000',
        animation: 'slideInRight 0.3s ease',
        fontWeight: '600',
        maxWidth: '400px'
    });

    document.body.appendChild(toast);

    // 3秒后移除
    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(toast);
        }, 300);
    }, 3000);
}

// 添加动画样式
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    @keyframes slideOutRight {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// 设置API密钥（供用户配置）
function setApiKey(key) {
    if (key && key.trim()) {
        API_CONFIG.key = key.trim();
        localStorage.setItem('api_key', key.trim());
        showToast('API密钥设置成功', 'success');
        return true;
    }
    return false;
}

// 获取当前API密钥
function getApiKey() {
    return API_CONFIG.key;
}

// 暴露给全局使用
window.setApiKey = setApiKey;
window.getApiKey = getApiKey;

console.log(`
✅ API已接入完成！密钥已配置！

使用说明：
1. 直接粘贴小红书或抖音分享链接
2. 点击"解析下载"按钮
3. 等待解析完成后下载内容

当前API密钥: ${API_CONFIG.key.substring(0, 8)}...（已配置）

如需更换密钥，点击右上角 ⚙️ 设置按钮
`);
