<template>
	<select v-model="value">
		<option v-for="option in options" :selected="arraysEqual(value, option.value)" :value="option.value">{{ option.label || option.value }}</option>
	</select>
</template>



<script>
import {arraysEqual} from '@/utils'

export default {
	name: 'InputSelect',
	props: {
		modelValue: { type: [String, Array], default: '' },
		options: { type: Array, required: true },
	},
	emits: ['update:modelValue'],
	computed: {
		value: {
			get() {
				return this.modelValue
			},
			set(value) {
				this.$emit('update:modelValue', value)
			}
		}
	},
	methods: {
		arraysEqual
	}
}
</script>



<style scoped>
select { min-width: 200px; margin: 0; padding: 5px 0; background-color: var(--gray-overlay-color); border: none; border-radius: var(--border-radius); color: var(--text-color); font-size: 16px; text-align: center; }
	select:focus { outline: none; }
</style>
