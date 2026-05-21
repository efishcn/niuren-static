(function (wp) {
	var registerBlockType = wp.blocks.registerBlockType;
	var el = wp.element.createElement;
	var __ = wp.i18n.__;

	registerBlockType(
		'mycred-rank-blocks/mycred-rank-congratulation-message',
		{
			title: __('Rank Congratulation Message', 'mycred-rank-plus'),
			category: 'mycred-rank',
			edit: function (props) {

				return el(asyncCongratulationMessage);

			}
		}
	);

	registerBlockType(
		'mycred-rank-blocks/mycred-rank-requirements',
		{
			title: __('Rank Requirements', 'mycred-rank-plus'),
			category: 'mycred-rank',
			edit: function (props) {

				return el(
					'div',
					{},
					el('h4', { style: { margin: '5px' } }, 'Requirements'),
					el(
						'ol',
						{},
						el('li', { style: { textDecoration: 'line-through' } }, 'Website Registration'),
						el('li', { style: { textDecoration: 'line-through' } }, 'Content Purchase'),
						el('li', {}, 'WooCommerce Purchase Reward'),
						el('li', {}, 'Signup Referral')
					),
				);

			}
		}
	);

	registerBlockType(
		'mycred-rank-blocks/mycred-rank-earners',
		{
			title: __('Rank Earners', 'mycred-rank-plus'),
			category: 'mycred-rank',
			edit: function (props) {

				var liStyle = {
					display: 'inline-block'
				}

				var iStyle = {
					fontSize: '70px',
					display: 'block',
					width: 'fit-content',
					height: 'fit-content',
					background: '#c1c1c1',
					marginRight: '10px',
					color: '#ffffff'
				}

				var pStyle = {
					textAlign: 'center',
					margin: 0
				}

				return el(
					'div',
					{},
					el('h4', { style: { margin: '5px' } }, 'People who earned this:'),
					el(
						'ul',
						{ style: { listStyleType: 'none', paddingLeft: '8px' } },
						el(
							'li',
							{ style: liStyle },
							el('i', { class: 'dashicons dashicons-businessman', style: iStyle }, ''),
							el('p', { style: pStyle }, 'john')
						),
						el(
							'li',
							{ style: liStyle },
							el('i', { class: 'dashicons dashicons-businesswoman', style: iStyle }, ''),
							el('p', { style: pStyle }, 'allie')
						),
						el(
							'li',
							{ style: liStyle },
							el('i', { class: 'dashicons dashicons-businessperson', style: iStyle }, ''),
							el('p', { style: pStyle }, 'fred')
						),
						el(
							'li',
							{ style: liStyle },
							el('i', { class: 'dashicons dashicons-admin-users', style: iStyle }, ''),
							el('p', { style: pStyle }, 'jaxon')
						),
						el(
							'li',
							{ style: liStyle },
							el('i', { class: 'dashicons dashicons-businessman', style: iStyle }, ''),
							el('p', { style: pStyle }, 'karel')
						)
					),
				);

			}
		}
	);

	function MycredPlaceholderComponent(props) {

		if (props.height == undefined) {

			props.height = '20px';

		}

		return el(
			'div',
			{ class: "mycred-loading-placeholder", style: { height: props.height } },
			el('div', {})
		);

	}

	function CongratulationMessageComponent(props) {

		return el(
			'p',
			{
				style: {
					padding: '10px',
					borderRadius: '5px',
					color: '#155724',
					backgroundColor: '#d4edda',
					borderColor: '#c3e6cb'
				}
			},
			props.data
		);

	}

	var asyncCongratulationMessage = wp.data.withSelect(
		function (select) {

			var data = select('core/editor').getEditedPostAttribute('meta');

			return {
				data: data.mycred_rank_plus_congratulation_msg
			};

		}
	)(CongratulationMessageComponent);

})(window.wp);