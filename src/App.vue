<template>
	<div class="container" @dblclick="controlsActive = !controlsActive" :class="{light: lightMode, 'show-cursor': mouseMovedRecently} ">
		<transition name="fade">
			<visualization v-if="analyzer" :analyzer="analyzer" v-bind="settings" :settings="$options.allSettings" />
			<div v-else class="prompt">
				<div @click="mic">[ space ] to start</div>
				<div @click="controlsActive = !controlsActive">(( double click anywhere )) to toggle settings</div>
			</div>
		</transition>
		<controls
			v-if="controlsActive"
			v-model="settings"
			v-model:light-mode="lightMode"
			:settings="$options.settings"
			@click.native.stop
			@dblclick.native.stop
			@reset="resetSettings"
		/>
	</div>
</template>

<script>
import Visualization from './components/Visualization.vue'
import Controls from './components/Controls'

// {"hue":360,"hueShiftSpeed":0,"recursion":8,"lightness":53,"globalSpeed":3,"minHighFreqOpacity":0.06,"highFreqOpacityReduction":6,"lowFreqDampening":72,"scale":28,"thickness":0,"lowFreqSensitivity":66,"lowFreqThreshold":29,"smoothing":0.84,"dbThreshold":0}

const settings = {
	visual: {
		hue: {min: 0, max: 360, default: 300},
		hueShiftSpeed: {default: 0},
		recursion: {min: 2, max: 10, default: 10,},
		lightness: {default: 80,},
		globalSpeed: {default: 50},
		minHighFreqOpacity: { min: 0, max: 1, default: 0.01},
		highFreqOpacityReduction: {default: 0.02},
		lowFreqDampening: {default: 50},
		scale: { default: 50 },
		thickness: { default: 2, }
	},
	calibration: {
		lowFreqSensitivity: {default: 50},
		lowFreqThreshold: {default: 50, unit: 'db'},
		smoothing: {min: 0, max: 1, default: 0.4},
		dbThreshold: {default: 0 }
	},

}
const allSettings = Object.assign.apply(null, [{}, ...Object.values(settings)])

const vessel = require('./assets/MEDI120D-003-Glume_and_Phossa-Vessel.wav')
const tension = require('./assets/Yoofee - 0815 Tension (Grey Master).wav')
const frenchless = require('./assets/IFS028 A - Frenchless - 3C 273 - Ten Eight Seven Mastered.wav')

export default {
    name: 'App',
    components: {
        Visualization,
        Controls
    },
	settings,
	allSettings,
    data() {
        return {
			settings: this.getStoredSettings(),
            analyzer: null,
            file: null,
            loaded: false,
			controlsActive: !!this.getStored('controlsActive'),
			lightMode: !!this.getStored('lightMode'),
			mouseMovedRecently: false,
        }
    },
    watch: {
        file(file) {
            if (file && this.playing) this.play(true)
        },
		controlsActive(active) {
			this.setStored('controlsActive', active)
		},
		lightMode(active) {
			this.setStored('lightMode', active)
		},
		settings: {
			handler: 'saveSettings',
			deep: true,
		}
    },
    created() {
		window.addEventListener('mousemove', this.onMousemove)
        window.addEventListener('keyup', (e) => {
            if (e.code === 'Enter') this.play()
            if (e.code === 'Space') this.mic()
        })
		window.addEventListener('storage', e => {
			if (e.key === 'settings') this.settings = JSON.parse(e.newValue)
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
            analyser.fftSize = 128
            analyser.smoothingTimeConstant = 0.4
            analyser.maxDecibels = maxDb
            return this.analyzer = analyser
        },
		getStoredSettings() {
			const settings = localStorage.getObject('settings')
			if (settings) {
				return settings
			} else {
				const flatSettings = Object.assign.apply(null, [{}].concat(Object.values(this.$options.settings)))
				Object.entries(flatSettings).forEach(([key, value]) => flatSettings[key] = value.default )
				return flatSettings
			}
		},
		resetSettings() {
			localStorage.removeItem('settings')
			this.settings = this.getStoredSettings()
		},
		saveSettings(settings) {
			if (document.hasFocus()) localStorage.setObject('settings', settings)
		},
		getStored(key) {
			return localStorage.getItem(key)
		},
		setStored(key, value) {
			if (value === false) localStorage.removeItem(key)
			else localStorage.setItem(key, value)
		},
		onMousemove() {
			this.mouseMovedRecently = true
			clearTimeout(this.mouseMoveTimeout)
			this.mouseMoveTimeout = setTimeout(() => this.mouseMovedRecently = false, 1000)
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

input:not([type=checkbox]) { width: auto; padding: 0; background: transparent; border: none; color: var(--text-color); text-align: right; font-size: inherit; }
	input:focus-visible { outline: none; }
	input::-webkit-outer-spin-button,
	input::-webkit-inner-spin-button {
	  -webkit-appearance: none;
	  margin: 0;
	}
	input[type=number] {
	  -moz-appearance: textfield;
	}

.button { padding: 7px 10px; display: inline-block; opacity: 0.8; background-color: var(--text-color); cursor: pointer; color: var(--bg-color); transition: opacity 0.2s ease; }
	.button:hover { opacity: 1 }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

</style>

<style scoped>
.container { --text-color: #fff; --bg-color: #000; --overlay-color: rgba(0,0,0, 0.5); color: var(--text-color); background-color: var(--bg-color); cursor: none; }
	.container.show-cursor { cursor: auto; }
	.container.light { --text-color: #000; --bg-color: #fff; --overlay-color: rgba(255,255,255, 0.3); }
.prompt { position: fixed; inset: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 20px; font-size: 2vw; cursor: pointer; user-select: none; }
	.prompt > div { cursor: pointer; opacity: 0.8; transition: opacity 0.2s ease; }
	.prompt > div:hover { opacity: 1; }
</style>
