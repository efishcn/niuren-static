// Modern Credit Package JavaScript
jQuery(document).ready(function($) {
    'use strict';
    
    // Category filter functionality
    $('.category-tab').on('click', function() {
        var categoryId = $(this).data('category');
        var currentUrl = new URL(window.location.href);
        
        // Update URL parameter
        if (categoryId === 0) {
            currentUrl.searchParams.delete('category');
        } else {
            currentUrl.searchParams.set('category', categoryId);
        }
        
        // Reload page with new category
        window.location.href = currentUrl.toString();
    });
    
    // Purchase button click handler
    $('.buy-button').on('click', function(e) {
        e.preventDefault();
        
        var $button = $(this);
        var $card = $button.closest('.package-card');
        var packageId = $button.data('package-id');
        
        // Prevent double-clicking
        if ($button.prop('disabled')) {
            return;
        }
        
        // Add loading state
        $button.prop('disabled', true);
        $card.addClass('loading');
        
        var originalText = $button.find('.button-text').text();
        $button.find('.button-text').text('处理中...');
        
        // Prepare data
        var data = {
            action: 'handle_purchase',
            nonce: creditPackageAjax.nonce,
            package_id: packageId
        };
        
        // Send AJAX request
        $.ajax({
            url: creditPackageAjax.ajaxUrl,
            type: 'POST',
            data: data,
            timeout: 30000,
            success: function(response) {
                if (response.success) {
                    // Show success feedback
                    showNotification('正在跳转到支付页面...', 'success');
                    
                    // Redirect to payment URL
                    setTimeout(function() {
                        window.location.href = response.data.pay_url;
                    }, 500);
                } else {
                    // Show error message
                    var message = response.data && response.data.message 
                        ? response.data.message 
                        : '购买失败，请重试';
                    showNotification(message, 'error');
                    
                    // Reset button
                    resetButton($button, $card, originalText);
                }
            },
            error: function(xhr, status, error) {
                // Handle AJAX errors
                var message = '发生错误：' + (error || '请求失败');
                
                if (status === 'timeout') {
                    message = '请求超时，请检查网络连接';
                } else if (xhr.status === 403) {
                    message = '权限不足，请重新登录';
                } else if (xhr.status === 500) {
                    message = '服务器错误，请稍后重试';
                }
                
                showNotification(message, 'error');
                resetButton($button, $card, originalText);
            }
        });
    });
    
    // Reset button to original state
    function resetButton($button, $card, originalText) {
        setTimeout(function() {
            $button.prop('disabled', false);
            $card.removeClass('loading');
            $button.find('.button-text').text(originalText);
        }, 1000);
    }
    
    // Show notification
    function showNotification(message, type) {
        // Remove existing notifications
        $('.credit-package-notification').remove();
        
        var iconClass = type === 'success' ? '✓' : '✕';
        var bgColor = type === 'success' 
            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' 
            : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
        
        var $notification = $('<div>', {
            class: 'credit-package-notification',
            html: '<span class="notification-icon">' + iconClass + '</span>' +
                  '<span class="notification-message">' + message + '</span>'
        }).css({
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: bgColor,
            color: 'white',
            padding: '1rem 1.5rem',
            borderRadius: '50px',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.2)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            fontSize: '1rem',
            fontWeight: '600',
            animation: 'slideInRight 0.3s ease-out',
            maxWidth: '400px'
        });
        
        $('body').append($notification);
        
        // Auto-remove after 5 seconds
        setTimeout(function() {
            $notification.css({
                animation: 'slideOutRight 0.3s ease-out'
            });
            setTimeout(function() {
                $notification.remove();
            }, 300);
        }, 5000);
    }
    
    // Add notification animations to document
    if (!$('#credit-package-animations').length) {
        $('<style>', {
            id: 'credit-package-animations',
            html: '@keyframes slideInRight {' +
                  '  from { transform: translateX(100%); opacity: 0; }' +
                  '  to { transform: translateX(0); opacity: 1; }' +
                  '}' +
                  '@keyframes slideOutRight {' +
                  '  from { transform: translateX(0); opacity: 1; }' +
                  '  to { transform: translateX(100%); opacity: 0; }' +
                  '}' +
                  '.notification-icon {' +
                  '  display: flex;' +
                  '  align-items: center;' +
                  '  justify-content: center;' +
                  '  width: 24px;' +
                  '  height: 24px;' +
                  '  border-radius: 50%;' +
                  '  background: rgba(255, 255, 255, 0.2);' +
                  '  font-weight: 700;' +
                  '}' +
                  '@media (max-width: 768px) {' +
                  '  .credit-package-notification {' +
                  '    top: 10px !important;' +
                  '    right: 10px !important;' +
                  '    left: 10px !important;' +
                  '    max-width: none !important;' +
                  '    font-size: 0.875rem !important;' +
                  '  }' +
                  '}'
        }).appendTo('head');
    }
    
    // Smooth scroll to packages on category change
    if (window.location.hash === '#packages') {
        $('html, body').animate({
            scrollTop: $('.credit-package-grid').offset().top - 100
        }, 500);
    }
    
    // Add hover effects for package cards
    $('.package-card').each(function() {
        var $card = $(this);
        var $badge = $card.find('.package-badge');
        
        $card.on('mouseenter', function() {
            $badge.css('transform', 'scale(1.1) rotate(5deg)');
        });
        
        $card.on('mouseleave', function() {
            $badge.css('transform', 'scale(1) rotate(0deg)');
        });
    });
    
    // Keyboard navigation for category tabs
    $('.category-tab').on('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            $(this).click();
        }
    });
    
    // Add ARIA labels for accessibility
    $('.category-tab').attr('role', 'tab');
    $('.buy-button').attr('aria-label', function() {
        var packageName = $(this).closest('.package-card').find('.package-name').text();
        return '购买 ' + packageName;
    });
    
    // Lazy load package descriptions if they're long
    $('.package-description').each(function() {
        var $desc = $(this);
        if ($desc[0].scrollHeight > $desc.height()) {
            $desc.addClass('has-more-content');
            
            // Add a subtle gradient overlay to indicate more content
            $desc.css({
                'position': 'inherit'
            }).append('<div class="scroll-indicator" style="' +
                'position: absolute; ' +
                'bottom: 0; ' +
                'left: 0; ' +
                'right: 0; ' +
                'height: 30px; ' +
                'background: linear-gradient(to bottom, transparent, var(--bg-secondary)); ' +
                'pointer-events: none;' +
            '"></div>');
            
            // Remove indicator when scrolled to bottom
            $desc.on('scroll', function() {
                var isAtBottom = Math.abs(
                    this.scrollHeight - this.scrollTop - this.clientHeight
                ) < 1;
                
                if (isAtBottom) {
                    $(this).find('.scroll-indicator').fadeOut();
                } else {
                    $(this).find('.scroll-indicator').fadeIn();
                }
            });
        }
    });
    
    // Track page visibility for analytics (optional)
    var startTime = Date.now();
    
    $(window).on('beforeunload', function() {
        var timeSpent = Math.round((Date.now() - startTime) / 1000);
        // You can send this data to analytics if needed
        console.log('Time spent on page:', timeSpent, 'seconds');
    });
    
    // Add ripple effect to buttons
    $('.buy-button, .category-tab').on('click', function(e) {
        var $button = $(this);
        var $ripple = $('<span class="ripple"></span>');
        var diameter = Math.max($button.width(), $button.height());
        var radius = diameter / 2;
        
        $ripple.css({
            width: diameter,
            height: diameter,
            left: e.pageX - $button.offset().left - radius,
            top: e.pageY - $button.offset().top - radius
        });
        
        $button.append($ripple);
        
        setTimeout(function() {
            $ripple.remove();
        }, 600);
    });
    
    // Add ripple effect styles
    if (!$('#ripple-styles').length) {
        $('<style>', {
            id: 'ripple-styles',
            html: '.ripple {' +
                  '  position: absolute;' +
                  '  border-radius: 50%;' +
                  '  background: rgba(255, 255, 255, 0.5);' +
                  '  transform: scale(0);' +
                  '  animation: ripple-animation 0.6s ease-out;' +
                  '  pointer-events: none;' +
                  '}' +
                  '@keyframes ripple-animation {' +
                  '  to {' +
                  '    transform: scale(4);' +
                  '    opacity: 0;' +
                  '  }' +
                  '}'
        }).appendTo('head');
    }
    
    // Log plugin initialization
    console.log('Credit Package plugin initialized successfully');
});
