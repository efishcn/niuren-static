/**
 * AI视频公开浏览区 - 前端JavaScript（瀑布流版本）
 */
(function($) {
    'use strict';
    
    // 全局变量
    var currentPage = 1;
    var currentCategory = 0;
    var currentSearch = '';
    var currentVideoData = null;
    var perPage = 12;
    var isLoading = false;
    var hasMorePages = true;
    var scrollPosition = 0;
    
    // 确保配置存在 - 修复nonce验证问题
    var aivpgConfig = {
        ajaxUrl: (typeof aivpgData !== 'undefined' && aivpgData.ajaxUrl) ? aivpgData.ajaxUrl : ajaxurl || '/wp-admin/admin-ajax.php',
        nonce: (typeof aivpgData !== 'undefined' && aivpgData.nonce) ? aivpgData.nonce : '',
        userId: (typeof aivpgData !== 'undefined' && aivpgData.userId) ? aivpgData.userId : 0,
        messages: (typeof aivpgData !== 'undefined' && aivpgData.messages) ? aivpgData.messages : {
            confirmPurchase: '确认花费 %s 积分购买该提示词？',
            purchaseSuccess: '购买成功！',
            purchaseFailed: '购买失败，请重试',
            loginRequired: '请先登录'
        }
    };
    
    // 调试信息 - 帮助排查nonce问题
    console.log('AIVPG Config:', {
        hasNonce: !!aivpgConfig.nonce,
        nonceValue: aivpgConfig.nonce ? aivpgConfig.nonce.substring(0, 10) + '...' : 'MISSING',
        ajaxUrl: aivpgConfig.ajaxUrl,
        userId: aivpgConfig.userId
    });
    
    // 初始化画廊
    window.initAivpgGallery = function(options) {
        perPage = options.perPage || 12;
        initializeEventHandlers();
        loadVideos(true);
        initInfiniteScroll();
    };
    
    // 初始化事件处理器
    function initializeEventHandlers() {
        // 主分类变化
        $(document).on('change', '#aivpg-main-category', function() {
            var parentId = $(this).val();
            
            if (parentId > 0) {
                loadSubCategories(parentId);
            } else {
                $('#aivpg-sub-category-group').hide();
            }
            
            currentCategory = parentId;
            resetAndLoad();
        });
        
        // 子分类变化
        $(document).on('change', '#aivpg-sub-category', function() {
            currentCategory = $(this).val();
            resetAndLoad();
        });
        
        // 搜索
        $(document).on('click', '#aivpg-search-btn', function() {
            currentSearch = $('#aivpg-search').val();
            resetAndLoad();
        });
        
        $(document).on('keypress', '#aivpg-search', function(e) {
            if (e.which === 13) {
                $('#aivpg-search-btn').click();
            }
        });
        
        // 视频点击 - 保存滚动位置
        $(document).on('click', '.aivpg-video-item', function(e) {
            e.preventDefault();
            scrollPosition = $(window).scrollTop();
            var videoId = $(this).data('video-id');
            console.log('Video clicked, ID:', videoId);
            showModal(videoId);
        });
        
        // 关闭模态框
        $(document).on('click', '.aivpg-modal-close', function() {
            closeModal();
        });
        
        $(document).on('click', '#aivpg-modal', function(e) {
            if (e.target.id === 'aivpg-modal') {
                closeModal();
            }
        });
        
        // ESC键关闭模态框
        $(document).on('keydown', function(e) {
            if (e.key === 'Escape' && $('#aivpg-modal').is(':visible')) {
                closeModal();
            }
        });
    }
    
    // 重置并加载
    function resetAndLoad() {
        currentPage = 1;
        hasMorePages = true;
        loadVideos(true);
    }
    
    // 初始化无限滚动
    function initInfiniteScroll() {
        $(window).on('scroll', function() {
            if (isLoading || !hasMorePages) return;
            
            var scrollTop = $(window).scrollTop();
            var windowHeight = $(window).height();
            var documentHeight = $(document).height();
            
            if (scrollTop + windowHeight >= documentHeight - 300) {
                currentPage++;
                loadVideos(false);
            }
        });
    }
    
    // 加载子分类
    function loadSubCategories(parentId) {
        $.ajax({
            url: aivpgConfig.ajaxUrl,
            type: 'POST',
            data: {
                action: 'aivpg_get_sub_categories',
                nonce: aivpgConfig.nonce,
                parent_id: parentId
            },
            success: function(response) {
                if (response.success && response.data.length > 0) {
                    var options = '<option value="0">全部</option>';
                    response.data.forEach(function(cat) {
                        options += '<option value="' + cat.id + '">' + cat.name + '</option>';
                    });
                    $('#aivpg-sub-category').html(options);
                    $('#aivpg-sub-category-group').show();
                } else {
                    $('#aivpg-sub-category-group').hide();
                }
            }
        });
    }
    
    // 加载视频列表
    function loadVideos(clearContent) {
        if (isLoading) return;
        isLoading = true;
        
        if (clearContent) {
            $('#aivpg-video-grid').html('<div class="aivpg-loading">加载中...</div>');
            $('#aivpg-pagination').html('');
        } else {
            $('#aivpg-video-grid').append('<div class="aivpg-loading-more">加载更多...</div>');
        }
        
        $.ajax({
            url: aivpgConfig.ajaxUrl,
            type: 'POST',
            data: {
                action: 'aivpg_get_videos',
                nonce: aivpgConfig.nonce,
                page: currentPage,
                per_page: perPage,
                category_id: currentCategory,
                search: currentSearch
            },
            success: function(response) {
                isLoading = false;
                $('.aivpg-loading-more').remove();
                
                if (response.success) {
                    if (clearContent) {
                        renderVideos(response.data);
                    } else {
                        appendVideos(response.data);
                    }
                    
                    hasMorePages = (currentPage < response.data.pages);
                    
                    if (!hasMorePages && currentPage > 1) {
                        $('#aivpg-video-grid').append('<div class="aivpg-no-more">没有更多视频了</div>');
                    }
                } else {
                    if (clearContent) {
                        $('#aivpg-video-grid').html('<div class="aivpg-no-results">暂无视频</div>');
                    }
                }
            },
            error: function() {
                isLoading = false;
                $('.aivpg-loading-more').remove();
                if (clearContent) {
                    $('#aivpg-video-grid').html('<div class="aivpg-no-results">加载失败，请重试</div>');
                }
            }
        });
    }
    
    // 渲染视频列表
    function renderVideos(data) {
        var html = '';
        
        if (data.videos && data.videos.length > 0) {
            data.videos.forEach(function(video) {
                html += createVideoItem(video);
            });
        } else {
            html = '<div class="aivpg-no-results">暂无视频</div>';
        }
        
        $('#aivpg-video-grid').html(html);
        $('#aivpg-pagination').html('');
    }
    
    // 追加视频列表
    function appendVideos(data) {
        if (data.videos && data.videos.length > 0) {
            var html = '';
            data.videos.forEach(function(video) {
                html += createVideoItem(video);
            });
            $('#aivpg-video-grid').append(html);
        }
    }
    
    // 创建视频项HTML
    function createVideoItem(video) {
        var html = '<div class="aivpg-video-item" data-video-id="' + video.id + '">';
        html += '<div class="aivpg-video-thumbnail">';
        var thumbnailUrl = video.video_thumbnail || (aivpgConfig.defaultThumbnail || '');
        if (thumbnailUrl) {
            html += '<img src="' + thumbnailUrl + '" alt="' + escapeHtml(video.publish_title) + '" loading="lazy">';
        }
        html += '<div class="aivpg-video-overlay">';
        html += '<button class="aivpg-play-btn">▶</button>';
        html += '</div>';
        html += '</div>';
        html += '<div class="aivpg-video-info">';
        html += '<h3 class="aivpg-video-title">' + escapeHtml(video.publish_title) + '</h3>';
        if (video.category_name) {
            html += '<span class="aivpg-video-category">' + escapeHtml(video.category_name) + '</span>';
        }
        html += '</div>';
        html += '</div>';
        return html;
    }
    
    // 显示模态框
    function showModal(videoId) {
        console.log('showModal called with videoId:', videoId);
        
        // 保存video ID
        $('#aivpg-modal').data('video-id', videoId);
        
        // 先显示模态框
        $('#aivpg-modal').fadeIn(300, function() {
            console.log('Modal shown');
        });
        
        // 加载视频详情
        loadVideoDetail(videoId);
        
        // 防止背景滚动
        $('body').addClass('aivpg-modal-open');
    }
    
    // 加载视频详情
    function loadVideoDetail(videoId) {
        console.log('Loading video detail for:', videoId);
        
        // 显示加载状态
        $('.aivpg-modal-body').html('<div class="aivpg-loading">加载中...</div>');
        
        $.ajax({
            url: aivpgConfig.ajaxUrl,
            type: 'POST',
            data: {
                action: 'aivpg_get_video_detail',
                nonce: aivpgConfig.nonce,
                video_id: videoId
            },
            success: function(response) {
                console.log('Video detail response:', response);
                if (response.success) {
                    currentVideoData = response.data;
                    renderVideoDetail(response.data);
                } else {
                    showNotification('error', response.data.message || '加载失败');
                    closeModal();
                }
            },
            error: function(xhr, status, error) {
                console.error('Video detail error:', error);
                showNotification('error', '加载失败，请重试');
                closeModal();
            }
        });
    }
    
    // 渲染视频详情
    function renderVideoDetail(video) {
        var html = '<div class="aivpg-modal-video">';
        html += '<video id="aivpg-video-player" controls preload="metadata"';
        if (video.pic_url) {
            html += ' poster="' + escapeAttr(video.pic_url) + '"';
        }
        html += '>';
        if (video.video_path) {
            html += '<source src="' + escapeAttr(video.video_path) + '" type="video/mp4">';
        }
        html += '</video>';
        html += '</div>';
        
        html += '<div class="aivpg-modal-info">';
        html += '<h2>' + escapeHtml(video.publish_title) + '</h2>';
        
        html += '<div class="aivpg-video-meta">';
        if (video.category_name) {
            html += '<span class="aivpg-badge">' + escapeHtml(video.category_name) + '</span>';
        }
        html += '<span class="aivpg-badge">' + (video.video_ratio || '未知') + '</span>';
        html += '<span class="aivpg-badge">' + (video.platform || '未知') + '</span>';
        html += '</div>';
        
        html += '<div class="aivpg-video-description">' + escapeHtml(video.publish_desc || '') + '</div>';
        
        html += '<div class="aivpg-prompt-section">';
        html += '<h3>创意描述（提示词）</h3>';
        html += '<div class="aivpg-prompt-container">';
        
        if (video.can_view_prompt) {
            html += '<div class="aivpg-prompt-content">' + escapeHtml(video.idea_desc) + '</div>';
        } else {
            html += '<div class="aivpg-prompt-locked">';
            html += '<p>🔒 该提示词需要购买后才能查看</p>';
            html += '<p>价格：<strong>' + (video.prompt_credits || 500) + '</strong> 积分</p>';
            html += '<button class="aivpg-btn aivpg-btn-primary" id="aivpg-purchase-btn">购买提示词</button>';
            html += '</div>';
        }
        
        html += '</div>';
        html += '</div>';
        
        html += '<div class="aivpg-modal-actions">';
        html += '<button class="aivpg-btn aivpg-btn-success" id="aivpg-make-similar-btn">一键做同款视频</button>';
        html += '</div>';
        
        html += '</div>';
        
        $('.aivpg-modal-body').html(html);
    }
    
    // 通用通知函数
    function showNotification(type, message, callback) {
        var title = type === 'success' ? '成功' : (type === 'confirm' ? '确认操作' : '提示');
        
        var buttonsHtml = '';
        if (type === 'confirm') {
            buttonsHtml = '<button class="aivpg-notification-btn aivpg-btn-cancel">取消</button>';
            buttonsHtml += '<button class="aivpg-notification-btn aivpg-btn-confirm">确定</button>';
        } else {
            buttonsHtml = '<button class="aivpg-notification-btn aivpg-btn-ok">确定</button>';
        }
        
        var modalHtml = '<div class="aivpg-notification-modal">';
        modalHtml += '<div class="aivpg-notification-overlay"></div>';
        modalHtml += '<div class="aivpg-notification-content">';
        modalHtml += '<h3>' + title + '</h3>';
        modalHtml += '<p>' + message + '</p>';
        modalHtml += '<div class="aivpg-notification-buttons">' + buttonsHtml + '</div>';
        modalHtml += '</div>';
        modalHtml += '</div>';
        
        $('body').append(modalHtml);
        
        $('.aivpg-notification-btn').on('click', function() {
            var isConfirm = $(this).hasClass('aivpg-btn-confirm');
            $('.aivpg-notification-modal').fadeOut(200, function() {
                $(this).remove();
            });
            if (callback) {
                callback(isConfirm);
            }
        });
        
        $('.aivpg-notification-overlay').on('click', function() {
            $('.aivpg-notification-modal').fadeOut(200, function() {
                $(this).remove();
            });
            if (callback) {
                callback(false);
            }
        });
    }
    
    // 购买提示词
    $(document).on('click', '#aivpg-purchase-btn', function() {
        if (!aivpgConfig.userId) {
            showNotification('error', aivpgConfig.messages.loginRequired);
            return;
        }
        
        var videoId = $('#aivpg-modal').data('video-id');
        var price = currentVideoData.prompt_credits || 500;
        
        showNotification('confirm', '确认花费 <strong>' + price + '</strong> 积分购买该提示词？', function(confirmed) {
            if (!confirmed) return;
            
            var $btn = $('#aivpg-purchase-btn');
            $btn.prop('disabled', true).text('购买中...');
            
            $.ajax({
                url: aivpgConfig.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'aivpg_purchase_prompt',
                    nonce: aivpgConfig.nonce,
                    video_id: videoId
                },
                success: function(response) {
                    if (response.success) {
                        showNotification('success', '购买成功！积分已扣除');
                        $('.aivpg-prompt-locked').html('<div class="aivpg-prompt-content">' + escapeHtml(response.data.prompt) + '</div>');
                    } else {
                        showNotification('error', response.data.message || aivpgConfig.messages.purchaseFailed);
                        $btn.prop('disabled', false).text('购买提示词');
                    }
                },
                error: function() {
                    showNotification('error', aivpgConfig.messages.purchaseFailed);
                    $btn.prop('disabled', false).text('购买提示词');
                }
            });
        });
    });
    
    // 做同款
    $(document).on('click', '#aivpg-make-similar-btn', function() {
        if (!aivpgConfig.userId) {
            showNotification('error', aivpgConfig.messages.loginRequired);
            return;
        }
        
        var videoId = $('#aivpg-modal').data('video-id');
        var $btn = $(this);
        
        $btn.prop('disabled', true).text('创建中...');
        
        $.ajax({
            url: aivpgConfig.ajaxUrl,
            type: 'POST',
            data: {
                action: 'aivpg_make_similar',
                nonce: aivpgConfig.nonce,
                video_id: videoId
            },
            success: function(response) {
                if (response.success) {
                    showNotification('success', 'AI视频做同款任务提交成功', function() {
                        if (response.data.redirect_url) {
                            window.location.href = response.data.redirect_url;
                        }
                    });
                } else {
                    showNotification('error', response.data.message || '创建失败');
                    $btn.prop('disabled', false).text('一键做同款视频');
                }
            },
            error: function() {
                showNotification('error', '创建失败，请重试');
                $btn.prop('disabled', false).text('一键做同款视频');
            }
        });
    });
    
    // 关闭模态框
    function closeModal() {
        $('#aivpg-modal').fadeOut(300, function() {
            $(window).scrollTop(scrollPosition);
        });
        
        var video = $('#aivpg-video-player')[0];
        if (video) {
            video.pause();
        }
        
        $('body').removeClass('aivpg-modal-open');
    }
    
    // HTML转义
    function escapeHtml(text) {
        if (!text) return '';
        var map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, function(m) { return map[m]; });
    }
    
    // 属性转义
    function escapeAttr(text) {
        if (!text) return '';
        return String(text).replace(/"/g, '&quot;').replace(/'/g, '&#039;');
    }
    
    // 兼容旧的全局函数
    window.loadVideoDetail = function(videoId) {
        showModal(videoId);
    };
    
})(jQuery);
