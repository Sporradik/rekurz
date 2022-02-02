<template>
    <clock :analyzer="analyzer" msg="Welcome to Your Vue.js App" @click="play" />
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
        }
    },
    created() {
        this.load()
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
                const bufferSource = audioCtx.createBufferSource()
                bufferSource.buffer = audioBuffer

                const analyser = audioCtx.createAnalyser();
                bufferSource.connect(analyser)
                analyser.fftSize = 64
                analyser.smoothingTimeConstant = 0.4
                analyser.maxDecibels = 0
                bufferSource.connect(audioCtx.destination)
                this.analyzer = analyser
                bufferSource.start()
            })
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
