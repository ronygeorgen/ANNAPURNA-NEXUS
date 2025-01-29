import * as Yup from 'yup';

export const SignupSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Required'),
  password: Yup.string().min(8, 'Too Short!').required('Required'),
  repeatPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Required'),
});
export const LoginSchema = Yup.object().shape({
  email: Yup.string().email('Invalid email').required('Required'),
  password: Yup.string().required('Required'),
});

export const RationShopSchema = Yup.object().shape({
  shopName: Yup.string()
    .min(3, 'Shop name must be at least 3 characters')
    .max(50, 'Shop name must not exceed 50 characters')
    .matches(
      /^[a-zA-Z0-9\s']+$/,
      'Shop name can only contain letters, numbers, and spaces'
    )
    .required('Shop name is required'),
  ownerId: Yup.string().required('Owner selection is required'),
  mobileNumber: Yup.string()
    .matches(/^[0-9]{10}$/, 'Mobile number must be 10 digits')
    .required('Mobile number is required'),
  location: Yup.string().required('Location is required'),
});

export const ProfileSchema = Yup.object().shape({
  shopName: Yup.string().required('Shop name is required'),
  shopDescription: Yup.string().required('Shop description is required'),
  location: Yup.string().required('Location is required'),
});


export const validationRationCardSchema = Yup.object().shape({
  head_details: Yup.object().shape({
    name: Yup.string()
      .required('Name is required')
      .min(2, 'Name must be at least 2 characters')
      .max(255, 'Name must not exceed 255 characters'),
    age: Yup.number()
      .required('Age is required')
      .min(18, 'Head of family must be at least 18 years old')
      .max(150, 'Invalid age'),
    monthly_income: Yup.number()
      .required('Monthly income is required')
      .min(0, 'Monthly income cannot be negative')
      .max(1000000,'Do not exceed 10 lakhs'),
    aadhaar: Yup.string()
      .required('Aadhaar number is required')
      .matches(/^\d{12}$/, 'Aadhaar number must be exactly 12 digits'),
    mobile: Yup.string()
      .required('Mobile number is required')
      .matches(/^\d{10}$/, 'Mobile number must be exactly 10 digits'),
  }),
  
  family_members: Yup.array().of(
    Yup.object().shape({
      name: Yup.string()
        .required('Name is required')
        .min(2, 'Name must be at least 2 characters')
        .max(255, 'Name must not exceed 255 characters'),
      age: Yup.number()
        .required('Age is required')
        .min(0, 'Age cannot be negative')
        .max(150, 'Invalid age'),
      relation: Yup.string()
        .required('Relation is required')
        .oneOf(['SPOUSE', 'CHILD', 'PARENT', 'SIBLING', 'OTHER'], 'Invalid relation type'),
      aadhaar: Yup.string()
        .required('Aadhaar number is required')
        .matches(/^\d{12}$/, 'Aadhaar number must be exactly 12 digits'),
      image: Yup.mixed()
        .required('Member image is required')
        .test(
          'fileType', 
          'Only JPEG images are allowed', 
          (value) => {
            if (!value) return false;
            return ['image/jpeg', 'image/jpg'].includes(value.type);
          }
        )
        .test(
          'fileSize', 
          'Image must be less than 1MB', 
          (value) => {
            if (!value) return false;
            return value.size <= 1 * 1024 * 1024;
          }
        )
    })
  ),

  address: Yup.string()
    .required('Address is required')
    .min(10, 'Please provide a complete address'),
    
    registered_shop: Yup.string()
    .required('Please select a ration shop'),
    
  supporting_document: Yup.mixed()
    .required('Supporting document is required'),
});