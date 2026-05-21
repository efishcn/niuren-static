(function ($) {
    
    $(function() {

        //Switch all to open badge
        jQuery(document).on( 'click', '#switch-all-to-open-badge-plus', function (e){
            e.preventDefault();
            if ( confirm('Activating Open Badge For All Badge (Plus).') ) {
                jQuery.ajax({
                    url: ajaxurl,
                    data: {
                        action: 'mycred_switch_all_to_open_badge_plus',
                        mycred_nonce: mycred_open_badge_plus_data.nonce
                    },
                    type: 'POST',
                    beforeSend: function() {
                        jQuery('.mycred-switch-all-badges-icon').css("display", "inherit");
                    },
                    success:function(data) {
                        jQuery('.mycred-switch-all-badges-icon').hide();
                        alert( data );
                    }
                })
            } else {
                return false;
            }
        });

    });

})(jQuery);