<template>
	<div class="slider" :style="{'--knob-width': $options.knobWidthPx + 'px'}">
		<div class="slider-control-wrapper" @mousedown="onMousedownKnob">
			<div ref="sliderControl" class="slider-control">
				<div class="track">
					<div class="knob" :style="{left: `calc(${valuePercent}% - ${$options.knobWidthPx / 2}px` }"></div>
				</div>
			</div>
		</div>
		<input v-model="modelValue" class="value" type="number" @keyup.enter.stop="setConstrainedValue" @blur="setConstrainedValue">
	</div>
</template>



<script>
import {invlerp, round} from '@/utils'

export default {
	name: 'Slider',
	knobWidthPx: 20,
	props: {
		modelValue: { type: Number, default: 100 },
		min: { type: Number, default: 0 },
		max: { type: Number, default: 100 }
	},
	emits: ['update:modelValue'],
	data() {
		return {
			decimalValue: this.modelValueToDecimal(),
		}
	},
	computed: {
		valuePercent() {
			return round(this.decimalValue * 100)
		}
	},
	watch: {
		modelValue(value) {
			if (value > this.min && value < this.max) this.decimalValue = this.modelValueToDecimal()
		},
		decimalValue() {
			this.$emit('update:modelValue', this.decimalToModelValue())
		}
	},
	methods: {
		onSliderMousedown(e) {
			this.decimalValue = this.getRelativeMousePosition(e)
		},
		onMousedownKnob() {
			window.addEventListener('mouseup', this.onMouseup, { once: true })
			window.addEventListener('mousemove', this.onMousemove)
		},
		onMousemove(e) {
			if (!e.buttons) this.onMouseup()
			else this.decimalValue = this.getRelativeMousePosition(e)
		},
		onMouseup() {
			window.removeEventListener('mousemove', this.onMousemove)
		},
		getRelativeMousePosition(e) {
			const {left, width} = this.$refs.sliderControl.getBoundingClientRect()
			return this.constrainDecimal(round((e.pageX - left) / width, 5))
		},
		modelValueToDecimal() {
			return round(invlerp(this.min, this.max, this.modelValue), 3)
		},
		decimalToModelValue() {
			const range = this.max - this.min
			const decimals = range <= 1 ? 2 : 0
			return round(this.decimalValue * range + this.min, decimals)
		},
		constrainDecimal(value) {
			return Math.min(Math.max(value, 0), 1)
		},
		constrainModelValue(value) {
			return Math.min(Math.max(value, this.min), this.max)
		},
		setConstrainedValue() {
			const val = this.constrainModelValue(this.modelValue)
			this.$emit('update:modelValue', val)
		}
	}
}
</script>



<style scoped>
	.slider { --knob-width: 20px; --half-knob-width: calc(var(--knob-width) / 2); padding: 4px 0; display: flex; align-items: stretch; }
		.slider-control-wrapper { padding: 0 var(--half-knob-width); margin: 0 calc(var(--half-knob-width) * -1); display: flex; align-items: stretch; flex-grow: 1; }
			.slider-control { min-height: 20px; margin: 0 var(--half-knob-width); position: relative; display: flex; align-items: center; flex-grow: 1; }
				.track { --color: rgba(255, 255, 255, 0.5); margin: 0 calc(var(--half-knob-width) * -1); flex-grow: 1; border-top: 2px var(--color) solid; }
					.light .track  { --color: rgba(0,0,0, 0.5) }
				.knob { width: var(--knob-width); position: absolute; top: 0; bottom: 0; background-color: lightgray; border-radius: 5px; }
			.value { width: 5ch; text-align: right; }
</style>
