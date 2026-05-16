/**
 * Modern Login - 登录页面JavaScript
 */
(function($) {
    'use strict';

    var ModernLoginPage = {
        qrTimer: null,

        init: function() {
            this.bindEvents();
        },

        bindEvents: function() {
            var self = this;

            // 微信登录按钮
            $(document).on('click', '#modern-login-wechat', function(e) {
                e.preventDefault();
                self.showWechatModal();
            });

            // 手机登录按钮
            $(document).on('click', '#modern-login-phone', function(e) {
                e.preventDefault();
                self.showPhoneModal();
            });

            // 关闭模态框
            $(document).on('click', '.modern-login-modal-close, .modern-login-modal', function(e) {
                if (e.target === this) {
                    if (self.qrTimer) {
                        clearInterval(self.qrTimer);
                        self.qrTimer = null;
                    }
                    $('.modern-login-modal').remove();
                }
            });
        },

        showWechatModal: function() {
            // 直接跳转到微信扫码授权页面
            // WeChat QR Connect会展示二维码，扫码后自动回调
            var redirectUrl = '/modern-login/wechat-auth';
            if (typeof modernLogin !== 'undefined' && modernLogin.redirectUri) {
                redirectUrl = modernLogin.redirectUri;
            }
            window.location.href = redirectUrl;
        },

        showPhoneModal: function() {
            var self = this;
            var html = '<form id="ml-modal-phone-form">' +
                '<div class="modern-login-field"><label>手机号</label>' +
                '<input type="tel" name="phone" required placeholder="13800138000" /></div>' +
                '<div class="modern-login-field"><label>验证码</label>' +
                '<div class="modern-login-code-group">' +
                '<input type="text" name="code" required />' +
                '<button type="button" class="modern-login-code-btn" id="ml-modal-send-sms">发送验证码</button>' +
                '</div></div>' +
                '<button type="submit" class="modern-login-submit">登录</button>' +
                '<div class="modern-login-form-msg" style="margin-top:10px;text-align:center;"></div>' +
                '</form>';

            var modal = this.createModal('手机验证码登录', html);
            $('body').append(modal);

            // 发送短信
            $(document).on('click', '#ml-modal-send-sms', function() {
                self.sendSmsCode('#ml-modal-phone-form');
            });

            // 提交登录
            $(document).on('submit', '#ml-modal-phone-form', function(e) {
                e.preventDefault();
                var $form = $(this);
                var phone = $form.find('[name="phone"]').val();
                var code = $form.find('[name="code"]').val();

                if (!/^1[3-9]\d{9}$/.test(phone)) {
                    $form.find('.modern-login-form-msg').html('<span style="color:red;">请输入正确的手机号</span>');
                    return;
                }
                if (!code) {
                    $form.find('.modern-login-form-msg').html('<span style="color:red;">请输入验证码</span>');
                    return;
                }

                $form.find('.modern-login-submit').prop('disabled', true).text('登录中...');

                $.ajax({
                    url: modernLogin.ajaxUrl,
                    type: 'POST',
                    data: {
                        action: 'modern_login_phone_login',
                        nonce: modernLogin.nonce,
                        phone: phone,
                        code: code
                    },
                    success: function(res) {
                        if (res.success) {
                            window.location.href = res.data.redirect || '/';
                        } else {
                            $form.find('.modern-login-form-msg').html('<span style="color:red;">' + (res.data.message || '登录失败') + '</span>');
                            $form.find('.modern-login-submit').prop('disabled', false).text('登录');
                        }
                    },
                    error: function() {
                        $form.find('.modern-login-form-msg').html('<span style="color:red;">网络错误</span>');
                        $form.find('.modern-login-submit').prop('disabled', false).text('登录');
                    }
                });
            });
        },

        sendSmsCode: function(formSelector) {
            var $form = $(formSelector);
            var phone = $form.find('[name="phone"]').val();

            if (!/^1[3-9]\d{9}$/.test(phone)) {
                alert('请输入正确的手机号');
                return;
            }

            var $btn = $form.find('.modern-login-code-btn');
            $btn.prop('disabled', true);
            var countdown = 60;
            var txt = $btn.text();

            var timer = setInterval(function() {
                countdown--;
                $btn.text(countdown + 's');
                if (countdown <= 0) {
                    clearInterval(timer);
                    $btn.prop('disabled', false).text(txt);
                }
            }, 1000);

            $.ajax({
                url: modernLogin.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'modern_login_send_sms',
                    nonce: modernLogin.nonce,
                    phone: phone
                },
                success: function(res) {
                    if (res.success) {
                        $form.find('.modern-login-form-msg').html('<span style="color:green;">' + (res.data.message || '验证码已发送') + '</span>');
                    } else {
                        clearInterval(timer);
                        $btn.prop('disabled', false).text(txt);
                        $form.find('.modern-login-form-msg').html('<span style="color:red;">' + (res.data.message || '发送失败') + '</span>');
                    }
                },
                error: function() {
                    clearInterval(timer);
                    $btn.prop('disabled', false).text(txt);
                    $form.find('.modern-login-form-msg').html('<span style="color:red;">网络错误</span>');
                }
            });
        },

        createModal: function(title, content) {
            return '<div class="modern-login-modal">' +
                '<div class="modern-login-modal-content">' +
                '<span class="modern-login-modal-close">&times;</span>' +
                '<h2>' + title + '</h2>' +
                '<div class="modern-login-modal-body">' + content + '</div>' +
                '</div></div>';
        }
    };

    $(document).ready(function() {
        ModernLoginPage.init();
    });

})(jQuery);
