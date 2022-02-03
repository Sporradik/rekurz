import { createApp } from 'vue'
import App from './App.vue'

Storage.prototype.setObject = function (key, value) {
	this.setItem(key, JSON.stringify(value))
}

Storage.prototype.getObject = function (key) {
	const value = this.getItem(key)
	return value && JSON.parse(value)
}

createApp(App).mount('#app')
