jQuery(document).ready(function($) {
    // 视频上传
    $('#upload_video').click(function(e) {
        e.preventDefault();
        
        var mediaUploader = wp.media({
            title: '选择视频',
            button: {
                text: '使用此视频'
            },
            multiple: false,
            library: {
                type: 'video'
            }
        });
        
        mediaUploader.on('select', function() {
            var attachment = mediaUploader.state().get('selection').first().toJSON();
            $('#video_url').val(attachment.url);
            $('#video_id').val(attachment.id);
            
            // 更新预览
            var previewHtml = '<div class="video-preview" style="margin-top: 10px;">' +
                '<video width="320" controls' + (attachment.image ? ' poster="' + attachment.image.src + '"' : '') + '>' +
                '<source src="' + attachment.url + '" type="video/mp4">' +
                '您的浏览器不支持视频标签。' +
                '</video>' +
                '</div>';
            
            $('.video-preview').remove();
            $('#video_url').parent().append(previewHtml);
        });
        
        mediaUploader.open();
    });
}); 