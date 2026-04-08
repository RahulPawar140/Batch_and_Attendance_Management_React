import { Building2, Users, GraduationCap, CalendarCheck } from 'lucide-react'

const stats = [
  { name: 'Total Branches', value: '12', icon: Building2, color: 'bg-blue-500' },
  { name: 'Active Batches', value: '48', icon: Users, color: 'bg-emerald-500' },
  { name: 'Total Students', value: '1,247', icon: GraduationCap, color: 'bg-violet-500' },
  { name: 'Attendance Today', value: '89%', icon: CalendarCheck, color: 'bg-amber-500' },
]

function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 mt-1">Welcome back! Here is an overview of your institute.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 font-medium">{stat.name}</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">{stat.value}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-lg`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center gap-2 p-4 rounded-lg bg-slate-50 hover:bg-primary-50 hover:text-primary-600 transition-colors group">
            <Building2 className="w-8 h-8 text-slate-400 group-hover:text-primary-500" />
            <span className="text-sm font-medium">Add Branch</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 rounded-lg bg-slate-50 hover:bg-primary-50 hover:text-primary-600 transition-colors group">
            <Users className="w-8 h-8 text-slate-400 group-hover:text-primary-500" />
            <span className="text-sm font-medium">Create Batch</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 rounded-lg bg-slate-50 hover:bg-primary-50 hover:text-primary-600 transition-colors group">
            <GraduationCap className="w-8 h-8 text-slate-400 group-hover:text-primary-500" />
            <span className="text-sm font-medium">Add Student</span>
          </button>
          <button className="flex flex-col items-center gap-2 p-4 rounded-lg bg-slate-50 hover:bg-primary-50 hover:text-primary-600 transition-colors group">
            <CalendarCheck className="w-8 h-8 text-slate-400 group-hover:text-primary-500" />
            <span className="text-sm font-medium">Mark Attendance</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
