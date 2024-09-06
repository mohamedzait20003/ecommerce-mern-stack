import firebase from "firebase/compat/app";

const firebaseConfig = {
  apiKey: "AIzaSyD51YwqWrQ4wMc-HtrFi0y6YI7exOTlt8I",
  authDomain: "ecommerce-c08f7.firebaseapp.com",
  projectId: "ecommerce-c08f7",
  storageBucket: "ecommerce-c08f7.appspot.com",
  messagingSenderId: "210162521525",
  appId: "1:210162521525:web:703829f1612e99d0bb35fc",
  measurementId: "G-TXWEQ8G90F"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

export default firebase;