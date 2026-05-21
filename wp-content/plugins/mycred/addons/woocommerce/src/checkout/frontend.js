import { __ } from '@wordpress/i18n';
import { getSetting } from '@woocommerce/settings';
import "./frontend.css";

// Global import
const { registerCheckoutBlock } = wc.blocksCheckout;

const settings = getSetting( 'mycredwoo_data', {} );

const Block = ( { extensions } ) => {
    const { mycredwoo } = extensions;
    const disabled    = '' != mycredwoo.mycred_woo_balance_label;
    const showTotal = settings.show_total !== 'cart' && settings.show_total !== '';
    var lowBalance  = mycredwoo.payment_gateway === 'no' ? 'low-balance' : '';
    var wrapperDisabled     = '' == mycredwoo ? 'wrapper-disabled' : '';
    return (
        <div class={`mycred-woo-fields-wrapper ${wrapperDisabled}`}>
            {showTotal && (
                <div class="mycred-woo-order-total">
                    <span class="mycred-woo-order-total-label">{__(mycredwoo.mycred_woo_total_label, 'mycred-woocommerce')}</span>
                    <span class={`mycred-woo-order-total-value ${lowBalance}`}>{mycredwoo.mycred_woo_total}</span>
                </div>
            )}
            {disabled && (
                <div class="mycred-woo-total-credit">
                <span class="mycred-woo-total-credit-label">{__( mycredwoo.mycred_woo_balance_label, 'mycred-woocommerce' )}</span>
                <span class="mycred-woo-total-credit-value">{mycredwoo.mycred_woo_balance}</span>
            </div>
            )}
        </div>
    )
}

registerCheckoutBlock( {
    metadata: {
        "name": "mycred-woocommerce/mycred-woo-checkout-block",
        "version": "1.0.0",
        "title": "myCred WooCommerce",
        "category": "woocommerce",
        "parent": [ "woocommerce/checkout-totals-block" ],
        "attributes": {
            "lock": {
                "type": "object",
                "default": {
                    "remove": true,
                    "move": true
                }
            }
        },
        "textdomain": "mycred-woocommerce"
    },
    component: Block
} );