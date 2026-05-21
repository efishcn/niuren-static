
import { Edit } from './edit';

const { registerPlugin } = wp.plugins;
const { ExperimentalOrderMeta } = wc.blocksCheckout;

const render = () => {
	return (
		<ExperimentalOrderMeta>
			<Edit />
		</ExperimentalOrderMeta>
	);
};

registerPlugin( 'mycredwoo', {
	render,
	scope: 'woocommerce-checkout',
} );