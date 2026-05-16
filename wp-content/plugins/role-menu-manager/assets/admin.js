jQuery(function ($) {

    // ---- 加载角色列表 ----

    function loadRoles() {
        $.post(ajaxurl, {
            action: 'rmm_get_roles',
            nonce: rmmData.nonce
        }, function (res) {
            var list = $('#rmm-role-list').empty();
            var select = $('#rmm-role-select').empty().append('<option value="">— 选择角色 —</option>');

            if (!res.success || $.isEmptyObject(res.data)) {
                list.append('<tr><td colspan="3">暂无角色，请先新增。</td></tr>');
                return;
            }

            $.each(res.data, function (id, name) {
                list.append(
                    '<tr>' +
                    '<td>' + escHtml(id) + '</td>' +
                    '<td>' + escHtml(name) + '</td>' +
                    '<td><span class="rmm-role-delete" data-role="' + escHtml(id) + '">删除</span></td>' +
                    '</tr>'
                );
                select.append('<option value="' + escHtml(id) + '">' + escHtml(name) + '</option>');
            });
        });
    }

    loadRoles();

    // ---- 新增角色 ----

    $('#rmm-add-role-btn').on('click', function () {
        var roleId = $('#rmm-role-id').val().trim();
        var roleName = $('#rmm-role-name').val().trim();

        if (!roleId || !roleName) {
            alert('请填写角色 ID 和显示名称');
            return;
        }

        $.post(ajaxurl, {
            action: 'rmm_add_role',
            nonce: rmmData.nonce,
            role_id: roleId,
            display_name: roleName
        }, function (res) {
            if (res.success) {
                $('#rmm-role-id').val('');
                $('#rmm-role-name').val('');
                loadRoles();
            } else {
                alert(res.data.message);
            }
        });
    });

    // ---- 删除角色 ----

    $(document).on('click', '.rmm-role-delete', function () {
        var roleId = $(this).data('role');
        if (!confirm('确定删除角色 "' + roleId + '" 吗？相关菜单配置也会被清除。')) return;

        $.post(ajaxurl, {
            action: 'rmm_remove_role',
            nonce: rmmData.nonce,
            role_id: roleId
        }, function (res) {
            if (res.success) {
                loadRoles();
                $('#rmm-menu-tree').html('<p>请先选择一个角色。</p>');
                $('.rmm-save-bar').hide();
            } else {
                alert(res.data.message);
            }
        });
    });

    // ---- 加载菜单树 ----

    $('#rmm-role-select').on('change', function () {
        var roleId = $(this).val();
        if (!roleId) {
            $('#rmm-menu-tree').html('<p>请先选择一个角色。</p>');
            $('.rmm-save-bar').hide();
            return;
        }

        $.post(ajaxurl, {
            action: 'rmm_get_permissions',
            nonce: rmmData.nonce,
            role_id: roleId
        }, function (res) {
            if (!res.success) return;
            renderMenuTree(res.data.tree);
            $('.rmm-save-bar').show();
        });
    });

    function renderMenuTree(tree) {
        var html = '';
        $.each(tree, function (i, item) {
            html += '<div class="rmm-menu-item">';
            html += '<label>';
            html += '<input type="checkbox" class="rmm-menu-check" value="' + escHtml(item.slug) + '"' + (item.checked ? ' checked' : '') + '>';
            html += escHtml(item.title) + ' <small>(' + escHtml(item.slug) + ')</small>';
            html += '</label>';

            if (item.submenus && item.submenus.length) {
                html += '<div class="rmm-submenu-list">';
                $.each(item.submenus, function (j, sub) {
                    html += '<div class="rmm-submenu-item">';
                    html += '<label>';
                    html += '<input type="checkbox" class="rmm-menu-check" value="' + escHtml(sub.slug) + '"' + (sub.checked ? ' checked' : '') + '>';
                    html += escHtml(sub.title) + ' <small>(' + escHtml(sub.slug) + ')</small>';
                    html += '</label>';
                    html += '</div>';
                });
                html += '</div>';
            }

            html += '</div>';
        });
        $('#rmm-menu-tree').html(html);
    }

    // ---- 全选 / 全不选 ----

    $('#rmm-select-all').on('click', function () {
        $('#rmm-menu-tree .rmm-menu-check').prop('checked', true);
    });

    $('#rmm-deselect-all').on('click', function () {
        $('#rmm-menu-tree .rmm-menu-check').prop('checked', false);
    });

    // ---- 保存权限 ----

    $('#rmm-save-perms').on('click', function () {
        var roleId = $('#rmm-role-select').val();
        var allowed = [];
        $('#rmm-menu-tree .rmm-menu-check:checked').each(function () {
            allowed.push($(this).val());
        });

        $.post(ajaxurl, {
            action: 'rmm_save_permissions',
            nonce: rmmData.nonce,
            role_id: roleId,
            allowed: allowed
        }, function (res) {
            var status = $('#rmm-save-status');
            if (res.success) {
                status.text('已保存').fadeIn();
                setTimeout(function () { status.fadeOut(); }, 2000);
            } else {
                status.css('color', '#b32d2e').text(res.data.message).fadeIn();
            }
        });
    });

    // ---- 工具函数 ----

    function escHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }
});
