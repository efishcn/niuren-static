/**
 * myCRED Transfer jQuery
 * Handles transfer requests and autocomplete of recipient search.
 *
 * @requires jQuery
 * @requires jQuery UI
 * @requires jQuery Autocomplete
 * @since 0.1
 * @version 1.5.2
 */
(function($) {

	var mycred_transfer_cache  = {};

	// Autocomplete
	// @api http://api.jqueryui.com/autocomplete/
	var mycred_transfer_autofill = $( 'input.mycred-autofill' ).autocomplete({

		minLength : 2,
		source    : function( request, response ) {

			var term = request.term;
			if ( term in mycred_transfer_cache ) {
				response( mycred_transfer_cache[ term ] );
				return;
			}
			
			var send = {
				action : "mycred-autocomplete",
				token  : myCREDTransfer.token,
				string : request
			};

			$.getJSON( myCREDTransfer.ajaxurl, send, function( data, status, xhr ) {
				mycred_transfer_cache[ term ] = data;
				response( data );
			});

		},
		messages: {
			noResults : '',
			results   : function() {}
		},
		position: { my : "right top", at: "right bottom" }

	});

	$( 'input.mycred-autofill' ).click(function(){

		if ( myCREDTransfer.autofill == 'none' ) return false;

		var formfieldid = $(this).data( 'form' );
		mycred_transfer_autofill.autocomplete( "option", "appendTo", '#mycred-transfer-form-' + formfieldid + ' .select-recipient-wrapper' );
		console.log( formfieldid );

	});

	// Transfer form submissions
	// @since 1.6.3
	// JavaScript: AJAX form submission handler for mycred transfer form
	$('html body').on('submit', 'form.mycred-transfer-form', function(e) {
	    console.log('new transfer');

	    var transferform = $(this);
	    var formrefid = transferform.data('ref');
	    var formid = '#mycred-transfer-form-' + formrefid;
	    var submitbutton = $(formid + ' button.mycred-submit-transfer');
	    var buttonlabel = submitbutton.val();

	    e.preventDefault();

	    $.ajax({
	        type: "POST",
	        data: {
	            action: 'mycred-new-transfer',
	            form: transferform.serialize()
	        },
	        dataType: "JSON",
	        url: myCREDTransfer.ajaxurl,
	        beforeSend: function() {
	            $(formid + ' input.form-control').each(function() {
	                $(this).attr('disabled', 'disabled');
	            });
	            submitbutton.attr('disabled', 'disabled');
	            submitbutton.val(myCREDTransfer.working);
	        },
	        success: function(response) {
	            console.log(response);

	            $(formid + ' input.form-control').each(function() {
	                $(this).removeAttr('disabled');
	            });

	            submitbutton.removeAttr('disabled');
	            submitbutton.val(buttonlabel);

	            if (response.success !== undefined) {
	                if (response.success) {
	                    if (response.data.message !== undefined && response.data.message != '')
	                        alert(response.data.message);
	                    else
	                        alert(myCREDTransfer.completed);

	                    if ($(response.data.css) !== undefined)
	                        $(response.data.css).empty().html(response.data.balance);

	                    // Reset form inputs
	                    $(formid + ' input.form-control').each(function() {
	                        $(this).val('');
	                    });

	                    $(formid + ' select').each(function() {
	                        var selecteditem = $(this).find(':selected');
	                        if (selecteditem !== undefined)
	                            selecteditem.removeAttr('selected');
	                    });

	                    if (myCREDTransfer.reload == '1')
	                        location.reload();

	                } else if (myCREDTransfer[response.data] !== undefined) {
	                    if (typeof myCREDTransfer[response.data] === 'object')
	                        alert(myCREDTransfer[response.data][$(formid + ' [name="mycred_new_transfer[ctype]"]').val()]);
	                    else
	                        alert(myCREDTransfer[response.data]);
	                }
	            }
	        }
	    });

	    return false;
	});

	jQuery(document).ready(function($) {
		const checkDropdownExist = setInterval(function() {
			const dropdown = $("select[name='mycred_new_transfer[ctype]']");
	
			if (dropdown.length) {
				clearInterval(checkDropdownExist); // Stop checking once dropdown is found
	
				const balanceDivs = $(".mycred-balance");
				const limitDivs = $(".mycred-limit");
	
				// Hide all balances and limits initially
				balanceDivs.hide();
				limitDivs.hide();
	
				dropdown.on("change", function() {
					const selectedType = $(this).val();
	
					// Hide all balances and limits
					balanceDivs.hide();
					limitDivs.hide();
	
					// Show the selected balance
					const selectedBalanceDiv = $(".mycred-balance[data-type='" + selectedType + "']");
					if (selectedBalanceDiv.length) {
						selectedBalanceDiv.show();
					}
	
					// Show the selected limit
					const selectedLimitDiv = $(".mycred-limit[data-type='" + selectedType + "']");
					if (selectedLimitDiv.length) {
						selectedLimitDiv.show();
					}
				});
	
				// Trigger change event on page load to show the correct balance and limit
				dropdown.trigger("change");
			}
		}, 100); // Check every 100ms if the dropdown exists
	});

})( jQuery );