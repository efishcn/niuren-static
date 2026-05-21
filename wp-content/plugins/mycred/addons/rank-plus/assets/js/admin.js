(function ($) {

	$(
		function () {

			$( '.mycred-sortable' ).sortable(
				{
					stop: function ( event, ui ) {
						update_sequence( $( this ) );
					}
				}
			);

			$( '#mrr-sequential' ).change(
				function (e) {

					if ( this.checked ) {
							$( '#mycred-rank-requirements-list' ).addClass( 'sequence' );
					} else {
						$( '#mycred-rank-requirements-list' ).removeClass( 'sequence' );
					}

				}
			);

			$( document ).on(
				'change',
				'.mrr-refrence',
				function (e) {

					var selectedVal = $( this ).val();
					var eventObj    = e;
					var container   = $( this ).closest( '.mycred-meta-requirement-row' ).find( 'div.mycred-meta-req-conditions' );

					container.attr( 'data-refrence', selectedVal );

					container.html( mycred_ranks_plus_localize_data.event_templates[ selectedVal ] );

					container.find( '.mycred-select2' ).select2();

				}
			);

			$( document ).on(
				'change',
				'.mrr-limit-by',
				function (e) {

					$( this ).closest( '.limit-container' ).find( '.mrr-limit' ).attr( 'limit-by', $( this ).val() );

				}
			);

			$( '#mycred-save-rank-requirement' ).click(
				function () {

					var data = {
						action: 'mycred_save_rank_requirements',
						requirements: mycred_get_rank_requirements(),
						is_sequential: $( '#mrr-sequential' ).is( ':checked' ) ? 1 : 0,
						postid: mycred_ranks_plus_localize_data.post_id,
						nonce: $( '#mycred-mrp-nonce' ).val()
					}

					$( '.mrr-requirement-loader' ).addClass( 'is-active' );
					$( this ).attr( 'disabled', 'disabled' );

					$.post(
						ajaxurl,
						data,
						function ( response ) {

							if ( response != false ) {

							}

							$( '.mrr-requirement-loader' ).removeClass( 'is-active' );
							$( '#mycred-save-rank-requirement' ).removeAttr( 'disabled' );

						}
					);

				}
			);

			$( '#mycred-add-rank-requirement' ).click(
				function () {

					var sequence       = $( '#mycred-rank-requirements-list li' ).length + 1;
					var newRequirement = mycred_ranks_plus_localize_data.requirement_template.replace( '{{sequence}}', sequence );

					$( '#mycred-rank-requirements-list' ).append( newRequirement );

					$( '#mycred-rank-requirements-list li:last .mycred-select2' ).select2();

				}
			);

			$( document ).on(
				'keyup',
				'.mrr-label',
				function () {

					$( this ).closest( '.mycred-meta-repeater' ).find( '.mrr-title' ).html( $( this ).val() );

				}
			);

			$( document ).on(
				'click',
				'.mrr-requirement-delete',
				function () {

					var parent = $( this ).closest( '.mycred-sortable' );

					$( this ).closest( '.mycred-meta-repeater' ).remove();

					update_sequence( parent );

				}
			);

			$( document ).on(
				'click',
				'#mycred-rank-assign-btn',
				function () {

					var _this = $( this );

					_this.addClass( 'is-busy' ).attr( 'disabled', 'disabled' );

					var data = {
						action: 'mycred_assign_rank_to_eligible_users',
						postid: mycred_ranks_plus_localize_data.post_id,
						nonce: $( '#mycred-mrp-nonce' ).val()
					}

					$.post(
						ajaxurl,
						data,
						function ( response ) {

							var msg = wp.i18n.__( 'Unable to assign a rank.', 'mycred-rank-plus' );

							if ( response.result == 'success' ) {
								msg = response.msg;
							}

							_this.removeClass( 'is-busy' ).removeAttr( 'disabled', 'disabled' );

							alert( msg );

						}
					);

				}
			);

			$( document ).on(
				'change',
				'.link_click_based_on',
				function (e) {

					if ( $( this ).val() != 'any' ) {

						var link_click_txt = $( this ).closest( '.mycred-meta-req-conditions' ).find( '.link_click_txt' );

						if ( $( this ).val() == 'specific_url' ) {
							link_click_txt.prop( 'placeholder', 'URL' );
						} else {
							link_click_txt.prop( 'placeholder', 'ID' );
						}

						link_click_txt.show();

					} else {
						$( this ).closest( '.mycred-meta-req-conditions' ).find( '.link_click_txt' ).hide();
					}

				}
			);

			$( document ).on(
				'mycred_rank_plus_is_default',
				function ( e, val ) {

					if ( val ) {

						$( '.mycred-rank-requirement-inside' ).addClass( 'mycred-hide' );
						$( '#mycred-rank-requirement-restriction' ).removeClass( 'mycred-hide' );

					} else {

						$( '.mycred-rank-requirement-inside' ).removeClass( 'mycred-hide' );
						$( '#mycred-rank-requirement-restriction' ).addClass( 'mycred-hide' );

					}

				}
			);

		}
	);

	function mycred_get_rank_requirements() {

		var rankRequirements = [];

		$( '#mycred-rank-requirements-list li' ).each(
			function (i, e) {

				var data = {};

				$( this ).find( 'input,select' ).each(
					function () {

						data[ $( this ).data( 'index' ) ] = $( this ).val();

					}
				);

				rankRequirements.push( data );

			}
		);

		return rankRequirements;

	}

	function update_sequence( ele ) {

		ele.children( 'li' ).each(
			function (i, e) {
				$( this ).find( '.mycred-sortable-sequence' ).html( ( i + 1 ) + ' - ' );
			}
		);

	}

})( jQuery );

/*wp.hooks.addFilter( 'mycred_rank_plus_requirement_option_callback', 'mycred', function( content, val, eventobj, container ){
	return function() {
		console.log( val );
		console.log( eventobj );
		console.log( container );
	};
});*/
