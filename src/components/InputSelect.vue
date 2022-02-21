<template>
	<div class="select">
		<select v-model="value">
			<option v-for="option in options" :selected="value === option.value" :value="option.value">{{ option.label || option.value }}</option>
		</select>
	</div>
</template>



<script>
export default {
	name: 'InputSelect',
	props: {
		modelValue: { type: String, default: '' },
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
	}
}
</script>



<style scoped>
.select { width: 100%;   }
	select { width: 100%; margin: 0; padding: 5px 0; background-color: var(--gray-overlay-color); border: none; border-radius: 5px; color: var(--text-color); font-size: 16px; }
		select:focus { outline: none; }
</style>
