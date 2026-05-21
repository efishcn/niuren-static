import { getSetting } from '@woocommerce/settings';
import { __ } from '@wordpress/i18n';
import { decodeEntities } from '@wordpress/html-entities';
import { registerPaymentMethod } from '@woocommerce/blocks-registry';

const settings = getSetting( 'mycred_data', {} );

const defaultLabel = __('Default Pay with myCRED', 'mycred-woocommerce');

const label = decodeEntities( settings.title ) || defaultLabel;

const Content = () => {
	return decodeEntities( settings.description || '' );
};

const Label = ( props ) => {
	const { PaymentMethodLabel } = props.components;
	return <PaymentMethodLabel text={ label } />;
};

const canMyCredMakePayment = ( { cart } ) => {
    if ( 'yes' === cart.extensions.mycredwoo.payment_gateway ) {
        return true;
    } else {
        return false
    }
};

const myCred = {
	name: "mycred",
	label: <Label />,
	content: <Content />,
	edit: <Content />,
	canMakePayment: canMyCredMakePayment,
	ariaLabel: label,
	supports: {
		features: settings.supports,
	},
};

registerPaymentMethod( myCred );
