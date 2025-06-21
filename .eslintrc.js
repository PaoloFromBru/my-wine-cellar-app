module.exports = {
  extends: ['react-app', 'react-app/jest'],
  globals: {
    __app_id: 'readonly',
    __initial_auth_token: 'readonly',
  },
  // You might need to add other rules here if you encounter more specific ESLint issues.
};
