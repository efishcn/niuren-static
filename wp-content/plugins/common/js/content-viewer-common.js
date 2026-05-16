/**
 * Content Viewer - Shared AI Streaming Client
 * Used by: hot-topics, hot-articles, copy-content
 *
 * Provides: ContentViewer.StreamClient for fetch+ReadableStream SSE consumption.
 */
(function(global) {
    'use strict';

    /**
     * StreamClient - SSE streaming via fetch + ReadableStream
     *
     * @param {string} ajaxUrl   - WordPress admin-ajax.php URL
     * @param {string} nonce     - WordPress nonce
     * @param {object} options   - { action, onChunk, onDone, onError, extraData }
     */
    function StreamClient(ajaxUrl, nonce, options) {
        this.ajaxUrl = ajaxUrl;
        this.nonce = nonce;
        this.action = options.action;
        this.onChunk = options.onChunk || function() {};
        this.onDone = options.onDone || function() {};
        this.onError = options.onError || function() {};
        this.extraData = options.extraData || {};
        this.isStreaming = false;
        this.rawContent = '';
    }

    StreamClient.prototype.start = function(prompt) {
        if (this.isStreaming) return;
        this.isStreaming = true;
        this.rawContent = '';

        var self = this;
        var bodyData = new URLSearchParams();
        bodyData.append('action', this.action);
        bodyData.append('prompt', prompt);
        bodyData.append('nonce', this.nonce);
        Object.keys(this.extraData).forEach(function(k) {
            bodyData.append(k, self.extraData[k]);
        });

        fetch(this.ajaxUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: bodyData
        }).then(function(resp) {
            if (!resp.ok) throw new Error('HTTP ' + resp.status);
            var ct = resp.headers.get('Content-Type') || '';
            if (ct.includes('application/json')) {
                return resp.json().then(function(j) { throw new Error(j.data || '请求失败'); });
            }
            var reader = resp.body.getReader();
            var decoder = new TextDecoder('utf-8');
            var buf = '';

            function process() {
                return reader.read().then(function(r) {
                    if (r.done) {
                        self.isStreaming = false;
                        self.onDone(self.rawContent);
                        return;
                    }
                    buf += decoder.decode(r.value, { stream: true });
                    var lines = buf.split('\n');
                    buf = lines.pop();
                    lines.forEach(function(line) {
                        line = line.trim();
                        if (!line || line === 'data: [DONE]') return;
                        if (!line.startsWith('data: ')) return;
                        try {
                            var j = JSON.parse(line.substring(6));
                            if (j.error) {
                                self.onChunk({ error: j.error });
                            } else if (j.full) {
                                self.rawContent = j.full;
                                self.onChunk({ full: j.full });
                            } else if (j.content) {
                                self.rawContent += j.content;
                                self.onChunk({ content: j.content, full: self.rawContent });
                            }
                        } catch(e) {}
                    });
                    return process();
                });
            }
            return process();
        }).catch(function(err) {
            self.isStreaming = false;
            self.onError(err.message);
        });
    };

    StreamClient.prototype.stop = function() {
        this.isStreaming = false;
    };

    /**
     * Parse JSON array from AI response text.
     * Looks for the first [...] JSON array in the text.
     */
    function parseJsonArray(text) {
        if (!text) return [];
        var m = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (!m) return [];
        try { return JSON.parse(m[0]); } catch(e) { return []; }
    }

    /**
     * Escape HTML entities.
     */
    function escHtml(s) {
        var d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    /**
     * Show a dismissible WordPress-style notice.
     * @param {string} msg
     * @param {string} type - 'success', 'error', 'info'
     * @param {jQuery} $container - element to insert the notice after
     */
    function showNotice(msg, type, $container) {
        var $notice = jQuery('<div class="notice notice-' + (type || 'info') + ' is-dismissible"><p>' + msg + '</p></div>');
        $notice.insertAfter($container).delay(3000).fadeOut(400, function() { $notice.remove(); });
    }

    // Exports
    global.ContentViewer = {
        StreamClient: StreamClient,
        parseJsonArray: parseJsonArray,
        escHtml: escHtml,
        showNotice: showNotice
    };

    /**
     * Mobile responsive table: expand/collapse rows
     * On screens ≤ 782px, collapses table rows to show only primary column.
     * Clicking the expand arrow reveals all hidden columns inline.
     */
    jQuery(function($) {
        // ===== User Picker Modal (shared) =====
        var $userModal = null;
        var activePicker = null; // the .cv-user-picker currently using the modal
        var userPage = 1, userSearch = '';

        function ensureUserModal() {
            if ($userModal) return;
            var html = '<div class="cv-user-modal" id="cv-user-modal">' +
                '<div class="cv-user-modal-content">' +
                '<div class="cv-user-modal-header">' +
                '<h2>选择用户</h2>' +
                '<span class="cv-user-modal-close">&times;</span>' +
                '</div>' +
                '<div class="cv-user-modal-body">' +
                '<div class="cv-user-search-box">' +
                '<input type="text" id="cv-user-search-input" class="regular-text" placeholder="搜索用户名、邮箱或显示名...">' +
                '<button type="button" class="button" id="cv-user-search-btn">搜索</button>' +
                '</div>' +
                '<div id="cv-user-list-container"><div class="cv-user-loading">加载中...</div></div>' +
                '<div class="cv-user-pagination" id="cv-user-pagination"></div>' +
                '</div></div></div>';
            $userModal = $(html).appendTo('body');

            // Close events
            $userModal.on('click', '.cv-user-modal-close', function() { closeUserModal(); });
            $userModal.on('click', function(e) { if (e.target === this) closeUserModal(); });
            $(document).on('keydown', function(e) { if (e.key === 'Escape') closeUserModal(); });

            // Search events
            $('#cv-user-search-btn').on('click', function() {
                userSearch = $('#cv-user-search-input').val();
                loadUsers(1, userSearch);
            });
            $('#cv-user-search-input').on('keypress', function(e) {
                if (e.which === 13) $('#cv-user-search-btn').click();
            });

            // Selection delegation
            $('#cv-user-list-container').on('click', '.cv-select-user-btn', function() {
                var btn = $(this);
                selectUser(btn.data('id'), btn.data('login'), btn.data('email'));
            });
        }

        function openUserModal(picker) {
            ensureUserModal();
            activePicker = picker;
            $userModal.fadeIn(200);
            $('#cv-user-search-input').val('');
            userSearch = '';
            loadUsers(1, '');
        }

        function closeUserModal() {
            if ($userModal) $userModal.fadeOut(200);
            activePicker = null;
        }

        function selectUser(id, login, email) {
            if (!activePicker) return;
            activePicker.find('.cv-user-id').val(id);
            activePicker.find('.cv-user-display').val(login + ' (' + email + ')');
            activePicker.find('.cv-user-clear-btn').show();
            closeUserModal();
        }

        function clearUserPicker(picker) {
            picker.find('.cv-user-id').val('');
            picker.find('.cv-user-display').val('').attr('placeholder', '当前用户');
            picker.find('.cv-user-clear-btn').hide();
        }

        function loadUsers(page, search) {
            userPage = page;
            var $container = $('#cv-user-list-container');
            $container.html('<div class="cv-user-loading">加载中...</div>');
            var nonce = activePicker ? activePicker.data('nonce') : '';
            $.post(ajaxurl, {
                action: 'ask_search_users',
                nonce: nonce,
                search: search,
                page: page
            }, function(res) {
                if (res.success) renderUserList(res.data);
                else $container.html('<div class="cv-user-loading" style="color:#ef4444">加载失败</div>');
            });
        }

        function renderUserList(data) {
            var html = '<table class="cv-user-table"><thead><tr>' +
                '<th>ID</th><th>用户名</th><th>邮箱</th><th>显示名</th><th>操作</th>' +
                '</tr></thead><tbody>';
            if (!data.users.length) {
                html += '<tr><td colspan="5" style="text-align:center;padding:30px;color:#9ca3af;">未找到用户</td></tr>';
            } else {
                $.each(data.users, function(i, u) {
                    html += '<tr><td>' + u.id + '</td><td>' + escHtml(u.login) + '</td><td>' + escHtml(u.email) +
                        '</td><td>' + escHtml(u.display_name) + '</td>' +
                        '<td><button type="button" class="button button-small cv-select-user-btn" ' +
                        'data-id="' + u.id + '" data-login="' + escHtml(u.login) + '" data-email="' + escHtml(u.email) + '">选择</button></td></tr>';
                });
            }
            html += '</tbody></table>';
            $('#cv-user-list-container').html(html);

            // Pagination — standard WP style: prev, limited pages, next
            var $pag = $('#cv-user-pagination');
            if (data.total_pages > 1) {
                var cp = data.page, tp = data.total_pages;
                var ph = '<div class="tablenav-pages">';
                ph += '<span class="displaying-num">' + data.total + ' 个用户</span>';
                ph += '<span class="pagination-links">';
                // Prev
                if (cp > 1) {
                    ph += '<button class="cv-page-btn first-page" data-page="1">&laquo;</button>';
                    ph += '<button class="cv-page-btn prev-page" data-page="' + (cp - 1) + '">&lsaquo;</button>';
                } else {
                    ph += '<span class="tablenav-pages-navspan button disabled" aria-hidden="true">&laquo;</span>';
                    ph += '<span class="tablenav-pages-navspan button disabled" aria-hidden="true">&lsaquo;</span>';
                }
                // Page numbers (show max 5, centered around current)
                var start = Math.max(1, cp - 2);
                var end = Math.min(tp, cp + 2);
                if (end - start < 4) { start = Math.max(1, end - 4); }
                for (var i = start; i <= end; i++) {
                    ph += '<button class="cv-page-btn' + (i === cp ? ' cv-page-active' : '') + '" data-page="' + i + '">' + i + '</button>';
                }
                // Next
                if (cp < tp) {
                    ph += '<button class="cv-page-btn next-page" data-page="' + (cp + 1) + '">&rsaquo;</button>';
                    ph += '<button class="cv-page-btn last-page" data-page="' + tp + '">&raquo;</button>';
                } else {
                    ph += '<span class="tablenav-pages-navspan button disabled" aria-hidden="true">&rsaquo;</span>';
                    ph += '<span class="tablenav-pages-navspan button disabled" aria-hidden="true">&raquo;</span>';
                }
                ph += '<span class="paging-input">' + cp + ' / ' + tp + '</span>';
                ph += '</span></div>';
                $pag.html(ph).show();
                $pag.find('.cv-page-btn').on('click', function() {
                    loadUsers(parseInt($(this).data('page')), userSearch);
                });
            } else {
                $pag.hide();
            }
        }

        // ===== AJAX Form Handler (cv-ajax-form) =====
        $(document).on('submit', '.cv-ajax-form', function(e) {
            e.preventDefault();
            var $form = $(this);
            var $submit = $form.find('input[type="submit"]');
            var origText = $submit.val() || '提交';
            $submit.prop('disabled', true).val('提交中...');

            var ajaxAction = $form.data('ajax-action');
            // Get nonce: try data-nonce on form, then global plugin objects
            var nonce = $form.data('nonce');
            if (!nonce && window.copyContentAdmin) nonce = copyContentAdmin.nonce;
            if (!nonce && window.hotTopicsAdmin) nonce = hotTopicsAdmin.nonce;
            if (!nonce && window.hotArticlesAdmin) nonce = hotArticlesAdmin.nonce;

            $.post(ajaxurl, {
                action: ajaxAction,
                nonce: nonce,
                form_data: $form.serialize()
            }, function(res) {
                if (res.success) {
                    showNotice(res.data.message || '保存成功', 'success', $form);
                    if (res.data.redirect) {
                        setTimeout(function() { window.location.href = res.data.redirect; }, 800);
                    }
                } else {
                    showNotice(res.data || '保存失败', 'error', $form);
                }
            }).fail(function() {
                showNotice('请求失败，请重试', 'error', $form);
            }).always(function() {
                $submit.prop('disabled', false).val(origText);
            });
        });

        // Init all user pickers on page
        $('.cv-user-picker').each(function() {
            var $picker = $(this);
            $picker.find('.cv-user-select-btn, .cv-user-display').on('click', function() {
                openUserModal($picker);
            });
            $picker.find('.cv-user-clear-btn').on('click', function() {
                clearUserPicker($picker);
            });
            // Hide clear button if no initial value
            if (!$picker.find('.cv-user-id').val()) {
                $picker.find('.cv-user-clear-btn').hide();
            }
        });

    });

})(window);
