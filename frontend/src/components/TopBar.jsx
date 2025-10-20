export default function TopBar({
  user,
  hasHubSpot,
  syncStatus,
  syncing,
  onConnectHubSpot,
  onSync,
  onLogout,
}) {

  return (
    <header className="bg-white border-b border-gray-200 px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between">
      <h1 className="text-base sm:text-xl font-semibold text-gray-900 truncate">
        Financial Advisor AI
      </h1>
      <div className="flex items-center gap-1.5 sm:gap-3">
        <span className="hidden md:inline text-sm text-gray-600 truncate max-w-[120px] lg:max-w-[200px]">
          {user.email}
        </span>
        
        {/* HubSpot Status */}
        {hasHubSpot ? (
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            HubSpot
          </div>
        ) : (
          <button
            onClick={onConnectHubSpot}
            className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors flex items-center gap-1"
          >
            <span className="text-sm">🔗</span>
            <span className="hidden sm:inline">HubSpot</span>
          </button>
        )}
        
        <button
          onClick={onSync}
          disabled={syncing}
          className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 sm:py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center gap-1 disabled:opacity-50"
        >
          <span className="text-sm">🔄</span>
          <span className="hidden sm:inline">{syncing ? 'Syncing...' : 'Sync'}</span>
        </button>
        <button
          onClick={onLogout}
          className="hidden lg:block text-sm px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          Logout
        </button>
      </div>
    </header>
  );
}

