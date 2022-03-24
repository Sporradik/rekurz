import {reactive, watch} from 'vue'
import schema, { flatSchema } from './schema'

export default new class Settings {
	constructor() {
		this.data = reactive({
			settings: this.getStoredSettings()
		})
		watch(this.data.settings, this.saveSettings, {deep: true})
	}

	getStoredSettings() {
		const settings = localStorage.getObject('settings')
		if (settings) {
			return settings
		} else {
			const flatSettings = { }
			Object.entries(flatSchema).forEach(([key, value]) => flatSettings[key] = value.default )
			return flatSettings
		}
	}

	saveSettings(settings) {
		if (document.hasFocus()) localStorage.setObject('settings', settings)
	}

	resetSettings() {
		localStorage.removeItem('settings')
		this.settings = this.getStoredSettings()
	}
}
