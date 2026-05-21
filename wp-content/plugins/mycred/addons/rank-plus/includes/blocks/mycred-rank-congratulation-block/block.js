( function ( blocks, blockEditor, element, data ) {

    var el = element.createElement;
    var RichText = blockEditor.RichText;
    var useBlockProps = blockEditor.useBlockProps;
    var useDispatch = data.useDispatch;

    blocks.registerBlockType( 'mycred-rank-blocks/mycred-rank-congratulation-block', {
        attributes: {
            content: {
                type: 'string',
                source: 'html',
                selector: 'p',
            },
        },
        edit: function ( props ) {
            return el( asyncCongratulationMessage );
        },
        save: function ( props ) {

            var blockProps = useBlockProps.save();
            var data = wp.data.select('core/editor').getCurrentPostAttribute('meta');

            // Ensure data and the specific property are defined
            var message = '';
            if (data && typeof data.mycred_rank_plus_congratulation_msg !== 'undefined') {
                message = data.mycred_rank_plus_congratulation_msg;
            }

            return el(
                RichText.Content,
                Object.assign( blockProps, {
                    tagName: 'p',
                    value: message,
                } )
            );

        }
    } );

    function CongratulationMessageComponent( props ) {

        var editPost = useDispatch( 'core/editor' ).editPost;
        var blockProps = useBlockProps();

        return el(
            RichText,
            Object.assign( blockProps, {
                tagName: 'p',
                allowedFormats: [ 'core/bold', 'core/italic', 'core/link' ],
                onChange: function( content ) {
                    editPost( {
                        meta: { mycred_rank_plus_congratulation_msg: content },
                    } );
                },
                value: props.data
            } )
        );

    }

    var asyncCongratulationMessage = wp.data.withSelect( function( select ) {

        var data = select( 'core/editor' ).getEditedPostAttribute( 'meta' );
        
        return {
            data: data.mycred_rank_plus_congratulation_msg
        };
    
    })( CongratulationMessageComponent );
    
} )( window.wp.blocks, window.wp.blockEditor, window.wp.element, window.wp.data );