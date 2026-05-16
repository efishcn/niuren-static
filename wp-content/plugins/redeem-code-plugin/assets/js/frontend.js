jQuery(document).ready(function($) {
    'use strict';
    
    // 弹层管理对象
    const Modal = {
        // 显示红包动画弹层
        showRedpacket: function(points, type = 'fixed', message = '') {
            const $modal = this.createModal(points, type, message);
            $('body').append($modal);
            
            // 显示弹层
            $modal.fadeIn(300);
            
            // 自动点击红包（或等待用户点击）
            setTimeout(() => {
                if (!$modal.hasClass('opened')) {
                    this.openRedpacket($modal, points, type);
                }
            }, 1000);
        },
        
        // 创建红包弹层HTML
        createModal: function(points, type, message) {
            const isRandom = type === 'random';
            const $modal = $(`
                <div class="rcp-message-modal rcp-redpacket-modal">
                    <div class="rcp-modal-content">
                        <div class="rcp-modal-close"></div>
                        <div class="rcp-redpacket-animation">
                            <div class="rcp-redpacket-cover">
                                🧧
                            </div>
                            <div class="rcp-points-reveal">
                                <div class="rcp-points-${type}">
                                    <div class="points-icon">${isRandom ? '🎲' : '💎'}</div>
                                    <div class="points-value">${isRandom ? '<span class="rcp-points-rolling">0</span>' : points}</div>
                                </div>
                            </div>
                        </div>
                        <div class="rcp-message-text">${message || '恭喜获得积分！'}</div>
                        <div class="rcp-message-subtext">积分已自动添加到您的账户</div>
                        <div class="rcp-message-actions">
                            <button type="button" class="button rcp-message-ok">太棒了！</button>
                        </div>
                    </div>
                </div>
            `);
            
            // 点击红包封面打开
            $modal.find('.rcp-redpacket-cover').on('click', () => {
                if (!$modal.hasClass('opened')) {
                    this.openRedpacket($modal, points, type);
                }
            });
            
            // 点击关闭按钮关闭
            $modal.find('.rcp-modal-close').on('click', () => {
                $modal.fadeOut(300, function() {
                    $(this).remove();
                });
            });
            
            // 点击确定按钮关闭
            $modal.find('.rcp-message-ok').on('click', () => {
                $modal.fadeOut(300, function() {
                    $(this).remove();
                });
            });
            
            // ESC键关闭
            $(document).on('keydown.redpacket', (e) => {
                if (e.key === 'Escape' && $modal.hasClass('opened')) {
                    $modal.fadeOut(300, function() {
                        $(this).remove();
                    });
                    $(document).off('keydown.redpacket');
                }
            });
            
            return $modal;
        },
        
        // 打开红包动画
        openRedpacket: function($modal, points, type) {
            $modal.addClass('opened');
            const $cover = $modal.find('.rcp-redpacket-cover');
            const $reveal = $modal.find('.rcp-points-reveal');
            
            // 红包打开动画
            $cover.addClass('opening');
            
            // 播放五彩纸屑
            this.createConfetti($modal);
            
            // 延迟显示积分
            setTimeout(() => {
                $reveal.addClass('show');
                
                // 如果是随机积分，播放滚动数字动画
                if (type === 'random') {
                    this.rollNumbers($modal, points);
                }
            }, 600);
        },
        
        // 数字滚动动画
        rollNumbers: function($modal, finalPoints) {
            const $numberSpan = $modal.find('.rcp-points-rolling');
            let currentNumber = 0;
            const duration = 2000; // 2秒滚动
            const steps = 40;
            const increment = finalPoints / steps;
            let step = 0;
            
            const interval = setInterval(() => {
                step++;
                currentNumber = Math.min(Math.floor(increment * step), finalPoints);
                $numberSpan.text(currentNumber);
                
                if (step >= steps) {
                    clearInterval(interval);
                    $numberSpan.text(finalPoints);
                    $numberSpan.removeClass('rcp-points-rolling');
                    
                    // 最终数字弹跳效果
                    $numberSpan.parent().css({
                        animation: 'bounce 0.6s ease-in-out'
                    });
                }
            }, duration / steps);
        },
        
        // 创建五彩纸屑效果
        createConfetti: function($modal) {
            const colors = ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#f7b731', '#5f27cd'];
            const $animation = $modal.find('.rcp-redpacket-animation');
            
            for (let i = 0; i < 30; i++) {
                const $confetti = $('<div class="confetti"></div>');
                const randomColor = colors[Math.floor(Math.random() * colors.length)];
                const randomX = Math.random() * 200 - 100;
                const randomDelay = Math.random() * 0.5;
                const randomDuration = 2 + Math.random() * 1;
                
                $confetti.css({
                    background: randomColor,
                    left: '50%',
                    top: '50%',
                    marginLeft: randomX + 'px',
                    animationDelay: randomDelay + 's',
                    animationDuration: randomDuration + 's'
                });
                
                $animation.append($confetti);
                
                // 添加下落动画
                setTimeout(() => {
                    $confetti.addClass('fall');
                }, 50);
                
                // 动画结束后移除
                setTimeout(() => {
                    $confetti.remove();
                }, (randomDelay + randomDuration) * 1000);
            }
        },
        
        // 显示错误消息
        showError: function(message) {
            const $modal = $(`
                <div class="rcp-message-modal rcp-error-modal error">
                    <div class="rcp-modal-content">
                        <div class="rcp-modal-close"></div>
                        <div class="rcp-message-text">${message}</div>
                        <div class="rcp-message-actions">
                            <button type="button" class="button rcp-message-ok">我知道了</button>
                        </div>
                    </div>
                </div>
            `);
            
            $('body').append($modal);
            $modal.fadeIn(300);
            
            // 点击关闭按钮关闭
            $modal.find('.rcp-modal-close').on('click', () => {
                $modal.fadeOut(300, function() {
                    $(this).remove();
                });
            });
            
            // 点击确定按钮关闭
            $modal.find('.rcp-message-ok').on('click', () => {
                $modal.fadeOut(300, function() {
                    $(this).remove();
                });
            });
            
            // 自动关闭
            setTimeout(() => {
                $modal.fadeOut(300, function() {
                    $(this).remove();
                });
            }, 3000);
        }
    };
    
    // 按钮波纹效果
    function addRippleEffect($button) {
        $button.addClass('ripple');
        setTimeout(() => {
            $button.removeClass('ripple');
        }, 600);
    }
    
    // 兑换表单提交
    $('#rcp-redeem-form').on('submit', function(e) {
        e.preventDefault();
        
        if (!rcpFrontend.is_user_logged_in) {
            Modal.showError('请先登录后再兑换');
            return;
        }
        
        const code = $('#rcp-redeem-code').val().trim();
        const $submitBtn = $(this).find('.rcp-submit-btn');
        const originalText = $submitBtn.text();
        
        if (!code) {
            Modal.showError('请输入兑换码');
            $('#rcp-redeem-code').focus();
            return;
        }
        
        // 添加波纹效果
        addRippleEffect($submitBtn);
        
        // 禁用按钮并显示加载状态
        $submitBtn.prop('disabled', true).addClass('loading').text('');
        
        $.ajax({
            url: rcpFrontend.ajax_url,
            type: 'POST',
            data: {
                action: 'rcp_redeem_code',
                code: code
            },
            success: function(response) {
                if (response.success) {
                    // 清空输入框
                    $('#rcp-redeem-code').val('');
                    
                    // 获取积分和类型信息
                    const points = response.data.points || 0;
                    const type = response.data.type || 'fixed';
                    const message = response.data.message || '恭喜获得积分！';
                    
                    // 显示红包动画
                    Modal.showRedpacket(points, type, message);
                    
                    // 触发成功事件
                    $(document).trigger('rcp_redeem_success', [response.data]);
                } else {
                    Modal.showError(response.data.message || '兑换失败，请重试');
                }
            },
            error: function() {
                Modal.showError('网络错误，请检查网络连接后重试');
            },
            complete: function() {
                // 恢复按钮状态
                $submitBtn.prop('disabled', false).removeClass('loading').text(originalText);
            }
        });
    });
    
    // 输入框焦点动画
    $('#rcp-redeem-code').on('focus', function() {
        $(this).parent().addClass('focused');
    }).on('blur', function() {
        $(this).parent().removeClass('focused');
    });
    
    // 输入框自动转换为大写（可选）
    $('#rcp-redeem-code').on('input', function() {
        this.value = this.value.toUpperCase();
    });
    
    // 点击弹层外部关闭
    $(document).on('click', '.rcp-message-modal', function(e) {
        if ($(e.target).hasClass('rcp-message-modal') && $(this).hasClass('opened')) {
            $(this).fadeOut(300, function() {
                $(this).remove();
            });
        }
    });
});
