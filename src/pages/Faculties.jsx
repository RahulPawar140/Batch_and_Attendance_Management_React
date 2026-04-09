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
  GraduationCap,
  ArrowUpDown,
  AlertTriangle,
  Phone,
  Mail,
  Clock,
  Calendar,
  ChevronDown
} from 'lucide-react'

const API = 'http://localhost:9998/faculties'

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function Faculties() {
  const [faculties, setFaculties] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    mobile: '',
    email: '',
    availability_of_days: [],
    availability_of_time_in_range: [{ start: '', end: '' }],
    remarks: '',
  })
  const [editId, setEditId] = useState(null)
  const [formErrors, setFormErrors] = useState({})
  const [showDaysDropdown, setShowDaysDropdown] = useState(false)

  // Delete confirmation modal
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, faculty: null })

  // Filter states
  const [pageSize, setPageSize] = useState(5)
  const [pageIndex, setPageIndex] = useState(1)
  const [sortBy, setSortBy] = useState('id')
  const [sortOrder, setSortOrder] = useState('ASC')
  const [searchText, setSearchText] = useState('')

  // GET ALL FACULTIES
  const fetchFaculties = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API}/get_faculty_list`, {
        params: {
          page_size: pageSize,
          page_index: pageIndex,
          sort_by: sortBy,
          sort_order: sortOrder,
          search_text: searchText,
        },
      })
      const data = res.data.data || res.data
      setFaculties(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Fetch error:', err)
      setFaculties([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFaculties()
  }, [pageIndex, pageSize, sortBy, sortOrder])

  // Validate form
  const validateForm = () => {
    const errors = {}
    if (!form.first_name.trim()) errors.first_name = 'First name is required'
    if (!form.last_name.trim()) errors.last_name = 'Last name is required'
    if (!form.mobile.trim()) {
      errors.mobile = 'Mobile number is required'
    } else if (!/^[0-9]{10}$/.test(form.mobile)) {
      errors.mobile = 'Enter a valid 10-digit mobile number'
    }
    if (!form.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      errors.email = 'Enter a valid email address'
    }
    if (form.availability_of_days.length === 0) {
      errors.availability_of_days = 'Select at least one day'
    }
    // Validate time ranges
    const hasValidTimeRange = form.availability_of_time_in_range.some(
      (range) => range.start && range.end
    )
    if (!hasValidTimeRange) {
      errors.availability_of_time_in_range = 'Add at least one valid time range'
    }
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // GET SINGLE FACULTY (for edit)
  const handleEdit = async (id) => {
    try {
      const res = await axios.get(`${API}/get_faculty/${id}`)
      let data = res.data.data || res.data
      if (Array.isArray(data)) data = data[0]

      // Parse availability data
      let availabilityDays = data.availability_of_days || []
      let availabilityTime = data.availability_of_time_in_range || [{ start: '', end: '' }]

      // Handle string JSON
      if (typeof availabilityDays === 'string') {
        try {
          availabilityDays = JSON.parse(availabilityDays)
        } catch {
          availabilityDays = []
        }
      }
      if (typeof availabilityTime === 'string') {
        try {
          availabilityTime = JSON.parse(availabilityTime)
        } catch {
          availabilityTime = [{ start: '', end: '' }]
        }
      }

      setForm({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        mobile: data.mobile || '',
        email: data.email || '',
        availability_of_days: Array.isArray(availabilityDays) ? availabilityDays : [],
        availability_of_time_in_range: Array.isArray(availabilityTime) && availabilityTime.length > 0
          ? availabilityTime
          : [{ start: '', end: '' }],
        remarks: data.remarks || '',
      })
      setEditId(data.id || id)
      setFormErrors({})
      setIsModalOpen(true)
    } catch (err) {
      console.error('Edit fetch error:', err)
      alert('Failed to fetch faculty details')
    }
  }

  // HANDLE INPUT
  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' })
    }
  }

  // Handle day selection
  const toggleDay = (day) => {
    const newDays = form.availability_of_days.includes(day)
      ? form.availability_of_days.filter((d) => d !== day)
      : [...form.availability_of_days, day]
    setForm({ ...form, availability_of_days: newDays })
    if (formErrors.availability_of_days) {
      setFormErrors({ ...formErrors, availability_of_days: '' })
    }
  }

  // Handle time range changes
  const handleTimeRangeChange = (index, field, value) => {
    const newRanges = [...form.availability_of_time_in_range]
    newRanges[index] = { ...newRanges[index], [field]: value }
    setForm({ ...form, availability_of_time_in_range: newRanges })
    if (formErrors.availability_of_time_in_range) {
      setFormErrors({ ...formErrors, availability_of_time_in_range: '' })
    }
  }

  // Add time range
  const addTimeRange = () => {
    setForm({
      ...form,
      availability_of_time_in_range: [...form.availability_of_time_in_range, { start: '', end: '' }],
    })
  }

  // Remove time range
  const removeTimeRange = (index) => {
    if (form.availability_of_time_in_range.length > 1) {
      const newRanges = form.availability_of_time_in_range.filter((_, i) => i !== index)
      setForm({ ...form, availability_of_time_in_range: newRanges })
    }
  }

  // CREATE / UPDATE
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      // Filter out empty time ranges
      const validTimeRanges = form.availability_of_time_in_range.filter(
        (range) => range.start && range.end
      )

      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        mobile: form.mobile,
        email: form.email,
        availability_of_days: form.availability_of_days,
        availability_of_time_in_range: validTimeRanges,
        remarks: form.remarks,
      }

      if (editId) {
        await axios.put(`${API}/update_faculty`, { id: editId, ...payload })
      } else {
        await axios.post(`${API}/create_faculty`, payload)
      }
      closeModal()
      fetchFaculties()
    } catch (err) {
      console.error('Submit error:', err)
      alert('Failed to save faculty')
    }
  }

  // DELETE - Open confirmation modal
  const openDeleteModal = (faculty) => {
    setDeleteModal({ isOpen: true, faculty })
  }

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, faculty: null })
  }

  const confirmDelete = async () => {
    if (!deleteModal.faculty) return
    try {
      await axios.delete(`${API}/delete_faculty/${deleteModal.faculty.id}`)
      closeDeleteModal()
      fetchFaculties()
    } catch (err) {
      console.error('Delete error:', err)
      alert('Failed to delete faculty')
    }
  }

  // SEARCH
  const handleSearch = () => {
    setPageIndex(1)
    fetchFaculties()
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
      first_name: '',
      last_name: '',
      mobile: '',
      email: '',
      availability_of_days: [],
      availability_of_time_in_range: [{ start: '', end: '' }],
      remarks: '',
    })
    setEditId(null)
    setFormErrors({})
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setForm({
      first_name: '',
      last_name: '',
      mobile: '',
      email: '',
      availability_of_days: [],
      availability_of_time_in_range: [{ start: '', end: '' }],
      remarks: '',
    })
    setEditId(null)
    setFormErrors({})
    setShowDaysDropdown(false)
  }

  // Format availability for display
  const formatAvailability = (days, timeRanges) => {
    let daysArray = days
    let timeArray = timeRanges

    if (typeof days === 'string') {
      try {
        daysArray = JSON.parse(days)
      } catch {
        daysArray = []
      }
    }
    if (typeof timeRanges === 'string') {
      try {
        timeArray = JSON.parse(timeRanges)
      } catch {
        timeArray = []
      }
    }

    return {
      days: Array.isArray(daysArray) ? daysArray : [],
      times: Array.isArray(timeArray) ? timeArray : [],
    }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Faculty Management</h1>
          <p className="text-slate-500 mt-1">Manage your institute faculties</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Add Faculty</span>
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
              placeholder="Search faculties..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
          </div>

          {/* Page Size */}
          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500"
          >
            <option value={5}>5 per page</option>
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
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

      {/* Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th
                  onClick={() => handleSort('first_name')}
                  className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Faculty
                    <ArrowUpDown className={`w-4 h-4 ${sortBy === 'first_name' ? 'text-primary-600' : 'text-slate-400'}`} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('email')}
                  className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Contact
                    <ArrowUpDown className={`w-4 h-4 ${sortBy === 'email' ? 'text-primary-600' : 'text-slate-400'}`} />
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Availability
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Remarks
                </th>
                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                      Loading...
                    </div>
                  </td>
                </tr>
              ) : faculties.length > 0 ? (
                faculties.map((faculty) => {
                  const availability = formatAvailability(
                    faculty.availability_of_days,
                    faculty.availability_of_time_in_range
                  )
                  return (
                    <tr key={faculty.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-indigo-600" />
                          </div>
                          <div>
                            <span className="text-sm font-medium text-slate-800 block">
                              {faculty.first_name} {faculty.last_name}
                            </span>
                            <span className="text-xs text-slate-500">ID: {faculty.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Mail className="w-4 h-4 text-slate-400" />
                            {faculty.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone className="w-4 h-4 text-slate-400" />
                            {faculty.mobile}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          {availability.days.length > 0 && (
                            <div className="flex items-start gap-2">
                              <Calendar className="w-4 h-4 text-slate-400 mt-0.5" />
                              <div className="flex flex-wrap gap-1">
                                {availability.days.map((day) => (
                                  <span
                                    key={day}
                                    className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full"
                                  >
                                    {day.slice(0, 3)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                          {availability.times.length > 0 && (
                            <div className="flex items-start gap-2">
                              <Clock className="w-4 h-4 text-slate-400 mt-0.5" />
                              <div className="flex flex-wrap gap-1">
                                {availability.times.map((time, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full"
                                  >
                                    {time.start} - {time.end}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-500 max-w-xs truncate">
                        {faculty.remarks || '-'}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleEdit(faculty.id)}
                            className="p-2 text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(faculty)}
                            className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-slate-500">
                    No faculties found. Add your first faculty!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
          <p className="text-sm text-slate-600">
            Page {pageIndex} - Showing {faculties.length} faculties
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
              disabled={faculties.length < pageSize}
              className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
          ></div>
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-slate-800">
                {editId ? 'Edit Faculty' : 'Add New Faculty'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    First Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    placeholder="Enter first name"
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-1 ${
                      formErrors.first_name
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-slate-200 focus:border-primary-500 focus:ring-primary-500'
                    }`}
                  />
                  {formErrors.first_name && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.first_name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Last Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    placeholder="Enter last name"
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-1 ${
                      formErrors.last_name
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-slate-200 focus:border-primary-500 focus:ring-primary-500'
                    }`}
                  />
                  {formErrors.last_name && (
                    <p className="mt-1 text-xs text-red-500">{formErrors.last_name}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="mobile"
                  value={form.mobile}
                  onChange={handleChange}
                  placeholder="Enter 10-digit mobile number"
                  maxLength={10}
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-1 ${
                    formErrors.mobile
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-slate-200 focus:border-primary-500 focus:ring-primary-500'
                  }`}
                />
                {formErrors.mobile && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.mobile}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-1 ${
                    formErrors.email
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-slate-200 focus:border-primary-500 focus:ring-primary-500'
                  }`}
                />
                {formErrors.email && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.email}</p>
                )}
              </div>

              {/* Availability Days */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Available Days <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowDaysDropdown(!showDaysDropdown)}
                    className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-1 text-left flex items-center justify-between ${
                      formErrors.availability_of_days
                        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                        : 'border-slate-200 focus:border-primary-500 focus:ring-primary-500'
                    }`}
                  >
                    <span className={form.availability_of_days.length > 0 ? 'text-slate-800' : 'text-slate-400'}>
                      {form.availability_of_days.length > 0
                        ? form.availability_of_days.join(', ')
                        : 'Select available days'}
                    </span>
                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showDaysDropdown ? 'rotate-180' : ''}`} />
                  </button>
                  {showDaysDropdown && (
                    <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {DAYS_OF_WEEK.map((day) => (
                        <label
                          key={day}
                          className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={form.availability_of_days.includes(day)}
                            onChange={() => toggleDay(day)}
                            className="w-4 h-4 text-primary-600 border-slate-300 rounded focus:ring-primary-500"
                          />
                          <span className="text-sm text-slate-700">{day}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                {formErrors.availability_of_days && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.availability_of_days}</p>
                )}
              </div>

              {/* Availability Time Ranges */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Available Time Slots <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {form.availability_of_time_in_range.map((range, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <input
                        type="time"
                        value={range.start}
                        onChange={(e) => handleTimeRangeChange(index, 'start', e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                      />
                      <span className="text-slate-400">to</span>
                      <input
                        type="time"
                        value={range.end}
                        onChange={(e) => handleTimeRangeChange(index, 'end', e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                      />
                      {form.availability_of_time_in_range.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTimeRange(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addTimeRange}
                  className="mt-2 text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  + Add another time slot
                </button>
                {formErrors.availability_of_time_in_range && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.availability_of_time_in_range}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Remarks
                </label>
                <textarea
                  name="remarks"
                  value={form.remarks}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Enter any remarks"
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
                  {editId ? 'Update Faculty' : 'Create Faculty'}
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
                Delete Faculty
              </h3>

              {/* Description */}
              <p className="text-slate-500 mb-2">
                Are you sure you want to delete this faculty?
              </p>

              {/* Faculty Name */}
              <div className="bg-slate-100 rounded-lg px-4 py-3 mb-6">
                <p className="text-sm text-slate-600">Faculty Name</p>
                <p className="font-semibold text-slate-800">
                  {deleteModal.faculty?.first_name} {deleteModal.faculty?.last_name}
                </p>
              </div>

              {/* Warning Text */}
              <p className="text-sm text-red-500 mb-6">
                This action cannot be undone. All data associated with this faculty will be permanently removed.
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
                  Delete Faculty
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Faculties
