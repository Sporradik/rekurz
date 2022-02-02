<template>
    <clock :analyzer="analyzer" msg="Welcome to Your Vue.js App" />
</template>

<script>
import clock from './components/Clock.vue'

export default {
    name: 'App',
    components: {
        clock
    },
    data() {
        return {
            analyzer: null
        }
    },
    mounted() {
        this.play()
    },
    methods: {
        async play() {
            const audioCtx = new AudioContext()
            const fileReader = new FileReader()
            const blob = await fetch(require('./assets/Yoofee - 0815 Tension (Grey Master).wav')).then(r => r.blob())
            fileReader.onloadend = () => {
                // Convert array buffer into audio buffer
                audioCtx.decodeAudioData(fileReader.result, async (audioBuffer) => {
                    // Do something with audioBuffer
                    if (audioCtx.status !== 'running') {
                        try {
                            await audioCtx.resume()
                        } catch (e) {
                            console.error(e)
                        }
                    }
                    const  bufferSource = audioCtx.createBufferSource()
                    bufferSource.buffer = audioBuffer

                    const analyser = audioCtx.createAnalyser();
                    bufferSource.connect(analyser)
                    analyser.fftSize = 128
                    analyser.smoothingTimeConstant = 0.4
                    analyser.maxDecibels = 0
                    bufferSource.connect(audioCtx.destination)
                    bufferSource.start()
                    this.analyzer = analyser
                })
            }
            fileReader.readAsArrayBuffer(blob)
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
