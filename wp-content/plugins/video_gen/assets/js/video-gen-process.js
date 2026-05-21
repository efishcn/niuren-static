jQuery(document).ready(function($) {
    'use strict';

    // 全局通知函数（与 video-gen.js 保持一致）
    if (typeof window.showNotification !== 'function') {
        window.showNotification = function(type, message) {
            var $notification = $('<div class="video-gen-notification ' + type + '">' + message + '</div>');
            $('body').append($notification);
            setTimeout(function() { $notification.addClass('show'); }, 100);
            setTimeout(function() {
                $notification.removeClass('show');
                setTimeout(function() { $notification.remove(); }, 300);
            }, 4000);
        };
    }

    // ========== 懒加载缓存（与 video-gen.js 保持一致） ==========
    var lazyCache = {};
    function fetchLazyData(resource, params) {
        var cacheKey = resource + '_' + JSON.stringify(params || {});
        if (lazyCache[cacheKey]) {
            return $.Deferred().resolve(lazyCache[cacheKey].slice()).promise();
        }
        var actionMap = {
            'bgm': 'video_gen_get_bgm_list'
        };
        var action = actionMap[resource] || ('video_gen_get_' + resource);
        return $.ajax({
            url: videoGenProcessAjax.ajaxurl,
            type: 'POST',
            data: {
                action: action,
                nonce: videoGenProcessAjax.nonce,
                params: params || {}
            }
        }).then(function(response) {
            if (response.success) {
                lazyCache[cacheKey] = response.data.slice();
                return response.data;
            }
            return [];
        });
    }

    // ========== BGM 懒加载（与 video-gen.js 保持一致） ==========
    $(document).on('click focus', 'select[data-lazy-resource="bgm"]', function() {
        var $select = $(this);
        if ($select.data('lazy-loaded')) return;

        fetchLazyData('bgm').then(function(items) {
            var currentVal = $select.data('current-value') || $select.val();
            var currentUrl = $select.data('current-url') || '';
            $select.empty();
            $.each(items, function(i, m) {
                var $option = $('<option>').val(m.file_name).text(m.title).attr('data-url', m.file_url);
                if (m.file_name == currentVal || m.file_url == currentUrl) $option.prop('selected', true);
                $select.append($option);
            });
            $select.data('lazy-loaded', true).trigger('change');
        });
    });

    // ========== 开关联动显示条件区域 ==========
    $('.toggle-switch').on('change', function() {
        var target = $(this).data('target');
        if (target) {
            $('#' + target).toggle(this.checked);
            if (target === 'clip-options' && !this.checked) {
                $('#pip-options, #split-options').hide();
            }
        }
    });

    // 音乐开关联动
    $('#auto-music-checkbox').on('change', function() {
        $('#music-settings-panel').toggle(this.checked);
    });

    // ========== 高级设置折叠（与 video-gen.js 保持一致） ==========
    $('#advanced-settings-toggle').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var $header = $(this);
        var $content = $('#advanced-settings-content');
        var $icon = $header.find('.toggle-icon');
        if ($header.hasClass('expanded')) {
            $content.slideUp(300, function() { $header.removeClass('expanded'); });
            $icon.css('transform', 'rotate(0deg)');
        } else {
            $content.slideDown(300, function() { $header.addClass('expanded'); });
            $icon.css('transform', 'rotate(180deg)');
        }
    });

    // ========== 透明背景复选框（与 video-gen.js 保持一致） ==========
    $('#transparent_bg').on('change', function() {
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

    // ========== 展现模式联动 PIP/分屏选项 ==========
    function updateClipModeOptions() {
        var mode = $('#clip-mode').val();
        $('#pip-options').toggle(mode === 'pip_clip' || mode === 'pip_digital');
        $('#split-options').toggle(mode === 'split');
    }
    // 初始状态（默认 digital_overlay，不显示 PIP/分屏）
    updateClipModeOptions();
    $('#clip-mode').on('change', updateClipModeOptions);

    // ========== Range 滑块值显示 ==========
    $('.range-slider input[type="range"]').on('input', function() {
        $(this).next('.range-value').text($(this).val());
    });

    // ========== WordPress 媒体上传器 ==========
    $('.media-upload-btn').on('click', function(e) {
        e.preventDefault();
        var target = $(this).data('target');
        var mediaUploader = wp.media({
            title: '选择视频文件',
            button: { text: '选择' },
            library: { type: 'video' },
            multiple: false,
        });

        mediaUploader.on('select', function() {
            var attachment = mediaUploader.state().get('selection').first().toJSON();
            $('#' + target).val(attachment.url);
        });

        mediaUploader.open();
    });

    // ========== 音频预览（与 video-gen.js 保持一致） ==========
    var currentAudio = null;
    var currentAudioBtn = null;

    function stopPreviewAudio() {
        var player = $('#audio-preview-player')[0];
        if (player) {
            player.pause();
            player.currentTime = 0;
        }
        if (currentAudioBtn) {
            currentAudioBtn.find('.dashicons').removeClass('dashicons-controls-pause').addClass('dashicons-controls-play');
        }
        currentAudio = null;
        currentAudioBtn = null;
    }

    function playPreviewAudio(url, $btn) {
        stopPreviewAudio();
        var $player = $('#audio-preview-player');
        var $container = $('#audio-preview-container');

        $player.find('source').attr('src', url);
        $player[0].load();
        $player[0].play();

        $btn.find('.dashicons').removeClass('dashicons-controls-play').addClass('dashicons-controls-pause');

        currentAudio = url;
        currentAudioBtn = $btn;
        $container.show();
    }

    $(document).on('click', '.preview-audio', function(e) {
        e.preventDefault();
        var $btn = $(this);
        var type = $btn.data('type');

        if (currentAudio && currentAudioBtn && currentAudioBtn[0] === $btn[0]) {
            stopPreviewAudio();
            $('#audio-preview-container').hide();
            return;
        }

        var url = '';
        if (type === 'bgm') {
            var $select = $('#bgm_file');
            url = $select.find('option:selected').data('url') || '';
        }

        if (url) {
            playPreviewAudio(url, $btn);
        } else {
            showNotification('error', '无法获取音频文件');
        }
    });

    $('#audio-preview-player').on('ended', function() {
        stopPreviewAudio();
    });

    // 点击播放器外部关闭
    $(document).on('click', function(e) {
        if (!$(e.target).closest('#audio-preview-container').length && !$(e.target).closest('.preview-audio').length) {
            if ($('#audio-preview-container').is(':visible')) {
                stopPreviewAudio();
                $('#audio-preview-container').hide();
            }
        }
    });

    // ========== 浮动提交按钮（与 video-gen.js 一致） ==========
    var lastScrollTop = 0;
    var $fixedBar = $('#fixed-submit');
    var $form = $('#video-gen-form');
    var $submitBtn = $('#fixed-submit');

    function showFixedBar() {
        $fixedBar.css({
            'opacity': '1',
            'visibility': 'visible',
            'pointer-events': 'auto',
            'transform': 'translateY(0)'
        });
    }

    function hideFixedBar() {
        $fixedBar.css({
            'opacity': '0',
            'visibility': 'hidden',
            'pointer-events': 'none',
            'transform': 'translateY(20px)'
        });
    }

    // 初始显示，滚动到底部时自动隐藏
    showFixedBar();

    $(window).on('scroll', function() {
        var scrollTop = $(this).scrollTop();
        var formBottom = $form.offset().top + $form.outerHeight();
        var viewportHeight = $(window).height();

        if (scrollTop + viewportHeight >= formBottom - 100) {
            hideFixedBar();
        } else if (scrollTop < lastScrollTop) {
            showFixedBar();
        } else if (scrollTop + viewportHeight < formBottom - 200) {
            showFixedBar();
        }
        lastScrollTop = scrollTop;
    });

    // ========== 表单提交 ==========
    function doSubmit() {
        if ($submitBtn.prop('disabled')) return;

        // 验证源视频
        if (!$('#source-video-path').val()) {
            showNotification('error', '请选择需要处理的源视频');
            return;
        }

        var $btn = $('#fixed-submit');
        var originalHtml = $btn.html();
        $btn.prop('disabled', true).find('.btn-text').text('提交中...');

        var formData = $('#video-gen-form').serialize();

        $.ajax({
            url: videoGenProcessAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'video_gen_process_ajax_submit',
                form_data: formData,
                nonce: videoGenProcessAjax.nonce,
            },
            success: function(response) {
                if (response.success) {
                    showNotification('success', response.data.message || '视频处理任务已创建');
                    setTimeout(function() {
                        window.location.href = videoGenProcessAjax.records_url;
                    }, 1500);
                } else {
                    var msg = response.data && response.data.message ? response.data.message : '提交失败';
                    showNotification('error', msg);
                }
            },
            error: function() {
                showNotification('error', '请求失败，请重试');
            },
            complete: function() {
                $btn.prop('disabled', false).html(originalHtml);
            }
        });
    }

    // 浮动按钮点击
    $(document).on('click', '#fixed-submit', function(e) {
        e.preventDefault();
        doSubmit();
    });

    // 回车键快速提交 (Ctrl+Enter)
    $(document).on('keydown', function(e) {
        if (e.ctrlKey && e.keyCode === 13) {
            e.preventDefault();
            doSubmit();
        }
    });

    // ========== 列表页：查看详情 ==========
    $(document).on('click', '.view-process-detail', function(e) {
        e.preventDefault();
        var recordId = $(this).data('id');

        $.ajax({
            url: videoGenProcessAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'video_gen_get_process_result',
                id: recordId,
                nonce: videoGenProcessAjax.nonce,
            },
            success: function(response) {
                if (response.success) {
                    $('#process-detail-body').html(response.data.content);
                    $('#process-detail-modal').show();
                } else {
                    showNotification('error', response.data || '获取失败');
                }
            }
        });
    });

    // 关闭弹窗
    $(document).on('click', '.modal-close, .modal-overlay', function() {
        $('#process-detail-modal').hide();
    });
});
