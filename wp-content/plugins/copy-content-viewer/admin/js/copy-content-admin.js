/**
 * Copy Content Viewer - Enhanced Admin JavaScript
 */

(function($) {
    'use strict';

    $(document).ready(function() {
        
        // ========================================
        // Status Toggle
        // ========================================
        $('.toggle-status').on('click', function(e) {
            e.preventDefault();
            
            var $link = $(this);
            var id = $link.data('id');
            var status = $link.data('status');
            var $row = $link.closest('tr');
            
            // Add loading state
            $row.addClass('loading');
            
            $.ajax({
                url: copyContentAdmin.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'toggle_content_status',
                    id: id,
                    status: status,
                    nonce: copyContentAdmin.nonce
                },
                success: function(response) {
                    if (response.success) {
                        // Smooth reload with fade effect
                        $row.fadeOut(200, function() {
                            location.reload();
                        });
                    } else {
                        $row.removeClass('loading');
                        showNotice(response.data || '操作失败', 'error');
                    }
                },
                error: function() {
                    $row.removeClass('loading');
                    showNotice('操作失败，请重试', 'error');
                }
            });
        });

        // ========================================
        // Hot Toggle
        // ========================================
        $('.hot-action').on('click', function(e) {
            e.preventDefault();
            
            var $btn = $(this);
            var id = $btn.data('id');
            var originalText = $btn.text();
            
            // Prevent double clicks
            if ($btn.hasClass('processing')) {
                return;
            }
            
            $btn.addClass('processing').text('处理中...');
            
            $.ajax({
                url: copyContentAdmin.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'toggle_content_hot',
                    id: id,
                    nonce: copyContentAdmin.nonce
                },
                success: function(response) {
                    $btn.removeClass('processing');
                    
                    if (response.success) {
                        var newText = response.data.hot ? '取消热门' : '设为热门';
                        $btn.text(newText);
                        
                        // Update icon in title column if exists
                        var $titleCell = $btn.closest('tr').find('.column-title');
                        var $hotIcon = $titleCell.find('.dashicons-star-filled');
                        
                        if (response.data.hot) {
                            if ($hotIcon.length === 0) {
                                $titleCell.find('strong').after(' <span class="dashicons dashicons-star-filled" title="热门文案" style="color: #ffb900;"></span>');
                            }
                        } else {
                            $hotIcon.remove();
                        }
                        
                        showNotice('热门状态已更新', 'success');
                    } else {
                        $btn.text(originalText);
                        showNotice(response.data || '操作失败', 'error');
                    }
                },
                error: function() {
                    $btn.removeClass('processing').text(originalText);
                    showNotice('操作失败，请重试', 'error');
                }
            });
        });

        // ========================================
        // Recommend Toggle
        // ========================================
        $('.recommend-action').on('click', function(e) {
            e.preventDefault();
            
            var $btn = $(this);
            var id = $btn.data('id');
            var originalText = $btn.text();
            
            // Prevent double clicks
            if ($btn.hasClass('processing')) {
                return;
            }
            
            $btn.addClass('processing').text('处理中...');
            
            $.ajax({
                url: copyContentAdmin.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'toggle_content_recommend',
                    id: id,
                    nonce: copyContentAdmin.nonce
                },
                success: function(response) {
                    $btn.removeClass('processing');
                    
                    if (response.success) {
                        var newText = response.data.recommend ? '取消推荐' : '设为推荐';
                        $btn.text(newText);
                        
                        // Update icon in title column if exists
                        var $titleCell = $btn.closest('tr').find('.column-title');
                        var $recommendIcon = $titleCell.find('.dashicons-thumbs-up');
                        
                        if (response.data.recommend) {
                            if ($recommendIcon.length === 0) {
                                $titleCell.find('strong').after(' <span class="dashicons dashicons-thumbs-up" title="推荐文案" style="color: #46b450;"></span>');
                            }
                        } else {
                            $recommendIcon.remove();
                        }
                        
                        showNotice('推荐状态已更新', 'success');
                    } else {
                        $btn.text(originalText);
                        showNotice(response.data || '操作失败', 'error');
                    }
                },
                error: function() {
                    $btn.removeClass('processing').text(originalText);
                    showNotice('操作失败，请重试', 'error');
                }
            });
        });

        // ========================================
        // Category Cascade
        // ========================================
        $('.parent-category-select, .parent-category-filter').on('change', function() {
            var parentId = $(this).val();
            var $subCategorySelect = $(this).hasClass('parent-category-select') ? 
                                    $('.sub-category-select') : 
                                    $('.sub-category-filter');
            
            // Clear sub-category options
            $subCategorySelect.html('<option value="">请选择二级分类</option>');
            $subCategorySelect.prop('disabled', true);
            
            if (parentId) {
                // Show loading state
                $subCategorySelect.html('<option value="">加载中...</option>');
                
                $.ajax({
                    url: copyContentAdmin.ajaxUrl,
                    type: 'POST',
                    data: {
                        action: 'get_sub_categories',
                        parent_id: parentId,
                        nonce: copyContentAdmin.nonce
                    },
                    success: function(response) {
                        $subCategorySelect.html('<option value="">请选择二级分类</option>');
                        
                        if (response.success && response.data && response.data.length > 0) {
                            $.each(response.data, function(index, category) {
                                $subCategorySelect.append(
                                    $('<option></option>')
                                        .val(category.id)
                                        .text(category.name)
                                );
                            });
                            $subCategorySelect.prop('disabled', false);
                        } else {
                            $subCategorySelect.html('<option value="">暂无二级分类</option>');
                        }
                    },
                    error: function() {
                        $subCategorySelect.html('<option value="">加载失败</option>');
                    }
                });
            }
        });

        // ========================================
        // Form Validation (只针对add/edit表单)
        // ========================================
        $('.copy-content-form').on('submit', function(e) {
            var $form = $(this);
            var isValid = true;
            var errorMessage = '';
            
            // Validate title (只在有title字段时验证)
            var $title = $form.find('#title');
            if ($title.length && !$title.val().trim()) {
                isValid = false;
                errorMessage += '标题不能为空\n';
                $title.css('border-color', '#d63638');
            } else if ($title.length) {
                $title.css('border-color', '');
            }
            
            // Validate category (只在有category_id字段时验证)
            var $categoryId = $form.find('#category_id');
            if ($categoryId.length && !$categoryId.val()) {
                isValid = false;
                errorMessage += '请选择分类\n';
                $categoryId.css('border-color', '#d63638');
            } else if ($categoryId.length) {
                $categoryId.css('border-color', '');
            }
            
            // Validate name for category form
            var $name = $form.find('#name');
            if ($name.length && !$name.val().trim()) {
                isValid = false;
                errorMessage += '名称不能为空\n';
                $name.css('border-color', '#d63638');
            } else if ($name.length) {
                $name.css('border-color', '');
            }
            
            if (!isValid) {
                e.preventDefault();
                alert(errorMessage);
                return false;
            }
            
            // Add loading animation to submit button
            var $submit = $form.find('input[type="submit"]');
            if ($submit.length) {
                $submit.val('提交中...').prop('disabled', true);
            }
        });

        // ========================================
        // Confirm Delete Actions
        // ========================================
        $('.row-actions .delete a, a[href*="action=delete"]').on('click', function(e) {
            if (!confirm('确定要删除吗？此操作不可恢复。')) {
                e.preventDefault();
                return false;
            }
        });

        // ========================================
        // Bulk Actions Confirmation
        // ========================================
        $('#doaction, #doaction2').on('click', function(e) {
            var action = $(this).siblings('select').val();
            
            if (action === 'delete') {
                if (!confirm('确定要删除选中的项目吗？此操作不可恢复。')) {
                    e.preventDefault();
                    return false;
                }
            }
        });

        // ========================================
        // Search Box Enhancement
        // ========================================
        $('.search-box input[type="search"]').on('keypress', function(e) {
            if (e.which === 13) {
                $(this).closest('form').submit();
            }
        });

        // ========================================
        // Utility Functions
        // ========================================
        
        /**
         * Show admin notice
         */
        function showNotice(message, type) {
            type = type || 'info';
            
            var noticeClass = 'notice-' + type;
            var $notice = $('<div class="notice ' + noticeClass + ' is-dismissible"><p>' + message + '</p></div>');
            
            $('.wrap h1').after($notice);
            
            // Auto dismiss after 3 seconds
            setTimeout(function() {
                $notice.fadeOut(400, function() {
                    $(this).remove();
                });
            }, 3000);
            
            // Add dismiss button functionality
            $notice.on('click', '.notice-dismiss', function() {
                $notice.fadeOut(400, function() {
                    $(this).remove();
                });
            });
        }

        // ========================================
        // Tooltips
        // ========================================
        $('.column-title .dashicons').each(function() {
            var $icon = $(this);
            var title = $icon.attr('title');
            
            if (title) {
                $icon.hover(
                    function() {
                        var $tooltip = $('<div class="copy-content-tooltip">' + title + '</div>');
                        $('body').append($tooltip);
                        
                        var iconOffset = $icon.offset();
                        $tooltip.css({
                            top: iconOffset.top - $tooltip.outerHeight() - 8,
                            left: iconOffset.left + ($icon.outerWidth() / 2) - ($tooltip.outerWidth() / 2)
                        });
                    },
                    function() {
                        $('.copy-content-tooltip').remove();
                    }
                );
            }
        });

        // ========================================
        // Real-time Character Counter
        // ========================================
        if ($('.copy-content-form #title').length && !$('#title').siblings('.character-counter').length) {
            $('#title').after('<div class="character-counter">字符数: 0</div>');
            
            $('#title').on('input', function() {
                var length = $(this).val().length;
                $(this).siblings('.character-counter').text('字符数: ' + length);
            }).trigger('input');
        }

        // ========================================
        // Smooth Scroll to Top
        // ========================================
        if ($('.wrap').length && !$('.scroll-to-top').length) {
            $('<button class="scroll-to-top" title="返回顶部"><span class="dashicons dashicons-arrow-up-alt2"></span></button>')
                .appendTo('body')
                .on('click', function() {
                    $('html, body').animate({scrollTop: 0}, 400);
                });
            
            $(window).on('scroll', function() {
                if ($(this).scrollTop() > 300) {
                    $('.scroll-to-top').fadeIn();
                } else {
                    $('.scroll-to-top').fadeOut();
                }
            });
        }

        // ========================================
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

        // ESC to close
        $(document).on('keydown', function(e) {
            if (e.key === 'Escape' && $panel.hasClass('open')) {
                closePanel();
            }
        });

        function doStream(prompt) {
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
                action: 'copy_content_ai_stream',
                prompt: prompt,
                nonce: copyContentAdmin.nonce
            });
            if (retryCount > 0) {
                bodyData.append('retry', '1');
            }

            fetch(copyContentAdmin.ajaxUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: bodyData
            }).then(function(resp) {
                if (!resp.ok) throw new Error('HTTP ' + resp.status);
                var ct = resp.headers.get('Content-Type') || '';
                if (ct.includes('application/json')) {
                    return resp.json().then(function(json) {
                        throw new Error(json.data || '请求失败');
                    });
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
                        $('#ai-stream-content').scrollTop($('#ai-stream-content')[0].scrollHeight);
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
            doStream(prompt);
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
                    doStream($('#ai-prompt').val().trim());
                } else {
                    $('#ai-stream-content').append('<p class="ai-parse-error">未能解析出有效文案，请修改需求后重试</p>');
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
                var $card = $('<div class="ai-item-card" data-index="' + idx + '">' +
                    '<div class="ai-card-check"><input type="checkbox" class="ai-card-select"></div>' +
                    '<div class="ai-card-content">' +
                        '<div class="ai-card-title">' + escapeHtml(item.title || '未命名') + '</div>' +
                        '<div class="ai-card-preview">' + escapeHtml((item.content || '').substring(0, 120)) + '</div>' +
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
                url: copyContentAdmin.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'copy_content_add_batch',
                    category_id: catId,
                    items: JSON.stringify([item]),
                    nonce: copyContentAdmin.nonce
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
            if (!$selected.length) { alert('请至少选择一个文案'); return; }
            var items = $selected.map(function() {
                return generatedItems[$(this).data('index')];
            }).get().filter(Boolean);
            addBatchItems(items, catId);
        });

        function addBatchItems(items, catId) {
            $.ajax({
                url: copyContentAdmin.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'copy_content_add_batch',
                    category_id: catId,
                    items: JSON.stringify(items),
                    nonce: copyContentAdmin.nonce
                },
                success: function(resp) {
                    if (resp.success) {
                        var added = resp.data.count || 0;
                        var skipped = resp.data.skipped || 0;
                        var msg = '成功添加 ' + added + ' 条文案';
                        if (skipped > 0) msg += '，' + skipped + ' 条已存在跳过';
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

    }); // End document ready

})(jQuery);
