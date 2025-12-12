import { useState } from 'react';
import { gitService } from '@/services/git';
import { useIDEStore } from '@/store/useIDEStore';
import { fileSystem } from '@/services/filesystem';

interface CloneDialogProps {
  onClose: () => void;
}

export function CloneDialog({ onClose }: CloneDialogProps) {
  const [repoUrl, setRepoUrl] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const [progress, setProgress] = useState('');
  const { settings, addRecentProject } = useIDEStore();

  async function handleClone() {
    if (!repoUrl) return;
    if (!settings.githubToken) {
      alert('Please set GitHub token in settings first');
      return;
    }

    setIsCloning(true);
    setProgress('Cloning repository...');

    const result = await gitService.clone(
      repoUrl,
      settings.githubToken,
      (progressInfo) => {
        setProgress(`${progressInfo.phase}: ${progressInfo.loaded}/${progressInfo.total}`);
      }
    );

    if (result.success) {
      const repoName = repoUrl.split('/').pop()?.replace('.git', '') || 'repo';
      const clonedPath = result.data || '/repo'; // Use fallback if data is undefined

      // Add to recent projects with correct path
      addRecentProject({ url: repoUrl, name: repoName, path: clonedPath });

      // Initialize repository to load actual branch and status
      setProgress('Loading repository state...');
      const initResult = await gitService.initializeRepository(clonedPath);

      if (initResult.success) {
        alert(`Repository cloned successfully! Branch: ${initResult.data?.currentBranch}`);

        // Change to the cloned directory
        const changeResult = await fileSystem.changeDirectory(clonedPath);
        if (changeResult.success) {
          console.log(`Changed to cloned directory: ${clonedPath}`);
        }
      } else {
        alert('Repository cloned but failed to initialize state');
      }

      onClose();
      // Reload to refresh file tree and store state
      window.location.reload();
    } else {
      alert('Failed to clone: ' + result.error);
      setProgress('');
    }
    setIsCloning(false);
  }

  return (
    <div
      className="modal-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="modal bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-bold text-gray-100 mb-4">Clone Repository</h2>
        <input
          type="text"
          placeholder="https://github.com/user/repo"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          autoFocus
          className="w-full px-4 py-2 bg-gray-700 text-gray-100 rounded border border-gray-600 focus:border-blue-500 focus:outline-none mb-4"
        />
        {progress && (
          <p className="text-sm text-gray-400 mb-4">{progress}</p>
        )}
        <div className="modal-actions flex gap-2 justify-end">
          <button
            onClick={handleClone}
            disabled={isCloning || !repoUrl}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded font-medium"
          >
            {isCloning ? 'Cloning...' : 'Clone'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-100 rounded font-medium"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
