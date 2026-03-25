/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StartScreen from './components/StartScreen';
import Canvas from './components/Canvas';
import WardrobePanel from './components/WardrobeModal';
import OutfitStack from './components/OutfitStack';
import { generateVirtualTryOnImage, generatePoseVariation } from './services/geminiService';
import { OutfitLayer, WardrobeItem, SavedOutfit } from './types';
import { ChevronDownIcon, ChevronUpIcon, HeartIcon } from './components/icons';
import { defaultWardrobe } from './wardrobe';
import Footer from './components/Footer';
import { getFriendlyErrorMessage } from './lib/utils';
import Spinner from './components/Spinner';
import PhotoshootModal from './components/PhotoshootModal';

const POSE_INSTRUCTIONS = [
  // --- EYE LEVEL ROTATIONS (0-7) ---
  "Front view, eye level",
  "45 degree turn, eye level",
  "Side profile (90 degrees), eye level",
  "135 degree turn (back-side), eye level",
  "Back view (180 degrees), eye level",
  "225 degree turn (back-side other way), eye level",
  "Side profile (270 degrees), eye level",
  "315 degree turn, eye level",

  // --- HIGH ANGLE ROTATIONS (Looking down from above) (8-15) ---
  "Front view, high angle (looking down from above)",
  "45 degree turn, high angle (looking down from above)",
  "Side profile (90 degrees), high angle (looking down from above)",
  "135 degree turn (back-side), high angle (looking down from above)",
  "Back view (180 degrees), high angle (looking down from above)",
  "225 degree turn (back-side other way), high angle (looking down from above)",
  "Side profile (270 degrees), high angle (looking down from above)",
  "315 degree turn, high angle (looking down from above)",

  // --- LOW ANGLE ROTATIONS (Looking up from below) (16-23) ---
  "Front view, low angle (looking up from below)",
  "45 degree turn, low angle (looking up from below)",
  "Side profile (90 degrees), low angle (looking up from below)",
  "135 degree turn (back-side), low angle (looking up from below)",
  "Back view (180 degrees), low angle (looking up from below)",
  "225 degree turn (back-side other way), low angle (looking up from below)",
  "Side profile (270 degrees), low angle (looking up from below)",
  "315 degree turn, low angle (looking up from below)",

  // --- BIRD'S EYE VIEW (Directly above) (24-31) ---
  "Front view, bird's eye view (directly above)",
  "45 degree turn, bird's eye view (directly above)",
  "Side profile (90 degrees), bird's eye view (directly above)",
  "135 degree turn (back-side), bird's eye view (directly above)",
  "Back view (180 degrees), bird's eye view (directly above)",
  "225 degree turn (back-side other way), bird's eye view (directly above)",
  "Side profile (270 degrees), bird's eye view (directly above)",
  "315 degree turn, bird's eye view (directly above)",

  // --- WORM'S EYE VIEW (Directly below) (32-39) ---
  "Front view, worm's eye view (directly below)",
  "45 degree turn, worm's eye view (directly below)",
  "Side profile (90 degrees), worm's eye view (directly below)",
  "135 degree turn (back-side), worm's eye view (directly below)",
  "Back view (180 degrees), worm's eye view (directly below)",
  "225 degree turn (back-side other way), worm's eye view (directly below)",
  "Side profile (270 degrees), worm's eye view (directly below)",
  "315 degree turn, worm's eye view (directly below)",

  // --- CLOSE UPS (40-47) ---
  "Close-up of the head and shoulders, front view",
  "Close-up of the torso and chest, front view",
  "Close-up of the waist and hips, front view",
  "Close-up of the legs and feet, front view",
  "Close-up of the shoes, side view",
  "Close-up of the back details, back view",
  "Close-up of the sleeve and arm, side view",
  "Close-up of the neckline and collar, front view",

  // --- DYNAMIC POSES (48-63) ---
  "Walking towards the camera, mid-stride",
  "Walking away from the camera, mid-stride",
  "Running, dynamic action shot",
  "Jumping in the air, mid-action shot",
  "Sitting on a stool, relaxed pose",
  "Leaning against a wall, casual pose",
  "Hands in pockets, confident stance",
  "Adjusting glasses/hair, candid shot",
  "Looking over the shoulder, mysterious look",
  "Squatting down, urban streetwear pose",
  "Dancing, expressive movement",
  "Stretching, athletic pose",
  "Holding a bag/accessory, lifestyle shot",
  "Checking a watch/phone, modern pose",
  "Laughing, natural expression",
  "Serious fashion model stare",

  // --- ADDITIONAL ANGLES (64-79) ---
  "Dutch angle (tilted), front view",
  "Extreme wide shot, showing full environment",
  "Medium shot, from waist up",
  "Full body shot, from a distance",
  "Three-quarter view (45 degrees), eye level",
  "Three-quarter view (135 degrees), eye level",
  "Three-quarter view (225 degrees), eye level",
  "Three-quarter view (315 degrees), eye level",
  "Top-down flat lay perspective",
  "Ground level shot, looking straight ahead",
  "Over-the-shoulder shot",
  "Point-of-view (POV) shot",
  "Silhouette against a bright light",
  "Backlit, glowing edges",
  "Soft focus background, bokeh effect",
  "High contrast, dramatic lighting",

  // --- MORE VERTICAL VARIATIONS (80-100) ---
  "Front view, slightly above eye level",
  "Front view, slightly below eye level",
  "Side view, slightly above eye level",
  "Side view, slightly below eye level",
  "Back view, slightly above eye level",
  "Back view, slightly below eye level",
  "45 degree turn, extreme high angle",
  "45 degree turn, extreme low angle",
  "90 degree turn, extreme high angle",
  "90 degree turn, extreme low angle",
  "135 degree turn, extreme high angle",
  "135 degree turn, extreme low angle",
  "180 degree turn, extreme high angle",
  "180 degree turn, extreme low angle",
  "225 degree turn, extreme high angle",
  "225 degree turn, extreme low angle",
  "270 degree turn, extreme high angle",
  "270 degree turn, extreme low angle",
  "315 degree turn, extreme high angle",
  "315 degree turn, extreme low angle",
  "Full 360 degree panoramic view"
];

const ROTATION_INDICES = [0, 1, 2, 3, 4, 5, 6, 7];

const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);

  useEffect(() => {
    const mediaQueryList = window.matchMedia(query);
    const listener = (event: MediaQueryListEvent) => setMatches(event.matches);

    // DEPRECATED: mediaQueryList.addListener(listener);
    mediaQueryList.addEventListener('change', listener);
    
    // Check again on mount in case it changed between initial state and effect runs
    if (mediaQueryList.matches !== matches) {
      setMatches(mediaQueryList.matches);
    }

    return () => {
      // DEPRECATED: mediaQueryList.removeListener(listener);
      mediaQueryList.removeEventListener('change', listener);
    };
  }, [query, matches]);

  return matches;
};


const App: React.FC = () => {
  const [modelImageUrl, setModelImageUrl] = useState<string | null>(null);
  const [outfitHistory, setOutfitHistory] = useState<OutfitLayer[]>([]);
  const [currentOutfitIndex, setCurrentOutfitIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [currentPoseIndex, setCurrentPoseIndex] = useState(0);
  const [isSheetCollapsed, setIsSheetCollapsed] = useState(false);
  const [wardrobe, setWardrobe] = useState<WardrobeItem[]>(defaultWardrobe);
  const [savedOutfits, setSavedOutfits] = useState<SavedOutfit[]>([]);
  const [isPhotoshootOpen, setIsPhotoshootOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 767px)');

  const activeOutfitLayers = useMemo(() => 
    outfitHistory.slice(0, currentOutfitIndex + 1), 
    [outfitHistory, currentOutfitIndex]
  );
  
  const activeGarmentIds = useMemo(() => 
    activeOutfitLayers.map(layer => layer.garment?.id).filter(Boolean) as string[], 
    [activeOutfitLayers]
  );
  
  const displayImageUrl = useMemo(() => {
    if (outfitHistory.length === 0) return modelImageUrl;
    const currentLayer = outfitHistory[currentOutfitIndex];
    if (!currentLayer) return modelImageUrl;

    const poseInstruction = POSE_INSTRUCTIONS[currentPoseIndex];
    // Return the image for the current pose, or fallback to the first available image for the current layer.
    // This ensures an image is shown even while a new pose is generating.
    return currentLayer.poseImages[poseInstruction] ?? Object.values(currentLayer.poseImages)[0];
  }, [outfitHistory, currentOutfitIndex, currentPoseIndex, modelImageUrl]);

  const availablePoseKeys = useMemo(() => {
    if (outfitHistory.length === 0) return [];
    const currentLayer = outfitHistory[currentOutfitIndex];
    return currentLayer ? Object.keys(currentLayer.poseImages) : [];
  }, [outfitHistory, currentOutfitIndex]);

  const handleModelFinalized = (url: string) => {
    setModelImageUrl(url);
    setOutfitHistory([{
      garment: null,
      poseImages: { [POSE_INSTRUCTIONS[0]]: url }
    }]);
    setCurrentOutfitIndex(0);
  };

  const handleStartOver = () => {
    setModelImageUrl(null);
    setOutfitHistory([]);
    setCurrentOutfitIndex(0);
    setIsLoading(false);
    setLoadingMessage('');
    setError(null);
    setCurrentPoseIndex(0);
    setIsSheetCollapsed(false);
    setWardrobe(defaultWardrobe);
  };

  const handleGarmentSelect = useCallback(async (garmentFile: File, garmentInfo: WardrobeItem) => {
    if (!displayImageUrl || isLoading) return;

    // Caching: Check if we are re-applying a previously generated layer
    const nextLayer = outfitHistory[currentOutfitIndex + 1];
    if (nextLayer && nextLayer.garment?.id === garmentInfo.id) {
        setCurrentOutfitIndex(prev => prev + 1);
        setCurrentPoseIndex(0); // Reset pose when changing layer
        return;
    }

    setError(null);
    setIsLoading(true);
    setLoadingMessage(`Adding ${garmentInfo.name}...`);

    try {
      const newImageUrl = await generateVirtualTryOnImage(displayImageUrl, garmentFile);
      const currentPoseInstruction = POSE_INSTRUCTIONS[currentPoseIndex];
      
      const newLayer: OutfitLayer = { 
        garment: garmentInfo, 
        poseImages: { [currentPoseInstruction]: newImageUrl } 
      };

      setOutfitHistory(prevHistory => {
        // Cut the history at the current point before adding the new layer
        const newHistory = prevHistory.slice(0, currentOutfitIndex + 1);
        return [...newHistory, newLayer];
      });
      setCurrentOutfitIndex(prev => prev + 1);
      
      // Add to personal wardrobe if it's not already there
      setWardrobe(prev => {
        if (prev.find(item => item.id === garmentInfo.id)) {
            return prev;
        }
        return [...prev, garmentInfo];
      });
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Failed to apply garment'));
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [displayImageUrl, isLoading, currentPoseIndex, outfitHistory, currentOutfitIndex]);

  const handleRemoveLastGarment = () => {
    if (currentOutfitIndex > 0) {
      setCurrentOutfitIndex(prevIndex => prevIndex - 1);
      setCurrentPoseIndex(0); // Reset pose to default when removing a layer
    }
  };
  
  const handlePoseSelect = useCallback(async (newIndex: number) => {
    if (isLoading || outfitHistory.length === 0 || newIndex === currentPoseIndex) return;
    
    const poseInstruction = POSE_INSTRUCTIONS[newIndex];
    if (!poseInstruction) return;

    const currentLayer = outfitHistory[currentOutfitIndex];

    // If pose already exists, just update the index to show it.
    if (currentLayer.poseImages[poseInstruction]) {
      setCurrentPoseIndex(newIndex);
      return;
    }

    // Pose doesn't exist, so generate it.
    // Use an existing image from the current layer as the base.
    const baseImageForPoseChange = Object.values(currentLayer.poseImages)[0];
    if (!baseImageForPoseChange) return; // Should not happen

    setError(null);
    setIsLoading(true);
    setLoadingMessage(`Changing pose...`);
    
    const prevPoseIndex = currentPoseIndex;
    // Optimistically update the pose index so the pose name changes in the UI
    setCurrentPoseIndex(newIndex);

    try {
      const newImageUrl = await generatePoseVariation(baseImageForPoseChange as string, poseInstruction as string);
      setOutfitHistory(prevHistory => {
        const newHistory = [...prevHistory];
        const updatedLayer = newHistory[currentOutfitIndex];
        updatedLayer.poseImages[poseInstruction] = newImageUrl;
        return newHistory;
      });
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Failed to change pose'));
      // Revert pose index on failure
      setCurrentPoseIndex(prevPoseIndex);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [currentPoseIndex, outfitHistory, isLoading, currentOutfitIndex]);

  const handleGenerate360 = useCallback(async () => {
    if (isLoading || outfitHistory.length === 0) return;
    
    const currentLayer = outfitHistory[currentOutfitIndex];
    const baseImage = Object.values(currentLayer.poseImages)[0];
    if (!baseImage) return;

    setIsLoading(true);
    setError(null);

    try {
      for (const index of ROTATION_INDICES) {
        const pose = POSE_INSTRUCTIONS[index];
        if (!pose) continue;
        
        if (!currentLayer.poseImages[pose]) {
          setLoadingMessage(`Generating 360 view: ${pose}...`);
          const newImageUrl = await generatePoseVariation(baseImage as string, pose as string);
          setOutfitHistory(prevHistory => {
            const newHistory = [...prevHistory];
            const updatedLayer = newHistory[currentOutfitIndex];
            updatedLayer.poseImages[pose] = newImageUrl;
            return newHistory;
          });
        }
      }
    } catch (err) {
      setError(getFriendlyErrorMessage(err, 'Failed to generate 360 spin'));
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  }, [isLoading, outfitHistory, currentOutfitIndex]);

  const handleSaveOutfit = useCallback(() => {
    if (outfitHistory.length === 0) return;
    
    const currentLayer = outfitHistory[currentOutfitIndex];
    const thumb = Object.values(currentLayer.poseImages)[0] as string;
    if (!thumb) return;
    
    const newSavedOutfit: SavedOutfit = {
      id: Math.random().toString(36).substr(2, 9),
      name: `Outfit ${savedOutfits.length + 1}`,
      layers: [...outfitHistory.slice(0, currentOutfitIndex + 1)],
      thumbnailUrl: thumb,
      createdAt: Date.now()
    };
    
    setSavedOutfits(prev => [newSavedOutfit, ...prev]);
    // Show some feedback? Maybe a toast if I had one.
  }, [outfitHistory, currentOutfitIndex, savedOutfits.length]);

  const handleOpenPhotoshoot = () => {
    setIsPhotoshootOpen(true);
  };

  const viewVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -15 },
  };

  return (
    <div className="font-sans">
      <AnimatePresence mode="wait">
        {!modelImageUrl ? (
          <motion.div
            key="start-screen"
            className="w-screen min-h-screen flex items-start sm:items-center justify-center bg-gray-50 p-4 pb-20"
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <StartScreen onModelFinalized={handleModelFinalized} />
          </motion.div>
        ) : (
          <motion.div
            key="main-app"
            className="relative flex flex-col h-screen bg-white overflow-hidden"
            variants={viewVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <main className="flex-grow relative flex flex-col md:flex-row overflow-hidden">
              <div className="w-full h-full flex-grow flex items-center justify-center bg-white pb-16 relative">
                <Canvas 
                  displayImageUrl={displayImageUrl}
                  onStartOver={handleStartOver}
                  isLoading={isLoading}
                  loadingMessage={loadingMessage}
                  onSelectPose={handlePoseSelect}
                  poseInstructions={POSE_INSTRUCTIONS}
                  currentPoseIndex={currentPoseIndex}
                  availablePoseKeys={availablePoseKeys}
                  onGenerate360={handleGenerate360}
                  rotationIndices={ROTATION_INDICES}
                  onSaveOutfit={handleSaveOutfit}
                  onOpenPhotoshoot={handleOpenPhotoshoot}
                  isSaved={savedOutfits.some(o => JSON.stringify(o.layers) === JSON.stringify(outfitHistory.slice(0, currentOutfitIndex + 1)))}
                />
              </div>

              {/* Photoshoot Modal */}
              <AnimatePresence>
                {isPhotoshootOpen && displayImageUrl && (
                  <PhotoshootModal 
                    isOpen={isPhotoshootOpen}
                    onClose={() => setIsPhotoshootOpen(false)}
                    baseImageUrl={displayImageUrl}
                    outfitName={savedOutfits[0]?.name || "My Outfit"}
                  />
                )}
              </AnimatePresence>

              <aside 
                className={`absolute md:relative md:flex-shrink-0 bottom-0 right-0 h-auto md:h-full w-full md:w-1/3 md:max-w-sm bg-white/80 backdrop-blur-md flex flex-col border-t md:border-t-0 md:border-l border-gray-200/60 transition-transform duration-500 ease-in-out ${isSheetCollapsed ? 'translate-y-[calc(100%-4.5rem)]' : 'translate-y-0'} md:translate-y-0`}
                style={{ transitionProperty: 'transform' }}
              >
                  <button 
                    onClick={() => setIsSheetCollapsed(!isSheetCollapsed)} 
                    className="md:hidden w-full h-8 flex items-center justify-center bg-gray-100/50"
                    aria-label={isSheetCollapsed ? 'Expand panel' : 'Collapse panel'}
                  >
                    {isSheetCollapsed ? <ChevronUpIcon className="w-6 h-6 text-gray-500" /> : <ChevronDownIcon className="w-6 h-6 text-gray-500" />}
                  </button>
                  <div className="p-4 md:p-6 pb-20 overflow-y-auto flex-grow flex flex-col gap-8">
                    {error && (
                      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-md" role="alert">
                        <p className="font-bold">Error</p>
                        <p>{error}</p>
                      </div>
                    )}
                    <OutfitStack 
                      outfitHistory={activeOutfitLayers}
                      onRemoveLastGarment={handleRemoveLastGarment}
                    />
                    <WardrobePanel
                      onGarmentSelect={handleGarmentSelect}
                      activeGarmentIds={activeGarmentIds}
                      isLoading={isLoading}
                      wardrobe={wardrobe}
                    />
                  </div>
              </aside>
            </main>
            <AnimatePresence>
              {isLoading && isMobile && (
                <motion.div
                  className="fixed inset-0 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center z-50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <Spinner />
                  {loadingMessage && (
                    <p className="text-lg font-serif text-gray-700 mt-4 text-center px-4">{loadingMessage}</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
      <Footer isOnDressingScreen={!!modelImageUrl} />
    </div>
  );
};

export default App;