/**
 * Modern Login - 后台管理JavaScript
 */

(function($) {
    'use strict';
    
    const ModernLoginAdmin = {
        
        init: function() {
            this.bindEvents();
        },
        
        bindEvents: function() {
            // 数据迁移
            $(document).on('click', '#start-migration', this.startMigration.bind(this));
            
            // Tab切换
            $(document).on('click', '.modern-login-tabs a', this.switchTab.bind(this));
        },
        
        switchTab: function(e) {
            e.preventDefault();
            const $tab = $(e.currentTarget);
            const target = $tab.attr('href');
            
            $('.modern-login-tabs a').removeClass('active');
            $tab.addClass('active');
            
            $('.modern-login-tab-content').removeClass('active');
            $(target).addClass('active');
        },
        
        startMigration: function(e) {
            e.preventDefault();
            const $btn = $(e.currentTarget);
            const $status = $('#migration-status');
            
            if (!confirm('确定要开始数据迁移吗？')) {
                return;
            }
            
            $btn.prop('disabled', true).text('迁移中...');
            $status.removeClass('success error').addClass('processing').text('正在迁移数据，请稍候...');
            
            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'modern_login_migrate',
                    nonce: modernLoginAdmin.nonce
                },
                success: function(response) {
                    if (response.success) {
                        $status.removeClass('processing').addClass('success')
                            .text(response.data.message || '迁移成功');
                        $btn.text('迁移完成');
                    } else {
                        $status.removeClass('processing').addClass('error')
                            .text(response.data.message || '迁移失败');
                        $btn.prop('disabled', false).text('重新迁移');
                    }
                },
                error: function() {
                    $status.removeClass('processing').addClass('error')
                        .text('网络错误，请重试');
                    $btn.prop('disabled', false).text('重新迁移');
                }
            });
        }
    };
    
    // 初始化
    $(document).ready(function() {
        ModernLoginAdmin.init();
    });
    
})(jQuery);
