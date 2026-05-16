/**
 * Modern Login - 自定义登录页面JavaScript
 */
(function($) {
    'use strict';

    var LoginPage = {
        qrTimer: null,

        init: function() {
            // 通过页面元素判断当前是注册页还是登录页
            if ($('#ml-register-submit').length) {
                this.bindRegisterForm();
                return;
            }
            this.bindTabs();
            this.bindEmailLogin();
            this.bindPhoneLogin();
            this.bindEmailCode();
            if (modernLogin.isWechatDesktop) {
                this.bindWechatQuickLogin();
            } else {
                this.bindWechatQr();
            }
        },

        bindTabs: function() {
            $(document).on('click', '.ml-page-tab', function(e) {
                e.preventDefault();
                var $tab = $(this);
                var target = $tab.data('target');

                $('.ml-page-tab').removeClass('active');
                $tab.addClass('active');

                $('.ml-page-form').removeClass('active');
                $(target).addClass('active');

                if (target === '#ml-tab-wechat') {
                    if (!modernLogin.isWechatDesktop) {
                        LoginPage.loadQr();
                    }
                }
            });
        },

        bindWechatQuickLogin: function() {
            $(document).on('click', '#ml-wechat-quick-login', function() {
                var $btn = $(this).prop('disabled', true).text('正在跳转...');
                var userRole = $('input[name="user_role"]').val() || '';
                var authUrl = '/modern-login/wechat-auth/';
                if (userRole) {
                    authUrl += '?user_role=' + encodeURIComponent(userRole);
                }
                window.location.href = authUrl;
                setTimeout(function() {
                    $btn.prop('disabled', false).text('微信快捷登录');
                }, 3000);
            });
        },

        bindEmailLogin: function() {
            var self = this;

            $(document).on('click', '#ml-email-login-btn', function() {
                var login = $('#ml-login-input').val().trim();
                var password = $('#ml-password-input').val();
                var code = $('#ml-email-code-input').length ? $('#ml-email-code-input').val().trim() : '';
                var remember = $('input[name="remember"]').is(':checked');

                if (!login) {
                    self.showMsg('ml-email-msg', '请输入邮箱或用户名', 'error');
                    return;
                }
                if (!password) {
                    self.showMsg('ml-email-msg', '请输入密码', 'error');
                    return;
                }

                var $btn = $('#ml-email-login-btn').prop('disabled', true).text('登录中...');

                $.ajax({
                    url: modernLogin.ajaxUrl,
                    type: 'POST',
                    data: {
                        action: 'modern_login_email_login',
                        nonce: modernLogin.nonce,
                        login: login,
                        password: password,
                        code: code,
                        remember: remember ? 1 : 0
                    },
                    success: function(res) {
                        if (res.success) {
                            self.showMsg('ml-email-msg', '登录成功，正在跳转...', 'success');
                            setTimeout(function() {
                                window.location.href = res.data.redirect || '/';
                            }, 500);
                        } else {
                            self.showMsg('ml-email-msg', res.data.message || '登录失败', 'error');
                            $btn.prop('disabled', false).text('登录');
                        }
                    },
                    error: function() {
                        self.showMsg('ml-email-msg', '网络错误，请稍后重试', 'error');
                        $btn.prop('disabled', false).text('登录');
                    }
                });
            });

            // Enter key submits email form
            $(document).on('keydown', '#ml-tab-email input', function(e) {
                if (e.key === 'Enter') {
                    $('#ml-email-login-btn').click();
                }
            });
        },

        bindEmailCode: function() {
            $(document).on('click', '#ml-send-email-code', function() {
                var email = $('#ml-login-input').val().trim();

                if (!email || email.indexOf('@') < 0) {
                    LoginPage.showMsg('ml-email-msg', '发送验证码需要输入邮箱地址', 'error');
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
                        action: 'modern_login_send_login_email_code',
                        nonce: modernLogin.nonce,
                        email: email
                    },
                    success: function(res) {
                        if (res.success) {
                            LoginPage.showMsg('ml-email-msg', '验证码已发送到您的邮箱', 'success');
                        } else {
                            clearInterval(timer);
                            $btn.prop('disabled', false).text(txt);
                            LoginPage.showMsg('ml-email-msg', res.data.message || '发送失败', 'error');
                        }
                    },
                    error: function() {
                        clearInterval(timer);
                        $btn.prop('disabled', false).text(txt);
                        LoginPage.showMsg('ml-email-msg', '网络错误', 'error');
                    }
                });
            });
        },

        bindPhoneLogin: function() {
            var self = this;

            $(document).on('click', '#ml-phone-login-btn', function() {
                var phone = $('#ml-phone-input').val().trim();
                var code = $('#ml-phone-code-input').val().trim();
                var userRole = $('input[name="user_role"]').val() || '';

                if (!/^1[3-9]\d{9}$/.test(phone)) {
                    self.showMsg('ml-phone-msg', '请输入正确的手机号', 'error');
                    return;
                }
                if (!code) {
                    self.showMsg('ml-phone-msg', '请输入验证码', 'error');
                    return;
                }

                var $btn = $('#ml-phone-login-btn').prop('disabled', true).text('登录中...');

                $.ajax({
                    url: modernLogin.ajaxUrl,
                    type: 'POST',
                    data: {
                        action: 'modern_login_phone_login',
                        nonce: modernLogin.nonce,
                        phone: phone,
                        code: code,
                        user_role: userRole
                    },
                    success: function(res) {
                        if (res.success) {
                            window.location.href = res.data.redirect || '/';
                        } else {
                            self.showMsg('ml-phone-msg', res.data.message || '登录失败', 'error');
                            $btn.prop('disabled', false).text('登录');
                        }
                    },
                    error: function() {
                        self.showMsg('ml-phone-msg', '网络错误', 'error');
                        $btn.prop('disabled', false).text('登录');
                    }
                });
            });

            $(document).on('click', '#ml-send-sms-code', function() {
                var phone = $('#ml-phone-input').val().trim();

                if (!/^1[3-9]\d{9}$/.test(phone)) {
                    LoginPage.showMsg('ml-phone-msg', '请输入正确的手机号', 'error');
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
                        action: 'modern_login_send_sms',
                        nonce: modernLogin.nonce,
                        phone: phone
                    },
                    success: function(res) {
                        if (res.success) {
                            LoginPage.showMsg('ml-phone-msg', '验证码已发送', 'success');
                        } else {
                            clearInterval(timer);
                            $btn.prop('disabled', false).text(txt);
                            LoginPage.showMsg('ml-phone-msg', res.data.message || '发送失败', 'error');
                        }
                    },
                    error: function() {
                        clearInterval(timer);
                        $btn.prop('disabled', false).text(txt);
                        LoginPage.showMsg('ml-phone-msg', '网络错误', 'error');
                    }
                });
            });
        },

        loadQr: function() {
            var self = this;
            if (self.qrTimer) {
                clearInterval(self.qrTimer);
                self.qrTimer = null;
            }

            var $container = $('#ml-qr-image');
            var $status = $('#ml-qr-status');
            var $refresh = $('#ml-qr-refresh');

            $container.html('<div class="ml-qr-placeholder"><span class="ml-qr-spinner"></span>加载中...</div>');
            $status.removeClass('qr-waiting qr-scanned qr-success qr-expired').addClass('qr-waiting');
            $status.find('.ml-qr-status-text').html('<span class="ml-qr-spinner"></span>加载二维码...');
            $refresh.hide();

            var userRole = $('input[name="user_role"]').val() || '';

            $.ajax({
                url: modernLogin.ajaxUrl,
                type: 'POST',
                data: {
                    action: 'modern_login_get_qr',
                    nonce: modernLogin.nonce,
                    user_role: userRole
                },
                success: function(res) {
                    if (res.success) {
                        var qrId = res.data.qr_id;
                        $container.html('<img src="' + res.data.qr_data + '" alt="QR Code" />');
                        $status.removeClass().addClass('ml-qr-status qr-waiting');
                        $status.find('.ml-qr-status-text').text('请使用微信扫码登录');
                        $refresh.hide();
                        self.startHeartbeat(qrId);
                    } else {
                        $container.html('<div class="ml-qr-placeholder">二维码加载失败</div>');
                        $status.removeClass().addClass('ml-qr-status qr-expired');
                        $status.find('.ml-qr-status-text').text(res.data.message || '加载失败');
                        $refresh.show();
                    }
                },
                error: function() {
                    $container.html('<div class="ml-qr-placeholder">网络错误</div>');
                    $status.removeClass().addClass('ml-qr-status qr-expired');
                    $status.find('.ml-qr-status-text').text('网络错误');
                    $refresh.show();
                }
            });
        },

        startHeartbeat: function(qrId) {
            var self = this;
            if (self.qrTimer) {
                clearInterval(self.qrTimer);
            }

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
                        if (!res.success) {
                            return;
                        }

                        var $status = $('#ml-qr-status');
                        var $refresh = $('#ml-qr-refresh');

                        switch (res.data.status) {
                            case 'scanned':
                                $status.removeClass().addClass('ml-qr-status qr-scanned');
                                $status.find('.ml-qr-status-text').text(
                                    '已扫描，请在手机上确认登录' +
                                    (res.data.nickname ? '（' + res.data.nickname + '）' : '')
                                );
                                break;

                            case 'logged_in':
                                clearInterval(self.qrTimer);
                                self.qrTimer = null;
                                $status.removeClass().addClass('ml-qr-status qr-success');
                                $status.find('.ml-qr-status-text').text('登录成功，正在跳转...');
                                setTimeout(function() {
                                    window.location.href = res.data.redirect || '/';
                                }, 500);
                                break;

                            case 'expired':
                                clearInterval(self.qrTimer);
                                self.qrTimer = null;
                                $status.removeClass().addClass('ml-qr-status qr-expired');
                                $status.find('.ml-qr-status-text').text('二维码已过期');
                                $refresh.show();
                                break;
                        }
                    }
                });
            }, 1500);
        },

        bindWechatQr: function() {
            $(document).on('click', '#ml-qr-refresh', function() {
                LoginPage.loadQr();
            });
        },

        bindRegisterForm: function() {
            var self = this;

            // 发送邮箱验证码
            $(document).on('click', '#ml-send-register-email-code', function() {
                var email = $('#ml-register-email').val().trim();

                if (!email || email.indexOf('@') < 0) {
                    self.showMsg('ml-register-msg', '请输入有效的邮箱地址', 'error');
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
                            self.showMsg('ml-register-msg', '验证码已发送到您的邮箱', 'success');
                        } else {
                            clearInterval(timer);
                            $btn.prop('disabled', false).text(txt);
                            self.showMsg('ml-register-msg', res.data.message || '发送失败', 'error');
                        }
                    },
                    error: function() {
                        clearInterval(timer);
                        $btn.prop('disabled', false).text(txt);
                        self.showMsg('ml-register-msg', '网络错误', 'error');
                    }
                });
            });

            // 注册提交
            $(document).on('click', '#ml-register-submit', function() {
                var email = $('#ml-register-email').val().trim();
                var password = $('#ml-register-password').val();
                var code = $('#ml-register-code').length ? $('#ml-register-code').val().trim() : '';
                var userRole = $('input[name="user_role"]').val() || '';

                if (!email || email.indexOf('@') < 0) {
                    self.showMsg('ml-register-msg', '请输入有效的邮箱地址', 'error');
                    return;
                }
                if (password.length < 6) {
                    self.showMsg('ml-register-msg', '密码长度至少6位', 'error');
                    return;
                }
                if (modernLogin.emailVerify && !code) {
                    self.showMsg('ml-register-msg', '请输入邮箱验证码', 'error');
                    return;
                }

                var $btn = $(this).prop('disabled', true).text('注册中...');

                $.ajax({
                    url: modernLogin.ajaxUrl,
                    type: 'POST',
                    data: {
                        action: 'modern_login_register',
                        nonce: modernLogin.nonce,
                        email: email,
                        password: password,
                        code: code,
                        user_role: userRole
                    },
                    success: function(res) {
                        if (res.success) {
                            self.showMsg('ml-register-msg', '注册成功，正在跳转...', 'success');
                            setTimeout(function() {
                                window.location.href = res.data.redirect || '/';
                            }, 500);
                        } else {
                            self.showMsg('ml-register-msg', res.data.message || '注册失败', 'error');
                            $btn.prop('disabled', false).text('注册');
                        }
                    },
                    error: function() {
                        self.showMsg('ml-register-msg', '网络错误，请稍后重试', 'error');
                        $btn.prop('disabled', false).text('注册');
                    }
                });
            });

            // Enter key submits register form
            $(document).on('keydown', '.ml-page-form.active input', function(e) {
                if (e.key === 'Enter') {
                    $('#ml-register-submit').click();
                }
            });
        },

        showMsg: function(containerId, msg, type) {
            var cls = type === 'error' ? 'ml-msg-error' : 'ml-msg-success';
            $('#' + containerId).html('<div class="' + cls + '">' + msg + '</div>');
            if (type === 'success') {
                setTimeout(function() {
                    $('#' + containerId).empty();
                }, 3000);
            }
        }
    };

    $(document).ready(function() {
        LoginPage.init();

        // 如果微信tab默认激活且非桌面版微信，加载QR
        if ($('#ml-tab-wechat').hasClass('active') && !modernLogin.isWechatDesktop) {
            LoginPage.loadQr();
        }
    });

})(jQuery);
