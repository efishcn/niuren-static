jQuery(document).ready(function($) {
    'use strict';
    
    console.log('[VideoGen-Minimal] Starting minimal initialization...');
    console.log('[VideoGen-Minimal] Document ready state:', document.readyState);
    console.log('[VideoGen-Minimal] Page URL:', window.location.href);
    console.log('[VideoGen-Minimal] User agent:', navigator.userAgent);
    console.log('[VideoGen-Minimal] jQuery version:', $.fn.jquery);
    
    // 检查页面元素
    console.log('[VideoGen-Minimal] Body classes:', $('body').attr('class'));
    console.log('[VideoGen-Minimal] video-gen-records-wrap count:', $('.video-gen-records-wrap').length);
    console.log('[VideoGen-Minimal] video-card count:', $('.video-card').length);
    console.log('[VideoGen-Minimal] wp-list-table count:', $('.wp-list-table').length);
    
    // 创建最简命名空间
    window.VideoGenAdminMinimal = {
        initialized: true
    };
    
    // 确保页面元素可见
    $('.video-gen-records-wrap, .video-gen-wrap, .video-card').css({
        'opacity': '1',
        'visibility': 'visible'
    });
    
    console.log('[VideoGen-Minimal] Ensured elements are visible');
    
    // 最基本的表单提交（如果存在）
    $('#video-gen-form').on('submit', function(e) {
        console.log('[VideoGen-Minimal] Form submit detected');
    });
    
    // 基本的按钮点击日志
    $('.dh-action-btn, .video-gen-resubmit, .view-details-btn').on('click', function(e) {
        console.log('[VideoGen-Minimal] Button clicked:', $(this).attr('class'));
    });
    
    console.log('[VideoGen-Minimal] Minimal initialization completed');
});
