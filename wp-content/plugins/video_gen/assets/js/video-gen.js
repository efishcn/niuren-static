jQuery(document).ready(function($) {
    // 显示通知消息
    window.showNotification = function(type, message) {
        const $notification = $('<div class="video-gen-notification ' + type + '">' + message + '</div>');
        $('body').append($notification);
        
        setTimeout(function() {
            $notification.addClass('show');
        }, 100);
        
        setTimeout(function() {
            $notification.removeClass('show');
            setTimeout(function() {
                $notification.remove();
            }, 300);
        }, 3000);
    };
    'use strict';
    
    // 创建独立命名空间避免与content_gen冲突
    window.VideoGenAdmin = window.VideoGenAdmin || {
        initialized: false,
        listPageInitialized: false  // 新增列表页初始化标记
    };
    
    // 防止重复初始化
    if (window.VideoGenAdmin.initialized) {
        return;
    }
    
    // 先解绑所有可能存在的事件处理器
    $(document).off('click', '#stay-on-page, #view-generation, #close-modal');
    $('#video-gen-form').off('submit');
    
    // 解绑可能与content_gen冲突的事件
    $(document).off('click.videoGen');

    // 添加重新提交按钮事件处理器（使用命名空间避免冲突）
    $(document).on('click.videoGen', '.video-gen-resubmit', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        var $button = $(this);
        var recordId = $button.data('id');
        var redirectPage = $button.data('redirect') || 'video-records'; // 确保重定向到正确页面
        
        if (!recordId) {
            alert('记录ID不能为空');
            return;
        }
        
        if (!confirm('确定要重新提交这个任务吗？')) {
            return;
        }
        
        VideoGenAdmin.resubmitRecord(recordId, redirectPage, $button);
    });

    // 添加页面加载动画
    $('.video-card').each(function(index) {
        $(this).css({
            'opacity': '0',
            'transform': 'translateY(20px)'
        }).delay(index * 100).animate({
            'opacity': '1'
        }, 600, function() {
            $(this).css('transform', 'translateY(0)');
        });
    });

    // 取消生成按钮
    $(document).on('click', '.cancel-generation', function(e) {
        e.preventDefault();
        
        if (!confirm('确认取消生成吗？')) {
            return;
        }
        
        var $btn = $(this);
        var id = $btn.data('id');
        var $row = $btn.closest('tr');
        
        $btn.prop('disabled', true).text('取消中...');
        
        $.ajax({
            url: videoGenAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'video_gen_cancel',
                nonce: videoGenAjax.nonce,
                id: id
            },
            success: function(response) {
                if (response.success) {
                    // 更新状态列显示
                    $row.find('.column-status').html('<span class="status-badge cancelled">已取消</span>');
                    
                    // 移除取消按钮
                    $btn.fadeOut(300, function() {
                        $(this).remove();
                    });
                    
                    // 显示成功提示
                    showNotification('success', response.data.message);
                } else {
                    alert(response.data.message || '取消失败');
                    $btn.prop('disabled', false).text('取消生成');
                }
            },
            error: function() {
                alert('请求失败，请重试');
                $btn.prop('disabled', false).text('取消生成');
            }
        });
    });

    // 添加输入框交互效果
    $('.regular-text, textarea, select').on('focus', function() {
        $(this).closest('tr').addClass('focused');
    }).on('blur', function() {
        $(this).closest('tr').removeClass('focused');
    });

    // 添加按钮悬停音效模拟
    $('.submit-button, .dh-action-btn, .page-title-action').hover(
        function() {
            $(this).addClass('btn-hover');
        },
        function() {
            $(this).removeClass('btn-hover');
        }
    );

    // 现代风格按钮选择器交互 - 文案来源方式
    $('.mode-option-card').on('click', function() {
        var modeValue = $(this).data('mode');
        $('.mode-option-card input[type="radio"]').prop('checked', false);
        $(this).find('input[type="radio"]').prop('checked', true);
        
        // 根据选择显示/隐藏相应内容
        if (modeValue === 'source') {
            $('.content-source-tab').show();
            $('.custom-content-tab').hide();
        } else if (modeValue === 'custom') {
            $('.content-source-tab').hide();
            $('.custom-content-tab').show();
        }
    });

    // 现代风格按钮选择器交互 - 内容来源
    $('.source-option-card').on('click', function() {
        var sourceValue = $(this).data('source');
        $('.source-option-card input[type="radio"]').prop('checked', false);
        $(this).find('input[type="radio"]').prop('checked', true);
        
        // 动态加载内容字段
        console.log("sourceValue:"+sourceValue)
        loadContentFields(sourceValue);
    });

    // 高级设置折叠展开功能（修复版）
    $('#advanced-settings-toggle').off('click').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation(); // 阻止事件冒泡

        const $header = $(this);
        const $content = $('#advanced-settings-content');
        const $icon = $header.find('.toggle-icon');

        // 使用CSS类判断状态更可靠
        if ($header.hasClass('expanded')) {
            $content.slideUp(300, () => $header.removeClass('expanded'));
            $icon.css('transform', 'rotate(0deg)');
        } else {
            $content.slideDown(300, () => $header.addClass('expanded'));
            $icon.css('transform', 'rotate(180deg)');
        }
    });

    // 平台选择弹层功能
    $('#selected-platform, #toggle-platform-button').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        showPlatformModal();
    });

    // ==================== 通用懒加载 AJAX 工具 ====================
    var lazyCache = {};

    function fetchLazyData(resource, params) {
        var cacheKey = resource + '_' + JSON.stringify(params || {});
        if (lazyCache[cacheKey]) {
            return $.Deferred().resolve(lazyCache[cacheKey]).promise();
        }

        var actionMap = {
            'platform': 'video_gen_get_platforms',
            'model': 'video_gen_get_models',
            'voice': 'video_gen_get_voices',
            'video_cover_style': 'video_gen_get_video_styles',
            'bgm': 'video_gen_get_bgm_list'
        };

        var action = actionMap[resource];
        if (!action) {
            console.error('fetchLazyData: unknown resource', resource);
            return $.Deferred().resolve([]).promise();
        }

        var data = { action: action, nonce: videoGenAjax.nonce };
        if (params) $.extend(data, params);

        return $.ajax({
            url: videoGenAjax.ajaxurl,
            type: 'POST',
            data: data,
            dataType: 'json'
        }).then(function(response) {
            if (response && response.success) {
                lazyCache[cacheKey] = response.data;
                return response.data;
            }
            return [];
        }, function(xhr, status, error) {
            console.error('fetchLazyData fail:', resource, status, error);
            return [];
        });
    }

    // ==================== 通用弹层创建 ====================
    function buildModalHtml(title, listClass, extraClass) {
        extraClass = extraClass || '';
        return '<div class="selector-modal-overlay ' + extraClass + '" style="display:none;">' +
            '<div class="selector-modal-content">' +
            '<div class="selector-modal-header">' +
            '<h2>' + title + '</h2>' +
            '<span class="selector-modal-close">&times;</span>' +
            '</div>' +
            '<div class="' + listClass + ' selector-list"><p class="loading-text">加载中...</p></div>' +
            '</div></div>';
    }

    function bindModalEvents($modal, closeFn) {
        $modal.find('.selector-modal-close').on('click', function(e) {
            e.preventDefault(); e.stopPropagation(); closeFn();
        });
        $modal.on('click', function(e) {
            if ($(e.target).is('.selector-modal-overlay')) closeFn();
        });
        $(document).on('keydown.selector-modal', function(e) {
            if (e.keyCode === 27) { closeFn(); }
        });
    }

    function closeSelectorModal($modal) {
        $modal.fadeOut(300, function() {
            $(this).remove();
            $(document).off('keydown.selector-modal');
        });
    }

    // ==================== 平台选择弹层 ====================
    function showPlatformModal() {
        $('.selector-modal-overlay').remove();
        var $modal = $(buildModalHtml('选择目标平台', 'platform-list', 'platform-modal'));
        $('body').append($modal);
        $modal.fadeIn(300);

        fetchLazyData('platform').then(function(items) {
            var html = '';
            $.each(items, function(i, p) {
                html += '<div class="platform-option" data-platform="' + p.platform_code + '">' +
                    '<span class="platform-name-text">' + p.platform_name + '</span>';
                if (p.platform_desc && p.platform_desc.trim() !== '') {
                    html += '<i class="dashicons dashicons-info-outline platform-tooltip" title="' + p.platform_desc + '"></i>';
                }
                html += '</div>';
            });
            $modal.find('.platform-list').html(html);

            $modal.find('.platform-option').on('click', function(e) {
                e.preventDefault(); e.stopPropagation();
                var code = $(this).data('platform');
                var name = $(this).find('.platform-name-text').text();
                $('.platform-name').text(name);
                $('#platform').val(code);
                closeSelectorModal($modal);
            });
        });

        bindModalEvents($modal, function() { closeSelectorModal($modal); });
    }

    // ==================== 模型选择弹层 ====================
    function showModelModal() {
        $('.selector-modal-overlay').remove();
        var $modal = $(buildModalHtml('选择生成模型', 'model-list', 'model-modal'));
        $('body').append($modal);
        $modal.fadeIn(300);

        fetchLazyData('model').then(function(items) {
            var html = '';
            $.each(items, function(i, m) {
                html += '<div class="selector-option model-option" data-value="' + m.identifier + '" data-name="' + m.model_name + '">' +
                    '<span class="option-name">' + m.model_name + '</span>' +
                    '<span class="option-extra">消耗' + m.credit + '积分</span></div>';
            });
            $modal.find('.model-list').html(html);

            $modal.find('.model-option').on('click', function(e) {
                e.preventDefault(); e.stopPropagation();
                var val = $(this).data('value');
                var name = $(this).data('name');
                var credit = $(this).find('.option-extra').text();
                $('#model-selector-trigger .selector-value').text(name + ' (' + credit + ')');
                $('#model-selector-trigger').data('value', val);
                $('input[name="model"]').val(val);
                $('.selector-option').removeClass('selected');
                $(this).addClass('selected');
                closeSelectorModal($modal);
            });

            // 高亮当前选中项
            var curVal = $('input[name="model"]').val();
            $modal.find('.model-option[data-value="' + curVal + '"]').addClass('selected');
        });

        bindModalEvents($modal, function() { closeSelectorModal($modal); });
    }

    // ==================== 视频封面风格弹层 ====================
    function showStyleModal() {
        $('.selector-modal-overlay').remove();
        var $modal = $(buildModalHtml('选择视频封面风格', 'style-list', 'style-modal'));
        $('body').append($modal);
        $modal.fadeIn(300);

        fetchLazyData('video_cover_style').then(function(items) {
            var html = '';
            $.each(items, function(i, s) {
                html += '<div class="selector-option style-option" data-value="' + s.style_code + '" data-name="' + s.style_name + '">' +
                    '<span class="option-name">' + s.style_name + '</span>';
                if (s.preview_url) {
                    html += '<img src="' + s.preview_url + '" class="option-preview" onerror="this.style.display=\'none\'">';
                }
                html += '</div>';
            });
            $modal.find('.style-list').html(html);

            $modal.find('.style-option').on('click', function(e) {
                e.preventDefault(); e.stopPropagation();
                var val = $(this).data('value');
                var name = $(this).data('name');
                $('#style-selector-trigger .selector-value').text(name);
                $('#style-selector-trigger').data('value', val);
                $('input[name="video_style"]').val(val);
                $('.selector-option').removeClass('selected');
                $(this).addClass('selected');
                // 更新预览图
                if (videoGenAjax.stylePreviewBase) {
                    var previewSrc = videoGenAjax.stylePreviewBase + val + '.jpg';
                    $('#video_style_preview').attr('src', previewSrc).show();
                }
                closeSelectorModal($modal);
            });

            var curVal = $('input[name="video_style"]').val();
            $modal.find('.style-option[data-value="' + curVal + '"]').addClass('selected');
        });

        bindModalEvents($modal, function() { closeSelectorModal($modal); });
    }

    // ==================== 声音选择弹层 ====================
    function showVoiceModal(voiceType) {
        $('.selector-modal-overlay').remove();
        var title = voiceType === 'edge' ? '选择标准声音' : '选择自定义声音';
        var $modal = $(buildModalHtml(title, 'voice-list', 'voice-modal'));
        $('body').append($modal);
        $modal.fadeIn(300);

        var inputName = voiceType === 'edge' ? 'voice_name' : 'voice_model';
        var triggerId = voiceType === 'edge' ? '#voice-name-trigger' : '#voice-model-trigger';
        var curVal = $('select[name="' + inputName + '"]').val();

        fetchLazyData('voice', { voice_type: voiceType }).then(function(items) {
            // 如果是 fishaudio，追加用户训练声音
            if (voiceType === 'fishaudio') {
                $('select[name="voice_model"] option').each(function() {
                    var val = $(this).val();
                    var txt = $(this).text();
                    // 检查是否已在 AJAX 数据中
                    var found = false;
                    $.each(items, function(i, v) {
                        if (v.voice_id === val) { found = true; return false; }
                    });
                    if (!found && val) {
                        items.push({ voice_id: val, title: txt, voice_type: 'user', preview_url: '' });
                    }
                });
            }

            var html = '';
            $.each(items, function(i, v) {
                html += '<div class="selector-option voice-option" data-value="' + v.voice_id + '" data-name="' + v.title + '">' +
                    '<span class="option-name">' + v.title + '</span>';
                if (v.voice_type === 'user') {
                    html += '<span class="option-badge">我的</span>';
                }
                if (v.preview_url) {
                    html += '<button type="button" class="preview-voice-btn" data-url="' + v.preview_url + '">' +
                        '<span class="dashicons dashicons-controls-play"></span>试听</button>';
                }
                html += '</div>';
            });
            $modal.find('.voice-list').html(html);

            $modal.find('.voice-option').on('click', function(e) {
                if ($(e.target).is('.preview-voice-btn')) return;
                e.preventDefault(); e.stopPropagation();
                var val = $(this).data('value');
                var name = $(this).data('name');
                $(triggerId + ' .selector-value').text(name);
                $(triggerId).data('value', val);
                $('select[name="' + inputName + '"]').val(val);
                $('.selector-option').removeClass('selected');
                $(this).addClass('selected');
                closeSelectorModal($modal);
            });

            $modal.find('.preview-voice-btn').on('click', function(e) {
                e.preventDefault(); e.stopPropagation();
                var url = $(this).data('url');
                var audio = new Audio(url);
                audio.play();
            });

            $modal.find('.voice-option[data-value="' + curVal + '"]').addClass('selected');
        });

        bindModalEvents($modal, function() { closeSelectorModal($modal); });
    }

    // ==================== 背景音乐下拉懒加载（去重修复） ====================
    $(document).on('click focus', 'select[data-lazy-resource="bgm"]', function() {
        var $select = $(this);
        if ($select.data('lazy-loaded')) return;

        fetchLazyData('bgm').then(function(items) {
            var currentVal = $select.data('current-value') || $select.val();
            $select.empty();
            $.each(items, function(i, m) {
                var $option = $('<option>').val(m.file_name).text(m.title);
                if (m.file_name == currentVal) $option.prop('selected', true);
                $select.append($option);
            });
            $select.data('lazy-loaded', true).trigger('change');
        });
    });

    // 绑定触发器点击事件
    $('#model-selector-trigger').on('click', function(e) {
        e.preventDefault(); e.stopPropagation();
        showModelModal();
    });

    $('#style-selector-trigger').on('click', function(e) {
        e.preventDefault(); e.stopPropagation();
        showStyleModal();
    });

    $('#voice-name-trigger').on('click', function(e) {
        e.preventDefault(); e.stopPropagation();
        showVoiceModal('edge');
    });

    $('#voice-model-trigger').on('click', function(e) {
        e.preventDefault(); e.stopPropagation();
        showVoiceModal('fishaudio');
    });

    // 内容字段动态加载函数
    function loadContentFields(sourceType) {
        var fields1 = '';
        var fields2 = '';
        
        // 获取URL参数
        var urlParams = new URLSearchParams(window.location.search);
        
        // 获取可能存在的值（优先使用URL参数，然后是表单数据）
        var linkAddressValue = urlParams.get('link_address') || (window.videoGenFormData && window.videoGenFormData.link_address ? window.videoGenFormData.link_address : '');
        var topicValue = urlParams.get('topic') || (window.videoGenFormData && window.videoGenFormData.topic ? window.videoGenFormData.topic : '');
        var articleTitleValue = window.videoGenFormData && window.videoGenFormData.article_title ? window.videoGenFormData.article_title : '';
        var articleContentValue = window.videoGenFormData && window.videoGenFormData.article_content ? window.videoGenFormData.article_content : '';
        
        // Helper function to escape HTML attributes
        function escapeHtml(text) {
            if (!text) return '';
            return text.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }

        if (sourceType === 'link') {
            fields1 = '<th scope="row"><label for="link_address">链接地址:</label></th>' +
                     '<td><div class="input-with-icon"><input type="text" id="link_address" name="link_address" class="modern-input" placeholder="请输入链接地址" value="' + escapeHtml(linkAddressValue) + '"></div>' +
                     '<p class="description">支持公众号、头条、微头条、网易号、搜狐号和小红书的PC链接地址，您可以去<a href="admin.php?page=hot-articles-viewer">【爆文中心】</a>获取最新爆文链接</p></td>';
        } else if (sourceType === 'topic') {
            fields1 = '<th scope="row"><label for="topic">话题:</label></th>' +
                     '<td><div class="input-with-icon">' +
                     '<input type="text" id="topic" name="topic" class="modern-input" placeholder="请输入感兴趣的话题" value="' + escapeHtml(topicValue) + '">' +
                     '<button type="button" class="random-topic-btn" title="获取随机话题">' +
                     '<i class="dashicons dashicons-randomize"></i><span>随机话题</span>' +
                     '</button></div>' +
                     '<p class="description">输入您感兴趣的话题，AI将为您生成相关内容。不知道写什么？去<a href="admin.php?page=hot-topics-viewer">【话题中心】</a>获取最新爆款话题</p></td>';
        } else if (sourceType === 'article') {
            fields1 = '<th scope="row"><label for="article_title">文章标题:</label></th>' +
                     '<td><div class="input-with-icon"><input type="text" id="article_title" name="article_title" class="modern-input" placeholder="请输入文章标题" value="' + escapeHtml(articleTitleValue) + '"></div>' +
                     '<p class="description">输入文章的标题</p></td>';
            fields2 = '<th scope="row"><label for="article_content">文章内容:</label></th>' +
                     '<td><textarea id="article_content" name="article_content" rows="6" class="regular-text" placeholder="请输入文章内容">' + escapeHtml(articleContentValue) + '</textarea>' +
                     '<p class="description">输入文章的详细内容</p></td>';
        }
        
        $('#content_source_fields').html(fields1);
        $('#content_source_fields2').html(fields2);
        
        // 绑定随机话题按钮事件（如果存在）
        if (sourceType === 'topic') {
            $('.random-topic-btn').off('click').on('click', function() {
                getRandomTopic();
            });
        }
    }

    // 初始化时检查URL参数并设置对应的选项
    var urlParams = new URLSearchParams(window.location.search);
    var urlContentSource = urlParams.get('content_source');
    
    // 如果URL中有content_source参数，设置对应的选项
    if (urlContentSource && ['link', 'topic', 'article'].includes(urlContentSource)) {
        $('input[name="content_source"][value="' + urlContentSource + '"]').prop('checked', true);
        // 触发视觉更新
        $('.source-option-card input[type="radio"]').prop('checked', false);
        $('.source-option-card[data-source="' + urlContentSource + '"] input[type="radio"]').prop('checked', true);
    }
    
    // 初始化时根据选择加载内容字段
    var defaultSource = $('input[name="content_source"]:checked').val() || 'topic';
    console.log("defaultSource:"+defaultSource)
    loadContentFields(defaultSource);

    // 初始化时根据默认模式显示内容
    var defaultMode = $('input[name="content_mode"]:checked').val() || 'source';
    if (defaultMode === 'source') {
        $('.content-source-tab').show();
        $('.custom-content-tab').hide();
    } else {
        $('.content-source-tab').hide();
        $('.custom-content-tab').show();
    }

    // 声音设置切换功能
    function toggleVoiceSettings() {
        var voiceCreateType = $('#voice_create_type').val();
        if (voiceCreateType === 'edge') {
            $('#voice-name-trigger').show();
            $('#voice-model-trigger').hide();
            $('#voice_type').closest('label').hide();
        } else {
            $('#voice-name-trigger').hide();
            $('#voice-model-trigger').show();
            $('#voice_type').closest('label').show();
        }
    }

    // 绑定声音类型选择变化事件
    $('#voice_create_type').on('change', function() {
        toggleVoiceSettings();
    });

    // 初始化声音设置显示状态
    toggleVoiceSettings();

    // 表单提交处理
    $('#video-gen-form').on('submit', function(e) {
        e.preventDefault();
        console.log('Form submitted'); // 添加日志

        // 前端验证：如果内容来源是链接地址，必须包含有效的链接
        var contentMode = $('input[name="content_mode"]:checked').val();
        var contentSource = $('input[name="content_source"]:checked').val();
        if (contentMode === 'source' && contentSource === 'link') {
            var linkAddress = $('#link_address').val().trim();
            if (!linkAddress) {
                showErrorModal('请填写链接地址');
                return false;
            }
            if (!/https?:\/\/[^\s]+/.test(linkAddress)) {
                showErrorModal('未找到有效的链接地址');
                return false;
            }
        }

        // 禁用提交按钮
        $('#submit, #fixed-submit').prop('disabled', true);
        $('#submit').val('生成中...');

        // 获取表单数据
        var formData = $(this).serialize();

        // 发送AJAX请求
        $.ajax({
            url: videoGenAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'video_gen_ajax_submit',
                nonce: videoGenAjax.nonce,
                form_data: formData
            },
            success: function(response) {
                console.log('Ajax response:', response); // 添加日志
                if (response.success) {
                    showSuccessModal(response.data.redirect_url, response.data.qr_code_url);
                } else {
                    if (response.data && response.data.code === 'gate_blocked' && window.MembershipGateFrontend) {
                        MembershipGateFrontend.handleBlock(response.data);
                    } else {
                        showErrorModal(response.data.message);
                    }
                }
            },
            error: function(xhr, status, error) {
                console.log('Ajax error:', error); // 添加日志
                showErrorModal('请求失败，请重试');
            },
            complete: function() {
                // 重新启用提交按钮
                $('#submit, #fixed-submit').prop('disabled', false);
                $('#submit').val('开始生成');
            }
        });
    });

    // 滑块值实时更新
    $('.range-slider input[type="range"]').on('input', function() {
        $(this).next('.range-value').text($(this).val());
    });

    // 处理背景颜色透明选项
    $('#transparent_bg').change(function() {
        var colorInput = $('input[name="text_background_color"]');
        if ($(this).is(':checked')) {
            colorInput.data('previous-color', colorInput.val());
            colorInput.val('transparent');
            colorInput.prop('disabled', true);
        } else {
            colorInput.val(colorInput.data('previous-color') || '#000000');
            colorInput.prop('disabled', false);
        }
    });

    // 成功提示弹窗
    window.showSuccessModal = function(redirectUrl, qrCodeUrl) {
        console.log('Showing success modal'); // 添加日志
        
        // 先移除所有已存在的模态框
        $('.custom-modal').remove();
        
        var modalHtml = `
            <div id="custom-modal" class="custom-modal">
                <div class="modal-content">
                    <h5>任务提交成功</h5>
                    <p>视频生成任务已提交，请耐心等待生成。</p>
                    <button type="button" id="stay-on-page" class="button">留在当前页面</button>
                    <button type="button" id="view-generation" class="button button-primary">查看生成进度</button>
                </div>
            </div>
        `;

        $('body').append(modalHtml);

        // 绑定按钮事件
        $('#stay-on-page').on('click', function() {
            console.log('Stay button clicked'); // 添加日志
            $('#custom-modal').fadeOut(function() {
                $(this).remove();
            });
        });

        $('#view-generation').on('click', function() {
            console.log('View button clicked'); // 添加日志
            window.location.href = redirectUrl;
        });
    };

    // 错误提示弹窗
    window.showErrorModal = function(message) {
        console.log('Showing error modal'); // 添加日志
        
        // 先移除所有已存在的模态框
        $('.custom-modal').remove();
        
        var modalHtml = `
            <div id="custom-modal" class="custom-modal error">
                <div class="modal-content">
                    <h5>提交失败</h5>
                    <p>${message}</p>
                    <button type="button" id="close-modal" class="button">确定</button>
                </div>
            </div>
        `;

        $('body').append(modalHtml);

        // 绑定按钮事件
        $('#close-modal').on('click', function() {
            console.log('Close button clicked'); // 添加日志
            $('#custom-modal').fadeOut(function() {
                $(this).remove();
            });
        });
    };

    // VideoGenAdmin 命名空间函数
    VideoGenAdmin.resubmitRecord = function(recordId, redirectPage, $button) {
        var $row = $button.closest('tr');
        var originalText = $button.text();
        $button.prop('disabled', true).text('提交中...');
        
        $.ajax({
            url: videoGenAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'video_gen_resubmit',
                record_id: recordId,
                nonce: videoGenAjax.nonce
            },
            dataType: 'json',
            timeout: 30000,
            success: function(response) {
                if (response.success) {
                    // 更新状态列显示
                    $row.find('.column-status').html('<span class="status-badge waiting">排队中</span>');
                    
                    // 更新时间列 - 清空生成时间
                    var $timeCol = $row.find('.column-time');
                    var createTime = $timeCol.find('div:first').text();
                    $timeCol.html('<div>' + createTime + '</div><div>生成：-</div>');
                    
                    // 如果没有取消按钮，添加取消按钮
                    var $actionsCol = $row.find('.column-actions');
                    var hasCancelBtn = $actionsCol.find('.cancel-generation').length > 0;
                    if (!hasCancelBtn) {
                        var $regenerateBtn = $actionsCol.find('.dh-action-btn.generate').first();
                        $regenerateBtn.after('<a href="javascript:void(0);" class="dh-action-btn cancel cancel-generation" data-id="' + recordId + '">取消生成</a>');
                    }
                    
                    // 显示成功提示
                    showNotification('success', '重新提交成功');
                } else {
                    alert('重新提交失败：' + (response.data || '未知错误'));
                }
            },
            error: function(xhr, status, error) {
                console.error('Video Gen AJAX Error:', error);
                alert('请求失败，请稍后重试');
            },
            complete: function() {
                // 无论成功失败，都恢复按钮状态
                $button.prop('disabled', false).text(originalText);
            }
        });
    };

    // VideoGenAdmin 列表页面相关功能
    VideoGenAdmin.initListPage = function() {
        // 检查clipboard.js是否已加载，如果没有则加载
        if (typeof ClipboardJS === 'undefined') {
            var script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/clipboard@2.0.8/dist/clipboard.min.js';
            script.onload = VideoGenAdmin.initClipboard;
            document.head.appendChild(script);
        } else {
            VideoGenAdmin.initClipboard();
        }
        
        // 初始化查看详情按钮事件
        VideoGenAdmin.initViewDetailsButtons();
    };

    // 初始化复制功能
    VideoGenAdmin.initClipboard = function() {
        if (typeof ClipboardJS === 'undefined') return;
        
        var clipboard = new ClipboardJS('.copy-btn');
        
        clipboard.on('success', function(e) {
            var btn = $(e.trigger);
            var originalText = btn.text();
            btn.text('已复制!');
            setTimeout(function() {
                btn.text(originalText);
            }, 1500);
            e.clearSelection();
        });
        
        clipboard.on('error', function(e) {
            var btn = $(e.trigger);
            btn.text('复制失败!');
            setTimeout(function() {
                btn.text('复制');
            }, 1500);
        });
    };

    // 初始化查看详情按钮（ajax方式）
    VideoGenAdmin.initViewDetailsButtons = function() {
        $(document).on('click', '.view-details-btn', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            var $button = $(this);
            var scrollTop = $(window).scrollTop();
            var id = $button.data('id');
            
            // 移除已存在的弹窗
            $('#dynamic-publish-modal').remove();
            
            // 创建加载中的弹层
            var modalHtml = `
                <div id="dynamic-publish-modal" class="publish-modal modern-modal" style="display:none;">
                    <div class="modal-backdrop"></div>
                    <div class="publish-modal-content modern-modal-content">
                        <div class="modal-header">
                            <h3>📋 发布信息与视频详情</h3>
                            <button type="button" class="close-modal" aria-label="关闭">&times;</button>
                        </div>
                        <div class="modal-body" id="dynamic-publish-modal-body">
                            <div class="video-gen-modal-loading" style="text-align:center;padding:30px;">
                                <span>⏳ 加载中...</span>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // 添加到页面并显示
            $('body').append(modalHtml);
            $('#dynamic-publish-modal').fadeIn(300);
            
            // 绑定关闭事件
            $('#dynamic-publish-modal .close-modal, #dynamic-publish-modal .modal-backdrop').on('click', function() {
                VideoGenAdmin.closeDynamicModal(scrollTop);
            });
            
            // ESC键关闭
            $(document).on('keyup.modal', function(e) {
                if (e.keyCode === 27) {
                    VideoGenAdmin.closeDynamicModal(scrollTop);
                    $(document).off('keyup.modal');
                }
            });
            
            // 通过ajax获取详情数据
            $.ajax({
                url: videoGenAjax.ajaxurl,
                type: 'POST',
                data: {
                    action: 'get_video_content',
                    nonce: videoGenAjax.nonce,
                    id: id
                },
                success: function(response) {
                    if (response.success) {
                        var data = response.data;
                        var title = data.publish_title || '-';
                        var desc = data.publish_desc || '-';
                        var videoContent = data.video_content || '';
                        var contentSourceInfo = data.content_source_info || '-';
                        var createTime = data.create_time || '-';
                        var genTime = data.gen_time || '-';
                        
                        var bodyHtml = `
                            <div class="publish-detail-item video-section">
                                <div class="detail-label">🎬 视频</div>
                                <div class="video-content-wrapper">
                                    ${videoContent}
                                </div>
                            </div>
                            <div class="publish-detail-item">
                                <div class="detail-label">📝 标题</div>
                                <div class="detail-content">
                                    <div class="content-display" id="dynamic-publish-title">${title}</div>
                                    <button type="button" class="copy-btn modern-copy-btn" data-clipboard-target="#dynamic-publish-title">
                                        📋 复制
                                    </button>
                                </div>
                            </div>
                            <div class="publish-detail-item">
                                <div class="detail-label">📄 描述</div>
                                <div class="detail-content">
                                    <div class="content-display" id="dynamic-publish-desc">${desc}</div>
                                    <button type="button" class="copy-btn modern-copy-btn" data-clipboard-target="#dynamic-publish-desc">
                                        📋 复制
                                    </button>
                                </div>
                            </div>
                            <div class="publish-detail-item">
                                <div class="detail-label">📌 内容来源</div>
                                <div class="detail-content">
                                    <div class="content-display">${contentSourceInfo}</div>
                                </div>
                            </div>
                            <div class="publish-detail-item">
                                <div class="detail-label">🕐 时间</div>
                                <div class="detail-content">
                                    <div class="content-display">提交：${createTime}<br>生成：${genTime}</div>
                                </div>
                            </div>
                        `;
                        
                        $('#dynamic-publish-modal-body').html(bodyHtml);
                        
                        // 重新初始化复制功能
                        VideoGenAdmin.initClipboard();
                    } else {
                        $('#dynamic-publish-modal-body').html(
                            '<div style="text-align:center;padding:30px;color:#d63638;">❌ ' + (response.data || '加载失败') + '</div>'
                        );
                    }
                },
                error: function() {
                    $('#dynamic-publish-modal-body').html(
                        '<div style="text-align:center;padding:30px;color:#d63638;">❌ 网络错误，请重试</div>'
                    );
                }
            });
        });
    };

    // 关闭动态弹窗
    VideoGenAdmin.closeDynamicModal = function(scrollTop) {
        $('#dynamic-publish-modal').fadeOut(300, function() {
            $(this).remove();
            $(window).scrollTop(scrollTop);
            $(document).off('keyup.modal');
        });
    };

    // 列表页面功能初始化
    if ($('.video-gen-records-wrap').length || $('.view-details-btn').length) {
        // 确保只初始化一次
        if (!VideoGenAdmin.listPageInitialized) {
            VideoGenAdmin.initListPage();
            VideoGenAdmin.listPageInitialized = true;
        }
    }

    // 使用状态下拉框变更处理
    $(document).on('change', '.use-status-select', function() {
        var recordId = $(this).data('id');
        var newStatus = $(this).val();
        var $this = $(this);
        
        // 记录原始值以便恢复
        if (!$this.data('original-value')) {
            $this.data('original-value', $this.val());
        }
        
        $.ajax({
            url: videoGenAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'update_video_use_status',
                record_id: recordId,
                use_status: newStatus,
                nonce: videoGenAjax.nonce
            },
            success: function(response) {
                if (response.success) {
                    // 可以在这里添加成功提示
                    console.log('使用状态更新成功');
                } else {
                    alert('更新失败：' + (response.data || '未知错误'));
                    // 恢复原来的值
                    $this.val($this.data('original-value') || '0');
                }
            },
            error: function() {
                alert('网络错误，更新失败');
                // 恢复原来的值
                $this.val($this.data('original-value') || '0');
            }
        });
    });
    
    // 编辑备注图标点击处理
    $(document).on('click', '.edit-remark-icon', function() {
        var recordId = $(this).data('id');
        var currentRemark = $(this).data('remark');
        
        // 创建模态框
        var modalHtml = '<div id="edit-remark-modal" class="video-gen-modal">' +
            '<div class="modal-content">' +
            '<div class="modal-header">' +
            '<h3>修改用户备注</h3>' +
            '<span class="modal-close">&times;</span>' +
            '</div>' +
            '<div class="modal-body">' +
            '<textarea id="remark-textarea" placeholder="请输入备注信息..." maxlength="500">' + currentRemark + '</textarea>' +
            '<div class="char-count"><span id="char-count">0</span>/500</div>' +
            '</div>' +
            '<div class="modal-footer">' +
            '<button type="button" class="btn btn-cancel">取消</button>' +
            '<button type="button" class="btn btn-submit" data-id="' + recordId + '">提交</button>' +
            '</div>' +
            '</div>' +
            '</div>';
        
        // 移除已存在的模态框
        $('#edit-remark-modal').remove();
        
        // 添加模态框到页面
        $('body').append(modalHtml);
        
        // 显示模态框
        $('#edit-remark-modal').fadeIn();
        
        // 初始化字符计数
        updateCharCount();
        
        // 聚焦到文本框
        $('#remark-textarea').focus();
    });
    
    // 模态框关闭处理
    $(document).on('click', '.modal-close, .btn-cancel', function() {
        $('#edit-remark-modal').fadeOut(function() {
            $(this).remove();
        });
    });
    
    // 点击模态框外部关闭
    $(document).on('click', '#edit-remark-modal', function(e) {
        if (e.target === this) {
            $(this).fadeOut(function() {
                $(this).remove();
            });
        }
    });
    
    // ESC键关闭模态框
    $(document).on('keydown', function(e) {
        if (e.keyCode === 27 && $('#edit-remark-modal').is(':visible')) {
            $('#edit-remark-modal').fadeOut(function() {
                $(this).remove();
            });
        }
    });
    
    // 文本框字符计数
    $(document).on('input', '#remark-textarea', updateCharCount);
    
    function updateCharCount() {
        var count = $('#remark-textarea').val().length;
        $('#char-count').text(count);
        
        if (count > 500) {
            $('#char-count').css('color', '#d63638');
        } else {
            $('#char-count').css('color', '#646970');
        }
    }
    
    // 提交备注修改
    $(document).on('click', '.btn-submit', function() {
        var recordId = $(this).data('id');
        var newRemark = $('#remark-textarea').val();
        var $button = $(this);
        
        if (newRemark.length > 500) {
            alert('备注信息不能超过500个字符');
            return;
        }
        
        $button.prop('disabled', true).text('提交中...');
        
        $.ajax({
            url: videoGenAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'update_video_user_remark',
                record_id: recordId,
                user_remark: newRemark,
                nonce: videoGenAjax.nonce
            },
            success: function(response) {
                if (response.success) {
                    // 关闭模态框
                    $('#edit-remark-modal').fadeOut(function() {
                        $(this).remove();
                    });
                    
                    // 更新页面显示
                    var $remarkText = $('.edit-remark-icon[data-id="' + recordId + '"]').siblings('.user-remark-text');
                    var displayText = newRemark ? newRemark : '无备注';
                    $remarkText.text(displayText);
                    
                    // 更新data-remark属性
                    $('.edit-remark-icon[data-id="' + recordId + '"]').data('remark', newRemark);
                    $('.edit-remark-icon[data-id="' + recordId + '"]').attr('data-remark', newRemark);
                    
                } else {
                    alert('更新失败：' + (response.data || '未知错误'));
                }
            },
            error: function() {
                alert('网络错误，更新失败');
            },
            complete: function() {
                $button.prop('disabled', false).text('提交');
            }
        });
    });

    // 获取随机话题函数
    function getRandomTopic() {
        // 尝试使用备用API endpoint
        $.ajax({
            url: window.location.origin + '/wp-json/hot-topics/v1/random-topic',
            type: 'POST',
            data: {
                time_filter: 'day',
                sort_by: 'degree',
                sort_order: 'desc',
                status: 1
            },
            success: function(response) {
                if (response && response.topic_name) {
                    $('#topic').val(response.topic_name);
                } else {
                    alert('暂无可用话题，请手动输入');
                }
            },
            error: function() {
                alert('获取随机话题失败，请稍后重试');
            }
        });
    }

    // ==================== 固定底部按钮和24小时限制功能 ====================
    
    // 检查是否在视频生成页面
    if ($('#video-gen-form').length) {
        
        // 创建固定底部提交栏
        var createFixedSubmitBar = function() {
            // 检查是否已存在
            if ($('.fixed-submit-bar').length) return;

            var barHtml = `
                <div class="fixed-submit-bar" id="fixed-submit-bar">
                    <div class="fixed-submit-content">
                        <div class="fixed-submit-tip">
                            <span id="submit-count-tip">填写完成后点击提交</span>
                        </div>
                        <input type="button" name="submit" id="fixed-submit" class="page-title-action btn-add-new" value="开始生成">
                    </div>
                </div>
            `;
            $('body').append(barHtml);
        }
        
        // 创建超出限制弹窗
        var createLimitModal = function() {
            // 检查是否已存在
            if ($('.limit-exceeded-modal').length) return;
            
            var modalHtml = `
                <div class="limit-exceeded-modal" id="limit-exceeded-modal" style="display: none;">
                    <div class="modal-content">
                        <span class="modal-icon">🚫</span>
                        <h3>任务已达上限</h3>
                        <p>今日已达视频生成任务上限</p>
                        <div class="limit-info">
                            <div>您当日已提交：<strong id="used-count">0</strong> 条</div>
                            <div class="limit-timer" id="reset-timer"></div>
                        </div>
                        <button type="button" id="limit-modal-close" class="button button-primary">我知道了</button>
                    </div>
                </div>
            `;
            $('body').append(modalHtml);
        }
        
        // 显示固定底部栏
        var showFixedBar = function() {
            if (!$('.fixed-submit-bar').length) {
                createFixedSubmitBar();
            }
            $('.fixed-submit-bar').addClass('show');
            updateFixedBarPosition();
        }
        
        // 隐藏固定底部栏
        var hideFixedBar = function() {
            $('.fixed-submit-bar').removeClass('show');
        }
        
        // 更新固定栏位置（考虑wp-adminfooter）
        var updateFixedBarPosition = function() {
            var footerHeight = $('#wpfooter').outerHeight() || 0;
            $('.fixed-submit-bar').css('bottom', footerHeight + 'px');
        }
        
        // 检查用户提交次数限制
        var checkSubmitLimit = function() {
            return $.ajax({
                url: videoGenAjax.ajaxurl,
                type: 'POST',
                data: {
                    action: 'video_gen_check_limit',
                    nonce: videoGenAjax.nonce
                },
                dataType: 'json'
            });
        }
        
        // 显示超出限制弹窗
        var showLimitExceededModal = function(usedCount, nextResetTime) {
            createLimitModal();
            
            $('#used-count').text(usedCount);
            
            // 计算距离重置的时间
            if (nextResetTime) {
                updateResetTimer(nextResetTime);
            }
            
            $('#limit-exceeded-modal').fadeIn(300);
            
            // 绑定关闭按钮事件
            $('#limit-modal-close').on('click', function() {
                $('#limit-exceeded-modal').fadeOut(300);
            });
            
            // 点击遮罩关闭
            $('#limit-exceeded-modal').on('click', function(e) {
                if ($(e.target).is('#limit-exceeded-modal')) {
                    $(this).fadeOut(300);
                }
            });
        }
        
        // 更新重置计时器
        var updateResetTimer = function(nextResetTime) {
            function update() {
                var now = new Date().getTime();
                var distance = nextResetTime - now;
                
                if (distance < 0) {
                    $('#reset-timer').text('');
                    return;
                }
                
                var hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                var minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
                var seconds = Math.floor((distance % (1000 * 60)) / 1000);
                
                $('#reset-timer').text('距离重置还剩: ' + hours + '小时' + minutes + '分' + seconds + '秒');
            }
            
            update();
            setInterval(update, 1000);
        }
        
        // 页面滚动时控制固定栏显示
        var lastScrollTop = 0;
        var scrollTimeout = null;
        
        $(window).on('scroll', function() {
            var scrollTop = $(this).scrollTop();
            var formHeight = $('#video-gen-form').offset().top;
            var formBottom = formHeight + $('#video-gen-form').outerHeight();
            var viewportHeight = $(window).height();
            
            clearTimeout(scrollTimeout);
            
            // 如果滚动到表单底部附近，显示固定栏
            if (scrollTop + viewportHeight >= formBottom - 100) {
                showFixedBar();
            } else if (scrollTop > lastScrollTop && scrollTop + viewportHeight < formBottom - 200) {
                // 向上滚动且不在底部区域，隐藏固定栏
                hideFixedBar();
            }
            
            lastScrollTop = scrollTop;
        });
        
        // 页面加载时检查限制并显示/隐藏固定栏
        checkSubmitLimit().done(function(response) {
            if (response.success) {
                var data = response.data;
                
                if (data.is_limited && !data.is_admin) {
                    // 用户受限
                    if (data.remaining <= 0) {
                        // 已达到上限，显示弹窗
                        showLimitExceededModal(data.used, data.next_reset_time);
                        // 禁用提交按钮
                        $('#submit, #fixed-submit').prop('disabled', true);
                        $('#submit-count-tip').text('今日提交次数已用完');
                    } else {
                        // 未达到上限，显示剩余次数
                        $('#submit-count-tip').text('今日剩余提交次数: ' + data.remaining + '/3');
                    }
                    
                    // 初始检查是否需要显示固定栏
                    setTimeout(function() {
                        var scrollTop = $(window).scrollTop();
                        var formBottom = $('#video-gen-form').offset().top + $('#video-gen-form').outerHeight();
                        var viewportHeight = $(window).height();
                        
                        if (scrollTop + viewportHeight >= formBottom - 100) {
                            showFixedBar();
                        }
                    }, 500);
                }
            }
        });
        
        // 固定提交按钮点击事件
        $(document).on('click', '#fixed-submit', function(e) {
            e.preventDefault();
            
            var $btn = $(this);
            
            // 检查是否已禁用
            if ($btn.prop('disabled')) {
                // 显示限制弹窗
                checkSubmitLimit().done(function(response) {
                    if (response.success && response.data.is_limited && response.data.remaining <= 0) {
                        showLimitExceededModal(response.data.used, response.data.next_reset_time);
                    }
                });
                return;
            }
            
            // 触发原始表单提交
            $('#video-gen-form').trigger('submit');
        });
        
        // 同步两个提交按钮的状态
        $('#submit').on('change', function() {
            var disabled = $(this).prop('disabled');
            $('#fixed-submit').prop('disabled', disabled);
        });
        
        // 窗口大小变化时更新位置
        $(window).on('resize', function() {
            updateFixedBarPosition();
        });
    }

    // ==================== 固定底部按钮功能结束 ====================

    // 标记为已初始化
    VideoGenAdmin.initialized = true;
});
