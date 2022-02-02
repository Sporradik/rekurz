<template>
    <clock :analyzer="analyzer" msg="Welcome to Your Vue.js App" />
</template>

<script>
import clock from './components/Clock.vue'

const vessel = require('./assets/MEDI120D-003-Glume_and_Phossa-Vessel.wav')
const tension = require('./assets/Yoofee - 0815 Tension (Grey Master).wav')
const frenchless = require('./assets/IFS028 A - Frenchless - 3C 273 - Ten Eight Seven Mastered.wav')

export default {
    name: 'App',
    components: {
        clock
    },
    data() {
        return {
            analyzer: null,
            file: null,
            loaded: false,
        }
    },
    created() {
        window.addEventListener('keyup', (e) => {
            if (e.code === 'Enter') this.play()
            if (e.code === 'Space') this.mic()
        })
        if (!this.file) this.load()
    },
    watch: {
        file(file) {
            if (file && this.playing) this.play(true)
        }
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
        }
    }
}
</script>

<style>
html, body, #app {
    height: 100%;
    width: 100%;
    margin: 0;
}

#app {
    background-color: black;
}
</style>
