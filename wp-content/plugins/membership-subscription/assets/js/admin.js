jQuery(function($){
    var modal = $('#pay-modal');
    var planId, price, actionType;

    $('.btn-buy').not(':disabled').click(function(){
        planId     = $(this).data('plan-id');
        var name   = $(this).data('plan-name');
        price      = $(this).data('price');
        actionType = $(this).data('action') || 'purchase';

        $('#modal-plan-name').text(name);
        $('#modal-price').text(parseFloat(price) > 0 ? '¥' + parseFloat(price).toFixed(2) : '免费');

        var actionLabels = {renewal:'续费（时间顺延）', upgrade:'升级（立即生效，替换当前会员）', purchase:'新订阅'};
        $('#modal-action-label').text(actionLabels[actionType] || '新订阅');

        if (actionType === 'upgrade') {
            $('#modal-tip').text('升级后当前会员将被取消，新套餐立即生效，剩余时间不予保留。');
        } else if (actionType === 'renewal') {
            $('#modal-tip').text('续费将在当前到期时间基础上顺延，每日配额不变。');
        } else {
            $('#modal-tip').text('点击"确认"后跳转微信支付，支付成功后自动开通会员。');
        }

        modal.fadeIn(300);
    });

    $('.modal-close, .btn-cancel, .modal-overlay').click(function(){
        modal.fadeOut(300);
    });

    $('.btn-confirm-pay').click(function(){
        var $btn = $(this);
        $btn.prop('disabled', true).text('处理中...');

        $.post(membershipAdminAjax.ajaxUrl, {
            action: 'membership_purchase',
            nonce: membershipAdminAjax.nonce,
            plan_id: planId
        }, function(res){
            if (res.success) {
                if (res.data.free) {
                    alert(res.data.message);
                    if (res.data.redirect) window.location.href = res.data.redirect;
                } else if (res.data.pay_url) {
                    window.location.href = res.data.pay_url;
                }
            } else {
                alert(res.data.message || '操作失败');
                $btn.prop('disabled', false).text('确认支付');
            }
        }).fail(function(){
            alert('网络错误，请重试');
            $btn.prop('disabled', false).text('确认支付');
        });
    });

    // 套餐类型联动天数
    $('select[name="plan_type"]').on('change', function(){
        var map = {trial:1, daily:1, weekly:7, monthly:30, quarterly:90, yearly:365};
        var v = map[$(this).val()];
        if (v) $('input[name="duration_days"]').val(v);
    });
});
