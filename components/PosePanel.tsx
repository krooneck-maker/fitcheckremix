/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import React from 'react';

interface PosePanelProps {
  onPoseSelect: (poseInstruction: string) => void;
  isLoading: boolean;
}

const POSE_CATEGORIES = [
  {
    name: "Standard",
    options: ["Front view, eye level", "45 degree turn, eye level", "Side profile (90 degrees), eye level", "Back view (180 degrees), eye level"]
  },
  {
    name: "High Angle",
    options: ["Front view, high angle (looking down from above)", "45 degree turn, high angle (looking down from above)", "Side profile (90 degrees), high angle (looking down from above)", "Back view (180 degrees), high angle (looking down from above)"]
  },
  {
    name: "Low Angle",
    options: ["Front view, low angle (looking up from below)", "45 degree turn, low angle (looking up from below)", "Side profile (90 degrees), low angle (looking up from below)", "Back view (180 degrees), low angle (looking up from below)"]
  },
  {
    name: "Special",
    options: ["Bird's eye view (directly above)", "Worm's eye view (directly below)", "Walking towards the camera, mid-stride", "Leaning against a wall, casual pose"]
  }
];

const PosePanel: React.FC<PosePanelProps> = ({ onPoseSelect, isLoading }) => {
  return (
    <div className="mt-auto pt-6 border-t overflow-y-auto max-h-[400px] pr-2 custom-scrollbar">
      <h2 className="text-xl font-serif tracking-wider text-gray-800 mb-4">Change Pose</h2>
      
      <div className="space-y-6">
        {POSE_CATEGORIES.map((category) => (
          <div key={category.name}>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{category.name}</h3>
            <div className="grid grid-cols-2 gap-2">
              {category.options.map((pose) => (
                <button
                  key={pose}
                  onClick={() => onPoseSelect(pose)}
                  disabled={isLoading}
                  className="w-full text-left bg-white border border-gray-200 text-gray-700 font-medium py-2 px-3 rounded-xl transition-all duration-200 ease-in-out hover:bg-gray-50 hover:border-gray-400 active:scale-95 text-[11px] leading-tight disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-100 shadow-sm"
                >
                  {pose.split(',')[0]}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PosePanel;