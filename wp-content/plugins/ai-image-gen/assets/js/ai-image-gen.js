jQuery(document).ready(function($) {
    var currentRecordId = null;
    
    // 表单提交处理
    $('#ai-image-gen-form').on('submit', function(e) {
        e.preventDefault();
        
        var formData = $(this).serialize();
        var submitBtn = $(this).find('button[type="submit"]');
        var originalText = submitBtn.html();
        
        // 禁用提交按钮并显示加载状态
        submitBtn.prop('disabled', true).html('<span class="dashicons dashicons-update-alt" style="animation: spin 1s linear infinite;"></span> 提交中...');
        
        $.ajax({
            url: aiImageGenAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'ai_image_gen_ajax_submit',
                form_data: formData,
                nonce: aiImageGenAjax.nonce
            },
            success: function(response) {
                if (response.success) {
                    alert(response.data.message);
                    if (response.data.redirect_url) {
                        window.location.href = response.data.redirect_url;
                    }
                } else {
                    if (response.data && response.data.code === 'gate_blocked' && window.MembershipGateFrontend) {
                        MembershipGateFrontend.handleBlock(response.data);
                    } else {
                        alert('错误: ' + response.data.message);
                    }
                    submitBtn.prop('disabled', false).html(originalText);
                }
            },
            error: function(xhr, status, error) {
                alert('提交失败: ' + error);
                submitBtn.prop('disabled', false).html(originalText);
            }
        });
    });
    
    // View Details Button Click Handler
    $(document).on('click', '.view-ai-image-details-btn', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        var btn = $(this);
        var scrollTop = $(window).scrollTop();
        
        currentRecordId = btn.data('id');
        var ideaDesc = btn.data('idea-desc');
        var imagePath = btn.data('image-path');
        var status = btn.data('status');
        var model = btn.data('model');
        
        // Fill modal with basic info
        $('#modal-idea-desc').text(ideaDesc);
        $('#modal-model').text(model || '-');

        // Fill publish info
        var publishTitle = btn.data('publish-title');
        var publishDesc = btn.data('publish-desc');
        if (publishTitle || publishDesc) {
            $('#modal-publish-title').text(publishTitle || '-');
            $('#modal-publish-desc').text(publishDesc || '-');
            $('#modal-publish-section').show();
        } else {
            $('#modal-publish-section').hide();
        }
        
        // Get current use status and remark from table row
        var row = btn.closest('tr');
        var useStatusSelect = row.find('.use-status-select');
        var useStatus = useStatusSelect.length ? useStatusSelect.val() : '0';
        var remarkText = row.find('.user-remark-text').text();
        var remark = remarkText === '无备注' ? '' : remarkText;
        
        $('#modal-use-status').val(useStatus);
        $('#modal-user-remark').val(remark);
        
        // Load image content via AJAX
        $('#modal-image-content').html('<div class="loading-spinner"><span class="dashicons dashicons-update-alt"></span><p>加载中...</p></div>');
        $('#modal-source-images-content').html('');
        $('#modal-source-images-section').hide();
        
        $.ajax({
            url: aiImageGenAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'get_ai_image_content',
                id: currentRecordId,
                nonce: aiImageGenAjax.nonce
            },
            success: function(response) {
                console.log('AJAX Response:', response);
                if (response.success) {
                    // 显示发布信息
                    if (response.data.publish_content) {
                        $('#modal-publish-section').show();
                        // publish_content HTML已经包含标题和描述
                        // 如果modal中已有publish信息，更新它
                        var publishHtml = $(response.data.publish_content);
                        var title = publishHtml.find('.publish-title').text();
                        var desc = publishHtml.find('.publish-desc').text();
                        if (title) $('#modal-publish-title').text(title);
                        if (desc) $('#modal-publish-desc').text(desc);
                    }

                    // 更新生成参数区域
                    if (response.data.params_html) {
                        $('#modal-params').html(response.data.params_html);
                    }

                    // 根据单图/多图调整模态框样式
                    if (response.data.is_single_image) {
                        $('#modal-image-content').addClass('single-image-mode');
                    } else {
                        $('#modal-image-content').removeClass('single-image-mode');
                    }

                    // 显示图片详情HTML
                    if (response.data.image_info_html) {
                        $('#modal-image-content').html(response.data.image_info_html + response.data.image_content);
                    } else {
                        $('#modal-image-content').html(response.data.image_content);
                    }

                    // Load and display source images if available
                    console.log('Source images content:', response.data.source_images_content);
                    if (response.data.source_images_content && response.data.source_images_content.trim() !== '') {
                        $('#modal-source-images-content').html(response.data.source_images_content);
                        $('#modal-source-images-section').show();
                        console.log('Source images section shown');

                        // Bind image click events for lightbox
                        bindImageLightbox();
                    } else {
                        console.log('No source images to display');
                        $('#modal-source-images-section').hide();
                    }

                    // 绑定生成图片的灯箱事件
                    bindGeneratedImageLightbox();
                } else {
                    $('#modal-image-content').html('<div class="error-message">加载失败: ' + response.data + '</div>');
                }
            },
            error: function() {
                $('#modal-image-content').html('<div class="error-message">加载失败，请重试</div>');
            }
        });
        
        // Store scroll position
        $('#ai-image-detail-modal').data('scrollTop', scrollTop);
        
        // Show modal
        $('#ai-image-detail-modal').fadeIn(300);
        $('body').addClass('modal-open');
    });
    
    // Close Modal Handlers - use event delegation
    $(document).on('click', '.ai-image-modal-close, .ai-image-modal-overlay', function(e) {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
    });
    
    // Close modal on ESC key
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape' && $('#ai-image-detail-modal').is(':visible')) {
            e.preventDefault();
            closeModal();
        }
    });
    
    function closeModal() {
        var scrollTop = $('#ai-image-detail-modal').data('scrollTop');
        if (scrollTop === undefined || scrollTop === null) {
            scrollTop = 0;
        }
        
        // Hide modal and restore scroll
        $('#ai-image-detail-modal').fadeOut(300, function() {
            $('body').removeClass('modal-open');
            window.scrollTo(0, scrollTop);
        });
        currentRecordId = null;
    }
    
    // Modal Use Status Change Handler
    $('#modal-use-status').on('change', function() {
        if (!currentRecordId) return;
        
        var useStatus = $(this).val();
        var selectElement = $(this);
        
        $.ajax({
            url: aiImageGenAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'update_ai_image_use_status',
                record_id: currentRecordId,
                use_status: useStatus,
                nonce: aiImageGenAjax.nonce
            },
            success: function(response) {
                if (response.success) {
                    // Update the table row select
                    $('.use-status-select[data-id="' + currentRecordId + '"]').val(useStatus);
                    
                    // Show brief success indicator
                    selectElement.css('border-color', '#00a32a');
                    setTimeout(function() {
                        selectElement.css('border-color', '');
                    }, 1000);
                } else {
                    alert('更新失败: ' + response.data);
                }
            },
            error: function() {
                alert('更新失败，请重试');
            }
        });
    });
    
    // Save Remark Button Handler
    $('#save-remark-btn').on('click', function() {
        if (!currentRecordId) return;
        
        var userRemark = $('#modal-user-remark').val().trim();
        var btn = $(this);
        var originalHtml = btn.html();
        
        btn.prop('disabled', true).html('<span class="dashicons dashicons-update-alt" style="animation: spin 1s linear infinite;"></span> 保存中...');
        
        $.ajax({
            url: aiImageGenAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'update_ai_image_user_remark',
                record_id: currentRecordId,
                user_remark: userRemark,
                nonce: aiImageGenAjax.nonce
            },
            success: function(response) {
                if (response.success) {
                    // Update the table row remark
                    var remarkText = $('.ai-edit-remark-icon[data-id="' + currentRecordId + '"]').siblings('.user-remark-text');
                    remarkText.text(userRemark || '无备注');
                    $('.ai-edit-remark-icon[data-id="' + currentRecordId + '"]').data('remark', userRemark);
                    
                    // Show success feedback
                    btn.html('<span class="dashicons dashicons-yes"></span> 保存成功');
                    setTimeout(function() {
                        btn.prop('disabled', false).html(originalHtml);
                    }, 2000);
                } else {
                    alert('更新失败: ' + response.data);
                    btn.prop('disabled', false).html(originalHtml);
                }
            },
            error: function() {
                alert('更新失败，请重试');
                btn.prop('disabled', false).html(originalHtml);
            }
        });
    });
    
    // 使用状态下拉框变更处理
    $('.use-status-select').on('change', function() {
        var recordId = $(this).data('id');
        var useStatus = $(this).val();
        
        $.ajax({
            url: aiImageGenAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'update_ai_image_use_status',
                record_id: recordId,
                use_status: useStatus,
                nonce: aiImageGenAjax.nonce
            },
            success: function(response) {
                if (response.success) {
                    // 显示成功提示（可选）
                } else {
                    alert('更新失败: ' + response.data);
                }
            },
            error: function() {
                alert('更新失败，请重试');
            }
        });
    });
    
    // 编辑备注图标点击处理
    $(document).on('click', '.ai-edit-remark-icon', function() {
        var recordId = $(this).data('id');
        var currentRemark = $(this).data('remark');
        var remarkText = $(this).siblings('.user-remark-text');
        
        var newRemark = prompt('请输入备注信息（最多500字）:', currentRemark);
        
        if (newRemark !== null && newRemark !== currentRemark) {
            $.ajax({
                url: aiImageGenAjax.ajaxurl,
                type: 'POST',
                data: {
                    action: 'update_ai_image_user_remark',
                    record_id: recordId,
                    user_remark: newRemark,
                    nonce: aiImageGenAjax.nonce
                },
                success: function(response) {
                    if (response.success) {
                        remarkText.text(newRemark || '无备注');
                        $(this).data('remark', newRemark);
                        alert('备注更新成功');
                    } else {
                        alert('更新失败: ' + response.data);
                    }
                },
                error: function() {
                    alert('更新失败，请重试');
                }
            });
        }
    });
    
    // 重新提交按钮点击处理
    $(document).on('click', '.ai-image-resubmit-btn', function() {
        if (!confirm('确定要重新提交此图片生成任务吗？')) {
            return;
        }
        
        var btn = $(this);
        var recordId = btn.data('id');
        var originalHtml = btn.html();
        
        btn.prop('disabled', true).html('<span class="dashicons dashicons-update-alt" style="animation: spin 1s linear infinite;"></span> 提交中...');
        
        $.ajax({
            url: aiImageGenAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'ai_image_gen_resubmit',
                record_id: recordId,
                nonce: aiImageGenAjax.nonce
            },
            success: function(response) {
                if (response.success) {
                    alert('重新提交成功！');
                    location.reload();
                } else {
                    alert('重新提交失败: ' + response.data);
                    btn.prop('disabled', false).html(originalHtml);
                }
            },
            error: function() {
                alert('重新提交失败，请重试');
                btn.prop('disabled', false).html(originalHtml);
            }
        });
    });
    
    // Image Lightbox Function - for source images
    function bindImageLightbox() {
        $('.image-item').off('click').on('click', function() {
            var imageUrl = $(this).data('image-url');
            showImageLightbox(imageUrl);
        });
    }

    // Image Lightbox Function - for generated images
    function bindGeneratedImageLightbox() {
        $('.generated-image').off('click').on('click', function() {
            var imageUrl = $(this).data('full-url') || $(this).attr('src');
            showImageLightbox(imageUrl);
        });
    }

    function showImageLightbox(imageUrl) {
        // Remove existing lightbox
        $('#image-lightbox').remove();
        
        // Create lightbox HTML
        var lightboxHtml = '<div id="image-lightbox" class="image-lightbox">' +
            '<div class="lightbox-overlay"></div>' +
            '<div class="lightbox-content">' +
            '<button class="lightbox-close">&times;</button>' +
            '<img src="' + imageUrl + '" alt="参考图片" class="lightbox-image">' +
            '</div></div>';
        
        // Append to body
        $('body').append(lightboxHtml);
        
        // Show lightbox with animation
        setTimeout(function() {
            $('#image-lightbox').addClass('active');
        }, 10);
        
        // Bind close events
        $('#image-lightbox .lightbox-close, #image-lightbox .lightbox-overlay').on('click', function() {
            closeImageLightbox();
        });
        
        // Close on ESC key
        $(document).on('keyup.lightbox', function(e) {
            if (e.keyCode === 27) {
                closeImageLightbox();
            }
        });
    }
    
    function closeImageLightbox() {
        $('#image-lightbox').removeClass('active');
        setTimeout(function() {
            $('#image-lightbox').remove();
            $(document).off('keyup.lightbox');
        }, 300);
    }

    // 复制按钮功能 - 使用原生 Clipboard API
    $(document).on('click', '.copy-btn', function(e) {
        e.preventDefault();
        var targetId = $(this).data('clipboard-target');
        var targetElement = $(targetId);
        var textToCopy = targetElement.text();

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(textToCopy).then(function() {
                var btn = $(e.target);
                var originalHtml = btn.html();
                btn.html('✅ 已复制!');
                setTimeout(function() {
                    btn.html(originalHtml);
                }, 1500);
            }).catch(function(err) {
                console.error('复制失败:', err);
            });
        } else {
            // 降级处理
            var btn = $(e.target);
            btn.html('⚠️ 不可用');
            setTimeout(function() {
                btn.html('📋 复制');
            }, 1500);
        }
    });
});

// 添加旋转动画
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
    
    .image-lightbox {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 100000;
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        visibility: hidden;
        transition: all 0.3s ease;
    }
    
    .image-lightbox.active {
        opacity: 1;
        visibility: visible;
    }
    
    .image-lightbox .lightbox-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0,0,0,0.9);
        cursor: pointer;
    }
    
    .image-lightbox .lightbox-content {
        position: relative;
        max-width: 90vw;
        max-height: 90vh;
        z-index: 1;
    }
    
    .image-lightbox .lightbox-image {
        max-width: 100%;
        max-height: 90vh;
        border-radius: 8px;
        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
    }
    
    .image-lightbox .lightbox-close {
        position: absolute;
        top: -40px;
        right: 0;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: none;
        background: rgba(255,255,255,0.2);
        color: #fff;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        transition: all 0.2s ease;
    }
    
    .image-lightbox .lightbox-close:hover {
        background: rgba(255,255,255,0.3);
        transform: rotate(90deg);
    }
    
    body.modal-open {
        overflow: hidden;
    }
`;
document.head.appendChild(style);
