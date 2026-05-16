jQuery(document).ready(function($) {
    'use strict';
    
    // Image Upload功能
    var mediaUploader;
    
    function openMediaUploader() {
        if (mediaUploader) {
            mediaUploader.open();
            return;
        }
        
        mediaUploader = wp.media({
            title: '选择头像',
            button: {
                text: '使用此图片'
            },
            multiple: false,
            library: {
                type: 'image'
            }
        });
        
        mediaUploader.on('select', function() {
            var attachment = mediaUploader.state().get('selection').first().toJSON();
            updateImagePreview(attachment.url, attachment.id);
        });
        
        mediaUploader.open();
    }
    
    // 点击预览区域上传图片
    $(document).on('click', '#imagePreviewArea:not(.has-image)', openMediaUploader);
    $(document).on('click', '.upload-placeholder', function(e) {
        e.preventDefault();
        e.stopPropagation();
        openMediaUploader();
    });
    
    // 拖拽上传功能 - 使用事件委托以确保动态元素也能工作
    $(document).on('dragenter dragover', '#imagePreviewArea:not(.has-image)', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).addClass('drag-over');
    });
    
    $(document).on('dragleave', '#imagePreviewArea', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).removeClass('drag-over');
    });
    
    $(document).on('drop', '#imagePreviewArea', function(e) {
        e.preventDefault();
        e.stopPropagation();
        $(this).removeClass('drag-over');
        
        if ($(this).hasClass('has-image')) {
            return;
        }
        
        var files = e.originalEvent.dataTransfer.files;
        if (files.length > 0) {
            var file = files[0];
            
            // 验证文件类型
            if (!file.type.match('image.*')) {
                alert('请上传图片文件');
                return;
            }
            
            // 使用WordPress媒体上传器来上传文件
            uploadViaMediaLibrary(file);
        }
    });
    
    // 通过WordPress媒体库上传文件
    function uploadViaMediaLibrary(file) {
        var $previewArea = $('#imagePreviewArea');
        
        // 显示上传中状态
        $previewArea.addClass('uploading').html(
            '<div class="upload-progress">' +
            '<span class="dashicons dashicons-update-alt"></span>' +
            '<p>上传中...</p>' +
            '</div>'
        );
        
        // 创建FormData用于上传
        var formData = new FormData();
        formData.append('file', file);
        formData.append('action', 'ai_role_manager_upload_image');
        formData.append('nonce', aiRoleManager.nonce);
        
        // 上传到WordPress媒体库
        $.ajax({
            url: aiRoleManager.ajaxUrl,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            success: function(response) {
                if (response.success) {
                    // 上传成功，更新预览
                    updateImagePreview(response.data.url, response.data.attachment_id);
                } else {
                    // 上传失败
                    alert(response.data.message || '上传失败，请重试');
                    resetUploadArea();
                }
            },
            error: function(xhr, status, error) {
                console.error('Upload error:', error);
                alert('上传失败，请检查文件格式和大小后重试');
                resetUploadArea();
            }
        });
    }
    
    // 重置上传区域
    function resetUploadArea() {
        var $previewArea = $('#imagePreviewArea');
        $previewArea.removeClass('uploading has-image').html(
            '<div class="upload-placeholder">' +
            '<span class="dashicons dashicons-cloud-upload"></span>' +
            '<p class="placeholder-text">点击或拖拽上传头像</p>' +
            '<p class="placeholder-hint">支持 JPG、PNG 格式，建议尺寸 400x400</p>' +
            '</div>'
        );
    }
    
    // 点击按钮上传
    $(document).on('click', '.upload-image-button', function(e) {
        e.preventDefault();
        openMediaUploader();
    });
    
    // 更新图片预览
    function updateImagePreview(url, attachmentId) {
        var $previewArea = $('#imagePreviewArea');
        
        $('#profile_picture_url').val(url);
        if (attachmentId) {
            $('#pic_attachment_id').val(attachmentId);
        }
        
        $previewArea.removeClass('uploading').addClass('has-image').html(
            '<img src="' + url + '" class="uploaded-image-preview" alt="头像">' +
            '<div class="image-overlay">' +
            '<button type="button" class="btn-preview-image" title="预览">' +
            '<span class="dashicons dashicons-visibility"></span>' +
            '</button>' +
            '<button type="button" class="btn-remove-image" title="删除">' +
            '<span class="dashicons dashicons-trash"></span>' +
            '</button>' +
            '</div>'
        );
        
        $previewArea.find('img').hide().fadeIn(300);
        
        // 触发验证
        $('#profile_picture_url').trigger('change');
    }
    
    // 预览图片
    $(document).on('click', '.btn-preview-image', function(e) {
        e.preventDefault();
        e.stopPropagation();
        var imageUrl = $('#profile_picture_url').val();
        if (imageUrl) {
            showImageLightbox(imageUrl);
        }
    });
    
    // 删除图片
    $(document).on('click', '.btn-remove-image', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        if (!confirm('确定要删除这张图片吗？')) {
            return;
        }
        
        var $previewArea = $('#imagePreviewArea');
        
        $previewArea.fadeOut(200, function() {
            $('#profile_picture_url').val('');
            $('#pic_attachment_id').val('');
            
            $previewArea.removeClass('has-image').html(
                '<div class="upload-placeholder">' +
                '<span class="dashicons dashicons-cloud-upload"></span>' +
                '<p class="placeholder-text">点击或拖拽上传头像</p>' +
                '<p class="placeholder-hint">支持 JPG、PNG 格式，建议尺寸 400x400</p>' +
                '</div>'
            ).fadeIn(200);
            
            // 触发验证
            $('#profile_picture_url').trigger('change');
        });
    });
    
    // 图片灯箱
    function showImageLightbox(imageUrl) {
        var lightboxHtml = 
            '<div class="image-lightbox-modal" id="imageLightbox">' +
            '<div class="lightbox-backdrop"></div>' +
            '<div class="lightbox-container">' +
            '<button class="lightbox-close-btn" title="关闭">' +
            '<span class="dashicons dashicons-no-alt"></span>' +
            '</button>' +
            '<img src="' + imageUrl + '" class="lightbox-image" alt="图片预览">' +
            '</div>' +
            '</div>';
        
        $('body').append(lightboxHtml);
        
        setTimeout(function() {
            $('#imageLightbox').addClass('active');
        }, 10);
        
        $('.lightbox-close-btn, .lightbox-backdrop').on('click', closeLightbox);
        
        $(document).on('keyup.lightbox', function(e) {
            if (e.keyCode === 27) {
                closeLightbox();
            }
        });
    }
    
    function closeLightbox() {
        $('#imageLightbox').removeClass('active');
        setTimeout(function() {
            $('#imageLightbox').remove();
            $(document).off('keyup.lightbox');
        }, 300);
    }
    
    // Display Name唯一性验证
    var displayNameTimeout;
    $('#display_name').on('input', function() {
        clearTimeout(displayNameTimeout);
        var $input = $(this);
        var $message = $input.siblings('.validation-message');
        var displayName = $input.val().trim();
        
        if (!displayName) {
            $message.removeClass('success').text('').hide();
            return;
        }
        
        $message.text('验证中...').show();
        
        displayNameTimeout = setTimeout(function() {
            var currentId = $input.data('current-id') || 0;
            
            $.ajax({
                url: aiRoleManager.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'ai_role_manager_check_display_name',
                    nonce: aiRoleManager.nonce,
                    display_name: displayName,
                    current_id: currentId
                },
                success: function(response) {
                    if (response.success) {
                        $message.addClass('success').text('✓ 展示用户名可用').show();
                    } else {
                        $message.removeClass('success').text('✗ ' + response.data.message).show();
                    }
                },
                error: function() {
                    $message.removeClass('success').text('验证失败，请重试').show();
                }
            });
        }, 500);
    });
    
    // 表单提交
    $('#ai-role-form').on('submit', function(e) {
        e.preventDefault();
        
        var $form = $(this);
        var $submitBtn = $('#submit-button');
        var $message = $('#form-message');
        
        // 验证必填项
        var displayName = $('#display_name').val().trim();
        var userName = $('#user_name').val().trim();
        var profilePicture = $('#profile_picture_url').val().trim();
        
        if (!displayName) {
            showMessage('error', '展示用户名不能为空');
            $('#display_name').focus();
            return;
        }
        
        if (!userName) {
            showMessage('error', '用户名不能为空');
            $('#user_name').focus();
            return;
        }
        
        if (!profilePicture) {
            showMessage('error', '头像图片不能为空');
            return;
        }
        
        // 禁用提交按钮
        $submitBtn.prop('disabled', true).html(
            '<span class="dashicons dashicons-update-alt" style="animation: spin 1s linear infinite;"></span> 提交中...'
        );
        
        // 提交数据
        $.ajax({
            url: aiRoleManager.ajaxUrl,
            type: 'POST',
            data: $form.serialize() + '&action=ai_role_manager_submit',
            success: function(response) {
                if (response.success) {
                    showMessage('success', response.data.message);
                    setTimeout(function() {
                        window.location.href = response.data.redirect;
                    }, 1000);
                } else {
                    showMessage('error', response.data.message);
                    $submitBtn.prop('disabled', false).html(
                        '<span class="dashicons dashicons-saved"></span> ' + 
                        ($form.find('[name="role_id"]').length ? '更新角色' : '创建角色')
                    );
                }
            },
            error: function() {
                showMessage('error', '提交失败，请重试');
                $submitBtn.prop('disabled', false).html(
                    '<span class="dashicons dashicons-saved"></span> ' + 
                    ($form.find('[name="role_id"]').length ? '更新角色' : '创建角色')
                );
            }
        });
    });
    
    function showMessage(type, message) {
        var $message = $('#form-message');
        $message.removeClass('success error').addClass(type).text(message).fadeIn();
        
        setTimeout(function() {
            $message.fadeOut();
        }, 5000);
    }
    
    // 查看角色详情
    $(document).on('click', '.view-role', function(e) {
        e.preventDefault();
        var roleId = $(this).data('role-id');
        
        $('#role-detail-content').html(
            '<div class="loading-spinner">' +
            '<span class="dashicons dashicons-update-alt"></span>' +
            '<p>加载中...</p>' +
            '</div>'
        );
        
        $('#role-detail-modal').addClass('active');
        
        $.ajax({
            url: aiRoleManager.ajaxUrl,
            type: 'POST',
            data: {
                action: 'ai_role_manager_get_role',
                nonce: aiRoleManager.nonce,
                role_id: roleId
            },
            success: function(response) {
                if (response.success) {
                    var role = response.data.role;
                    var html = '<div class="role-detail">';
                    
                    if (role.profile_picture_url) {
                        html += '<div class="role-detail-avatar"><img src="' + role.profile_picture_url + '" alt="头像"></div>';
                    }
                    
                    html += '<table class="role-detail-table">';
                    html += '<tr><th>ID</th><td>' + role.id + '</td></tr>';
                    html += '<tr><th>展示用户名</th><td>' + role.display_name + '</td></tr>';
                    html += '<tr><th>用户名</th><td>' + role.user_name + '</td></tr>';
                    
                    if (role.user_id) {
                        html += '<tr><th>用户ID</th><td>' + role.user_id + '</td></tr>';
                    }
                    
                    if (role.permalink) {
                        html += '<tr><th>个人主页</th><td><a href="' + role.permalink + '" target="_blank">' + role.permalink + '</a></td></tr>';
                    }
                    
                    html += '<tr><th>积分</th><td>' + role.credit + '</td></tr>';
                    html += '<tr><th>生成状态</th><td>' + getGenStatusText(role.gen_status) + (role.gen_time ? '<br><small style="color:#9ca3af;">' + role.gen_time + '</small>' : '') + '</td></tr>';
                    html += '<tr><th>状态</th><td>' + getStatusText(role.status) + '</td></tr>';
                    html += '<tr><th>使用状态</th><td>' + getUseStatusText(role.use_status) + '</td></tr>';
                    html += '<tr><th>积分状态</th><td>' + getCreditStatusText(role.credit_status) + '</td></tr>';
                    html += '<tr><th>来源</th><td>' + (role.source == 1 ? '用户生成' : '系统生成') + '</td></tr>';
                    
                    if (role.remark) {
                        html += '<tr><th>备注</th><td>' + role.remark + '</td></tr>';
                    }
                    
                    if (role.user_remark) {
                        html += '<tr><th>用户备注</th><td>' + role.user_remark + '</td></tr>';
                    }
                    
                    html += '<tr><th>创建时间</th><td>' + role.create_time + '</td></tr>';
                    html += '<tr><th>更新时间</th><td>' + role.update_time + '</td></tr>';
                    html += '</table></div>';
                    
                    $('#role-detail-content').html(html);
                } else {
                    $('#role-detail-content').html('<p class="error">' + response.data.message + '</p>');
                }
            },
            error: function() {
                $('#role-detail-content').html('<p class="error">加载失败，请重试</p>');
            }
        });
    });
    
    // 关闭模态框
    $(document).on('click', '.role-modal-close, .role-modal-overlay', function() {
        $('#role-detail-modal').removeClass('active');
    });
    
    // 删除角色
    $(document).on('click', '.delete-role', function(e) {
        e.preventDefault();
        var roleId = $(this).data('role-id');
        var roleName = $(this).data('role-name');
        
        if (!confirm('确定要删除角色 "' + roleName + '" 吗？')) {
            return;
        }
        
        $.ajax({
            url: aiRoleManager.ajaxUrl,
            type: 'POST',
            data: {
                action: 'ai_role_manager_delete_role',
                nonce: aiRoleManager.nonce,
                role_id: roleId
            },
            success: function(response) {
                if (response.success) {
                    $('tr[data-role-id="' + roleId + '"]').fadeOut(function() {
                        $(this).remove();
                    });
                    alert(response.data.message);
                } else {
                    alert(response.data.message);
                }
            },
            error: function() {
                alert('删除失败，请重试');
            }
        });
    });
    
    // Helper functions
    function getGenStatusText(status) {
        var statusMap = {
            0: '<span class="status-badge gen-status-pending"><span class="dashicons dashicons-clock"></span> 排队中</span>',
            1: '<span class="status-badge gen-status-processing"><span class="dashicons dashicons-update"></span> 生成中</span>',
            2: '<span class="status-badge gen-status-success"><span class="dashicons dashicons-yes-alt"></span> 生成成功</span>',
            '-1': '<span class="status-badge gen-status-failed"><span class="dashicons dashicons-dismiss"></span> 生成失败</span>'
        };
        return statusMap[status] || '<span class="status-badge">未知</span>';
    }
    
    function getStatusText(status) {
        switch(parseInt(status)) {
            case 1: return '正常';
            case 0: return '停用';
            case -1: return '废弃';
            default: return '未知';
        }
    }
    
    function getUseStatusText(status) {
        switch(parseInt(status)) {
            case 0: return '未使用';
            case 1: return '已使用';
            case -1: return '已废弃';
            default: return '未知';
        }
    }
    
    function getCreditStatusText(status) {
        switch(parseInt(status)) {
            case 1: return '正常';
            case 0: return '停用';
            case -1: return '已退还';
            default: return '未知';
        }
    }
});
