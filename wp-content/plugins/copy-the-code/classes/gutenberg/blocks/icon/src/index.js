import { registerBlockType } from '@wordpress/blocks'
import Edit from './edit'
import meta from './../block.json'

registerBlockType( meta.name, {
	...meta,
	edit: Edit,
} )
