
export default function (properties = {}) {
	const defaults = {
		id: crypto.randomUUID(),
		t: 0,
		settings: {},
	}
	return Object.assign(defaults, properties)
}
