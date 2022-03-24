<template>
	<div class="panel">
		<h2>Settings</h2>
		<div v-for="(controls, name) in filteredSchema" :key="name" class="section">
			<h3>{{ camelCaseToReadable(name) }}</h3>
			<div v-for="(control, n) in controls" :key="n" class="control" :class="{row: control.type === 'select', overlay: !control.type }">
				<label>{{ camelCaseToReadable(n) }}</label>
				<input-select v-if="control.type === 'select'" v-model="settings[n]" :options="control.options" />
				<input-slider v-else v-model="settings[n]" v-bind="control" />
			</div>
		</div>
		<div class="buttons">
			<div class="button" @click="reset">Reset All</div>
			<div class="button" @click="toggleLightMode">{{ settings.lightMode ? 'Dark' : 'Light' }}</div>
		</div>
	</div>
</template>



<script>
import InputSlider from '@/components/InputSlider'
import InputSelect from '@/components/InputSelect'
import {camelCaseToReadable} from '@/utils'
import schema from '@/settings/schema'
import settingsManager from '@/settings/settingsManager'


export default {
	name: 'Controls',
	components: { InputSelect, InputSlider },
	computed: {
		filteredSchema() {
			const filtered = {}
			Object.entries(schema).forEach(([key, value]) => {
				if (key !== 'noRender') filtered[key] = value
			})
			return filtered
		},
		settings() {
			return settingsManager.data.settings
		}
	},
	methods: {
		toggleLightMode() {
			this.modelValue.lightMode = !this.modelValue.lightMode
		},
		camelCaseToReadable,
		reset() {
			settingsManager.resetSettings()
		}
	}
}
</script>



<style scoped>
 .panel { }
 	h2, h3 { margin-top: 0; }
 	.section { margin-bottom: 20px; }
		.control { padding: 6px 0; }
			.control.row { display: flex; justify-content: space-between; align-items: baseline; gap: 10px; }
			.control.overlay { position: relative; }
			label { display: inline-block; margin-bottom: 4px; opacity: 0.85; }

	.buttons { display: flex; gap: 10px; }
</style>
