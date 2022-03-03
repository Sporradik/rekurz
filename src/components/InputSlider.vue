<template>
	<div class="slider" :style="{'--knob-width': $options.knobWidthPx + 'px'}">
		<div class="slider-control-wrapper" @mousedown="onMousedownKnob">
			<div ref="sliderControl" class="slider-control">
				<div class="track">
					<div class="knob" :style="{left: `calc(${percentValue}% - ${$options.knobWidthPx / 2}px` }"></div>
				</div>
			</div>
		</div>
		<input v-model="modelValue" class="value" type="number" @keyup.enter.stop="setConstrainedValue" @blur="setConstrainedValue">
	</div>
</template>



<script>
import {clamp, invlerp, round} from '@/utils'

export default {
	name: 'InputSlider',
	knobWidthPx: 20,
	props: {
		modelValue: { type: Number, default: 100 },
		round: { type: Number, default: null },
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
		percentValue() {
			return round(this.modelValueToDecimal() * 100)
		},
		range() {
			return this.max - this.min
		},
		roundToDecimals() {
			if (this.round !== null) return this.round
			return this.range <= 1 ? 2 : 0
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
			return clamp(round((e.pageX - left) / width, 5))
		},
		modelValueToDecimal() {
			return round(invlerp(this.min, this.max, this.modelValue), 3)
		},
		decimalToModelValue() {
			return round(this.decimalValue * this.range + this.min, this.roundToDecimals)
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
	.slider { --knob-width: 20px; --neg-margin-y: -8px; --half-knob-width: calc(var(--knob-width) / 2); --neg-half-knob-width: calc(var(--half-knob-width) * -1); padding: 4px 0; display: flex; align-items: stretch; }
		.slider-control-wrapper { padding: 0 var(--half-knob-width); display: flex; align-items: stretch; flex-grow: 1; }
			.slider-control { min-height: 20px; padding: 20px 0; position: relative; display: flex; align-items: center; flex-grow: 1; }
				.track { --color: rgba(255, 255, 255, 0.5); margin: 0 var(--neg-half-knob-width); flex-grow: 1; border-top: 2px var(--color) solid; }
					.light .track  { --color: rgba(0,0,0, 0.5) }
				.knob { width: var(--knob-width); position: absolute; top: 0; bottom: 0; background-color: lightgray; border-radius: var(--border-radius); }
					.knob:before { width: 2px; position: absolute; top: 0; left: 50%; bottom: 0; background-color: gray; opacity: 0.3; transform: translateX(-50%); content: ''; }
			.value { width: 5ch; text-align: right; }
</style>
