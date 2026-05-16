/**
 * 会员订阅 Gate 通用前端拦截器 v2.0
 *
 * 当 membership gate 返回失败时，弹出统一的选择弹窗。
 * 所有插件共用此模块，无需各自实现弹窗逻辑。
 *
 * 用法:
 *   1. PHP 端调用 membership_gate_use() 失败时，用 wp_send_json_error() 返回 gate 结果
 *   2. 前端调用 MembershipGateFrontend.handleBlock(gateResult)
 *
 * 自动拦截模式:
 *   在 AJAX 响应中检测 gate_blocked 标记，自动弹出弹窗。
 *   调用 MembershipGateFrontend.installAjaxFilter() 启用。
 *
 * 配置项 (通过 wp_localize_script 注入):
 *   membershipGateFrontend.subscribeUrl  - 订阅页 URL
 *   membershipGateFrontend.rechargeUrl   - 积分充值页 URL
 *   membershipGateFrontend.inviteUrl     - 邀请好友页 URL
 */

(function(win, $) {
    'use strict';

    var config = win.membershipGateFrontend || {};

    var DEFAULTS = {
        subscribeUrl: '/wp-admin/admin.php?page=membership-subscription',
        rechargeUrl:  '/wp-admin/admin.php?page=credit-package',
        inviteUrl:    '/wp-admin/admin.php?page=modern-invite-system',
    };

    function get(key) {
        return config[key] || DEFAULTS[key];
    }

    // ---- 弹窗 ----

    function showModal(data) {
        // data: { reason, message, points_cost, points_balance, points_needed, type, has_subscription }
        removeModal();

        var reason       = data.reason || '';
        var message      = data.message || '使用次数不足';
        var cost         = parseInt(data.points_cost) || 0;
        var balance      = parseInt(data.points_balance) || 0;
        var needed       = parseInt(data.points_needed) || 0;
        var hasSub       = data.has_subscription === true;
        var isQuota      = reason === 'quota_exhausted';
        var isNoSub      = reason === 'no_subscription';
        var isInsufficient = reason === 'insufficient_points';

        // 有会员但配额+积分都不够 → 提示升级，否则按原逻辑
        var icon, title;
        if (hasSub && isInsufficient) {
            icon  = '\u{1F3AF}';
            title = '配额已用完，积分不足';
        } else if (isInsufficient) {
            icon  = '\u{1F4B0}';
            title = '积分不足';
        } else if (isNoSub) {
            icon  = '\u{1F6E1}';
            title = '未订阅会员';
        } else {
            icon  = '\u{1F3AF}';
            title = '使用次数已用完';
        }
        var subtitle = message;

        var infoHTML = '';
        if (isInsufficient || isQuota || hasSub) {
            infoHTML += '<div class="mgate-info-grid">';
            if (cost > 0) {
                infoHTML += '<div class="mgate-info-item"><div class="mgate-info-label">需要积分</div><div class="mgate-info-value danger">' + cost + '</div></div>';
            }
            infoHTML += '<div class="mgate-info-item"><div class="mgate-info-label">当前积分</div><div class="mgate-info-value warn">' + balance + '</div></div>';
            if (needed > 0) {
                infoHTML += '<div class="mgate-info-item"><div class="mgate-info-label">还差</div><div class="mgate-info-value danger">' + needed + '</div></div>';
            }
            infoHTML += '</div>';
        }

        var subscribeUrl = get('subscribeUrl');
        var rechargeUrl  = get('rechargeUrl');
        var inviteUrl    = get('inviteUrl');

        var html = '' +
        '<div class="mgate-overlay" id="mgateOverlay">' +
        '<div class="mgate-modal">' +
        '<button class="mgate-btn-close" id="mgateClose">&times;</button>' +
        '<div class="mgate-header">' +
        '<div class="mgate-icon">' + icon + '</div>' +
        '<h2 class="mgate-title">' + title + '</h2>' +
        '<p class="mgate-subtitle">' + subtitle + '</p>' +
        '</div>' +
        '<div class="mgate-body">' + infoHTML + '</div>' +
        '<div class="mgate-footer">';

        if (hasSub) {
            // 有会员：续费/升级 + 充值积分，双选项
            html += '<a href="' + subscribeUrl + '" class="mgate-btn mgate-btn-primary">&#x1F451; 续费 / 升级会员</a>';
            html += '<a href="' + rechargeUrl + '" class="mgate-btn mgate-btn-secondary">&#x1F4B0; 充值积分</a>';
        } else {
            // 无会员：订阅 + 充值积分
            html += '<a href="' + subscribeUrl + '" class="mgate-btn mgate-btn-primary">&#x1F451; 订阅会员（每日免费配额）</a>';
            if (isInsufficient || isQuota) {
                html += '<a href="' + rechargeUrl + '" class="mgate-btn mgate-btn-secondary">&#x1F4B0; 充值积分</a>';
            }
        }
        html += '<a href="' + inviteUrl + '" class="mgate-btn mgate-btn-secondary">&#x1F465; 邀请好友得积分</a>';
        html += '<button class="mgate-btn mgate-btn-outline" id="mgateDismiss">我知道了</button>';
        html += '</div></div></div>';

        $('body').append(html);

        $('#mgateClose, #mgateDismiss, #mgateOverlay').on('click', function(e) {
            if (e.target === this || $(this).is('#mgateDismiss')) {
                removeModal();
            }
        });
    }

    function removeModal() {
        $('#mgateOverlay').remove();
    }

    // ---- 公共 API ----

    /**
     * 显示 gate 拦截弹窗
     * @param {Object} gateResult - membership_gate_check/use 失败时的返回对象
     */
    function handleBlock(gateResult) {
        if (!gateResult || gateResult.success) return false;
        showModal(gateResult);
        return true;
    }

    /**
     * 安装全局 AJAX 拦截器，自动检测 gate_blocked 响应
     * 开启后，所有返回 { code: 'gate_blocked', data: {...} } 的 AJAX 错误都会自动弹窗
     */
    function installAjaxFilter() {
        $(document).ajaxError(function(event, jqXHR, settings) {
            try {
                var body = jqXHR.responseJSON;
                if (body && body.code === 'gate_blocked' && body.data) {
                    handleBlock(body.data);
                }
            } catch(e) {}
        });

        // 也拦截通过 wp.ajax.send 发出的请求（WordPress admin-ajax 标准方式）
        if (win.wp && win.wp.ajax && win.wp.ajax.send) {
            var _origSend = win.wp.ajax.send;
            // 简易拦截：监听 document 上的 ajaxComplete
        }

        $(document).ajaxComplete(function(event, jqXHR, settings) {
            if (jqXHR.responseJSON && jqXHR.responseJSON.success === false) {
                var body = jqXHR.responseJSON;
                if (body.code === 'gate_blocked' && body.data) {
                    handleBlock(body.data);
                }
            }
        });
    }

    // 暴露 API
    win.MembershipGateFrontend = {
        handleBlock: handleBlock,
        showModal: showModal,
        removeModal: removeModal,
        installAjaxFilter: installAjaxFilter,
        config: config
    };

    // 安装拦截器（如果配置了 autoInstall）
    if (config.autoInstall) {
        $(function() { installAjaxFilter(); });
    }

})(window, jQuery);
