jQuery(document).ready(function($) {
    'use strict';

    // 全局音频播放器实例
    var currentAudio = null;

    /**
     * 音频文件上传处理
     */
    function initMusicUploader() {
        $('#upload_music_button').on('click', function(e) {
            e.preventDefault();
            
            var mediaUploader = wp.media({
                title: '选择音乐文件',
                button: {
                    text: '选择'
                },
                multiple: false,
                library: {
                    type: 'audio'
                }
            });

            mediaUploader.on('select', function() {
                var attachment = mediaUploader.state().get('selection').first().toJSON();
                $('#file_url').val(attachment.url);
                $('#duration').val(Math.round(attachment.duration));
                $('#file_size').val(attachment.filesize);
            });

            mediaUploader.open();
        });
    }

    /**
     * 音频预览功能
     */
    function initMusicPreview() {
        // 试听按钮点击事件
        $(document).on('click', '.preview-music', function(e) {
            e.preventDefault();
            var url = $(this).data('url');
            previewMusic(url);
        });

        // 点击页面其他地方关闭播放器
        $(document).on('click', function(e) {
            var dialog = $('#audio-player-dialog');
            if (!dialog.is(e.target) && dialog.has(e.target).length === 0 && !$(e.target).hasClass('preview-music')) {
                stopAndHidePlayer();
            }
        });
    }

    /**
     * 播放音频
     */
    function previewMusic(url) {
        // 如果有正在播放的音频，先停止
        stopCurrentAudio();

        // 获取或创建音频播放器对话框
        var dialog = $('#audio-player-dialog');
        var player = $('#audio-player')[0];
        
        // 设置音频源并播放
        player.src = url;
        player.play();
        currentAudio = player;
        
        // 显示对话框
        dialog.show();

        // 监听播放结束事件
        player.onended = function() {
            dialog.hide();
            currentAudio = null;
        };
    }

    /**
     * 停止当前音频播放
     */
    function stopCurrentAudio() {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio = null;
        }
    }

    /**
     * 停止并隐藏播放器
     */
    function stopAndHidePlayer() {
        stopCurrentAudio();
        $('#audio-player-dialog').hide();
    }

    /**
     * 批量操作确认
     */
    function initBulkActions() {
        $('#doaction, #doaction2').on('click', function(e) {
            var action = $(this).prev('select').val();
            if (action === 'delete') {
                if (!confirm('确定要删除选中的项目吗？此操作不可恢复。')) {
                    e.preventDefault();
                }
            }
        });
    }

    /**
     * 单个删除确认
     */
    function initDeleteConfirm() {
        $('.delete-item').on('click', function(e) {
            if (!confirm('确定要删除此项吗？此操作不可恢复。')) {
                e.preventDefault();
            }
        });
    }

    /**
     * 表单验证（仅背景音乐表单）
     */
    function initFormValidation() {
        $('form').on('submit', function(e) {
            var $form = $(this);
            var $title = $form.find('#title');

            // 只在表单内有 #title 字段时才验证
            if (!$title.length) return true;

            if (!$title.val()) {
                alert('请输入标题');
                e.preventDefault();
                return false;
            }

            return true;
        });
    }

    /**
     * 状态切换处理
     */
    function initStatusToggle() {
        $('.toggle-status').on('click', function(e) {
            e.preventDefault();
            
            var $this = $(this);
            var itemId = $this.data('id');
            var status = $this.data('status');
            
            $.ajax({
                url: materialManager.ajaxurl,
                type: 'POST',
                data: {
                    action: 'toggle_music_status',
                    id: itemId,
                    status: status,
                    _wpnonce: materialManager.nonce
                },
                success: function(response) {
                    if (response.success) {
                        location.reload();
                    } else {
                        alert(response.data.message || '操作失败');
                    }
                },
                error: function() {
                    alert('网络错误，请重试');
                }
            });
        });
    }

    /**
     * 添加新标签
     */
    function initAddTag() {
        $('#add-tag').click(function(e) {
            e.preventDefault();
            var tagName = $('#new-tag').val().trim();
            if (!tagName) {
                alert('请输入标签名称');
                return;
            }

            $.ajax({
                url: materialManager.ajaxurl,
                type: 'POST',
                data: {
                    action: 'add_material_tag',
                    name: tagName,
                    nonce: materialManager.nonce
                },
                success: function(response) {
                    if (response.success) {
                        var tag = response.data;
                        var html = '<label style="margin-right: 15px;">' +
                            '<input type="checkbox" name="tags[]" value="' + tag.term_id + '" checked>' +
                            tag.name +
                            '</label>';
                        $(html).insertBefore($('.add-tag-container'));
                        $('#new-tag').val('');
                    } else {
                        alert(response.data || '添加标签失败');
                    }
                },
                error: function() {
                    alert('网络错误，请重试');
                }
            });
        });
    }

    /**
     * 初始化所有功能
     */
    function init() {
        initMusicUploader();
        initMusicPreview();
        initBulkActions();
        initDeleteConfirm();
        initFormValidation();
        initStatusToggle();
        initAddTag();
    }

    // 启动
    init();
});
