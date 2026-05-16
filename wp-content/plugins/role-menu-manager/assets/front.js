jQuery(function ($) {
    $('#rmm-register-form').on('submit', function (e) {
        e.preventDefault();

        var $form = $(this);
        var $msg = $('#rmm-register-message');
        var $btn = $form.find('.rmm-submit');

        $btn.prop('disabled', true).text('注册中...');

        $.ajax({
            url: rmmFront.ajax_url,
            type: 'POST',
            dataType: 'json',
            data: {
                action: 'rmm_register',
                _ajax_nonce: rmmFront.nonce,
                rmm_role: $form.find('[name="rmm_role"]').val(),
                rmm_redirect: $form.find('[name="rmm_redirect"]').val(),
                email: $form.find('[name="email"]').val(),
                password: $form.find('[name="password"]').val(),
                password_confirm: $form.find('[name="password_confirm"]').val()
            }
        }).done(function (res) {
            if (res.success) {
                $msg.html('<div class="rmm-message-success">' + res.data.message + '，正在跳转...</div>');
                setTimeout(function () {
                    window.location.href = res.data.redirect;
                }, 800);
            } else {
                $msg.html('<div class="rmm-message-error">' + (res.data && res.data.message ? res.data.message : '注册失败') + '</div>');
                $btn.prop('disabled', false).text('注册');
            }
        }).fail(function (jqXHR, textStatus) {
            var msg = '网络错误，请重试';
            if (jqXHR.responseText === '-1') {
                msg = '安全令牌已过期，请刷新页面后重试';
            } else if (textStatus === 'timeout') {
                msg = '请求超时，请重试';
            }
            $msg.html('<div class="rmm-message-error">' + msg + '</div>');
            $btn.prop('disabled', false).text('注册');
        });
    });
});
