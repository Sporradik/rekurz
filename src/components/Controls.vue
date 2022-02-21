<template>
	<div class="controls">
		<div v-for="(controls, name) in settings" :key="name" class="section">
			<h3>{{ camelCaseToReadable(name) }}</h3>
			<div v-for="(control, n) in controls" :key="n" class="control">
				<label>{{ camelCaseToReadable(n) }}</label>
				<input-select v-if="control.type === 'select'" v-model="modelValue[n]" :options="control.options" />
				<input-slider v-else v-model="modelValue[n]" :min="control.min" :max="control.max" />
			</div>
		</div>
		<div class="buttons">
			<div class="button" @click="$emit('reset')">Reset All</div>
			<div class="button" @click="toggleLightMode">{{ lightMode ? 'Light' : 'Dark' }}</div>
		</div>
	</div>
</template>



<script>
import InputSlider from '@/components/InputSlider'
import InputSelect from '@/components/InputSelect'
export default {
	name: 'Controls',
	components: { InputSelect, InputSlider },
    props: {
		modelValue: { type: Object, required: true },
        settings: { type: Object, required: true },
		lightMode: { type: Boolean, default: false }
    },
	emits: ['update:lightMode', 'update:modelValue' ],
	methods: {
		camelCaseToReadable(string) {
			string = string.replace(/([A-Z])/gm, (match) => ' ' + match.toLowerCase())
			return string.charAt(0).toUpperCase() + string.slice(1)
		},
		toggleLightMode() {
			this.$emit('update:lightMode',!this.lightMode)
		}
	}
}
</script>



<style scoped>
 .controls { max-height: 100vh; min-width: 300px; padding: 20px; position: fixed; top: 0; left: 0; user-select: none; background-color: var(--overlay-color); overflow: auto; cursor: auto; }
 	.controls h3 { margin-top: 0; }
 	.section { margin-bottom: 20px; }
		label { display: inline-block; margin-bottom: 4px; }
		.control { padding: 6px 0; }
	.buttons { display: flex; gap: 10px; }
</style>
