(function (wp) {
    var registerBlockType = wp.blocks.registerBlockType;
    var el = wp.element.createElement;
    var __ = wp.i18n.__;



    registerBlockType('mycred-badge-blocks/mycred-badge-congratulation-message', {
        title: __('myCred Badge Plus Congratulation Message', 'mycred'),
        category: 'mycred-badge-plus',
        edit: function (props) {

            return el( 'div', {}, 
                el( 'p', {
                    className: "mycred-badge-plus-congrats", 
                    style: { 
                        padding: '10px',
                        borderRadius: '5px',
                        color: '#155724',
                        backgroundColor: '#d4edda',
                        borderColor: '#c3e6cb'
                    } 
                }, 'Congratulation Message' ),
            );

        }
    });

    registerBlockType('mycred-badge-blocks/mycred-badge-requirements', {
        title: __('myCred Badge Plus Requirements', 'mycred'),
        category: 'mycred-badge-plus',
        edit: function (props) {

            return el( 'div', {}, 
                el( 'h4', { style: { margin: '5px' } }, 'Requirements' ),
                el( 'ol', {}, 
                    el( 'li', { style: { textDecoration: 'line-through' } }, 'Website Registration' ),
                    el( 'li', { style: { textDecoration: 'line-through' } }, 'Content Purchase' ),
                    el( 'li', {}, 'WooCommerce Purchase Reward' ),
                    el( 'li', {}, 'Signup Referral' )
                ),
            );

        }
    });

    registerBlockType('mycred-badge-blocks/mycred-badge-earners', {
        title: __('myCred Badge Plus Earners', 'mycred'),
        category: 'mycred-badge-plus',
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

            return el( 'div', {}, 
                el( 'h4', { style: { margin: '5px' } }, 'People who earned this:' ),
                el( 'ul', { style: { listStyleType: 'none', paddingLeft: '8px' } }, 
                    el( 'li', { style: liStyle }, 
                        el( 'i', { className: 'dashicons dashicons-businessman', style: iStyle }, '' ),
                        el( 'p', { style: pStyle }, 'john' )
                    ), 
                    el( 'li', { style: liStyle }, 
                        el( 'i', { className: 'dashicons dashicons-businesswoman', style: iStyle }, '' ),
                        el( 'p', { style: pStyle }, 'allie' )
                    ), 
                    el( 'li', { style: liStyle }, 
                        el( 'i', { className: 'dashicons dashicons-businessperson', style: iStyle }, '' ),
                        el( 'p', { style: pStyle }, 'fred' )
                    ), 
                    el( 'li', { style: liStyle }, 
                        el( 'i', { className: 'dashicons dashicons-admin-users', style: iStyle }, '' ),
                        el( 'p', { style: pStyle }, 'jaxon' )
                    ),
                    el( 'li', { style: liStyle }, 
                        el( 'i', { className: 'dashicons dashicons-businessman', style: iStyle }, '' ),
                        el( 'p', { style: pStyle }, 'karel' )
                    )
                ),
            );

        }
    });

    function CongratulationMessageComponent( props ) {

        return el( 'p', { 
            style: { 
                padding: '10px',
                borderRadius: '5px',
                color: '#155724',
                backgroundColor: '#d4edda',
                borderColor: '#c3e6cb'
            } 
        }, props.data );

    }

    var asyncCongratulationMessage = wp.data.withSelect( function( select ) {

        var data = select( 'core/editor' ).getEditedPostAttribute( 'meta' );
        
        return {
            data: data.mycred_badge_plus_congratulation_msg
        };
    
    })( CongratulationMessageComponent );
    
})(window.wp);