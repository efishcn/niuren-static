jQuery(document).ready(function($) {
    'use strict';

    var currentAudio = null;
    var MM = materialManager;

    // 映射 data-manager-type 到 AJAX action
    var TYPE_ACTION_MAP = {
        'background-music': 'save_background_music',
        'materials': 'save_material',
        'copy-images': 'save_copy_image',
        'videos': 'save_video',
        'voices': 'save_voice',
        'video-styles': 'save_video_style'
    };

    var TYPE_PAGE_MAP = {
        'background-music': 'material-manager-background-music',
        'materials': 'material-manager-materials',
        'copy-images': 'material-manager-copy-images',
        'videos': 'material-manager-videos',
        'voices': 'material-manager-voices',
        'video-styles': 'material-manager-video-styles'
    };

    // SweetAlert2 toast
    function showToast(icon, title) {
        Swal.fire({ icon: icon, title: title, toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true });
    }

    // ========== Media Uploaders ==========
    var uploaders = {};

    function getUploader(id, options) {
        if (!uploaders[id]) {
            uploaders[id] = wp.media({
                title: options.title || '选择文件',
                button: { text: options.buttonText || '选择' },
                multiple: false,
                library: { type: options.libraryType || '' }
            });
        }
        return uploaders[id];
    }

    // 背景音乐上传
    $(document).on('click', '#upload_music_button', function(e) {
        e.preventDefault();
        var uploader = getUploader('music', { title: '选择音乐文件', libraryType: 'audio' });
        uploader.off('select').on('select', function() {
            var attachment = uploader.state().get('selection').first().toJSON();
            $('#file_url').val(attachment.url);
            $('#file_id').val(attachment.id);
            $('#duration').val(Math.round(attachment.duration || 0));
            $('#file_size').val(attachment.filesize || 0);
        });
        uploader.open();
    });

    // 素材上传（图片/视频）
    $(document).on('click', '#upload-file', function(e) {
        e.preventDefault();
        var uploader = getUploader('material', { title: '选择文件', buttonText: '使用此文件', libraryType: ['image', 'video'] });
        uploader.off('select').on('select', function() {
            var attachment = uploader.state().get('selection').first().toJSON();
            $('#file_url').val(attachment.url);
            $('#file_id').val(attachment.id);
            $('#file_size').val(attachment.filesize || 0);
            var type = attachment.type === 'image' ? 1 : 2;
            $('#type').val(type);
            if (attachment.width) {
                $('#width').val(attachment.width);
                $('#height').val(attachment.height);
                $('#orientation').val(attachment.width > attachment.height ? 1 : 2);
            }
            if (type === 2 && attachment.duration) {
                $('#duration').val(Math.round(attachment.duration));
            }
            updatePreview(attachment, '#file-preview');
        });
        uploader.open();
    });

    // 文案配图上传
    $(document).on('click', '#upload-image', function(e) {
        e.preventDefault();
        var uploader = getUploader('copyimage', { title: '选择图片', buttonText: '使用此图片', libraryType: 'image' });
        uploader.off('select').on('select', function() {
            var attachment = uploader.state().get('selection').first().toJSON();
            $('#image_url').val(attachment.url);
            $('#image_id').val(attachment.id);
            $('#image-preview').html('<img src="' + attachment.url + '" style="max-width:200px;">');
        });
        uploader.open();
    });

    // 视频上传
    $(document).on('click', '#upload-video', function(e) {
        e.preventDefault();
        var uploader = getUploader('video', { title: '选择视频', buttonText: '使用此视频', libraryType: 'video' });
        uploader.off('select').on('select', function() {
            var attachment = uploader.state().get('selection').first().toJSON();
            if (attachment.type !== 'video') { showToast('warning', '请选择视频文件'); return; }
            $('#file_url').val(attachment.url);
            $('#file_id').val(attachment.id);
            $('#file_size').val(attachment.filesize || 0);
            if (attachment.duration) $('#duration').val(Math.round(attachment.duration));
            updatePreview(attachment, '#video-preview');
        });
        uploader.open();
    });

    // 封面上传
    $(document).on('click', '#upload-cover', function(e) {
        e.preventDefault();
        var uploader = getUploader('cover', { title: '选择封面', buttonText: '使用此图片', libraryType: 'image' });
        uploader.off('select').on('select', function() {
            var attachment = uploader.state().get('selection').first().toJSON();
            $('#cover_url').val(attachment.url);
            $('#cover_id').val(attachment.id);
            $('#cover-preview').html('<img src="' + attachment.url + '" style="max-width:200px;">');
        });
        uploader.open();
    });

    function updatePreview(attachment, container) {
        var preview = '';
        if (attachment.type === 'image') {
            preview = '<img src="' + attachment.url + '" style="max-width:200px;">';
        } else if (attachment.type === 'video') {
            preview = '<video src="' + attachment.url + '" style="max-width:200px;" controls></video>';
        }
        $(container).html(preview);
    }

    // ========== AJAX Form Submission ==========
    $(document).on('submit', 'form[data-ajax="true"]', function(e) {
        e.preventDefault();
        var $form = $(this);
        var type = $form.data('manager-type');
        var action = TYPE_ACTION_MAP[type];
        if (!action) return;

        var $btn = $form.find('input[type="submit"], button[type="submit"]');
        $btn.prop('disabled', true).val(MM.strings.saving || '保存中...');

        var postData = $form.serialize() + '&action=' + encodeURIComponent(action) + '&_wpnonce=' + encodeURIComponent(MM.nonce);

        $.post(MM.ajaxurl, postData, function(response) {
            $btn.prop('disabled', false).val($btn.data('orig-value') || $btn.val());
            if (response.success) {
                Swal.fire({ icon: 'success', title: response.data.message || MM.strings.saved, showConfirmButton: false, timer: 1500 })
                    .then(function() {
                        if (response.data.redirect) {
                            window.location.href = response.data.redirect;
                        }
                    });
            } else {
                Swal.fire({ icon: 'error', title: MM.strings.error, text: response.data.message || '' });
            }
        }).fail(function() {
            $btn.prop('disabled', false);
            Swal.fire({ icon: 'error', title: MM.strings.error, text: '网络错误，请重试' });
        });
    });

    // ========== Inline Status Toggle ==========
    $(document).on('click', '.toggle-status', function(e) {
        e.preventDefault();
        var $el = $(this);
        var id = $el.data('id');
        var status = $el.data('status');
        var type = $el.data('type') || 'music';

        var actionMap = {
            'music': 'toggle_music_status',
            'voice': 'toggle_voice_status',
            'video_style': 'toggle_video_style_status',
            'material': 'toggle_material_status',
            'copy_image': 'toggle_copy_image_status',
            'video': 'toggle_video_status'
        };

        $.post(MM.ajaxurl, {
            action: actionMap[type] || 'toggle_music_status',
            id: id,
            status: status,
            _wpnonce: MM.nonce
        }, function(response) {
            if (response.success) {
                var newStatus = status == 1 ? 0 : 1;
                $el.data('status', newStatus);
                if (newStatus == 1) {
                    $el.removeClass('status-inactive').addClass('status-active').text('启用');
                } else {
                    $el.removeClass('status-active').addClass('status-inactive').text('禁用');
                }
                showToast('success', '状态已更新');
            } else {
                showToast('error', response.data.message || MM.strings.error);
            }
        });
    });

    // Toggle hot
    $(document).on('click', '.toggle-hot', function(e) {
        e.preventDefault();
        var $el = $(this);
        var id = $el.data('id');
        var hot = $el.data('hot');
        var type = $el.data('type') || 'music';

        var actionMap = {
            'music': 'toggle_music_hot',
            'voice': 'toggle_voice_hot',
            'video_style': 'toggle_video_style_hot',
            'material': 'toggle_material_hot',
            'copy_image': 'toggle_copy_image_hot',
            'video': 'toggle_video_hot'
        };
        var action = actionMap[type];
        if (!action) { showToast('warning', '暂不支持此操作'); return; }

        $.post(MM.ajaxurl, {
            action: action,
            id: id,
            hot: hot,
            _wpnonce: MM.nonce
        }, function(response) {
            if (response.success) {
                var newHot = hot == 1 ? 0 : 1;
                $el.data('hot', newHot);
                $el.text(newHot == 1 ? '取消热门' : '设为热门');
                showToast('success', '已更新');
            } else {
                showToast('error', response.data.message || MM.strings.error);
            }
        });
    });

    // Toggle recommend
    $(document).on('click', '.toggle-recommend', function(e) {
        e.preventDefault();
        var $el = $(this);
        var id = $el.data('id');
        var recommend = $el.data('recommend');
        var type = $el.data('type') || 'music';

        var actionMap = {
            'music': 'toggle_music_recommend',
            'voice': 'toggle_voice_recommend',
            'video_style': 'toggle_video_style_recommend',
            'material': 'toggle_material_recommend',
            'copy_image': 'toggle_copy_image_recommend',
            'video': 'toggle_video_recommend'
        };
        var action = actionMap[type];
        if (!action) { showToast('warning', '暂不支持此操作'); return; }

        $.post(MM.ajaxurl, {
            action: action,
            id: id,
            recommend: recommend,
            _wpnonce: MM.nonce
        }, function(response) {
            if (response.success) {
                var newRec = recommend == 1 ? 0 : 1;
                $el.data('recommend', newRec);
                $el.text(newRec == 1 ? '取消推荐' : '设为推荐');
                showToast('success', '已更新');
            } else {
                showToast('error', response.data.message || MM.strings.error);
            }
        });
    });

    // ========== Set Default ==========
    $(document).on('click', '.set-default', function(e) {
        e.preventDefault();
        var $el = $(this);
        var id = $el.data('id');
        var type = $el.data('type') || 'music';

        var actionMap = {
            'music': 'set_default_bgm',
            'voice': 'set_default_voice',
            'video_style': 'set_default_video_style',
            'material': 'set_default_material',
            'copy_image': 'set_default_copy_image',
            'video': 'set_default_video'
        };
        var action = actionMap[type];
        if (!action) { showToast('warning', '暂不支持此操作'); return; }

        $.post(MM.ajaxurl, {
            action: action,
            id: id,
            _wpnonce: MM.nonce
        }, function(response) {
            if (response.success) {
                $('.is-default-icon').html('');
                $el.closest('tr').find('.is-default-icon').html('<span class="dashicons dashicons-yes" style="color:#46b450;"></span>');
                showToast('success', '已设为默认');
            } else {
                showToast('error', response.data.message || MM.strings.error);
            }
        });
    });

    // ========== Delete Item ==========
    $(document).on('click', '.delete-item', function(e) {
        e.preventDefault();
        var $el = $(this);
        var id = $el.data('id');
        var type = $el.data('type') || 'music';
        var $row = $el.closest('tr');

        var actionMap = {
            'music': 'delete_music',
            'voice': 'delete_voice',
            'video_style': 'delete_video_style'
        };

        Swal.fire({
            title: MM.strings.confirmDelete,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: '确定',
            cancelButtonText: '取消'
        }).then(function(result) {
            if (!result.isConfirmed) return;

            $.post(MM.ajaxurl, {
                action: actionMap[type] || 'delete_music',
                id: id,
                _wpnonce: MM.nonce
            }, function(response) {
                if (response.success) {
                    $row.fadeOut(300, function() { $(this).remove(); });
                    showToast('success', '删除成功');
                } else {
                    showToast('error', response.data.message || MM.strings.error);
                }
            });
        });
    });

    // ========== Bulk Actions ==========
    $(document).on('click', '#doaction, #doaction2', function(e) {
        var $btn = $(this);
        var $sel = $btn.prev('select');
        var action = $sel.val();
        if (!action || action === '-1') return;

        if (action === 'delete') {
            e.preventDefault();
            var $checkboxes = $('input[name="id[]"]:checked');
            if ($checkboxes.length === 0) {
                showToast('warning', MM.strings.noSelection);
                return;
            }

            Swal.fire({
                title: MM.strings.confirmBulk,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: '确定',
                cancelButtonText: '取消'
            }).then(function(result) {
                if (!result.isConfirmed) return;

                var ids = $checkboxes.map(function() { return $(this).val(); }).get();
                var type = $sel.closest('form').find('input[name="page"]').val() || '';
                var bulkActionMap = {
                    'material-manager-background-music': 'bulk_update_music',
                    'material-manager-voices': 'bulk_update_voice',
                    'material-manager-video-styles': 'bulk_update_video_style',
                    'material-manager-materials': 'bulk_update_material',
                    'material-manager-copy-images': 'bulk_update_copy_image',
                    'material-manager-videos': 'bulk_update_video'
                };

                $.post(MM.ajaxurl, {
                    action: bulkActionMap[type] || 'bulk_update_music',
                    bulk_action: action,
                    ids: ids,
                    _wpnonce: MM.nonce
                }, function(response) {
                    if (response.success) {
                        showToast('success', response.data.message);
                        setTimeout(function() { location.reload(); }, 1500);
                    } else {
                        showToast('error', response.data.message || MM.strings.error);
                    }
                });
            });
        }
    });

    // ========== Audio Preview ==========
    function ensureAudioPlayer() {
        if ($('#audio-player-dialog').length) return;
        var dialog = $('<div id="audio-player-dialog" style="display:none;position:fixed;bottom:20px;right:20px;background:#fff;padding:15px;border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.2);z-index:99999;">' +
            '<div style="display:flex;align-items:center;gap:10px;">' +
            '<audio id="audio-player" controls style="width:300px;"></audio>' +
            '<button type="button" class="button" id="close-audio-player">&times;</button>' +
            '</div></div>');
        $('body').append(dialog);
    }

    $(document).on('click', '.preview-music', function(e) {
        e.preventDefault();
        var url = $(this).data('url');
        ensureAudioPlayer();
        stopCurrentAudio();
        var player = $('#audio-player')[0];
        player.src = url;
        player.play();
        currentAudio = player;
        $('#audio-player-dialog').show();
        player.onended = function() {
            $('#audio-player-dialog').hide();
            currentAudio = null;
        };
    });

    $(document).on('click', '#close-audio-player', function() {
        stopAndHidePlayer();
    });

    $(document).on('click', function(e) {
        var dialog = $('#audio-player-dialog');
        if (dialog.is(':visible') && !dialog.is(e.target) && dialog.has(e.target).length === 0 && !$(e.target).hasClass('preview-music')) {
            stopAndHidePlayer();
        }
    });

    function stopCurrentAudio() {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio = null;
        }
    }

    function stopAndHidePlayer() {
        stopCurrentAudio();
        $('#audio-player-dialog').hide();
    }

    // ========== Tag Management ==========
    $(document).on('click', '#add-tag', function(e) {
        e.preventDefault();
        var $input = $('#new-tag');
        var tagName = $input.val().trim();
        if (!tagName) { showToast('warning', '请输入标签名称'); return; }

        $.post(MM.ajaxurl, {
            action: 'add_material_tag',
            name: tagName,
            nonce: MM.nonce
        }, function(response) {
            if (response.success) {
                if ($('input[type="checkbox"][value="' + response.data.term_id + '"]').length === 0) {
                    $('.tags-container').append(
                        '<label style="margin-right:15px;">' +
                        '<input type="checkbox" name="tags[]" value="' + response.data.term_id + '" checked> ' +
                        response.data.name +
                        '</label>'
                    );
                }
                $input.val('');
                showToast('success', '标签已添加');
            } else {
                showToast('error', response.data || '添加标签失败');
            }
        });
    });

    // ========== Video Settings Toggle ==========
    $(document).on('change', 'input[name="auto_subtitle"]', function() {
        $('.subtitle-settings').toggle($(this).is(':checked'));
    });
    $(document).on('change', 'input[name="auto_cover"]', function() {
        $('.cover-settings').toggle($(this).is(':checked'));
    });

    // ========== Init: save original button values ==========
    $('form[data-ajax="true"]').find('input[type="submit"], button[type="submit"]').each(function() {
        $(this).data('orig-value', $(this).val());
    });
});
