/**
 * Hot Articles Viewer - Admin JavaScript
 */
(function($) {
    'use strict';

    $(document).ready(function() {

        $(document).on('click', '.toggle-status', function(e) {
            e.preventDefault();
            var $link = $(this);
            $.ajax({
                url: hotArticlesAdmin.ajaxUrl, type: 'POST',
                data: { action: 'hot_articles_toggle_category_status', id: $link.data('id'), status: $link.data('status'), nonce: hotArticlesAdmin.nonce },
                success: function(r) { if (r.success) location.reload(); }
            });
        });

        $(document).on('click', '.hot-action', function(e) {
            e.preventDefault();
            var $btn = $(this);
            if ($btn.hasClass('processing')) return;
            $btn.addClass('processing').text('处理中...');
            var id = $btn.data('id');
            $.ajax({
                url: hotArticlesAdmin.ajaxUrl, type: 'POST',
                data: { action: 'hot_articles_toggle_hot', id: id, nonce: hotArticlesAdmin.nonce },
                success: function(r) {
                    $btn.removeClass('processing');
                    if (r.success) { $btn.text(r.data.hot ? '取消热点' : '设为热点'); showNotice('已更新', 'success'); }
                }
            });
        });

        $(document).on('click', '.recommend-action', function(e) {
            e.preventDefault();
            var $btn = $(this);
            if ($btn.hasClass('processing')) return;
            $btn.addClass('processing').text('处理中...');
            var id = $btn.data('id');
            $.ajax({
                url: hotArticlesAdmin.ajaxUrl, type: 'POST',
                data: { action: 'hot_articles_toggle_recommend', id: id, nonce: hotArticlesAdmin.nonce },
                success: function(r) {
                    $btn.removeClass('processing');
                    if (r.success) { $btn.text(r.data.recommend ? '取消推荐' : '设为推荐'); showNotice('已更新', 'success'); }
                }
            });
        });

        // Category cascade
        $(document).on('change', '.parent-category-select, .parent-category-filter', function() {
            var $sub = $(this).hasClass('parent-category-select') ? $('.sub-category-select') : $('.sub-category-filter');
            $sub.html('<option value="">加载中...</option>');
            if ($(this).val()) {
                $.ajax({
                    url: hotArticlesAdmin.ajaxUrl, type: 'POST',
                    data: { action: 'hot_articles_get_sub_categories', parent_id: $(this).val(), nonce: hotArticlesAdmin.nonce },
                    success: function(r) {
                        $sub.html('<option value="">请选择</option>');
                        if (r.success) $.each(r.data, function(i, c) { $sub.append($('<option>').val(c.id).text(c.name)); });
                    }
                });
            } else { $sub.html('<option value="">请选择</option>'); }
        });

        // ========================================
        // AI Generation Panel
        // ========================================
        var $panel = $('#ai-panel');
        var $overlay = $('#ai-panel-overlay');
        var isStreaming = false;
        var generatedItems = [];
        var retryCount = 0;

        function openPanel() {
            $overlay.fadeIn(200);
            $panel.addClass('open');
            $('#ai-prompt').focus();
            retryCount = 0;
        }

        function closePanel() {
            if (isStreaming) return;
            $overlay.fadeOut(200);
            $panel.removeClass('open');
            resetPanel();
        }

        function resetPanel() {
            $('#ai-stream-output').hide();
            $('#ai-stream-content').empty();
            $('#ai-result-cards').hide();
            $('#ai-cards-container').empty();
            generatedItems = [];
            retryCount = 0;
            $('#ai-gen-start').prop('disabled', false).text('开始生成');
        }

        $('#ai-gen-trigger').on('click', function(e) {
            e.preventDefault();
            openPanel();
        });
        $('#ai-panel-close').on('click', closePanel);
        $overlay.on('click', closePanel);
        $(document).on('keydown', function(e) {
            if (e.key === 'Escape' && $panel.hasClass('open')) closePanel();
        });

        function doStream(prompt, searchKw) {
            isStreaming = true;
            var $btn = $('#ai-gen-start').prop('disabled', true).text(retryCount ? '重试中...' : '生成中...');
            $('#ai-stream-output').show();
            if (!retryCount) {
                $('#ai-result-cards').hide();
                $('#ai-cards-container').empty();
                generatedItems = [];
                $('#ai-stream-content').html('<div class="ai-stream-text"></div>');
            } else {
                $('#ai-stream-content').html('<div class="ai-stream-text"></div>');
            }
            var $streamText = $('#ai-stream-content .ai-stream-text');
            var rawContent = '';

            var bodyData = new URLSearchParams({
                action: 'hot_articles_ai_stream',
                prompt: prompt,
                search_keyword: searchKw || '',
                nonce: hotArticlesAdmin.nonce
            });
            if (retryCount > 0) {
                bodyData.append('retry', '1');
            }

            fetch(hotArticlesAdmin.ajaxUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: bodyData
            }).then(function(resp) {
                if (!resp.ok) throw new Error('HTTP ' + resp.status);
                var ct = resp.headers.get('Content-Type') || '';
                if (ct.includes('application/json')) {
                    return resp.json().then(function(json) { throw new Error(json.data || '请求失败'); });
                }
                var reader = resp.body.getReader();
                var decoder = new TextDecoder('utf-8');
                var buf = '';

                function process() {
                    return reader.read().then(function(result) {
                        if (result.done) {
                            parseAndShowCards(rawContent);
                            isStreaming = false;
                            $btn.prop('disabled', false).text('开始生成');
                            return;
                        }
                        buf += decoder.decode(result.value, { stream: true });
                        var lines = buf.split('\n');
                        buf = lines.pop();
                        lines.forEach(function(line) {
                            line = line.trim();
                            if (!line || line === 'data: [DONE]') return;
                            if (!line.startsWith('data: ')) return;
                            try {
                                var json = JSON.parse(line.substring(6));
                                if (json.error) {
                                    $streamText.append('<span class="ai-stream-error">' + json.error + '</span>');
                                } else if (json.full) {
                                    rawContent = json.full;
                                    $streamText.text(json.full);
                                } else if (json.content) {
                                    rawContent += json.content;
                                    $streamText.text(rawContent);
                                }
                            } catch(e) {}
                        });
                        $streamText.parent().scrollTop($streamText.parent()[0].scrollHeight);
                        return process();
                    });
                }
                return process();
            }).catch(function(err) {
                isStreaming = false;
                $btn.prop('disabled', false).text('开始生成');
                showNotice('AI 生成失败: ' + err.message, 'error');
            });
        }

        $('#ai-gen-start').on('click', function() {
            if (isStreaming) return;
            var prompt = $('#ai-prompt').val().trim();
            if (!prompt) { alert('请输入需求描述'); return; }
            retryCount = 0;
            doStream(prompt, $('#ai-search-keyword').val().trim());
        });

        function getTargetCategory() {
            var catId = parseInt($('#ai-target-category').val()) || 0;
            if (!catId) { alert('请先在顶部选择目标分类'); return 0; }
            return catId;
        }

        function parseAndShowCards(text) {
            if (!text) return;
            var items = parseJsonFromText(text);
            if (!items || !items.length) {
                if (retryCount === 0) {
                    retryCount++;
                    $('#ai-stream-content').append('<p class="ai-parse-error">首次解析失败，自动重试中...</p>');
                    doStream($('#ai-prompt').val().trim(), $('#ai-search-keyword').val().trim());
                } else {
                    $('#ai-stream-content').append('<p class="ai-parse-error">未能解析出有效文章，请修改需求后重试</p>');
                }
                return;
            }
            generatedItems = items;
            renderCards(items);
            $('#ai-result-cards').show();
            $('#ai-stream-output').hide();
        }

        function parseJsonFromText(text) {
            var m = text.match(/\[\s*\{[\s\S]*?\}\s*\]/);
            if (m) {
                try { var arr = JSON.parse(m[0]); if (Array.isArray(arr) && arr.length) return arr; } catch(e) {}
                try {
                    var cleaned = m[0]
                        .replace(/\*\*([^*]*)\*\*/g, '$1')
                        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
                        .replace(/<\/?[^>]+(?:>|$)/g, '')
                        .replace(/"[^"]*\n[^"]*"/g, function(s) { return s.replace(/\n/g, ' '); });
                    var arr2 = JSON.parse(cleaned);
                    if (Array.isArray(arr2) && arr2.length) return arr2;
                } catch(e) {}
            }
            var objs = [];
            var objRe = /\{[^{}]*"title"\s*:\s*"[^"]*"[^{}]*\}/g;
            var objMatch;
            while ((objMatch = objRe.exec(text)) !== null) {
                try { var obj = JSON.parse(objMatch[0]); objs.push(obj); } catch(e) {}
            }
            if (objs.length) return objs;
            return null;
        }

        function renderCards(items) {
            var $container = $('#ai-cards-container');
            $container.empty();
            items.forEach(function(item, idx) {
                var urlHtml = item.url ? '<div class="ai-card-link"><a href="' + escapeAttr(item.url) + '" target="_blank" rel="noopener">' + escapeHtml(item.url.substring(0, 60)) + '</a></div>' : '';
                var $card = $('<div class="ai-item-card" data-index="' + idx + '">' +
                    '<div class="ai-card-check"><input type="checkbox" class="ai-card-select"></div>' +
                    '<div class="ai-card-content">' +
                        '<div class="ai-card-title">' + escapeHtml(item.title || '未命名') + '</div>' +
                        '<div class="ai-card-preview">' + escapeHtml((item.summary || '').substring(0, 120)) + '</div>' +
                        urlHtml +
                    '</div>' +
                    '<div class="ai-card-actions">' +
                        '<button class="button ai-add-one" data-idx="' + idx + '">添加</button>' +
                    '</div>' +
                '</div>');
                $card.on('click', function(e) {
                    if ($(e.target).is('button, input')) return;
                    if ($card.hasClass('ai-card-added')) return;
                    $card.toggleClass('selected');
                    $card.find('.ai-card-select').prop('checked', $card.hasClass('selected'));
                });
                $container.append($card);
            });
        }

        function escapeHtml(str) {
            var d = document.createElement('div');
            d.textContent = str;
            return d.innerHTML;
        }
        function escapeAttr(str) {
            return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        }

        // 全选/取消全选
        $('.ai-select-all').on('click', function() {
            var available = $('.ai-item-card').not('.ai-card-added');
            var allSelected = available.filter('.selected').length === available.length;
            available.toggleClass('selected', !allSelected);
            available.find('.ai-card-select').prop('checked', !allSelected);
        });

        // 单条添加到目标分类
        $(document).on('click', '.ai-add-one', function(e) {
            e.stopPropagation();
            var $btn = $(this);
            if ($btn.hasClass('disabled')) return;
            var idx = $btn.data('idx');
            var item = generatedItems[idx];
            if (!item) return;
            var catId = getTargetCategory();
            if (!catId) return;
            addSingleItem(item, catId, $btn);
        });

        function addSingleItem(item, catId, $btn) {
            $btn.prop('disabled', true).text('添加中...');
            $.ajax({
                url: hotArticlesAdmin.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'hot_articles_add_batch',
                    category_id: catId,
                    items: JSON.stringify([item]),
                    nonce: hotArticlesAdmin.nonce
                },
                success: function(resp) {
                    if (resp.success) {
                        var count = resp.data.count || 0;
                        if (count > 0) {
                            $btn.closest('.ai-item-card').addClass('ai-card-added');
                            $btn.text('已添加').addClass('disabled');
                            showNotice('已添加到分类', 'success');
                        } else if (resp.data.skipped) {
                            $btn.closest('.ai-item-card').addClass('ai-card-added');
                            $btn.text('已存在').addClass('disabled');
                            showNotice(resp.data.message || '该内容已存在', 'info');
                        }
                    } else {
                        $btn.prop('disabled', false).text('添加');
                        showNotice(resp.data || '添加失败', 'error');
                    }
                },
                error: function() {
                    $btn.prop('disabled', false).text('添加');
                }
            });
        }

        // 批量添加选中项
        $('.ai-batch-add').on('click', function() {
            var catId = getTargetCategory();
            if (!catId) return;
            var $selected = $('.ai-item-card.selected').not('.ai-card-added');
            if (!$selected.length) { alert('请至少选择一篇文章'); return; }
            var items = $selected.map(function() {
                return generatedItems[$(this).data('index')];
            }).get().filter(Boolean);
            addBatchItems(items, catId);
        });

        function addBatchItems(items, catId) {
            $.ajax({
                url: hotArticlesAdmin.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'hot_articles_add_batch',
                    category_id: catId,
                    items: JSON.stringify(items),
                    nonce: hotArticlesAdmin.nonce
                },
                success: function(resp) {
                    if (resp.success) {
                        var added = resp.data.count || 0;
                        var skipped = resp.data.skipped || 0;
                        var msg = '成功添加 ' + added + ' 篇文章';
                        if (skipped > 0) msg += '，' + skipped + ' 篇已存在跳过';
                        showNotice(msg, 'success');
                        $('.ai-item-card.selected').addClass('ai-card-added').removeClass('selected');
                        $('.ai-item-card.selected .ai-add-one').text('已添加').addClass('disabled');
                        $('.ai-card-select').prop('checked', false);
                    } else {
                        showNotice(resp.data || '添加失败', 'error');
                    }
                }
            });
        }

        $(document).on('click', '.row-actions .delete a, a[href*="action=delete"]', function(e) {
            if (!confirm('确定要删除吗？')) { e.preventDefault(); return false; }
        });

        function showNotice(msg, type) {
            $('<div class="notice notice-' + (type||'info') + ' is-dismissible"><p>' + msg + '</p></div>')
                .insertAfter('.wrap h1').first().delay(3000).fadeOut(400, function() { $(this).remove(); });
        }
    });
})(jQuery);
