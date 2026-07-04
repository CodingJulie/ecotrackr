import { render, screen } from '@testing-library/react';
import { MainLoader } from './MainLoader';
import { describe, it, expect } from 'vitest';

describe('MainLoader', () => {
    it('отображает анимацию загрузки', () => {
        render(<MainLoader />);
        expect(screen.getByText('main_loader_title')).toBeInTheDocument();
        expect(screen.getByText('main_loader_subtitle')).toBeInTheDocument();
        const leafIcon = document.querySelector('.text-emerald-600');
        expect(leafIcon).toBeInTheDocument();
    });
});