<template>
	<div ref="analog-clock" class="analog-clock">
		<div ref="canvas-container" class="canvas-container" />
	</div>
</template>


<script>
import Sketch from 'sketch-js'
let t = getRandomInt(100000000)
let hueShift = 300


function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function round(number, decimals) {
    const pow = Math.pow(10, decimals)
    return Math.round(number * pow) / pow
}

const lerp = (x, y, a) => x * (1 - a) + y * a;


export default {
    name: 'Visualization',
    props: {
        analyzer: { type: Object, default: null }
    },
    computed: {
        recursion() {
            return 10
            // return parseInt(customization.analogClockRecursion) - 1
        },
        lightness() {
            return 80
            // return parseInt(customization.analogClockLightness)
        },
    },
    watch: {
        analyzer(val) {
            if (val) this.sketch.start()
        }
    },
    mounted() {
        const $this = this
        const container = this.$refs['canvas-container']
        const root = this.$refs['analog-clock']
        const handLength = 250
        this.sketch = Sketch.create({
            container,
            height: container.clientHeight,
            width: container.clientWidth,
            // interval: 100,
            autopause: false,
            autostart: false,
            resize() {
                this.setup()
            },
            setup() {
                this.velocity = 1
                this.center = this.getCenterPointXY()
                this.hands = {
                    hour: {interval: 12 * 60 * 60 * 1000, length: 100, noChildren: true},
                    minute: {interval: 40 * 60 * 1000 },
                    second: {interval: 40 * 1000 }
                }
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
                const stepSize = Math.floor(freqData.length / $this.recursion)

                // shift values
                t = Math.round(t + this.velocity)
                this.lowFreqIntensity = this.getLowFreqIntensity(freqData)
                // hueShift = Math.round((hueShift + 0.1) * 100) / 100
                // if (hueShift > 360) hueShift = 0

                if (this.lowFreqIntensity > this.velocity) this.velocity = round(lerp(this.lowFreqIntensity, this.velocity, 0.2), 2)
                else this.velocity = round(lerp(this.lowFreqIntensity, this.velocity, 0.95), 2)


                const drawNextLine = (parent, depth = 0) => {
                    ;['second', 'minute'].forEach(name => {
                        const line = {
                            x0: parent.x1,
                            y0: parent.y1,
                            x1: 0,
                            y1: 0,
                            rad: parent.rad + this.hands[name].rad,
                            length: (parent.length || handLength) * this.getLengthReductionFactor(),
                            a: /*(1 - ((depth * (1 / $this.recursion))) - (depth ? 0.05 : 0)) **/ this.getAlphaMod(freqData, depth, stepSize),
                            l: depth ? $this.lightness : 100 - (100 - $this.lightness) / 2,
                            h: (depth * (360 / $this.recursion) + Math.floor(hueShift)) % 360,
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
                    // this.drawLineSegment(data)
                    if (!data.noChildren && $this.recursion) drawNextLine(data)
                })
            },
            getAlphaMod(freqData, depth, stepSize) {
                const minHighFreqOpacity = 0.01
                const highFreqReductionFactor = 0.015
                const lowFreqDampening = 300
                if (freqData) {
                    if (depth < 4) {
                        // treat low frequencies differently as they seem to be less sensitive
                        return round(this.lowFreqIntensity / lowFreqDampening, 2)
                    } else {
                        const start = Math.floor(depth * stepSize)
                        const end = Math.floor(((depth + 1) * stepSize) - 1)
                        const chunk = freqData.slice(start, end)
                        const average = chunk.reduce((acc, val) => acc + val, 0) / stepSize
                        return round((((average / 255) - highFreqReductionFactor * depth ) + minHighFreqOpacity), 2)
                    }
                }
                return 0
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
            getLengthReductionFactor() {
                // Generates a number between 0.75 and 0.95 that changes smoothly over time
                return Math.round((Math.sin(t / 100000) / 10 + 0.85) * 1000) / 1000
            },
            getCenterPointXY() {
                const rect = root.getBoundingClientRect()
                return {x: rect.left + rect.width / 2, y: rect.top + rect.height / 2}
            },
            getRootRad(interval) {
                const progress = (t / interval) % 1
                const deg = progress * 360
                return (deg * Math.PI) / 180
            },
            getEndPointXY(hand) {
                const length = hand.length || handLength
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
                const sensitivity = 500
                const length = Math.floor(freqData.length / 10)
                const slice = freqData.slice(0, length - 1)
                const average = slice.reduce((acc, val) => acc + val, 0) / length
                let velocity = round((average - 20) / 100, 2)
                if (velocity > 1) velocity = velocity + ((velocity - 1) * sensitivity) + 1
                else velocity = 1
                // speed up fast, slow down slow
                return velocity
            }
        })
    },
}
</script>


<style scoped>
.analog-clock {
    height: 100%;
    width: 100%;
}

.canvas-container {
    position: fixed;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
}
</style>
