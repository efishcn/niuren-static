( function ( blocks, blockEditor, element, data, components, i18n ) {

    var el = element.createElement;
    var TextControl = components.TextControl;
    var SelectControl = components.SelectControl;
    var BoxControl = components.__experimentalBoxControl;
    var FontSizePicker = components.FontSizePicker;
    var useBlockProps = blockEditor.useBlockProps;
    var PanelColorSettings = blockEditor.PanelColorSettings;
    var InspectorControls = wp.blockEditor.InspectorControls;
    var panelBody = wp.components.PanelBody;
    var useDispatch = data.useDispatch;
    var __ = i18n.__;

    blocks.registerBlockType( 'mycred-rank-blocks/mycred-rank-requirements-block', {
        edit: function( props ) {

            var useBlockProps = blockEditor.useBlockProps;
            var headingMargin = props.attributes.headingMargin;
            var listPadding   = props.attributes.listPadding;

            return el( 'div', useBlockProps(), [
                el( 'h6', { style: {
                    margin: `${headingMargin.top} ${headingMargin.right} ${headingMargin.bottom} ${headingMargin.left}`, 
                    color: props.attributes.headingColor, 
                    fontSize: props.attributes.headingFontSize + 'px'
                } }, props.attributes.headingText ),
                el( 'ol', { style: { 
                    margin: '0', 
                    listStyleType: props.attributes.listStyleType,
                    padding: `${listPadding.top} ${listPadding.right} ${listPadding.bottom} ${listPadding.left}`, 
                    fontSize: props.attributes.listFontSize + 'px'
                } }, 
                    el( 'li', { style: { textDecoration: props.attributes.completedListDecoration, color: props.attributes.completedColor } }, 'Website Registration' ),
                    el( 'li', { style: { textDecoration: props.attributes.completedListDecoration, color: props.attributes.completedColor } }, 'Content Purchase' ),
                    el( 'li', { style: { color: props.attributes.nonCompletedColor } }, 'WooCommerce Purchase Reward' ),
                    el( 'li', { style: { color: props.attributes.nonCompletedColor } }, 'Signup Referral' )
                ),
                el(InspectorControls, null,
                    el(PanelColorSettings, {
                        title: 'Color',
                        colorSettings: [
                            {
                                value: props.attributes.headingColor,
                                label: 'Heading',
                                onChange: (e) => props.setAttributes({ headingColor: e }),
                            },
                            {
                                value: props.attributes.nonCompletedColor,
                                label: 'Non Completed Item',
                                onChange: (e) => props.setAttributes({ nonCompletedColor: e }),
                            },
                            {
                                value: props.attributes.completedColor,
                                label: 'Completed Item',
                                onChange: (e) => props.setAttributes({ completedColor: e }),
                            }
                        ]
                    }),
                    el( panelBody, { title: 'Heading Settings', initialOpen: true },
                        el(TextControl, {
                            label: "Heading Text",
                            value: props.attributes.headingText,
                            onChange: function ( headingText ) {
                                props.setAttributes( { headingText } );
                            }
                        }),
                        el(FontSizePicker, {
                            fontSizes: [
                                {
                                    name: __( 'Small' ),
                                    slug: 'small',
                                    size: 12
                                },
                                {
                                    name: __( 'Medium' ),
                                    slug: 'medium',
                                    size: 26
                                },
                                {
                                    name: __( 'Large' ),
                                    slug: 'large',
                                    size: 36
                                }
                            ],
                            withSlider: true,
                            fallbackFontSize: 26,
                            value: props.attributes.headingFontSize,
                            onChange: function ( headingFontSize ) {
                                props.setAttributes( { headingFontSize } );
                            }
                        }),
                        el(BoxControl,  {
                            label: 'Margin',
                            values: props.attributes.headingMargin,
                            onChange: function ( headingMargin ) {
                                props.setAttributes( { headingMargin } );
                            },
                            resetValues: {
                                top: '0px',
                                bottom: '10px',
                                left: '0px',
                                right: '0px'
                            },
                            units: []
                        })
                    ),
                    el( panelBody, { title: 'List Settings', initialOpen: true },
                        el(SelectControl, {
                            label: "List Marker",
                            value: props.attributes.listStyleType,
                            onChange: function ( listStyleType ) {
                                props.setAttributes( { listStyleType } );
                            },
                            options: [
                                { value: null, label: 'Select a marker', disabled: true },
                                { value: 'decimal', label: 'Number' },
                                { value: 'circle', label: 'Circle' },
                                { value: 'disc', label: 'Disc' },
                                { value: 'square', label: 'Square' },
                                { value: 'disclosure-closed', label: 'Disclosure Closed' },
                                { value: 'disclosure-open', label: 'Disclosure Open' }
                            ]
                        }),
                        el(SelectControl, {
                            label: "Completed List Decoration",
                            value: props.attributes.completedListDecoration,
                            onChange: function ( completedListDecoration ) {
                                props.setAttributes( { completedListDecoration } );
                            },
                            options: [
                                { value: null, label: 'Select a Decoration style', disabled: true },
                                { value: 'line-through', label: 'Line Through' },
                                { value: 'underline', label: 'Underline' },
                                { value: 'overline', label: 'Overline' }
                            ]
                        }),
                        el(FontSizePicker, {
                            fontSizes: [
                                {
                                    name: __( 'Small' ),
                                    slug: 'small',
                                    size: 16
                                },
                                {
                                    name: __( 'Medium' ),
                                    slug: 'medium',
                                    size: 20
                                },
                                {
                                    name: __( 'Large' ),
                                    slug: 'large',
                                    size: 24
                                }
                            ],
                            withSlider: true,
                            fallbackFontSize: 20,
                            value: props.attributes.listFontSize,
                            onChange: function ( listFontSize ) {
                                props.setAttributes( { listFontSize } );
                            }
                        }),
                        el(BoxControl,  {
                            label: 'Padding',
                            values: props.attributes.listPadding,
                            onChange: function ( listPadding ) {
                                props.setAttributes( { listPadding } );
                            },
                            resetValues: {
                                top: '0px',
                                bottom: '10px',
                                left: '0px',
                                right: '0px'
                            },
                            units: []
                        })
                    )
                )
            ]);
        },
        save: function( props ) {return null;}
    } );
    
} )( window.wp.blocks, window.wp.blockEditor, window.wp.element, window.wp.data, window.wp.components, window.wp.i18n );