import { __ } from '@wordpress/i18n'
import { InspectorControls } from '@wordpress/block-editor'
import { PanelBody, SelectControl, TextareaControl } from '@wordpress/components'
import ServerSideRender from '@wordpress/wp-server-side-render'
import meta from './../block.json'

export default function Edit( { attributes, setAttributes, clientId } ) {
	const {
		content,
		alignment
	} = attributes

	return (
		<>
			<ServerSideRender 
				block={ meta.name }
				attributes={ attributes }
			/>

			<InspectorControls>
				<PanelBody title={ __( 'Copy Content' ) }>
					<p>{ __( 'The hidden content that will be copied to the clipboard.' ) }</p>
					<TextareaControl
						value={ content }
						onChange={ ( value ) => setAttributes( { content: value } ) }
					/>
				</PanelBody>
				
				<PanelBody title={ __( 'Alignment' ) }>
					<SelectControl
						label={ __( 'Horizontal Alignment' ) }
						value={ alignment }
						options={ [
							{ label: 'Left', value: 'left' },
							{ label: 'Center', value: 'center' },
							{ label: 'Right', value: 'right' },
						] }
						onChange={ ( value ) => setAttributes( { alignment: value } ) }
					/>
				</PanelBody>
			</InspectorControls>
		</>
	)
}
