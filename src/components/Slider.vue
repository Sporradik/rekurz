<template>
	<div class="slider" :style="{'--knob-width': $options.knobWidthPx + 'px'}">
		<div class="slider-control-wrapper" @click="onSliderClick">
			<div ref="sliderControl" class="slider-control">
				<div class="track">
					<div class="knob" :style="{left: valuePercent}" @mousedown="onMousedownKnob"></div>
				</div>
			</div>
		</div>
		<div class="value">{{modelValue}}</div>
	</div>
</template>



<script>
import {invlerp, round} from '@/utils'

export default {
	name: 'Slider',
	knobWidthPx: 12,
	data() {
		return {
			valueDecimal: this.modelValueToDecimal(),
		}
	},
	computed: {
		valuePercent() {
			return round(this.valueDecimal * 100) + '%'
		}
	},
	watch: {
		valueDecimal(value) {
			const range = this.max - this.min
			const decimals = range <= 1 ? 2 : 0
			const adjustedValue = round(value * range + this.
				min, decimals)
			this.$emit('update:modelValue', adjustedValue)
		}
	},
	props: {
		modelValue: { type: Number, default: 100 },
		min: { type: Number, default: 0 },
		max: { type: Number, default: 100 }
	},
	methods: {
		modelValueToDecimal() {
			return round( invlerp(this.min, this.max, this.modelValue), 3)
		},
		onSliderClick(e) {
			this.valueDecimal = this.getRelativeMousePosition(e)
		},
		onMousedownKnob() {
			window.addEventListener('mouseup', this.onMouseup, { once: true })
			window.addEventListener('mousemove', this.onMousemove)
		},
		onMousemove(e) {
			this.valueDecimal = this.getRelativeMousePosition(e)
		},
		getRelativeMousePosition(e) {
			const {left, width} = this.$refs.sliderControl.getBoundingClientRect()
			return Math.min(Math.max(round((e.pageX - left) / width, 5), 0), 1)
		},
		onMouseup() {
			window.removeEventListener('mousemove', this.onMousemove)
		}
	}
}
</script>



<style scoped>
	.slider { --knob-width: 12px; padding: 4px 0; display: flex; align-items: stretch; }
		.slider-control-wrapper { padding-right: var(--knob-width); display: flex; align-items: stretch; flex-grow: 1; }
			.slider-control { min-height: 15px; margin-right: var(--knob-width); margin-right: var(--knob-width); position: relative; display: flex; align-items: center; flex-grow: 1; }
				.track { margin-right: calc(var(--knob-width) * -1); flex-grow: 1; border-top: 2px rgba(255, 255, 255, 0.5) solid; }
				.knob { width: 12px; position: absolute; top: 0; bottom: 0; background-color: lightgray; border-radius: 5px; }
			.value { min-width: 5ch; text-align: right; }
</style>
