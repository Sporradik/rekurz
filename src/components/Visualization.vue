<template>
	<div ref="canvas-container" class="canvas-container" />
</template>


<script>
import Sketch from 'sketch-js'
import {getRandomInt, round, lerp, invlerp} from '@/utils'

let t = getRandomInt(100000000)

export default {
    name: 'Visualization',
    props: {
        analyzer: { type: Object, default: null },
		hue: { type: Number, required: true },
		hueShiftSpeed: { type: Number, required: true },
		recursion: { type: Number, required: true },
		lightness: { type: Number, required: true },
		globalSpeed: { type: Number, required: true },
		minHighFreqOpacity: { type: Number, required: true },
		highFreqOpacityReduction: { type: Number, required: true },
		lowFreqSensitivity: { type: Number, required: true },
		lowFreqThreshold: { type: Number, required: true },
		lowFreqDampening: { type: Number, required: true },
		scale: { type: Number, required: true },
		thickness: { type: Number, required: true },
		mode: { type: String, default: 'mirror' },
		formula: { type: Array, required: true },
		settings: { type: Object, required: true },
    },
	computed: {
		decimalLowFreqDampening() {
			return this.parameterToDecimal('lowFreqDampening')
		},
		decimalHighFreqOpacityReduction() {
			return this.parameterToDecimal('highFreqOpacityReduction')
		},
		decimalLowFreqSensitivity() {
			return this.parameterToDecimal('lowFreqSensitivity')
		},
		decimalLowFreqThreshold() {
			return this.parameterToDecimal('lowFreqThreshold', true)
		},
		decimalScale() {
			return this.parameterToDecimal('scale', true)
		},
		double() {
			return ['mirror', 'spiral'].includes(this.mode)
		}
	},
    watch: {
        analyzer: {
			handler(val) {
            	if (val && this.sketch) {
					this.sketch.start()
				}
			},
			immediate: true
        },
		hue(value) {
			this.sketch.hueShift = value
		},
		decimalScale() {
			this.sketch.lineLength = this.sketch.getLineLength()
		},
		recursion() {
			this.sketch.getOffscreenCanvases()
		},
    },
	created() {
		window.addEventListener('wheel', this.onMouseWheel)
	},
	mounted() {
		if (window.sketch) window.sketch.destroy()
    	this.createSketch()
		if (this.analyzer) this.sketch.start()
    },
	deactivated() {
		window.removeEventListener('wheel', this.onMouseWheel)
	},
	methods: {
		onMouseWheel(e) {
			this.wheeling = true
			t += e.deltaY
			clearTimeout(this.scrollTimeout)
			this.scrollTimeout = setTimeout(() => this.wheeling = false, 100)
		},
		parameterToDecimal(name) {
			const { min = 0, max = 100 } = this.settings[name]
			return round(invlerp(min, max, this[name]), 3)
		},
		createSketch() {
			const $this = this
			const container = this.$refs['canvas-container']
			this.sketch = window.sketch = Sketch.create({
				container,
				height: container.clientHeight,
				width: container.clientWidth,
				autopause: false,
				autostart: false,
				resize() {
					this.setup()
					this.lineLength = this.getLineLength()
				},
				getLineLength() {
					return round(Math.min((this.height, this.width) / 5) * ($this.decimalScale * 2))
				},
				getOffscreenCanvases() {
					this.osc = Array.from(new Array($this.recursion + 1)).map(() => {
						const canvas = new OffscreenCanvas(this.width, this.height)
						return { canvas, ctx: canvas.getContext("2d") }
					})
					this.oscReverse =  [...this.osc].reverse()
				},
				setup() {
					this.getOffscreenCanvases()
					this.lineLength = this.getLineLength()
					this.hueShift = $this.hue
					this.velocity = 1
					this.center = this.getCenterPointXY()
					this.hands = {
						root: {interval: 600 * 60 * 1000, lengthMultiple: .6, noChildren: true },
						a: {interval: 1000 * 1333 },
						b: {interval: 400 * 1000 },
						// y: {interval: 400 * 1000, reverse: true },
						// z: {interval: 1000 * 1333, reverse: true },
					}
					this.recursiveHands = {}
					this.forwardHands = {}
					this.reverseHands = {}
					Object.entries(this.hands).forEach(([key, hand]) => {
						if (hand.noChildren) return
						if (hand.reverse) this.reverseHands[key] = hand
						else this.forwardHands[key] = hand
						this.recursiveHands[key] = hand
					})
					Object.values(this.hands).forEach(hand => {
						Object.assign(hand, {
							x0: this.center.x,
							y0: this.center.y,
							x1: 0,
							y1: 0,
							rad: 0,
						})
					})
				},
				draw() {
					this.osc.forEach(osc => osc.ctx.clearRect(0, 0, this.width, this.height))
					// get stream frequency data
					const freqData = Array.from(this.getByteFrequencyData())
					const trimHighsIndex = round(freqData.length / 11)
					freqData.splice(-trimHighsIndex, freqData.length - trimHighsIndex)
					const stepSize = Math.floor(freqData.length / $this.recursion)

					// shift values
					if (!$this.wheeling) t = Math.round(t + this.velocity * ($this.globalSpeed / 100))
					this.lowFreqIntensity = this.getLowFreqIntensity(freqData)
					this.hueShift = Math.round((this.hueShift + $this.hueShiftSpeed / 10 ) * 100) / 100
					if (this.hueShift > 360) this.hueShift = 0

					// speed up fase, slow down slow
					if (this.lowFreqIntensity > this.velocity) this.velocity = this.lowFreqIntensity
					else this.velocity = round(lerp(this.lowFreqIntensity, this.velocity, 0.95), 2)

					// Draw hour hand
					const hourHand = Object.values(this.hands).find(hand => hand.noChildren)
					this.drawRootHand(hourHand)

					const alphaModValues = []
					const drawNextLine = (parent, depth = 0) => {
						let alphaMod = alphaModValues[depth]
						if (alphaMod === undefined) {
							alphaMod = this.getAlphaMod(freqData, depth, stepSize)
							alphaModValues[depth] = alphaMod
						}
						let hourHandFactor = (hourHand.rad + ((180 * Math.PI) / 180)) % 2
						if (parent.reverse) hourHandFactor = hourHandFactor * -1
						const children = Object.keys(parent.reverse ? this.reverseHands :this.forwardHands)
						children.forEach(key => {
							const line = {
								x0: parent.x1,
								y0: parent.y1,
								x1: 0,
								y1: 0,
								rad: parent.rad + this.hands[key].rad - hourHandFactor,
								length: (parent.length || this.lineLength) * this.getLengthReductionFactor(),
								a: /*(1 - ((depth * (1 / $this.recursion))) - (depth ? 0.05 : 0)) **/ alphaMod,
								l: depth ? $this.lightness : 100 - (100 - $this.lightness) / 2,
								h: (depth * (360 / $this.recursion) + Math.floor(this.hueShift)) % 360,
								depth,
								reverse: parent.reverse
							}
							Object.assign(line, this.getEndPointXY(line))
							this.drawLine(this.osc[depth].ctx, line)
							if (depth < $this.recursion) drawNextLine(line, depth + 1)
						})
					}

					Object.values(this.recursiveHands).forEach(data => {
						this.drawRootHand(data)
						if (!data.noChildren && $this.recursion) drawNextLine(data)
					})
					this.oscReverse.forEach(({canvas}) => {
						this.drawImage(canvas, 0, 0)
						if ($this.double) {
							const flipY = $this.mode === 'spiral'
							this.flipXY(flipY)
							this.drawImage(canvas, 0, 0)
							this.flipXY(flipY)
						}
					})

				},
				flipXY(y) {
					this.translate(this.width, y ? this.height : 0)
					this.scale(-1, y ? -1 : 1)
				},
				drawRootHand(data) {
					data.rad = this.getRootRad(data.interval, data.reverse)
					Object.assign(data, this.getEndPointXY(data, true))
					// this.drawLine(this.osc[0].ctx, data)
				},
				getAlphaMod(freqData, depth, stepSize) {
					if (freqData) {
						const start = Math.floor(depth * stepSize)
						const end = Math.floor(((depth + 1) * stepSize) - 1)
						const chunk = freqData.slice(start, end)
						const average = chunk.reduce((acc, val) => acc + val, 0) / stepSize
						const q = 6
						const curve = depth < q ? depth : q - (depth % q)
						const frequencyMod = ($this.decimalHighFreqOpacityReduction * 0.02) * curve
						const frequencyBasedOpacity = round((((average / 255) - (frequencyMod)) + $this.minHighFreqOpacity), 2)
						if (depth < 6) {
							return round(lerp(this.lowFreqIntensity / ($this.decimalLowFreqDampening * 600), frequencyBasedOpacity, depth * 0.1), 3)
						}
						return frequencyBasedOpacity
					}
					return 0
				},
				drawLine(ctx, {x0, y0, x1, y1, h = 0, l = 100, a = 1, depth}) {
					const hsla = `HSLA(${h}, 100%, ${l}%, ${a})`
					// if (depth === $this.recursion || true) {
					// 	const grad = ctx.createLinearGradient(x0, y0, x1, y1);
					// 	grad.addColorStop(0, hsla);
					// 	grad.addColorStop(1, `HSLA(${h}, 100%, ${l}%, 0)`);
					// 	ctx.strokeStyle = grad
					// } else {
						ctx.strokeStyle = hsla
					// }
					ctx.globalCompositeOperation = depth ? 'destination-under' : 'destination-over'
					ctx.beginPath()
					ctx.moveTo(x0, y0)
					ctx.lineTo(x1, y1)
					ctx.lineWidth = $this.thickness
					ctx.stroke()
				},
				getLengthReductionFactor() {
					// Generates a number between 0.75 and 0.95 that changes smoothly over time
					return Math.round((Math.sin(t / 100000) / 10 + 0.85) * 1000) / 1000
				},
				getCenterPointXY() {
					const rect = container.getBoundingClientRect()
					return {x: rect.left + rect.width / 2, y: rect.top + rect.height / 2}
				},
				getRootRad(interval, reverse) {
					let progress = (t / interval) % 1
					if (reverse) progress = 1 - progress
					const deg = progress * 360
					return (deg * Math.PI) / 180
				},
				getFormula() {

				},
				getEndPointXY(hand) {
					// sin + cos -> clock
					// tan + cos -> horizontal beam
					// tan + sin => horizontal beam
					// sin + tan => vertical beam
					// sin + atan -> hourglass
					const length = (hand.lengthMultiple || 1) * this.lineLength
					const oppositeLength = Math[$this.formula[0]](hand.rad) * length
					const adjacentLength = Math[$this.formula[1]](hand.rad) * length
					const x1 = hand.x0 + oppositeLength
					const y1 = hand.y0 - adjacentLength
					return {x1, y1}
				},
				getByteFrequencyData() {
					const analyzer = $this.analyzer
					if (!analyzer) return
					const bufferLength = analyzer.frequencyBinCount
					const dataArray = new Uint8Array(bufferLength)
					analyzer.getByteFrequencyData(dataArray)
					return dataArray
				},
				getLowFreqIntensity(freqData) {
					const sensitivity = $this.decimalLowFreqSensitivity * 600
					const lowThreshold = (($this.decimalLowFreqThreshold * -1) + 1) * 40
					const length = Math.floor(freqData.length / 10)
					const slice = freqData.slice(0, length - 1)
					const average = slice.reduce((acc, val) => acc + val, 0) / length
					let velocity = round((average - lowThreshold) / 100, 2)
					if (velocity > 1) return velocity + ((velocity - 1) * sensitivity) + 1
					else return 1
				}
			})
		}
	}
}
</script>


<style scoped>

.canvas-container {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
	z-index: -1;
}
</style>
