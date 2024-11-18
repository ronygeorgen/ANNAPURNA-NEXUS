import React, { useState } from 'react'
import { Formik, Form, Field, FieldArray, ErrorMessage } from 'formik'
import * as Yup from 'yup'
import { ChevronRight, ChevronLeft, Plus, Trash2 } from 'lucide-react'
import NavBar from '../NavBar/NavBar'
import { logoutUser } from '../../../features/auth/authSlice'
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify'



const cardTypes = ['Yellow', 'Pink', 'Blue', 'White']

const validationSchema = Yup.object().shape({
  head_details: Yup.object().shape({
    name: Yup.string().min(2, 'Too Short!').max(255, 'Too Long!').required('Required'),
    age: Yup.number().min(18, 'Must be at least 18').max(150, 'Must be less than 150').required('Required'),
    monthly_income: Yup.number().positive('Must be positive').required('Required'),
    aadhaar: Yup.string().matches(/^\d{12}$/, 'Must be exactly 12 digits').required('Required'),
    mobile: Yup.string().matches(/^\d{10}$/, 'Must be exactly 10 digits').required('Required'),
  }),
  family_members: Yup.array().of(
    Yup.object().shape({
      name: Yup.string().min(2, 'Too Short!').max(255, 'Too Long!').required('Required'),
      age: Yup.number().positive('Must be positive').required('Required'),
      relation: Yup.string().required('Required'),
      aadhaar: Yup.string().matches(/^\d{12}$/, 'Must be exactly 12 digits').required('Required'),
    })
  ),
  address: Yup.string().required('Required'),
  card_type: Yup.string().oneOf(cardTypes, 'Invalid card type').required('Required'),
  supporting_document: Yup.mixed().required('Required'),
})

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
  card_type: '',
  supporting_document: null,
}

export default function RationCardRegistrationForm() {
  const [step, setStep] = useState(0)
  const [progress, setProgress] = useState(25)
  const dispatch = useDispatch();
  const navigate = useNavigate();

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
          validationSchema={validationSchema}
          onSubmit={(values, { setSubmitting }) => {
            setTimeout(() => {
              alert(JSON.stringify(values, null, 2))
              setSubmitting(false)
            }, 400)
          }}
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
                      type="number"
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
                    <label htmlFor="card_type" className="block text-sm font-medium text-gray-700">
                      Ration Card Type
                    </label>
                    <Field
                      as="select"
                      name="card_type"
                      className="mt-1 block w-full rounded-md border-2 border-gray-300 bg-gray-50 shadow-sm focus:border-orange-300 focus:ring focus:ring-orange-200 focus:ring-opacity-50"
                    >
                      <option value="">Select Card Type</option>
                      {cardTypes.map((type) => (
                        <option key={type} value={type}>
                          {type}
                        </option>
                      ))}
                    </Field>
                    <ErrorMessage name="card_type" component="div" className="text-red-500 text-sm mt-1" />
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
                    <p>Card Type: {values.card_type}</p>
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