// 添加新的交互效果
jQuery(document).ready(function($) {
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
        platformOptions.forEach(function(option) {
            modalHtml += '<div class="platform-option" data-platform="' + option.code + '">' +
                option.name +
                '</div>';
        });
        
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
});
