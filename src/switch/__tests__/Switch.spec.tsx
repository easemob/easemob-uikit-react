import React from 'react';
import { render, screen } from '@testing-library/react';
import { Switch } from '../Switch';

describe('ui/Switch', () => {
	it('should contain className', function () {
		const text = 'test-class';
		let { container } = render(<Switch checked={true} className={text} />);
		expect(container.querySelector('.test-class')?.className).toContain(
			text
		);
	});
});
