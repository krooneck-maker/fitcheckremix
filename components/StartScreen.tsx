/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloudIcon, XIcon, PlusIcon, RulerIcon } from './icons';
import { Compare } from './ui/compare';
import { generateModelImage } from '../services/geminiService';
import Spinner from './Spinner';
import { getFriendlyErrorMessage } from '../lib/utils';
import { BodyMeasurements } from '../types';

interface StartScreenProps {
  onModelFinalized: (modelUrl: string) => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onModelFinalized }) => {
  const [userFiles, setUserFiles] = useState<File[]>([]);
  const [userImageUrls, setUserImageUrls] = useState<string[]>([]);
  const [generatedModelUrl, setGeneratedModelUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showMeasurements, setShowMeasurements] = useState(false);
  const [measurements, setMeasurements] = useState<BodyMeasurements>({
    height: '',
    weight: '',
    chest: '',
    waist: '',
    hips: '',
    bodyType: 'Average'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    
    const newFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
    if (newFiles.length === 0) {
      setError('Please select valid image files.');
      return;
    }

    setUserFiles(prev => [...prev, ...newFiles]);
    
    newFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setUserImageUrls(prev => [...prev, dataUrl]);
      };
      reader.readAsDataURL(file);
    });
    setError(null);
  }, []);

  const removeFile = (index: number) => {
    setUserFiles(prev => prev.filter((_, i) => i !== index));
    setUserImageUrls(prev => prev.filter((_, i) => i !== index));
  };

  const handleGenerate = async () => {
    if (userFiles.length === 0) {
      setError('Please upload at least one photo.');
      return;
    }

    setIsGenerating(true);
    setGeneratedModelUrl(null);
    setError(null);
    try {
      const result = await generateModelImage(userFiles, measurements);
      setGeneratedModelUrl(result);
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Failed to create model'));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFileSelect(e.target.files);
  };

  const reset = () => {
    setUserFiles([]);
    setUserImageUrls([]);
    setGeneratedModelUrl(null);
    setIsGenerating(false);
    setError(null);
    setShowMeasurements(false);
  };

  const screenVariants = {
    initial: { opacity: 0, x: -20 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 20 },
  };

  const bodyTypes = ['Slim', 'Athletic', 'Average', 'Curvy', 'Plus Size', 'Muscular'];

  return (
    <AnimatePresence mode="wait">
      {generatedModelUrl === null ? (
        <motion.div
          key="uploader"
          className="w-full max-w-7xl mx-auto flex flex-col lg:flex-row items-start justify-center gap-8 lg:gap-12 py-8"
          variants={screenVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          <div className="lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left">
            <div className="max-w-lg w-full">
              <h1 className="text-5xl md:text-6xl font-serif font-bold text-gray-900 leading-tight">
                Create Your Personal Model.
              </h1>
              <p className="mt-4 text-lg text-gray-600">
                Upload one or more photos of yourself. Providing multiple angles helps our AI capture your identity perfectly.
              </p>
              
              <div className="mt-8 space-y-6">
                {/* Image Upload Section */}
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Your Photos</h3>
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                    >
                      <PlusIcon className="w-4 h-4 mr-1" /> Add More
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {userImageUrls.map((url, index) => (
                      <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-300 group">
                        <img src={url} alt={`Upload ${index}`} className="w-full h-full object-cover" />
                        <button 
                          onClick={() => removeFile(index)}
                          className="absolute top-1 right-1 p-1 bg-white/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <XIcon className="w-3 h-3 text-gray-700" />
                        </button>
                      </div>
                    ))}
                    {userImageUrls.length < 5 && (
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:border-gray-400 hover:text-gray-500 transition-all"
                      >
                        <UploadCloudIcon className="w-6 h-6 mb-1" />
                        <span className="text-[10px] font-medium uppercase tracking-wider">Upload</span>
                      </button>
                    )}
                  </div>
                  <input 
                    ref={fileInputRef}
                    type="file" 
                    className="hidden" 
                    accept="image/*" 
                    multiple 
                    onChange={handleFileChange} 
                  />
                  <p className="mt-3 text-xs text-gray-500 italic">
                    Tip: Upload a front view, profile, and 3/4 view for best results.
                  </p>
                </div>

                {/* Measurements Section */}
                <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
                  <button 
                    onClick={() => setShowMeasurements(!showMeasurements)}
                    className="flex items-center justify-between w-full text-lg font-semibold text-gray-900"
                  >
                    <div className="flex items-center">
                      <RulerIcon className="w-5 h-5 mr-2" />
                      Body Measurements (Optional)
                    </div>
                    <span className="text-sm font-normal text-gray-500">
                      {showMeasurements ? 'Hide' : 'Show'}
                    </span>
                  </button>
                  
                  <AnimatePresence>
                    {showMeasurements && (
                      <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-2 gap-4 mt-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Height</label>
                            <input 
                              type="text" 
                              placeholder="e.g. 5'10&quot;"
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-gray-900 outline-none"
                              value={measurements.height}
                              onChange={e => setMeasurements({...measurements, height: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Weight</label>
                            <input 
                              type="text" 
                              placeholder="e.g. 160 lbs"
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-gray-900 outline-none"
                              value={measurements.weight}
                              onChange={e => setMeasurements({...measurements, weight: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Waist</label>
                            <input 
                              type="text" 
                              placeholder="e.g. 32&quot;"
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-gray-900 outline-none"
                              value={measurements.waist}
                              onChange={e => setMeasurements({...measurements, waist: e.target.value})}
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Body Type</label>
                            <select 
                              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-gray-900 outline-none"
                              value={measurements.bodyType}
                              onChange={e => setMeasurements({...measurements, bodyType: e.target.value})}
                            >
                              {bodyTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="pt-4">
                  <button 
                    onClick={handleGenerate}
                    disabled={isGenerating || userFiles.length === 0}
                    className={`w-full relative flex items-center justify-center px-8 py-4 text-lg font-semibold text-white bg-gray-900 rounded-md transition-all ${isGenerating || userFiles.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'}`}
                  >
                    {isGenerating ? (
                      <>
                        <Spinner className="mr-3" />
                        Generating Your Model...
                      </>
                    ) : (
                      'Generate My Model'
                    )}
                  </button>
                  {error && <p className="text-red-500 text-sm mt-3 text-center">{error}</p>}
                </div>
              </div>
            </div>
          </div>
          
          <div className="w-full lg:w-1/2 flex flex-col items-center justify-center sticky top-8">
            <div className="relative w-full max-w-sm aspect-[2/3] rounded-2xl bg-gray-100 border border-gray-200 overflow-hidden shadow-2xl">
              {userImageUrls.length > 0 ? (
                <img src={userImageUrls[0]} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 p-8 text-center">
                  <UploadCloudIcon className="w-12 h-12 mb-4 opacity-20" />
                  <p className="text-sm font-serif italic">Your model preview will appear here once you upload a photo.</p>
                </div>
              )}
              {isGenerating && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex flex-col items-center justify-center">
                  <Spinner className="w-10 h-10 mb-4" />
                  <p className="text-gray-900 font-semibold animate-pulse">Analyzing features...</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          key="compare"
          className="w-full max-w-6xl mx-auto h-full flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12 py-12"
          variants={screenVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          <div className="md:w-1/2 flex-shrink-0 flex flex-col items-center md:items-start">
            <div className="text-center md:text-left">
              <h1 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 leading-tight">
                The New You
              </h1>
              <p className="mt-2 text-md text-gray-600">
                Drag the slider to see how our AI captured your identity.
              </p>
            </div>
            
            <AnimatePresence>
              {generatedModelUrl && !isGenerating && !error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ duration: 0.5 }}
                  className="flex flex-col sm:flex-row items-center gap-4 mt-8"
                >
                  <button 
                    onClick={reset}
                    className="w-full sm:w-auto px-6 py-3 text-base font-semibold text-gray-700 bg-gray-200 rounded-md cursor-pointer hover:bg-gray-300 transition-colors"
                  >
                    Start Over
                  </button>
                  <button 
                    onClick={() => onModelFinalized(generatedModelUrl)}
                    className="w-full sm:w-auto relative inline-flex items-center justify-center px-8 py-3 text-base font-semibold text-white bg-gray-900 rounded-md cursor-pointer group hover:bg-gray-700 transition-colors"
                  >
                    Proceed to Styling &rarr;
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="md:w-1/2 w-full flex items-center justify-center">
            <div 
              className="relative rounded-[1.25rem] border border-transparent"
            >
              <Compare
                firstImage={userImageUrls[0]}
                secondImage={generatedModelUrl}
                slideMode="drag"
                className="w-[280px] h-[420px] sm:w-[320px] sm:h-[480px] lg:w-[400px] lg:h-[600px] rounded-2xl bg-gray-200 shadow-2xl"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StartScreen;
