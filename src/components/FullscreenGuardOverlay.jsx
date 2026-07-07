const FullscreenGuardOverlay = ({ countdown }) => (
  <div className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-xl flex items-center justify-center">
    <div className="text-center px-6">
      <div className="text-6xl mb-6">🔒</div>
      <h2 className="text-2xl font-bold text-white mb-3">You left the test screen!</h2>
      <p className="text-gray-300 mb-6 text-lg">
        Returning to fullscreen in <span className="text-red-400 font-bold text-2xl">{countdown}</span> seconds or the test will be auto-submitted.
      </p>
      <div className="w-64 h-2 bg-white/10 rounded-full mx-auto overflow-hidden">
        <div
          className="h-full bg-red-500 rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${(countdown / (parseInt(import.meta.env.VITE_FULLSCREEN_TIMEOUT, 10) || 5)) * 100}%` }}
        />
      </div>
    </div>
  </div>
);

export default FullscreenGuardOverlay;
