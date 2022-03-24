<template>
	<div class="panel">
		<h2>Presets</h2>
		<div class="presets">
			<preset v-for="preset in presets" v-bind="preset" :active="preset === activePreset" @click="setActivePreset(preset)">{{preset.t}}</preset>
		</div>
		<div class="button" @click="create">Save</div>
	</div>
</template>



<script>
import { t } from './Visualization'
import Preset from './Preset'
import presetCollection from '../presets/presetCollection'
import settingsManager from '@/settings/settingsManager'

export default {
	name: 'Presets',
	components: {Preset},
	computed: {
		presets() {
			return presetCollection.data.presets
		},
		activePreset() {
			return presetCollection.activePreset.value
		}
	},
	methods: {
		create() {
			presetCollection.create({t, settings: { ...settingsManager.data.settings }})
		},
		setActivePreset(preset) {
			presetCollection.setActive(preset)
		}
	}
}
</script>



<style scoped>
.panel { right: 0; }
</style>
