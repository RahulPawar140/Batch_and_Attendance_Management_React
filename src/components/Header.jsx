import { Bell, Search, User } from 'lucide-react'

function Header() {
  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 sticky top-0 z-10">
      {/* Search */}
      <div className="relative w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search..."
          className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-transparent rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:bg-white transition-all"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="relative p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        {/* Profile */}
        <div className="flex items-center gap-3 pl-4 border-l border-slate-200">
          <div className="text-right">
            <p className="text-sm font-medium text-slate-800">Rahul Pawar</p>
            <p className="text-xs text-slate-500">Administrator</p>
          </div>
          <div className="w-10 h-10 bg-primary-600 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
