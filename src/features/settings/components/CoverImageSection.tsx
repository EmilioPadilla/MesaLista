import { Camera } from 'lucide-react';

interface CoverImageSectionProps {
  coverImage: string;
  isUploadingImage: boolean;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function CoverImageSection({ coverImage, isUploadingImage, onImageUpload }: CoverImageSectionProps) {
  return (
    <div className="space-y-4">
      <div className="relative aspect-[21/9] w-full overflow-hidden rounded-2xl bg-muted">
        {coverImage ? (
          <img src={coverImage} alt="Cover" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <p className="text-foreground/60">Sin imagen de portada</p>
          </div>
        )}
        <div className="absolute inset-0 bg-black/20" />
        <label htmlFor="cover-upload" className="absolute bottom-6 right-6 cursor-pointer">
          <div className="bg-white/90 backdrop-blur-xl hover:bg-white transition-all duration-200 rounded-full p-4 shadow-lg">
            <Camera className="h-6 w-6 text-[#d4704a]" />
          </div>
          <input
            id="cover-upload"
            type="file"
            accept="image/*"
            onChange={onImageUpload}
            className="hidden"
            disabled={isUploadingImage}
          />
        </label>
      </div>
      <p className="text-sm text-foreground/65">
        {isUploadingImage ? 'Subiendo imagen...' : 'Recomendado: 1920 × 820 píxeles · La imagen se guarda automáticamente al subirla.'}
      </p>
    </div>
  );
}
