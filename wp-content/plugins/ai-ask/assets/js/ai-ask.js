/* global aiAskConfig, marked */
(function () {
    'use strict';

    const { ajaxUrl, nonce } = aiAskConfig;

    let currentSessionId = null;
    let isStreaming = false;
    let platformGuideMap = {};
    let guideStreamTimer = null;

    const $ = id => document.getElementById(id);
    const el = (tag, cls) => {
        const e = document.createElement(tag);
        if (cls) e.className = cls;
        return e;
    };

    // 配置 marked
    if (typeof marked !== 'undefined') {
        marked.setOptions({ breaks: true, gfm: true });
    }

    function renderMarkdown(text) {
        if (!text) return '';
        if (typeof marked === 'undefined') {
            return text
                .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
                .replace(/\n/g, '<br>');
        }
        try { return marked.parse(text); } catch (_) { return text; }
    }

    async function ajax(action, data = {}) {
        const fd = new FormData();
        fd.append('action', action);
        fd.append('nonce', nonce);
        Object.entries(data).forEach(([k, v]) => fd.append(k, v));
        const r = await fetch(ajaxUrl, { method: 'POST', body: fd });
        return r.json();
    }

    // ---- 加载数据 ----

    async function loadModels() {
        const res = await ajax('ask_get_models');
        const sel = $('askModelSelect');
        sel.innerHTML = '';
        if (!res.success || !res.data.length) {
            sel.innerHTML = '<option value="">暂无可用模型</option>';
            return;
        }
        res.data.forEach(m => {
            const o = document.createElement('option');
            o.value = m.identifier;
            o.textContent = m.model_name + (m.credit > 0 ? ` (${m.credit}积分)` : '');
            sel.appendChild(o);
        });
    }

    async function loadRoles() {
        const res = await ajax('ask_get_platforms');
        const sel = $('askRoleSelect');
        sel.innerHTML = '<option value="">无角色</option>';
        platformGuideMap = {};
        if (res.success) {
            res.data.forEach(p => {
                const o = document.createElement('option');
                o.value = p.platform_code;
                o.textContent = p.platform_name;
                sel.appendChild(o);
                if (p.guide_words) platformGuideMap[p.platform_code] = p.guide_words;
            });
        }
    }

    async function loadSessions() {
        const res = await ajax('ask_get_sessions');
        const list = $('askSessionList');
        list.innerHTML = '';
        if (!res.success || !res.data.length) return;
        renderSessionGroups(res.data);
    }

    // 将 sessions 按时间段分组后渲染
    function renderSessionGroups(sessions) {
        const list = $('askSessionList');
        list.innerHTML = '';

        const now   = new Date();
        const sod   = d => new Date(d.getFullYear(), d.getMonth(), d.getDate()); // start of day
        const today = sod(now);
        const yesterday = new Date(today - 864e5);
        const week7     = new Date(today - 6 * 864e5);
        const month30   = new Date(today - 29 * 864e5);

        const groups = new Map(); // ordered Map: label -> sessions[]

        sessions.forEach(s => {
            const t = new Date(s.update_time.replace(' ', 'T'));
            let label;
            if (t >= today)      label = '今天';
            else if (t >= yesterday) label = '昨天';
            else if (t >= week7)     label = '7 天内';
            else if (t >= month30)   label = '30 天内';
            else                     label = s.update_time.substring(0, 7); // "2026-03"
            if (!groups.has(label)) groups.set(label, []);
            groups.get(label).push(s);
        });

        groups.forEach((items, label) => {
            const header = document.createElement('div');
            header.className = 'ask-session-group-label';
            header.textContent = label;
            list.appendChild(header);
            items.forEach(s => addSessionItem(list, s));
        });
    }

    // ---- 引导词：作为对话气泡输出，模拟流式打字效果 ----

    function showGuideMessage(code) {
        if (guideStreamTimer) clearTimeout(guideStreamTimer);
        document.querySelectorAll('.ask-msg-guide').forEach(e => e.remove());
        const text = code && platformGuideMap[code] ? platformGuideMap[code] : '';
        if (!text) return;

        const welcome = $('askMessages').querySelector('.ask-welcome');
        if (welcome) welcome.remove();
        const wrap = el('div', 'ask-msg assistant ask-msg-guide');
        const avatar = el('div', 'ask-avatar');
        avatar.textContent = 'AI';
        const bubble = el('div', 'ask-bubble ask-bubble-guide streaming');
        wrap.appendChild(avatar);
        wrap.appendChild(bubble);
        $('askMessages').appendChild(wrap);
        scrollToBottom();

        // 模拟流式输出
        let i = 0;
        const len = text.length;
        function type() {
            if (i < len) {
                // 加速：剩余字符越多，一次性吐出越多
                i += Math.max(1, Math.ceil((len - i) / 12));
                bubble.innerHTML = renderMarkdown(text.substring(0, i));
                scrollToBottom();
                guideStreamTimer = setTimeout(type, 20 + Math.random() * 20);
            } else {
                bubble.classList.remove('streaming');
                guideStreamTimer = null;
            }
        }
        type();

        // 有会话时立即写入历史，无会话时由 ask_new_session 在创建时携带写入
        if (currentSessionId > 0) {
            ajax('ask_record_guide', { session_id: currentSessionId, content: text, platform_code: code });
        }
    }

    // ---- 消息渲染 ----

    function appendMessage(role, content) {
        const welcome = $('askMessages').querySelector('.ask-welcome');
        if (welcome) welcome.remove();

        const wrap = el('div', 'ask-msg ' + role);
        const avatar = el('div', 'ask-avatar');
        avatar.textContent = role === 'user' ? '我' : 'AI';
        const bubble = el('div', 'ask-bubble');

        if (role === 'user') {
            bubble.textContent = content;           // 用户输入不解析 markdown，防 XSS
        } else {
            bubble.innerHTML = renderMarkdown(content);
        }

        wrap.appendChild(avatar);
        wrap.appendChild(bubble);
        $('askMessages').appendChild(wrap);
        scrollToBottom();
        return bubble;
    }

    function clearMessages() {
        $('askMessages').innerHTML =
            '<div class="ask-welcome"><h2>AI 对话助手</h2><p>选择模型和角色，开始对话吧。</p></div>';
    }

    function scrollToBottom() {
        const msgs = $('askMessages');
        msgs.scrollTop = msgs.scrollHeight;
    }

    // ---- 会话列表 ----

    // 新会话建立后：插入到"今天"分组顶部，如果没有则创建
    function addSessionToList(session) {
        const list = $('askSessionList');
        // 已存在则只更新标题
        const existing = list.querySelector(`[data-id="${session.id}"]`);
        if (existing) {
            existing.querySelector('.ask-session-title').textContent = session.title || '新对话';
            return;
        }
        // 找"今天"分组，没有就在最前面插
        let todayGroup = null;
        list.querySelectorAll('.ask-session-group-label').forEach(h => {
            if (h.textContent === '今天') todayGroup = h;
        });
        if (!todayGroup) {
            todayGroup = document.createElement('div');
            todayGroup.className = 'ask-session-group-label';
            todayGroup.textContent = '今天';
            list.insertBefore(todayGroup, list.firstChild);
        }
        const item = buildSessionItem(session);
        todayGroup.insertAdjacentElement('afterend', item);
    }

    // 构建单条会话 DOM（供分组渲染和单条插入复用）
    function buildSessionItem(session) {
        const item = document.createElement('div');
        item.className = 'ask-session-item';
        item.dataset.id = session.id;
        if (session.id == currentSessionId) item.classList.add('active');

        const title = document.createElement('span');
        title.className = 'ask-session-title';
        title.textContent = session.title || '新对话';

        const del = document.createElement('span');
        del.className = 'ask-session-del';
        del.textContent = '×';
        del.title = '删除';
        del.onclick = async e => {
            e.stopPropagation();
            if (!confirm('确认删除此对话？')) return;
            await ajax('ask_delete_session', { session_id: session.id });
            item.remove();
            if (session.id == currentSessionId) { currentSessionId = null; clearMessages(); }
        };
        item.appendChild(title);
        item.appendChild(del);
        item.onclick = () => openSession(session.id);
        return item;
    }

    // 分组渲染时直接 append（顺序已由后端排好）
    function addSessionItem(list, session) {
        list.appendChild(buildSessionItem(session));
    }

    function setActiveSession(id) {
        currentSessionId = id;
        document.querySelectorAll('.ask-session-item').forEach(e => {
            e.classList.toggle('active', e.dataset.id == id);
        });
    }

    async function openSession(id) {
        setActiveSession(id);
        clearMessages();
        closeSidebar();
        const res = await ajax('ask_get_messages', { session_id: id });
        if (res.success) {
            res.data.forEach(m => appendMessage(m.role, m.content));
            scrollToBottom();
        }
    }

    // ---- 发送消息 ----

    async function sendMessage() {
        if (isStreaming) return;
        const input = $('askInput');
        const text = input.value.trim();
        if (!text) return;

        closeSidebar();

        const modelId = $('askModelSelect').value;
        if (!modelId) { alert('请选择模型'); return; }

        if (!(currentSessionId > 0)) {
            const platformCode = $('askRoleSelect').value;
            const res = await ajax('ask_new_session', {
                model_identifier: modelId,
                platform_code: platformCode,
                guide_words: platformGuideMap[platformCode] || '',
            });
            if (!res.success) { alert(res.data || '创建会话失败'); return; }
            if (!(res.data.session_id > 0)) { alert('创建会话失败：session_id 无效'); return; }
            currentSessionId = res.data.session_id;
            addSessionToList({ id: currentSessionId, title: '' });
            setActiveSession(currentSessionId);
        }

        input.value = '';
        input.style.height = 'auto';
        // 移除引导气泡，避免混入真实对话
        document.querySelectorAll('.ask-msg-guide').forEach(e => e.remove());
        appendMessage('user', text);

        isStreaming = true;
        $('askSendBtn').disabled = true;

        const assistantBubble = appendMessage('assistant', '');
        assistantBubble.classList.add('streaming');
        let rawContent = '';  // 累积原始文本，用于 markdown 重渲染

        const fd = new FormData();
        fd.append('action', 'ask_stream');
        fd.append('nonce', nonce);
        fd.append('session_id', currentSessionId);
        fd.append('message', text);
        fd.append('model_identifier', modelId);
        fd.append('platform_code', $('askRoleSelect').value);

        try {
            const resp = await fetch(ajaxUrl, { method: 'POST', body: fd });
            if (!resp.ok) throw new Error('HTTP ' + resp.status);

            const ct = resp.headers.get('Content-Type') || '';
            if (ct.includes('application/json')) {
                const json = await resp.json();
                // 会员系统 gate 拦截 → 弹窗让用户选择订阅/充值/邀请
                if ((json.code === 'gate_blocked' || json.success === false) && json.data && window.MembershipGateFrontend) {
                    MembershipGateFrontend.handleBlock(json.data);
                    assistantBubble.innerHTML = '<span style="color:#f39c12">' +
                        (json.data.message || '使用次数不足，请选择以下方式继续') +
                        '</span>';
                } else {
                    assistantBubble.textContent = '错误: ' + (json.data || JSON.stringify(json));
                }
                return;
            }

            const reader = resp.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buf = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buf += decoder.decode(value, { stream: true });

                const lines = buf.split('\n');
                buf = lines.pop();

                for (const line of lines) {
                    const trimmed = line.trim();
                    if (!trimmed || trimmed === 'data: [DONE]') continue;
                    if (!trimmed.startsWith('data: ')) continue;
                    try {
                        const json = JSON.parse(trimmed.slice(6));
                        if (json.error) {
                            assistantBubble.innerHTML = '<span style="color:#ef4444">错误: ' +
                                json.error.replace(/</g, '&lt;') + '</span>';
                        } else if (json.content) {
                            rawContent += json.content;
                            // 流式重渲染 markdown
                            assistantBubble.innerHTML = renderMarkdown(rawContent);
                            scrollToBottom();
                        }
                    } catch (_) {}
                }
            }
        } catch (err) {
            assistantBubble.textContent = '请求出错: ' + err.message;
        } finally {
            assistantBubble.classList.remove('streaming');
            // 流结束后做一次完整渲染（修正流式过程中可能不完整的 markdown 节点）
            if (rawContent) assistantBubble.innerHTML = renderMarkdown(rawContent);
            isStreaming = false;
            $('askSendBtn').disabled = false;

            // 更新会话标题
            const titleEl = document.querySelector(`.ask-session-item[data-id="${currentSessionId}"] .ask-session-title`);
            if (titleEl && titleEl.textContent === '新对话') {
                const res = await ajax('ask_get_sessions');
                if (res.success) {
                    const s = res.data.find(x => x.id == currentSessionId);
                    if (s && s.title) titleEl.textContent = s.title;
                }
            }
        }
    }

    // ---- 布局高度：JS 动态适配管理栏高度 ----
    // 桌面端用高度链填满 WP 内容区；移动端用 position:fixed 绕开 WP 布局层级

    function fixChatHeight() {
        const app = $('ai-ask-app');
        if (!app) return;
        // 前台 shortcode 不需要 JS 干预
        if (app.classList.contains('ask-shortcode')) return;

        const bar = document.getElementById('wpadminbar');
        const barH = bar ? bar.offsetHeight : 32;
        const isMobile = window.innerWidth <= 600;

        if (isMobile) {
            // 移动端：CSS 已设 position:fixed，JS 只微调 top（管理栏高度可变）
            app.style.top = barH + 'px';
            app.style.height = '';   // 清空，让 CSS bottom:0 接管
            return;
        }

        // 桌面端：逐层填满高度
        var d = document.documentElement, b = document.body;
        d.style.height = '100%';
        b.style.height = '100%';
        var wrap = document.getElementById('wpwrap');
        if (wrap) { wrap.style.height = '100%'; wrap.style.minHeight = '0'; wrap.style.overflow = 'hidden'; }

        var content = document.getElementById('wpcontent');
        if (content) {
            content.style.height = 'calc(100% - ' + barH + 'px)';
            content.style.padding = '0';
            content.style.overflow = 'hidden';
        }

        var bodyE = document.getElementById('wpbody');
        var bodyC = document.getElementById('wpbody-content');
        if (bodyE) { bodyE.style.height = '100%'; bodyE.style.padding = '0'; bodyE.style.overflow = 'hidden'; }
        if (bodyC) { bodyC.style.height = '100%'; bodyC.style.padding = '0'; bodyC.style.overflow = 'hidden'; }
        app.style.height = '100%';
    }

    // ---- 侧边栏（移动端 overlay 模式） ----

    function createBackdrop() {
        let bd = document.querySelector('.ask-sidebar-backdrop');
        if (!bd) {
            bd = document.createElement('div');
            bd.className = 'ask-sidebar-backdrop';
            $('ai-ask-app').appendChild(bd);
            bd.addEventListener('click', closeSidebar);
        }
        return bd;
    }

    function openSidebar() {
        document.querySelector('.ask-sidebar').classList.add('open');
        createBackdrop().style.display = 'block';
    }

    function closeSidebar() {
        document.querySelector('.ask-sidebar').classList.remove('open');
        const bd = document.querySelector('.ask-sidebar-backdrop');
        if (bd) bd.style.display = 'none';
    }

    // ---- 事件绑定 ----

    document.addEventListener('DOMContentLoaded', () => {
        fixChatHeight();
        loadModels();
        loadRoles();
        loadSessions();

        $('askNewChat').onclick = () => {
            currentSessionId = null;
            clearMessages();
            closeSidebar();
            document.querySelectorAll('.ask-session-item').forEach(e => e.classList.remove('active'));
        };

        $('askSendBtn').onclick = sendMessage;

        $('askRoleSelect').addEventListener('change', function () {
            showGuideMessage(this.value);
        });

        $('askInput').addEventListener('keydown', e => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                sendMessage();
            }
        });

        $('askInput').addEventListener('input', function () {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 200) + 'px';
        });

        $('askSidebarToggle').onclick = () => {
            const sb = document.querySelector('.ask-sidebar');
            if (window.innerWidth <= 600) {
                sb.classList.contains('open') ? closeSidebar() : openSidebar();
            } else {
                sb.classList.toggle('collapsed');
            }
        };

        // ESC 关闭侧边栏
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') closeSidebar();
        });

        // 窗口大小变化时重算高度（旋转屏幕 / 缩放）
        window.addEventListener('resize', fixChatHeight);
    });
})();
