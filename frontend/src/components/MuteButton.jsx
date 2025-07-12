import { useTTS } from '@/contexts/TTSContext';
import { Volume2, VolumeX } from 'lucide-react';

function MuteButton() {
  const { isMuted, toggleMute } = useTTS();

  return (
    <button
      onClick={toggleMute}
      className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700"
      title={isMuted ? 'Unmute' : 'Mute'}
    >
      {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
    </button>
  );
}

export default MuteButton;
