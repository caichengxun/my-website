// 全局变量
let selectedPlatform = null;

// AI API 配置
const AI_CONFIG = {
    apiUrl: 'http://43.139.203.146:8050/v1/chat/completions',
    apiKey: 'sk-xjlzds0424',
    model: 'deepseek-chat'
};

// 平台配置
const PLATFORM_CONFIG = {
    xiaohongshu: {
        name: '小红书',
        titleMaxLength: 20,
        contentMaxLength: 1000,
        style: 'casual',
        features: ['emoji', 'hashtag', 'lifestyle']
    },
    douyin: {
        name: '抖音',
        titleMaxLength: 30,
        contentMaxLength: 2000,
        style: 'engaging',
        features: ['hashtag', 'interactive', 'trending']
    }
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    checkAPIStatus();
});

// 检测API状态
async function checkAPIStatus() {
    try {
        const response = await fetch(AI_CONFIG.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AI_CONFIG.apiKey}`
            },
            body: JSON.stringify({
                model: AI_CONFIG.model,
                messages: [
                    {
                        role: 'user',
                        content: '测试连接'
                    }
                ],
                max_tokens: 10
            })
        });

        if (response.ok) {
            console.log('✅ AI服务连接成功');
        } else {
            console.warn('⚠️ AI服务连接异常，状态码:', response.status);
        }
    } catch (error) {
        console.warn('⚠️ AI服务连接失败:', error.message);
    }
}

function setupEventListeners() {
    const platformCards = document.querySelectorAll('.platform-card');
    const originalTitle = document.getElementById('originalTitle');
    const originalContent = document.getElementById('originalContent');
    const clearOriginal = document.getElementById('clearOriginal');
    const rewriteBtn = document.getElementById('rewriteBtn');
    const regenerateBtn = document.getElementById('regenerateBtn');
    const copyResult = document.getElementById('copyResult');

    // 平台选择
    platformCards.forEach(card => {
        card.addEventListener('click', () => {
            const platform = card.dataset.platform;
            selectPlatform(platform);
        });
    });

    // 字数统计
    originalTitle.addEventListener('input', () => {
        updateCharCount('titleCount', originalTitle.value.length, 100);
    });

    originalContent.addEventListener('input', () => {
        updateCharCount('contentCount', originalContent.value.length);
    });

    // 清空原文
    clearOriginal.addEventListener('click', () => {
        originalTitle.value = '';
        originalContent.value = '';
        updateCharCount('titleCount', 0, 100);
        updateCharCount('contentCount', 0);
    });

    // AI改写
    rewriteBtn.addEventListener('click', handleRewrite);
    regenerateBtn.addEventListener('click', handleRewrite);

    // 复制结果
    copyResult.addEventListener('click', copyAllResults);
}

// 选择平台
function selectPlatform(platform) {
    selectedPlatform = platform;
    
    // 更新UI
    document.querySelectorAll('.platform-card').forEach(card => {
        card.classList.remove('selected');
    });
    document.querySelector(`[data-platform="${platform}"]`).classList.add('selected');

    // 显示编辑区域
    document.getElementById('editorSection').style.display = 'block';
    
    // 更新平台标识
    const config = PLATFORM_CONFIG[platform];
    document.getElementById('currentPlatform').textContent = config.name;

    // 更新输入框限制
    const titleInput = document.getElementById('originalTitle');
    titleInput.maxLength = config.titleMaxLength;
    updateCharCount('titleCount', titleInput.value.length, config.titleMaxLength);

    // 滚动到编辑区域
    setTimeout(() => {
        document.getElementById('editorSection').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }, 100);

    showToast(`已选择${config.name}平台`, 'success');
}

// 更新字数统计
function updateCharCount(elementId, count, max) {
    const element = document.getElementById(elementId);
    if (max) {
        element.textContent = `${count}/${max}`;
        if (count > max * 0.9) {
            element.style.color = '#ffd93d';
        } else {
            element.style.color = 'var(--text-secondary)';
        }
    } else {
        element.textContent = `${count} 字`;
    }
}

// 处理AI改写
async function handleRewrite() {
    if (!selectedPlatform) {
        showToast('请先选择目标平台', 'warning');
        return;
    }

    const title = document.getElementById('originalTitle').value.trim();
    const content = document.getElementById('originalContent').value.trim();

    if (!title && !content) {
        showToast('请输入标题或正文', 'warning');
        return;
    }

    // 检查字数是否过长
    const config = PLATFORM_CONFIG[selectedPlatform];
    if (title.length > 200) {
        showToast('原始标题过长，建议精简后再改写', 'warning');
        return;
    }
    if (content.length > 5000) {
        showToast('原始正文过长，建议分段改写', 'warning');
        return;
    }

    showLoading();

    try {
        // 获取改写设置
        const settings = {
            style: document.getElementById('styleSelect').value,
            creativity: document.getElementById('creativitySelect').value,
            addEmoji: document.getElementById('addEmoji').checked,
            addHashtag: document.getElementById('addHashtag').checked
        };

        // 调用AI改写
        const result = await performRewrite(title, content, selectedPlatform, settings);

        // 显示结果
        displayResult(result);
        hideLoading();
        showToast('改写完成！', 'success');

    } catch (error) {
        console.error('改写失败:', error);
        showToast(error.message || '改写失败，请重试', 'error');
        hideLoading();
    }
}

// 执行AI改写（真实API）
async function performRewrite(title, content, platform, settings) {
    const loadingText = document.getElementById('loadingText');
    const config = PLATFORM_CONFIG[platform];

    try {
        loadingText.textContent = '正在连接AI服务...';

        // 构建改写提示词
        const prompt = buildRewritePrompt(title, content, platform, settings);

        loadingText.textContent = 'AI正在分析原文...';

        // 调用AI API
        const response = await fetch(AI_CONFIG.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${AI_CONFIG.apiKey}`
            },
            body: JSON.stringify({
                model: AI_CONFIG.model,
                messages: [
                    {
                        role: 'system',
                        content: '你是一个专业的文案改写助手，擅长根据不同平台特点改写内容。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: settings.creativity === 'high' ? 0.9 : settings.creativity === 'low' ? 0.3 : 0.6,
                max_tokens: 2000
            })
        });

        loadingText.textContent = 'AI正在生成新文案...';

        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status}`);
        }

        const result = await response.json();
        
        loadingText.textContent = '正在优化结果...';

        // 提取AI返回的内容
        const aiResponse = result.choices[0].message.content;

        // 解析AI返回的结果
        const parsedResult = parseAIResponse(aiResponse, config);

        return parsedResult;

    } catch (error) {
        console.error('AI改写失败:', error);
        throw new Error('AI服务暂时不可用，请稍后重试');
    }
}

// 构建改写提示词
function buildRewritePrompt(title, content, platform, settings) {
    const config = PLATFORM_CONFIG[platform];
    const platformName = config.name;
    
    // 风格描述
    const styleDescriptions = {
        natural: '自然流畅，保持原意',
        professional: '专业正式，逻辑清晰',
        casual: '轻松活泼，亲切友好',
        emotional: '情感丰富，引发共鸣'
    };
    
    const styleDesc = styleDescriptions[settings.style] || '自然流畅';
    
    // 平台特点描述
    const platformFeatures = {
        xiaohongshu: `
- 生活化、种草风格
- 适合使用表情符号增加亲和力
- 话题标签如：#好物分享 #生活记录 #种草 #日常vlog
- 语气轻松、真诚，像朋友分享
- 可以使用"姐妹们"、"宝子们"等亲切称呼`,
        douyin: `
- 吸引眼球、互动性强
- 适合使用热门表情符号
- 话题标签如：#涨知识 #实用技巧 #干货分享 #必看
- 开头要有吸引力，引发好奇
- 可以使用疑问句、感叹句增强互动`
    };

    let prompt = `请帮我将以下文案改写为适合${platformName}平台的风格。

【改写要求】
1. 平台：${platformName}
2. 风格：${styleDesc}
3. 标题字数限制：严格控制在${config.titleMaxLength}字以内
4. 正文字数限制：严格控制在${config.contentMaxLength}字以内
${settings.addEmoji ? '5. 适当添加表情符号，让内容更生动' : '5. 不要添加表情符号'}
${settings.addHashtag ? '6. 在正文末尾添加2-3个相关话题标签' : '6. 不要添加话题标签'}

【平台特点】
${platformFeatures[platform]}

【原始内容】`;

    if (title) {
        prompt += `\n标题：${title}`;
    }
    
    if (content) {
        prompt += `\n正文：${content}`;
    }

    prompt += `

【输出格式】
请严格按照以下格式输出，不要有任何额外说明：

标题：[改写后的标题，${config.titleMaxLength}字以内]

正文：
[改写后的正文内容，${config.contentMaxLength}字以内]`;

    return prompt;
}

// 解析AI返回的结果
function parseAIResponse(aiResponse, config) {
    try {
        // 提取标题
        let title = '';
        const titleMatch = aiResponse.match(/标题[：:]\s*(.+?)(?:\n|$)/);
        if (titleMatch) {
            title = titleMatch[1].trim();
            // 确保标题不超过限制
            if (title.length > config.titleMaxLength) {
                title = title.substring(0, config.titleMaxLength);
            }
        }

        // 提取正文
        let content = '';
        const contentMatch = aiResponse.match(/正文[：:]\s*\n([\s\S]+)/);
        if (contentMatch) {
            content = contentMatch[1].trim();
            // 确保正文不超过限制
            if (content.length > config.contentMaxLength) {
                content = content.substring(0, config.contentMaxLength - 20) + '\n\n（内容已优化至平台限制字数）';
            }
        } else {
            // 如果没有明确的正文标记，尝试提取标题后的所有内容
            const parts = aiResponse.split(/正文[：:]/);
            if (parts.length > 1) {
                content = parts[1].trim();
            } else {
                // 如果格式不标准，将整个响应作为内容
                content = aiResponse.replace(/标题[：:].+?\n/, '').trim();
            }
            
            if (content.length > config.contentMaxLength) {
                content = content.substring(0, config.contentMaxLength - 20) + '\n\n（内容已优化至平台限制字数）';
            }
        }

        return {
            title: title || '（AI未生成标题）',
            content: content || '（AI未生成内容）'
        };

    } catch (error) {
        console.error('解析AI响应失败:', error);
        return {
            title: '解析失败',
            content: aiResponse
        };
    }
}

// 显示改写结果
function displayResult(result) {
    const resultArea = document.getElementById('resultArea');
    const resultContent = document.getElementById('resultContent');
    const rewrittenTitle = document.getElementById('rewrittenTitle');
    const rewrittenContent = document.getElementById('rewrittenContent');
    const newTitleCount = document.getElementById('newTitleCount');
    const newContentCount = document.getElementById('newContentCount');

    // 隐藏空状态，显示结果
    resultArea.style.display = 'none';
    resultContent.style.display = 'flex';

    // 填充内容
    rewrittenTitle.textContent = result.title;
    rewrittenContent.textContent = result.content;

    // 更新字数统计
    const config = PLATFORM_CONFIG[selectedPlatform];
    const titleLength = result.title.length;
    const contentLength = result.content.length;
    
    newTitleCount.textContent = `${titleLength}/${config.titleMaxLength}`;
    newContentCount.textContent = `${contentLength} 字`;

    // 检查是否超出限制
    if (titleLength > config.titleMaxLength) {
        newTitleCount.style.color = '#ff6b6b';
        showToast('标题超出字数限制，请手动调整', 'warning');
    } else if (titleLength > config.titleMaxLength * 0.9) {
        newTitleCount.style.color = '#ffd93d';
    } else {
        newTitleCount.style.color = 'var(--text-secondary)';
    }
    
    if (contentLength > config.contentMaxLength) {
        newContentCount.style.color = '#ff6b6b';
        showToast('正文超出字数限制，请手动调整', 'warning');
    } else if (contentLength > config.contentMaxLength * 0.9) {
        newContentCount.style.color = '#ffd93d';
    } else {
        newContentCount.style.color = 'var(--text-secondary)';
    }
}

// 复制全部结果
function copyAllResults() {
    const title = document.getElementById('rewrittenTitle').textContent;
    const content = document.getElementById('rewrittenContent').textContent;
    
    if (!title && !content) {
        showToast('没有可复制的内容', 'warning');
        return;
    }

    const fullText = `${title}\n\n${content}`;
    
    navigator.clipboard.writeText(fullText).then(() => {
        showToast('已复制到剪贴板', 'success');
    }).catch(err => {
        console.error('复制失败:', err);
        showToast('复制失败，请手动复制', 'error');
    });
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
    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;
    toast.textContent = message;
    
    Object.assign(toast.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '16px 24px',
        background: type === 'error' ? '#ff6b6b' : type === 'warning' ? '#ffd93d' : type === 'success' ? '#51cf66' : '#667eea',
        color: type === 'warning' ? '#000' : '#fff',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        zIndex: '10000',
        animation: 'slideInRight 0.3s ease',
        fontWeight: '600',
        maxWidth: '400px'
    });

    document.body.appendChild(toast);

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

console.log(`
✨ AI文案改写工具已加载！

功能说明：
1. 选择目标平台（小红书/抖音）
2. 输入原始标题和正文
3. 调整改写设置
4. 点击"AI智能改写"生成新文案
5. 支持重新生成和一键复制

平台限制：
- 小红书：标题20字，正文1000字
- 抖音：标题30字，正文2000字

✅ 已接入真实AI服务！
- API: DeepSeek Chat
- 模型: ${AI_CONFIG.model}
- 状态: 就绪

现在可以使用真正的AI智能改写功能了！
`);
