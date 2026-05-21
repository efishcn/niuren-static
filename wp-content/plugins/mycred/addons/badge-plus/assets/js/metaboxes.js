(function (wp) {
    var el = wp.element.createElement;
    var PluginDocumentSettingPanel = wp.editPost.PluginDocumentSettingPanel;
    var registerPlugin = wp.plugins.registerPlugin;
    var unregisterPlugin = wp.plugins.unregisterPlugin;
    var SelectControl = wp.components.SelectControl;
    var ToggleControl = wp.components.ToggleControl;
    var useSelect = wp.data.useSelect;
    var useDispatch = wp.data.useDispatch;
    var subscribe = wp.data.subscribe;
    var dispatch = wp.data.dispatch;
    var _select = wp.data.select;
    var __ = wp.i18n.__;
    const { decodeEntities } = wp.htmlEntities;

    function MycredBadgePlaceholderComponent( props ) {

        if ( props.height == undefined ) {

            props.height = '20px';

        }

        return el( 'div', { className: "mycred-loading-placeholder", style: { height: props.height } }, 
            el( 'div', {} )
        );

    }


    function BadgeCategoryComponent(props) {

        if (props.taxonomies == null) {
            return el(MycredBadgePlaceholderComponent, { height: '30px' });
        }

        var data = useSelect(function (select) {
            return {
                savedBadgeType: select('core/editor').getCurrentPostAttribute('mycred_badge_plus_type'),
                editedBadgeType: select('core/editor').getEditedPostAttribute('mycred_badge_plus_type'),
            };
        }, []);

        if (data.savedBadgeType.length > 0 && props.taxonomies.find(item => item.id == data.savedBadgeType[0]) != undefined) {
            const badgeName = decodeEntities(
                props.taxonomies.find(item => item.id == data.savedBadgeType[0]).name
            );

            return el('p', {}, 'Badge Type: ' + badgeName);
        }

        var editPost = useDispatch('core/editor').editPost;
        var options = [
            {
                label: 'Select Badge Type',
                value: -1,
            },
        ];

        Object.keys(props.taxonomies).forEach(function (key) {
            options.push({
                label: decodeEntities(props.taxonomies[key].name), // Decode entities here
                value: props.taxonomies[key].id,
            });
        });

        return el(
            'div',
            null,
            el(SelectControl, {
                help: el(
                    'strong',
                    { style: { color: 'red' } },
                    __('Note: After saving the post you cannot change badge type.', 'mycred-badgeplus')
                ),
                value: data.editedBadgeType[0],
                onChange: function (value) {
                    editPost({
                        mycred_badge_plus_type: [parseInt(value)],
                    });
                },
                options,
            }),
            el(
                'a',
                { href: mycred_badge_plus_meta_data.badgeTypesURL, target: '_blank' },
                'Add New Badge Type'
            )
        );
    }

    function MycredOpenBadgeComponent( props ) {

        var data = useSelect( function ( select ) {
            return select( 'core/editor' ).getEditedPostAttribute( 'meta' );
        }, [] );

        var editPost = useDispatch( 'core/editor' ).editPost;

        return el( 
                PluginDocumentSettingPanel, {
                name: 'mycred-badge-plus-open-badge',
                title: 'Open Badge Setting',
            },
            el( ToggleControl, {
                label: __('Enable Open Badge', 'mycred-badgeplus'),
                help: __('Enable this to make this post an Open Badge.', 'mycred-badgeplus'),
                checked: data.mycred_badge_plus_open_badge,
                onChange: function ( value ) {
                    var confirmMsg = 'Are you sure you want to disable Open badge for this post.';
                    if ( value ) 
                        confirmMsg = 'Are you sure you want to enable Open badge for this post.';

                    if ( confirm( confirmMsg ) == true ) {

                        var metaFields = { mycred_badge_plus_open_badge: value };
                       
                    }

                    editPost( {
                       meta: metaFields,
                    } );

                    jQuery(document).trigger( "mycred_badge_plus_open_badge", [ value ] );
                }
            })
        );
    }

    if ( mycred_badge_plus_meta_data.open_badge == 1 ) {
        
        registerPlugin( 'mycred-badge-plus-open-badge', {
            icon: false,
            render: MycredOpenBadgeComponent
        } );

    }

    function customizeBadgeProductTypeSelector( OriginalComponent ) {
        
        return function ( props ) {

            if ( props.slug === 'mycred_badge_plus_type' ) {
            
                return el( asyncTaxonomies );
            
            } 

            return el( OriginalComponent, props );

        };
    
    }

    wp.hooks.addFilter(
        'editor.PostTaxonomyType',
        'mycred',
        customizeBadgeProductTypeSelector
    );

    var asyncTaxonomies = wp.data.withSelect( function( select ) {
        
        return {
            taxonomies: select('core').getEntityRecords( 'taxonomy', 'mycred_badge_plus_type', { per_page: 100 } )
        };
    
    })( BadgeCategoryComponent );

    wp.domReady( () => {

        let locked = false;
        
        var postType = _select( 'core/editor' ).getCurrentPostType();

        let checkRequiredField = subscribe( () => {

            if ( postType != undefined && postType == 'mycred_badge_plus' ) {

                var mycred_badge_types_saved = _select( 'core/editor' ).getCurrentPostAttribute( 'mycred_badge_plus_type' );
                
                if ( ! mycred_badge_types_saved.length ) {

                    var mycred_badge_types_edited = _select( 'core/editor' ).getEditedPostAttribute( 'mycred_badge_plus_type' );

                    if ( mycred_badge_types_edited.length < 1 || mycred_badge_types_edited[0] == -1 ) {

                        if ( ! locked ) {

                            locked = true;
                            dispatch( 'core/editor' ).lockPostSaving( 'requiredValueLock' );
                            dispatch( 'core/notices' ).createNotice( 
                                'error', 
                                __( 'To publish the Badge please select the Badge Type.', 'mycred-badgeplus' ),
                                {
                                    id: 'mycred_badge_type_notice',
                                    isDismissible: false
                                }
                            );

                        }

                    } 
                    else {
                        
                        if ( locked ) {
                    
                            locked = false;
                            dispatch( 'core/editor' ).unlockPostSaving( 'requiredValueLock' );
                            dispatch( 'core/notices' ).removeNotice( 'mycred_badge_type_notice' );
                    
                        }
                    
                    }

                }

            }
            else {

                postType = _select( 'core/editor' ).getCurrentPostType();

            }

        });

    });

})(window.wp);