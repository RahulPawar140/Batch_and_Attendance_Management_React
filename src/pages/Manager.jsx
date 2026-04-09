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
  UserCog,
  ArrowUpDown,
  AlertTriangle,
  Phone,
  Mail,
  Building2,
  Clock,
  Calendar
} from 'lucide-react'

const API = 'http://localhost:9998/manager'
const BRANCH_API = 'http://localhost:9998/branch'

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function Manager() {
  const [managers, setManagers] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    branch_id: '',
    mobile: '',
    email: '',
    availability: {}, // { Monday: [{start: '09:00', end: '17:00'}], Tuesday: [...] }
    remarks: '',
  })
  const [editId, setEditId] = useState(null)
  const [formErrors, setFormErrors] = useState({})

  // Delete confirmation modal
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, manager: null })

  // Filter states
  const [pageSize, setPageSize] = useState(5)
  const [pageIndex, setPageIndex] = useState(1)
  const [sortBy, setSortBy] = useState('id')
  const [sortOrder, setSortOrder] = useState('ASC')
  const [searchText, setSearchText] = useState('')

  // Fetch branches for dropdown
  const fetchBranches = async () => {
    try {
      const res = await axios.get(`${BRANCH_API}/get_branch_list`)
      const data = res.data.data || res.data
      setBranches(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Fetch branches error:', err)
      setBranches([])
    }
  }

  // GET ALL MANAGERS
  const fetchManagers = async () => {
    setLoading(true)
    try {
      const res = await axios.get(`${API}/get_manager_list`, {
        params: {
          page_size: pageSize,
          page_index: pageIndex,
          sort_by: sortBy,
          sort_order: sortOrder,
          search_text: searchText,
        },
      })
      const data = res.data.data || res.data
      setManagers(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Fetch error:', err)
      setManagers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBranches()
  }, [])

  useEffect(() => {
    fetchManagers()
  }, [pageIndex, pageSize, sortBy, sortOrder])

  // Validate form
  const validateForm = () => {
    const errors = {}
    if (!form.first_name.trim()) errors.first_name = 'First name is required'
    if (!form.last_name.trim()) errors.last_name = 'Last name is required'
    if (!form.branch_id) errors.branch_id = 'Branch is required'
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
    
    // Check if at least one day has at least one valid time slot
    const hasValidAvailability = Object.values(form.availability).some(
      slots => slots && slots.length > 0 && slots.some(slot => slot.start && slot.end)
    )
    if (!hasValidAvailability) {
      errors.availability = 'Add at least one time slot for any day'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // GET SINGLE MANAGER (for edit)
  const handleEdit = async (id) => {
    try {
      const res = await axios.get(`${API}/get_manager/${id}`)
      let data = res.data.data || res.data
      if (Array.isArray(data)) data = data[0]

      // Parse availability if stored as string
      let availability = data.availability || {}
      if (typeof availability === 'string') {
        try {
          availability = JSON.parse(availability)
        } catch {
          availability = {}
        }
      }

      setForm({
        first_name: data.first_name || '',
        last_name: data.last_name || '',
        branch_id: data.branch_id || '',
        mobile: data.mobile || '',
        email: data.email || '',
        availability: availability,
        remarks: data.remarks || '',
      })
      setEditId(data.id || id)
      setFormErrors({})
      setIsModalOpen(true)
    } catch (err) {
      console.error('Edit fetch error:', err)
      alert('Failed to fetch manager details')
    }
  }

  // HANDLE INPUT
  const handleChange = (e) => {
    const { name, value } = e.target
    setForm({ ...form, [name]: value })
    // Clear error when user types
    if (formErrors[name]) {
      setFormErrors({ ...formErrors, [name]: '' })
    }
  }

  // Handle day-wise time slot changes
  const handleTimeSlotChange = (day, slotIndex, field, value) => {
    const daySlots = form.availability[day] || [{ start: '', end: '' }]
    const updatedSlots = [...daySlots]
    updatedSlots[slotIndex] = { ...updatedSlots[slotIndex], [field]: value }
    
    setForm({
      ...form,
      availability: {
        ...form.availability,
        [day]: updatedSlots
      }
    })
    
    if (formErrors.availability) {
      setFormErrors({ ...formErrors, availability: '' })
    }
  }

  // Add time slot for a specific day
  const addTimeSlot = (day) => {
    const daySlots = form.availability[day] || []
    setForm({
      ...form,
      availability: {
        ...form.availability,
        [day]: [...daySlots, { start: '', end: '' }]
      }
    })
  }

  // Remove time slot for a specific day
  const removeTimeSlot = (day, slotIndex) => {
    const daySlots = form.availability[day] || []
    if (daySlots.length > 1) {
      const updatedSlots = daySlots.filter((_, i) => i !== slotIndex)
      setForm({
        ...form,
        availability: {
          ...form.availability,
          [day]: updatedSlots
        }
      })
    } else {
      // Remove the day entirely if removing the last slot
      const newAvailability = { ...form.availability }
      delete newAvailability[day]
      setForm({
        ...form,
        availability: newAvailability
      })
    }
  }

  // CREATE / UPDATE
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) return

    try {
      // Clean up availability - remove empty slots
      const cleanedAvailability = {}
      Object.keys(form.availability).forEach(day => {
        const validSlots = form.availability[day].filter(slot => slot.start && slot.end)
        if (validSlots.length > 0) {
          cleanedAvailability[day] = validSlots
        }
      })

      const payload = {
        first_name: form.first_name,
        last_name: form.last_name,
        branch_id: Number(form.branch_id),
        mobile: form.mobile,
        email: form.email,
        availability: cleanedAvailability,
        remarks: form.remarks,
      }
      
      if (editId) {
        await axios.put(`${API}/update_manager`, { id: editId, ...payload })
      } else {
        await axios.post(`${API}/create_manager`, payload)
      }
      closeModal()
      fetchManagers()
    } catch (err) {
      console.error('Submit error:', err)
      alert('Failed to save manager')
    }
  }

  // DELETE - Open confirmation modal
  const openDeleteModal = (manager) => {
    setDeleteModal({ isOpen: true, manager })
  }

  const closeDeleteModal = () => {
    setDeleteModal({ isOpen: false, manager: null })
  }

  const confirmDelete = async () => {
    if (!deleteModal.manager) return
    try {
      await axios.delete(`${API}/delete_manager/${deleteModal.manager.id}`)
      closeDeleteModal()
      fetchManagers()
    } catch (err) {
      console.error('Delete error:', err)
      alert('Failed to delete manager')
    }
  }

  // SEARCH
  const handleSearch = () => {
    setPageIndex(1)
    fetchManagers()
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
      branch_id: '',
      mobile: '',
      email: '',
      availability: {},
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
      branch_id: '',
      mobile: '',
      email: '',
      availability: {},
      remarks: '',
    })
    setEditId(null)
    setFormErrors({})
  }

  // Get branch name by id
  const getBranchName = (branchId) => {
    const branch = branches.find((b) => b.id === branchId)
    return branch ? branch.name : '-'
  }

  // Format availability for display
  const formatAvailability = (availability) => {
    if (!availability) return { days: [], slots: {} }
    
    let availabilityObj = availability
    if (typeof availability === 'string') {
      try {
        availabilityObj = JSON.parse(availability)
      } catch {
        availabilityObj = {}
      }
    }
    
    const days = Object.keys(availabilityObj).filter(
      day => availabilityObj[day] && availabilityObj[day].length > 0
    )
    
    return { days, slots: availabilityObj }
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manager Management</h1>
          <p className="text-slate-500 mt-1">Manage your institute managers</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-sm"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">Add Manager</span>
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
              placeholder="Search managers..."
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
                    Manager
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
                <th
                  onClick={() => handleSort('branch_id')}
                  className="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    Branch
                    <ArrowUpDown className={`w-4 h-4 ${sortBy === 'branch_id' ? 'text-primary-600' : 'text-slate-400'}`} />
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
              ) : managers.length > 0 ? (
                managers.map((manager) => {
                  const availability = formatAvailability(manager.availability)
                  return (
                    <tr key={manager.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                            <UserCog className="w-5 h-5 text-amber-600" />
                          </div>
                          <div>
                            <span className="text-sm font-medium text-slate-800 block">
                              {manager.first_name} {manager.last_name}
                            </span>
                            <span className="text-xs text-slate-500">ID: {manager.id}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Mail className="w-4 h-4 text-slate-400" />
                            {manager.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <Phone className="w-4 h-4 text-slate-400" />
                            {manager.mobile}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <span className="text-sm text-slate-600">
                            {manager.branch_name || getBranchName(manager.branch_id)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2 max-w-md">
                          {availability.days.length > 0 ? (
                            availability.days.map((day) => (
                              <div key={day} className="flex items-start gap-2">
                                <Calendar className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                                <div className="flex-1">
                                  <span className="text-xs font-medium text-slate-700">{day}:</span>
                                  <div className="flex flex-wrap gap-1 mt-0.5">
                                    {availability.slots[day]?.map((slot, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs rounded-full"
                                      >
                                        <Clock className="w-3 h-3" />
                                        {slot.start} - {slot.end}
                                      </span>
                                    ))}
                                  </div>
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
                            onClick={() => handleEdit(manager.id)}
                            className="p-2 text-slate-600 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openDeleteModal(manager)}
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
                    No managers found. Add your first manager!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200 bg-slate-50">
          <p className="text-sm text-slate-600">
            Page {pageIndex} - Showing {managers.length} managers
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
              disabled={managers.length < pageSize}
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
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-3xl mx-4 overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-slate-800">
                {editId ? 'Edit Manager' : 'Add New Manager'}
              </h2>
              <button
                onClick={closeModal}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Basic Info */}
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
                  Branch <span className="text-red-500">*</span>
                </label>
                <select
                  name="branch_id"
                  value={form.branch_id}
                  onChange={handleChange}
                  className={`w-full px-4 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-1 ${
                    formErrors.branch_id
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                      : 'border-slate-200 focus:border-primary-500 focus:ring-primary-500'
                  }`}
                >
                  <option value="">Select a branch</option>
                  {branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
                {formErrors.branch_id && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.branch_id}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Mobile Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    name="mobile"
                    value={form.mobile}
                    onChange={handleChange}
                    placeholder="Enter 10-digit mobile"
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
              </div>

              {/* Day-wise Availability */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Day-wise Availability <span className="text-red-500">*</span>
                </label>
                <div className="space-y-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
                  {DAYS_OF_WEEK.map((day) => {
                    const daySlots = form.availability[day] || []
                    const hasSlots = daySlots.length > 0
                    
                    return (
                      <div key={day} className="bg-white p-3 rounded-lg border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-slate-700">{day}</span>
                          {!hasSlots && (
                            <button
                              type="button"
                              onClick={() => addTimeSlot(day)}
                              className="text-xs px-2 py-1 bg-primary-100 text-primary-600 hover:bg-primary-200 rounded transition-colors"
                            >
                              Add Slot
                            </button>
                          )}
                        </div>
                        
                        {hasSlots && (
                          <div className="space-y-2">
                            {daySlots.map((slot, slotIndex) => (
                              <div key={slotIndex} className="flex items-center gap-2">
                                <input
                                  type="time"
                                  value={slot.start}
                                  onChange={(e) => handleTimeSlotChange(day, slotIndex, 'start', e.target.value)}
                                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                />
                                <span className="text-slate-400">to</span>
                                <input
                                  type="time"
                                  value={slot.end}
                                  onChange={(e) => handleTimeSlotChange(day, slotIndex, 'end', e.target.value)}
                                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeTimeSlot(day, slotIndex)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                  title="Remove slot"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => addTimeSlot(day)}
                              className="text-xs px-2 py-1 text-primary-600 hover:bg-primary-50 rounded transition-colors"
                            >
                              + Add Another Slot
                            </button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
                {formErrors.availability && (
                  <p className="mt-1 text-xs text-red-500">{formErrors.availability}</p>
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
                  placeholder="Add any additional notes..."
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none"
                ></textarea>
              </div>

              {/* Form Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {editId ? 'Update Manager' : 'Add Manager'}
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
          <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-800 mb-1">Delete Manager</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Are you sure you want to delete{' '}
                  <span className="font-medium">
                    {deleteModal.manager?.first_name} {deleteModal.manager?.last_name}
                  </span>
                  ? This action cannot be undone.
                </p>
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={closeDeleteModal}
                    className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Manager
