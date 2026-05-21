import { __ } from '@wordpress/i18n';

const mycred_settings = wcSettings.paymentMethodData.mycred;

export const Edit = () => {
    return (
        ( mycred_settings && 
            <div class="mycred-woo-fields-wrapper">
                <div class="mycred-woo-order-total">
                    <span class="mycred-woo-order-total-label">{__( mycred_settings.order_total_label, 'mycred-woocommerce' )}</span>
                    <span class="mycred-woo-order-total-value">{mycred_settings.order_total}</span>
                </div>
                <div class="mycred-woo-total-credit">
                    <span class="mycred-woo-total-credit-label">{__( mycred_settings.balance_label, 'mycred-woocommerce' )}</span>
                    <span class="mycred-woo-total-credit-value">{mycred_settings.balance}</span>
                </div>
            </div>
        )
    );
};