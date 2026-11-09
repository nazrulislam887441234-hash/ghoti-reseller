import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    getFirestore, 
    doc, 
    getDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDCIRWmozT0XcEXuXtQ6RDiDo6vtT1T9mU",
  authDomain: "paikarisell-ghotimarket.firebaseapp.com",
  projectId: "paikarisell-ghotimarket",
  storageBucket: "paikarisell-ghotimarket.firebasestorage.app",
  messagingSenderId: "464086432830",
  appId: "1:464086432830:web:a10fdd9884954e380e656f",
  measurementId: "G-E3HR2F9TC5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const signupForm = document.getElementById('signupForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const submitBtn = document.getElementById('submitBtn');
const btnText = submitBtn.querySelector('.btn-text');
const spinner = submitBtn.querySelector('.spinner');
const togglePassword = document.getElementById('togglePassword');
const eyeIcon = document.getElementById('eyeIcon');
const toastContainer = document.getElementById('toastContainer');

let isSubmitting = false;

// Password Show/Hide Toggle
togglePassword.addEventListener('click', () => {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    if (type === 'text') {
        eyeIcon.innerHTML = `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line>`;
    } else {
        eyeIcon.innerHTML = `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>`;
    }
});

// Custom Toast Notification Function
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `custom-toast ${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Firebase Error Message Translator (Bangla)
function getBanglaErrorMessage(errorCode) {
    switch (errorCode) {
        case 'auth/invalid-email':
            return 'ইমেইল ঠিকানাটি সঠিক নয়।';
        case 'auth/user-disabled':
            return 'এই একাউন্টটি নিষ্ক্রিয় করা হয়েছে।';
        case 'auth/user-not-found':
            return 'এই ইমেইলে কোনো একাউন্ট পাওয়া যায়নি। নতুন একাউন্ট তৈরি করা হচ্ছে...';
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            return 'ভুল পাসওয়ার্ড দেওয়া হয়েছে। দয়া করে সঠিক পাসওয়ার্ড দিন।';
        case 'auth/email-already-in-use':
            return 'এই ইমেইলটি ইতিমধ্যে ব্যবহৃত হয়েছে। দয়া করে লগইন করুন।';
        case 'auth/weak-password':
            return 'পাসওয়ার্ড অত্যন্ত দুর্বল। কমপক্ষে ৬ অক্ষরের পাসওয়ার্ড দিন।';
        case 'auth/too-many-requests':
            return 'অতিরিক্ত চেষ্টার কারণে সাময়িকভাবে ব্লক করা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।';
        default:
            return 'একটি সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।';
    }
}

// Form Submission Event
signupForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    emailError.textContent = '';
    passwordError.textContent = '';

    const email = emailInput.value.trim();
    const password = passwordInput.value;

    let isValid = true;
    if (!email) {
        emailError.textContent = 'ইমেইল ঠিকানা আবশ্যক।';
        isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        emailError.textContent = 'সঠিক ইমেইল ঠিকানা দিন।';
        isValid = false;
    }

    if (!password) {
        passwordError.textContent = 'পাসওয়ার্ড আবশ্যক।';
        isValid = false;
    } else if (password.length < 6) {
        passwordError.textContent = 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।';
        isValid = false;
    }

    if (!isValid) return;

    isSubmitting = true;
    submitBtn.disabled = true;
    btnText.style.display = 'none';
    spinner.style.display = 'block';

    try {
        // Step 1: Try signing in first
        let userCredential;
        try {
            userCredential = await signInWithEmailAndPassword(auth, email, password);
        } catch (signInError) {
            if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential') {
                // If user doesn't exist, try creating account
                try {
                    userCredential = await createUserWithEmailAndPassword(auth, email, password);
                } catch (createError) {
                    throw createError;
                }
            } else {
                throw signInError;
            }
        }

        const user = userCredential.user;
        const uid = user.uid;

        // Step 2: Check Firestore profile
        const docRef = doc(db, "reseller", uid);
        const docSnap = await getDoc(docRef);

        showToast('সফলভাবে যাচাই করা হয়েছে!', 'success');

        setTimeout(() => {
            if (docSnap.exists()) {
                window.location.href = '/dashboard';
            } else {
                window.location.href = '/signup1';
            }
        }, 1000);

    } catch (error) {
        console.error("Auth Error:", error);
        const banglaMsg = getBanglaErrorMessage(error.code);
        showToast(banglaMsg, 'error');
        if (error.code.includes('email')) {
            emailError.textContent = banglaMsg;
        } else {
            passwordError.textContent = banglaMsg;
        }
        isSubmitting = false;
        submitBtn.disabled = false;
        btnText.style.display = 'inline';
        spinner.style.display = 'none';
    }
});
