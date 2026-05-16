/**
 * Digital Human Admin JavaScript
 * 处理视频弹层和分身/声音选择器
 */

jQuery(document).ready(function($) {
    
    // ============================================
    // 视频列表弹层功能
    // ============================================
    
    // 打开分身视频弹层
    $(document).on('click', '.view-avatar-video-btn', function() {
        var videoUrl = $(this).data('video-url');
        var title = $(this).data('title');
        var downloadName = $(this).data('download-name');
        
        $('#avatar-video-modal-title').text(title);
        $('#avatar-video-player source').attr('src', videoUrl);
        $('#avatar-video-player')[0].load();
        $('#avatar-video-download').attr('href', videoUrl).attr('download', downloadName);
        
        $('#dh-avatar-video-modal').fadeIn(300);
    });
    
    // 打开视频列表视频弹层
    $(document).on('click', '.view-dh-video-btn', function() {
        var videoUrl = $(this).data('video-url');
        var title = $(this).data('title');
        var downloadName = $(this).data('download-name');
        
        $('#dh-video-modal-title').text(title);
        $('#dh-video-player source').attr('src', videoUrl);
        $('#dh-video-player')[0].load();
        $('#dh-video-download').attr('href', videoUrl).attr('download', downloadName);
        
        $('#dh-videos-modal').fadeIn(300);
    });
    
    // 关闭视频弹层
    $(document).on('click', '.dh-video-modal-close, .dh-video-modal-overlay', function() {
        var $modal = $(this).closest('.dh-video-modal');
        $modal.fadeOut(300, function() {
            // 检查是视频还是音频元素
            var $video = $modal.find('video');
            var $audio = $modal.find('audio');
            
            if ($video.length > 0 && $video[0]) {
                $video[0].pause();
                $video.find('source').attr('src', '');
            }
            if ($audio.length > 0 && $audio[0]) {
                $audio[0].pause();
            }
        });
    });
    
    // ============================================
    // Videos页面分身选择器功能 (AJAX加载 + 无限滚动)
    // ============================================
    
    var avatarVideoPlayer = null;
    var currentAvatarPage = 1;
    var currentAvatarSearch = '';
    var isLoadingAvatars = false;
    var hasMoreAvatars = true;
    
    // 打开分身选择器并加载数据
    $('#open-avatar-selector').click(function() {
        $('#avatar-selector-modal').fadeIn(300);
        currentAvatarPage = 1;
        hasMoreAvatars = true;
        $('#avatar-list').empty();
        loadAvatars(1, '', false);
        
        // 绑定滚动事件（只绑定一次）
        if (!$('#avatar-selector-modal .dh-selector-body').data('scroll-bound')) {
            $('#avatar-selector-modal .dh-selector-body').on('scroll', handleAvatarScroll);
            $('#avatar-selector-modal .dh-selector-body').data('scroll-bound', true);
        }
    });
    
    // 关闭分身选择器
    $(document).on('click', '#avatar-selector-modal .dh-selector-close', function() {
        if (avatarVideoPlayer) {
            avatarVideoPlayer.pause();
            avatarVideoPlayer = null;
        }
        $('#avatar-selector-modal').fadeOut(300);
    });
    
    // 点击遮罩关闭
    $(document).on('click', '#avatar-selector-modal .dh-selector-overlay', function(e) {
        if (e.target === this) {
            if (avatarVideoPlayer) {
                avatarVideoPlayer.pause();
                avatarVideoPlayer = null;
            }
            $('#avatar-selector-modal').fadeOut(300);
        }
    });
    
    // 实时搜索分身
    var avatarSearchTimer;
    $(document).on('input', '#avatar-search', function() {
        clearTimeout(avatarSearchTimer);
        var keyword = $(this).val();
        avatarSearchTimer = setTimeout(function() {
            currentAvatarSearch = keyword;
            loadAvatars(1, keyword);
        }, 300);
    });
    
    // 无限滚动处理
    function handleAvatarScroll() {
        if (isLoadingAvatars || !hasMoreAvatars) return;
        
        var $body = $('#avatar-selector-modal .dh-selector-body');
        var scrollTop = $body.scrollTop();
        var scrollHeight = $body[0].scrollHeight;
        var clientHeight = $body.height();
        
        // 距离底部50px时触发加载
        if (scrollTop + clientHeight >= scrollHeight - 50) {
            loadAvatars(currentAvatarPage + 1, currentAvatarSearch, true);
        }
    }
    
    // 加载分身列表
    function loadAvatars(page, keyword, append) {
        if (isLoadingAvatars) return;
        
        isLoadingAvatars = true;
        currentAvatarPage = page;
        
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'dh_get_avatars',
                page: page,
                keyword: keyword,
                _wpnonce: dh_admin_vars.nonce
            },
            beforeSend: function() {
                if (!append) {
                    $('#avatar-list').html('<div class="dh-loading"><div class="dh-spinner"></div><p>加载中...</p></div>');
                } else {
                    $('#avatar-list').append('<div class="dh-loading-more"><span class="dashicons dashicons-update-alt"></span></div>');
                }
            },
            success: function(response) {
                isLoadingAvatars = false;
                $('.dh-loading, .dh-loading-more').remove();
                
                if (response.success && response.data.avatars) {
                    renderAvatars(response.data.avatars, append);
                    
                    if (response.data.pagination) {
                        hasMoreAvatars = currentAvatarPage < response.data.pagination.total_pages;
                    } else {
                        hasMoreAvatars = false;
                    }
                    
                    if (!hasMoreAvatars && append) {
                        $('#avatar-list').append('<div class="dh-no-more">没有更多数据了</div>');
                    }
                } else {
                    if (!append) {
                        $('#avatar-list').html('<div class="dh-empty">暂无分身数据</div>');
                    }
                    hasMoreAvatars = false;
                }
            },
            error: function() {
                isLoadingAvatars = false;
                $('.dh-loading, .dh-loading-more').remove();
                if (!append) {
                    $('#avatar-list').html('<div class="dh-error">加载失败，请重试</div>');
                }
            }
        });
    }
    
    // 渲染分身列表
    function renderAvatars(avatars, append) {
        var html = '';
        if (avatars && avatars.length > 0) {
            avatars.forEach(function(avatar) {
                html += '<div class="avatar-item" data-id="' + avatar.id + '" data-title="' + avatar.title + '">';
                html += '  <div class="avatar-video">';
                html += '    <div class="avatar-placeholder">';
                html += '      <span class="dashicons dashicons-format-video"></span>';
                html += '    </div>';
                html += '    <div class="play-button" data-url="' + avatar.video_url + '">▶</div>';
                html += '  </div>';
                html += '  <div class="avatar-title">' + avatar.title + '</div>';
                html += '</div>';
            });
        }
        
        if (append) {
            $('#avatar-list').append(html);
        } else {
            if (html) {
                $('#avatar-list').html(html);
            } else {
                $('#avatar-list').html('<div class="dh-empty">暂无分身数据</div>');
            }
        }
    }
    
    // 渲染分页
    function renderAvatarPagination(pagination) {
        var html = '';
        if (pagination && pagination.total_pages > 1) {
            if (pagination.current_page > 1) {
                html += '<button class="dh-page-btn" data-page="' + (pagination.current_page - 1) + '">上一页</button>';
            }
            for (var i = 1; i <= pagination.total_pages; i++) {
                if (i === pagination.current_page) {
                    html += '<button class="dh-page-btn active">' + i + '</button>';
                } else {
                    html += '<button class="dh-page-btn" data-page="' + i + '">' + i + '</button>';
                }
            }
            if (pagination.current_page < pagination.total_pages) {
                html += '<button class="dh-page-btn" data-page="' + (pagination.current_page + 1) + '">下一页</button>';
            }
        }
        $('#avatar-pagination').html(html);
    }
    
    // 分页点击
    $(document).on('click', '#avatar-pagination .dh-page-btn', function() {
        if (!$(this).hasClass('active')) {
            var page = $(this).data('page');
            if (page) {
                loadAvatars(page, currentAvatarSearch);
            }
        }
    });
    
    // 点击分身项直接选择并关闭
    $(document).on('click', '#avatar-list .avatar-item', function(e) {
        // 如果点击的是播放按钮，不执行选择
        if ($(e.target).closest('.play-button').length > 0) {
            return;
        }
        
        var avatarId = $(this).data('id');
        var avatarTitle = $(this).data('title');
        
        $('#avatar_id').val(avatarId);
        $('#selected-avatar-text').text('已选择: ' + avatarTitle);
        
        if (avatarVideoPlayer) {
            avatarVideoPlayer.pause();
            avatarVideoPlayer = null;
        }
        $('#avatar-selector-modal').fadeOut(300);
    });
    
    // 分身视频播放
    $(document).on('click', '#avatar-list .play-button', function(e) {
        e.stopPropagation();
        var $playButton = $(this);
        var $avatarItem = $playButton.closest('.avatar-item');
        var videoUrl = $playButton.data('url');
        
        // 停止之前的视频
        if (avatarVideoPlayer) {
            avatarVideoPlayer.pause();
            $('#avatar-list .avatar-item').removeClass('playing');
            $('#avatar-list .play-button').text('▶');
        }
        
        // 如果点击的是同一个按钮,停止播放
        if (avatarVideoPlayer && avatarVideoPlayer.currentSrc && avatarVideoPlayer.currentSrc.indexOf(videoUrl) !== -1) {
            avatarVideoPlayer = null;
            return;
        }
        
        // 创建video元素并播放
        var $placeholder = $avatarItem.find('.avatar-placeholder');
        if ($placeholder.find('video').length === 0) {
            var $video = $('<video>', {
                src: videoUrl,
                css: {
                    'width': '100%',
                    'height': '100%',
                    'object-fit': 'cover'
                }
            });
            $placeholder.html($video);
            avatarVideoPlayer = $video[0];
        } else {
            avatarVideoPlayer = $placeholder.find('video')[0];
        }
        
        avatarVideoPlayer.play().then(function() {
            $avatarItem.addClass('playing');
            $playButton.text('■');
        }).catch(function(error) {
            console.error('视频播放失败:', error);
        });
        
        // 视频播放结束
        $(avatarVideoPlayer).on('ended', function() {
            $avatarItem.removeClass('playing');
            $playButton.text('▶');
        });
    });
    
    // ============================================
    // Videos页面声音选择器功能 (AJAX加载 + 无限滚动)
    // ============================================
    
    var audioPlayerVideos = new Audio();
    var currentVoicePageVideos = 1;
    var currentVoiceSearchVideos = '';
    var isLoadingVoicesVideos = false;
    var hasMoreVoicesVideos = true;
    
    // 打开声音选择器并加载数据
    $('#open-voice-selector').click(function() {
        $('#voice-selector-modal').fadeIn(300);
        currentVoicePageVideos = 1;
        hasMoreVoicesVideos = true;
        $('#voice-list').empty();
        loadVoicesVideos(1, '', false);
        
        // 绑定滚动事件（只绑定一次）
        if (!$('#voice-selector-modal .dh-selector-body').data('scroll-bound')) {
            $('#voice-selector-modal .dh-selector-body').on('scroll', handleVoiceScrollVideos);
            $('#voice-selector-modal .dh-selector-body').data('scroll-bound', true);
        }
    });
    
    // 无限滚动处理
    function handleVoiceScrollVideos() {
        if (isLoadingVoicesVideos || !hasMoreVoicesVideos) return;
        
        var $body = $('#voice-selector-modal .dh-selector-body');
        var scrollTop = $body.scrollTop();
        var scrollHeight = $body[0].scrollHeight;
        var clientHeight = $body.height();
        
        // 距离底部50px时触发加载
        if (scrollTop + clientHeight >= scrollHeight - 50) {
            loadVoicesVideos(currentVoicePageVideos + 1, currentVoiceSearchVideos, true);
        }
    }
    
    // 关闭声音选择器
    $(document).on('click', '#voice-selector-modal .dh-selector-close', function() {
        audioPlayerVideos.pause();
        $('#voice-selector-modal').fadeOut(300);
    });
    
    // 点击遮罩关闭
    $(document).on('click', '#voice-selector-modal .dh-selector-overlay', function(e) {
        if (e.target === this) {
            audioPlayerVideos.pause();
            $('#voice-selector-modal').fadeOut(300);
        }
    });
    
    // 实时搜索声音
    var voiceSearchTimerVideos;
    $(document).on('input', '#voice-search', function() {
        clearTimeout(voiceSearchTimerVideos);
        var keyword = $(this).val();
        voiceSearchTimerVideos = setTimeout(function() {
            currentVoiceSearchVideos = keyword;
            loadVoicesVideos(1, keyword);
        }, 300);
    });
    
    // 加载声音列表
    function loadVoicesVideos(page, keyword, append) {
        if (isLoadingVoicesVideos) return;
        
        isLoadingVoicesVideos = true;
        currentVoicePageVideos = page;
        
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'dh_get_voices',
                page: page,
                keyword: keyword,
                _wpnonce: dh_admin_vars.nonce
            },
            beforeSend: function() {
                if (!append) {
                    $('#voice-list').html('<div class="dh-loading"><div class="dh-spinner"></div><p>加载中...</p></div>');
                } else {
                    $('#voice-list').append('<div class="dh-loading-more"><span class="dashicons dashicons-update-alt"></span></div>');
                }
            },
            success: function(response) {
                isLoadingVoicesVideos = false;
                $('.dh-loading, .dh-loading-more').remove();
                
                if (response.success && response.data.voices) {
                    renderVoicesVideos(response.data.voices, append);
                    
                    if (response.data.pagination) {
                        hasMoreVoicesVideos = currentVoicePageVideos < response.data.pagination.total_pages;
                    } else {
                        hasMoreVoicesVideos = false;
                    }
                    
                    if (!hasMoreVoicesVideos && append) {
                        $('#voice-list').append('<div class="dh-no-more">没有更多数据了</div>');
                    }
                } else {
                    if (!append) {
                        $('#voice-list').html('<div class="dh-empty">暂无声音数据</div>');
                    }
                    hasMoreVoicesVideos = false;
                }
            },
            error: function() {
                isLoadingVoicesVideos = false;
                $('.dh-loading, .dh-loading-more').remove();
                if (!append) {
                    $('#voice-list').html('<div class="dh-error">加载失败，请重试</div>');
                }
            }
        });
    }
    
    // 渲染声音列表
    function renderVoicesVideos(voices, append) {
        var html = '';
        if (voices && voices.length > 0) {
            voices.forEach(function(voice) {
                html += '<div class="voice-item" data-id="' + voice.id + '" data-title="' + voice.title + '">';
                html += '  <div class="voice-audio">';
                html += '    <i class="dashicons dashicons-microphone"></i>';
                html += '    <div class="play-button" data-url="' + voice.audio_url + '">▶</div>';
                html += '    <div class="wave-animation">';
                html += '      <span></span><span></span><span></span><span></span>';
                html += '    </div>';
                html += '  </div>';
                html += '  <div class="voice-title">' + voice.title + '</div>';
                html += '</div>';
            });
        }
        
        if (append) {
            $('#voice-list').append(html);
        } else {
            if (html) {
                $('#voice-list').html(html);
            } else {
                $('#voice-list').html('<div class="dh-empty">暂无声音数据</div>');
            }
        }
    }
    
    // 渲染分页
    function renderVoicePaginationVideos(pagination) {
        var html = '';
        if (pagination && pagination.total_pages > 1) {
            if (pagination.current_page > 1) {
                html += '<button class="dh-page-btn" data-page="' + (pagination.current_page - 1) + '">上一页</button>';
            }
            for (var i = 1; i <= pagination.total_pages; i++) {
                if (i === pagination.current_page) {
                    html += '<button class="dh-page-btn active">' + i + '</button>';
                } else {
                    html += '<button class="dh-page-btn" data-page="' + i + '">' + i + '</button>';
                }
            }
            if (pagination.current_page < pagination.total_pages) {
                html += '<button class="dh-page-btn" data-page="' + (pagination.current_page + 1) + '">下一页</button>';
            }
        }
        $('#voice-pagination').html(html);
    }
    
    // 分页点击
    $(document).on('click', '#voice-pagination .dh-page-btn', function() {
        if (!$(this).hasClass('active')) {
            var page = $(this).data('page');
            if (page) {
                loadVoicesVideos(page, currentVoiceSearchVideos);
            }
        }
    });
    
    // 点击声音项直接选择并关闭
    $(document).on('click', '#voice-list .voice-item', function(e) {
        // 如果点击的是播放按钮，不执行选择
        if ($(e.target).closest('.play-button').length > 0) {
            return;
        }
        
        var voiceId = $(this).data('id');
        var voiceTitle = $(this).data('title');
        
        $('#voice_id').val(voiceId);
        $('#selected-voice-text').text('已选择: ' + voiceTitle);
        
        audioPlayerVideos.pause();
        $('#voice-selector-modal').fadeOut(300);
    });
    
    // 声音播放
    $(document).on('click', '#voice-list .play-button', function(e) {
        e.stopPropagation();
        var $playButton = $(this);
        var $voiceItem = $playButton.closest('.voice-item');
        var audioUrl = $playButton.data('url');
        
        // 如果点击的是当前正在播放的
        if (audioPlayerVideos.src === audioUrl && !audioPlayerVideos.paused) {
            audioPlayerVideos.pause();
            audioPlayerVideos.currentTime = 0;
            $voiceItem.removeClass('playing');
            $playButton.text('▶');
            return;
        }
        
        // 停止其他音频
        $('#voice-list .voice-item').removeClass('playing');
        $('#voice-list .play-button').text('▶');
        
        // 播放新音频
        audioPlayerVideos.src = audioUrl;
        audioPlayerVideos.play().then(function() {
            $voiceItem.addClass('playing');
            $playButton.text('■');
        }).catch(function(error) {
            console.error('音频播放失败:', error);
        });
        
        // 音频播放结束
        audioPlayerVideos.addEventListener('ended', function() {
            $voiceItem.removeClass('playing');
            $playButton.text('▶');
        });
    });
    
    // ============================================
    // 音频播放弹层功能
    // ============================================
    
    var currentAudio = null;
    
    // 打开音频播放弹层
    $(document).on('click', '.dh-play-audio-btn', function() {
        var audioUrl = $(this).data('audio-url');
        var title = $(this).data('title');
        
        // 创建音频播放弹层
        var modalHtml = `
            <div id="dh-audio-modal" class="dh-video-modal">
                <div class="dh-video-modal-overlay"></div>
                <div class="dh-video-modal-content" style="max-width: 500px;">
                    <div class="dh-video-modal-header">
                        <h2 id="dh-audio-modal-title">${title}</h2>
                        <button class="dh-video-modal-close">×</button>
                    </div>
                    <div class="dh-video-modal-body">
                        <div class="audio-player-container">
                            <audio id="dh-audio-player" controls autoplay style="width: 100%;">
                                <source src="${audioUrl}" type="audio/mpeg">
                                您的浏览器不支持音频播放。
                            </audio>
                        </div>
                    </div>
                    <div class="dh-video-modal-footer">
                        <a href="${audioUrl}" download="${title}.mp3" class="button button-primary">
                            <span class="dashicons dashicons-download"></span> 下载音频
                        </a>
                    </div>
                </div>
            </div>
        `;
        
        // 移除旧的弹层
        $('#dh-audio-modal').remove();
        
        // 添加新弹层
        $('body').append(modalHtml);
        
        // 显示弹层
        $('#dh-audio-modal').fadeIn(300);
        
        currentAudio = $('#dh-audio-player')[0];
    });
    
    // 关闭音频弹层
    $(document).on('click', '#dh-audio-modal .dh-video-modal-close, #dh-audio-modal .dh-video-modal-overlay', function() {
        $('#dh-audio-modal').fadeOut(300, function() {
            if (currentAudio) {
                currentAudio.pause();
                currentAudio = null;
            }
            $(this).remove();
        });
    });
    
    // ============================================
    // Audios页面声音选择器功能
    // ============================================
    
    var selectedVoiceIdAudios = null;
    var audioPlayerAudios = new Audio();
    var currentVoicePageAudios = 1;
    var currentVoiceSearchAudios = '';
    
    // 打开声音选择器(audios页面)
    $('#open-voice-selector-audios').click(function() {
        $('#voice-selector-modal-audios').fadeIn(300);
        loadVoicesAudios(1, '');
    });
    
    // 关闭声音选择器(audios页面)
    $(document).on('click', '#voice-selector-modal-audios .dh-selector-close', function() {
        audioPlayerAudios.pause();
        $('#voice-selector-modal-audios').fadeOut(300);
    });
    
    // 点击遮罩关闭
    $(document).on('click', '#voice-selector-modal-audios .dh-selector-overlay', function(e) {
        if (e.target === this) {
            audioPlayerAudios.pause();
            $('#voice-selector-modal-audios').fadeOut(300);
        }
    });
    
    // 搜索声音(audios页面)
    var voiceSearchTimerAudios;
    $('#voice-search-audios').on('input', function() {
        clearTimeout(voiceSearchTimerAudios);
        var keyword = $(this).val();
        voiceSearchTimerAudios = setTimeout(function() {
            currentVoiceSearchAudios = keyword;
            loadVoicesAudios(1, keyword);
        }, 500);
    });
    
    // 加载声音列表(audios页面)
    function loadVoicesAudios(page, keyword) {
        currentVoicePageAudios = page;
        
        $.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'dh_get_voices',
                page: page,
                keyword: keyword,
                _wpnonce: dh_admin_vars.nonce
            },
            beforeSend: function() {
                $('#voice-list-audios').html('<div class="dh-loading">加载中...</div>');
            },
            success: function(response) {
                if (response.success) {
                    renderVoicesAudios(response.data.voices);
                    renderVoicePaginationAudios(response.data.pagination);
                } else {
                    $('#voice-list-audios').html('<div class="dh-no-data">暂无声音数据</div>');
                }
            },
            error: function() {
                $('#voice-list-audios').html('<div class="dh-error">加载失败,请重试</div>');
            }
        });
    }
    
    // 渲染声音列表(audios页面)
    function renderVoicesAudios(voices) {
        var html = '';
        if (voices && voices.length > 0) {
            voices.forEach(function(voice) {
                html += '<div class="voice-item" data-id="' + voice.id + '" data-title="' + voice.title + '">';
                html += '  <div class="voice-audio">';
                html += '    <i class="dashicons dashicons-microphone"></i>';
                html += '    <div class="play-button" data-url="' + voice.audio_url + '">▶</div>';
                html += '    <div class="wave-animation">';
                html += '      <span></span><span></span><span></span><span></span>';
                html += '    </div>';
                html += '  </div>';
                html += '  <div class="voice-title">' + voice.title + '</div>';
                html += '</div>';
            });
        } else {
            html = '<div class="dh-no-data">暂无声音数据</div>';
        }
        $('#voice-list-audios').html(html);
    }
    
    // 渲染分页(audios页面)
    function renderVoicePaginationAudios(pagination) {
        var html = '';
        if (pagination && pagination.total_pages > 1) {
            // 上一页
            if (pagination.current_page > 1) {
                html += '<button class="dh-page-btn" data-page="' + (pagination.current_page - 1) + '">上一页</button>';
            }
            
            // 页码
            for (var i = 1; i <= pagination.total_pages; i++) {
                if (i === pagination.current_page) {
                    html += '<button class="dh-page-btn active">' + i + '</button>';
                } else {
                    html += '<button class="dh-page-btn" data-page="' + i + '">' + i + '</button>';
                }
            }
            
            // 下一页
            if (pagination.current_page < pagination.total_pages) {
                html += '<button class="dh-page-btn" data-page="' + (pagination.current_page + 1) + '">下一页</button>';
            }
        }
        $('#voice-pagination-audios').html(html);
    }
    
    // 分页点击(audios页面)
    $(document).on('click', '#voice-pagination-audios .dh-page-btn', function() {
        if (!$(this).hasClass('active')) {
            var page = $(this).data('page');
            if (page) {
                loadVoicesAudios(page, currentVoiceSearchAudios);
            }
        }
    });
    
    // 点击声音项直接选择并关闭(audios页面)
    $(document).on('click', '#voice-list-audios .voice-item', function(e) {
        // 如果点击的是播放按钮，不执行选择
        if ($(e.target).closest('.play-button').length > 0) {
            return;
        }
        
        var voiceId = $(this).data('id');
        var voiceTitle = $(this).data('title');
        
        $('#voice_id').val(voiceId);
        $('#selected-voice-text-audios').text('已选择: ' + voiceTitle);
        
        audioPlayerAudios.pause();
        $('#voice-selector-modal-audios').fadeOut(300);
    });
    
    // 声音播放(audios页面)
    $(document).on('click', '#voice-list-audios .play-button', function(e) {
        e.stopPropagation();
        var $playButton = $(this);
        var $voiceItem = $playButton.closest('.voice-item');
        var audioUrl = $playButton.data('url');
        
        // 如果点击的是当前正在播放的
        if (audioPlayerAudios.src === audioUrl && !audioPlayerAudios.paused) {
            audioPlayerAudios.pause();
            audioPlayerAudios.currentTime = 0;
            $voiceItem.removeClass('playing');
            $playButton.text('▶');
            return;
        }
        
        // 停止其他音频
        $('#voice-list-audios .voice-item').removeClass('playing');
        $('#voice-list-audios .play-button').text('▶');
        
        // 播放新音频
        audioPlayerAudios.src = audioUrl;
        audioPlayerAudios.play().then(function() {
            $voiceItem.addClass('playing');
            $playButton.text('■');
        }).catch(function(error) {
            console.error('音频播放失败:', error);
        });
        
        // 音频播放结束
        audioPlayerAudios.addEventListener('ended', function() {
            $voiceItem.removeClass('playing');
            $playButton.text('▶');
        });
    });
    
    // ============================================
    // 音频拖拽上传功能 (videos-form.php)
    // ============================================
    
    var audioDropZone = $('#audio-drop-zone');
    var audioFilePlayer = null;
    
    if (audioDropZone.length > 0) {
        // 点击上传区域触发文件选择
        audioDropZone.on('click', function(e) {
            if (!$(this).hasClass('has-file')) {
                var fileInput = $('<input type="file" accept="audio/mp3,audio/wav,audio/m4a,audio/mpeg">');
                fileInput.on('change', function(e) {
                    handleAudioFiles(e.target.files);
                });
                fileInput.click();
            }
        });
        
        // 拖拽事件
        audioDropZone.on('dragover', function(e) {
            e.preventDefault();
            e.stopPropagation();
            $(this).addClass('drag-over');
        });
        
        audioDropZone.on('dragleave', function(e) {
            e.preventDefault();
            e.stopPropagation();
            $(this).removeClass('drag-over');
        });
        
        audioDropZone.on('drop', function(e) {
            e.preventDefault();
            e.stopPropagation();
            $(this).removeClass('drag-over');
            
            var files = e.originalEvent.dataTransfer.files;
            handleAudioFiles(files);
        });
        
        // 处理音频文件
        function handleAudioFiles(files) {
            if (files.length === 0) return;
            
            var file = files[0];
            var allowedTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/m4a', 'audio/mp4'];
            
            if (!allowedTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|m4a)$/i)) {
                alert('请选择有效的音频文件 (MP3, WAV, M4A)');
                return;
            }
            
            if (file.size > 50 * 1024 * 1024) {
                alert('文件大小不能超过50MB');
                return;
            }
            
            uploadAudioFile(file);
        }
        
        // 上传音频文件到WordPress媒体库
        function uploadAudioFile(file) {
            var formData = new FormData();
            formData.append('file', file);
            formData.append('action', 'upload-attachment');
            formData.append('_wpnonce', $('#_wpnonce').val());
            
            audioDropZone.html('<div class="upload-progress"><span class="dashicons dashicons-update-alt rotating"></span><p>正在上传...</p><div class="progress-bar"><div class="progress-fill" style="width: 0%"></div></div></div>');
            
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                xhr: function() {
                    var xhr = new window.XMLHttpRequest();
                    xhr.upload.addEventListener('progress', function(e) {
                        if (e.lengthComputable) {
                            var percent = (e.loaded / e.total) * 100;
                            $('.progress-fill').css('width', percent + '%');
                        }
                    }, false);
                    return xhr;
                },
                success: function(response) {
                    if (response.success && response.data.url) {
                        $('#audio_url').val(response.data.url);
                        displayAudioFile(file.name, formatFileSize(file.size), response.data.url);
                    } else {
                        alert('上传失败: ' + (response.data.message || '未知错误'));
                        resetAudioDropZone();
                    }
                },
                error: function() {
                    alert('上传失败，请重试');
                    resetAudioDropZone();
                }
            });
        }
        
        // 显示已上传的音频文件
        function displayAudioFile(fileName, fileSize, audioUrl) {
            audioDropZone.addClass('has-file');
            audioDropZone.html(`
                <div class="file-info">
                    <span class="dashicons dashicons-media-audio"></span>
                    <div class="file-details">
                        <div class="file-name">${fileName}</div>
                        <div class="file-size">${fileSize}</div>
                    </div>
                    <div class="file-actions">
                        <button type="button" class="btn-play-audio" title="播放音频">
                            <span class="dashicons dashicons-controls-play"></span>
                        </button>
                        <button type="button" class="btn-remove-file" title="删除音频">
                            <span class="dashicons dashicons-trash"></span>
                        </button>
                    </div>
                </div>
            `);
        }
        
        // 重置上传区域
        function resetAudioDropZone() {
            audioDropZone.removeClass('has-file');
            audioDropZone.html(`
                <div class="upload-placeholder">
                    <span class="dashicons dashicons-cloud-upload"></span>
                    <p class="placeholder-text">拖拽音频文件到这里</p>
                    <p class="placeholder-hint">或点击选择文件</p>
                </div>
            `);
        }
        
        // 格式化文件大小
        function formatFileSize(bytes) {
            if (bytes === 0) return '0 Bytes';
            var k = 1024;
            var sizes = ['Bytes', 'KB', 'MB', 'GB'];
            var i = Math.floor(Math.log(bytes) / Math.log(k));
            return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
        }
        
        // 播放音频按钮
        $(document).on('click', '.btn-play-audio', function(e) {
            e.stopPropagation();
            var audioUrl = $('#audio_url').val();
            
            if (!audioFilePlayer) {
                audioFilePlayer = new Audio(audioUrl);
                $(this).find('.dashicons').removeClass('dashicons-controls-play').addClass('dashicons-controls-pause');
                audioFilePlayer.play();
                
                audioFilePlayer.addEventListener('ended', function() {
                    $('.btn-play-audio .dashicons').removeClass('dashicons-controls-pause').addClass('dashicons-controls-play');
                    audioFilePlayer = null;
                });
            } else {
                if (audioFilePlayer.paused) {
                    audioFilePlayer.play();
                    $(this).find('.dashicons').removeClass('dashicons-controls-play').addClass('dashicons-controls-pause');
                } else {
                    audioFilePlayer.pause();
                    $(this).find('.dashicons').removeClass('dashicons-controls-pause').addClass('dashicons-controls-play');
                }
            }
        });
        
        // 删除音频按钮
        $(document).on('click', '.btn-remove-file', function(e) {
            e.stopPropagation();
            if (confirm('确定要删除这个音频文件吗？')) {
                if (audioFilePlayer) {
                    audioFilePlayer.pause();
                    audioFilePlayer = null;
                }
                $('#audio_url').val('');
                resetAudioDropZone();
            }
        });
    }

    // ============================================
    // 视频/音频状态轮询（自动刷新处理中状态）
    // ============================================
    var pollTimer = null;
    var pollType = null;

    function startStatusPoll() {
        var $processing = $('.dh-status-cell.status-processing');
        if ($processing.length === 0) {
            if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
            return;
        }

        // 判断是视频页面还是音频页面
        if (!pollType) {
            pollType = window.location.href.indexOf('dh-videos') > -1 ? 'video' :
                      window.location.href.indexOf('dh-audios') > -1 ? 'audio' : null;
        }
        if (!pollType) return;

        if (pollTimer) return; // 已在轮询

        pollTimer = setInterval(function() {
            var $cells = $('.dh-status-cell.status-processing');
            if ($cells.length === 0) {
                clearInterval(pollTimer);
                pollTimer = null;
                return;
            }

            var ids = $cells.map(function() { return $(this).data('id'); }).get();

            $.ajax({
                url: dh_admin_vars.ajax_url,
                type: 'POST',
                data: {
                    action: 'dh_poll_status',
                    ids: ids,
                    type: pollType
                },
                success: function(resp) {
                    if (!resp.success) return;
                    $.each(resp.data, function(id, info) {
                        var $cell = $('.dh-status-cell[data-id="' + id + '"]');
                        if ($cell.length && info.status !== 1) {
                            var classes = {
                                0: 'status-pending',
                                2: 'status-success',
                                '-1': 'status-failed'
                            };
                            var newClass = classes[info.status] || 'status-pending';
                            $cell.removeClass('status-processing').addClass(newClass).text(info.label);

                            // 如果处理完成，显示下载链接
                            if (info.status === 2 && info.processed_url) {
                                var $row = $cell.closest('tr');
                                var $linkCell = $row.find('.column-processed_video, .column-processed_audio');
                                if ($linkCell.length && $linkCell.text().trim() === '') {
                                    $linkCell.html('<a href="' + info.processed_url + '" class="cv-btn cv-btn-sm" target="_blank">下载</a>');
                                }
                            }
                        }
                    });
                }
            });
        }, 8000);
    }

    startStatusPoll();

    // ============================================
    // 使用状态下拉框 — 即时保存
    // ============================================
    $(document).on('change', '.use-status-select', function() {
        var $select = $(this);
        var id = $select.data('id');
        var table = $select.data('table');
        var newVal = $select.val();

        $select.prop('disabled', true);

        $.ajax({
            url: dh_admin_vars.ajax_url,
            type: 'POST',
            data: {
                action: 'dh_update_use_status',
                id: id,
                table: table,
                use_status: newVal
            },
            success: function(resp) {
                $select.prop('disabled', false);
                if (!resp.success) {
                    alert(resp.data.message || '更新失败');
                    $select.val($select.data('prev') || '0');
                }
                $select.data('prev', newVal);
            },
            error: function() {
                $select.prop('disabled', false);
            }
        });
    });

    // ============================================
    // 备注编辑弹窗
    // ============================================
    var $remarkModal = null;

    function getRemarkModal() {
        if ($remarkModal) return $remarkModal;
        $remarkModal = $(
            '<div class="dh-remark-modal">' +
            '<div class="modal-content">' +
            '<div class="modal-header">' +
            '<h3>编辑备注</h3>' +
            '<button type="button" class="modal-close">&times;</button>' +
            '</div>' +
            '<div class="modal-body">' +
            '<textarea id="remark-textarea" maxlength="500" placeholder="请输入备注（最多500字）"></textarea>' +
            '<div class="char-count"><span id="remark-char-count">0</span>/500</div>' +
            '</div>' +
            '<div class="modal-footer">' +
            '<button type="button" class="cv-btn btn-cancel">取消</button>' +
            '<button type="button" class="cv-btn cv-btn-primary btn-submit">保存</button>' +
            '</div>' +
            '</div>' +
            '</div>'
        ).appendTo('body');
        return $remarkModal;
    }

    $(document).on('click', '.edit-remark-icon', function() {
        var $icon = $(this);
        var id = $icon.data('id');
        var table = $icon.data('table');
        var currentRemark = $icon.data('remark') || '';

        var $modal = getRemarkModal();
        var $textarea = $modal.find('#remark-textarea');
        $textarea.val(currentRemark);
        $modal.find('#remark-char-count').text(currentRemark.length);

        $modal.data('edit-id', id);
        $modal.data('edit-table', table);
        $modal.data('edit-target', $icon.siblings('.user-remark-text'));

        $modal.show();
        $textarea.focus();

        // 字数统计
        $textarea.off('input').on('input', function() {
            $modal.find('#remark-char-count').text(this.value.length);
        });
    });

    // 关闭弹窗
    $(document).on('click', '.dh-remark-modal .modal-close, .dh-remark-modal .btn-cancel', function() {
        $(this).closest('.dh-remark-modal').hide();
    });

    // 点击遮罩关闭
    $(document).on('click', '.dh-remark-modal', function(e) {
        if (e.target === this) $(this).hide();
    });

    // 保存备注
    $(document).on('click', '.dh-remark-modal .btn-submit', function() {
        var $modal = $(this).closest('.dh-remark-modal');
        var id = $modal.data('edit-id');
        var table = $modal.data('edit-table');
        var $target = $modal.data('edit-target');
        var remark = $modal.find('#remark-textarea').val();

        var $btn = $(this);
        $btn.prop('disabled', true).text('保存中...');

        $.ajax({
            url: dh_admin_vars.ajax_url,
            type: 'POST',
            data: {
                action: 'dh_update_remark',
                id: id,
                table: table,
                remark: remark
            },
            success: function(resp) {
                $btn.prop('disabled', false).text('保存');
                if (resp.success) {
                    var displayText = resp.data.remark || '无备注';
                    $target.text(displayText);
                    $target.siblings('.edit-remark-icon').data('remark', resp.data.remark);
                    $modal.hide();
                } else {
                    alert(resp.data.message || '保存失败');
                }
            },
            error: function() {
                $btn.prop('disabled', false).text('保存');
                alert('网络错误，请重试');
            }
        });
    });

    // ============================================
    // 查看详情弹窗（服务器返回 HTML，避免 JS 拼接 URL 被转义）
    // ============================================
    var detailModal = null;
    function getDetailModal() {
        if (detailModal) return detailModal;
        detailModal = $(
            '<div class="dh-remark-modal dh-detail-modal" style="display:none;">' +
            '<div class="modal-content" style="max-width:640px;">' +
            '<div class="modal-header"><h3>详情</h3><button type="button" class="modal-close">&times;</button></div>' +
            '<div class="modal-body" id="dh-detail-body"><p style="text-align:center;padding:20px;">加载中...</p></div>' +
            '</div></div>'
        ).appendTo('body');
        return detailModal;
    }

    $(document).on('click', '.dh-detail-btn', function() {
        var $btn = $(this);
        var id = $btn.data('id');
        var table = $btn.data('table');

        var $modal = getDetailModal();
        $modal.find('#dh-detail-body').html('<p style="text-align:center;padding:30px;">加载中...</p>');
        $modal.find('.modal-header h3').text('详情');
        $modal.show();

        $.ajax({
            url: dh_admin_vars.ajax_url,
            type: 'POST',
            data: { action: 'dh_get_item_detail', id: id, table: table },
            success: function(resp) {
                if (!resp.success) {
                    $modal.find('#dh-detail-body').html('<p style="text-align:center;color:red;">' + (resp.data.message || '加载失败') + '</p>');
                    return;
                }
                var d = resp.data;
                var lines = [];
                lines.push(row('标题', escHtml(d.title)));

                // 服务器预渲染的 HTML（视频/音频/图片/内容）
                if (d.content_html) lines.push(row('内容', d.content_html));
                if (d.video_html) lines.push(row('视频', d.video_html));
                if (d.audio_html) lines.push(row('音频', d.audio_html));
                if (d.cover_html) lines.push(row('封面', d.cover_html));

                if (d.script_content && !d.content_html) lines.push(row('文案内容', '<pre style="white-space:pre-wrap;max-height:150px;overflow:auto;background:#f5f7fa;padding:10px;border-radius:6px;margin:0;font-size:13px;">' + escHtml(d.script_content) + '</pre>'));

                if (d.digital_human_id) lines.push(row('数字人ID', escHtml(d.digital_human_id)));
                if (d.voice_train_id) lines.push(row('声音训练ID', escHtml(d.voice_train_id)));

                lines.push(row('用户', escHtml(d.username)));
                lines.push(row('创建时间', escHtml(d.create_time)));
                if (d.update_time) lines.push(row('更新时间', escHtml(d.update_time)));
                lines.push(row('消耗积分', d.points_cost));
                if (d.user_remark) lines.push(row('备注', escHtml(d.user_remark)));

                $modal.find('#dh-detail-body').html(lines.join(''));
            },
            error: function() {
                $modal.find('#dh-detail-body').html('<p style="text-align:center;color:red;">网络错误，请重试</p>');
            }
        });
    });

    function row(label, content) {
        return '<div style="padding:10px 0;border-bottom:1px solid #f0f0f0;">' +
            '<div style="font-size:12px;color:#999;margin-bottom:4px;">' + escHtml(label) + '</div>' +
            '<div style="font-size:14px;color:#333;">' + content + '</div></div>';
    }
    function escHtml(s) {
        if (!s) return '';
        return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    }

    // 关闭详情弹窗
    $(document).on('click', '.dh-detail-modal .modal-close', function() {
        $(this).closest('.dh-detail-modal').hide();
    });
    $(document).on('click', '.dh-detail-modal', function(e) {
        if (e.target === this) $(this).hide();
    });

});
