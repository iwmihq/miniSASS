import React, {useCallback, useEffect, useRef, useState} from "react";
import Modal from 'react-modal';
import { Button } from "../../components";
import { FaTrash } from 'react-icons/fa';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: any,
  accept?: string
}

const UploadModal: React.FC<UploadModalProps> = ({ isOpen, onClose, onSubmit, accept= '.jpg, .jpeg, .png' }) => {

  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Generate previews for image files
  useEffect(() => {
    const urls = uploadedFiles.map((file) =>
      file.type.startsWith("image/") ? URL.createObjectURL(file) : ""
    );
    setPreviews(urls);
    return () => urls.forEach((u) => u && URL.revokeObjectURL(u));
  }, [uploadedFiles]);

  useEffect(() => {
    if (isOpen) {
      setUploadedFiles([]);
      setPreviews([]);
    }
  }, [isOpen]);

  const addFiles = useCallback((files: FileList | File[]) => {
    const allowed = accept.split(",").map((s) => s.trim().toLowerCase());
    const valid = Array.from(files).filter((f) =>
      allowed.some((ext) => f.name.toLowerCase().endsWith(ext.replace(".", "")))
    );
    if (valid.length) setUploadedFiles((prev) => [...prev, ...valid]);
  }, [accept]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(e.target.files);
    e.target.value = ""; // allow re-selecting same file
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Drag-and-drop handlers
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  }, [addFiles]);

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onClose}
      style={{
        overlay: { zIndex: 50, backgroundColor: "rgba(0, 0, 0, 0.5)" },
        content: {
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          marginRight: '-50%',
          transform: 'translate(-50%, -50%)',
          width: '100%',
          maxWidth: '520px',
          background: 'white',
          border: 'none',
          borderRadius: '0px 16px 16px 16px',
          maxHeight: '80vh',
          padding: '0',
          overflow: 'hidden',
        },
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-surface-subtle px-5 py-3">
        <h3 className="font-raleway text-heading font-bold text-primary">Upload Images</h3>
        <button
          onClick={onClose}
          className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-surface-muted hover:text-primary"
          aria-label="Close"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col gap-4 p-5" style={{ maxHeight: 'calc(80vh - 60px)', overflowY: 'auto' }}>
        {/* Drop zone */}
        <div
          className={`flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-all ${
            isDragging
              ? "border-accent bg-accent/5 scale-[1.01]"
              : "border-surface-subtle bg-surface-muted/30 hover:border-accent/50"
          }`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <svg className="mb-3 h-10 w-10 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
          </svg>
          <p className="text-body-sm text-text-muted">
            Drag & drop images here, or{" "}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="font-semibold text-accent underline underline-offset-2 hover:text-accent-dark"
            >
              browse
            </button>
          </p>
          <p className="mt-1 text-caption text-text-subtle">
            {accept.toUpperCase()} — multiple files supported
          </p>
        </div>

        {/* File previews */}
        {uploadedFiles.length > 0 && (
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-body-sm font-semibold text-text">
                {uploadedFiles.length} file{uploadedFiles.length !== 1 ? "s" : ""} selected
              </span>
              <button
                type="button"
                onClick={() => setUploadedFiles([])}
                className="text-caption font-semibold text-danger hover:underline"
              >
                Clear all
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {uploadedFiles.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  className="group relative overflow-hidden rounded-lg border border-surface-subtle bg-surface-muted"
                >
                  {previews[index] ? (
                    <img
                      src={previews[index]}
                      alt={file.name}
                      className="h-24 w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-24 items-center justify-center">
                      <svg className="h-8 w-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                      </svg>
                    </div>
                  )}
                  {/* File name overlay */}
                  <div className="absolute bottom-0 left-0 right-0 truncate bg-black/60 px-1.5 py-0.5 text-caption text-white">
                    {file.name}
                  </div>
                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-danger text-white opacity-0 transition-opacity group-hover:opacity-100"
                    aria-label={`Remove ${file.name}`}
                  >
                    <FaTrash className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload button */}
        <Button
          className={`!text-white-A700 cursor-pointer rounded-bl-[10px] rounded-br-[10px] rounded-tr-[10px] text-center text-lg tracking-[0.81px] w-full p-1 font-bold ${
            uploadedFiles.length > 0 ? "hover:opacity-90" : "opacity-50"
          }`}
          disabled={uploadedFiles.length === 0}
          color="blue_gray_500"
          size="xl"
          variant="fill"
          onClick={() => {
            onSubmit(uploadedFiles);
            setUploadedFiles([]);
          }}
        >
          Upload {uploadedFiles.length > 0 ? `${uploadedFiles.length} file${uploadedFiles.length !== 1 ? "s" : ""}` : "chosen files"}
        </Button>
      </div>

      {/* Hidden file input */}
      <input
        type="file"
        className="hidden"
        accept={accept}
        onChange={handleFileUpload}
        multiple
        ref={fileInputRef}
      />
    </Modal>
  );
};

export default UploadModal;
