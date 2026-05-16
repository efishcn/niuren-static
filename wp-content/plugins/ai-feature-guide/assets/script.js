jQuery(document).ready(function($) {
    // 卡片悬停效果
    $('.feature-card').hover(
        function() {
            $(this).find('.card-icon').css('transform', 'scale(1.1) rotate(5deg)');
        },
        function() {
            $(this).find('.card-icon').css('transform', 'scale(1) rotate(0deg)');
        }
    );
    
    // 平滑滚动到卡片
    $('.hero-features .feature-tag').click(function() {
        var target = $(this).text().trim();
        var targetCard;
        
        if (target.includes('文案')) {
            targetCard = $('[data-feature="content"]');
        } else if (target.includes('视频')) {
            targetCard = $('[data-feature="video"]');
        } else if (target.includes('数字人')) {
            targetCard = $('[data-feature="digital"]');
        }
        
        if (targetCard && targetCard.length) {
            $('html, body').animate({
                scrollTop: targetCard.offset().top - 100
            }, 800);
            
            // 高亮效果
            targetCard.addClass('highlight');
            setTimeout(function() {
                targetCard.removeClass('highlight');
            }, 1000);
        }
    });
    
    // 统计数字动画
    function animateNumbers() {
        $('.stat-number').each(function() {
            var $this = $(this);
            var text = $this.text();
            
            if (text.includes('%')) {
                var num = parseInt(text);
                $this.text('0%');
                $({ count: 0 }).animate({ count: num }, {
                    duration: 1000,
                    step: function() {
                        $this.text(Math.floor(this.count) + '%');
                    },
                    complete: function() {
                        $this.text(text);
                    }
                });
            }
        });
    }
    
    // 当页面加载完成后执行数字动画
    setTimeout(animateNumbers, 1000);
    
    // 添加点击跟踪
    $('.btn-primary, .btn-cta').click(function() {
        var buttonText = $(this).text().trim();
        console.log('用户点击了: ' + buttonText);
        
        // 这里可以添加统计代码
        // 例如 Google Analytics 或其他统计工具
    });
});

// 添加高亮样式
var style = document.createElement('style');
style.textContent = `
    .feature-card.highlight {
        animation: pulse 1s ease-in-out;
        border: 2px solid #667eea;
    }
    
    @keyframes pulse {
        0% { box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1); }
        50% { box-shadow: 0 25px 50px rgba(102, 126, 234, 0.3); }
        100% { box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1); }
    }
    
    .card-icon {
        transition: transform 0.3s ease;
    }
`;
document.head.appendChild(style);