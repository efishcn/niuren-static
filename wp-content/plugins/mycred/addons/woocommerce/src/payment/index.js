import { registerBlockType } from '@wordpress/blocks';
import { Edit } from './edit';

registerBlockType({
	"name": "mycred-woocommerce/mycred-woo-payment-gateway",
	"version": "1.0.0",
	"title": "myCred WooCommerce",
	"category": "woocommerce",
    "parent": [ "woocommerce/checkout-payment-block" ],
	"attributes": {
		"lock": {
			"type": "object",
			"default": {
				"remove": false,
				"move": false
			}
		}
	},
	"textdomain": "mycred-woocommerce",
}, {
	edit: Edit
});