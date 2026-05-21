import { __ } from '@wordpress/i18n';

export const Edit = () => {
    return (
        <div class="mycred-woo-fields-wrapper">
            <div class="mycred-woo-order-total">
                <span class="mycred-woo-order-total-label">{__( 'Order total in points', 'mycred-woocommerce' )}</span>
                <span class="mycred-woo-order-total-value">{49.20}</span>
            </div>
            <div class="mycred-woo-total-credit">
                <span class="mycred-woo-total-credit-label">{__( 'My Balance', 'mycred-woocommerce' )}</span>
                <span class="mycred-woo-total-credit-value">{550}</span>
            </div>
        </div>
    );
};