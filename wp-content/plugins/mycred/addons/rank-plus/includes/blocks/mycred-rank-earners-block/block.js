( function ( blocks, blockEditor, element, data, components, i18n ) {

    var el = element.createElement;
    var TextControl = components.TextControl;
    var BoxControl = components.__experimentalBoxControl;
    var FontSizePicker = components.FontSizePicker;
    var ToggleControl = components.ToggleControl;
    var SelectControl = components.SelectControl;
    var Spacer = components.__experimentalSpacer;
    var Flex = components.Flex;
    var useBlockProps = blockEditor.useBlockProps;
    var PanelColorSettings = blockEditor.PanelColorSettings;
    var InspectorControls = wp.blockEditor.InspectorControls;
    var panelBody = wp.components.PanelBody;
    var useDispatch = data.useDispatch;
    var __ = i18n.__;

    blocks.registerBlockType( 'mycred-rank-blocks/mycred-rank-earners-block', {
        edit: function( props ) {

            var useBlockProps = blockEditor.useBlockProps;
            var headingMargin = props.attributes.headingMargin;
            var namePadding   = props.attributes.namePadding;

            var listSettingElements = [
                el(Flex, { align: 'baseline' }, [
                    el(TextControl,  {
                        label: 'Number of Users',
                        type: 'number',
                        value: props.attributes.noOfUsers,
                        onChange: function ( noOfUsers ) {
                            props.setAttributes( { noOfUsers } );
                        },
                        min: 0
                    }),
                    el(TextControl,  {
                        label: 'Space Between',
                        type: 'number',
                        value: props.attributes.listGap,
                        onChange: function ( listGap ) {
                            props.setAttributes( { listGap } );
                        },
                        min: 0
                    })
                ]),
                el(Flex, { align: 'baseline' }, [
                    el(TextControl,  {
                        label: 'Avatar Radius',
                        type: 'number',
                        value: props.attributes.avatarRadius,
                        onChange: function ( avatarRadius ) {
                            props.setAttributes( { avatarRadius } );
                        }
                    }),
                    el(TextControl,  {
                        label: 'Avatar Size',
                        type: 'number',
                        value: props.attributes.avatarSize,
                        onChange: function ( avatarSize ) {
                            props.setAttributes( { avatarSize } );
                        }
                    })
                ]),
                el(ToggleControl, {
                    label: 'Show Display Name',
                    checked: props.attributes.showDisplayName,
                    onChange: function ( showDisplayName ) {
                        props.setAttributes( { showDisplayName } );
                    }
                })
            ];

            if ( props.attributes.showDisplayName ) {

                listSettingElements.push(
                    el(SelectControl, {
                        label: 'Show Display Name from',
                        value: props.attributes.showDisplayNameAs,
                        options: [
                            { value: 'display_name', label: 'Display Name' },
                            { value: 'user_login', label: 'Username' },
                            { value: 'user_firstname', label: 'First Name' },
                            { value: 'user_lastname', label: 'Last Name' }
                        ],
                        onChange: function ( showDisplayNameAs ) {
                            props.setAttributes( { showDisplayNameAs } );
                        }
                    }),
                    el(TextControl,  {
                        label: 'Show Number of Characters',
                        type: 'number',
                        value: props.attributes.noOfChars,
                        onChange: function ( noOfChars ) {
                            noOfChars = parseInt( noOfChars ) < 5 ? 5 : noOfChars;
                            props.setAttributes( { noOfChars } );
                        },
                        min: 5
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
                                size: 16
                            },
                            {
                                name: __( 'Large' ),
                                slug: 'large',
                                size: 20
                            }
                        ],
                        withSlider: true,
                        fallbackFontSize: 16,
                        value: props.attributes.nameFontSize,
                        onChange: function ( nameFontSize ) {
                            props.setAttributes( { nameFontSize } );
                        }
                    })
                );

            }

            var coloSettings = [{
                value: props.attributes.headingColor,
                label: 'Heading',
                onChange: (e) => props.setAttributes({ headingColor: e }),
            }];

            if ( props.attributes.showDisplayName ) {

                coloSettings.push({
                    value: props.attributes.nameColor,
                    label: 'User Display Name',
                    onChange: (e) => props.setAttributes({ nameColor: e }),
                });

            }

            return el( 'div', useBlockProps(), [
                el( 'h6', { style: { 
                    margin: `${headingMargin.top} ${headingMargin.right} ${headingMargin.bottom} ${headingMargin.left}`, 
                    color: props.attributes.headingColor, 
                    fontSize: props.attributes.headingFontSize + 'px'
                } }, props.attributes.headingText ),
                el( 'ul', { style: { 
                    margin: '0', 
                    padding: '0', 
                    listStyleType: 'none',
                    fontSize: props.attributes.nameFontSize + 'px',
                    color: props.attributes.nameColor,
                    display: 'inline-flex',
                    gap: props.attributes.listGap + 'px',
                    flexWrap: 'wrap'
                } }, 
                    el(UsersListComponent, {
                        avatarSize: props.attributes.avatarSize,
                        avatarRadius: props.attributes.avatarRadius,
                        noOfUsers: props.attributes.noOfUsers,
                        showDisplayName: props.attributes.showDisplayName,
                        noOfChars: props.attributes.noOfChars
                    })
                ),
                el(InspectorControls, null,
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
                        el(Spacer, { marginBottom: 6 }),
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
                    el( panelBody, { title: 'List Settings', initialOpen: true }, listSettingElements),
                    el(PanelColorSettings, { title: 'Color', colorSettings: coloSettings })
                )
            ]);
        },
        save: function( props ) {return null;}
    } );

    function UsersListComponent( props ) {

        var noOfUsers = ( parseInt( props.noOfUsers ) == 0 ? 10 : props.noOfUsers );

        var liStyle = {
            overflow: 'hidden',
            textAlign: 'center'
        }

        var pStyle = {
            textAlign: 'center',
            margin: 0
        }

        var avatarAtts = {
            src: mrpAssetsUrl + 'images/avatar.png',
            style: { 
                width: props.avatarSize + 'px', 
                height: props.avatarSize + 'px', 
                borderRadius: props.avatarRadius + '%'
            }
        }

        var usersList = [];

        var dispalyNames = [ 'John', 'Allie', 'Fred', 'Jaxon', 'Karel', 'Liam', 'James', 'Oliver', 'William', 'Lucas', 'Theodore' ];

        var nameKey = 0;

        for ( var i = 0; i < noOfUsers; i++ ) {

            avatarAtts.title = dispalyNames[ nameKey ];

            var liElements = [ el( 'img', avatarAtts ) ];

            if ( props.showDisplayName ) {

                var dName = dispalyNames[ nameKey ]; 

                if ( dName.length > parseInt( props.noOfChars ) ) 
                    dName = dName.substring( 0, parseInt( props.noOfChars ) ) + '..';

                liElements[1] = el( 'p', { style: pStyle, title: dispalyNames[ nameKey ] }, dName );
            
                nameKey++;

                if ( nameKey > 10 ) nameKey = 0;
            
            }
            
            usersList[i] = el( 'li', { style: { liStyle } }, liElements );
 
        }

        return usersList;

    }
    
} )( window.wp.blocks, window.wp.blockEditor, window.wp.element, window.wp.data, window.wp.components, window.wp.i18n );