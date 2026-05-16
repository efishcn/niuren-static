/**
 * Modern Invite System - Admin JavaScript
 * Handles admin functionality, QR code generation, and copy functions
 */

jQuery(document).ready(function($) {
    'use strict';

    // Initialize admin functionality
    MISAdmin.init();
});

// Ensure jQuery is available globally for our functions
if (typeof $ === 'undefined') {
    var $ = jQuery;
}

var MISAdmin = {
    init: function() {
        this.bindEvents();
        this.initTooltips();
    },

    bindEvents: function() {
        // Copy to clipboard functionality - only for buttons with onclick attribute or in invite links section
        $(document).on('click', '.mis-invite-links .mis-copy-btn', function(e) {
            e.preventDefault();
            var targetId = $(this).data('target') || $(this).prev('input, textarea').attr('id');
            MISAdmin.copyToClipboard(targetId, $(this));
        });

        // Generate QR code functionality - only for buttons with onclick attribute or in invite links section
        $(document).on('click', '.mis-invite-links .mis-qr-btn', function(e) {
            e.preventDefault();
            var url = $(this).data('url') || $(this).prev().prev('input').val();
            MISAdmin.generateQRCode(url);
        });

        // Download QR code functionality - only for modal download button
        $(document).on('click', '.mis-modal .mis-download-btn', function(e) {
            e.preventDefault();
            MISAdmin.downloadQRCode();
        });

        // Handle onclick attribute buttons (for template compatibility)
        $(document).on('click', '[onclick*="misCopyToClipboard"]', function(e) {
            e.preventDefault();
            // Extract parameters from onclick attribute
            var onclickAttr = $(this).attr('onclick');
            var matches = onclickAttr.match(/misCopyToClipboard\(['"]([^'"]+)['"]/);
            if (matches && matches[1]) {
                MISAdmin.copyToClipboard(matches[1], $(this));
            }
        });

        $(document).on('click', '[onclick*="misGenerateQR"]', function(e) {
            e.preventDefault();
            var onclickAttr = $(this).attr('onclick');
            var matches = onclickAttr.match(/misGenerateQR\(['"]([^'"]+)['"]/);
            if (matches && matches[1]) {
                MISAdmin.generateQRCode(matches[1]);
            }
        });

        // Close modal functionality
        $(document).on('click', '.mis-close', function(e) {
            e.preventDefault();
            MISAdmin.closeModal();
        });

        // Close modal when clicking outside
        $(document).on('click', '.mis-modal', function(e) {
            if (e.target === this) {
                MISAdmin.closeModal();
            }
        });

        // Settings form validation
        $('#mis-settings-form').on('submit', function(e) {
            return MISAdmin.validateSettings();
        });

        // Real-time stats refresh
        if ($('.mis-stats-grid').length) {
            setInterval(function() {
                MISAdmin.refreshStats();
            }, 30000); // Refresh every 30 seconds
        }
    },

    copyToClipboard: function(elementId, button) {
        var element = $('#' + elementId);
        if (!element.length) return;

        var text = element.val() || element.text();
        
        // Use modern clipboard API if available
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(function() {
                MISAdmin.showCopySuccess(button);
            }).catch(function(err) {
                // Fallback to traditional method
                MISAdmin.fallbackCopyToClipboard(element, button);
            });
        } else {
            // Fallback for older browsers
            MISAdmin.fallbackCopyToClipboard(element, button);
        }

        // Track copy action via AJAX
        this.trackCopyAction(elementId);
    },

    fallbackCopyToClipboard: function(element, button) {
        element.select();
        element[0].setSelectionRange(0, 99999); // For mobile devices
        
        try {
            var successful = document.execCommand('copy');
            if (successful) {
                this.showCopySuccess(button);
            } else {
                this.showCopyError(button);
            }
        } catch (err) {
            this.showCopyError(button);
        }
        
        // Deselect the text
        if (window.getSelection) {
            window.getSelection().removeAllRanges();
        }
    },

    showCopySuccess: function(button) {
        var originalText = button.text();
        button.text('已复制！').addClass('mis-success');
        
        setTimeout(function() {
            button.text(originalText).removeClass('mis-success');
        }, 2000);
    },

    showCopyError: function(button) {
        var originalText = button.text();
        button.text('复制失败').addClass('mis-error');
        
        setTimeout(function() {
            button.text(originalText).removeClass('mis-error');
        }, 2000);
    },

    generateQRCode: function(url) {
        if (!url) {
            MISAdmin.showNotice('没有找到要生成二维码的链接', 'error');
            return;
        }

        // Show modal
        if ($('#mis-qr-modal').length === 0) {
            $('body').append('<div id="mis-qr-modal" class="mis-modal"><div class="mis-modal-content"><span class="mis-close">&times;</span><h3>邀请链接二维码</h3><div id="mis-qr-container"></div></div></div>');
        }
        $('#mis-qr-modal').show();
        $('#mis-qr-container').html('<div class="mis-loading">生成中...</div>');

        // Try QRCode library first, fall back to API
        if (typeof QRCode !== 'undefined') {
            $('#mis-qr-container').html('');
            var canvas = $('<canvas>').appendTo('#mis-qr-container')[0];
            QRCode.toCanvas(canvas, url, {
                width: 256, height: 256, margin: 2
            }, function(error) {
                if (error) {
                    $('#mis-qr-container').html('<img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' + encodeURIComponent(url) + '" alt="QR" style="border-radius:12px;">');
                }
            });
        } else {
            // Fallback to QR API
            $('#mis-qr-container').html('<img src="https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' + encodeURIComponent(url) + '" alt="QR" style="border-radius:12px;">');
        }
    },

    downloadQRCode: function() {
        var canvas = $('#mis-qr-container canvas')[0];
        var img = $('#mis-qr-container img')[0];
        if (canvas) {
            var link = document.createElement('a');
            link.download = 'invite-qrcode.png';
            link.href = canvas.toDataURL();
            link.click();
            MISAdmin.showNotice('二维码已下载', 'success');
        } else if (img) {
            var link = document.createElement('a');
            link.download = 'invite-qrcode.png';
            link.href = img.src;
            link.target = '_blank';
            link.click();
            MISAdmin.showNotice('二维码已打开，请长按保存', 'success');
        } else {
            MISAdmin.showNotice('没有找到二维码', 'error');
        }
    },

    closeModal: function() {
        $('.mis-modal').hide();
    },

    trackCopyAction: function(elementId) {
        if (typeof mis_ajax === 'undefined') return;

        $.ajax({
            url: mis_ajax.ajaxurl,
            type: 'POST',
            data: {
                action: 'mis_copy_invite_link',
                nonce: mis_ajax.nonce,
                link_type: elementId.includes('message') ? 'message' : 'simple'
            },
            success: function(response) {
                console.log('Copy action tracked');
            }
        });
    },

    refreshStats: function() {
        if (typeof mis_ajax === 'undefined') return;

        $.ajax({
            url: mis_ajax.ajaxurl,
            type: 'POST',
            data: {
                action: 'mis_get_invite_info',
                nonce: mis_ajax.nonce
            },
            success: function(response) {
                if (response.success && response.data.stats) {
                    var stats = response.data.stats;
                    $('.mis-stat-card').each(function() {
                        var period = $(this).data('period');
                        if (period && stats[period] !== undefined) {
                            $(this).find('.mis-stat-value').text(stats[period]);
                        }
                    });
                }
            }
        });
    },

    validateSettings: function() {
        var errors = [];

        // Validate invite points (name="mis_invite_points")
        var invitePoints = parseInt($('[name="mis_invite_points"]').val());
        if (isNaN(invitePoints) || invitePoints < 0) {
            errors.push('邀请积分必须是一个非负整数');
        }

        // Validate individual commission rates
        var indL1 = parseFloat($('[name="mis_individual_l1_rate"]').val());
        var indL2 = parseFloat($('[name="mis_individual_l2_rate"]').val());
        if (isNaN(indL1) || indL1 < 0 || indL1 > 1) {
            errors.push('个人一级返佣比例必须在0-1之间');
        }
        if (isNaN(indL2) || indL2 < 0 || indL2 > 1) {
            errors.push('个人二级返佣比例必须在0-1之间');
        }

        // Validate channel commission rates
        var chL1 = parseFloat($('[name="mis_channel_l1_rate"]').val());
        var chL2 = parseFloat($('[name="mis_channel_l2_rate"]').val());
        if (isNaN(chL1) || chL1 < 0 || chL1 > 1) {
            errors.push('渠道一级返佣比例必须在0-1之间');
        }
        if (isNaN(chL2) || chL2 < 0 || chL2 > 1) {
            errors.push('渠道二级返佣比例必须在0-1之间');
        }

        // Validate cookie duration
        var cookieDuration = parseInt($('[name="mis_cookie_duration"]').val());
        if (isNaN(cookieDuration) || cookieDuration < 1) {
            errors.push('Cookie有效期必须是一个正整数');
        }

        if (errors.length > 0) {
            MISAdmin.showNotice(errors.join('<br>'), 'error');
            return false;
        }
        return true;
    },

    initTooltips: function() {
        // Add tooltips for help text
        $('[data-tooltip]').each(function() {
            var $this = $(this);
            var tooltip = $('<div class="mis-tooltip">' + $this.data('tooltip') + '</div>');
            
            $this.on('mouseenter', function() {
                $('body').append(tooltip);
                tooltip.fadeIn(200);
            }).on('mouseleave', function() {
                tooltip.fadeOut(200, function() {
                    tooltip.remove();
                });
            }).on('mousemove', function(e) {
                tooltip.css({
                    left: e.pageX + 10,
                    top: e.pageY + 10
                });
            });
        });
    },

    showNotice: function(message, type) {
        type = type || 'success';
        var notice = $('<div class="mis-notice mis-notice-' + type + '">' + message + '</div>');
        
        $('.mis-admin-wrapper').prepend(notice);
        
        setTimeout(function() {
            notice.fadeOut(500, function() {
                notice.remove();
            });
        }, 3000);
    }
};

// Global functions for template use
window.misCopyToClipboard = function(elementId, type) {
    type = type || 'simple';
    var button = $('.mis-copy-btn[onclick*="' + elementId + '"]');
    MISAdmin.copyToClipboard(elementId, button);
};

window.misGenerateQR = function(url) {
    MISAdmin.generateQRCode(url);
};

window.misCloseQRModal = function() {
    MISAdmin.closeModal();
};

window.misDownloadQR = function() {
    MISAdmin.downloadQRCode();
};

// Add custom CSS for dynamic elements
$(document).ready(function() {
    var customCSS = `
        <style>
        .mis-success {
            background: #10b981 !important;
        }
        .mis-error {
            background: #ef4444 !important;
        }
        .mis-tooltip {
            position: absolute;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 10001;
            max-width: 200px;
            word-wrap: break-word;
            display: none;
        }
        .mis-loading {
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100px;
            font-size: 16px;
            color: #2563eb;
        }
        .mis-notice {
            position: fixed;
            top: 32px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 99999;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            color: white;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
            animation: misSlideDown 0.3s ease-out;
            max-width: 90vw;
        }
        .mis-notice-error { background: #ef4444; }
        .mis-notice-success { background: #10b981; }
        .mis-notice-info { background: #2563eb; }
        @keyframes misSlideDown {
            from { opacity: 0; transform: translateX(-50%) translateY(-16px); }
            to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        </style>
    `;
    $('head').append(customCSS);
});
