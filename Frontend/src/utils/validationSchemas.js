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