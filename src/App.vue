<template>
	<clock msg="Welcome to Your Vue.js App" />
</template>

<script>
import clock from './components/Clock.vue'

export default {
  name: 'App',
  components: {
    clock
  }
}
</script>

<style>
html, body, #app { height: 100%; width: 100%; margin: 0; }
#app { background-color: black; }
</style>
