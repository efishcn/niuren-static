jQuery(document).ready(function($) {
    var currentRecordId = null;
    
    // 表单提交处理
    $('#ai-video-gen-form').on('submit', function(e) {
        e.preventDefault();
        
        var formData = $(this).serialize();
        var $floatingBtn = $('#fixed-submit');
        var originalIcon = $floatingBtn.find('.btn-icon').html();
        
        // 禁用提交按钮并显示加载状态
        $floatingBtn.addClass('loading');
        $floatingBtn.find('.btn-icon').html('⏳');
        
        $.ajax({
            url: aiVideoGenAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'ai_video_gen_ajax_submit',
                form_data: formData,
                nonce: aiVideoGenAjax.nonce
            },
            success: function(response) {
                console.log('Ajax response:', response);
                if (response.success) {
                    showSuccessModal(response.data.redirect_url, $floatingBtn, originalIcon);
                } else {
                    // 会员系统 gate 拦截 → 弹窗让用户选择订阅/充值/邀请
                    if (response.data && response.data.code === 'gate_blocked' && window.MembershipGateFrontend) {
                        MembershipGateFrontend.handleBlock(response.data);
                        // showErrorModal(response.data.message || '使用次数不足，请选择以下方式继续');
                    } else if (response.data && response.data.limit_exceeded) {
                        showLimitModal(response.data.message, response.data.next_reset_time, $floatingBtn, originalIcon);
                    } else {
                        showErrorModal(response.data.message);
                    }
                    // 恢复按钮状态
                    $floatingBtn.removeClass('loading').prop('disabled', false);
                    $floatingBtn.find('.btn-icon').html(originalIcon);
                }
            },
            error: function(xhr, status, error) {
                console.log('Ajax error:', error);
                showErrorModal('提交失败: ' + error);
                // 恢复按钮状态
                $floatingBtn.removeClass('loading').prop('disabled', false);
                $floatingBtn.find('.btn-icon').html(originalIcon);
            }
        });
    });

    // 限制提示弹层
    function showLimitModal(message, nextResetTime, $floatingBtn, originalIcon) {
        console.log('Showing limit modal');
        
        // 先移除所有已存在的模态框
        $('.custom-modal').remove();
        
        // 计算倒计时
        var resetDate = nextResetTime ? new Date(nextResetTime) : null;
        var countdownHtml = '';
        if (resetDate) {
            countdownHtml = '<div class="countdown-timer" style="margin: 15px 0; padding: 12px; background: #fff7e6; border: 1px solid #ffd591; border-radius: 8px; color: #d46b08; font-size: 14px;">' +
                '<span class="dashicons dashicons-clock" style="margin-right: 6px;"></span>' +
                '<span id="limit-countdown">计算中...</span>' +
                '</div>';
        }
        
        var modalHtml = `
            <div id="custom-modal" class="custom-modal limit-modal">
                <div class="modal-content" style="max-width: 480px;">
                    <div style="font-size: 48px; margin-bottom: 10px;">⚠️</div>
                    <h5>提交限制提示</h5>
                    <p style="color: #666; line-height: 1.6; margin-bottom: 15px;">${message}</p>
                    ${countdownHtml}
                    <div style="margin-top: 20px;">
                        <button type="button" id="close-limit-modal" class="button button-primary">我知道了</button>
                    </div>
                </div>
            </div>
        `;

        $('body').append(modalHtml);
        
        // 如果有重置时间，启动倒计时
        if (resetDate) {
            updateCountdown(resetDate);
            var countdownInterval = setInterval(function() {
                updateCountdown(resetDate);
            }, 1000);
            
            // 关闭弹层时清除定时器
            $('#custom-modal').data('countdownInterval', countdownInterval);
        }

        // 绑定按钮事件
        $('#close-limit-modal').on('click', function() {
            console.log('Close limit modal button clicked');
            var interval = $('#custom-modal').data('countdownInterval');
            if (interval) {
                clearInterval(interval);
            }
            $('#custom-modal').fadeOut(function() {
                $(this).remove();
            });
            // 恢复提交按钮状态 - 使用与错误处理相同的方式
            $floatingBtn.removeClass('loading');
            $floatingBtn.find('.btn-icon').html(originalIcon);
        });
    }
    
    // 更新倒计时显示
    function updateCountdown(resetDate) {
        var now = new Date();
        var diff = resetDate - now;
        
        if (diff <= 0) {
            $('#limit-countdown').text('限制已重置，您可以继续提交了！');
            return;
        }
        
        var hours = Math.floor(diff / (1000 * 60 * 60));
        var minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        var seconds = Math.floor((diff % (1000 * 60)) / 1000);
        
        var timeText = '';
        if (hours > 0) {
            timeText += hours + '小时';
        }
        if (minutes > 0 || hours > 0) {
            timeText += minutes + '分';
        }
        timeText += seconds + '秒';
        
        $('#limit-countdown').text('距离限制重置还有: ' + timeText);
    }
    
    // 成功提示弹窗
    function showSuccessModal(redirectUrl, $floatingBtn, originalIcon) {
        console.log('Showing success modal');
        
        // 先移除所有已存在的模态框
        $('.custom-modal').remove();
        
        var modalHtml = `
            <div id="custom-modal" class="custom-modal">
                <div class="modal-content">
                    <h5>任务提交成功</h5>
                    <p>AI视频生成任务已提交，请耐心等待生成。</p>
                    <button type="button" id="stay-on-page" class="button">留在当前页面</button>
                    <button type="button" id="view-generation" class="button button-primary">查看生成进度</button>
                </div>
            </div>
        `;

        $('body').append(modalHtml);

        // 绑定按钮事件
        $('#stay-on-page').on('click', function() {
            console.log('Stay button clicked');
            $('#custom-modal').fadeOut(function() {
                $(this).remove();
            });
            // 恢复提交按钮状态 - 使用与错误处理相同的方式
            $floatingBtn.removeClass('loading');
            $floatingBtn.find('.btn-icon').html(originalIcon);
        });

        $('#view-generation').on('click', function() {
            console.log('View button clicked');
            window.location.href = redirectUrl;
        });
    }

    // 错误提示弹窗
    function showErrorModal(message) {
        console.log('Showing error modal');
        
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
            console.log('Close button clicked');
            $('#custom-modal').fadeOut(function() {
                $(this).remove();
            });
        });
    }
    
    // View Details Button Click Handler
    $(document).on('click', '.view-ai-video-details-btn', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        var btn = $(this);
        var scrollTop = $(window).scrollTop();
        
        currentRecordId = btn.data('id');
        var videoPath = btn.data('video-path');
        var status = btn.data('status');
        var model = btn.data('model');
        var ratio = btn.data('ratio');
        var duration = btn.data('duration');
        
        // Fill modal with basic info - DO NOT use idea-desc from data attribute
        // The prompt will be loaded securely via AJAX
        $('#modal-idea-desc').html('<span style="color: #999;">加载中...</span>');
        // Model, ratio, and duration will be loaded from AJAX response
        $('#modal-model').text('加载中...');
        $('#modal-ratio').text('加载中...');
        $('#modal-duration').text('加载中...');
        
        // Get current use status and remark from table row
        var row = btn.closest('tr');
        var useStatusSelect = row.find('.use-status-select');
        var useStatus = useStatusSelect.length ? useStatusSelect.val() : '0';
        var remarkText = row.find('.user-remark-text').text();
        var remark = remarkText === '无备注' ? '' : remarkText;
        
        $('#modal-use-status').val(useStatus);
        $('#modal-user-remark').val(remark);
        
        // Load video content via AJAX
        $('#modal-video-content').html('<div class="loading-spinner"><span class="dashicons dashicons-update-alt"></span><p>加载中...</p></div>');
        $('#modal-images-content').html('');
        $('#modal-images-section').hide();
        
        $.ajax({
            url: aiVideoGenAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'get_ai_video_content',
                id: currentRecordId,
                nonce: aiVideoGenAjax.nonce
            },
            success: function(response) {
                console.log('AJAX Response:', response);
                if (response.success) {
                    // Update video content
                    $('#modal-video-content').html(response.data.video_content);
                    
                    // 🔒 Update prompt display with server-side secured content
                    if (response.data.prompt_display) {
                        $('#modal-idea-desc').html(response.data.prompt_display);
                    } else {
                        $('#modal-idea-desc').text('无创意描述');
                    }
                    
                    // Update model, ratio, and duration with display names from server
                    if (response.data.model_display_name) {
                        $('#modal-model').text(response.data.model_display_name);
                    } else {
                        $('#modal-model').text('-');
                    }
                    
                    if (response.data.ratio_display_name) {
                        $('#modal-ratio').text(response.data.ratio_display_name);
                    } else {
                        $('#modal-ratio').text('-');
                    }
                    
                    if (response.data.duration) {
                        $('#modal-duration').text(response.data.duration);
                    } else {
                        $('#modal-duration').text('-');
                    }
                    
                    // Load and display images if available
                    console.log('Images content:', response.data.images_content);
                    if (response.data.images_content && response.data.images_content.trim() !== '') {
                        $('#modal-images-content').html(response.data.images_content);
                        $('#modal-images-section').show();
                        console.log('Images section shown');
                        
                        // Bind image click events for lightbox
                        bindImageLightbox();
                    } else {
                        console.log('No images to display');
                        $('#modal-images-section').hide();
                    }
                } else {
                    $('#modal-video-content').html('<div class="error-message">加载失败: ' + response.data + '</div>');
                    $('#modal-idea-desc').text('加载失败');
                }
            },
            error: function() {
                $('#modal-video-content').html('<div class="error-message">加载失败，请重试</div>');
            }
        });
        
        // Store scroll position
        $('#ai-video-detail-modal').data('scrollTop', scrollTop);
        
        // Show modal
        $('#ai-video-detail-modal').fadeIn(300);
        $('body').addClass('modal-open');
    });
    
    // Close Modal Handlers - use event delegation
    $(document).on('click', '.ai-video-modal-close, .ai-video-modal-overlay', function(e) {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
    });
    
    // Close modal on ESC key
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape' && $('#ai-video-detail-modal').is(':visible')) {
            e.preventDefault();
            closeModal();
        }
    });
    
    function closeModal() {
        var scrollTop = $('#ai-video-detail-modal').data('scrollTop');
        if (scrollTop === undefined || scrollTop === null) {
            scrollTop = 0;
        }
        
        // Hide modal and restore scroll
        $('#ai-video-detail-modal').fadeOut(300, function() {
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
            url: aiVideoGenAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'update_ai_video_use_status',
                record_id: currentRecordId,
                use_status: useStatus,
                nonce: aiVideoGenAjax.nonce
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
            url: aiVideoGenAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'update_ai_video_user_remark',
                record_id: currentRecordId,
                user_remark: userRemark,
                nonce: aiVideoGenAjax.nonce
            },
            success: function(response) {
                if (response.success) {
                    // Update the table row remark
                    var remarkText = $('.edit-remark-icon[data-id="' + currentRecordId + '"]').siblings('.user-remark-text');
                    remarkText.text(userRemark || '无备注');
                    $('.edit-remark-icon[data-id="' + currentRecordId + '"]').data('remark', userRemark);
                    
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
            url: aiVideoGenAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'update_ai_video_use_status',
                record_id: recordId,
                use_status: useStatus,
                nonce: aiVideoGenAjax.nonce
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
    
    // 编辑备注图标点击处理 - 使用模态框输入
    $(document).on('click', '.ai-edit-remark-icon', function() {
        var recordId = $(this).data('id');
        var currentRemark = $(this).data('remark');
        var remarkText = $(this).siblings('.user-remark-text');
        var icon = $(this);
        
        // 创建编辑备注模态框
        var modalHtml = `
            <div class="notification-modal" id="edit-remark-modal" style="display: flex;">
                <div class="notification-modal-content">
                    <h3>编辑备注</h3>
                    <textarea id="edit-remark-textarea" style="width: 100%; min-height: 100px; padding: 10px; border: 2px solid #e1e8f0; border-radius: 8px; font-size: 14px; margin-bottom: 16px;" maxlength="500">${currentRemark || ''}</textarea>
                    <div style="display: flex; gap: 12px; justify-content: center;">
                        <button class="btn-cancel" style="padding: 10px 20px; border-radius: 6px; border: none; background: #f1f1f1; color: #374151; cursor: pointer;">取消</button>
                        <button class="btn-submit" style="padding: 10px 20px; border-radius: 6px; border: none; background: linear-gradient(135deg, #1890ff 0%, #2170f6 100%); color: white; cursor: pointer;">确定</button>
                    </div>
                </div>
            </div>
        `;
        
        $('body').append(modalHtml);
        $('#edit-remark-textarea').focus();
        
        // 取消按钮
        $('#edit-remark-modal .btn-cancel').on('click', function() {
            $('#edit-remark-modal').remove();
        });
        
        // 确定按钮
        $('#edit-remark-modal .btn-submit').on('click', function() {
            var newRemark = $('#edit-remark-textarea').val().trim();
            
            if (newRemark !== currentRemark) {
                $(this).prop('disabled', true).text('保存中...');
                
                $.ajax({
                    url: aiVideoGenAjax.ajaxurl,
                    type: 'POST',
                    data: {
                        action: 'update_ai_video_user_remark',
                        record_id: recordId,
                        user_remark: newRemark,
                        nonce: aiVideoGenAjax.nonce
                    },
                    success: function(response) {
                        $('#edit-remark-modal').remove();
                        if (response.success) {
                            remarkText.text(newRemark || '无备注');
                            icon.data('remark', newRemark);
                            showNotification('success', '备注更新成功');
                        } else {
                            showNotification('error', '更新失败: ' + response.data);
                        }
                    },
                    error: function() {
                        $('#edit-remark-modal').remove();
                        showNotification('error', '更新失败，请重试');
                    }
                });
            } else {
                $('#edit-remark-modal').remove();
            }
        });
    });
    
    // 全局通知函数
    function showNotification(type, message) {
        var iconContent = type === 'success' ? '✅' : '❌';
        var modalHtml = `
            <div class="notification-modal" style="display: flex;">
                <div class="notification-modal-content ${type}">
                    <h3>${iconContent === '✅' ? '成功' : '错误'}</h3>
                    <p>${message}</p>
                    <button class="btn-ok" style="padding: 10px 24px; background: linear-gradient(135deg, #1890ff 0%, #2170f6 100%); color: white; border: none; border-radius: 6px; cursor: pointer;">确定</button>
                </div>
            </div>
        `;
        
        $('body').append(modalHtml);
        
        $('.notification-modal .btn-ok').on('click', function() {
            $('.notification-modal').fadeOut(300, function() {
                $(this).remove();
            });
        });
        
        // 自动关闭（3秒后）
        setTimeout(function() {
            $('.notification-modal').fadeOut(300, function() {
                $(this).remove();
            });
        }, 3000);
    }
    
    // 重新提交按钮点击处理
    $(document).on('click', '.ai-video-resubmit-btn', function() {
        var btn = $(this);
        var recordId = btn.data('id');
        var originalHtml = btn.html();
        var $row = btn.closest('tr');
        
        // 使用确认模态框
        var confirmHtml = `
            <div class="notification-modal" style="display: flex;">
                <div class="notification-modal-content">
                    <h3>⚠️ 确认操作</h3>
                    <p>确定要重新提交此视频生成任务吗？</p>
                    <div style="display: flex; gap: 12px; justify-content: center;">
                        <button class="btn-cancel" style="padding: 10px 20px; border-radius: 6px; border: none; background: #f1f1f1; color: #374151; cursor: pointer;">取消</button>
                        <button class="btn-confirm" style="padding: 10px 20px; border-radius: 6px; border: none; background: linear-gradient(135deg, #1890ff 0%, #2170f6 100%); color: white; cursor: pointer;">确定</button>
                    </div>
                </div>
            </div>
        `;
        
        $('body').append(confirmHtml);
        
        $('.notification-modal .btn-cancel').on('click', function() {
            $('.notification-modal').remove();
        });
        
        $('.notification-modal .btn-confirm').on('click', function() {
            $('.notification-modal').remove();
            
            btn.prop('disabled', true).html('<span class="dashicons dashicons-update-alt" style="animation: spin 1s linear infinite;"></span> 提交中...');
            
            $.ajax({
                url: aiVideoGenAjax.ajaxurl,
                type: 'POST',
                data: {
                    action: 'ai_video_resubmit',
                    record_id: recordId,
                    nonce: aiVideoGenAjax.nonce
                },
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
                        var hasCancelBtn = $actionsCol.find('.ai-cancel-generation').length > 0;
                        if (!hasCancelBtn) {
                            var $regenerateBtn = $actionsCol.find('.ai-video-resubmit-btn').first();
                            $regenerateBtn.after('<a href="javascript:void(0);" class="dh-action-btn cancel ai-cancel-generation" data-id="' + recordId + '">取消生成</a>');
                        }
                        
                        showNotification('success', '重新提交成功！');
                        btn.prop('disabled', false).html(originalHtml);
                    } else {
                        showNotification('error', '重新提交失败: ' + response.data);
                        btn.prop('disabled', false).html(originalHtml);
                    }
                },
                error: function() {
                    showNotification('error', '重新提交失败，请重试');
                    btn.prop('disabled', false).html(originalHtml);
                }
            });
        });
    });
    
    // 设置公开状态按钮点击处理
    $(document).on('click', '.ai-set-public-btn', function() {
        var btn = $(this);
        var recordId = btn.data('id');
        var credit = btn.data('credit');
        
        // 使用确认模态框并添加提示词积分价格输入
        var confirmHtml = `
            <div class="notification-modal" style="display: flex;">
                <div class="notification-modal-content">
                    <h3>💰 设置为公开并定价</h3>
                    <div style="margin: 15px 0; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #1890ff;">
                        <label for="set-public-prompt-credits" style="display: block; margin-bottom: 8px; font-weight: 600; color: #1890ff;">
                            📌 提示词积分价格:
                        </label>
                        <div style="display: flex; align-items: center; gap: 10px;">
                            <input type="number" 
                                   id="set-public-prompt-credits" 
                                   min="100" 
                                   max="1000" 
                                   step="10" 
                                   value="100" 
                                   style="width: 120px; padding: 8px; border: 2px solid #e1e8f0; border-radius: 6px;">
                            <span style="color: #64748b;">积分 (范围: 100-1000)</span>
                        </div>
                        <p style="margin-top: 8px; color: #64748b; font-size: 13px;">
                            💡 其他用户购买后，您将获得90%的积分（平台抽取10%服务费）
                        </p>
                    </div>
                    <p style="color: #ff6b6b; font-weight: bold;">⚠️ 注意：公开后无法再设置为私有！</p>
                    <div style="display: flex; gap: 12px; justify-content: center;">
                        <button class="btn-cancel" style="padding: 10px 20px; border-radius: 6px; border: none; background: #f1f1f1; color: #374151; cursor: pointer;">取消</button>
                        <button class="btn-confirm" style="padding: 10px 20px; border-radius: 6px; border: none; background: linear-gradient(135deg, #1890ff 0%, #2170f6 100%); color: white; cursor: pointer;">确定设置公开</button>
                    </div>
                </div>
            </div>
        `;
        
        $('body').append(confirmHtml);
        
        $('.notification-modal .btn-cancel').on('click', function() {
            $('.notification-modal').remove();
        });
        
        $('.notification-modal .btn-confirm').on('click', function() {
            var confirmBtn = $(this);
            var promptCredits = parseInt($('#set-public-prompt-credits').val());
            
            // 验证提示词积分价格
            if (isNaN(promptCredits) || promptCredits < 100 || promptCredits > 1000) {
                alert('请输入有效的提示词积分价格（100-1000）');
                return;
            }
            
            confirmBtn.prop('disabled', true).text('处理中...');
            
            $.ajax({
                url: aiVideoGenAjax.ajaxurl,
                type: 'POST',
                data: {
                    action: 'ai_video_set_public_status',
                    record_id: recordId,
                    prompt_credits: promptCredits,
                    nonce: aiVideoGenAjax.nonce
                },
                success: function(response) {
                    $('.notification-modal').remove();
                    
                    if (response.success) {
                        showNotification('success', response.data.message);
                        
                        // 刷新页面以显示更新后的状态
                        setTimeout(function() {
                            location.reload();
                        }, 1500);
                    } else {
                        showNotification('error', '设置失败: ' + response.data.message);
                    }
                },
                error: function() {
                    $('.notification-modal').remove();
                    showNotification('error', '请求失败，请重试');
                }
            });
        });
    });
    
    // 创建角色按钮点击处理
    $(document).on('click', '.ai-create-role-btn', function() {
        var btn = $(this);
        var videoId = btn.data('video-id');
        var taskId = btn.data('task-id');
        var scrollTop = $(window).scrollTop();
        
        // 重置表单
        $('#create-role-form')[0].reset();
        
        // 设置video ID和task ID到隐藏字段
        $('#role-video-id').val(videoId);
        $('#role-task-id').val(taskId);
        
        // Store scroll position
        $('#ai-create-role-modal').data('scrollTop', scrollTop);
        
        // 显示模态框
        $('#ai-create-role-modal').fadeIn(300);
        $('body').addClass('modal-open');
    });
    
    // 关闭创建角色模态框 - 包括取消按钮
    $(document).on('click', '#ai-create-role-modal .ai-video-modal-close, #ai-create-role-modal .ai-video-modal-overlay, .role-cancel-btn', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        // 获取保存的滚动位置
        var scrollTop = $('#ai-create-role-modal').data('scrollTop');
        if (scrollTop === undefined || scrollTop === null) {
            scrollTop = 0;
        }
        
        // 关闭模态框并恢复滚动位置
        $('#ai-create-role-modal').fadeOut(300, function() {
            $('body').removeClass('modal-open');
            window.scrollTo(0, scrollTop);
        });
    });
    
    // ESC键关闭创建角色模态框
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape' && $('#ai-create-role-modal').is(':visible')) {
            e.preventDefault();
            
            // 获取保存的滚动位置
            var scrollTop = $('#ai-create-role-modal').data('scrollTop');
            if (scrollTop === undefined || scrollTop === null) {
                scrollTop = 0;
            }
            
            $('#ai-create-role-modal').fadeOut(300, function() {
                $('body').removeClass('modal-open');
                window.scrollTo(0, scrollTop);
            });
        }
    });
    
    // Display Name唯一性验证
    var displayNameTimeout;
    $('#role-display-name').on('input', function() {
        clearTimeout(displayNameTimeout);
        var $input = $(this);
        var $message = $input.siblings('.validation-message');
        
        // 移除现有的验证消息
        if (!$message.length) {
            $message = $('<span class="validation-message" style="display:block;margin-top:5px;font-size:12px;"></span>');
            $input.after($message);
        }
        
        var displayName = $input.val().trim();
        
        if (!displayName) {
            $message.removeClass('success').text('').hide();
            return;
        }
        
        $message.text('验证中...').show().css('color', '#666');
        
        displayNameTimeout = setTimeout(function() {
            $.ajax({
                url: aiVideoGenAjax.ajaxurl,
                type: 'POST',
                data: {
                    action: 'ai_video_check_display_name',
                    nonce: aiVideoGenAjax.nonce,
                    display_name: displayName,
                    current_id: 0
                },
                success: function(response) {
                    if (response.success) {
                        $message.addClass('success').text('✓ 角色名称可用').show().css('color', '#52c41a');
                    } else {
                        $message.removeClass('success').text('✗ ' + response.data.message).show().css('color', '#f5222d');
                    }
                },
                error: function() {
                    $message.removeClass('success').text('验证失败，请重试').show().css('color', '#f5222d');
                }
            });
        }, 500);
    });
    
    // 创建角色表单提交处理
    $('#create-role-form').on('submit', function(e) {
        e.preventDefault();
        
        var form = $(this);
        var submitBtn = form.find('button[type="submit"]');
        var originalHtml = submitBtn.html();
        
        // 检查display_name验证状态
        var $validationMessage = $('#role-display-name').siblings('.validation-message');
        if ($validationMessage.length && !$validationMessage.hasClass('success')) {
            showNotification('error', '请等待角色名称验证完成或使用可用的角色名称');
            return;
        }
        
        // 验证时间戳格式（视频时间区间，如 "3,5"）
        var timestamps = $('#role-timestamps').val().trim();
        if (!/^\d+,\d+$/.test(timestamps)) {
            showNotification('error', '时间戳格式错误，请输入视频时间区间（如：3,5）');
            return;
        }
        
        submitBtn.prop('disabled', true).html('<span class="dashicons dashicons-update-alt" style="animation: spin 1s linear infinite;"></span> 创建中...');
        
        $.ajax({
            url: aiVideoGenAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'ai_video_create_role',
                display_name: $('#role-display-name').val(),
                timestamps: timestamps,
                user_id: $('#role-user-id').val(),
                video_id: $('#role-video-id').val(),
                task_id: $('#role-task-id').val(),
                nonce: aiVideoGenAjax.nonce
            },
            success: function(response) {
                submitBtn.prop('disabled', false).html(originalHtml);
                
                if (response.success) {
                    $('#ai-create-role-modal').fadeOut(300);
                    $('body').removeClass('modal-open');
                    form[0].reset();
                    showNotification('success', '角色创建成功！角色ID: ' + response.data.role_id);
                } else {
                    showNotification('error', '创建失败：' + response.data.message);
                }
            },
            error: function() {
                submitBtn.prop('disabled', false).html(originalHtml);
                showNotification('error', '请求失败，请稍后重试');
            }
        });
    });
    
    // Purchase Prompt Button Handler
    $(document).on('click', '.buy-prompt-btn', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        var btn = $(this);
        var videoId = btn.data('video-id');
        var credits = btn.data('credits');
        
        // 使用确认模态框
        var confirmHtml = `
            <div class="notification-modal" style="display: flex;">
                <div class="notification-modal-content">
                    <h3>💡 购买提示词</h3>
                    <p>确定花费 <strong>${credits}</strong> 积分购买该视频的提示词吗？</p>
                    <p style="color: #64748b; font-size: 13px;">购买后可查看完整创意描述</p>
                    <div style="display: flex; gap: 12px; justify-content: center;">
                        <button class="btn-cancel" style="padding: 10px 20px; border-radius: 6px; border: none; background: #f1f1f1; color: #374151; cursor: pointer;">取消</button>
                        <button class="btn-confirm" style="padding: 10px 20px; border-radius: 6px; border: none; background: linear-gradient(135deg, #1890ff 0%, #2170f6 100%); color: white; cursor: pointer;">确认购买</button>
                    </div>
                </div>
            </div>
        `;
        
        $('body').append(confirmHtml);
        
        $('.notification-modal .btn-cancel').on('click', function() {
            $('.notification-modal').remove();
        });
        
        $('.notification-modal .btn-confirm').on('click', function() {
            var confirmBtn = $(this);
            confirmBtn.prop('disabled', true).text('购买中...');
            
            $.ajax({
                url: aiVideoGenAjax.ajaxurl,
                type: 'POST',
                data: {
                    action: 'aivpg_purchase_prompt',
                    video_id: videoId,
                    nonce: aiVideoGenAjax.nonce
                },
                success: function(response) {
                    $('.notification-modal').remove();
                    
                    if (response.success) {
                        showNotification('success', '购买成功！积分已扣除，正在刷新页面...');
                        
                        // 刷新页面以显示购买后的提示词
                        setTimeout(function() {
                            location.reload();
                        }, 1500);
                    } else {
                        showNotification('error', '购买失败: ' + response.data.message);
                    }
                },
                error: function(xhr, status, error) {
                    $('.notification-modal').remove();
                    showNotification('error', '请求失败: ' + error);
                }
            });
        });
    });
    
    // Copy Idea Button Click Handler
    $(document).on('click', '.copy-idea-btn', function(e) {
        e.preventDefault();
        e.stopPropagation();
        
        var btn = $(this);
        var ideaText = $('#modal-idea-desc').text().trim();
        
        if (!ideaText || ideaText === '加载中...' || ideaText === '无创意描述' || ideaText === '加载失败') {
            // 没有可复制内容时，使用简单的按钮反馈而不是弹层
            var originalHtml = btn.html();
            btn.html('<span class="dashicons dashicons-no"></span> 无内容');
            btn.css('background', 'linear-gradient(135deg, rgba(255, 77, 79, 0.2) 0%, rgba(255, 120, 117, 0.1) 100%)');
            btn.css('border-color', '#ff4d4f');
            btn.css('color', '#ff4d4f');
            
            setTimeout(function() {
                btn.html(originalHtml);
                btn.css('background', '');
                btn.css('border-color', '');
                btn.css('color', '');
            }, 1500);
            return;
        }
        
        // 使用现代剪贴板API
        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(ideaText).then(function() {
                // 显示成功反馈 - 只改变按钮状态，不显示弹层
                var originalHtml = btn.html();
                btn.html('<span class="dashicons dashicons-yes"></span> 已复制');
                btn.css('background', 'linear-gradient(135deg, rgba(82, 196, 26, 0.2) 0%, rgba(115, 209, 61, 0.1) 100%)');
                btn.css('border-color', '#52c41a');
                btn.css('color', '#52c41a');
                
                setTimeout(function() {
                    btn.html(originalHtml);
                    btn.css('background', '');
                    btn.css('border-color', '');
                    btn.css('color', '');
                }, 2000);
            }).catch(function(err) {
                console.error('复制失败:', err);
                // 复制失败时也只改变按钮状态，不显示弹层
                var originalHtml = btn.html();
                btn.html('<span class="dashicons dashicons-no"></span> 失败');
                btn.css('background', 'linear-gradient(135deg, rgba(255, 77, 79, 0.2) 0%, rgba(255, 120, 117, 0.1) 100%)');
                btn.css('border-color', '#ff4d4f');
                btn.css('color', '#ff4d4f');
                
                setTimeout(function() {
                    btn.html(originalHtml);
                    btn.css('background', '');
                    btn.css('border-color', '');
                    btn.css('color', '');
                }, 1500);
            });
        } else {
            // 降级方案：使用传统方法
            var textArea = document.createElement('textarea');
            textArea.value = ideaText;
            textArea.style.position = 'fixed';
            textArea.style.left = '-9999px';
            document.body.appendChild(textArea);
            textArea.select();
            
            try {
                var successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                
                if (successful) {
                    var originalHtml = btn.html();
                    btn.html('<span class="dashicons dashicons-yes"></span> 已复制');
                    btn.css('background', 'linear-gradient(135deg, rgba(82, 196, 26, 0.2) 0%, rgba(115, 209, 61, 0.1) 100%)');
                    btn.css('border-color', '#52c41a');
                    btn.css('color', '#52c41a');
                    
                    setTimeout(function() {
                        btn.html(originalHtml);
                        btn.css('background', '');
                        btn.css('border-color', '');
                        btn.css('color', '');
                    }, 2000);
                } else {
                    // 复制失败时也只改变按钮状态，不显示弹层
                    var originalHtml = btn.html();
                    btn.html('<span class="dashicons dashicons-no"></span> 失败');
                    btn.css('background', 'linear-gradient(135deg, rgba(255, 77, 79, 0.2) 0%, rgba(255, 120, 117, 0.1) 100%)');
                    btn.css('border-color', '#ff4d4f');
                    btn.css('color', '#ff4d4f');
                    
                    setTimeout(function() {
                        btn.html(originalHtml);
                        btn.css('background', '');
                        btn.css('border-color', '');
                        btn.css('color', '');
                    }, 1500);
                }
            } catch (err) {
                document.body.removeChild(textArea);
                console.error('复制失败:', err);
                // 复制失败时也只改变按钮状态，不显示弹层
                var originalHtml = btn.html();
                btn.html('<span class="dashicons dashicons-no"></span> 失败');
                btn.css('background', 'linear-gradient(135deg, rgba(255, 77, 79, 0.2) 0%, rgba(255, 120, 117, 0.1) 100%)');
                btn.css('border-color', '#ff4d4f');
                btn.css('color', '#ff4d4f');
                
                setTimeout(function() {
                    btn.html(originalHtml);
                    btn.css('background', '');
                    btn.css('border-color', '');
                    btn.css('color', '');
                }, 1500);
            }
        }
    });
    
    // Image Lightbox Function
    function bindImageLightbox() {
        $('.image-item').off('click').on('click', function() {
            var imageUrl = $(this).data('image-url');
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
    
    // 取消生成按钮点击处理
    $(document).on('click', '.ai-cancel-generation', function(e) {
        e.preventDefault();
        
        var $btn = $(this);
        var id = $btn.data('id');
        var $row = $btn.closest('tr');
        
        // 使用弹层确认
        var confirmHtml = `
            <div class="notification-modal" style="display: flex;">
                <div class="notification-modal-content">
                    <h3>⚠️ 确认取消</h3>
                    <p>确认取消生成吗？</p>
                    <div style="display: flex; gap: 12px; justify-content: center;">
                        <button class="btn-cancel" style="padding: 10px 20px; border-radius: 6px; border: none; background: #f1f1f1; color: #374151; cursor: pointer;">取消</button>
                        <button class="btn-confirm" style="padding: 10px 20px; border-radius: 6px; border: none; background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%); color: white; cursor: pointer;">确认取消</button>
                    </div>
                </div>
            </div>
        `;
        
        $('body').append(confirmHtml);
        
        $('.notification-modal .btn-cancel').on('click', function() {
            $('.notification-modal').remove();
        });
        
        $('.notification-modal .btn-confirm').on('click', function() {
            $('.notification-modal').remove();
            
            $btn.prop('disabled', true).text('取消中...');
            
            $.ajax({
                url: aiVideoGenAjax.ajaxurl,
                type: 'POST',
                data: {
                    action: 'ai_video_gen_cancel',
                    nonce: aiVideoGenAjax.nonce,
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
                        showNotification('error', response.data.message || '取消失败');
                        $btn.prop('disabled', false).text('取消生成');
                    }
                },
                error: function() {
                    showNotification('error', '请求失败，请重试');
                    $btn.prop('disabled', false).text('取消生成');
                }
            });
        });
    });
});

// 添加旋转动画
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);
