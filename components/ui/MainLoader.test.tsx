import { render } from '@testing-library/react';
import { MainLoader } from './MainLoader';
import { describe, it, expect } from 'vitest';

describe('MainLoader', () => {
    it('displays loading animation', () => {
        render(<MainLoader />);
        const leafIcon = document.querySelector('.text-emerald-600');
        expect(leafIcon).toBeInTheDocument();
    });
});