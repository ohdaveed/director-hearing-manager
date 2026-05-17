import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { vi } from 'vitest';
import DraftUploadPanel from '../DraftUploadPanel';

describe('DraftUploadPanel', () => {
  it('renders a file input that accepts .pdf and .docx', () => {
    render(<DraftUploadPanel onUpload={vi.fn()} isUploading={false} />);
    const fileInput = screen.getByLabelText(/Upload Draft Packet/i);
    expect(fileInput).toBeInTheDocument();
    expect(fileInput).toHaveAttribute('accept', '.pdf,.docx');
    expect(fileInput).toHaveAttribute('type', 'file');
  });

  it('calls onUpload with the selected file', () => {
    const mockOnUpload = vi.fn();
    render(<DraftUploadPanel onUpload={mockOnUpload} isUploading={false} />);
    
    const file = new File(['dummy content'], 'draft.pdf', { type: 'application/pdf' });
    const fileInput = screen.getByLabelText(/Upload Draft Packet/i);
    
    fireEvent.change(fileInput, { target: { files: [file] } });
    
    expect(mockOnUpload).toHaveBeenCalledTimes(1);
    expect(mockOnUpload).toHaveBeenCalledWith(file);
  });

  it('shows loading state when isUploading is true', () => {
    render(<DraftUploadPanel onUpload={vi.fn()} isUploading={true} />);
    expect(screen.getByText('Uploading...')).toBeInTheDocument();
    
    // The input is associated with the label "Uploading..." when isUploading is true
    const fileInput = screen.getByLabelText('Uploading...');
    expect(fileInput).toBeDisabled();
    
    const selectButton = screen.getByRole('button', { name: /Select File/i });
    expect(selectButton).toBeDisabled();
  });
});
