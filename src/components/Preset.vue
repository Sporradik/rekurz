<template>
	<div class="preset" :class="{active}">{{t}}</div>
</template>



<script>
export default {
	name: 'Preset',
	props: {
		t: { type: Number, required: true },
		active: { type: Boolean, default: false }
	}
}
</script>



<style scoped>

	.preset { padding: 10px 0; opacity: 0.7; transition: opacity 0.2s ease; cursor: pointer; }
	.preset.active { opacity: 0.9; }
	.preset:hover { opacity: 1; }

</style>
