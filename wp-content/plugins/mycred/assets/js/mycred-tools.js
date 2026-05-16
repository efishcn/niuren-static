jQuery(document).ready(function() {

    var $selector = jQuery('.bulk-award-type');

    $selector.select2();

    $selector.on("select2:select", function(e) {

        if (e.params.data.id == 'points') {
            jQuery('.bulk-award-point').fadeIn();
            jQuery('.bulk-award-badge').fadeOut();
            jQuery('.bulk-award-rank').fadeOut();
            jQuery('.tools-revoke-btn').remove();
            jQuery('.tools-bulk-assign-award-btn').addClass('award-points');
            jQuery('.tools-bulk-assign-award-btn').removeClass('award-badges');
            jQuery('.tools-bulk-assign-award-btn').removeClass('award-ranks');
            jQuery('.tools-bulk-assign-award-btn').html(`Update`);
        } 
        else if (e.params.data.id == 'badges') {
            jQuery('.bulk-award-badge').fadeIn();
            jQuery('.bulk-award-point').fadeOut();
            jQuery('.bulk-award-rank').fadeOut();
            jQuery('.tools-bulk-assign-award-btn').after(
                `<button class="button button-large large button-primary tools-revoke-btn" style="margin-left: 10px;">Revoke</button>`
            );
            jQuery('.tools-bulk-assign-award-btn').html(`Award`);
            jQuery('.tools-bulk-assign-award-btn').addClass('award-badges');
            jQuery('.tools-bulk-assign-award-btn').removeClass('award-points');
            jQuery('.tools-bulk-assign-award-btn').removeClass('award-ranks');
        } 
        else if (e.params.data.id == 'ranks') {
            jQuery('.bulk-award-rank').fadeIn();
            jQuery('.bulk-award-point').fadeOut();
            jQuery('.bulk-award-badge').fadeOut();
            jQuery('.tools-revoke-btn').remove();
            jQuery('.tools-bulk-assign-award-btn').addClass('award-ranks');
            jQuery('.tools-bulk-assign-award-btn').removeClass('award-points');
            jQuery('.tools-bulk-assign-award-btn').removeClass('award-badges');
            jQuery('.tools-bulk-assign-award-btn').html(`Update`);
        }

    });

    //Log Entry
    var $logEntry = jQuery('.log-entry').is(':checked');

    if ($logEntry)
        jQuery('.log-entry-row').show();
    else
        jQuery('.log-entry-row').hide();

    jQuery(".log-entry").change(function() {
        if (this.checked)
            jQuery('.log-entry-row').show();
        else
            jQuery('.log-entry-row').hide();
    });


    //Pointtype
    $selector = jQuery('.bulk-award-pt');
    $selector.select2({

    });

    //Users
    jQuery('.bulk-users').select2({

        ajax: {
            url: ajaxurl,
            dataType: 'json',
            data: function(params) {
                var query = {
                    search: params.term,
                    token: mycredTools.token,
                    action: 'mycred-tools-select-user'
                }

                // Query parameters will be ?search=[term]&type=public
                return query;
            }
        },
        processResults: function(data, params) {
            return {
                results: data.results
            };
        },
        minimumInputLength: 3
    });

    var $awardToAll = jQuery('.award-to-all').is(':checked');

    if (!$awardToAll)
        jQuery('.users-row').show();
    else
        jQuery('.users-row').hide();

    jQuery(".award-to-all").change(function() {
        if (!this.checked)
            jQuery('.users-row').show();
        else
            jQuery('.users-row').hide();
    });

    //User Roles
    $selector = jQuery('.bulk-roles');
    $selector.select2();

    //Badges
    $selector = jQuery('.bulk-badges');
    $selector.select2();

    //Ranks
    $selector = jQuery('.bulk-ranks');
    $selector.select2();

   function updateUserCountsByRoles(roles, callback) {
        jQuery.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'mycred_get_user_count_by_roles',
                roles: roles
            },
            success: function(response) {
                if (response && response.user_count !== undefined) {
                    callback(response.user_count);
                } else {
                    callback(0);
                }
            },
            error: function() {
                callback(0);
            }
        });
    }

    function myCred_tools_bulk_assign(loop, awarded_user_count, remaining_user) {
        var confirmAction;

        if (loop === undefined) loop = 0;
        if (awarded_user_count === undefined) awarded_user_count = 0;
        if (remaining_user === undefined) remaining_user = 0;

        if (loop === 0) {
            var pointsToAward = jQuery('[name="bulk_award_point"]').val();
            var logEntryChecked = jQuery('#bulk-check-log').prop('checked');
            var logEntryText = jQuery('#bulk-log-entry').val();

            if (logEntryChecked && !logEntryText) {
                alert('Log entry is required.');
                jQuery('.popup').hide().attr("aria-hidden", "true");
                return false;
            }

            confirmAction = pointsToAward < 0 ? confirm(mycredTools.revokeConfirmText) : confirm(mycredTools.awardConfirmText);
            if (!confirmAction) {
                jQuery('.popup').hide().attr("aria-hidden", "true");
                return false;
            }
        }

        var selectedType = jQuery('.request-tab').val();
        var pointsToAward = jQuery('[name="bulk_award_point"]').val();
        var pointType = jQuery('[name="bulk_award_pt"]').val();
        var logEntry = jQuery('.log-entry').prop('checked');
        var logEntryText = jQuery('[name="log_entry_text"]').val();
        var awardToAllUsers = jQuery('.award-to-all').prop('checked');
        var users;
        var selectedUsers = jQuery('#bulk-users').val();
        var selectedRoles = jQuery('[name="bulk_roles"]').val();
        var user_roles = JSON.stringify(selectedRoles);

        // Determine users to award based on users or roles
        if (jQuery('#bulk-reward-all-users').is(":not(:checked)")) {
            if (selectedUsers && selectedUsers.length > 0) {
                users = JSON.stringify(selectedUsers);
            } else if (selectedRoles && selectedRoles.length > 0) {
                users = null;
            } else {
                alert('No users or roles selected for point assignment.');
                return false;
            }
        }

        var rankToAward = jQuery('.bulk-ranks').find(':selected').val();
        var badgesToAward = JSON.stringify(jQuery('[name="bulk_badges"]').val());

        function sendAssignRequest(totalUserCount) {
            if (loop === 0) {
                awarded_user_count = 0;
                remaining_user = totalUserCount;
                jQuery('#myCred_users').text('Users : ' + totalUserCount);
                jQuery('#myCred_user_remaining').text('Users Remaining : ' + remaining_user);
            }

            jQuery.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'mycred-tools-assign-award',
                    token: mycredTools.token,
                    selected_type: selectedType,
                    points_to_award: pointsToAward,
                    point_type: pointType,
                    log_entry: logEntry,
                    log_entry_text: logEntryText,
                    award_to_all_users: awardToAllUsers,
                    users: users,
                    user_roles: user_roles,
                    rank_to_award: rankToAward,
                    badges_to_award: badgesToAward,
                    loop: loop
                },
                success: function(response) {
                    awarded_user_count += 100;
                    if (awarded_user_count > totalUserCount) {
                        awarded_user_count = totalUserCount;
                    }

                    remaining_user = totalUserCount - awarded_user_count;

                    jQuery('#myCred_users').text('Users : ' + totalUserCount);
                    jQuery('#myCred_user_remaining').text('Users Remaining : ' + (remaining_user > 0 ? remaining_user : 0));

                    if (response.run_again === true && remaining_user > 0) {
                        myCred_tools_bulk_assign(loop + 1, awarded_user_count, remaining_user);
                    } else {
                        alert(mycredTools.successfullyAwarded);
                        mycredToolsResetForm();
                        jQuery('.popup').hide().attr("aria-hidden", "true");
                        jQuery("#openMyPopup").focus();
                    }
                },
                error: function() {
                    alert('Error during point assignment.');
                    jQuery('.popup').hide().attr("aria-hidden", "true");
                }
            });
        }

        if (selectedUsers && selectedUsers.length > 0) {
            sendAssignRequest(selectedUsers.length);
            return;
        }

        if (selectedRoles && selectedRoles.length > 0) {
            updateUserCountsByRoles(user_roles, function(userCount) {
                if (userCount === 0) {
                    alert('No users found for selected roles.');
                    return;
                }
                sendAssignRequest(userCount);
            });
            return;
        }

        if (jQuery('#bulk-reward-all-users').is(':checked')) {
            jQuery.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'mycred_get_total_user_count',
                },
                success: function(response) {
                    if (response && response.user_count !== undefined && response.user_count > 0) {
                        sendAssignRequest(response.user_count);
                    } else {
                        alert('No users found to award.');
                    }
                },
                error: function() {
                    alert('Error fetching total user count.');
                }
            });
            return;
        }

        alert('No users or roles selected for point assignment.');
    }

    jQuery(document).ready(function () {
        function updatePopupCounts() {
            var selectedUsers = jQuery('#bulk-users').val();
            var selectedRoles = jQuery('[name="bulk_roles"]').val();

            if (selectedUsers && selectedUsers.length > 0) {
                var count = selectedUsers.length;
                jQuery('#myCred_users').text('Users : ' + count);
                jQuery('#myCred_user_remaining').text('Users Remaining : 0');
            } else if (selectedRoles && selectedRoles.length > 0 || jQuery('#bulk-reward-all-users').is(':checked')) {
                var roles = selectedRoles && selectedRoles.length > 0 ? JSON.stringify(selectedRoles) : null;

                if (roles) {
                    updateUserCountsByRoles(roles, function(userCount) {
                        jQuery('#myCred_users').text('Users : ' + userCount);
                        jQuery('#myCred_user_remaining').text('Users Remaining : ' + userCount);
                    });
                } else {
                    jQuery.ajax({
                        url: ajaxurl,
                        type: 'POST',
                        data: {
                            action: 'mycred_get_total_user_count',
                        },
                        success: function(response) {
                            if (response && response.user_count !== undefined) {
                                jQuery('#myCred_users').text('Users : ' + response.user_count);
                                jQuery('#myCred_user_remaining').text('Users Remaining : ' + response.user_count);
                            }
                        }
                    });
                }
            } else {
                jQuery('#myCred_users').text('Users : 0');
                jQuery('#myCred_user_remaining').text('Users Remaining : 0');
            }
        }

        jQuery('#bulk-users').on('change', updatePopupCounts);
        jQuery('[name="bulk_roles"]').on('change', updatePopupCounts);
        jQuery('#bulk-reward-all-users').on('change', updatePopupCounts);

        updatePopupCounts();
    });

    //Bulk Assign AJAX
    jQuery(document).on('click', '.tools-bulk-assign-award-btn', function(e) {

        e.preventDefault();
        jQuery('.popup').show().attr("aria-hidden", "false");
        jQuery("#closePopup").focus();
        myCred_tools_bulk_assign();
        
    });  

    function myCred_tools_bulk_revoke( loop, awarded_user_count, remaining_user ) {

        var $selectedType = jQuery('.request-tab').val();
        var $badgesToRevoke = JSON.stringify(jQuery('[name="bulk_badges"]').val());
        var $awardToAllUsers = jQuery('.award-to-all').prop('checked');
        var $users = JSON.stringify(jQuery('[name="bulk_users"]').val());
        var $user_roles = JSON.stringify(jQuery('[name="bulk_roles"]').val());

        if( loop === undefined ) loop = 0;
        if( awarded_user_count === undefined ) awarded_user_count = 0;
        if( remaining_user === undefined ) remaining_user = 0;

        jQuery.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'mycred-tools-assign-award',
                token: mycredTools.token,
                selected_type: $selectedType,
                revoke: 'revoke',
                badges_to_revoke: $badgesToRevoke,
                award_to_all_users: $awardToAllUsers,
                users: $users,
                user_roles: $user_roles,
                loop: loop,
            },
            success: function(response) {

                loop++;
                awarded_user_count += 100;
                if ( awarded_user_count > response.user_count ) {
                    awarded_user_count = response.user_count;
                }

                remaining_user = response.user_count;
                remaining_user -= awarded_user_count; 

                if ( response.run_again == true ) {
                    myCred_tools_bulk_revoke( loop, awarded_user_count );
                }
                jQuery( '#myCred_users' ).html( 'Users : ' + awarded_user_count );
                jQuery( '#myCred_user_remaining' ).html( 'User Remaining : ' + remaining_user );

                if ( response.run_again != true && response.success === true ) {
                    alert(mycredTools.successfullyRevoked);
                    mycredToolsResetForm();
                    jQuery('.popup').hide().attr("aria-hidden", "true");
                    jQuery("#openMyPopup").focus();
                    return;
                }

                if ( mycredTools.hasOwnProperty( response.success ) ) 
                    alert( mycredTools[ response.success ] );
            }
        });
    } 

    //jQuery Bulk Revoke
    jQuery(document).on('click', '.tools-revoke-btn', function(e) {

        e.preventDefault();
        jQuery('.popup').show().attr("aria-hidden", "false");
        jQuery("#closePopup").focus();
        jQuery( '#myCred_users' ).html( 'Users : 0' );
        jQuery( '#myCred_user_remaining' ).html( 'User Remaining : 0' );
        myCred_tools_bulk_revoke();
    });

    /*
     * @since 2.4
     * @version 1.0
     */
    var $pt_selector = jQuery('#tools-type-import-export');

    $pt_selector.select2();

    jQuery(document).on('click', '#select-all-pt', function() {

        jQuery('#tools-type-import-export').select2('destroy');

        var $values = [];

        jQuery('#tools-type-import-export option').each(function(i, obj) {

            if (obj.selected) {
                jQuery('#tools-type-import-export').val(null).trigger('change');
                jQuery('#tools-type-import-export').select2();
                return false;
            }
            if (!obj.selected) {
                jQuery('#tools-type-import-export').find('option').prop('selected', 'selected').end();
                jQuery('#tools-type-import-export').select2();
                return false;
            }
            return false;
        });
    });

    var $uf_selector = jQuery('#tools-uf-import-export');
    $uf_selector.select2();

    //Download Formatted Points
    jQuery(document).on('click', '#download-formatted-template-csv', function() {
        var $requestTab = jQuery('.request-tab').val();
        jQuery.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'mycred-tools-import-export',
                token: mycredTools.token,
                request_tab: $requestTab,
                template: 'formatted'
            },
            beforeSend: function() {
                mycredToolsAddLoader('#download-formatted-template-csv');
            },
            success: function(data) {
                mycredToolsDowloadCSV(data, 'formatted-points-template');
                mycredToolsRemoveLoader('#download-formatted-template-csv', 'dashicons dashicons-download v-align-middle');
            }
        });
    });

    //Downlaod Row Points
    jQuery(document).on('click', '#download-raw-template-csv', function() {
        var $requestTab = jQuery('.request-tab').val();
        jQuery.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'mycred-tools-import-export',
                token: mycredTools.token,
                request_tab: $requestTab,
                template: 'raw'
            },
            beforeSend: function() {
                mycredToolsAddLoader('#download-raw-template-csv');
            },
            success: function(data) {
                mycredToolsDowloadCSV(data, `raw-${$requestTab}-template`);
                mycredToolsRemoveLoader('#download-raw-template-csv', 'dashicons dashicons-download v-align-middle');
            }
        });
    });

    //Export Raw Points
    jQuery(document).on('click', '#export-raw', function(e) {

        e.preventDefault();

        var $requestTab = jQuery('.request-tab').val();

        var $pt = jQuery('#tools-type-import-export').val();

        var $userField = jQuery('#tools-uf-import-export').val();

        var $fileFormat = 'csv';

        var $postField, $setupTypes = Array();

        if (($pt == undefined || $pt.length == 0) && $requestTab == 'export-points') {
            alert('Select alteast one Point Type.');
            return false;
        }

        if (($pt == undefined || $pt.length == 0) && $requestTab == 'export-badges') {
            alert('Select alteast one Badge.');
            return false;
        }

        if (($pt == undefined || $pt.length == 0) && $requestTab == 'export-ranks') {
            alert('Select alteast one Rank.');
            return false;
        }

        if ($requestTab == 'export-badges' || $requestTab == 'export-ranks')
            var $postField = jQuery('#tools-badge-fields-import-export').val()

        if ($requestTab == 'export-setup') {
            $fileFormat = 'json';
            $_setupTypes = jQuery('.mycred-tools-setup input[type=checkbox]');
            var $counter = 0;
            jQuery.each($_setupTypes, function(index, element) {

                var $elementValue = jQuery(element);

                if (jQuery(element).is(':checked') === false) return;

                if (jQuery(element).is(':checked') === true) {
                    var $_obj = {};
                    var _name = $elementValue.attr('name');
                    var $_value = $elementValue.attr('value');
                    $_obj[_name] = $_value;
                    $setupTypes[$counter] = $_obj;
                    $counter++;
                }
            });

            if ($setupTypes.length == 0) {
                alert('Nothing selected to Import.');
                return false;
            }
        }

        jQuery.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'mycred-tools-import-export',
                token: mycredTools.token,
                request_tab: $requestTab,
                request: 'export',
                template: 'raw',
                user_field: $userField,
                post_field: $postField,
                types: JSON.stringify($pt),
                setup_types: $setupTypes
            },
            beforeSend: function() {
                mycredToolsAddLoader('#export-raw');
            },
            success: function(data) {
                mycredToolsDowloadCSV(data, `raw-${$requestTab}`, $fileFormat);
                mycredToolsRemoveLoader('#export-raw', 'dashicons dashicons-database-export v-align-middle');
            }
        });
    });

    //Export Formatted
    jQuery(document).on('click', '#export-formatted', function() {

        var $requestTab = jQuery('.request-tab').val();

        var $pt = jQuery('#tools-type-import-export').val();

        var $userField = jQuery('#tools-uf-import-export').val();

        if ($pt == undefined || $pt.length == 0) {
            alert('Select alteast one Point Type.');
            return false;
        }

        jQuery.ajax({
            url: ajaxurl,
            type: 'POST',
            data: {
                action: 'mycred-tools-import-export',
                token: mycredTools.token,
                request_tab: $requestTab,
                request: 'export',
                template: 'formatted',
                user_field: $userField,
                types: JSON.stringify($pt)
            },
            beforeSend: function() {
                mycredToolsAddLoader('#export-formatted');
            },
            success: function(data) {
                mycredToolsDowloadCSV(data, `formatted-${$requestTab}`);
                mycredToolsRemoveLoader('#export-formatted', 'dashicons dashicons-database-export v-align-middle');
            }
        });
    });

    //Import Points
    jQuery(document).on('click', '#import', function(e) {

        e.preventDefault();

        var $requestTab = jQuery('.request-tab').val(),
            $importFormatType;

        if ($requestTab == 'import-badges' || $requestTab == 'import-ranks')
            $importFormatType = jQuery('#import-format-type').val();

        if (document.getElementById('import-file').files.length == 0) {
            alert('Upload file first.');
            return false;
        }

        if ((document.getElementById('import-file').files[0].type !== 'application/vnd.ms-excel' && document.getElementById('import-file').files[0].type !== 'text/csv') && ($requestTab != 'import-setup')) {
            alert('Upload csv format file.');
            return false;
        }

        //Setup
        if (document.getElementById('import-file').files[0].type !== 'application/json' && ($requestTab == 'import-setup')) {
            alert('Upload JSON format file.');
            return false;
        }

        var file = jQuery(document).find('#import-file');
        var file = file[0].files[0];

        var formData = new FormData();
        formData.append('action', 'mycred-tools-import-export');
        formData.append('token', mycredTools.token);
        formData.append('request_tab', $requestTab);
        formData.append('import_format_type', $importFormatType);
        formData.append('request', 'import');
        formData.append('_file', file);


        jQuery.ajax({
            url: mycredTools.ajax_url,
            type: 'POST',
            data: formData,
            contentType: false,
            processData: false,
            error: function(e) {
                console.log('Error', e);
            },
            beforeSend: function() {
                mycredToolsAddLoader('#import');
            },
            success: function(data) {

                if (data == '')
                    data = 'File successfully imported.';

                alert(data);
                jQuery('#import-file').val('');
                mycredToolsRemoveLoader('#import', 'dashicons dashicons-database-import v-align-middle');
            }
        });
    });

    jQuery('#tools-badge-fields-import-export').select2();

    jQuery('#import-format-type').select2();

    //Setup Import Export
    jQuery(document).on('change', '.mycred-tools-setup input[type=checkbox]', function(e) {

        if (this.checked)
            jQuery(this).parent().parent().nextUntil('li').find('input[type=checkbox]').prop('checked', true);
        else
            jQuery(this).parent().parent().nextUntil('li').find('input[type=checkbox]').prop('checked', false);

    })

});

//Reset Form
function mycredToolsResetForm() {
    var $selectedValue = jQuery('.bulk-award-type').val();
    jQuery(".mycred-tools-ba-award-form").trigger('reset');
    
    jQuery('#bulk-users').val();
    jQuery('#bulk-users').trigger('change');
    
    jQuery('#bulk-roles').val();
    jQuery('#bulk-roles').trigger('change');
    
    jQuery('#bulk-badges').val();
    jQuery('#bulk-badges').trigger('change');
    
    jQuery('#bulk-ranks').val();
    jQuery('#bulk-ranks').trigger('change');

    jQuery(".log-entry").removeAttr("checked");
    jQuery('.log-entry-row').hide();
    jQuery(".award-to-all").removeAttr("checked");
    jQuery('.users-row').show();
    jQuery('.bulk-award-type').val($selectedValue);
}

//Downlaods CSV
function mycredToolsDowloadCSV(data, fileName, fileFormat = 'csv') {
    /*
     * Make CSV downloadable
     */
    var downloadLink = document.createElement("a");
    var fileData = ['\ufeff' + data];

    var blobObject = new Blob(fileData, {
        type: "text/csv;charset=utf-8;"
    });

    var url = URL.createObjectURL(blobObject);
    downloadLink.href = url;
    downloadLink.download = `${fileName}.${fileFormat}`;

    /*
     * Actually download CSV
     */
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

function mycredToolsAddLoader(parentIdentifier) {
    jQuery(`${parentIdentifier}`).parent().find('span.mycred-spinner').addClass('is-active');
}

function mycredToolsRemoveLoader(parentIdentifier, iconIdentifier) {
    jQuery(`${parentIdentifier}`).parent().find('span.mycred-spinner').removeClass('is-active');
}