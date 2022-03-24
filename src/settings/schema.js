const schema = {
	structure: {
		mode: {
			type: 'select',
			options: [
				{label: 'Single', value: 'single'},
				{label: 'Mirror', value: 'mirror'},
				{label: 'Spiral', value: 'spiral'},
			],
			default: 'mirror'
		},
		formula: {
			type: 'select',
			options: [
				{label: 'Clock - sin / cos', value: ['sin', 'cos']},
				{label: 'X beam - tan / cos', value: ['tan', 'cos']},
				{label: 'X beam - tan / sin', value: ['tan', 'sin']},
				{label: 'Y beam - sin / tan ', value: ['sin', 'tan']},
				{label: 'Hourglass - sin / arctan', value: ['sin', 'atan']},
			],
			default: ['sin', 'cos']
		},
		recursion: {min: 2, max: 10, default: 10,},
		scale: {default: 50},
		thickness: {default: 2,}
	},
	movement: {
		globalSpeed: {min: -100, default: 50},
	},
	color: {
		hue: {min: 0, max: 360, default: 300},
		hueShiftSpeed: {default: 0},
		lightness: {default: 80,},
		minHighFreqOpacity: {min: 0, max: 1, default: 0.01},
		highFreqOpacityReduction: {default: 0.02},
		lowFreqDampening: {default: 50},
	},
	analyzer: {
		lowFreqSensitivity: {default: 50},
		lowFreqThreshold: {default: 50, unit: 'db'},
		smoothing: {min: 0, max: 1, default: 0.4, round: 1},
		dbThreshold: {min: -50, max: 0, default: -20}
	},
	noRender: {
		lightMode: {default: false}
	}
}

export default schema

export const flatSchema = Object.assign.apply(null, [{}, ...Object.values(schema)])
