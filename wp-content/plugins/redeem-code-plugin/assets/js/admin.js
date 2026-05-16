jQuery(document).ready(function($) {
    'use strict';
    
    // 弹层管理对象
    const Modal = {
        // 显示弹层
        show: function(modalId) {
            $('#' + modalId).fadeIn(200);
        },
        
        // 隐藏弹层
        hide: function(modalId) {
            $('#' + modalId).fadeOut(200);
        },
        
        // 显示消息弹层
        showMessage: function(message, type = 'success') {
            const $modal = $('#rcp-message-modal');
            const $icon = $modal.find('.rcp-message-icon');
            const $text = $modal.find('.rcp-message-text');
            
            $icon.removeClass('success error').addClass(type);
            $text.text(message);
            
            this.show('rcp-message-modal');
            
            // 自动关闭
            setTimeout(() => {
                this.hide('rcp-message-modal');
            }, 2000);
        }
    };
    
    // 添加兑换码按钮
    $('.rcp-add-code-btn').on('click', function() {
        $('#rcp-modal-title').text('添加兑换码');
        $('#rcp-code-form')[0].reset();
        $('#rcp-code-id').val('');
        // 确保默认选中固定积分模式
        $('#rcp-type').val('fixed').trigger('change');
        Modal.show('rcp-code-modal');
    });
    
    // 编辑兑换码按钮
    $(document).on('click', '.rcp-btn-edit', function() {
        const codeId = $(this).data('id');
        
        $.ajax({
            url: rcpAdmin.ajax_url,
            type: 'POST',
            data: {
                action: 'rcp_get_code',
                id: codeId,
                nonce: rcpAdmin.nonce
            },
            success: function(response) {
                if (response.success) {
                    const code = response.data.code;
                    $('#rcp-modal-title').text('编辑兑换码');
                    $('#rcp-code-id').val(code.id);
                    $('#rcp-code').val(code.code);
                    $('#rcp-points').val(code.points);
                    $('#rcp-type').val(code.type);
                    $('#rcp-max-uses').val(code.max_uses);
                    $('#rcp-user-limit').val(code.user_limit);
                    
                    // 设置积分范围字段
                    if (code.min_points) {
                        $('#rcp-min-points').val(code.min_points);
                    }
                    if (code.max_points) {
                        $('#rcp-max-points').val(code.max_points);
                    }
                    
                    // 转换日期时间格式
                    const expiryDate = code.expiry_date.replace(' ', 'T');
                    $('#rcp-expiry-date').val(expiryDate);
                    
                    // 触发类型变化以显示/隐藏积分范围字段
                    $('#rcp-type').trigger('change');
                    
                    Modal.show('rcp-code-modal');
                } else {
                    Modal.showMessage(response.data.message, 'error');
                }
            },
            error: function() {
                Modal.showMessage('网络错误，请重试', 'error');
            }
        });
    });
    
    // 删除兑换码按钮
    $(document).on('click', '.rcp-btn-delete', function() {
        if (!confirm(rcpAdmin.strings.confirm_delete)) {
            return;
        }
        
        const codeId = $(this).data('id');
        const $row = $(this).closest('tr');
        
        $.ajax({
            url: rcpAdmin.ajax_url,
            type: 'POST',
            data: {
                action: 'rcp_delete_code',
                id: codeId,
                nonce: rcpAdmin.nonce
            },
            success: function(response) {
                if (response.success) {
                    $row.fadeOut(300, function() {
                        $(this).remove();
                        // 如果列表为空，显示提示
                        if ($('#rcp-codes-list tr').length === 0) {
                            $('#rcp-codes-list').html('<tr><td colspan="8" style="text-align: center;">暂无数据</td></tr>');
                        }
                    });
                    Modal.showMessage(response.data.message, 'success');
                } else {
                    Modal.showMessage(response.data.message, 'error');
                }
            },
            error: function() {
                Modal.showMessage('网络错误，请重试', 'error');
            }
        });
    });
    
    // 查看领取详情按钮
    $(document).on('click', '.rcp-view-records-btn', function() {
        const codeId = $(this).data('id');
        loadRecords(codeId, 1);
        Modal.show('rcp-records-modal');
    });
    
    // 加载领取详情
    function loadRecords(codeId, page = 1) {
        const $list = $('#rcp-records-list');
        $list.html('<tr><td colspan="5" style="text-align: center;">加载中...</td></tr>');
        
        $.ajax({
            url: rcpAdmin.ajax_url,
            type: 'POST',
            data: {
                action: 'rcp_get_records',
                code_id: codeId,
                page: page,
                nonce: rcpAdmin.nonce
            },
            success: function(response) {
                if (response.success) {
                    const records = response.data.records;
                    const total = response.data.total;
                    const pages = response.data.pages;
                    
                    if (records.length > 0) {
                        let html = '';
                        records.forEach(function(record) {
                            html += '<tr>';
                            html += '<td>' + record.id + '</td>';
                            html += '<td>' + record.user_id + '</td>';
                            html += '<td>' + (record.username || '未知用户') + '</td>';
                            html += '<td>' + record.points + '</td>';
                            html += '<td>' + record.redeem_date + '</td>';
                            html += '</tr>';
                        });
                        $list.html(html);
                        
                        // 显示分页
                        if (pages > 1) {
                            let pagination = '<div class="tablenav-pages">';
                            pagination += '<span class="displaying-num">' + total + ' 项</span>';
                            pagination += '</div>';
                            $('#rcp-records-pagination').html(pagination);
                        } else {
                            $('#rcp-records-pagination').html('');
                        }
                    } else {
                        $list.html('<tr><td colspan="5" style="text-align: center;">暂无领取记录</td></tr>');
                        $('#rcp-records-pagination').html('');
                    }
                } else {
                    $list.html('<tr><td colspan="5" style="text-align: center;">加载失败</td></tr>');
                }
            },
            error: function() {
                $list.html('<tr><td colspan="5" style="text-align: center;">网络错误</td></tr>');
            }
        });
    }
    
    // 保存兑换码表单
    $('#rcp-code-form').on('submit', function(e) {
        e.preventDefault();
        
        const formData = $(this).serialize();
        const $submitBtn = $(this).find('button[type="submit"]');
        const originalText = $submitBtn.text();
        
        $submitBtn.prop('disabled', true).text('保存中...');
        
        $.ajax({
            url: rcpAdmin.ajax_url,
            type: 'POST',
            data: formData + '&action=rcp_save_code&nonce=' + rcpAdmin.nonce,
            success: function(response) {
                if (response.success) {
                    Modal.hide('rcp-code-modal');
                    Modal.showMessage(response.data.message, 'success');
                    
                    // 刷新页面
                    setTimeout(function() {
                        location.reload();
                    }, 1000);
                } else {
                    Modal.showMessage(response.data.message, 'error');
                }
            },
            error: function() {
                Modal.showMessage('网络错误，请重试', 'error');
            },
            complete: function() {
                $submitBtn.prop('disabled', false).text(originalText);
            }
        });
    });
    
    // 关闭弹层
    $('.rcp-modal-close, .rcp-modal-cancel').on('click', function() {
        $(this).closest('.rcp-modal').fadeOut(200);
    });
    
    // 点击弹层外部关闭
    $('.rcp-modal').on('click', function(e) {
        if ($(e.target).hasClass('rcp-modal')) {
            $(this).fadeOut(200);
        }
    });
    
    // 消息弹层确定按钮
    $('.rcp-message-ok').on('click', function() {
        Modal.hide('rcp-message-modal');
    });
    
    // 类型选择变化时显示/隐藏积分范围字段
    $('#rcp-type').on('change', function() {
        const type = $(this).val();
        const $pointsInput = $('#rcp-points');
        const $pointsGroup = $pointsInput.closest('.rcp-form-group');
        const $rangeGroup = $('.rcp-points-range-group');
        const $minPoints = $('#rcp-min-points');
        const $maxPoints = $('#rcp-max-points');
        
        if (type === 'random') {
            // 随机积分模式
            $pointsGroup.hide();
            $pointsInput.prop('required', false).val(''); // 移除required，清空值
            $rangeGroup.show();
            $minPoints.prop('required', true);
            $maxPoints.prop('required', true);
        } else {
            // 固定积分模式
            $pointsGroup.show();
            $pointsInput.prop('required', true);
            $rangeGroup.hide();
            $minPoints.prop('required', false).val(''); // 移除required，清空值
            $maxPoints.prop('required', false).val(''); // 移除required，清空值
        }
    });
    
    // 页面加载时初始化
    $('#rcp-type').trigger('change');
    
    // 为用户名添加tooltip显示登录名
    function loadRecordsWithTooltip(codeId, page = 1) {
        const $list = $('#rcp-records-list');
        $list.html('<tr><td colspan="5" style="text-align: center;">加载中...</td></tr>');
        
        $.ajax({
            url: rcpAdmin.ajax_url,
            type: 'POST',
            data: {
                action: 'rcp_get_records',
                code_id: codeId,
                page: page,
                nonce: rcpAdmin.nonce
            },
            success: function(response) {
                if (response.success) {
                    const records = response.data.records;
                    const total = response.data.total;
                    const pages = response.data.pages;
                    
                    if (records.length > 0) {
                        let html = '';
                        records.forEach(function(record) {
                            const displayName = record.display_name || record.username || '未知用户';
                            const loginName = record.username || '未知';
                            
                            html += '<tr>';
                            html += '<td>' + record.id + '</td>';
                            html += '<td>' + record.user_id + '</td>';
                            html += '<td><span class="rcp-username" title="登录名: ' + loginName + '">' + displayName + '</span></td>';
                            html += '<td>' + record.points + '</td>';
                            html += '<td>' + record.redeem_date + '</td>';
                            html += '</tr>';
                        });
                        $list.html(html);
                        
                        // 显示分页
                        if (pages > 1) {
                            let pagination = '<div class="tablenav-pages">';
                            pagination += '<span class="displaying-num">' + total + ' 项</span>';
                            pagination += '</div>';
                            $('#rcp-records-pagination').html(pagination);
                        } else {
                            $('#rcp-records-pagination').html('');
                        }
                    } else {
                        $list.html('<tr><td colspan="5" style="text-align: center;">暂无领取记录</td></tr>');
                        $('#rcp-records-pagination').html('');
                    }
                } else {
                    $list.html('<tr><td colspan="5" style="text-align: center;">加载失败</td></tr>');
                }
            },
            error: function() {
                $list.html('<tr><td colspan="5" style="text-align: center;">网络错误</td></tr>');
            }
        });
    }
    
    // 重新定义查看领取详情按钮事件，使用新的加载函数
    $(document).off('click', '.rcp-btn-view').on('click', '.rcp-btn-view', function() {
        const codeId = $(this).data('id');
        loadRecordsWithTooltip(codeId, 1);
        Modal.show('rcp-records-modal');
    });
    
    // ESC 键关闭弹层
    $(document).on('keydown', function(e) {
        if (e.key === 'Escape') {
            $('.rcp-modal:visible').fadeOut(200);
        }
    });
});
