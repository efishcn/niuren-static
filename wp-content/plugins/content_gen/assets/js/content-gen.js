// 添加新的交互效果
jQuery(document).ready(function($) {
    'use strict';
    
    // 显示通知消息
    window.showNotification = function(type, message) {
        const $notification = $('<div class="content-gen-notification ' + type + '">' + message + '</div>');
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
    
    // 模型选择
    $('.model-card').click(function() {
        $('.model-card').removeClass('selected');
        $(this).addClass('selected');
        $('#model').val($(this).data('model'));
    });

    // 更多设置切换优化
    $('.more-settings-toggle').click(function() {
        $(this).toggleClass('active');
        var content = $('.collapse-panel.more-settings-content');
        
        if (content.is(':visible')) {
            content.slideUp(300);
            $(this).find('.icon').css('transform', 'rotate(0deg)');
        } else {
            content.slideDown(300);
            $(this).find('.icon').css('transform', 'rotate(180deg)');
        }
    });

    // 平台切换按钮点击事件
    $('.platform-switch-btn').click(function() {
        showPlatformModal();
    });

    // 平台选择弹窗函数
    function showPlatformModal() {
        // 创建弹窗HTML
        var modalHtml = '<div id="platform-modal">' +
            '<div class="modal-content">' +
            '<h1>选择目标平台</h1>' +
            '<div class="platform-options">';
        
        // 使用JavaScript变量生成平台选项
        if (typeof platformOptions !== 'undefined') {
            platformOptions.forEach(function(option) {
                modalHtml += '<div class="platform-option" data-platform="' + option.code + '">' +
                    option.name +
                    '</div>';
            });
        }
        
        modalHtml += '</div></div></div>';

        // 添加到页面并显示
        $('body').append(modalHtml);
        $('#platform-modal').fadeIn(300);

        // 绑定点击事件
        $('.platform-option').click(function() {
            var selectedPlatform = $(this).data('platform');
            var selectedPlatformName = $(this).text();
            $('.platform-name').text(selectedPlatformName);
            $('#platform').val(selectedPlatform);
            $('#platform-modal').fadeOut(300, function() {
                $(this).remove();
            });
        });

        // 点击空白处关闭弹窗
        $('#platform-modal').click(function(e) {
            if ($(e.target).is('#platform-modal')) {
                $(this).fadeOut(300, function() {
                    $(this).remove();
                });
            }
        });
    }

    // ==================== 浮动提交按钮功能 ====================
    
    // 浮动提交按钮点击事件
    $('#fixed-submit').on('click', function(e) {
        e.preventDefault();
        $('#submit-button').trigger('click');
    });
    
    // 浮动提交按钮始终显示（固定在右下角）
    if ($('#fixed-submit').length) {
        $('#fixed-submit').addClass('show');
    }

    // ==================== 限制检查功能 ====================
    
    // 检查是否在内容生成页面
    if ($('#content-gen-form').length && typeof contentGenAjax !== 'undefined') {
        
        // 页面加载时检查限制
        checkSubmitLimit();
        
        // 检查用户提交次数限制
        function checkSubmitLimit() {
            $.ajax({
                url: contentGenAjax.ajaxurl,
                type: 'POST',
                data: {
                    action: 'content_gen_check_limit',
                    nonce: contentGenAjax.nonce
                },
                dataType: 'json',
                success: function(response) {
                    if (response.success) {
                        var data = response.data;
                        
                        if (data.is_limited && !data.is_admin) {
                            if (data.remaining <= 0) {
                                // 已达到上限
                                $('#submit-button, #fixed-submit').prop('disabled', true);
                                showLimitExceededModal(data.used, data.next_reset_time);
                            } else {
                                // 显示剩余次数
                                var tipHtml = '<div class="limit-tip">今日剩余提交次数: <strong>' + data.remaining + '/3</strong></div>';
                                $('.page-description').after(tipHtml);
                            }
                        }
                    }
                }
            });
        }
        
        // 显示超出限制弹窗
        function showLimitExceededModal(usedCount, nextResetTime) {
            var modalHtml = `
                <div class="limit-exceeded-modal" id="limit-exceeded-modal">
                    <div class="modal-content">
                        <span class="modal-icon">🚫</span>
                        <h3>任务已达上限</h3>
                        <p>今日已达内容生成任务上限</p>
                        <div class="limit-info">
                            <div>您当日已提交：<strong>${usedCount}</strong> 条</div>
                            <div class="limit-timer" id="reset-timer"></div>
                        </div>
                        <button type="button" id="limit-modal-close" class="button button-primary">我知道了</button>
                    </div>
                </div>
            `;
            
            $('body').append(modalHtml);
            $('#limit-exceeded-modal').fadeIn(300);
            
            // 更新重置计时器
            if (nextResetTime) {
                updateResetTimer(nextResetTime);
            }
            
            // 绑定关闭按钮
            $('#limit-modal-close').on('click', function() {
                $('#limit-exceeded-modal').fadeOut(300, function() {
                    $(this).remove();
                });
            });
        }
        
        // 更新重置计时器
        function updateResetTimer(nextResetTime) {
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
    }

    // ==================== 取消生成功能 ====================
    
    // 取消生成按钮点击事件（兼容新旧类名）
    $(document).on('click', '.cancel-generation, .btn-cancel', function(e) {
        e.preventDefault();
        
        if (!confirm('确认取消生成吗？取消后将退还积分。')) {
            return;
        }
        
        var $btn = $(this);
        var id = $btn.data('id');
        var nonce = $btn.data('nonce');
        var $row = $btn.closest('tr');
        
        $btn.prop('disabled', true).text('取消中...');
        
        $.ajax({
            url: contentGenAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'content_gen_cancel',
                nonce: nonce,
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

    // ==================== 使用状态更新功能 ====================

    $(document).on('change', '.use-status-select', function() {
        var $select = $(this);
        var id = $select.data('id');
        var useStatus = $select.val();

        if (typeof contentGenAjax === 'undefined') return;

        $.ajax({
            url: contentGenAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'content_gen_update_use_status',
                nonce: contentGenAjax.nonce,
                id: id,
                use_status: useStatus
            },
            success: function(response) {
                if (response.success) {
                    showNotification('success', '使用状态已更新');
                } else {
                    showNotification('error', response.data.message || '更新失败');
                    // 还原选项
                    location.reload();
                }
            },
            error: function() {
                showNotification('error', '请求失败，请重试');
            }
        });
    });

    // ==================== 备注编辑功能 ====================

    $(document).on('click', '.edit-remark-icon', function() {
        var $icon = $(this);
        var id = $icon.data('id');
        var currentRemark = $icon.data('remark') || '';

        var newRemark = prompt('请输入备注内容（最多100字）：', currentRemark);
        if (newRemark === null) return;

        newRemark = newRemark.substring(0, 100);

        if (typeof contentGenAjax === 'undefined') return;

        $.ajax({
            url: contentGenAjax.ajaxurl,
            type: 'POST',
            data: {
                action: 'content_gen_update_remark',
                nonce: contentGenAjax.nonce,
                id: id,
                remark: newRemark
            },
            success: function(response) {
                if (response.success) {
                    $icon.data('remark', newRemark);
                    var displayText = newRemark ? newRemark : '无备注';
                    $icon.siblings('.user-remark-text').text(displayText);
                    showNotification('success', '备注已更新');
                } else {
                    showNotification('error', response.data.message || '更新失败');
                }
            },
            error: function() {
                showNotification('error', '请求失败，请重试');
            }
        });
    });

    // ==================== 查看详情功能 ====================

    $(document).on('click', '.view-details-btn, .modern-detail-btn', function() {
        var id = $(this).data('post-id');
        if (typeof contentGenAjax !== 'undefined') {
            var detailUrl = contentGenAjax.homeUrl + '/?p=' + id + '&preview=true';
            window.open(detailUrl, '_blank');
        }
    });

    // 搜索框重置到第一页
    $('input[type="search"]').on('input', function() {
        var $form = $(this).closest('form');
        var $pageInput = $form.find('input[name="paged"]');
        if ($pageInput.length) {
            $pageInput.val(1);
        }
    });

    // 状态筛选重置到第一页
    $('.dh-nav a, .nav-tab').on('click', function() {
        var url = $(this).attr('href');
        if (url && url.indexOf('paged=') === -1) {
            // URL中没有paged参数，保持默认行为
            return true;
        }
    });
});
