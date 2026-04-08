import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

function Layout() {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <div className="flex-1 flex flex-col ml-64">
        <Header />
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default Layout
