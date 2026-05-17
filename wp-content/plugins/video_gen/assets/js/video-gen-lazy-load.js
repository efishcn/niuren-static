(function($) {
    'use strict';

    var cache = {};

    /**
     * Fetch resource list via AJAX, cache it
     */
    function fetchResourceList(resource, params) {
        var cacheKey = resource + '_' + JSON.stringify(params || {});
        if (cache[cacheKey]) {
            return $.Deferred().resolve(cache[cacheKey]).promise();
        }

        var actionMap = {
            'platform': 'video_gen_get_platforms',
            'model': 'video_gen_get_models',
            'voice': 'video_gen_get_voices',
            'video_cover_style': 'video_gen_get_video_styles',
            'bgm': 'video_gen_get_bgm_list'
        };

        var action = actionMap[resource];
        if (!action) {
            return $.Deferred().reject('Unknown resource: ' + resource).promise();
        }

        var data = {
            action: action,
            nonce: videoGenAjax.nonce
        };

        if (params) {
            $.extend(data, params);
        }

        return $.ajax({
            url: videoGenAjax.ajaxurl,
            type: 'POST',
            data: data
        }).then(function(response) {
            if (response.success) {
                cache[cacheKey] = response.data;
                return response.data;
            }
            return [];
        });
    }

    /**
     * Populate a select with options from resource data
     */
    function populateOptions($select, items, resource) {
        var configs = {
            'model': {
                valueKey: 'identifier',
                labelFunc: function(m) { return m.model_name + ' (消耗' + m.credit + '积分)'; }
            },
            'voice': {
                valueKey: 'voice_id',
                labelFunc: function(v) { return v.title; }
            },
            'video_cover_style': {
                valueKey: 'style_code',
                labelFunc: function(s) { return s.style_name; }
            },
            'bgm': {
                valueKey: 'file_name',
                labelFunc: function(m) { return m.title; }
            },
            'platform': {
                valueKey: 'platform_code',
                labelFunc: function(p) { return p.platform_name; }
            }
        };

        var config = configs[resource] || { valueKey: 'id', labelFunc: function(i) { return i.name || i.title; } };
        var currentVal = $select.data('current-value') || $select.val();

        // Keep the currently selected/default option
        var $selectedOption = $select.find('option:selected');
        $select.empty();

        // Re-add the current selection placeholder first
        if ($selectedOption.length && $selectedOption.val()) {
            $select.append($selectedOption.clone());
        }

        $.each(items, function(i, item) {
            var value = item[config.valueKey];
            var label = config.labelFunc(item);
            var $option = $('<option>').val(value).text(label);
            if (value == currentVal) {
                $option.prop('selected', true);
            }
            $select.append($option);
        });

        $select.trigger('change');
    }

    /**
     * Load and populate platform modal
     */
    function loadPlatformModal($container) {
        fetchResourceList('platform').then(function(items) {
            var html = '';
            $.each(items, function(i, p) {
                html += '<div class="platform-item" data-code="' + p.platform_code + '" data-name="' + p.platform_name + '">';
                html += '<span class="platform-name">' + p.platform_name + '</span>';
                if (p.platform_desc) {
                    html += '<span class="platform-desc">' + p.platform_desc + '</span>';
                }
                html += '</div>';
            });
            $container.html(html);

            // Re-bind click events
            $container.find('.platform-item').click(function() {
                var code = $(this).data('code');
                var name = $(this).data('name');
                $('input[name="platform"]').val(code);
                $('.selected-platform-name').text(name);
                $container.closest('.platform-modal').hide();
            });
        });
    }

    /**
     * Initialize lazy-load on all [data-lazy-resource] elements
     */
    $(document).on('click focus', '[data-lazy-resource]', function() {
        var $el = $(this);
        var resource = $el.data('lazy-resource');

        // Skip if already loaded
        if ($el.data('lazy-loaded')) return;

        var params = {};
        if ($el.data('voice-type')) {
            params.voice_type = $el.data('voice-type');
        }

        fetchResourceList(resource, params).then(function(items) {
            if ($el.is('select')) {
                populateOptions($el, items, resource);
            }
            $el.data('lazy-loaded', true);
        });
    });

    /**
     * Initialize lazy-load on platform modal container
     */
    $(document).on('click', '.platform-selector-trigger', function() {
        var $modal = $('.platform-modal .platform-list');
        if ($modal.length && !$modal.data('lazy-loaded')) {
            loadPlatformModal($modal);
            $modal.data('lazy-loaded', true);
        }
    });

    // Expose for use by video-gen.js
    window.VideoGenLazy = {
        fetchResourceList: fetchResourceList,
        loadPlatformModal: loadPlatformModal,
        cache: cache
    };

})(jQuery);
