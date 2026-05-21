(function ($) {
    
    $(function() {
        
        $( '.mycred-sortable' ).sortable({
            stop: function( event, ui ) {
                update_sequence( $(this) );
            }
        });

        $( '#mrr-sequential' ).on( 'change', function (e) {

            if( this.checked ) 
                $('#mycred-rank-requirements-list').addClass('sequence');
            else
                $('#mycred-rank-requirements-list').removeClass('sequence');
        
        });

        $( document ).on( 'change', '.mrr-refrence', function (e) {

            var selectedVal = $(this).val();
            var eventObj    = e;
            var container   = $(this).closest('.mycred-meta-requirement-row').find('div.mycred-meta-req-conditions');

            container.attr( 'data-refrence', selectedVal );

            container.html( mycred_badge_plus_localize_data.event_templates[ selectedVal ] );

            container.find( '.mycred-select2' ).select2();

        });

        $( document ).on( 'change', '.mrr-limit-by', function (e) {

            $(this).closest('.limit-container').find('.mrr-limit').attr( 'limit-by', $(this).val() );

        });

        $('#mycred-save-badge-requirement').on( 'click',function(){

            var data = {
                action: 'mycred_save_badge_requirements',
                requirements: mycred_get_badge_requirements(),
                is_sequential: $('#mrr-sequential').is(':checked') ? 1 : 0,
                postid: mycred_badge_plus_localize_data.post_id,
                nonce: $('#mycred-badgeplus-nonce').val()
            }

            $('.mrr-requirement-loader').addClass('is-active');
            $(this).attr( 'disabled', 'disabled' );

            $.post( ajaxurl, data, function( response ) {

                if ( response != false ) {}

                $('.mrr-requirement-loader').removeClass('is-active');
                $('#mycred-save-badge-requirement').removeAttr( 'disabled' );

            });

        });

        $('#mycred-add-badge-requirement').on( 'click',function(){

            var sequence       = $('#mycred-rank-requirements-list li').length + 1;
            var newRequirement = mycred_badge_plus_localize_data.requirement_template.replace( '{{sequence}}', sequence );

            $('#mycred-rank-requirements-list').append( newRequirement );

            $( '#mycred-rank-requirements-list li:last .mycred-select2' ).select2();

        });

        $(document).on('keyup', '.mrr-label', function(){

            $(this).closest('.mycred-meta-repeater').find('.mrr-title').html( $(this).val() );

        });

        $(document).on('click', '.mrr-requirement-delete', function(){

            var parent = $(this).closest('.mycred-sortable');

            $(this).closest('.mycred-meta-repeater').remove();

            update_sequence( parent );

        });

        $(document).on('change', '.link_click_based_on', function(e){

            if ( $(this).val() != 'any' ) {

                var link_click_txt = $(this).closest('.mycred-meta-req-conditions').find('.link_click_txt');

                if ( $(this).val() == 'specific_url' ) {
                    link_click_txt.prop('placeholder', 'URL');
                }
                else {
                    link_click_txt.prop('placeholder', 'ID');
                }
                
                link_click_txt.show();

            }
            else {
                $(this).closest('.mycred-meta-req-conditions').find('.link_click_txt').hide();
            }

        });

        $( document ).on( 'click', '.revoke-reward', function( e ){

            var val = $(this).data('id');
            var user_id = $(this).data('attr');
            var earned = $(this).data('earned');

            $.ajax( {
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'mycred_revoke_user_badge',
                    user_id: user_id,
                    postid: val,
                    earned: earned,
                    nonce: mycred_badge_plus_localize_data.nonce
                },
                success: function( response ) {
                    $( `.mycred-badge-row-${response['earned']}` ).fadeOut( 2000 );
                }

            });

        });

         $('.assign-reward').on('click', function (e) {
            
            var val = $('.mycred-assign-badge-plus').find(":selected").val();
            var user_id = $(this).data('attr');

            if (val == -1 || val == 'undefined') {
                alert('Select a Badge.');
                return;
            }

            $.ajax({
                url: ajaxurl,
                type: 'POST',
                data: {
                    action: 'mycred_assign_user_badge',
                    user_id: user_id,
                    postid: val,
                    nonce: mycred_badge_plus_localize_data.nonce
                },
                success: function (response) {
                    if (!response.success) {
                        alert(response.data.message || 'An error occurred.');
                        return;
                    }

                    $('.no-badge').hide();
                    $('.mycred-earner-table').append(`
                        <tr class="mycred-badge-row-${response.data.earned}">
                            <td>${response.data.title}</td>
                            <td>${response.data.amount}</td>
                            <td>${response.data.date}</td>
                            <td>
                                <button class="mycred-button-revoke revoke-reward" 
                                    data-id=${response.data.badge_id} 
                                    data-attr=${response.data.user_id} 
                                    data-earned=${response.data.earned} 
                                    type="button">Revoke Badge</button>
                            </td>
                        </tr>
                    `);
                },
                error: function (xhr, status, error) {
                    alert(`Error: ${xhr.responseJSON?.data?.message || 'Something went wrong.'}`);
                }
            });
        });

        jQuery('#mycred-badge-plus-congrats-msg').on('input',function(e){

            var input = jQuery(this);
            var val = input.val();
            if (input.data("lastval") != val) {
                input.data("lastval", val);

                //your change action goes here 
                jQuery( '.mycred-badge-plus-congrats' ).text( val );
            }

        });

    });

    function mycred_get_badge_requirements() {
        
        var badgeRequirements = [];

        $('#mycred-rank-requirements-list li').each(function(i, e){

            var data = {};

            $(this).find('input,select').each(function(){

                if ( $(this).is(':visible') )
                    data[ $(this).data('index') ] = $(this).val();
            
            });

            badgeRequirements.push( data );

        });

        return badgeRequirements;

    }

    function update_sequence( ele ) {

        ele.children('li').each(function(i, e){
            $(this).find( '.mycred-sortable-sequence' ).html( ( i + 1 ) + ' - ' );
        });

    }

})(jQuery);

