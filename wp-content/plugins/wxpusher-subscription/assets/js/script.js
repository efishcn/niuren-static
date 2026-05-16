jQuery(document).ready(function($) {
    // 生成二维码
    $('#wxpusher-generate-qr').on('click', function() {
        const $btn = $(this);
        const $container = $('#wxpusher-qr-container');
        const $loading = $container.find('.qr-loading');
        const $content = $container.find('.qr-content');
        const $error = $container.find('.qr-error');
        
        // 显示容器和加载状态
        $container.slideDown();
        $loading.show();
        $content.hide();
        $error.hide();
        $btn.prop('disabled', true);
        
        $.ajax({
            url: wxpusherSubAjax.ajax_url,
            type: 'POST',
            data: {
                action: 'wxpusher_generate_qr',
                nonce: wxpusherSubAjax.nonce
            },
            success: function(response) {
                if (response.success) {
                    // 显示二维码
                    $('#wxpusher-qr-image').attr('src', response.data.qr_url);
                    $loading.hide();
                    $content.fadeIn();
                    
                    // 开始轮询检查订阅状态
                    startPolling();
                } else {
                    showError(response.data.message || '生成二维码失败');
                }
            },
            error: function() {
                showError('网络错误，请稍后重试');
            },
            complete: function() {
                $btn.prop('disabled', false);
            }
        });
    });
    
    // 取消订阅
    $('#wxpusher-unsubscribe').on('click', function() {
        if (!confirm('确定要取消订阅吗？')) {
            return;
        }
        
        const $btn = $(this);
        $btn.prop('disabled', true).text('处理中...');
        
        $.ajax({
            url: wxpusherSubAjax.ajax_url,
            type: 'POST',
            data: {
                action: 'wxpusher_unsubscribe',
                nonce: wxpusherSubAjax.nonce
            },
            success: function(response) {
                if (response.success) {
                    alert('已成功取消订阅');
                    location.reload();
                } else {
                    alert(response.data.message || '取消订阅失败');
                    $btn.prop('disabled', false).text('取消订阅');
                }
            },
            error: function() {
                alert('网络错误，请稍后重试');
                $btn.prop('disabled', false).text('取消订阅');
            }
        });
    });
    
    // 显示错误信息
    function showError(message) {
        const $container = $('#wxpusher-qr-container');
        const $loading = $container.find('.qr-loading');
        const $content = $container.find('.qr-content');
        const $error = $container.find('.qr-error');
        
        $loading.hide();
        $content.hide();
        $error.find('.error-message').text(message);
        $error.fadeIn();
    }
    
    // 轮询检查订阅状态
    let pollingInterval;
    function startPolling() {
        // 每3秒检查一次
        pollingInterval = setInterval(function() {
            $.ajax({
                url: wxpusherSubAjax.ajax_url,
                type: 'POST',
                data: {
                    action: 'wxpusher_check_status',
                    nonce: wxpusherSubAjax.nonce
                },
                success: function(response) {
                    if (response.success && response.data.subscribed) {
                        // 订阅成功
                        clearInterval(pollingInterval);
                        alert('订阅成功！');
                        location.reload();
                    }
                }
            });
        }, 3000);
        
        // 30分钟后停止轮询（二维码过期）
        setTimeout(function() {
            clearInterval(pollingInterval);
        }, 1800000);
    }
    
    // 页面卸载时清除轮询
    $(window).on('beforeunload', function() {
        if (pollingInterval) {
            clearInterval(pollingInterval);
        }
    });
});