<template>
	<div class="slider" :style="{'--knob-width': $options.knobWidthPx + 'px'}">
		<div ref="sliderControl" class="slider-control" @click="onSliderClick">
			<div class="track">
				<div class="knob" :style="{left: valuePercent}" @mousedown="onMousedownKnob"></div>
			</div>
		</div>
		<div class="value">{{valuePercent}}</div>
	</div>
</template>



<script>
import { round } from '@/utils'

export default {
	name: 'Slider',
	// props: {
	// 	modelValue: { type: Number, default: 100 },
	// },
	knobWidthPx: 12,
	data() {
		return {
			modelValue: 100,
			valueDecimal: 0,
		}
	},
	computed: {
		valuePercent() {
			return round(this.valueDecimal * 100) + '%'
		}
	},
	props: {
		min: { type: Number, default: 0 },
		max: { type: Number, default: 100 }
	},
	methods: {
		onSliderClick() {

		},
		onMousedownKnob() {
			window.addEventListener('mouseup', this.onMouseup, { once: true })
			window.addEventListener('mousemove', this.onMousemove)
		},
		onMousemove(e) {
			const {left, width} = this.$refs.sliderControl.getBoundingClientRect()
			const {pageX: x} = e
			const value = (x - left) / width
			this.valueDecimal = Math.min(Math.max(round(value, 5), 0), 1)
			console.log('e', e)
		},
		onMouseup() {
			window.removeEventListener('mousemove', this.onMousemove)
		}
	}
}
</script>



<style scoped>
	.slider { --knob-width: 12px; padding: 4px 0; display: flex; align-items: stretch; gap: 10px; }
		.slider-control { margin-right: var(--knob-width); position: relative; display: flex; align-items: center; flex-grow: 1; }
			.track { margin-right: calc(var(--knob-width) * -1); flex-grow: 1; border-top: 2px rgba(255, 255, 255, 0.5) solid; }
			.knob { width: 12px; position: absolute; top: 0; bottom: 0; background-color: lightgray; border-radius: 5px; }
		.value { min-width: 5ch; text-align: right; }
</style>
