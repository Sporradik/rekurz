<template>
	<div class="container" @dblclick="controlsActive = !controlsActive">
		<visualization :analyzer="analyzer" msg="Welcome to Your Vue.js App" />
		<controls v-if="controlsActive" v-model="savedSettings" :settings="$options.settings" @click.native.stop @dblclick.native.stop />
	</div>
</template>

<script>
import Visualization from './components/Visualization.vue'
import Controls from './components/Controls'


const vessel = require('./assets/MEDI120D-003-Glume_and_Phossa-Vessel.wav')
const tension = require('./assets/Yoofee - 0815 Tension (Grey Master).wav')
const frenchless = require('./assets/IFS028 A - Frenchless - 3C 273 - Ten Eight Seven Mastered.wav')

export default {
    name: 'App',
    components: {
        Visualization,
        Controls
    },
	settings: {
		visual: {
			hue: { min: 0, max: 360, default: 300 },
			hueShiftSpeed: { min: 0, max: 100, default: 0 },
			recursion: { min: 2, max: 11, default: 10, },
			lightness: { min: 0, max: 100, default: 80, },
			globalSpeed: { min: 0, max: 100, default: 50 },
			minHighFreqOpacity: { min: 0, max: 1, default: 0.01 },
		},
		calibration: {
			highFreqOpacityReduction: { min: 0, max: 1, default: 0.015 },
			lowFreqSensitivity: { min: 0, max: 100, default: 50 },
			lowFreqThreshold: { min: 0, max: 100, default: 50 },
			lowFreqDampening: { min: 0, max: 100, default: 300 },
			smoothing: { min: 0, max: 1, default: 0.4 },
			dbThreshold: { min: 0, max: 100, default: 0, }
		},
	},
    data() {
        return {
			savedSettings: {},
            analyzer: null,
            file: null,
            loaded: false,
			controlsActive: !!this.getStored('controlsActive'),
        }
    },
    watch: {
        file(file) {
            if (file && this.playing) this.play(true)
        },
		controlsActive(active) {
			this.setStored('controlsActive', active)
		}
    },
    created() {
        window.addEventListener('keyup', (e) => {
            if (e.code === 'Enter') this.play()
            if (e.code === 'Space') this.mic()
        })
        if (!this.file) this.load()
    },
    methods: {
        async load() {
            const fileReader = new FileReader()
            const blob = await fetch(vessel).then(r => r.blob())
            fileReader.onloadend = () => {
                // Convert array buffer into audio buffer
                this.file = fileReader.result
            }
            fileReader.readAsArrayBuffer(blob)
        },
        mic() {
            const audioCtx = new AudioContext()
            navigator.getUserMedia({audio:true},
                stream => {
                    const source = audioCtx.createMediaStreamSource(stream)
                    source.connect(this.createAnalyzer(audioCtx, {maxDb:  -20}))
                }, () => alert('Error capturing audio.')
            )
        },
        play(force) {
            if (this.playing && !force) return
            this.playing = true
            if (!this.file) return
            const audioCtx = new AudioContext()
            audioCtx.decodeAudioData(this.file, async (audioBuffer) => {
                // Do something with audioBuffer
                if (audioCtx.status !== 'running') {
                    try {
                        await audioCtx.resume()
                    } catch (e) {
                        console.error(e)
                    }
                }
                const source = this.createBufferSource(audioCtx, audioBuffer)
                source.connect(this.createAnalyzer(audioCtx))
                source.start()
            })
        },
        createBufferSource(audioCtx, audioBuffer) {
            const bufferSource = audioCtx.createBufferSource()
            bufferSource.buffer = audioBuffer
            bufferSource.connect(audioCtx.destination)
            return bufferSource
        },
        createAnalyzer(audioCtx, {maxDb = 0} = {}) {
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 64
            analyser.smoothingTimeConstant = 0.4
            analyser.maxDecibels = maxDb
            return this.analyzer = analyser
        },
		getStoredSettings() {
			return this.ge
		},
		getStored(key) {
			return localStorage.getItem(key)
		},
		setStored(key, value) {
			if (value === false) localStorage.removeItem(key)
			localStorage.setItem(key, value)
		}
    }
}
</script>

<style>
html, body, #app, .container {
	font-family: AppleSystemUIFont, "San F", sans-serif;
    height: 100%;
    width: 100%;
    margin: 0;
}

#app {
    background-color: black;
}
</style>
