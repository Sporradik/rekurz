<template>
	<div class="controls">
		<h2>Settings</h2>
		<div v-for="(controls, name) in settings" :key="name" class="section">
			<h3>{{ camelCaseToReadable(name) }}</h3>
			<div v-for="(control, n) in controls" :key="n" class="control" :class="{row: control.type === 'select', overlay: !control.type }">
				<label>{{ camelCaseToReadable(n) }}</label>
				<input-select v-if="control.type === 'select'" v-model="modelValue[n]" :options="control.options" />
				<input-slider v-else v-model="modelValue[n]" :min="control.min" :max="control.max" />
			</div>
		</div>
		<div class="buttons">
			<div class="button" @click="$emit('reset')">Reset All</div>
			<div class="button" @click="toggleLightMode">{{ lightMode ? 'Dark' : 'Light' }}</div>
		</div>
	</div>
</template>



<script>
import InputSlider from '@/components/InputSlider'
import InputSelect from '@/components/InputSelect'
import {camelCaseToReadable} from '@/utils'
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
		toggleLightMode() {
			this.$emit('update:lightMode',!this.lightMode)
		},
		camelCaseToReadable
	}
}
</script>



<style scoped>
 .controls { min-width: 350px; padding: 20px; position: absolute; z-index: 10; display: inline-block; user-select: none; background-color: var(--overlay-color); cursor: auto; }
 	h2, h3 { margin-top: 0; }
 	.section { margin-bottom: 20px; }
		.control { padding: 6px 0; }
			.control.row { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
			.control.overlay { position: relative; }
			label { display: inline-block; margin-bottom: 4px; opacity: 0.85; }

	.buttons { display: flex; gap: 10px; }
</style>
