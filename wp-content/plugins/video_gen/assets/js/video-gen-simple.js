jQuery(function($) {
    var containers = {
        templates: $('#vg-templates'),
        options: $('#vg-options'),
        optionsContent: $('#vg-options-content'),
        preview: $('#vg-preview'),
        previewText: $('#vg-preview-text'),
        submit: $('#vg-submit'),
        submitBtn: $('#vg-submit-btn'),
        loading: $('#vg-loading'),
        toast: $('#vg-toast'),
        backBtn: $('#vg-back-btn'),
        steps: $('.vg-step')
    };

    var state = {
        selectedTemplateId: null,
        templateData: null,       // 模板基本数据 (platform, model, content)
        options: [],              // 该模板的所有选项配置
        selectedValues: {},       // key -> value(s)  芯片选中值
        customValues: {},         // key -> value  手动输入值（优先于芯片值）
        hasTemplateContent: false
    };

    var allTemplateData = {};

    // 初始化：缓存所有模板的数据
    function initTemplateData() {
        $('.vg-template-card').each(function() {
            var $card = $(this);
            allTemplateData[$card.data('id')] = {
                platform: $card.data('platform'),
                model: $card.data('model')
            };
        });
    }

    // ========== 步骤指示器更新 ==========
    function updateSteps(activeStep) {
        containers.steps.removeClass('active done');
        containers.steps.each(function() {
            var s = parseInt($(this).data('step'));
            if (s < activeStep) $(this).addClass('done');
            if (s === activeStep) $(this).addClass('active');
        });
    }

    // ========== 选择模板 ==========
    containers.templates.on('click', '.vg-template-card', function() {
        var $card = $(this);
        var tplId = $card.data('id');

        // 高亮选中
        $('.vg-template-card').removeClass('selected');
        $card.addClass('selected');

        state.selectedTemplateId = tplId;
        state.templateData = allTemplateData[tplId];
        state.selectedValues = {};
        state.customValues = {};
        state.hasTemplateContent = false;

        updateSteps(2);

        // 加载选项
        loadOptions(tplId);
    });

    // ========== 返回选择模板 ==========
    containers.backBtn.on('click', function() {
        $('.vg-template-card').removeClass('selected');
        containers.options.hide();
        containers.preview.hide();
        containers.submit.hide();
        state.selectedTemplateId = null;
        state.selectedValues = {};
        state.customValues = {};
        updateSteps(1);
    });

    // ========== 加载选项 ==========
    function loadOptions(tplId) {
        $.post(videoGenSimple.ajaxurl, {
            action: 'video_gen_get_template_options',
            template_id: tplId,
            nonce: videoGenSimple.nonce
        }, function(res) {
            if (res.success) {
                state.options = res.data.options;
                state.templateData.template_content = res.data.template_content;
                state.templateData.platform = res.data.platform || state.templateData.platform;
                state.templateData.model = res.data.model || state.templateData.model;
                state.hasTemplateContent = !!res.data.template_content;

                renderOptions();
            } else {
                showToast('加载选项失败: ' + (res.data.message || '未知错误'), 'error');
            }
        });
    }

    // ========== 渲染选项组 ==========
    function renderOptions() {
        if (!state.options.length) {
            containers.optionsContent.html('<p style="text-align:center;color:#999;">该模板无需填写选项</p>');
            containers.options.show();
            return;
        }

        var html = '';
        $.each(state.options, function(i, opt) {
            var values = opt.option_values;
            if (typeof values === 'string') {
                try { values = JSON.parse(values); } catch(e) { values = [values]; }
            }

            var allowCustom = (opt.allow_custom == 1);
            var defaultVal = opt.default_value || '';

            html += '<div class="vg-option-group" data-key="' + opt.option_key + '" data-type="' + opt.option_type + '" data-required="' + opt.required + '">';
            html += '<h4 class="vg-option-group-label">' + opt.option_label;
            if (opt.required == 1) html += '<span class="required-mark">*必填</span>';
            html += '</h4>';

            // 预设选项芯片
            html += '<div class="vg-option-chips">';
            $.each(values, function(j, val) {
                var chipClass = 'vg-option-chip';

                if (opt.option_type === 'single' && defaultVal === val && !state.customValues[opt.option_key]) {
                    chipClass += ' selected';
                    state.selectedValues[opt.option_key] = val;
                }
                if (opt.option_type === 'multi' && defaultVal) {
                    var defaults = defaultVal.split(',').map(function(s) { return s.trim(); });
                    if (defaults.indexOf(val) !== -1) {
                        chipClass += ' selected';
                        if (!state.selectedValues[opt.option_key]) {
                            state.selectedValues[opt.option_key] = [];
                        }
                        state.selectedValues[opt.option_key].push(val);
                    }
                }
                html += '<span class="' + chipClass + '" data-value="' + val + '">' + val + '</span>';
            });
            html += '</div>';

            // 手动输入区域
            if (allowCustom) {
                html += '<div class="vg-custom-input-area">';
                html += '<div class="vg-custom-input-label">或者自己输入</div>';
                html += '<textarea class="vg-custom-input-text" rows="2" placeholder="在这里输入您想要的内容..."></textarea>';
                html += '</div>';
            }

            html += '</div>';
        });

        containers.optionsContent.html(html);
        containers.options.show();
        containers.preview.show();
        containers.submit.show();

        updatePreview();

        // 自动滚动到选项区域
        $('html, body').animate({
            scrollTop: containers.options.offset().top - 40
        }, 400);
    }

    // ========== 点击芯片 ==========
    containers.optionsContent.on('click', '.vg-option-chip', function() {
        var $chip = $(this);
        var $group = $chip.closest('.vg-option-group');
        var key = $group.data('key');
        var type = $group.data('type');
        var val = $chip.data('value');

        // 清除手动输入
        var $customInput = $group.find('.vg-custom-input-text');
        if ($customInput.length) {
            $customInput.val('');
        }
        state.customValues[key] = null;

        if (type === 'single') {
            $group.find('.vg-option-chip').removeClass('selected');
            $chip.addClass('selected');
            state.selectedValues[key] = val;
        } else {
            $chip.toggleClass('selected');
            var selected = [];
            $group.find('.vg-option-chip.selected').each(function() {
                selected.push($(this).data('value'));
            });
            state.selectedValues[key] = selected.length ? selected : null;
        }

        updatePreview();
    });

    // ========== 手动输入 ==========
    containers.optionsContent.on('input', '.vg-custom-input-text', function() {
        var $input = $(this);
        var $group = $input.closest('.vg-option-group');
        var key = $group.data('key');
        var customText = $input.val().trim();

        if (customText) {
            // 手动输入时清除芯片选中
            $group.find('.vg-option-chip').removeClass('selected');
            state.selectedValues[key] = null;
            state.customValues[key] = customText;
        } else {
            state.customValues[key] = null;
        }

        updatePreview();
    });

    // ========== 获取某个选项的最终值（手动输入优先） ==========
    function getOptionValue(key) {
        if (state.customValues[key]) return state.customValues[key];
        return state.selectedValues[key] || null;
    }

    // ========== 更新提示词预览 ==========
    function updatePreview() {
        var template = state.templateData.template_content || '';
        var preview = template;

        if (template) {
            $.each(state.options, function(i, opt) {
                var val = getOptionValue(opt.option_key);
                if (val) {
                    var displayVal = Array.isArray(val) ? val.join('、') : val;
                    var regex = new RegExp('\\{' + opt.option_key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\}', 'g');
                    preview = preview.replace(regex, '<span class="highlight">' + displayVal + '</span>');
                }
            });
        } else {
            var parts = [];
            $.each(state.options, function(i, opt) {
                var val = getOptionValue(opt.option_key);
                if (val) {
                    var displayVal = Array.isArray(val) ? val.join('、') : val;
                    parts.push(opt.option_label + ': <span class="highlight">' + displayVal + '</span>');
                }
            });
            preview = parts.length ? parts.join('<br>') : '请先选择上方选项...';
        }

        containers.previewText.html(preview);
    }

    // ========== 提交生成 ==========
    containers.submitBtn.on('click', function() {
        // 验证必填项
        var missing = [];
        $.each(state.options, function(i, opt) {
            if (opt.required == 1) {
                var val = getOptionValue(opt.option_key);
                if (!val || (Array.isArray(val) && val.length === 0)) {
                    missing.push(opt.option_label);
                }
            }
        });

        if (missing.length) {
            showToast('请完成以下必填项: ' + missing.join('、'), 'error');
            return;
        }

        // 构造最终话题内容
        var topic = buildFinalTopic();
        if (!topic) {
            showToast('请至少选择一个选项', 'error');
            return;
        }

        // 验证必要配置
        if (!state.templateData.model) {
            showToast('该模板未配置生成模型，请联系管理员', 'error');
            return;
        }
        if (!state.templateData.platform) {
            showToast('该模板未配置目标平台，请联系管理员', 'error');
            return;
        }

        // 显示加载遮罩
        containers.loading.show();
        containers.submitBtn.prop('disabled', true);

        // 构造表单数据 - 模拟现有表单提交格式，补全所有必要默认值
        var formData = {
            model: state.templateData.model,
            platform: state.templateData.platform,
            content_mode: 'source',
            content_source: 'topic',
            topic: topic,
            video_aspect: '16:9',
            output_aspect: '9:16',
            voice_create_type: 'edge',
            voice_name: 'zh-CN-YunyeNeural-V2-Male',
            voice_model: 'b64760708f3e4ca0b1344d90a75a7731',
            bgm_type: 'custom',
            bgm_file: 'rouhezhiguang.mp3',
            bgm_volume: '0.5',
            subtitle_enabled: '1',
            enhance_subtitle: '1',
            enhance_display: '1',
            video_clip_duration: '3'
        };

        $.post(videoGenSimple.ajaxurl, {
            action: 'video_gen_ajax_submit',
            form_data: $.param(formData),
            nonce: videoGenSimple.nonce
        }, function(res) {
            containers.loading.hide();
            containers.submitBtn.prop('disabled', false);

            if (res.success) {
                updateSteps(4);
                showToast('视频生成任务已提交成功！', 'success');
                // 3秒后跳转到生成记录页
                setTimeout(function() {
                    window.location.href = videoGenSimple.records_url;
                }, 2000);
            } else {
                showToast(res.data.message || '提交失败，请重试', 'error');
            }
        }).fail(function() {
            containers.loading.hide();
            containers.submitBtn.prop('disabled', false);
            showToast('网络错误，请重试', 'error');
        });
    });

    // ========== 组装最终话题内容 ==========
    function buildFinalTopic() {
        var template = state.templateData.template_content || '';
        var result = template;

        if (template) {
            var hasAllRequired = true;
            $.each(state.options, function(i, opt) {
                var val = getOptionValue(opt.option_key);
                var replaceWith = '';
                if (val) {
                    replaceWith = Array.isArray(val) ? val.join('、') : val;
                } else if (opt.required == 1) {
                    hasAllRequired = false;
                    return false;
                }
                var regex = new RegExp('\\{' + opt.option_key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\}', 'g');
                result = result.replace(regex, replaceWith);
            });
            if (!hasAllRequired) return '';
        } else {
            var parts = [];
            $.each(state.options, function(i, opt) {
                var val = getOptionValue(opt.option_key);
                if (val) {
                    var displayVal = Array.isArray(val) ? val.join('、') : val;
                    parts.push(opt.option_label + ': ' + displayVal);
                }
            });
            result = parts.join('; ');
        }

        return result.replace(/\{[^}]+\}/g, '').trim();
    }

    // ========== Toast ==========
    function showToast(msg, type) {
        var $t = containers.toast;
        $t.text(msg).attr('class', 'vg-toast ' + type).show();
        clearTimeout($t.data('timer'));
        $t.data('timer', setTimeout(function() { $t.hide(); }, 3500));
    }

    // ========== 初始化 ==========
    initTemplateData();
    updateSteps(1);
});
