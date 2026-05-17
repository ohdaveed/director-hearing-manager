import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, UploadCloud } from 'lucide-react';

interface DraftUploadPanelProps {
  onUpload: (file: File) => void;
  isUploading: boolean;
}

export default function DraftUploadPanel({ onUpload, isUploading }: DraftUploadPanelProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  return (
    <div className="flex flex-col gap-4 p-6 border-2 border-dashed border-muted-foreground/25 rounded-lg bg-muted/10 items-center justify-center text-center">
      <div className="flex flex-col items-center gap-2">
        <div className="p-3 bg-primary/10 rounded-full text-primary">
          {isUploading ? <Loader2 className="w-6 h-6 animate-spin" /> : <UploadCloud className="w-6 h-6" />}
        </div>
        <div className="space-y-1">
          <Label htmlFor="draft-upload" className="text-base font-semibold cursor-pointer">
            {isUploading ? 'Uploading...' : 'Upload Draft Packet'}
          </Label>
          <p className="text-sm text-muted-foreground">
            Select a PDF or Word Document (.docx)
          </p>
        </div>
      </div>
      
      <Input
        id="draft-upload"
        type="file"
        accept=".pdf,.docx"
        className="hidden"
        onChange={handleFileChange}
        disabled={isUploading}
      />
      
      <Button 
        variant="outline" 
        onClick={() => document.getElementById('draft-upload')?.click()}
        disabled={isUploading}
      >
        Select File
      </Button>
    </div>
  );
}
