/**
 * Modern Login - 前端JavaScript
 */
(function($) {
    'use strict';

    var ModernLoginFront = {
        qrTimer: null,

        init: function() {
            this.bindTabSwitching();
            this.bindPasswordLogin();
            this.bindWechatQR();
            this.bindPhoneLogin();
            this.bindRegister();
            this.bindSendSms();
            this.bindSendEmailCode();
        },

        bindTabSwitching: function() {
            $(document).on('click', '.modern-login-tab', function(e) {
                e.preventDefault();
                var $tab = $(this);
                var target = $tab.data('target');

                $('.modern-login-tab').removeClass('active');
                $tab.addClass('active');

                $('.modern-login-form').removeClass('active').hide();
                $(target).addClass('active').show();

                if (target === '#ml-wechat-login') {
                    ModernLoginFront.loadWechatQR();
                }
            });
        },

        bindPasswordLogin: function() {
            $(document).on('submit', '#ml-password-login', function(e) {
                e.preventDefault();
                var $form = $(this);
                var login = $form.find('[name="login"]').val();
                var password = $form.find('[name="password"]').val();
                var remember = $form.find('[name="remember"]').is(':checked');
                var redirect = $form.find('[name="redirect"]').val();

                if (!login) {
                    ModernLoginFront.showFormMsg($form, '请输入邮箱或用户名', 'error');
                    return;
                }
                if (!password) {
                    ModernLoginFront.showFormMsg($form, '请输入密码', 'error');
                    return;
                }

                var $btn = $form.find('.modern-login-submit').prop('disabled', true).text('登录中...');

                $.ajax({
                    url: modernLogin.ajaxUrl,
                    type: 'POST',
                    data: {
                        action: 'modern_login_email_login',
                        nonce: modernLogin.nonce,
                        login: login,
                        password: password,
                        remember: remember ? 1 : 0
                    },
                    success: function(res) {
                        if (res.success) {
                            window.location.href = redirect || res.data.redirect || '/';
                        } else {
                            ModernLoginFront.showFormMsg($form, res.data.message || '登录失败', 'error');
                            $btn.prop('disabled', false).text('登录');
                        }
                    },
                    error: function() {
                        ModernLoginFront.showFormMsg($form, '网络错误', 'error');
                        $btn.prop('disabled', false).text('登录');
                    }
                });
            });
        },

        bindWechatQR: function() {
            var self = this;

            $(document).on('click', '.ml-qr-refresh-btn', function() {
                self.loadWechatQR();
            });
        },

        loadWechatQR: function() {
            var self = this;
            if (self.qrTimer) {
                clearInterval(self.qrTimer);
                self.qrTimer = null;
            }

            var $container = $('#ml-wechat-qr-container');
            var $status = $('.ml-qr-status-text');
            var $refresh = $('.ml-qr-refresh-btn');

            if (!$container.length) return;

            $container.html('<div class="ml-qr-placeholder"><span class="ml-qr-spinner"></span>加载中...</div>');
            $status.text('').css('color', '#667eea');
            $refresh.hide();

            $.ajax({
                url: modernLogin.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'modern_login_get_qr',
                    nonce: modernLogin.nonce
                },
                success: function(res) {
                    if (res.success) {
                        var qrId = res.data.qr_id;
                        $container.html('<img src="' + res.data.qr_data + '" alt="QR Code" style="max-width:220px;height:auto;" />');
                        $status.text('请使用微信扫码登录');
                        $refresh.hide();
                        self.startQrHeartbeat(qrId);
                    } else {
                        $container.html('<div class="ml-qr-placeholder">二维码加载失败</div>');
                        $status.text(res.data.message || '加载失败').css('color', '#dc2626');
                        $refresh.show();
                    }
                },
                error: function() {
                    $container.html('<div class="ml-qr-placeholder">网络错误</div>');
                    $status.text('网络错误').css('color', '#dc2626');
                    $refresh.show();
                }
            });
        },

        startQrHeartbeat: function(qrId) {
            var self = this;
            if (self.qrTimer) clearInterval(self.qrTimer);

            self.qrTimer = setInterval(function() {
                $.ajax({
                    url: modernLogin.ajaxUrl,
                    type: 'POST',
                    data: {
                        action: 'modern_login_check_qr',
                        nonce: modernLogin.nonce,
                        qr_id: qrId
                    },
                    success: function(res) {
                        if (!res.success) return;

                        var $status = $('.ml-qr-status-text');
                        var $refresh = $('.ml-qr-refresh-btn');

                        switch (res.data.status) {
                            case 'scanned':
                                $status.text('已扫描，请在手机上确认登录' +
                                    (res.data.nickname ? '（' + res.data.nickname + '）' : '')
                                ).css('color', '#f59e0b');
                                break;

                            case 'logged_in':
                                clearInterval(self.qrTimer);
                                self.qrTimer = null;
                                $status.text('登录成功，正在跳转...').css('color', '#16a34a');
                                setTimeout(function() {
                                    window.location.href = res.data.redirect || '/';
                                }, 500);
                                break;

                            case 'expired':
                                clearInterval(self.qrTimer);
                                self.qrTimer = null;
                                $status.text('二维码已过期').css('color', '#dc2626');
                                $refresh.show();
                                break;
                        }
                    }
                });
            }, 1500);
        },

        bindPhoneLogin: function() {
            $(document).on('submit', '#ml-phone-login', function(e) {
                e.preventDefault();
                var $form = $(this);
                var phone = $form.find('[name="phone"]').val();
                var code = $form.find('[name="code"]').val();

                if (!/^1[3-9]\d{9}$/.test(phone)) {
                    ModernLoginFront.showFormMsg($form, '请输入正确的手机号', 'error');
                    return;
                }
                if (!code) {
                    ModernLoginFront.showFormMsg($form, '请输入验证码', 'error');
                    return;
                }

                var $btn = $form.find('.modern-login-submit').prop('disabled', true).text('登录中...');

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
                            ModernLoginFront.showFormMsg($form, res.data.message || '登录失败', 'error');
                            $btn.prop('disabled', false).text('登录');
                        }
                    },
                    error: function() {
                        ModernLoginFront.showFormMsg($form, '网络错误', 'error');
                        $btn.prop('disabled', false).text('登录');
                    }
                });
            });
        },

        bindSendSms: function() {
            $(document).on('click', '#ml-phone-login .modern-login-code-btn', function() {
                var $form = $('#ml-phone-login');
                var phone = $form.find('[name="phone"]').val();

                if (!/^1[3-9]\d{9}$/.test(phone)) {
                    ModernLoginFront.showFormMsg($form, '请输入正确的手机号', 'error');
                    return;
                }

                ModernLoginFront.doSendSms(phone, $form, $form.find('.modern-login-code-btn'));
            });
        },

        doSendSms: function(phone, $form, $btn) {
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
                        ModernLoginFront.showFormMsg($form, '验证码已发送', 'success');
                    } else {
                        clearInterval(timer);
                        $btn.prop('disabled', false).text(txt);
                        ModernLoginFront.showFormMsg($form, res.data.message || '发送失败', 'error');
                    }
                },
                error: function() {
                    clearInterval(timer);
                    $btn.prop('disabled', false).text(txt);
                    ModernLoginFront.showFormMsg($form, '网络错误', 'error');
                }
            });
        },

        // 注册相关
        bindRegister: function() {
            $(document).on('submit', '#ml-register-form', function(e) {
                e.preventDefault();
                var $form = $(this);
                var email = $form.find('[name="email"]').val();
                var password = $form.find('[name="password"]').val();
                var code = $form.find('[name="code"]').val();
                var userRole = $form.find('[name="user_role"]').val();

                if (!email || email.indexOf('@') < 0) {
                    ModernLoginFront.showRegisterMsg('请输入有效的邮箱地址', 'error');
                    return;
                }
                if (!password || password.length < 6) {
                    ModernLoginFront.showRegisterMsg('密码长度至少6位', 'error');
                    return;
                }

                var $btn = $form.find('.modern-login-submit').prop('disabled', true).text('注册中...');

                $.ajax({
                    url: modernLogin.ajaxUrl,
                    type: 'POST',
                    data: {
                        action: 'modern_login_register',
                        nonce: modernLogin.nonce,
                        email: email,
                        password: password,
                        code: code || '',
                        user_role: userRole || ''
                    },
                    success: function(res) {
                        if (res.success) {
                            ModernLoginFront.showRegisterMsg('注册成功，正在跳转...', 'success');
                            setTimeout(function() {
                                window.location.href = res.data.redirect || '/';
                            }, 1000);
                        } else {
                            ModernLoginFront.showRegisterMsg(res.data.message || '注册失败', 'error');
                            $btn.prop('disabled', false).text('注册');
                        }
                    },
                    error: function() {
                        ModernLoginFront.showRegisterMsg('网络错误，请稍后重试', 'error');
                        $btn.prop('disabled', false).text('注册');
                    }
                });
            });
        },

        bindSendEmailCode: function() {
            $(document).on('click', '#ml-send-email-code', function() {
                var $form = $('#ml-register-form');
                var email = $form.find('[name="email"]').val();

                if (!email || email.indexOf('@') < 0) {
                    ModernLoginFront.showRegisterMsg('请输入有效的邮箱地址', 'error');
                    return;
                }

                var $btn = $(this).prop('disabled', true);
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
                        action: 'modern_login_send_email_code',
                        nonce: modernLogin.nonce,
                        email: email
                    },
                    success: function(res) {
                        if (res.success) {
                            ModernLoginFront.showRegisterMsg('验证码已发送到您的邮箱', 'success');
                        } else {
                            clearInterval(timer);
                            $btn.prop('disabled', false).text(txt);
                            ModernLoginFront.showRegisterMsg(res.data.message || '发送失败', 'error');
                        }
                    },
                    error: function() {
                        clearInterval(timer);
                        $btn.prop('disabled', false).text(txt);
                        ModernLoginFront.showRegisterMsg('网络错误', 'error');
                    }
                });
            });
        },

        showFormMsg: function($form, msg, type) {
            var $msg = $form.find('.modern-login-form-msg');
            if (!$msg.length) {
                $msg = $('<div class="modern-login-form-msg" style="margin-top:10px;text-align:center;"></div>');
                $form.find('.modern-login-submit').before($msg);
            }
            var color = type === 'error' ? 'red' : 'green';
            $msg.html('<span style="color:' + color + ';">' + msg + '</span>');
            setTimeout(function() { $msg.empty(); }, 3000);
        },

        showRegisterMsg: function(msg, type) {
            var $container = $('#ml-register-message');
            var color = type === 'error' ? '#d63638' : '#00a32a';
            var bg = type === 'error' ? '#fcf0f1' : '#ecf9f1';
            $container.html(
                '<div style="padding:10px;margin-bottom:15px;border-radius:4px;background:' + bg + ';color:' + color + ';border-left:4px solid ' + color + ';">' + msg + '</div>'
            );
            setTimeout(function() { $container.empty(); }, 5000);
        }
    };

    $(document).ready(function() {
        ModernLoginFront.init();
    });

})(jQuery);
