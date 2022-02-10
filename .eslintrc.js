module.exports = {
	env: {
		node: true,
	},
	extends: ['plugin:vue/essential'],
	settings: {
		'prettier-vue': {
			SFCBlocks: {
				style: false,
				template: false,
			},
		},
	},
	rules: {
		'no-control-regex': 0,
		'no-unused-vars': 1,
		'no-var': 2,
		'no-tabs': 0,
		curly: [1, 'multi-line', 'consistent'],
		'vue/attributes-order': 1,
		'vue/attribute-hyphenation': 1,
		'vue/html-end-tags': 1,
		'vue/html-indent': [
			1,
			'tab',
			{
				alignAttributesVertically: false,
			},
		],
		'vue/max-attributes-per-line': [
			1,
			{
				singleline: 5,
				multiline: {
					max: 1,
					allowFirstLine: false,
				},
			},
		],
		'vue/no-v-model-argument': 1,
		'vue/no-parsing-error': 1,
		'vue/valid-v-for': 1,
		'vue/require-v-for-key': 1,
		'vue/no-unused-vars': 1,
		'vue/no-mutating-props': 'off',
		'vue/mustache-interpolation-spacing': 1,
		'vue/name-property-casing': 1,
		'vue/no-multi-spaces': 1,
		'vue/require-default-prop': 1,
		'vue/require-prop-types': 1,
		'vue/v-bind-style': 1,
		'vue/v-on-style': 1,
		'vue/html-quotes': 1,
		'vue/no-confusing-v-for-v-if': 1,
		'vue/order-in-components': 1,
		'vue/this-in-template': 1,
		'vue/html-closing-bracket-newline': [
			1,
			{
				singleline: 'never',
				multiline: 'always',
			},
		],
		'vue/html-closing-bracket-spacing': 1,
		'vue/prop-name-casing': 1,
		'vue/script-indent': 'off',
		'vue/no-side-effects-in-computed-properties': 'off',
		'vue/return-in-computed-property': 'off',
		'vue/no-use-v-if-with-v-for': 'off',
	},
	parserOptions: {
		parser: 'babel-eslint',
	},
}
