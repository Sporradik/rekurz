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
		settings: { type: Object, required: true },
    },
	computed: {
		decimalGlobalSpeed() {
			return this.parameterToDecimal('globalSpeed')
		},
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
		}
    },
    mounted() {
		if (window.sketch) window.sketch.destroy()
    	this.createSketch()
		if (this.analyzer) this.sketch.start()
    },
	methods: {
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
				// interval: 100,
				autopause: false,
				autostart: false,
				resize() {
					this.setup()
					this.lineLength = this.getLineLength()
				},
				getLineLength() {
					return round(Math.min((this.height, this.width) / 5) * ($this.decimalScale * 2))
				},
				setup() {
					this.lineLength = this.getLineLength()
					this.hueShift = $this.hue
					this.velocity = 1
					this.center = this.getCenterPointXY()
					this.hands = {
						root: {interval: 60 * 60 * 1000, lengthMultiple: .6, noChildren: true },
						a: {interval: 100 * 1333 },
						b: {interval: 40 * 1000 },
						y: {interval: 40 * 1000, reverse: true },
						z: {interval: 100 * 1333, reverse: true },
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
					// get stream frequency data
					const freqData = Array.from(this.getByteFrequencyData())
					const trimHighsIndex = round(freqData.length / 11)
					freqData.splice(-trimHighsIndex, freqData.length - trimHighsIndex)
					const stepSize = Math.floor(freqData.length / $this.recursion)

					// shift values
					t = Math.round(t + this.velocity * ($this.decimalGlobalSpeed * 2))
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
							this.drawLineSegment(line)
							if (depth < $this.recursion) drawNextLine(line, depth + 1)
						})
					}

					Object.values(this.recursiveHands).forEach(data => {
						this.drawRootHand(data)
						if (!data.noChildren && $this.recursion) drawNextLine(data)
					})
				},
				drawRootHand(data) {
					data.rad = this.getRootRad(data.interval, data.reverse)
					Object.assign(data, this.getEndPointXY(data, true))
					// this.drawLineSegment(data)
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
				drawLineSegment({x0, y0, x1, y1, h = 0, l = 100, a = 1, depth}) {
					this.globalCompositeOperation = depth ? 'destination-under' : 'destination-over'
					this.beginPath()
					this.moveTo(x0, y0)
					this.lineTo(x1, y1)
					this.lineWidth = $this.thickness
					this.strokeStyle = `HSLA(${h}, 100%, ${l}%, ${a})`
					this.stroke()
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
				getEndPointXY(hand) {
					const length = (hand.lengthMultiple || 1) * this.lineLength
					const oppositeLength = Math.sin(hand.rad) * length
					const adjacentLength = Math.cos(hand.rad) * length
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
					// need interpolation
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
}
</style>
