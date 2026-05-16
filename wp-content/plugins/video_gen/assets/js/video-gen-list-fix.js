jQuery(document).ready(function($) {
    'use strict';
    
    // 创建独立命名空间避免与content_gen冲突
    window.VideoGenAdmin = window.VideoGenAdmin || {
        initialized: false,
        listPageInitialized: false
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
        var redirectPage = $button.data('redirect') || 'video-records';
        
        if (!recordId) {
            alert('记录ID不能为空');
            return;
        }
        
        if (!confirm('确定要重新提交这个任务吗？')) {
            return;
        }
        
        VideoGenAdmin.resubmitRecord(recordId, redirectPage, $button);
    });

    // 移除可能导致布局问题的动画效果
    // $('.video-card').each(function(index) {
    //     $(this).css({
    //         'opacity': '0',
    //         'transform': 'translateY(20px)'
    //     }).delay(index * 100).animate({
    //         'opacity': '1'
    //     }, 600, function() {
    //         $(this).css('transform', 'translateY(0)');
    //     });
    // });

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
        loadContentFields(sourceValue);
    });

    // 高级设置折叠展开功能（修复版）
    $('#advanced-settings-toggle').off('click').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();

        const $header = $(this);
        const $content = $('#advanced-settings-content');
        const $icon = $header.find('.toggle-icon');

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

    // 平台选择弹窗函数
    function showPlatformModal() {
        $('#platform-modal').remove();
        
        var platformOptions = [];
        
        if (typeof videoPlatformOptions !== 'undefined' && videoPlatformOptions.length > 0) {
            videoPlatformOptions.forEach(function(option) {
                platformOptions.push({
                    code: option.platform_code,
                    name: option.platform_name
                });
            });
        } else {
            platformOptions = [
                { code: 'douyin', name: '抖音' },
                { code: 'kuaishou', name: '快手' },
                { code: 'xiaohongshu', name: '小红书' },
                { code: 'bilibili', name: '哔哩哔哩' }
            ];
        }

        var modalHtml = '<div id="platform-modal" class="platform-modal-overlay">' +
            '<div class="modal-content">' +
            '<div class="modal-header">' +
            '<h2>选择目标平台</h2>' +
            '<span class="modal-close">&times;</span>' +
            '</div>' +
            '<div class="platform-options">';
        
        platformOptions.forEach(function(option) {
            modalHtml += '<div class="platform-option" data-platform="' + option.code + '">' +
                option.name +
                '</div>';
        });
        
        modalHtml += '</div></div></div>';

        $('body').append(modalHtml);
        $('#platform-modal').fadeIn(300);

        $('.modal-close').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            closePlatformModal();
        });

        $('.platform-option').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            var selectedPlatform = $(this).data('platform');
            var selectedPlatformName = $(this).text();
            $('.platform-name').text(selectedPlatformName);
            $('#platform').val(selectedPlatform);
            closePlatformModal();
        });

        $('#platform-modal').on('click', function(e) {
            if ($(e.target).is('#platform-modal')) {
                closePlatformModal();
            }
        });

        $(document).on('keydown.platform-modal', function(e) {
            if (e.keyCode === 27) {
                closePlatformModal();
            }
        });
    }

    // 关闭平台选择弹窗
    function closePlatformModal() {
        $('#platform-modal').fadeOut(300, function() {
            $(this).remove();
            $(document).off('keydown.platform-modal');
        });
    }

    // 内容字段动态加载函数
    function loadContentFields(sourceType) {
        var fields1 = '';
        var fields2 = '';
        
        var urlParams = new URLSearchParams(window.location.search);
        
        var linkAddressValue = urlParams.get('link_address') || (window.videoGenFormData && window.videoGenFormData.link_address ? window.videoGenFormData.link_address : '');
        var topicValue = urlParams.get('topic') || (window.videoGenFormData && window.videoGenFormData.topic ? window.videoGenFormData.topic : '');
        var articleTitleValue = window.videoGenFormData && window.videoGenFormData.article_title ? window.videoGenFormData.article_title : '';
        var articleContentValue = window.videoGenFormData && window.videoGenFormData.article_content ? window.videoGenFormData.article_content : '';
        
        if (sourceType === 'link') {
            fields1 = '<th scope="row"><label for="link_address">链接地址:</label></th>' +
                     '<td><input type="text" id="link_address" name="link_address" class="regular-text" placeholder="请输入链接地址" value="' + linkAddressValue + '">' +
                     '<p class="description">支持公众号、头条、微头条、网易号、搜狐号和小红书的PC链接地址，您可以去<a href="admin.php?page=hot-articles-viewer">【爆文中心】</a>获取最新爆文链接</p></td>';
        } else if (sourceType === 'topic') {
            fields1 = '<th scope="row"><label for="topic">话题:</label></th>' +
                     '<td><input type="text" id="topic" name="topic" class="regular-text" placeholder="请输入感兴趣的话题" value="' + topicValue + '">' +
                     '<p class="description">输入您感兴趣的话题，AI将为您生成相关内容, 去<a href="admin.php?page=hot-topics-viewer">【话题中心】</a>获取最新爆款话题</p></td>';
        } else if (sourceType === 'article') {
            fields1 = '<th scope="row"><label for="article_title">文章标题:</label></th>' +
                     '<td><input type="text" id="article_title" name="article_title" class="regular-text" placeholder="请输入文章标题" value="' + articleTitleValue + '">' +
                     '<p class="description">输入文章的标题</p></td>';
            fields2 = '<th scope="row"><label for="article_content">文章内容:</label></th>' +
                     '<td><textarea id="article_content" name="article_content" rows="6" class="regular-text" placeholder="请输入文章内容">' + articleContentValue + '</textarea>' +
                     '<p class="description">输入文章的详细内容</p></td>';
        }
        
        $('#content_source_fields').html(fields1);
        $('#content_source_fields2').html(fields2);
    }

    // 初始化时检查URL参数并设置对应的选项
    var urlParams = new URLSearchParams(window.location.search);
    var urlContentSource = urlParams.get('content_source');
    
    if (urlContentSource && ['link', 'topic', 'article'].includes(urlContentSource)) {
        $('input[name="content_source"][value="' + urlContentSource + '"]').prop('checked', true);
        $('.source-option-card input[type="radio"]').prop('checked', false);
        $('.source-option-card[data-source="' + urlContentSource + '"] input[type="radio"]').prop('checked', true);
    }
    
    var defaultSource = $('input[name="content_source"]:checked').val() || 'link';
    loadContentFields(defaultSource);

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
            $('#voice_name').closest('label').show();
            $('#voice_model').closest('label').hide();
            $('#voice_type').closest('label').hide();
        } else if (voiceCreateType === 'fishaudio') {
            $('#voice_name').closest('label').hide();
            $('#voice_model').closest('label').show();
            $('#voice_type').closest('label').show();
        }
    }

    $('#voice_create_type').on('change', function() {
        toggleVoiceSettings();
    });

    toggleVoiceSettings();

    // 表单提交处理
    $('#video-gen-form').on('submit', function(e) {
        e.preventDefault();
        console.log('Form submitted');

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

        $('#submit, #fixed-submit').prop('disabled', true);
        $('#submit').val('生成中...');

        var formData = $(this).serialize();

        $.ajax({
            url: videoGenAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'video_gen_ajax_submit',
                nonce: videoGenAjax.nonce,
                form_data: formData
            },
            success: function(response) {
                console.log('Ajax response:', response);
                if (response.success) {
                    showSuccessModal(response.data.redirect_url, response.data.qr_code_url);
                } else {
                    showErrorModal(response.data.message);
                }
            },
            error: function(xhr, status, error) {
                console.log('Ajax error:', error);
                showErrorModal('请求失败，请重试');
            },
            complete: function() {
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
        console.log('Showing success modal');
        
        $('.custom-modal').remove();
        
        var modalHtml = `
            <div id="custom-modal" class="custom-modal">
                <div class="modal-content">
                    <h5>提交成功</h5>
                    <p>视频生成任务已提交，请耐心等待。</p>
                    ${qrCodeUrl ? `
                        <p>扫码关注，随时了解生成进度！</p>
                        <p><img src="${qrCodeUrl}" style="width:80%;" alt="二维码" /></p>
                    ` : ''}
                    <button type="button" id="stay-on-page" class="button">继续生成</button>
                    <button type="button" id="view-generation" class="button button-primary">查看进度</button>
                </div>
            </div>
        `;

        $('body').append(modalHtml);

        $('#stay-on-page').on('click', function() {
            console.log('Stay button clicked');
            $('#custom-modal').fadeOut(function() {
                $(this).remove();
            });
        });

        $('#view-generation').on('click', function() {
            console.log('View button clicked');
            window.location.href = redirectUrl;
        });
    };

    // 错误提示弹窗
    window.showErrorModal = function(message) {
        console.log('Showing error modal');
        
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

        $('#close-modal').on('click', function() {
            console.log('Close button clicked');
            $('#custom-modal').fadeOut(function() {
                $(this).remove();
            });
        });
    };

    // VideoGenAdmin 命名空间函数
    VideoGenAdmin.resubmitRecord = function(recordId, redirectPage, $button) {
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
                    alert('重新提交成功！');
                    var redirectUrl = videoGenAjax.admin_url + 'admin.php?page=' + redirectPage;
                    console.log('Redirecting to:', redirectUrl);
                    window.location.href = redirectUrl;
                } else {
                    alert('重新提交失败：' + (response.data || '未知错误'));
                }
            },
            error: function(xhr, status, error) {
                console.error('Video Gen AJAX Error:', error);
                alert('请求失败，请稍后重试');
            },
            complete: function() {
                $button.prop('disabled', false).text('重新提交');
            }
        });
    };

    // 简化的列表页面功能 - 移除动态加载clipboard.js
    VideoGenAdmin.initListPage = function() {
        // 直接初始化复制功能，不动态加载clipboard.js
        VideoGenAdmin.initClipboard();
        VideoGenAdmin.initViewDetailsButtons();
    };

    // 简化的复制功能 - 使用原生API替代clipboard.js
    VideoGenAdmin.initClipboard = function() {
        $(document).on('click', '.copy-btn', function(e) {
            e.preventDefault();
            var targetId = $(this).data('clipboard-target');
            var targetElement = $(targetId);
            var textToCopy = targetElement.text();
            
            if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(textToCopy).then(function() {
                    var btn = $(e.target);
                    var originalText = btn.text();
                    btn.text('已复制!');
                    setTimeout(function() {
                        btn.text(originalText);
                    }, 1500);
                }).catch(function(err) {
                    console.error('复制失败:', err);
                });
            } else {
                // 降级处理
                var btn = $(e.target);
                btn.text('复制功能不可用');
                setTimeout(function() {
                    btn.text('复制');
                }, 1500);
            }
        });
    };

    // 初始化查看详情按钮
    VideoGenAdmin.initViewDetailsButtons = function() {
        $('.view-details-btn').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            var $button = $(this);
            var scrollTop = $(window).scrollTop();
            
            var id = $button.data('id');
            var title = $button.data('title') || '-';
            var desc = $button.data('desc') || '-';
            var videoPath = $button.data('video-path') || '';
            var videoSubject = $button.data('video-subject') || 'video';
            var status = $button.data('status') || 0;
            
            var videoContent = VideoGenAdmin.generateVideoContent(status, videoPath, videoSubject);
            
            $('#dynamic-publish-modal').remove();
            
            var modalHtml = `
                <div id="dynamic-publish-modal" class="publish-modal modern-modal" style="display:none;">
                    <div class="modal-backdrop"></div>
                    <div class="publish-modal-content modern-modal-content">
                        <div class="modal-header">
                            <h3>📋 发布信息与视频详情</h3>
                            <button type="button" class="close-modal" aria-label="关闭">&times;</button>
                        </div>
                        <div class="modal-body">
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
                            <div class="publish-detail-item video-section">
                                <div class="detail-label">🎬 视频</div>
                                <div class="video-content-wrapper">
                                    ${videoContent}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            $('body').append(modalHtml);
            $('#dynamic-publish-modal').fadeIn(300);
            
            VideoGenAdmin.initClipboard();
            
            $('#dynamic-publish-modal .close-modal, #dynamic-publish-modal .modal-backdrop').on('click', function() {
                VideoGenAdmin.closeDynamicModal(scrollTop);
            });
            
            $(document).on('keyup.modal', function(e) {
                if (e.keyCode === 27) {
                    VideoGenAdmin.closeDynamicModal(scrollTop);
                    $(document).off('keyup.modal');
                }
            });
        });
    };

    // 生成视频内容的辅助函数
    VideoGenAdmin.generateVideoContent = function(status, videoPath, videoSubject) {
        if (status == 2 && videoPath) {
            const subject = videoSubject || 'video';
            const filename = subject.replace(/\.mp4$/i, '') + '.mp4';
            
            return `
                <div class="video-player-container">
                    <video controls preload="metadata" class="video-player">
                        <source src="${videoPath}" type="video/mp4">
                        您的浏览器不支持视频播放。
                    </video>
                    <div class="video-actions">
                        <a href="${videoPath}" class="dh-action-btn generate download-btn" download="${filename}">
                            <span class="btn-icon">📥</span>
                            <span class="btn-text">下载视频</span>
                        </a>
                    </div>
                </div>
            `;
        } else {
            var statusText = '';
            switch(parseInt(status)) {
                case 0:
                    statusText = '📅 等待生成';
                    break;
                case 1:
                    statusText = '⏳ 正在生成中...';
                    break;
                case -1:
                    statusText = '❌ 生成失败';
                    break;
                default:
                    statusText = '📹 暂无视频';
            }
            return `
                <div class="no-video-container">
                    <div class="no-video-icon">🎬</div>
                    <div class="no-video-text">${statusText}</div>
                </div>
            `;
        }
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
        if (!VideoGenAdmin.listPageInitialized) {
            VideoGenAdmin.initListPage();
            VideoGenAdmin.listPageInitialized = true;
        }
    }

    // 标记为已初始化
    VideoGenAdmin.initialized = true;
});
