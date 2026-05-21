(function (wp) {
    var el = wp.element.createElement;
    var Fragment = wp.element.Fragment;
    var PluginSidebar = wp.editPost.PluginSidebar;
    var PluginDocumentSettingPanel = wp.editor.PluginDocumentSettingPanel;
    var registerPlugin = wp.plugins.registerPlugin;
    var TextControl = wp.components.TextControl;
    var TextareaControl = wp.components.TextareaControl;
    var SelectControl = wp.components.SelectControl;
    var ToggleControl = wp.components.ToggleControl;
    var Button = wp.components.Button;
    var moreIcon = el( 'svg' );
    var useSelect = wp.data.useSelect;
    var useDispatch = wp.data.useDispatch;
    var subscribe = wp.data.subscribe;
    var dispatch = wp.data.dispatch;
    var _select = wp.data.select;
    var __ = wp.i18n.__;
     
    function Component( props ) {

        var data = useSelect( function ( select ) {
            return select( 'core/editor' ).getEditedPostAttribute( 'meta' );
        }, [] );

        var editPost = useDispatch( 'core/editor' ).editPost;

        return el( 
                PluginDocumentSettingPanel, {
                name: 'mycred-rank-settings',
                title: 'Rank Priority',
            },
            el( ToggleControl, {
                label: __( 'Enable to set this default rank', 'mycred-rank-plus' ),
                help: __( 'If you enable this toggle, this rank will become the default rank of the selected rank type.', 'mycred-rank-plus' ),
                checked: data.mycred_rank_plus_is_default,
                onChange: function ( value ) {

                    var confirmMsg = 'Are you sure you want to increase the priority of this rank.';

                    if ( value ) 
                        confirmMsg = 'Are you sure you want to make this default rank.';

                    if ( confirm( confirmMsg ) == true ) {

                        var metaFields = { mycred_rank_plus_is_default: value };

                        if ( value ) {

                            metaFields.mycred_rank_plus_priority = 0;

                        }
                        else {

                            metaFields.mycred_rank_plus_priority = 1;

                        }

                        editPost( {
                            meta: metaFields,
                        } );

                        jQuery(document).trigger( "mycred_rank_plus_is_default", [ value ] );

                    }
                    
                }
            }),
            el( priorityComponent, { value: data.mycred_rank_plus_priority, isDefault: data.mycred_rank_plus_is_default } )
        );
    }

    function MycredPlaceholderComponent( props ) {

        if ( props.height == undefined ) {

            props.height = '20px';

        }

        return el( 'div', { class: "mycred-loading-placeholder", style: { height: props.height } }, 
            el( 'div', {} )
        );

    }

    function priorityComponent( props ) {

        if ( props.isDefault ) {

            return el('div',{}, '');

        }

        var editPost = useDispatch( 'core/editor' ).editPost;

        return el( TextControl, {
            label: __( 'Priority', 'mycred-rank-plus' ),
            help: __( 'Rank priority defines the order by which a user can achieve ranks. Users will need to get lower priority ranks before moving on to the next one.', 'mycred-rank-plus' ),
            type: 'number',
            min: 1,
            max: 1000,
            value: props.value,
            onChange: function ( value ) {
                editPost( {
                    meta: { mycred_rank_plus_priority: value },
                } );
            }
        });

    }

    function categoryComponent( props ) {

        if ( props.taxonomies == null ) {

            return el( MycredPlaceholderComponent, { height: '30px' } );

        }

        var data = useSelect( function ( select ) {
            return {
                savedRankType: select( 'core/editor' ).getCurrentPostAttribute( 'mycred_rank_types' ),
                editedRankType: select( 'core/editor' ).getEditedPostAttribute( 'mycred_rank_types' )
            };
        }, [] );

        if ( data.savedRankType.length > 0 && props.taxonomies.find( item => item.id == data.savedRankType[0] ) != undefined ) {

            return el( 'p', {}, 'Rank Type: ' + props.taxonomies.find( item => item.id == data.savedRankType[0] ).name );

        }

        var editPost = useDispatch( 'core/editor' ).editPost;
        var options  = [{
            label: 'Select Rank Type',
            value: -1
        }];

        var options_priorities = [];
        var type_items = [];

        Object.keys(props.taxonomies).forEach(function (key) {
            options.push({
                label: props.taxonomies[key].name,
                value: props.taxonomies[key].id
            });

            options_priorities[ props.taxonomies[key].id ] = parseInt( props.taxonomies[key].meta.max_priority ) + 1;
            type_items[ props.taxonomies[key].id ] = parseInt( props.taxonomies[key].count );
        });

        return el('div', null,
            el( SelectControl, { 
                help: el( 'strong', { style: { color: 'red' } }, __('Note: After saving the post you cannot change the rank type.', 'mycred') ),
                value: data.editedRankType[0],
                onChange: function( value ){

                    var metaObj = { mycred_rank_plus_priority: options_priorities[value] };

                    if ( type_items[value] == 0 ) {

                        metaObj.mycred_rank_plus_is_default = true;
                        jQuery(document).trigger( "mycred_rank_plus_is_default", [ true ] );

                    }
                    else if( type_items[value] > 0 ) {

                        metaObj.mycred_rank_plus_is_default = false;
                        jQuery(document).trigger( "mycred_rank_plus_is_default", [ false ] );

                    }

                    editPost( {
                        mycred_rank_types: [ parseInt( value ) ],
                        meta: metaObj
                    } );
                },
                options
            }),
            el( 'a', { href: mycred_ranks_plus_meta_data.rankTypesURL, target: '_blank' }, 'Add New Rank Type')
        );

    }

    function MycredRankCongratulationMsgComponent( props ) {

        var data = useSelect( function ( select ) {
            return select( 'core/editor' ).getEditedPostAttribute( 'meta' );
        }, [] );

        var editPost = useDispatch( 'core/editor' ).editPost;

        return el( 
                PluginDocumentSettingPanel, {
                name: 'mycred-rank-congratulation-message',
                title: 'Congratulation Message',
            },
            el( TextareaControl, {
                label: __( 'Message', 'mycred-rank-plus' ),
                help: __( 'Congratulation Message appears when the user has achieved the rank.', 'mycred-rank-plus' ),
                value: data.mycred_rank_plus_congratulation_msg,
                onChange: function ( value ) {
                    editPost( {
                        meta: { mycred_rank_plus_congratulation_msg: value },
                    } );
                }
            })
        );
    }

    function MycredRankAssignComponent( props ) {

        var data = useSelect( function ( select ) {
            return {
                savedRankType: select( 'core/editor' ).getCurrentPostAttribute( 'mycred_rank_types' ),
                meta: select( 'core/editor' ).getCurrentPostAttribute( 'meta' )
            };
        }, [] );

        if ( data.savedRankType.length > 0 && ( data.meta.mycred_rank_plus_priority > 0 || data.meta.mycred_rank_plus_is_default ) ) {

            return el( 
                    PluginDocumentSettingPanel, {
                    name: 'mycred-rank-congratulation-message',
                    title: 'Assign Rank',
                },
                el( Button, {
                    variant: 'primary',
                    text: __( 'Assign', 'mycred-rank-plus' ),
                    id: 'mycred-rank-assign-btn'
                }),
                el( 'div', { class: "mycred-rank-assign-progress" } ),
                el( 'p', { class: "css-1n1x27z", style: { marginTop: '10px' } }, 'Assign Rank to all eligible users.' )
            );

        }

        return el('div');

    }

    registerPlugin( 'mycred-rank-settings', {
        icon: false,
        render: Component
    } );

    registerPlugin( 'mycred-rank-congratulation-message', {
        icon: false,
        render: MycredRankCongratulationMsgComponent
    } );

    registerPlugin( 'mycred-rank-assign', {
        icon: false,
        render: MycredRankAssignComponent
    } );

    function customizeProductTypeSelector( OriginalComponent ) {
        
        return function ( props ) {

            if ( props.slug === 'mycred_rank_types' ) {
            
                return el( asyncTaxonomies );
            
            } 

            return el( OriginalComponent, props );

        };
    
    }

    wp.hooks.addFilter(
        'editor.PostTaxonomyType',
        'mycred',
        customizeProductTypeSelector
    );

    var asyncTaxonomies = wp.data.withSelect( function( select ) {
        
        return {
            taxonomies: select('core').getEntityRecords( 'taxonomy', 'mycred_rank_types', { per_page: 100 } )
        };
    
    })( categoryComponent );

    wp.domReady( () => {

        let locked = false;
        
        var postType = _select( 'core/editor' ).getCurrentPostType();

        let checkRequiredField = subscribe( () => {

            if ( postType != undefined && postType == 'mycred_rank_plus' ) {

                var mycred_rank_types_saved = _select( 'core/editor' ).getCurrentPostAttribute( 'mycred_rank_types' );
                
                if ( ! mycred_rank_types_saved.length ) {

                    var mycred_rank_types_edited = _select( 'core/editor' ).getEditedPostAttribute( 'mycred_rank_types' );

                    if ( mycred_rank_types_edited.length < 1 || mycred_rank_types_edited[0] == -1 ) {

                        if ( ! locked ) {

                            locked = true;
                            dispatch( 'core/editor' ).lockPostSaving( 'requiredValueLock' );
                            dispatch( 'core/notices' ).createNotice( 
                                'error', 
                                __( 'In order to publish the rank, you must select a rank type.', 'mycred-rank-plus' ),
                                {
                                    id: 'mycred_rank_type_notice',
                                    isDismissible: false
                                }
                            );

                        }

                    } 
                    else {
                        
                        if ( locked ) {
                    
                            locked = false;
                            dispatch( 'core/editor' ).unlockPostSaving( 'requiredValueLock' );
                            dispatch( 'core/notices' ).removeNotice( 'mycred_rank_type_notice' );
                    
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
/*
jQuery(document).on('change', '.editor-post-taxonomies__hierarchical-terms-list input[type="checkbox"]', function(){

    if( this.checked ) {
        
        var _this = jQuery(this);
    
        jQuery('.editor-post-taxonomies__hierarchical-terms-list input[type="checkbox"]').not(_this).each(function(i,s){

            if( this.checked )
                jQuery(this).click();

        });

    }
    else{
        jQuery(this).click();
    }

});*/