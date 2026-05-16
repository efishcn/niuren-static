jQuery(document).ready(function($) {
    // 如果有成功消息参数，显示成功提示
    if (window.location.search.indexOf('message=success') > -1) {
        $('<div class="notice notice-success is-dismissible"><p>保存成功！</p></div>')
            .insertAfter('.wrap h1')
            .find('button.notice-dismiss')
            .on('click', function() {
                $(this).parent().remove();
            });
    }

    // 处理表单提交
    $('form.dh-form').on('submit', function(e) {
        e.preventDefault();

        var $form = $(this);

        // 防止重复提交
        if ($form.data('submitting')) return;
        $form.data('submitting', true);

        var submitButton = $form.find('input[type="submit"], button[type="submit"]');

        // 禁用提交按钮并改变文本
        submitButton.prop('disabled', true).css('opacity', '0.5');
        var originalText = submitButton.val() || submitButton.text();
        submitButton.val('处理中...').text('处理中...');
        var formData = new FormData(this);
        formData.append('action', 'save_' + $form.data('type'));
        formData.append('_wpnonce', dh_vars.nonce);

        $.ajax({
            url: dh_vars.ajax_url,
            type: 'POST',
            data: formData,
            processData: false,
            contentType: false,
            dataType: 'json',
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            },
            success: function(response) {
                if (response.success) {
                    const baseUrl = window.location.href.split('?')[0];
                    const urlParams = new URLSearchParams(window.location.search);
                    const page = urlParams.get('page');
                    const newParams = new URLSearchParams();
                    newParams.set('page', page);
                    newParams.set('message', 'success');
                    window.location.href = baseUrl + '?' + newParams.toString();
                } else {
                    $form.data('submitting', false);
                    submitButton.prop('disabled', false).css('opacity', '1');
                    submitButton.val(originalText).text(originalText);
                    Swal.fire({
                        icon: 'error',
                        title: '操作失败',
                        html: response.data.message,
                        confirmButtonText: '确定'
                    });
                }
            },
            error: function(jqXHR) {
                $form.data('submitting', false);
                submitButton.prop('disabled', false).css('opacity', '1');
                submitButton.val(originalText).text(originalText);

                let errorMessage = '请求失败，请稍后重试';
                if (jqXHR.status === 400) {
                    errorMessage = '请求参数无效，请检查输入内容是否正确';
                } else if (jqXHR.status === 401) {
                    errorMessage = '未授权的操作，请重新登录';
                } else if (jqXHR.status === 403) {
                    errorMessage = '没有权限执行此操作';
                } else if (jqXHR.status === 404) {
                    errorMessage = '请求的资源不存在';
                } else if (jqXHR.status === 500) {
                    errorMessage = '服务器内部错误，请联系管理员';
                }

                if (jqXHR.responseJSON) {
                    if (jqXHR.responseJSON === 0) {
                        errorMessage = '服务器返回了无效的响应，请检查服务器配置';
                    } else if (typeof jqXHR.responseJSON === 'object' && jqXHR.responseJSON.data) {
                        errorMessage = jqXHR.responseJSON.data.message;
                    } else if (typeof jqXHR.responseJSON === 'string') {
                        errorMessage = jqXHR.responseJSON;
                    }
                }
                Swal.fire({
                    icon: 'error',
                    title: '操作失败',
                    html: errorMessage,
                    confirmButtonText: '确定'
                });
            }
        });
    });

    // 处理AJAX错误
    $(document).ajaxError(function(event, jqXHR, settings, error) {
        if (jqXHR.responseJSON) {
            if (jqXHR.responseJSON === 0) {
                Swal.fire({
                    icon: 'error',
                    title: '操作失败',
                    html: '服务器返回了无效的响应，请检查服务器配置',
                    confirmButtonText: '确定'
                });
            }
            else if (jqXHR.responseJSON.data) {
                Swal.fire({
                    icon: 'error',
                    title: '操作失败',
                    html: jqXHR.responseJSON.data.message, // 使用 html 属性显示包含 HTML 的内容
                    confirmButtonText: '确定'
                });
            }
        }
    });
});