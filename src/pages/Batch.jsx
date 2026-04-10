import { useEffect, useState } from 'react'
import axios from 'axios'
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Users,
  AlertTriangle,
  Calendar,
  Clock,
  Monitor,
  MapPin,
  Wifi,
  BookOpen,
  GraduationCap
} from 'lucide-react'

const API = 'http://localhost:9998/batches'
const COURSES_API = 'http://localhost:9998/courses'
const MANAGERS_API = 'http://localhost:9998/manager'
const FACULTIES_API = 'http://localhost:9998/faculties'

// Status badge colors
const statusColors = {
  upcoming: 'bg-blue-100 text-blue-700',
  ongoing: 'bg-emerald-100 text-emerald-700',
  completed: 'bg-slate-100 text-slate-600',
  cancelled: 'bg-red-100 text-red-700'
}

// Card header gradient per status
const statusHeaderColors = {
  upcoming: 'bg-blue-600',
  ongoing: 'bg-emerald-600',
  completed: 'bg-slate-500',
  cancelled: 'bg-red-500'
}

// Mode badge colors
const modeColors = {
  online: 'bg-purple-100 text-purple-700',
  offline: 'bg-amber-100 text-amber-700',
  hybrid: 'bg-cyan-100 text-cyan-700'
}

// Category badge colors
const categoryColors = {
  weekday: 'bg-indigo-100 text-indigo-700',
  weekend: 'bg-pink-100 text-pink-700'
}

function Batch() {
  const [batches, setBatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Dropdown data
  const [courses, setCourses] = useState([])
  const [managers, setManagers] = useState([])
  const [faculties, setFaculties] = useState([])

  const [form, setForm] = useState({
    name: '',
    manager_id: '',
    faculty_id: '',
    course_id: '',
    description: '',
    batch_status: 'upcoming',
    batch_category: 'weekday',
    batch_mode: 'online',
    batch_time: '',
    start_date: '',
    end_date: ''
  })
  const [editId, setEditId] = useState(null)

  // Delete confirmation modal
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, batch: null })

  // Filter states
  const [pageSize, setPageSize] = useState(5)
  const [pageIndex, setPageIndex] = useState(1)
  const [sortBy, setSortBy] = useState('id')
  const [sortOrder, setSortOrder] = useState('ASC')
  const [searchText, setSearchText] = useState('')

  // Additional filters
  const [statusFilter, setStatusFilter] = useState('')
  const [modeFilter, setModeFilter] = useState('')

  // Fetch dropdown data
  const fetchDropdownData = async () => {
    try {
      const [coursesRes, managersRes, facultiesRes] = await Promise.all([
        axios.get(`${COURSES_API}/get_course_list`),
        axios.get(`${MANAGERS_API}/get_manager_list`),
        axios.get(`${FACULTIES_API}/get_faculty_list`)
      ])

      const coursesData = coursesRes.data.data || coursesRes.data
      const managersData = managersRes.data.data || managersRes.data
      const facultiesData = facultiesRes.data.data || facultiesRes.data

      setCourses(Array.isArray(coursesData) ? coursesData : [])
      setManagers(Array.isArray(managersData) ? managersData : [])
      setFaculties(Array.isArray(facultiesData) ? facultiesData : [])
    } catch (err) {
      console.error('Failed to fetch dropdown data:', err)
    }
  }

  // GET ALL BATCHES
  const fetchBatches = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API}/get_batch_list`, {
        params: {
          page_size: pageSize,
          page_index: pageIndex,
          sort_by: sortBy,
          sort_order: sortOrder,
          search_text: searchText,
          batch_status: statusFilter || undefined,
          batch_mode: modeFilter || undefined
        },
      })
      const data = res.data.data || res.data
      setBatches(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Fetch error:', err)
      setBatches([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDropdownData()
  }, [])

  useEffect(() => {
    fetchBatches()
  }, [pageIndex, pageSize, sortBy, sortOrder, statusFilter, modeFilter])

  // GET SINGLE BATCH (for edit)
  const handleEdit = async (id) => {
    try {
      const res = await axios.get(`${API}/get_batch/${id}`)
      let data = res.data.data || res.data
      if (Array.isArray(data)) data = data[0]

      setForm({
        name: data.name || '',
        manager_id: data.manager_id || '',
        faculty_id: data.faculty_id || '',
        course_id: data.course_id || '',
        description: data.description || '',
        batch_status: data.batch_status || 'upcoming',
        batch_category: data.batch_category || 'weekday',
        batch_mode: data.batch_mode || 'online',
        batch_time: data.batch_time || '',
        start_date: data.start_date ? data.start_date.split('T')[0] : '',
        end_date: data.end_date ? data.end_date.split('T')[0] : ''
      })
      setEditId(data.id || id)
      setIsModalOpen(true)
    } catch (err) {
      console.error('Edit fetch error:', err)
      alert('Failed to fetch batch details')
    }
  }

  // HANDLE INPUT
  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // CREATE / UPDATE
  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...form,
        manager_id: Number(form.manager_id),
        faculty_id: Number(form.faculty_id),
        course_id: Number(form.course_id)
      }

      if (editId) {
        await axios.put(`${API}/update_batch`, { id: editId, ...payload })
      } else {
        await axios.post(`${API}/create_batch`, payload)
      }
      closeModal()
      fetchBatches()
    } catch (err) {
      console.error('Submit error:', err)
      alert('Failed to save batch')
    }
  }

  // DELETE - Open confirmation modal
  const openDeleteModal = (batch) => {
    setDeleteModal({ isOpen: true, batch })
  }

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, batch: null })
  }

  const confirmDelete = async () => {
    if (!deleteModal.batch) return
    try {
      await axios.delete(`${API}/delete_batch/${deleteModal.batch.id}`)
      closeDeleteModal()
      fetchBatches()
    } catch (err) {
      console.error('Delete error:', err)
      alert('Failed to delete batch')
    }
  }

  // SEARCH
  const handleSearch = () => {
    setPageIndex(1)
    fetchBatches()
  }

  // SORT
  const handleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')
    } else {
      setSortBy(column)
      setSortOrder('ASC')
    }
  }

  // MODAL HANDLERS
  const openCreateModal = () => {
    setForm({
      name: '',
      manager_id: '',
      faculty_id: '',
      course_id: '',
      description: '',
      batch_status: 'upcoming',
      batch_category: 'weekday',
      batch_mode: 'online',
      batch_time: '',
      start_date: '',
      end_date: ''
    })
    setEditId(null)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setForm({
      name: '',
      manager_id: '',
      faculty_id: '',
      course_id: '',
      description: '',
      batch_status: 'upcoming',
      batch_category: 'weekday',
      batch_mode: 'online',
      batch_time: '',
      start_date: '',
      end_date: ''
    })
    setEditId(null)
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }
  return (
    <div className="space-y-6 min-w-0">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-slate-800">Batch Management</h1>
          <p className="text-slate-500 mt-1">Manage your institute batches and schedules</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm shrink-0"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Add Batch</span>
        </button>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-200">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search batches..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
          >
            <option value="">All Status</option>
            <option value="upcoming">Upcoming</option>
            <option value="ongoing">Ongoing</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Mode Filter */}
          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
          >
            <option value="">All Modes</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="hybrid">Hybrid</option>
          </select>

          {/* Page Size */}
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            className="px-4 py-2.5 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
          >
            Search
          </button>
        </div>
      </div>

      {/* Card Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="ml-3 text-slate-500">Loading batches...</span>
        </div>
      ) : batches.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {batches.map((batch) => {
            const headerColor = statusHeaderColors[batch.batch_status] || 'bg-slate-500'
            return (
              <div
                key={batch.id}
                className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow"
              >
                {/* Card Header */}
                <div className={`${headerColor} px-4 pt-4 pb-8 relative`}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-white text-base leading-tight line-clamp-2">
                        {batch.name}
                      </h3>
                      {batch.course_name && (
                        <p className="text-white/80 text-xs mt-1 font-medium truncate">{batch.course_name}</p>
                      )}
                      {batch.manager_name && (
                        <p className="text-white/70 text-xs mt-0.5 truncate">{batch.manager_name}</p>
                      )}
                    </div>
                    <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shrink-0 border-2 border-white/30">
                      <Users className="w-5 h-5 text-white" />
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="px-4 pt-3 pb-3 flex flex-col gap-2 flex-1">
                  {/* Badges */}
                  <div className="flex flex-wrap gap-1.5">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${statusColors[batch.batch_status] || 'bg-slate-100 text-slate-600'}`}>
                      {batch.batch_status || '-'}
                    </span>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium capitalize ${modeColors[batch.batch_mode] || 'bg-slate-100 text-slate-600'}`}>
                      {batch.batch_mode === 'online' && <Wifi className="w-3 h-3" />}
                      {batch.batch_mode === 'offline' && <MapPin className="w-3 h-3" />}
                      {batch.batch_mode === 'hybrid' && <Monitor className="w-3 h-3" />}
                      {batch.batch_mode || '-'}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${categoryColors[batch.batch_category] || 'bg-slate-100 text-slate-600'}`}>
                      {batch.batch_category || '-'}
                    </span>
                  </div>

                  {/* Info rows */}
                  <div className="space-y-1.5 mt-1">
                    {batch.faculty_name && (
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{batch.faculty_name}</span>
                      </div>
                    )}
                    {batch.batch_time && (
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{batch.batch_time}</span>
                      </div>
                    )}
                    {(batch.start_date || batch.end_date) && (
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {formatDate(batch.start_date)} – {formatDate(batch.end_date)}
                        </span>
                      </div>
                    )}
                    {batch.description && (
                      <div className="flex items-start gap-2 text-xs text-slate-500">
                        <BookOpen className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{batch.description}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Footer */}
                <div className="flex items-center justify-end gap-1 px-4 py-2.5 border-t border-slate-100 bg-slate-50">
                  <button
                    onClick={() => handleEdit(batch.id)}
                    className="p-2 text-slate-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    title="Edit batch"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openDeleteModal(batch)}
                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete batch"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 px-6 py-16 text-center">
          <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No batches found</p>
          <p className="text-slate-400 text-sm mt-1">Add your first batch to get started.</p>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between bg-white rounded-xl px-6 py-4 shadow-sm border border-slate-200">
        <p className="text-sm text-slate-600">
          Page {pageIndex} — Showing {batches.length} {batches.length === 1 ? 'batch' : 'batches'}
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setPageIndex(pageIndex - 1)}
            disabled={pageIndex === 1}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Prev
          </button>
          <span className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg">
            {pageIndex}
          </span>
          <button
            onClick={() => setPageIndex(pageIndex + 1)}
            disabled={batches.length < pageSize}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
          ></div>
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-slate-800">
                {editId ? 'Edit Batch' : 'Add New Batch'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Batch Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Batch Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter batch name"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>

              {/* Two Column Layout */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Course */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Course *
                  </label>
                  <select
                    name="course_id"
                    value={form.course_id}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="">Select Course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Manager */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Manager *
                  </label>
                  <select
                    name="manager_id"
                    value={form.manager_id}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="">Select Manager</option>
                    {managers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Faculty */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Faculty *
                  </label>
                  <select
                    name="faculty_id"
                    value={form.faculty_id}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="">Select Faculty</option>
                    {faculties.map((faculty) => (
                      <option key={faculty.id} value={faculty.id}>
                        {faculty.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Status *
                  </label>
                  <select
                    name="batch_status"
                    value={form.batch_status}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Mode */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Mode *
                  </label>
                  <select
                    name="batch_mode"
                    value={form.batch_mode}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="online">Online</option>
                    <option value="offline">Offline</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Category *
                  </label>
                  <select
                    name="batch_category"
                    value={form.batch_category}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="weekday">Weekday</option>
                    <option value="weekend">Weekend</option>
                  </select>
                </div>

                {/* Batch Time */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Batch Time *
                  </label>
                  <input
                    type="text"
                    name="batch_time"
                    value={form.batch_time}
                    onChange={handleChange}
                    required
                    placeholder="e.g., 6:00 PM - 9:00 PM"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    name="start_date"
                    value={form.start_date}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    End Date *
                  </label>
                  <input
                    type="date"
                    name="end_date"
                    value={form.end_date}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Enter batch description"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none"
                />
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {editId ? 'Update Batch' : 'Create Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeDeleteModal}
          ></div>
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 overflow-hidden">
            {/* Modal Content */}
            <div className="p-6 text-center">
              {/* Warning Icon */}
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>

              {/* Title */}
              <h3 className="text-xl font-semibold text-slate-800 mb-2">
                Delete Batch
              </h3>

              {/* Description */}
              <p className="text-slate-500 mb-2">
                Are you sure you want to delete this batch?
              </p>

              {/* Batch Name */}
              <div className="bg-slate-100 rounded-lg px-4 py-3 mb-6">
                <p className="text-sm text-slate-600">Batch Name</p>
                <p className="font-semibold text-slate-800">
                  {deleteModal.batch?.name}
                </p>
              </div>

              {/* Warning Text */}
              <p className="text-sm text-red-500 mb-6">
                This action cannot be undone. All data associated with this batch will be permanently removed.
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={closeDeleteModal}
                  className="px-6 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-6 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Delete Batch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Batch
