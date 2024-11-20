import React, { useState, useEffect } from 'react'
import { Formik, Form, Field, FieldArray, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { ChevronRight, ChevronLeft, Plus, Trash2 } from 'lucide-react'
import NavBar from '../NavBar/NavBar'
import { logoutUser } from '../../../features/auth/authSlice'
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify'
import { validationRationCardSchema } from '../../../utils/validationSchemas'
import api from '../../../services/api'


const cardTypes = ['YELLOW', 'PINK', 'BLUE', 'WHITE']



const initialValues = {
  head_details: {
    name: '',
    age: '',
    monthly_income: '',
    aadhaar: '',
    mobile: '',
  },
  family_members: [],
  address: '',
  registered_shop:'',
  supporting_document: null,
}

export default function RationCardRegistrationForm() {
  const [step, setStep] = useState(0)
  const [progress, setProgress] = useState(25)
  const [shops, setShops] = useState([])
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const response = await api.get('/ration-shop/shops/') // Adjust the endpoint as needed
        setShops(response.data)
      } catch (error) {
        toast.error('Failed to fetch ration shops')
        console.error('Error fetching shops:', error)
      }
    }
    fetchShops()
  }, [])


  const rationCardService = {
    async registerRationCard(formData) {
      // Create a new FormData instance for multipart/form-data
      const data = new FormData();
      
      // Add head details
      data.append('head_name', formData.head_details.name);
      data.append('head_age', formData.head_details.age);
      data.append('head_monthly_income', formData.head_details.monthly_income);
      data.append('head_aadhaar', formData.head_details.aadhaar);
      
      // Add address and registered shop
      data.append('household_address', formData.address);
      data.append('registered_shop', formData.registered_shop)
      console.log('registered_shop', formData.registered_shop);
      

      // Add supporting document
      if (formData.supporting_document) {
        data.append('supporting_document', formData.supporting_document);
      }

       // Create family members array matching the serializer format
        const formattedFamilyMembers = formData.family_members.map(member => ({
          name: member.name,
          age: member.age,
          relation: member.relation,
          aadhaar_number: member.aadhaar 
        }));
      
      // Add family members as JSON string
      data.append('family_members', JSON.stringify(formattedFamilyMembers));

      try {
        const response = await api.post('/ration-card/create/', data, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        return response.data;
      } catch (error) {
        throw error.response?.data || error.message;
      }
    },
  };

  const handleSubmit = async (values, { setSubmitting, resetForm }) => {
    try {
      // Show loading toast
      toast.loading('Submitting your application...');
      
      // Submit the form data
      const response = await rationCardService.registerRationCard(values);
      
      // Clear loading toast and show success
      toast.dismiss();
      toast.success('Ration card application submitted successfully!');
      
      // Reset form
      resetForm();
      
      // Navigate to success page or dashboard
      navigate('/home');
    } catch (error) {
      // Clear loading toast and show error
      toast.dismiss();
      toast.error(error?.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = async () => {
    try {
        await dispatch(logoutUser()).unwrap();
        navigate('/login');
        toast.success('Logged out successfully!')
    } catch (error) {
      
        toast.error("Logout failed", error);
    }
};

  const handleNext = () => {
    setStep(step + 1)
    setProgress(progress + 25)
  }

  const handlePrevious = () => {
    setStep(step - 1)
    setProgress(progress - 25)
  }

  const steps = [
    'Applicant Details',
    'Family Members',
    'Address & Documents',
    'Review & Submit',
  ]

  return (
    <div>
      <NavBar handleLogout={handleLogout} />

    <div className="min-h-screen bg-orange-50 pt-24 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
          Ration Card Registration
        </h2>
        <div className="mb-8">
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              {steps.map((stepName, index) => (
                <div key={stepName} className="text-xs font-semibold inline-block text-orange-600">
                  {stepName}
                </div>
              ))}
            </div>
            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-orange-200">
              <div
                style={{ width: `${progress}%` }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-orange-500 transition-all duration-500"
              ></div>
            </div>
          </div>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={validationRationCardSchema}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, isValid, setFieldValue }) => (
            <Form className="bg-white shadow-md rounded-lg px-8 pt-6 pb-8 mb-4 border border-gray-200">
              {step === 0 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold mb-4">Applicant Details</h3>
                  <div>
                    <label htmlFor="head_details.name" className="block text-sm font-medium text-gray-700">
                      Full Name
                    </label>
                    <Field
                      type="text"
                      name="head_details.name"
                      className="mt-1 block w-full rounded-md border-2 border-gray-300 bg-gray-50 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                    />
                    <ErrorMessage name="head_details.name" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                  <div>
                    <label htmlFor="head_details.age" className="block text-sm font-medium text-gray-700">
                      Age
                    </label>
                    <Field
                      type="number"
                      name="head_details.age"
                      className="mt-1 block w-full rounded-md border-2 border-gray-300 bg-gray-50 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                    />
                    <ErrorMessage name="head_details.age" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                  <div>
                    <label htmlFor="head_details.monthly_income" className="block text-sm font-medium text-gray-700">
                      Monthly Income
                    </label>
                    <Field
                      type="text"
                      name="head_details.monthly_income"
                      className="mt-1 block w-full rounded-md border-2 border-gray-300 bg-gray-50 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                    />
                    <ErrorMessage name="head_details.monthly_income" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                  <div>
                    <label htmlFor="head_details.aadhaar" className="block text-sm font-medium text-gray-700">
                      Aadhaar Number
                    </label>
                    <Field
                      type="text"
                      name="head_details.aadhaar"
                      className="mt-1 block w-full rounded-md border-2 border-gray-300 bg-gray-50 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                    />
                    <ErrorMessage name="head_details.aadhaar" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                  <div>
                    <label htmlFor="head_details.mobile" className="block text-sm font-medium text-gray-700">
                      Mobile Number
                    </label>
                    <Field
                      type="text"
                      name="head_details.mobile"
                      className="mt-1 block w-full rounded-md border-2 border-gray-300 bg-gray-50 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                    />
                    <ErrorMessage name="head_details.mobile" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold mb-4">Family Members</h3>
                  <FieldArray name="family_members">
                    {({ push, remove }) => (
                      <div>
                        {values.family_members.map((_, index) => (
                          <div key={index} className="mb-4 p-4 border rounded-md">
                            <div className="mb-2">
                              <label htmlFor={`family_members.${index}.name`} className="block text-sm font-medium text-gray-700">
                                Name
                              </label>
                              <Field
                                type="text"
                                name={`family_members.${index}.name`}
                                className="mt-1 block w-full rounded-md border-2 border-gray-300 bg-gray-50 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                              />
                              <ErrorMessage name={`family_members.${index}.name`} component="div" className="text-red-500 text-sm mt-1" />
                            </div>
                            <div className="mb-2">
                              <label htmlFor={`family_members.${index}.age`} className="block text-sm font-medium text-gray-700">
                                Age
                              </label>
                              <Field
                                type="number"
                                name={`family_members.${index}.age`}
                                className="mt-1 block w-full rounded-md border-2 border-gray-300 bg-gray-50 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                              />
                              <ErrorMessage name={`family_members.${index}.age`} component="div" className="text-red-500 text-sm mt-1" />
                            </div>
                            <div className="mb-2">
                              <label htmlFor={`family_members.${index}.relation`} className="block text-sm font-medium text-gray-700">
                                Relation
                              </label>
                              <Field
                                as="select"
                                name={`family_members.${index}.relation`}
                                className="mt-1 block w-full rounded-md border-2 border-gray-300 bg-gray-50 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                              >
                                <option value="">Select Relation</option>
                                <option value="SPOUSE">Spouse</option>
                                <option value="CHILD">Child</option>
                                <option value="PARENT">Parent</option>
                                <option value="SIBLING">Sibling</option>
                                <option value="OTHER">Other</option>
                              </Field>
                              <ErrorMessage name={`family_members.${index}.relation`} component="div" className="text-red-500 text-sm mt-1" />
                            </div>
                            <div className="mb-2">
                              <label htmlFor={`family_members.${index}.aadhaar`} className="block text-sm font-medium text-gray-700">
                                Aadhaar Number
                              </label>
                              <Field
                                type="text"
                                name={`family_members.${index}.aadhaar`}
                                className="mt-1 block w-full rounded-md border-2 border-gray-300 bg-gray-50 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                              />
                              <ErrorMessage name={`family_members.${index}.aadhaar`} component="div" className="text-red-500 text-sm mt-1" />
                            </div>
                            <button
                              type="button"
                              onClick={() => remove(index)}
                              className="mt-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => push({ name: '', age: '', relation: '', aadhaar: '' })}
                          className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                        >
                          <Plus className="h-5 w-5 mr-2" />
                          Add Family Member
                        </button>
                      </div>
                    )}
                  </FieldArray>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold mb-4">Address & Documents</h3>
                  <div>
                    <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                      Full Address
                    </label>
                    <Field
                      as="textarea"
                      name="address"
                      rows={4}
                      className="mt-1 block w-full rounded-md border-2 border-gray-300 bg-gray-50 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                    />
                    <ErrorMessage name="address" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                  <div>
                    <label htmlFor="registered_shop" className="block text-sm font-medium text-gray-700">
                      Select Ration Shop
                    </label>
                    <Field
                      as="select"
                      name="registered_shop"
                      className="mt-1 block w-full rounded-md border-2 border-gray-300 bg-gray-50 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                    >
                      <option value="">Select ration shop to register your card</option>
                      {shops.map((shop) => (
                        <option key={shop.shop_id} value={shop.shop_id}>
                          {shop.name} - {shop.location}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage name="registered_shop" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                  <div>
                    <label htmlFor="supporting_document" className="block text-sm font-medium text-gray-700">
                      Supporting Document
                    </label>
                    <input
                      type="file"
                      onChange={(event) => {
                        setFieldValue("supporting_document", event.currentTarget.files[0]);
                      }}
                      className="mt-1 block w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
                    />
                    <ErrorMessage name="supporting_document" component="div" className="text-red-500 text-sm mt-1" />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold mb-4">Review & Submit</h3>
                  <div className="bg-gray-100 p-4 rounded-md">
                    <h4 className="font-semibold mb-2">Applicant Details</h4>
                    <p>Name: {values.head_details.name}</p>
                    <p>Age: {values.head_details.age}</p>
                    <p>Monthly Income: {values.head_details.monthly_income}</p>
                    <p>Aadhaar: {values.head_details.aadhaar}</p>
                    <p>Mobile: {values.head_details.mobile}</p>
                  </div>
                  <div className="bg-gray-100 p-4 rounded-md">
                    <h4 className="font-semibold mb-2">Family Members</h4>
                    {values.family_members.map((member, index) => (
                      <div key={index} className="mb-2">
                        <p>Name: {member.name}</p>
                        <p>Age: {member.age}</p>
                        <p>Relation: {member.relation}</p>
                        <p>Aadhaar: {member.aadhaar}</p>
                      </div>
                    ))}
                  </div>
                  <div className="bg-gray-100 p-4 rounded-md">
                    <h4 className="font-semibold mb-2">Address & Documents</h4>
                    <p>Address: {values.address}</p>
                    <p>Selected Ration Shop: {shops.find(shop => shop.shop_id === parseInt(values.registered_shop))?.name || 'Not selected'}
                    </p>
                    <p>Supporting Document: {values.supporting_document ? values.supporting_document.name : 'Not uploaded'}</p>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="confirm"
                      className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <label htmlFor="confirm" className="ml-2 block text-sm text-gray-900">
                      I confirm that all the information provided is correct and complete.
                    </label>
                  </div>
                </div>
              )}

              <div className="mt-8 flex justify-between">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={handlePrevious}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-orange-700 bg-orange-100 hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    <ChevronLeft className="h-5 w-5 mr-2" />
                    Previous
                  </button>
                )}
                {step < 3 && (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    Next
                    <ChevronRight className="h-5 w-5 ml-2" />
                  </button>
                )}
                {step === 3 && (
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                  >
                    Submit
                  </button>
                )}
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
    </div>
  )
}