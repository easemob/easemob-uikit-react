export const convertToMessage = (e) => {
	var t = (function () {
		var t = [],
			r = document.createElement('div');
		r.innerHTML = e.replace(/\\/g, '###h###');
		for (
			var n = r.querySelectorAll('img'),
				a = r.querySelectorAll('div'),
				i = n.length,
				o = a.length;
			i--;

		) {
			var s = document.createTextNode(
				n[i].getAttribute('data-key') as string
			);
			n[i].parentNode!.insertBefore(s, n[i]);
			n[i].parentNode!.removeChild(n[i]);
		}
		for (; o--; )
			// @ts-ignore
			t.push(a[o].innerHTML), a[o].parentNode.removeChild(a[o]);
		var c = (t = t.reverse()).length ? '\n' + t.join('\n') : t.join('\n');
		return (r.innerText + c)
			.replace(/###h###/g, '&#92;')
			.replace(/<br>/g, '\n')
			.replace(/&amp;/g, '&');
	})();
	new RegExp('(^[\\s\\n\\t\\xa0\\u3000]+)|([\\u3000\\xa0\\n\\s\\t]+$)', 'g');
	return t.replace(/&nbsp;/g, ' ').trim();
};
