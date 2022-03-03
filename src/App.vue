<template>
	<div class="container" :class="{light: lightMode, 'show-cursor': mouseMovedRecently} " @dblclick="controlsActive = !controlsActive">
		<transition name="fade">
			<visualization v-if="analyzer" :analyzer="analyzer" v-bind="settings" :settings="$options.allSettings" />
			<div v-else class="prompt">
				<h2>rekurz.</h2>
				<div class="actions">
					<div @click="mic"><span>[ space ]</span> <span>start rekurz.</span></div>
					<div @click="controlsActive = !controlsActive"><span>(( dblclick ))</span> <span>toggle settings</span></div>
				</div>
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
		<div class="bg"></div>
	</div>
</template>

<script>
import Visualization from './components/Visualization.vue'
import Controls from './components/Controls'

// {"hue":360,"hueShiftSpeed":0,"recursion":8,"lightness":53,"globalSpeed":3,"minHighFreqOpacity":0.06,"highFreqOpacityReduction":6,"lowFreqDampening":72,"scale":28,"thickness":0,"lowFreqSensitivity":66,"lowFreqThreshold":29,"smoothing":0.84,"dbThreshold":0}
// {"hue":330,"hueShiftSpeed":0,"lightness":56,"minHighFreqOpacity":0.01,"highFreqOpacityReduction":94,"lowFreqDampening":50,"globalSpeed":100,"mode":"mirror","formula":["tan","sin"],"recursion":10,"scale":6,"thickness":0,"lowFreqSensitivity":100,"lowFreqThreshold":50,"smoothing":0.4,"dbThreshold":0}
const settings = {
	structure: {
		mode: {
			type: 'select',
			options: [
				{ label: 'Single', value: 'single' },
				{ label: 'Mirror', value: 'mirror' },
				{ label: 'Spiral', value: 'spiral' },
			],
			default: 'mirror'
		},
		formula: {
			type: 'select',
			options: [
				{ label: 'Clock - sin / cos', value: ['sin', 'cos']},
				{ label: 'X beam - tan / cos', value: ['tan', 'cos']},
				{ label: 'X beam - tan / sin', value: ['tan', 'sin']},
				{ label: 'Y beam - sin / tan ', value: ['sin', 'tan']},
				{ label: 'Hourglass - sin / arctan', value: ['sin', 'atan']},
			],
			default: ['sin', 'cos']
		},
		recursion: {min: 2, max: 10, default: 10,},
		scale: { default: 50 },
		thickness: { default: 2, }
	},
	movement: {
		globalSpeed: { min: -100, default: 50},
	},
	color: {
		hue: {min: 0, max: 360, default: 300},
		hueShiftSpeed: {default: 0},
		lightness: {default: 80,},
		minHighFreqOpacity: { min: 0, max: 1, default: 0.01},
		highFreqOpacityReduction: {default: 0.02},
		lowFreqDampening: {default: 50},
	},
	analyzer: {
		lowFreqSensitivity: {default: 50},
		lowFreqThreshold: {default: 50, unit: 'db'},
		smoothing: {min: 0, max: 1, default: 0.4, round: 1},
		dbThreshold: { min: -50, max: 0, default: -20 }
	},

}
const allSettings = Object.assign.apply(null, [{}, ...Object.values(settings)])

const vessel = require('./assets/MEDI120D-003-Glume_and_Phossa-Vessel.wav')
// const tension = require('./assets/Yoofee - 0815 Tension (Grey Master).wav')
// const frenchless = require('./assets/IFS028 A - Frenchless - 3C 273 - Ten Eight Seven Mastered.wav')

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
		},
		'settings.dbThreshold': 'refreshAnalyzer',
		'settings.smoothing': 'refreshAnalyzer',

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
            this.ctx = new AudioContext()
            navigator.getUserMedia({audio:true},
                stream => {
                    this.source = this.ctx.createMediaStreamSource(stream)
                    this.source.connect(this.createAnalyzer(this.settings))
                }, () => alert('Error capturing audio.')
            )
        },
        play(force) {
            if (this.playing && !force) return
            this.playing = true
            if (!this.file) return
            this.ctx = new AudioContext()
            this.ctx.decodeAudioData(this.file, async (audioBuffer) => {
                // Do something with audioBuffer
                if (this.ctx.status !== 'running') {
                    try {
                        await this.ctx.resume()
                    } catch (e) {
                        console.error(e)
                    }
                }
               	this.source = this.createBufferSource(this.ctx, audioBuffer)
                this.source.connect(this.createAnalyzer())
                this.source.start()
            })
        },
        createBufferSource(audioCtx, audioBuffer) {
            const bufferSource = audioCtx.createBufferSource()
            bufferSource.buffer = audioBuffer
            bufferSource.connect(audioCtx.destination)
            return bufferSource
        },
		refreshAnalyzer() {
			if (!this.source) return
			this.source.disconnect(this.analyzer)
			this.source.connect(this.createAnalyzer(this.settings))
		},
        createAnalyzer({dbThreshold = 0, smoothing = 0.4} = {}) {
            const analyser = this.ctx.createAnalyser();
            analyser.fftSize = 128
            analyser.smoothingTimeConstant = smoothing
            analyser.maxDecibels = dbThreshold
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

* { box-sizing: border-box; }

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

.button { padding: 7px 10px; display: inline-block; background-color: var(--gray-overlay-color); cursor: pointer; color: var(--text-color); border-radius: var(--border-radius); transition: background-color 0.2s ease; }
	.button:hover { background-color: var(--gray-overlay-color-hover); }

.fade-enter-active, .fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

</style>

<style scoped>
.container { --text-color: #fff; --bg-color: #000; --overlay-color: rgba(0,0,0, 0.6); --gray-overlay-color: rgba(255,255,255, 0.1);  --gray-overlay-color-hover: rgba(255,255,255, 0.2); color: var(--text-color); --border-radius: 5px; cursor: none; }
	.container.show-cursor { cursor: auto; }
	.container.light { --text-color: #000; --bg-color: #fff; --overlay-color: rgba(255,255,255, 0.4); --gray-overlay-color: rgba(0,0,0, 0.15); --gray-overlay-color-hover: rgba(0,0,0, 0.2); }
.prompt { position: fixed; z-index: 0; inset: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; gap: 20px; font-size: calc(12px + 1vw); user-select: none; }
	.prompt h2 { font-size: calc(20px + 2.5vw); }
	.actions { display: flex; flex-direction: column; gap: 20px; }
	.actions > div { display: inline-flex; justify-content: space-around; gap: calc(20px + 1vw); cursor: pointer; opacity: 0.8; transition: opacity 0.2s ease; }
		.actions > div:hover { opacity: 1; }
.bg { position: fixed; inset: 0; background-color: var(--bg-color); z-index: -10; }
</style>
