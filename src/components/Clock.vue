<template>
	<div ref="analog-clock" class="analog-clock">
		<div ref="canvas-container" class="canvas-container" />
	</div>
</template>



<script>
import Sketch from 'sketch-js'


export default {
	name: 'AnalogClock',
	computed: {
		recursion() {
      return 10
			// return parseInt(customization.analogClockRecursion) - 1
		},
		lightness() {
      return 80
			// return parseInt(customization.analogClockLightness)
		},
		hueShift() { return 0
			// return parseInt(customization.analogClockHueShift)
		}
	},
	watch: {
		recursion: {
			handler(val) {
				if (val) document.body.classList.add('hide-bg')
				else document.body.classList.remove('hide-bg')
			},
			immediate: true
		}
	},
	mounted() {
		const $this = this
		const container = this.$refs['canvas-container']
		const root = this.$refs['analog-clock']
		const handLength = 200
		this.sketch = Sketch.create({
			container,
			height: container.clientHeight,
			width: container.clientWidth,
			autopause: false,
      resize() {
        this.setup()
      },
			setup() {
				this.center = this.getCenterPointXY()
				this.hands = {
					hour: { interval: 12 * 60 * 60 * 1000, length: 100, noChildren: true },
					minute: { interval: 60 * 60 * 1000 },
					second: { interval: 60 * 1000 }}
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
				const drawNextLine = (parent, depth = 0) => {
					['second', 'minute'].forEach(name => {
						const line = {
							x0: parent.x1,
							y0: parent.y1,
							x1: 0,
							y1: 0,
							rad: parent.rad + this.hands[name].rad,
							length: (parent.length || handLength) * this.getLengthReductionFactor(),
							a: (1 - (depth * (1 / $this.recursion))) - (depth ? 0.05 : 0) ,
							l: depth ? $this.lightness : 100 - (100 - $this.lightness) / 2,
							h: (depth * (360 / $this.recursion) + $this.hueShift) % 360,
              depth
						}
						Object.assign(line, this.getEndPointXY(line))
						this.drawLineSegment(line)
						if (depth < $this.recursion) drawNextLine(line, depth + 1)
					})
				}

				Object.values(this.hands).forEach(data => {
					data.rad = this.getRootRad(data.interval)
					Object.assign(data, this.getEndPointXY(data, true))
					this.drawLineSegment(data)
					if (!data.noChildren && $this.recursion) drawNextLine(data)
				})
			},
			drawLineSegment({x0, y0, x1, y1, h = 0, l = 100, a = 1, depth}) {
        this.globalCompositeOperation = depth ? 'destination-under' : 'destination-over'
				this.beginPath()
				this.moveTo(x0, y0)
				this.lineTo(x1, y1)
				this.lineWidth = 2
				this.strokeStyle = `HSLA(${h}, 100%, ${l}%, ${a})`
				this.stroke()
			},
			getLengthReductionFactor () {
				// Generates a number between 0.75 and 0.95 that changes smoothly over time
				return Math.round((Math.sin(Date.now() / 100000) / 10 + 0.85) * 1000) / 1000
			},
			getCenterPointXY() {
				const rect = root.getBoundingClientRect()
				return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2}
			},
			getRootRad(interval) {
				let startTime = new Date()
				startTime.setHours(0,0,0,0)
				startTime = startTime.getTime()
				const time = Date.now() - startTime
				const progress = (time / interval) % 1
				const deg = progress * 360
				return (deg * Math.PI) / 180
			},
			getEndPointXY(hand) {
				const length = hand.length || handLength
				const oppositeLength = Math.sin(hand.rad) * length
				const adjacentLength = Math.cos(hand.rad) * length
				const x1 = hand.x0 + oppositeLength
				const y1 = hand.y0 - adjacentLength
				return { x1, y1 }
			},
		})
	},
}
</script>



<style scoped>
	.analog-clock { height: 100%; width: 100%; }
	.canvas-container { position: fixed; top: 0; right: 0; bottom: 0; left: 0; }
</style>
