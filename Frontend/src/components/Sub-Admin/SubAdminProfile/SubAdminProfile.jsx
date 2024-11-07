import React, { useState } from 'react'
import { Formik, Form, Field } from 'formik'
import { Home, CreditCard, ShoppingBag, Package, Store, Bell, Phone, User, Search, Settings, Edit2, MapPin, Upload, Power, LogOut } from 'lucide-react'
import { useDispatch } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import SubAdminAside from '../SubAdminAside/SubAdminAside'
import { logoutUser } from '../../../features/auth/authSlice';

function SubAdminProfile() {
  const [isEditing, setIsEditing] = useState(false)
  const [isOpen, setIsOpen] = useState(true)
  const [images, setImages] = useState([])
  const dispatch = useDispatch()
  const navigate = useNavigate()

  const initialValues = {
    ownerName: 'John Doe',
    shopName: 'City Ration Store',
    shopDescription: 'A well-stocked ration shop serving the community since 2010.',
    location: '123 Main Street, City Center'
  }

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files)
    if (files.length + images.length > 3) {
      alert('Maximum 3 images allowed')
      return
    }
    setImages(prev => [...prev, ...files.map(file => URL.createObjectURL(file))])
  }

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap()
      navigate('/sub-admin-login')
    } catch (error) {
      console.error("Logout failed", error)
    }
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar - keeping the same as your dashboard */}
      <SubAdminAside handleLogout={handleLogout}/>

      {/* Main content */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold">Profile</h2>
          <div className="flex items-center">
            <div className="relative mr-4">
              <input
                type="text"
                placeholder="Search here..."
                className="pl-10 pr-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
              <Search className="absolute left-3 top-2.5 text-gray-400" />
            </div>
            <Settings className="text-gray-500 mr-4" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <img
                src="/placeholder.svg?height=128&width=128"
                alt="Profile"
                className="w-32 h-32 rounded-full border-4 border-teal-500"
              />
              <div className="ml-6">
                <h3 className="text-2xl font-bold">{initialValues.ownerName}</h3>
                <p className="text-gray-500">Shop Owner</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className={`px-4 py-2 rounded-full flex items-center ${
                isOpen ? 'bg-green-500' : 'bg-red-500'
              } text-white`}
            >
              <Power className="mr-2" />
              {isOpen ? 'Open' : 'Closed'}
            </button>
          </div>

          <Formik
            initialValues={initialValues}
            onSubmit={(values) => {
              console.log(values)
              setIsEditing(false)
            }}
          >
            {({ values }) => (
              <Form>
                <div className="space-y-6">
                  <div>
                    <label className="block text-gray-700 font-bold mb-2">Shop Name</label>
                    {isEditing ? (
                      <Field
                        name="shopName"
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-teal-500"
                      />
                    ) : (
                      <div className="flex items-center justify-between">
                        <p className="text-gray-600">{values.shopName}</p>
                        <button
                          type="button"
                          onClick={() => setIsEditing(true)}
                          className="text-teal-500 hover:text-teal-600"
                        >
                          <Edit2 size={18} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-2">Shop Description</label>
                    {isEditing ? (
                      <Field
                        as="textarea"
                        name="shopDescription"
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-teal-500"
                        rows="4"
                      />
                    ) : (
                      <p className="text-gray-600">{values.shopDescription}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-2">Location</label>
                    <div className="flex items-center">
                      <MapPin className="text-gray-400 mr-2" />
                      {isEditing ? (
                        <Field
                          name="location"
                          className="flex-1 p-2 border rounded focus:ring-2 focus:ring-teal-500"
                        />
                      ) : (
                        <p className="text-gray-600">{values.location}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 font-bold mb-2">Shop Images</label>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      {images.map((image, index) => (
                        <div key={index} className="relative">
                          <img
                            src={image}
                            alt={`Shop ${index + 1}`}
                            className="w-full h-48 object-cover rounded"
                          />
                          <button
                            type="button"
                            onClick={() => setImages(images.filter((_, i) => i !== index))}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {images.length < 3 && (
                        <label className="border-2 border-dashed border-gray-300 rounded flex items-center justify-center h-48 cursor-pointer hover:border-teal-500">
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                          />
                          <div className="text-center">
                            <Upload className="mx-auto text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">Upload Image</p>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>

                  {isEditing && (
                    <div className="flex justify-end space-x-4">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-2 bg-teal-500 text-white rounded hover:bg-teal-600"
                      >
                        Save Changes
                      </button>
                    </div>
                  )}
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </main>
    </div>
  )
}

export default SubAdminProfile