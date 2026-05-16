/**
 * WP Performance Optimizer Admin JavaScript
 */

(function($) {
    'use strict';
    
    $(document).ready(function() {
        
        // 保存设置
        $('#wpo-settings-form').on('submit', function(e) {
            e.preventDefault();
            
            var $form = $(this);
            var $btn = $('#wpo-save-btn');
            
            $btn.addClass('loading').prop('disabled', true);
            
            $.ajax({
                url: wpoAdmin.ajaxurl,
                type: 'POST',
                data: $form.serialize() + '&action=wpo_save_settings&nonce=' + wpoAdmin.nonce,
                success: function(response) {
                    if (response.success) {
                        showMessage('设置已保存！', 'success');
                    } else {
                        showMessage('保存失败：' + response.data, 'error');
                    }
                },
                error: function() {
                    showMessage('保存失败，请重试', 'error');
                },
                complete: function() {
                    $btn.removeClass('loading').prop('disabled', false);
                }
            });
        });
        
        // 清理缓存
        $('#wpo-clear-cache-btn').on('click', function() {
            var $btn = $(this);
            
            if (!confirm('确定要清理缓存吗？')) {
                return;
            }
            
            $btn.addClass('loading').prop('disabled', true);
            
            $.ajax({
                url: wpoAdmin.ajaxurl,
                type: 'POST',
                data: {
                    action: 'wpo_clear_cache',
                    nonce: wpoAdmin.nonce
                },
                success: function(response) {
                    if (response.success) {
                        showMessage('缓存已清理！', 'success');
                    } else {
                        showMessage('清理失败：' + response.data, 'error');
                    }
                },
                error: function() {
                    showMessage('清理失败，请重试', 'error');
                },
                complete: function() {
                    $btn.removeClass('loading').prop('disabled', false);
                }
            });
        });
        
        // 显示消息
        function showMessage(message, type) {
            var $message = $('<div class="wpo-message ' + type + '">' + message + '</div>');
            $('.wpo-settings h1').after($message);
            $message.fadeIn();
            
            setTimeout(function() {
                $message.fadeOut(function() {
                    $(this).remove();
                });
            }, 3000);
        }
    });
    
})(jQuery);
