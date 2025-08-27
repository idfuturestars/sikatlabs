import React from 'react';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

function Stub(){ return <main><h1>Accessibility Baseline</h1></main>; }

test('basic a11y passes', async () => {
  const { container } = render(<Stub />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});