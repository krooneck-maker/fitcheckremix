/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XIcon, DownloadIcon, CameraIcon, CheckCircleIcon, AlertCircleIcon } from './icons';
import { generatePoseVariation } from '../services/geminiService';
import { PHOTOSHOOT_PROMPTS } from '../photoshootPrompts';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import Spinner from './Spinner';

interface PhotoshootModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseImageUrl: string;
  outfitName: string;
}

const PhotoshootModal: React.FC<PhotoshootModalProps> = ({ isOpen, onClose, baseImageUrl, outfitName }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const generatePhotos = useCallback(async () => {
    setIsGenerating(true);
    setProgress(0);
    setGeneratedImages([]);
    setError(null);
    setIsComplete(false);

    const images: string[] = [];
    const total = PHOTOSHOOT_PROMPTS.length;

    try {
      for (let i = 0; i < total; i++) {
        const prompt = PHOTOSHOOT_PROMPTS[i];
        try {
          const imageUrl = await generatePoseVariation(baseImageUrl, prompt);
          images.push(imageUrl);
          setGeneratedImages([...images]);
          setProgress(Math.round(((i + 1) / total) * 100));
        } catch (err) {
          console.error(`Failed to generate photo ${i + 1}:`, err);
          // Continue with next photo even if one fails
        }
      }
      setIsComplete(true);
    } catch (err) {
      setError("A critical error occurred during the photoshoot. Please try again.");
      console.error("Photoshoot error:", err);
    } finally {
      setIsGenerating(false);
    }
  }, [baseImageUrl]);

  const downloadAll = async () => {
    const zip = new JSZip();
    const folder = zip.folder(`${outfitName.replace(/\s+/g, '_')}_photoshoot`);
    
    if (!folder) return;

    for (let i = 0; i < generatedImages.length; i++) {
      const imgData = generatedImages[i].split(',')[1];
      folder.file(`photo_${i + 1}.png`, imgData, { base64: true });
    }

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${outfitName.replace(/\s+/g, '_')}_photoshoot.zip`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-4xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-900 rounded-xl flex items-center justify-center text-white">
              <CameraIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Professional Photoshoot</h2>
              <p className="text-sm text-gray-500">Generating {PHOTOSHOOT_PROMPTS.length} high-fashion variations of your outfit</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-600"
          >
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6">
          {!isGenerating && !isComplete && !error && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <CameraIcon className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Ready for the shoot?</h3>
              <p className="text-gray-500 max-w-md mb-8">
                We'll generate {PHOTOSHOOT_PROMPTS.length} unique photos of your current outfit in different high-fashion environments, angles, and poses. This process may take a few minutes.
              </p>
              <button 
                onClick={generatePhotos}
                className="bg-gray-900 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all active:scale-95 shadow-xl flex items-center gap-3"
              >
                <CameraIcon className="w-6 h-6" />
                Start Photoshoot
              </button>
            </div>
          )}

          {(isGenerating || isComplete) && (
            <div className="space-y-8">
              {/* Progress Bar */}
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                    {isComplete ? "Photoshoot Complete" : `Shooting... ${generatedImages.length} / ${PHOTOSHOOT_PROMPTS.length}`}
                  </span>
                  <span className="text-2xl font-black text-gray-900">{progress}%</span>
                </div>
                <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                  <motion.div 
                    className="h-full bg-gray-900"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ type: "spring", bounce: 0, duration: 0.5 }}
                  />
                </div>
              </div>

              {/* Grid of generated images */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {generatedImages.map((url, idx) => (
                  <motion.div 
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="aspect-[3/4] rounded-xl overflow-hidden bg-gray-100 border border-gray-200 shadow-sm"
                  >
                    <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </motion.div>
                ))}
                {isGenerating && (
                  <div className="aspect-[3/4] rounded-xl overflow-hidden bg-gray-50 border border-dashed border-gray-300 flex flex-col items-center justify-center gap-3 text-gray-400">
                    <Spinner className="w-8 h-8" />
                    <span className="text-[10px] font-bold uppercase">Next Shot...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                <AlertCircleIcon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h3>
              <p className="text-gray-500 mb-6">{error}</p>
              <button 
                onClick={generatePhotos}
                className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
          <button 
            onClick={onClose}
            className="text-gray-500 font-bold hover:text-gray-700 transition-colors"
          >
            {isComplete ? "Close" : "Cancel"}
          </button>
          
          {isComplete && (
            <button 
              onClick={downloadAll}
              className="bg-gray-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all shadow-lg flex items-center gap-2"
            >
              <DownloadIcon className="w-5 h-5" />
              Download All (ZIP)
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default PhotoshootModal;
