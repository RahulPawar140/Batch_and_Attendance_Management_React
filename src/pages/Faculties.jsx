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
  Calendar
} from 'lucide-react'

const API = 'http://localhost:9998/faculties'

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

// Convert 24-hour time to 12-hour AM/PM format
const convertTo12HourFormat = (time24) => {
  if (!time24) return ''
  const [hours, minutes] = time24.split(':')
  let hour = parseInt(hours, 10)
  const minute = minutes || '00'
  const ampm = hour >= 12 ? 'P.M.' : 'A.M.'
  if (hour > 12) hour -= 12
  if (hour === 0) hour = 12
  return `${hour.toString().padStart(2, '0')}:${minute} ${ampm}`
}

function Faculties() {
  const [faculties, setFaculties] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    mobile: '',
    email: '',
    availability: {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: [],
    },
  })
  const [editId, setEditId] = useState(null)
  const [formErrors, setFormErrors] = useState({})

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
    
    // Check if at least one day has a time slot
    const hasAnySlot = Object.values(form.availability).some(
      (slots) => slots.length > 0 && slots.some((slot) => slot.start && slot.end)
    )
    if (!hasAnySlot) {
      errors.availability = 'Add at least one time slot for any day'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Convert 24-hour time to 12-hour AM/PM format for API
  const convertTo12HourFormatApi = (time24) => {
    if (!time24) return ''
    const [hours, minutes] = time24.split(':')
    let hour = parseInt(hours, 10)
    const minute = minutes || '00'
    const ampm = hour >= 12 ? 'PM' : 'AM'
    if (hour > 12) hour -= 12
    if (hour === 0) hour = 12
    return `${hour.toString().padStart(2, '0')}:${minute} ${ampm}`
  }

  // Convert 12-hour AM/PM format to 24-hour time for input
  const convertTo24HourFormat = (time12) => {
    if (!time12) return ''
    const match = time12.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
    if (!match) return time12
    let [, hours, minutes, period] = match
    let hour = parseInt(hours, 10)
    if (period.toUpperCase() === 'PM' && hour !== 12) hour += 12
    if (period.toUpperCase() === 'AM' && hour === 12) hour = 0
    return `${hour.toString().padStart(2, '0')}:${minutes}`
  }

  // Convert day-wise availability to API format (availability_schedule)
  const convertToApiFormat = (dayWiseAvailability) => {
    return DAYS_OF_WEEK.map((day) => {
      const slots = dayWiseAvailability[day] || []
      const validSlots = slots
        .filter((slot) => slot.start && slot.end)
        .map((slot) => ({
          start: convertTo12HourFormatApi(slot.start),
          end: convertTo12HourFormatApi(slot.end),
        }))
      return { day, slots: validSlots }
    })
  }

  // Convert API format (availability_schedule) to day-wise availability
  const convertFromApiFormat = (availabilitySchedule) => {
    const availability = {
      Monday: [],
      Tuesday: [],
      Wednesday: [],
      Thursday: [],
      Friday: [],
      Saturday: [],
      Sunday: [],
    }

    // Parse if string
    let schedule = availabilitySchedule
    if (typeof availabilitySchedule === 'string') {
      try {
        schedule = JSON.parse(availabilitySchedule)
      } catch {
        schedule = []
      }
    }

    if (!Array.isArray(schedule)) {
      return availability
    }

    schedule.forEach((dayEntry) => {
      if (dayEntry.day && availability.hasOwnProperty(dayEntry.day)) {
        const slots = Array.isArray(dayEntry.slots) ? dayEntry.slots : []
        availability[dayEntry.day] = slots.map((slot) => ({
          start: convertTo24HourFormat(slot.start),
          end: convertTo24HourFormat(slot.end),
        }))
      }
    })

    return availability
  }

  // GET SINGLE FACULTY (for edit)
  const handleEdit = async (id) => {
    try {
      const res = await axios.get(`${API}/get_faculty/${id}`)
      let data = res.data.data || res.data
      if (Array.isArray(data)) data = data[0]

      const availability = convertFromApiFormat(data.availability_schedule)

      setForm({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        mobile: data.mobile || '',
        email: data.email || '',
        availability,
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

  // Handle time slot changes for a specific day
  const handleTimeSlotChange = (day, index, field, value) => {
    const newAvailability = { ...form.availability }
    newAvailability[day][index] = { ...newAvailability[day][index], [field]: value }
    setForm({ ...form, availability: newAvailability })
    if (formErrors.availability) {
      setFormErrors({ ...formErrors, availability: '' })
    }
  }

  // Add time slot for a specific day
  const addTimeSlot = (day) => {
    const newAvailability = { ...form.availability }
    newAvailability[day] = [...newAvailability[day], { start: '', end: '' }]
    setForm({ ...form, availability: newAvailability })
  }

  // Remove time slot for a specific day
  const removeTimeSlot = (day, index) => {
    const newAvailability = { ...form.availability }
    newAvailability[day] = newAvailability[day].filter((_, i) => i !== index)
    setForm({ ...form, availability: newAvailability })
  }

  // CREATE / UPDATE
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      const availability_schedule = convertToApiFormat(form.availability)

      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        mobile: form.mobile,
        email: form.email,
        availability_schedule,
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
      availability: {
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
        Saturday: [],
        Sunday: [],
      },
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
      availability: {
        Monday: [],
        Tuesday: [],
        Wednesday: [],
        Thursday: [],
        Friday: [],
        Saturday: [],
        Sunday: [],
      },
    })
    setEditId(null)
    setFormErrors({})
  }

  // Format availability_schedule for display
  const formatAvailability = (availabilitySchedule) => {
    let schedule = availabilitySchedule
    if (typeof availabilitySchedule === 'string') {
      try {
        schedule = JSON.parse(availabilitySchedule)
      } catch {
        schedule = []
      }
    }

    if (!Array.isArray(schedule)) {
      return []
    }

    // Return only days that have slots
    return schedule.filter((entry) => entry.slots && entry.slots.length > 0)
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

      {/* Table Card */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
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
                    Email
                    <ArrowUpDown className={`w-4 h-4 ${sortBy === 'email' ? 'text-primary-600' : 'text-slate-400'}`} />
                  </div>
                </th>
                <th
                  onClick={() => handleSort('mobile')}
                  className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Contact
                    <ArrowUpDown className={`w-4 h-4 ${sortBy === 'mobile' ? 'text-primary-600' : 'text-slate-400'}`} />
                  </div>
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Availability
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
                  const availability = formatAvailability(faculty.availability_schedule)
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
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Mail className="w-4 h-4 text-slate-400" />
                          {faculty.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                          <Phone className="w-4 h-4 text-slate-400" />
                          {faculty.mobile}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          {availability.length > 0 ? (
                            availability.map((dayEntry) => (
                              <div key={dayEntry.day} className="flex items-start gap-2">
                                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full min-w-[40px] text-center">
                                  {dayEntry.day.slice(0, 3)}
                                </span>
                                <div className="flex flex-wrap gap-1">
                                  {dayEntry.slots.map((slot, idx) => (
                                    <span
                                      key={idx}
                                      className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full"
                                    >
                                      {slot.start} - {slot.end}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))
                          ) : (
                            <span className="text-xs text-slate-400">No availability set</span>
                          )}
                        </div>
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
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-2xl mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
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

              {/* Day-wise Availability */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Availability Schedule <span className="text-red-500">*</span>
                </label>
                <div className="space-y-4 border border-slate-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day} className="bg-slate-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-slate-700">{day}</h4>
                        <button
                          type="button"
                          onClick={() => addTimeSlot(day)}
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                        >
                          + Add Slot
                        </button>
                      </div>
                      <div className="space-y-2">
                        {form.availability[day].length > 0 ? (
                          form.availability[day].map((slot, index) => (
                            <div key={index} className="space-y-1">
                              <div className="flex items-center gap-2">
                                <input
                                  type="time"
                                  value={slot.start}
                                  onChange={(e) =>
                                    handleTimeSlotChange(day, index, 'start', e.target.value)
                                  }
                                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 bg-white"
                                />
                                <span className="text-slate-400 text-sm">to</span>
                                <input
                                  type="time"
                                  value={slot.end}
                                  onChange={(e) =>
                                    handleTimeSlotChange(day, index, 'end', e.target.value)
                                  }
                                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 bg-white"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeTimeSlot(day, index)}
                                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                              {slot.start && slot.end && (
                                <div className="px-3 py-1 bg-slate-100 rounded text-xs text-slate-600">
                                  Preview: {convertTo12HourFormat(slot.start)} - {convertTo12HourFormat(slot.end)}
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <p className="text-xs text-slate-400 text-center py-2">
                            No slots added for this day
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {formErrors.availability && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.availability}</p>
                )}
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
