import {computed, reactive, watch} from 'vue'
import Preset from './PresetModel'
import PresetModel from './PresetModel'

export default new class PresetCollection {
	constructor() {
		this.data = reactive({
			activePresetId: '',
			presets: this.getStoredPresets()
		})
		watch(this.data.presets, this.setStoredPresets, { deep: true })
		this.activePreset = computed(() => {
			return this.data.presets[this.data.activePresetId]
		})
	}

	setActive(preset) {
		this.data.activePresetId = preset.id
	}

	getStoredPresets() {
		const models = {}
		const presets = localStorage.getObject('presets')
		if (presets) {
			Object.entries(presets).forEach(([id, preset]) => {
				models[id] = new Preset(preset)
			})
		}
		return models
	}

	setStoredPresets(presets) {
		if (document.hasFocus()) localStorage.setObject('presets', presets)
	}

	create(preset) {
		const model = new PresetModel(preset)
		this.data.presets[model.id] = model
	}
}()
