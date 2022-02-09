<template>
	<div class="controls">
		<div v-for="(controls, name) in settings" :key="name" class="section">
			<h3>{{ camelCaseToReadable(name) }}</h3>
			<div v-for="(control, n) in controls" :key="n" class="control">
				<span>{{ camelCaseToReadable(n) }}</span>
				<slider v-model="modelValue[n]" :min="control.min" :max="control.max" />
			</div>
		</div>
		<div class="button" @click="$emit('reset')">Reset All</div>
	</div>
</template>



<script>
import Slider from '@/components/Slider'
export default {
	name: 'Controls',
	components: { Slider },
    props: {
		modelValue: { type: Object, required: true },
        settings: { type: Object, required: true }
    },
	methods: {
		camelCaseToReadable(string) {
			string = string.replace(/([A-Z])/gm, (match) => ' ' + match.toLowerCase())
			return string.charAt(0).toUpperCase() + string.slice(1)
		}
	}
}
</script>



<style scoped>
 .controls { min-width: 300px; padding: 20px; position: fixed; top: 0; left: 0; color: white; user-select: none; }
 	.controls h3 { margin-top: 0; }
 	.section { margin-bottom: 20px; }
		.control { padding: 6px 0; }
</style>
